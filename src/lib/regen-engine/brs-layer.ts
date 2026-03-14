/**
 * BRS LAYER - Camada 4 (Biological Readiness Score)
 * 
 * Avalia a prontidão biológica do paciente.
 * Usa labs válidos, tabagismo, medicações, comorbidades.
 * Base = 100, penalidades progressivas, clamp 0-100.
 */

import { RegenCanonical } from "@/types/regen-canonical";
import { BRSOutput, DIEOutput } from "@/types/regen-engine";
import { getValidLabsForBRS } from "./die-layer";

interface PenaltyResult {
  penalty: number;
  reason_code: string;
  alert?: string;
}

export function computeBRS(canonical: RegenCanonical, dieOutput: DIEOutput): BRSOutput {
  const reason_codes: string[] = [];
  const alerts: string[] = [];
  const penalties_applied: string[] = [];
  let score = 100;

  const validLabs = getValidLabsForBRS(dieOutput);
  const { smoking, medications, comorbidities, labs } = canonical;

  // === TABAGISMO ===
  const smokingPenalty = getSmokingPenalty(smoking.status, smoking.quit_bucket);
  if (smokingPenalty.penalty > 0) {
    score -= smokingPenalty.penalty;
    reason_codes.push(smokingPenalty.reason_code);
    penalties_applied.push(`Tabagismo: -${smokingPenalty.penalty}`);
    if (smokingPenalty.alert) {
      alerts.push(smokingPenalty.alert);
    }
  }

  // === MEDICAÇÕES ===
  
  // AINE recente
  if (medications.nsaid_recent_14d === "yes") {
    const penalty = 15;
    score -= penalty;
    reason_codes.push("NSAID_RECENT_14D");
    penalties_applied.push(`AINE recente: -${penalty}`);
    alerts.push("Uso recente de anti-inflamatório pode afetar função plaquetária");
  }

  // Corticoide recente
  if (medications.steroid_recent === "yes") {
    const penalty = medications.steroid_route === "local_infiltration" ? 20 : 10;
    score -= penalty;
    reason_codes.push(medications.steroid_route === "local_infiltration" 
      ? "STEROID_LOCAL_RECENT" 
      : "STEROID_SYSTEMIC_RECENT");
    penalties_applied.push(`Corticoide recente: -${penalty}`);
    alerts.push("Corticoides recentes podem impactar a regeneração tecidual");
  }

  // Anticoagulante
  if (medications.anticoagulant) {
    const penalty = 10;
    score -= penalty;
    reason_codes.push("ANTICOAGULANT_USE");
    penalties_applied.push(`Anticoagulante: -${penalty}`);
    alerts.push("Uso de anticoagulante requer avaliação de risco-benefício");
  }

  // Imunossupressor
  if (medications.immunosuppressor) {
    const penalty = 15;
    score -= penalty;
    reason_codes.push("IMMUNOSUPPRESSOR_USE");
    penalties_applied.push(`Imunossupressor: -${penalty}`);
    alerts.push("Imunossupressores podem afetar resposta regenerativa");
  }

  // Antiplaquetários
  if (medications.aspirin || medications.p2y12) {
    const penalty = 10;
    score -= penalty;
    reason_codes.push("ANTIPLATELET_USE");
    penalties_applied.push(`Antiplaquetário: -${penalty}`);
    alerts.push("Antiplaquetários afetam agregação plaquetária");
  }

  // === COMORBIDADES ===

  // Diabetes descompensado
  if (comorbidities.diabetes_uncontrolled) {
    const penalty = 20;
    score -= penalty;
    reason_codes.push("DIABETES_UNCONTROLLED");
    penalties_applied.push(`Diabetes descompensado: -${penalty}`);
    alerts.push("Diabetes descompensado compromete cicatrização");
  } else if (comorbidities.has_diabetes) {
    const penalty = 5;
    score -= penalty;
    reason_codes.push("DIABETES_CONTROLLED");
    penalties_applied.push(`Diabetes controlado: -${penalty}`);
  }

  // Doença renal/hepática
  if (comorbidities.renal_hepatic_disease) {
    const penalty = 15;
    score -= penalty;
    reason_codes.push("RENAL_HEPATIC_DISEASE");
    penalties_applied.push(`Doença renal/hepática: -${penalty}`);
    alerts.push("Disfunção renal/hepática pode afetar metabolismo de fatores de crescimento");
  }

  // === LABS (apenas válidos) ===
  const labPenalties = getLabPenalties(canonical, validLabs);
  for (const lp of labPenalties) {
    score -= lp.penalty;
    reason_codes.push(lp.reason_code);
    penalties_applied.push(lp.reason_code + `: -${lp.penalty}`);
    if (lp.alert) {
      alerts.push(lp.alert);
    }
  }

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));

  // Determinar confidence baseado em labs essenciais
  const confidence = getBRSConfidence(validLabs, dieOutput);

  return {
    score: Math.round(score),
    confidence,
    alerts,
    reason_codes,
    penalties_applied,
  };
}

function getSmokingPenalty(
  status: string, 
  quitBucket: string | null
): PenaltyResult {
  switch (status) {
    case "current":
      return {
        penalty: 20,
        reason_code: "CURRENT_SMOKER",
        alert: "Tabagismo ativo reduz significativamente potencial regenerativo",
      };
    case "former":
      if (quitBucket === "lt_6m") {
        return {
          penalty: 15,
          reason_code: "FORMER_SMOKER_LT_6M",
          alert: "Ex-fumante recente (< 6 meses) - recuperação biológica em andamento",
        };
      } else if (quitBucket === "m6_12") {
        return {
          penalty: 8,
          reason_code: "FORMER_SMOKER_6_12M",
        };
      } else if (quitBucket === "gt_12m") {
        return {
          penalty: 3,
          reason_code: "FORMER_SMOKER_GT_12M",
        };
      }
      return { penalty: 10, reason_code: "FORMER_SMOKER_UNKNOWN_DURATION" };
    case "never":
      return { penalty: 0, reason_code: "" };
    default:
      return { penalty: 5, reason_code: "SMOKING_STATUS_UNKNOWN" };
  }
}

function getLabPenalties(
  canonical: RegenCanonical,
  validLabs: Set<string>
): PenaltyResult[] {
  const penalties: PenaltyResult[] = [];
  const { labs } = canonical;

  // Hemoglobina baixa
  if (validLabs.has("hemoglobin") && labs.hemoglobin.parsed_value !== null) {
    const hb = labs.hemoglobin.parsed_value;
    if (hb < 10) {
      penalties.push({
        penalty: 20,
        reason_code: "SEVERE_ANEMIA",
        alert: "Anemia severa - considerar investigação e tratamento",
      });
    } else if (hb < 12) {
      penalties.push({
        penalty: 10,
        reason_code: "MILD_ANEMIA",
        alert: "Anemia leve a moderada pode afetar regeneração",
      });
    }
  }

  // Plaquetas baixas
  if (validLabs.has("platelets") && labs.platelets.parsed_value !== null) {
    const plt = labs.platelets.parsed_value;
    if (plt < 100) {
      penalties.push({
        penalty: 25,
        reason_code: "THROMBOCYTOPENIA",
        alert: "Plaquetopenia - contraindicação relativa para PRP",
      });
    } else if (plt < 150) {
      penalties.push({
        penalty: 10,
        reason_code: "LOW_PLATELETS",
        alert: "Contagem de plaquetas no limite inferior",
      });
    }
  }

  // PCR elevado (inflamação)
  if (validLabs.has("crp") && labs.crp.parsed_value !== null) {
    const crp = labs.crp.parsed_value;
    if (crp > 10) {
      penalties.push({
        penalty: 15,
        reason_code: "HIGH_CRP",
        alert: "PCR elevado indica processo inflamatório ativo",
      });
    } else if (crp > 5) {
      penalties.push({
        penalty: 8,
        reason_code: "ELEVATED_CRP",
      });
    }
  }

  // Ferritina baixa
  if (validLabs.has("ferritin") && labs.ferritin.parsed_value !== null) {
    const ferr = labs.ferritin.parsed_value;
    if (ferr < 15) {
      penalties.push({
        penalty: 12,
        reason_code: "LOW_FERRITIN",
        alert: "Ferritina baixa - considerar reposição de ferro",
      });
    } else if (ferr < 30) {
      penalties.push({
        penalty: 5,
        reason_code: "BORDERLINE_FERRITIN",
      });
    }
  }

  // HbA1c elevada
  if (validLabs.has("hba1c") && labs.hba1c.parsed_value !== null) {
    const hba1c = labs.hba1c.parsed_value;
    if (hba1c > 9) {
      penalties.push({
        penalty: 20,
        reason_code: "VERY_HIGH_HBA1C",
        alert: "Controle glicêmico muito inadequado",
      });
    } else if (hba1c > 7.5) {
      penalties.push({
        penalty: 10,
        reason_code: "HIGH_HBA1C",
        alert: "Controle glicêmico subótimo",
      });
    }
  }

  return penalties;
}

function getBRSConfidence(validLabs: Set<string>, dieOutput: DIEOutput): "High" | "Medium" | "Low" {
  const essentialLabs = ["hemoglobin", "platelets", "leukocytes"];

  // Labs com validade conhecida (VALID ou CAUTION) — excluem UNKNOWN (sem data de coleta)
  const confirmedValidLabs = new Set(
    dieOutput.lab_recommendations
      .filter(r => r.status === "USE" && r.validity !== "UNKNOWN")
      .map(r => r.lab_code)
  );

  const essentialConfirmed = essentialLabs.filter(lab => confirmedValidLabs.has(lab)).length;
  const essentialPresent = essentialLabs.filter(lab => validLabs.has(lab)).length;

  // Alta confiança só com labs de data conhecida e dentro da validade
  if (essentialConfirmed === 3) {
    return "High";
  }
  // Média confiança: 2+ labs confirmados, ou 3 labs presentes mas sem data
  if (essentialConfirmed >= 2 || essentialPresent === 3) {
    return "Medium";
  }
  return "Low";
}
