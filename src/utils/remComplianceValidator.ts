// Reghen Evidence Method™ — Compliance Validator
// Validates structured layers before publication

export interface RemComplianceResult {
  is_valid: boolean;
  compliance_score: number; // 0-100
  errors: string[];
  warnings: string[];
}

const VALID_STUDY_TYPES = [
  "meta", "systematic_review", "rct", "cohort",
  "case_control", "case_series", "animal", "in_vitro", "other",
];

const PRE_CLINICAL_TYPES = ["animal", "in_vitro"];

const TRAIL_LEVEL_MAP: Record<string, string[]> = {
  meta: ["meta", "systematic_review"],
  rct: ["rct"],
  observational: ["cohort", "case_control", "case_series"],
};

export function validateReghenEvidenceMethod(layers: any): RemComplianceResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!layers) {
    return { is_valid: false, compliance_score: 0, errors: ["Camadas REM™ ausentes."], warnings: [] };
  }

  const l1 = layers.layer_1_structure;
  const l2 = layers.layer_2_methodology;
  const l3 = layers.layer_3_reliability;
  const l4 = layers.layer_4_applicability;
  const l5 = layers.layer_5_limitations;
  const l6 = layers.layer_6_consistency;
  const l7 = layers.layer_7_educational;

  let score = 100;

  // --- Layer 1: Structure (PICO) ---
  if (!l1) {
    errors.push("Layer 1 (Estrutura PICO) ausente.");
    score -= 20;
  } else {
    const outcomes = l1.outcomes || {};
    const clinical = outcomes.clinical || [];
    const functional = outcomes.functional || [];
    const biological = outcomes.biological || [];
    const hasAnyOutcome = clinical.length > 0 || functional.length > 0 || biological.length > 0;

    if (!hasAnyOutcome) {
      // Warning only — outcomes may need to be completed via curation re-run
      warnings.push("Layer 1: Nenhum outcome estruturado encontrado. Use 'Completar outcomes com IA' para reestruturar.");
      score -= 3;
    }

    // Biomarkers in clinical check
    const biomarkerTerms = ["biomarcador", "biomarker", "citocina", "cytokine", "il-", "tnf", "vegf", "pdgf", "igf"];
    for (const item of clinical) {
      const lower = (item || "").toLowerCase();
      if (biomarkerTerms.some((t) => lower.includes(t))) {
        errors.push(`Layer 1: Biomarcador "${item}" não pode estar em outcomes.clinical — mover para outcomes.biological.`);
        score -= 5;
      }
    }
  }

  // --- Layer 2: Methodology ---
  if (!l2) {
    errors.push("Layer 2 (Metodologia) ausente.");
    score -= 20;
  } else {
    if (!l2.study_type || !VALID_STUDY_TYPES.includes(l2.study_type)) {
      errors.push(`Layer 2: study_type inválido ou ausente ("${l2.study_type || "null"}").`);
      score -= 10;
    }

    // is_human / study_type consistency
    if (PRE_CLINICAL_TYPES.includes(l2.study_type) && l2.is_human === true) {
      errors.push("Layer 2: is_human=true é incompatível com study_type animal/in_vitro.");
      score -= 10;
    }
    if (l2.is_human === true && PRE_CLINICAL_TYPES.includes(l2.study_type)) {
      // Already caught above
    }
    if (!PRE_CLINICAL_TYPES.includes(l2.study_type) && l2.is_human === false) {
      warnings.push("Layer 2: is_human=false para estudo não pré-clínico — verificar se correto.");
    }
  }

  // --- Layer 3: Reliability ---
  if (!l3) {
    warnings.push("Layer 3 (Confiabilidade) ausente — score reduzido.");
    score -= 5;
  }

  // --- Layer 4: Applicability ---
  if (!l4) {
    errors.push("Layer 4 (Aplicabilidade) ausente.");
    score -= 15;
  } else {
    if (!l4.classification) {
      errors.push("Layer 4: applicability.classification não pode ser null para publicação.");
      score -= 10;
    }
  }

  // --- Layer 5: Limitations ---
  if (l5 === null || l5 === undefined) {
    errors.push("Layer 5 (Limitações): array não pode ser null — usar [] se nenhuma limitação.");
    score -= 5;
  } else if (!Array.isArray(l5)) {
    errors.push("Layer 5 (Limitações): deve ser um array.");
    score -= 5;
  }

  // --- Layer 6: Consistency ---
  if (!l6) {
    warnings.push("Layer 6 (Consistência) ausente.");
    score -= 3;
  }

  // --- Layer 7: Educational ---
  if (!l7) {
    warnings.push("Layer 7 (Educacional) ausente.");
    score -= 3;
  } else {
    // trail_level coherence
    if (l7.trail_level && l2?.study_type) {
      const validTypes = TRAIL_LEVEL_MAP[l7.trail_level];
      if (validTypes && !validTypes.includes(l2.study_type)) {
        warnings.push(
          `Layer 7: trail_level "${l7.trail_level}" é incoerente com study_type "${l2.study_type}".`
        );
        score -= 3;
      }
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    is_valid: errors.length === 0,
    compliance_score: finalScore,
    errors,
    warnings,
  };
}
