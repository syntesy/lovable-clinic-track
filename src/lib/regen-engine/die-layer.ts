/**
 * DIE LAYER - Camada 3 (Diagnostic Intelligence Engine)
 * 
 * Avalia exames laboratoriais e gera recomendações.
 * EXPIRED nunca entra no BRS.
 * parsed_ok=false → REQUEST.
 */

import { RegenCanonical, RegenLabValue } from "@/types/regen-canonical";
import { DIEOutput, LabRecommendation } from "@/types/regen-engine";
import { LAB_VALIDITY_DAYS, CRITICAL_LAB_CODES } from "@/config/examValidity";

// Nomes amigáveis dos exames
const LAB_NAMES: Record<string, string> = {
  hemoglobin: "Hemoglobina",
  hematocrit: "Hematócrito",
  leukocytes: "Leucócitos",
  platelets: "Plaquetas",
  crp: "PCR (Proteína C-Reativa)",
  ferritin: "Ferritina",
  glucose: "Glicemia",
  hba1c: "Hemoglobina Glicada (HbA1c)",
};

// Exames essenciais para ortobiológicos — fonte: src/config/examValidity.ts
const ESSENTIAL_LABS: readonly string[] = CRITICAL_LAB_CODES;

export function computeDIE(canonical: RegenCanonical): DIEOutput {
  const { labs } = canonical;
  const recommendations: LabRecommendation[] = [];
  
  let validCount = 0;
  let expiredCount = 0;
  let missingCount = 0;

  // Calcular dias desde a coleta (se disponível)
  const collectedDate = labs.collected_date ? new Date(labs.collected_date) : null;
  const now = new Date();
  const daysSinceCollection = collectedDate 
    ? Math.floor((now.getTime() - collectedDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Processar cada exame
  const labKeys: (keyof typeof LAB_NAMES)[] = [
    "hemoglobin", "hematocrit", "leukocytes", "platelets",
    "crp", "ferritin", "glucose", "hba1c"
  ];

  for (const labKey of labKeys) {
    const labValue = labs[labKey as keyof typeof labs] as RegenLabValue;
    const recommendation = evaluateLab(
      labKey,
      labValue,
      daysSinceCollection,
      LAB_VALIDITY_DAYS[labKey]
    );
    
    recommendations.push(recommendation);

    // Contagem
    if (recommendation.status === "USE") {
      validCount++;
    } else if (recommendation.validity === "EXPIRED") {
      expiredCount++;
    } else if (recommendation.status === "REQUEST") {
      missingCount++;
    }
  }

  return {
    lab_recommendations: recommendations,
    labs_valid_count: validCount,
    labs_expired_count: expiredCount,
    labs_missing_count: missingCount,
  };
}

function evaluateLab(
  labCode: string,
  labValue: RegenLabValue,
  daysSinceCollection: number | null,
  validityDays: number
): LabRecommendation {
  const labName = LAB_NAMES[labCode] || labCode;
  const isEssential = ESSENTIAL_LABS.includes(labCode);

  // Caso 1: Sem valor raw → REQUEST
  if (!labValue.raw_value) {
    return {
      lab_code: labCode,
      lab_name: labName,
      status: "REQUEST",
      validity: "UNKNOWN",
      reason_code: isEssential ? "ESSENTIAL_LAB_MISSING" : "LAB_MISSING",
      rationale_short: isEssential 
        ? `${labName} é essencial para avaliação de ortobiológicos`
        : `${labName} não informado`,
      days_since_collection: null,
    };
  }

  // Caso 2: Parse falhou → REQUEST
  if (!labValue.parsed_ok) {
    return {
      lab_code: labCode,
      lab_name: labName,
      status: "REQUEST",
      validity: "UNKNOWN",
      reason_code: "PARSE_ERROR",
      rationale_short: `Valor "${labValue.raw_value}" não pôde ser interpretado`,
      days_since_collection: daysSinceCollection,
    };
  }

  // Caso 3: Verificar validade temporal
  if (daysSinceCollection !== null) {
    if (daysSinceCollection > validityDays) {
      return {
        lab_code: labCode,
        lab_name: labName,
        status: "REPEAT",
        validity: "EXPIRED",
        reason_code: "LAB_EXPIRED",
        rationale_short: `${labName} coletado há ${daysSinceCollection} dias (validade: ${validityDays} dias)`,
        days_since_collection: daysSinceCollection,
      };
    }

    if (daysSinceCollection > validityDays * 0.8) {
      return {
        lab_code: labCode,
        lab_name: labName,
        status: "USE",
        validity: "CAUTION",
        reason_code: "LAB_NEAR_EXPIRY",
        rationale_short: `${labName} próximo do vencimento (${daysSinceCollection}/${validityDays} dias)`,
        days_since_collection: daysSinceCollection,
      };
    }
  }

  // Caso 4: Válido
  return {
    lab_code: labCode,
    lab_name: labName,
    status: "USE",
    validity: daysSinceCollection !== null ? "VALID" : "UNKNOWN",
    reason_code: "LAB_VALID",
    rationale_short: daysSinceCollection !== null
      ? `${labName} válido (${daysSinceCollection}/${validityDays} dias)`
      : `${labName} informado (data de coleta não especificada)`,
    days_since_collection: daysSinceCollection,
  };
}

/**
 * Retorna apenas os labs válidos para uso no BRS
 */
export function getValidLabsForBRS(dieOutput: DIEOutput): Set<string> {
  const validLabs = new Set<string>();
  
  for (const rec of dieOutput.lab_recommendations) {
    // EXPIRED nunca entra no BRS
    if (rec.validity !== "EXPIRED" && rec.status === "USE") {
      validLabs.add(rec.lab_code);
    }
  }
  
  return validLabs;
}
