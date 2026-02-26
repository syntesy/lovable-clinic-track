// Paper Template Router — Deterministic classification based on structured curation data
// NEVER infer from raw text client-side. All decisions from structured fields.

export type PaperTemplate =
  | 'TEMPLATE_CLINICAL_COMPARATIVE'
  | 'TEMPLATE_REVIEW_CONSENSUS'
  | 'TEMPLATE_TRANSLATIONAL_PRECLINICAL'
  | 'TEMPLATE_OTHER';

export const TEMPLATE_LABELS: Record<PaperTemplate, string> = {
  TEMPLATE_CLINICAL_COMPARATIVE: 'Ensaio Clínico Comparativo',
  TEMPLATE_REVIEW_CONSENSUS: 'Revisão / Consenso',
  TEMPLATE_TRANSLATIONAL_PRECLINICAL: 'Pré-clínico / Translacional',
  TEMPLATE_OTHER: 'Outro',
};

export const TEMPLATE_APPLICABILITY: Record<PaperTemplate, string> = {
  TEMPLATE_CLINICAL_COMPARATIVE: 'Decisão clínica',
  TEMPLATE_REVIEW_CONSENSUS: 'Decisão clínica',
  TEMPLATE_TRANSLATIONAL_PRECLINICAL: 'Experimental / Educacional',
  TEMPLATE_OTHER: 'Educacional',
};

interface CurationJsonInput {
  tipo_estudo?: string;
  tamanho_amostra_total?: number;
  comparador?: string;
  intervencao?: string;
  desfechos_primarios?: string[];
  desfechos_secundarios?: string[];
  resultados_principais?: string;
  aplicabilidade_clinica?: string;
  conclusao_pratica?: string;
  conclusao?: string;
  risco_vies?: string;
  score_metodologico?: number;
  nivel_evidencia?: string;
  tags?: string[];
  outcomes?: Array<{ name?: string; direction?: string; timeframe?: string; domain?: string }>;
  [key: string]: any;
}

interface IndexedFields {
  nivel_evidencia?: string | null;
  risco_vies?: string | null;
  score_metodologico?: number | null;
  evidence_score?: number | null;
  has_sufficient_text?: boolean | null;
}

export function resolvePaperTemplate(
  curationJson: CurationJsonInput | null,
  indexedFields?: IndexedFields | null,
): PaperTemplate {
  if (!curationJson) return 'TEMPLATE_OTHER';

  const st = (curationJson.tipo_estudo || '').toLowerCase();

  // 1) REVIEW_CONSENSUS — check first to avoid false clinical match
  const reviewPatterns = ['systematic review', 'meta-analysis', 'meta-análise', 'revisão sistemática', 'guideline', 'consensus', 'position statement', 'consenso', 'diretriz'];
  if (reviewPatterns.some(p => st.includes(p))) {
    return 'TEMPLATE_REVIEW_CONSENSUS';
  }

  // 2) TRANSLATIONAL_PRECLINICAL — explicit preclinical
  const preclinicalPatterns = ['in vitro', 'animal', 'cells', 'mechanisms', 'pré-clínico', 'preclinical', 'translational', 'translacional'];
  if (preclinicalPatterns.some(p => st.includes(p))) {
    return 'TEMPLATE_TRANSLATIONAL_PRECLINICAL';
  }

  // 3) CLINICAL_COMPARATIVE — must have structured comparative data
  const clinicalPatterns = ['randomized', 'randomised', 'trial', 'cohort', 'coorte', 'case-control', 'caso-controle', 'ecr', 'rct', 'ensaio clínico'];
  const hasClinicType = clinicalPatterns.some(p => st.includes(p));
  const hasSampleSize = (curationJson.tamanho_amostra_total ?? 0) > 0;
  const hasComparator = !!curationJson.comparador && curationJson.comparador.trim().length > 0;

  // Check for at least 1 structured outcome
  const hasStructuredOutcome = (curationJson.outcomes || []).some(
    o => o && o.name && o.name !== 'Não identificado'
  );
  const hasOutcomesFromFields = (curationJson.desfechos_primarios || []).length > 0;

  if (hasClinicType && hasSampleSize && hasComparator && (hasStructuredOutcome || hasOutcomesFromFields)) {
    return 'TEMPLATE_CLINICAL_COMPARATIVE';
  }

  // 4) If study type looks clinical but missing structured data → translational fallback
  if (!hasComparator || (!hasStructuredOutcome && !hasOutcomesFromFields)) {
    // Check if it mentions biological/mechanistic terms in tags or type
    const tags = (curationJson.tags || []).map(t => t.toLowerCase());
    const isBiological = tags.some(t =>
      ['in vitro', 'animal', 'cells', 'mechanism', 'msc', 'exosome', 'evs', 'scaffold'].includes(t)
    ) || preclinicalPatterns.some(p => tags.some(t => t.includes(p)));

    if (isBiological) return 'TEMPLATE_TRANSLATIONAL_PRECLINICAL';
  }

  // If has clinical type but incomplete data, still classify as clinical
  if (hasClinicType && hasSampleSize) {
    return 'TEMPLATE_CLINICAL_COMPARATIVE';
  }

  return 'TEMPLATE_OTHER';
}

// Safe field accessor — returns null for empty/invalid values
export function safeField(value: any): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === '' || s.toLowerCase() === 'other' || s.toLowerCase() === 'não informado' || s.toLowerCase() === 'null') return null;
  return s;
}

// Safe array — filters out empty/null items
export function safeArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item: any) => {
    if (!item) return false;
    const s = String(item).trim();
    return s !== '' && s.toLowerCase() !== 'other' && s.toLowerCase() !== 'não informado';
  });
}

// Get the best conclusion text from curation
export function getBestConclusion(c: CurationJsonInput): string | null {
  return safeField(c.conclusao_pratica) || safeField(c.conclusao) || safeField(c.aplicabilidade_clinica) || null;
}

// Get "what is this" summary
export function getWhatIsThis(c: CurationJsonInput): string | null {
  const tipo = safeField(c.tipo_estudo);
  const interv = safeField(c.intervencao);
  if (tipo && interv) {
    return `${tipo} avaliando ${interv}`.substring(0, 240);
  }
  if (tipo) return tipo.substring(0, 240);
  return null;
}

// Get audience classification
export function getAudience(template: PaperTemplate): string[] {
  switch (template) {
    case 'TEMPLATE_CLINICAL_COMPARATIVE':
      return ['Decisão clínica', 'Educação', 'Pesquisa'];
    case 'TEMPLATE_REVIEW_CONSENSUS':
      return ['Decisão clínica', 'Educação'];
    case 'TEMPLATE_TRANSLATIONAL_PRECLINICAL':
      return ['Hipótese científica', 'Educação', 'Pesquisa'];
    case 'TEMPLATE_OTHER':
      return ['Educação'];
  }
}

// Abstract validation: detect affiliation patterns
export function validateAbstract(abstractText: string | null, charCount: number | null): {
  isValid: boolean;
  reason?: string;
} {
  if (!abstractText || (charCount ?? 0) < 400) {
    return { isValid: false, reason: 'Abstract muito curto ou ausente' };
  }

  const lines = abstractText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { isValid: false, reason: 'Abstract vazio' };

  const affiliationPatterns = /\b(university|department|institute|hospital|faculty|school of|centro|universidade|departamento|instituto)\b/i;
  const affiliationLines = lines.filter(l => affiliationPatterns.test(l));
  const ratio = affiliationLines.length / lines.length;

  if (ratio > 0.3) {
    return { isValid: false, reason: 'Abstract contém principalmente afiliações de autores' };
  }

  return { isValid: true };
}
