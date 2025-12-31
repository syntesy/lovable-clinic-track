/**
 * REGEN ENGINE ORCHESTRATOR
 * 
 * Executa as camadas na ordem obrigatória:
 * Safety → CRS → DIE → BRS → TOG → PEE → (LOT) → Audit
 * 
 * Lê exclusivamente de regen_canonical.
 * Produz regen_engine_outputs.
 */

import { RegenCanonical } from "@/types/regen-canonical";
import { RegenEngineOutputs, defaultEngineOutputs, DataQualityOutput } from "@/types/regen-engine";
import { computeSafety } from "./safety-layer";
import { computeCRS } from "./crs-layer";
import { computeDIE } from "./die-layer";
import { computeBRS } from "./brs-layer";
import { computeTOG } from "./tog-layer";
import { computePEE } from "./pee-layer";

/**
 * Executa o motor clínico completo
 */
export function runRegenEngine(canonical: RegenCanonical): RegenEngineOutputs {
  const computedAt = new Date().toISOString();
  
  // Inicializar output
  const output: RegenEngineOutputs = {
    ...defaultEngineOutputs,
    ruleset_version: "regen_rules_v1",
    computed_at: computedAt,
  };

  // === CAMADA 1: SAFETY ===
  output.safety = computeSafety(canonical);

  // Se safety.block = true, não calcular demais camadas
  if (output.safety.block) {
    output.data_quality = computeDataQuality(canonical, true);
    return output;
  }

  // === CAMADA 2: CRS ===
  output.crs = computeCRS(canonical);

  // === CAMADA 3: DIE ===
  output.die = computeDIE(canonical);

  // === CAMADA 4: BRS ===
  output.brs = computeBRS(canonical, output.die);

  // === CAMADA 5: TOG ===
  output.tog = computeTOG(output.brs);

  // === CAMADA 6: PEE ===
  output.pee = computePEE(canonical, output.brs);

  // === DATA QUALITY ===
  output.data_quality = computeDataQuality(canonical, false);

  return output;
}

/**
 * Calcula métricas de qualidade de dados
 */
function computeDataQuality(canonical: RegenCanonical, blocked: boolean): DataQualityOutput {
  const alerts: string[] = [];
  let filledFields = 0;
  let totalFields = 0;

  // Verificar campos essenciais
  const essentialChecks = [
    { field: "complaint.pain_region", value: canonical.complaint.pain_region },
    { field: "complaint.symptom_duration_bucket", value: canonical.complaint.symptom_duration_bucket },
    { field: "complaint.pain_nrs", value: canonical.complaint.pain_nrs },
    { field: "labs.hemoglobin", value: canonical.labs.hemoglobin.parsed_value },
    { field: "labs.platelets", value: canonical.labs.platelets.parsed_value },
    { field: "labs.leukocytes", value: canonical.labs.leukocytes.parsed_value },
    { field: "smoking.status", value: canonical.smoking.status !== "unknown" ? canonical.smoking.status : null },
  ];

  for (const check of essentialChecks) {
    totalFields++;
    if (check.value !== null && check.value !== undefined) {
      filledFields++;
    } else {
      alerts.push(`Campo essencial não preenchido: ${check.field}`);
    }
  }

  // Adicionar alertas do canônico
  for (const alert of canonical.data_quality_alerts) {
    alerts.push(`${alert.field}: ${alert.message}`);
  }

  // Alerta se bloqueado por safety
  if (blocked) {
    alerts.push("Avaliação bloqueada por contraindicação de segurança");
  }

  const completenessPercent = totalFields > 0 
    ? Math.round((filledFields / totalFields) * 100) 
    : 0;

  return {
    alerts,
    completeness_percent: completenessPercent,
  };
}

/**
 * Adiciona regen_engine_outputs ao questionnaire_responses
 */
export function appendEngineOutputs(
  originalResponses: Record<string, unknown>,
  outputs: RegenEngineOutputs
): Record<string, unknown> {
  return {
    ...originalResponses,
    regen_engine_outputs: outputs,
  };
}

/**
 * Extrai regen_engine_outputs de questionnaire_responses se existir
 */
export function extractEngineOutputs(
  questionnaireResponses: unknown
): RegenEngineOutputs | null {
  if (!questionnaireResponses || typeof questionnaireResponses !== "object") {
    return null;
  }
  
  const responses = questionnaireResponses as Record<string, unknown>;
  if (responses.regen_engine_outputs && typeof responses.regen_engine_outputs === "object") {
    const outputs = responses.regen_engine_outputs as RegenEngineOutputs;
    if (outputs.ruleset_version === "regen_rules_v1") {
      return outputs;
    }
  }
  
  return null;
}
