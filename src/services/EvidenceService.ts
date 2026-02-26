/**
 * EVIDENCE ENGINE SERVICE
 * 
 * Queries, ranks, and aggregates structured evidence from Academy
 * for a given pathology × intervention pair.
 * Uses academy_evidence_aggregates as a cache layer.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  EvidenceAggregate,
  EvidenceMapping,
  EvidencePaperLite,
  EvidenceResult,
  RecommendationStrength,
  ConfidenceLevel,
  DirectionSummary,
} from '@/types/evidence-aggregate';

// ─── Evidence Level Normalization ───────────────────────────

const EVIDENCE_LEVEL_RANK: Record<string, number> = {
  'ia': 1, 'ib': 2, 'iia': 3, 'iib': 4, 'iii': 5, 'iv': 6,
  'i-a': 1, 'i-b': 2, 'ii-a': 3, 'ii-b': 4,
  '1a': 1, '1b': 2, '2a': 3, '2b': 4, '3': 5, '4': 6,
  'i': 1, 'ii': 3, 'systematic_review': 1, 'rct': 2,
  'cohort': 3, 'case_control': 4, 'case_series': 5, 'expert_opinion': 6,
};

export function normalizeEvidenceLevel(level: string | null): number {
  if (!level) return 99;
  const key = level.toLowerCase().trim().replace(/\s+/g, '_');
  return EVIDENCE_LEVEL_RANK[key] ?? 99;
}

const BIAS_RANK: Record<string, number> = {
  'baixo': 1, 'low': 1,
  'moderado': 2, 'moderate': 2,
  'alto': 3, 'high': 3,
};

function normalizeBiasRisk(risk: string | null): number {
  if (!risk) return 99;
  return BIAS_RANK[risk.toLowerCase().trim()] ?? 99;
}

// ─── Stale Check ────────────────────────────────────────────

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

function isStale(updatedAt: string): boolean {
  return Date.now() - new Date(updatedAt).getTime() > STALE_THRESHOLD_MS;
}

// ─── Paper Direction Extraction ─────────────────────────────

function extractPaperDirection(curationData: Record<string, unknown> | null): DirectionSummary {
  if (!curationData) return 'unknown';
  
  const outcomes = curationData.outcomes as Array<{ direction?: string }> | undefined;
  if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) return 'unknown';
  
  let favorable = 0, neutral = 0, harmful = 0, unknown = 0;
  for (const o of outcomes) {
    const dir = (o.direction || '').toLowerCase();
    if (dir === 'improves' || dir === 'favorable' || dir === 'positive') favorable++;
    else if (dir === 'no_difference' || dir === 'neutral' || dir === 'none') neutral++;
    else if (dir === 'worse' || dir === 'harmful' || dir === 'negative') harmful++;
    else unknown++;
  }
  
  const considered = favorable + neutral + harmful;
  if (considered === 0) return 'unknown';
  
  const max = Math.max(favorable, neutral, harmful);
  if (favorable === max && favorable > neutral && favorable > harmful) return 'favorable';
  if (harmful === max && harmful > favorable && harmful > neutral) return 'harmful';
  if (neutral === max && neutral > favorable && neutral > harmful) return 'neutral';
  return 'mixed';
}

// ─── Core Service Functions ─────────────────────────────────

/**
 * Get evidence for a pathology × intervention pair.
 * Reads cache first; refreshes if stale or missing.
 */
export async function getEvidenceForIntervention(
  pathologyKey: string,
  interventionKey: string,
): Promise<EvidenceResult> {
  // 1. Try cache
  const { data: cached } = await supabase
    .from('academy_evidence_aggregates')
    .select('*')
    .eq('pathology_key', pathologyKey)
    .eq('intervention_key', interventionKey)
    .maybeSingle();

  if (cached && !isStale(cached.updated_at)) {
    const papers = await listEvidencePapers(pathologyKey, interventionKey);
    return {
      aggregate: mapAggregate(cached),
      papers,
      isStale: false,
      fromCache: true,
    };
  }

  // 2. Refresh
  const aggregate = await refreshAggregate(pathologyKey, interventionKey);
  const papers = await listEvidencePapers(pathologyKey, interventionKey);

  return {
    aggregate,
    papers,
    isStale: false,
    fromCache: false,
  };
}

/**
 * Refresh the aggregate cache for a pathology × intervention pair.
 */
export async function refreshAggregate(
  pathologyKey: string,
  interventionKey: string,
): Promise<EvidenceAggregate | null> {
  // Get mapping
  const { data: mapping } = await supabase
    .from('academy_evidence_mappings')
    .select('*')
    .eq('pathology_key', pathologyKey)
    .eq('intervention_key', interventionKey)
    .maybeSingle();

  if (!mapping) return null;

  // Get relevant papers
  const papers = await fetchRelevantPapers(mapping as EvidenceMapping);
  
  if (papers.length === 0) {
    const emptyAggregate = buildEmptyAggregate(pathologyKey, interventionKey);
    await upsertAggregate(emptyAggregate);
    return emptyAggregate;
  }

  // Calculate aggregate
  const aggregate = calculateAggregate(pathologyKey, interventionKey, papers);
  await upsertAggregate(aggregate);
  return aggregate;
}

/**
 * List ranked papers for a pathology × intervention.
 */
export async function listEvidencePapers(
  pathologyKey: string,
  interventionKey: string,
): Promise<EvidencePaperLite[]> {
  const { data: mapping } = await supabase
    .from('academy_evidence_mappings')
    .select('*')
    .eq('pathology_key', pathologyKey)
    .eq('intervention_key', interventionKey)
    .maybeSingle();

  if (!mapping) return [];

  return fetchRelevantPapers(mapping as EvidenceMapping);
}

// ─── Internal: Fetch Relevant Papers ────────────────────────

async function fetchRelevantPapers(mapping: EvidenceMapping): Promise<EvidencePaperLite[]> {
  // Get papers with curation data
  const { data: papers, error } = await supabase
    .from('academy_papers')
    .select(`
      id, title, authors, year, abstract_text,
      curation_status, evidence_score, evidence_label,
      curation_data
    `)
    .eq('curation_status', 'ready')
    .is('deleted_at', null);

  if (error || !papers) return [];

  // Get curation details from academy_paper_curation
  const paperIds = papers.map(p => p.id);
  const { data: curations } = await supabase
    .from('academy_paper_curation')
    .select('paper_id, curation_json, nivel_evidencia, risco_vies, score_metodologico')
    .in('paper_id', paperIds);

  const curationMap = new Map<string, {
    curation_json: Record<string, unknown>;
    nivel_evidencia: string | null;
    risco_vies: string | null;
    score_metodologico: number | null;
  }>();
  
  (curations || []).forEach(c => {
    curationMap.set(c.paper_id, {
      curation_json: c.curation_json as Record<string, unknown>,
      nivel_evidencia: c.nivel_evidencia,
      risco_vies: c.risco_vies,
      score_metodologico: c.score_metodologico,
    });
  });

  // Check fulltext quality
  const { data: fulltexts } = await supabase
    .from('academy_paper_fulltext')
    .select('paper_id, has_sufficient_text, is_scanned')
    .in('paper_id', paperIds);

  const fulltextMap = new Map<string, { ok: boolean }>();
  (fulltexts || []).forEach(f => {
    fulltextMap.set(f.paper_id, {
      ok: f.has_sufficient_text === true && f.is_scanned !== true,
    });
  });

  // Filter + match
  const synonymsLower = mapping.synonyms.map((s: string) => s.toLowerCase());
  const tagsLower = mapping.tags_required.map((t: string) => t.toLowerCase());

  const matched: EvidencePaperLite[] = [];

  for (const paper of papers) {
    const ft = fulltextMap.get(paper.id);
    if (ft && !ft.ok) continue;

    const cur = curationMap.get(paper.id);
    const cJson = cur?.curation_json || (paper.curation_data as Record<string, unknown>) || null;

    // Match: check synonyms against title, interventions, curation
    const titleLower = (paper.title || '').toLowerCase();
    const interventionField = cJson?.intervencao as string || '';
    const tagsField = (cJson?.tags as string[] || []).map(t => t.toLowerCase());
    const picoPopulation = ((cJson?.pico as Record<string, unknown>)?.population as string || '').toLowerCase();
    const picoIntervention = ((cJson?.pico as Record<string, unknown>)?.intervention as string || '').toLowerCase();

    const searchableText = [titleLower, interventionField.toLowerCase(), picoIntervention, ...tagsField].join(' ');

    const synonymMatch = synonymsLower.some(s => searchableText.includes(s));
    if (!synonymMatch) continue;

    // Check tags_required match
    const allTagsText = [titleLower, picoPopulation, ...tagsField].join(' ');
    const tagsMatch = tagsLower.length === 0 || tagsLower.some(t => allTagsText.includes(t));
    if (!tagsMatch) continue;

    matched.push({
      paper_id: paper.id,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      nivel_evidencia: cur?.nivel_evidencia || paper.evidence_label || null,
      risco_vies: cur?.risco_vies || null,
      score_metodologico: cur?.score_metodologico || null,
      evidence_score: paper.evidence_score,
      direction: extractPaperDirection(cJson),
      curation_status: paper.curation_status,
      abstract_text: paper.abstract_text,
      curation_data: cJson,
    });
  }

  // Sort: best evidence level → lowest bias → highest method score → highest evidence score → most recent
  matched.sort((a, b) => {
    const levelDiff = normalizeEvidenceLevel(a.nivel_evidencia) - normalizeEvidenceLevel(b.nivel_evidencia);
    if (levelDiff !== 0) return levelDiff;
    
    const biasDiff = normalizeBiasRisk(a.risco_vies) - normalizeBiasRisk(b.risco_vies);
    if (biasDiff !== 0) return biasDiff;
    
    const methodDiff = (b.score_metodologico ?? 0) - (a.score_metodologico ?? 0);
    if (methodDiff !== 0) return methodDiff;
    
    const evidenceDiff = (b.evidence_score ?? 0) - (a.evidence_score ?? 0);
    if (evidenceDiff !== 0) return evidenceDiff;
    
    return (b.year ?? 0) - (a.year ?? 0);
  });

  return matched;
}

// ─── Internal: Calculate Aggregate ──────────────────────────

function calculateAggregate(
  pathologyKey: string,
  interventionKey: string,
  papers: EvidencePaperLite[],
): EvidenceAggregate {
  const count = papers.length;
  
  // Best evidence level
  const bestLevel = papers.reduce((best, p) => {
    const rank = normalizeEvidenceLevel(p.nivel_evidencia);
    return rank < normalizeEvidenceLevel(best) ? (p.nivel_evidencia || best) : best;
  }, papers[0]?.nivel_evidencia || '');

  // Averages
  const methodScores = papers.filter(p => p.score_metodologico != null).map(p => p.score_metodologico!);
  const evidenceScores = papers.filter(p => p.evidence_score != null).map(p => p.evidence_score!);
  
  const avgMethod = methodScores.length > 0 ? methodScores.reduce((a, b) => a + b, 0) / methodScores.length : null;
  const avgEvidence = evidenceScores.length > 0 ? evidenceScores.reduce((a, b) => a + b, 0) / evidenceScores.length : null;

  // Direction & consistency
  const withDirection = papers.filter(p => p.direction !== 'unknown');
  let favorable = 0, neutral = 0, harmful = 0;
  for (const p of withDirection) {
    if (p.direction === 'favorable') favorable++;
    else if (p.direction === 'neutral') neutral++;
    else if (p.direction === 'harmful') harmful++;
  }
  
  const totalConsidered = favorable + neutral + harmful;
  const consistencyScore = totalConsidered > 0
    ? Math.max(favorable, neutral, harmful) / totalConsidered
    : 0;

  let directionSummary: DirectionSummary = 'unknown';
  if (totalConsidered > 0) {
    const max = Math.max(favorable, neutral, harmful);
    if (favorable === max && favorable > neutral && favorable > harmful) directionSummary = 'favorable';
    else if (harmful === max) directionSummary = 'harmful';
    else if (neutral === max) directionSummary = 'neutral';
    else directionSummary = 'mixed';
  }

  // Recommendation strength
  const levelICounts = papers.filter(p => normalizeEvidenceLevel(p.nivel_evidencia) <= 2).length;
  const levelIICounts = papers.filter(p => {
    const r = normalizeEvidenceLevel(p.nivel_evidencia);
    return r >= 3 && r <= 4;
  }).length;
  
  const top3Bias = papers.slice(0, 3).map(p => normalizeBiasRisk(p.risco_vies));
  const hasHighBiasInTop3 = top3Bias.some(b => b >= 3);

  let strength: RecommendationStrength = 'insufficient';
  if (count === 0) {
    strength = 'insufficient';
  } else if (levelICounts >= 2 && !hasHighBiasInTop3 && consistencyScore >= 0.70) {
    strength = 'strong';
  } else if ((levelICounts >= 1 || levelIICounts >= 2) && consistencyScore >= 0.60) {
    strength = 'moderate';
  } else if (count >= 1) {
    strength = 'weak';
  }

  // Confidence level
  let confidence: ConfidenceLevel = 'low';
  if (strength === 'strong' && (avgMethod ?? 0) >= 7.5 && (avgEvidence ?? 0) >= 80) {
    confidence = 'high';
  } else if (strength === 'moderate' && (avgMethod ?? 0) >= 6) {
    confidence = 'moderate';
  }

  // Reasons
  const reasons: string[] = [];
  if (count > 0) {
    const levelILabel = levelICounts > 0 ? `${levelICounts} RCT(s) nível I` : '';
    const levelIILabel = levelIICounts > 0 ? `${levelIICounts} estudo(s) nível II` : '';
    const parts = [levelILabel, levelIILabel].filter(Boolean).join(', ');
    reasons.push(`${count} estudo(s) relevante(s)${parts ? ` (${parts})` : ''}`);
  }
  if (totalConsidered > 0) {
    reasons.push(`Consistência ${directionSummary === 'favorable' ? 'favorável' : directionSummary}: ${(consistencyScore * 100).toFixed(0)}%`);
  }
  const biasLabels = papers.slice(0, 5).filter(p => p.risco_vies).map(p => p.risco_vies!.toLowerCase());
  const predominantBias = biasLabels.length > 0
    ? biasLabels.filter(b => b === 'baixo' || b === 'low').length >= biasLabels.length / 2
      ? 'baixo' : biasLabels.filter(b => b === 'moderado' || b === 'moderate').length >= biasLabels.length / 2
        ? 'moderado' : 'alto'
    : null;
  if (predominantBias) {
    reasons.push(`Risco de viés ${predominantBias} predominante`);
  }
  if (avgMethod != null) {
    reasons.push(`Score metodológico médio: ${avgMethod.toFixed(1)}/10`);
  }

  const topPaperIds = papers.slice(0, 5).map(p => p.paper_id);

  return {
    id: '',
    pathology_key: pathologyKey,
    intervention_key: interventionKey,
    papers_count: count,
    best_level_evidence: bestLevel || null,
    average_method_score: avgMethod != null ? Math.round(avgMethod * 100) / 100 : null,
    average_evidence_score: avgEvidence != null ? Math.round(avgEvidence * 100) / 100 : null,
    consistency_score: Math.round(consistencyScore * 100) / 100,
    recommendation_strength: strength,
    confidence_level: confidence,
    direction_summary: directionSummary,
    top_paper_ids: topPaperIds,
    reasons,
    updated_at: new Date().toISOString(),
  };
}

function buildEmptyAggregate(pathologyKey: string, interventionKey: string): EvidenceAggregate {
  return {
    id: '',
    pathology_key: pathologyKey,
    intervention_key: interventionKey,
    papers_count: 0,
    best_level_evidence: null,
    average_method_score: null,
    average_evidence_score: null,
    consistency_score: 0,
    recommendation_strength: 'insufficient',
    confidence_level: 'low',
    direction_summary: 'unknown',
    top_paper_ids: [],
    reasons: [],
    updated_at: new Date().toISOString(),
  };
}

async function upsertAggregate(aggregate: EvidenceAggregate): Promise<void> {
  const { id, ...data } = aggregate;
  await supabase
    .from('academy_evidence_aggregates')
    .upsert({
      ...data,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'pathology_key,intervention_key',
    });
}

function mapAggregate(row: Record<string, unknown>): EvidenceAggregate {
  return {
    id: row.id as string,
    pathology_key: row.pathology_key as string,
    intervention_key: row.intervention_key as string,
    papers_count: row.papers_count as number,
    best_level_evidence: row.best_level_evidence as string | null,
    average_method_score: row.average_method_score != null ? Number(row.average_method_score) : null,
    average_evidence_score: row.average_evidence_score != null ? Number(row.average_evidence_score) : null,
    consistency_score: Number(row.consistency_score),
    recommendation_strength: row.recommendation_strength as RecommendationStrength,
    confidence_level: row.confidence_level as ConfidenceLevel,
    direction_summary: row.direction_summary as DirectionSummary,
    top_paper_ids: (row.top_paper_ids as string[]) || [],
    reasons: (row.reasons as string[]) || [],
    updated_at: row.updated_at as string,
  };
}
