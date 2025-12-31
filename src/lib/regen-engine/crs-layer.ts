/**
 * CRS LAYER - Camada 2 (Clinical Readiness Score)
 * 
 * Avalia a prontidão clínica do paciente.
 * Base = 100, penalidades progressivas, clamp 0-100.
 */

import { RegenCanonical } from "@/types/regen-canonical";
import { CRSOutput } from "@/types/regen-engine";

interface PenaltyResult {
  penalty: number;
  reason: string;
}

export function computeCRS(canonical: RegenCanonical): CRSOutput {
  const missing: string[] = [];
  const penalties_applied: string[] = [];
  let score = 100;

  const { complaint } = canonical;

  // === VERIFICAR DADOS FALTANTES ===
  
  if (!complaint.pain_region) {
    missing.push("pain_region");
  }

  if (!complaint.symptom_duration_bucket) {
    missing.push("symptom_duration_bucket");
  }

  if (complaint.pain_nrs === null || complaint.pain_nrs === undefined) {
    missing.push("pain_nrs");
  }

  // === APLICAR PENALIDADES ===

  // Duração dos sintomas
  if (complaint.symptom_duration_bucket) {
    const durationPenalty = getDurationPenalty(complaint.symptom_duration_bucket);
    if (durationPenalty.penalty > 0) {
      score -= durationPenalty.penalty;
      penalties_applied.push(durationPenalty.reason);
    }
  }

  // Intensidade da dor (dor muito alta pode indicar fase aguda)
  if (complaint.pain_nrs !== null && complaint.pain_nrs !== undefined) {
    const painPenalty = getPainPenalty(complaint.pain_nrs);
    if (painPenalty.penalty > 0) {
      score -= painPenalty.penalty;
      penalties_applied.push(painPenalty.reason);
    }
  }

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));

  // Determinar classificação
  const classification = getClassification(score);

  // Determinar confidence baseado em dados faltantes
  const confidence = getConfidence(missing);

  return {
    score: Math.round(score),
    classification,
    confidence,
    missing,
    penalties_applied,
  };
}

function getDurationPenalty(duration: string): PenaltyResult {
  switch (duration) {
    case "lt_3m":
      // Sintomas muito recentes - pode ser fase aguda
      return { penalty: 15, reason: "ACUTE_SYMPTOMS_LT_3M" };
    case "m3_6":
      // Faixa ideal para intervenção
      return { penalty: 0, reason: "" };
    case "gt_6m":
      // Crônico - pode ter alterações estruturais
      return { penalty: 10, reason: "CHRONIC_SYMPTOMS_GT_6M" };
    default:
      return { penalty: 0, reason: "" };
  }
}

function getPainPenalty(painNrs: number): PenaltyResult {
  if (painNrs >= 9) {
    // Dor muito intensa - pode indicar fase aguda/inflamatória
    return { penalty: 20, reason: "SEVERE_PAIN_GTE_9" };
  } else if (painNrs >= 7) {
    return { penalty: 10, reason: "HIGH_PAIN_7_8" };
  } else if (painNrs <= 2) {
    // Dor muito baixa - benefício questionável
    return { penalty: 5, reason: "LOW_PAIN_LTE_2" };
  }
  return { penalty: 0, reason: "" };
}

function getClassification(score: number): "Not Ready" | "Conditionally Ready" | "Potentially Ready" {
  if (score < 40) {
    return "Not Ready";
  } else if (score < 70) {
    return "Conditionally Ready";
  } else {
    return "Potentially Ready";
  }
}

function getConfidence(missing: string[]): "High" | "Medium" | "Low" {
  if (missing.length === 0) {
    return "High";
  } else if (missing.length <= 1) {
    return "Medium";
  } else {
    return "Low";
  }
}
