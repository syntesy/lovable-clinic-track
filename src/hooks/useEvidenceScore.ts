// Reghen Evidence Method™ — Evidence Score Calculator
// Derives score 100% from the 7 structured layers
// NOT a formal Risk of Bias assessment

export interface EvidenceScoreBreakdown {
  methodology_weight: number;
  reliability_weight: number;
  follow_up_weight: number;
  limitation_penalty: number;
  final_score: number;
}

export interface EvidenceScoreResult {
  score: number; // 0-100
  label: string;
  notes: string;
  breakdown: EvidenceScoreBreakdown;
}

const STUDY_TYPE_BASE: Record<string, number> = {
  meta: 90,
  systematic_review: 85,
  rct: 80,
  cohort: 65,
  case_control: 55,
  case_series: 40,
  animal: 25,
  in_vitro: 15,
  other: 50,
};

const STUDY_TYPE_LABELS: Record<string, string> = {
  meta: "Meta-análise",
  systematic_review: "Revisão Sistemática",
  rct: "ECR",
  cohort: "Coorte",
  case_control: "Caso-Controle",
  case_series: "Série de Casos",
  animal: "Pré-clínico (animal)",
  in_vitro: "Pré-clínico (in vitro)",
  other: "Outro",
};

/** Compute from Reghen Evidence Method™ structured layers */
function computeFromLayers(layers: any): EvidenceScoreResult {
  const l2 = layers?.layer_2_methodology || {};
  const l3 = layers?.layer_3_reliability || {};
  const l5 = layers?.layer_5_limitations || [];

  const studyType = l2.study_type || "other";
  const baseScore = STUDY_TYPE_BASE[studyType] ?? 50;

  let reliabilityWeight = 0;
  if (l3.randomized === true) reliabilityWeight += 5;
  if (l3.control_group === true) reliabilityWeight += 5;
  if (l3.blinded === true) reliabilityWeight += 3;

  let followUpWeight = 0;
  const fuMonths = l2.follow_up_months;
  if (typeof fuMonths === "number") {
    if (fuMonths >= 24) followUpWeight = 8;
    else if (fuMonths >= 12) followUpWeight = 5;
    else if (fuMonths >= 6) followUpWeight = 3;
  }

  let limitationPenalty = 0;
  if (Array.isArray(l5)) {
    const methodological = l5.filter((l: any) => l.category === "methodological").length;
    limitationPenalty = Math.min(methodological * 5, 15);
  }

  let adjusted = baseScore;
  if (l2.is_human === false) adjusted = Math.min(adjusted, 25);

  const finalScore = Math.max(0, Math.min(100, adjusted + reliabilityWeight + followUpWeight - limitationPenalty));

  return {
    score: finalScore,
    label: STUDY_TYPE_LABELS[studyType] || "Outro",
    notes: "Score derivado do Reghen Evidence Method™. Não é uma avaliação formal de risco de viés (RoB).",
    breakdown: {
      methodology_weight: adjusted,
      reliability_weight: reliabilityWeight,
      follow_up_weight: followUpWeight,
      limitation_penalty: limitationPenalty,
      final_score: finalScore,
    },
  };
}

/** Legacy fallback for papers without structured layers */
function computeLegacy(paper: {
  curation_data?: any;
  warnings?: string[];
}): EvidenceScoreResult {
  const curation = paper.curation_data || {};
  const warnings = paper.warnings || [];
  const studyType = (curation.study_type || "").toLowerCase();
  const levelInference = (curation.level_inference || "").toLowerCase();

  let score = 50;
  let label = "Observacional";

  if (studyType.includes("meta-análise") || studyType.includes("meta-analise") || studyType.includes("meta-analysis")) {
    score = 90; label = "Meta-análise";
  } else if (studyType.includes("revisão sistemática") || studyType.includes("systematic review")) {
    score = 85; label = "Revisão Sistemática";
  } else if (studyType.includes("ecr") || studyType.includes("rct") || studyType.includes("ensaio clínico randomizado") || studyType.includes("randomized")) {
    score = 75; label = "ECR";
  } else if (studyType.includes("coorte") || studyType.includes("cohort")) {
    score = 55; label = "Coorte";
  } else if (studyType.includes("caso-controle") || studyType.includes("case-control")) {
    score = 45; label = "Caso-Controle";
  } else if (studyType.includes("série de casos") || studyType.includes("case series")) {
    score = 35; label = "Série de Casos";
  } else if (studyType.includes("relato de caso") || studyType.includes("case report")) {
    score = 25; label = "Relato de Caso";
  } else if (studyType.includes("revisão narrativa") || studyType.includes("narrative review")) {
    score = 40; label = "Revisão Narrativa";
  }

  if (levelInference.includes("ia") || levelInference.includes("1a")) score = Math.max(score, 90);
  else if (levelInference.includes("ib") || levelInference.includes("1b")) score = Math.max(score, 80);
  else if (levelInference.includes("iia") || levelInference.includes("2a")) score = Math.max(score, 65);

  for (const w of warnings) {
    const wl = (w || "").toLowerCase();
    if (wl.includes("animal") || wl.includes("in vitro") || wl.includes("pré-clínico")) {
      score -= 20; if (!label.includes("pré-clínico")) label += " (pré-clínico)";
    }
    if (wl.includes("abstract não disponível") || wl.includes("abstract limitado")) score -= 10;
    if (wl.includes("biomarcador sem desfecho")) score -= 5;
  }

  if (curation.follow_up) {
    const fu = curation.follow_up.toLowerCase();
    if (fu.includes("12 meses") || fu.includes("1 ano") || fu.includes("year")) score += 5;
    if (fu.includes("24 meses") || fu.includes("2 ano")) score += 8;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label,
    notes: "Score heurístico (legado). Paper anterior à implementação completa do Reghen Evidence Method™.",
    breakdown: {
      methodology_weight: score,
      reliability_weight: 0,
      follow_up_weight: 0,
      limitation_penalty: 0,
      final_score: score,
    },
  };
}

export function computeEvidenceScore(paper: {
  curation_data?: any;
  warnings?: string[];
  abstract_text?: string | null;
  year?: number | null;
}): EvidenceScoreResult {
  const rem = paper.curation_data?.reghen_evidence_method;
  if (rem?.layers) {
    return computeFromLayers(rem.layers);
  }
  // Legacy fallback
  return computeLegacy(paper);
}

/** Check if paper has the full Reghen Evidence Method™ structure */
export function hasReghenMethod(curationData: any): boolean {
  return !!curationData?.reghen_evidence_method?.layers;
}

/** Get legacy warning for papers without method */
export function getLegacyWarning(): string {
  return "Paper anterior à implementação completa do Reghen Evidence Method™";
}
