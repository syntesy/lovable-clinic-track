/**
 * REGEN ENGINE ORCHESTRATOR v1.0.0
 * 
 * ⚠️ MOTOR CONGELADO - NÃO ALTERAR REGRAS CLÍNICAS
 * 
 * Executa as camadas na ordem obrigatória:
 * Safety → CRS → DIE → BRS → TOG → PEE → (LOT) → Audit
 * 
 * ====================================================================
 * GUARD: FONTE ÚNICA DE DADOS
 * ====================================================================
 * Este motor lê EXCLUSIVAMENTE de RegenCanonical.
 * 
 * ❌ PROIBIDO:
 *   - Ler campos legacy de questionnaire_responses diretamente
 *   - Acessar FisioRegenFormData ou dados do wizard
 *   - Buscar dados de outras tabelas (patients, prp_screenings.*)
 * 
 * ✅ PERMITIDO:
 *   - Ler apenas RegenCanonical passado como parâmetro
 * 
 * Qualquer violação desta regra invalida a versão do motor.
 * ====================================================================
 * 
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
 * 
 * @param canonical - ÚNICA fonte de dados permitida (RegenCanonical)
 * @returns RegenEngineOutputs com todas as camadas processadas
 * 
 * ⚠️ GUARD: Esta função NÃO deve receber nenhum outro parâmetro além de canonical.
 * Se você precisar de dados adicionais, eles DEVEM estar no RegenCanonical.
 */
export function runRegenEngine(canonical: RegenCanonical): RegenEngineOutputs {
  // GUARD: Validar que recebemos um canonical válido
  if (!canonical || canonical.schema_version !== "regen_canonical_v1") {
    throw new Error(
      "REGEN ENGINE ERROR: Invalid or missing regen_canonical. " +
      "Engine reads ONLY from regen_canonical (schema_version=regen_canonical_v1)."
    );
  }

  const computedAt = new Date().toISOString();
  
  // Inicializar output com versões congeladas
  const output: RegenEngineOutputs = {
    ...defaultEngineOutputs,
    engine_version: "regen_engine_v1.0.0",
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
    // Aceitar tanto a versão congelada quanto versões anteriores
    if (outputs.ruleset_version === "regen_rules_v1") {
      return outputs;
    }
  }
  
  return null;
}

/**
 * ====================================================================
 * TESTES CRÍTICOS OBRIGATÓRIOS (v1.0.0)
 * ====================================================================
 * 
 * Antes de qualquer deploy, validar manualmente:
 * 
 * 1. TESTE SAFETY BLOCK
 *    - Input: safety.cancer_tx_now_or_last_12m = "yes"
 *    - Expected: safety.block = true, crs/die/brs/tog/pee = null
 * 
 * 2. TESTE NSAID RECENT
 *    - Input: medications.nsaid_recent_7d = "yes"
 *    - Expected: PRP eligibility !== "Recommended"
 *    - reason_code inclui "NSAID_RECENT_7D"
 * 
 * 3. TESTE LABS EXPIRADOS
 *    - Input: labs.hemoglobin.collected_date > 90 dias atrás
 *    - Expected: DIE status = "REPEAT", BRS não usa valor
 * 
 * ====================================================================
 */
