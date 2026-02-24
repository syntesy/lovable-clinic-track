// Heuristic evidence score calculator
// NOT a formal Risk of Bias assessment

export interface EvidenceScoreResult {
  score: number; // 0-100
  label: string;
  notes: string;
}

export function computeEvidenceScore(paper: {
  curation_data?: any;
  warnings?: string[];
  abstract_text?: string | null;
  year?: number | null;
}): EvidenceScoreResult {
  const curation = paper.curation_data || {};
  const warnings = paper.warnings || [];
  const studyType = (curation.study_type || "").toLowerCase();
  const levelInference = (curation.level_inference || "").toLowerCase();

  let score = 50; // base
  let label = "Observacional";

  // Study type scoring
  if (studyType.includes("meta-análise") || studyType.includes("meta-analise") || studyType.includes("meta-analysis")) {
    score = 90;
    label = "Meta-análise";
  } else if (studyType.includes("revisão sistemática") || studyType.includes("systematic review")) {
    score = 85;
    label = "Revisão Sistemática";
  } else if (studyType.includes("ecr") || studyType.includes("rct") || studyType.includes("ensaio clínico randomizado") || studyType.includes("randomized")) {
    score = 75;
    label = "ECR";
  } else if (studyType.includes("coorte") || studyType.includes("cohort")) {
    score = 55;
    label = "Coorte";
  } else if (studyType.includes("caso-controle") || studyType.includes("case-control")) {
    score = 45;
    label = "Caso-Controle";
  } else if (studyType.includes("série de casos") || studyType.includes("case series")) {
    score = 35;
    label = "Série de Casos";
  } else if (studyType.includes("relato de caso") || studyType.includes("case report")) {
    score = 25;
    label = "Relato de Caso";
  } else if (studyType.includes("revisão narrativa") || studyType.includes("narrative review")) {
    score = 40;
    label = "Revisão Narrativa";
  }

  // Evidence level boost/penalty
  if (levelInference.includes("ia") || levelInference.includes("1a")) score = Math.max(score, 90);
  else if (levelInference.includes("ib") || levelInference.includes("1b")) score = Math.max(score, 80);
  else if (levelInference.includes("iia") || levelInference.includes("2a")) score = Math.max(score, 65);

  // Penalties from warnings
  for (const w of warnings) {
    const wl = (w || "").toLowerCase();
    if (wl.includes("animal") || wl.includes("in vitro") || wl.includes("pré-clínico")) {
      score -= 20;
      if (!label.includes("pré-clínico")) label += " (pré-clínico)";
    }
    if (wl.includes("abstract não disponível") || wl.includes("abstract limitado")) {
      score -= 10;
    }
    if (wl.includes("biomarcador sem desfecho")) {
      score -= 5;
    }
  }

  // Follow-up bonus
  if (curation.follow_up) {
    const fu = curation.follow_up.toLowerCase();
    if (fu.includes("12 meses") || fu.includes("1 ano") || fu.includes("year")) score += 5;
    if (fu.includes("24 meses") || fu.includes("2 ano")) score += 8;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label,
    notes: "Score heurístico baseado em tipo de estudo, nível de evidência e warnings. Não é uma avaliação formal de risco de viés (RoB).",
  };
}
