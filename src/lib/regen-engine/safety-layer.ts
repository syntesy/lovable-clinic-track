/**
 * SAFETY LAYER - Camada 1
 * 
 * Verifica contraindicações absolutas.
 * Se block=true, as demais camadas não são calculadas.
 */

import { RegenCanonical } from "@/types/regen-canonical";
import { SafetyOutput } from "@/types/regen-engine";

export function computeSafety(canonical: RegenCanonical): SafetyOutput {
  const reasons: string[] = [];
  let block = false;
  let alert = false;

  // Verificar campos de segurança
  const { safety } = canonical;

  // Câncer ativo ou tratamento recente
  if (safety.cancer_tx_now_or_last_12m === "yes") {
    block = true;
    reasons.push("CANCER_ACTIVE_OR_RECENT_TX");
  } else if (safety.cancer_tx_now_or_last_12m === "unknown") {
    alert = true;
    reasons.push("CANCER_STATUS_UNKNOWN");
  }

  // Febre nos últimos 7 dias
  if (safety.fever_last_7d === "yes") {
    block = true;
    reasons.push("FEVER_LAST_7D");
  } else if (safety.fever_last_7d === "unknown") {
    alert = true;
    reasons.push("FEVER_STATUS_UNKNOWN");
  }

  // Infecção de pele no local
  if (safety.open_wound_or_skin_infection_at_pain_site === "yes") {
    block = true;
    reasons.push("SKIN_INFECTION_AT_SITE");
  } else if (safety.open_wound_or_skin_infection_at_pain_site === "unknown") {
    alert = true;
    reasons.push("SKIN_INFECTION_STATUS_UNKNOWN");
  }

  // Infecção ativa (derivado)
  if (safety.active_infection) {
    block = true;
    if (!reasons.includes("FEVER_LAST_7D") && !reasons.includes("SKIN_INFECTION_AT_SITE")) {
      reasons.push("ACTIVE_INFECTION");
    }
  }

  // Doença autoimune ativa
  if (safety.autoimmune_disease_active) {
    block = true;
    reasons.push("AUTOIMMUNE_DISEASE_ACTIVE");
  }

  return {
    block,
    alert,
    reasons,
  };
}
