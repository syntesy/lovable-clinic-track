/**
 * mapAnalyzeLabsToCanonical
 *
 * Converte a saída normalizada do Edge Function analyze-labs para o formato
 * RegenCanonical.labs, permitindo pré-preencher o scoring engine a partir de
 * um PDF de exame laboratorial.
 *
 * Suporta múltiplos PDFs via mergeCanonicalLabs (o valor mais recente vence
 * por campo — campo com parsed_ok:true sobrepõe campo vazio/inválido).
 */

import { RegenLabValue, defaultLabValue } from "@/types/regen-canonical";

// Tipo parcial dos labs canônicos (sem collected_date e source, que são adicionados externamente)
export type CanonicalLabsFields = {
  hemoglobin: RegenLabValue;
  hematocrit: RegenLabValue;
  leukocytes: RegenLabValue;
  platelets: RegenLabValue;
  crp: RegenLabValue;
  ferritin: RegenLabValue;
  glucose: RegenLabValue;
  hba1c: RegenLabValue;
};

// Confiança de parser → notas legíveis para o usuário
export type LabConfidence = "high" | "medium" | "low" | "not_found";

export interface MappedLabField extends RegenLabValue {
  confidence: LabConfidence;
}

export type MappedCanonicalLabs = {
  [K in keyof CanonicalLabsFields]: MappedLabField;
} & {
  collected_date: string | null;
  run_id: string | null;
};

// Mapa: nome canônico do analyze-labs → campo do RegenCanonical.labs
const ANALYZE_TO_CANONICAL: Record<string, keyof CanonicalLabsFields> = {
  "Hemoglobina":  "hemoglobin",
  "Hematócrito":  "hematocrit",
  "Leucócitos":   "leukocytes",
  "Plaquetas":    "platelets",
  "PCR":          "crp",
  "Ferritina":    "ferritin",
  "Glicose":      "glucose",
  "HbA1c":        "hba1c",
};

// Unidades esperadas por campo (para nota informativa)
const EXPECTED_UNITS: Partial<Record<keyof CanonicalLabsFields, string>> = {
  hemoglobin:  "g/dL",
  hematocrit:  "%",
  leukocytes:  "mil/mm³",
  platelets:   "mil/mm³",
  crp:         "mg/L",
  ferritin:    "ng/mL",
  glucose:     "mg/dL",
  hba1c:       "%",
};

interface NormalizedLabItem {
  name: string;
  value: number | null;
  unit: string | null;
  reference_range: string | null;
  flag: "low" | "normal" | "high" | "unknown";
  source_line: string;
  parser_confidence: "high" | "medium" | "low";
  is_interpretable: boolean;
  blocking_reasons: string[];
}

/**
 * Converte a lista de labs normalizados do analyze-labs para MappedCanonicalLabs.
 * Campos não encontrados ficam com confidence: "not_found".
 */
export function mapAnalyzeLabsToCanonical(
  normalizedLabs: NormalizedLabItem[],
  collectedDate: string | null,
  runId: string | null
): MappedCanonicalLabs {
  // Indexa pelo nome canônico
  const byName = new Map<string, NormalizedLabItem>();
  for (const lab of normalizedLabs) {
    byName.set(lab.name, lab);
  }

  const emptyField = (canonicalKey: keyof CanonicalLabsFields): MappedLabField => ({
    ...defaultLabValue,
    confidence: "not_found",
  });

  const result: MappedCanonicalLabs = {
    hemoglobin:  emptyField("hemoglobin"),
    hematocrit:  emptyField("hematocrit"),
    leukocytes:  emptyField("leukocytes"),
    platelets:   emptyField("platelets"),
    crp:         emptyField("crp"),
    ferritin:    emptyField("ferritin"),
    glucose:     emptyField("glucose"),
    hba1c:       emptyField("hba1c"),
    collected_date: collectedDate,
    run_id: runId,
  };

  for (const [analyzeName, canonicalKey] of Object.entries(ANALYZE_TO_CANONICAL)) {
    const lab = byName.get(analyzeName);
    if (!lab) continue;

    const expectedUnit = EXPECTED_UNITS[canonicalKey];
    const unitMismatch = lab.unit && expectedUnit && lab.unit !== expectedUnit;

    result[canonicalKey] = {
      raw_value: lab.value !== null ? String(lab.value) : null,
      parsed_value: lab.value,
      unit: lab.unit ?? expectedUnit ?? null,
      parsed_ok: lab.value !== null && lab.is_interpretable,
      notes: [
        lab.blocking_reasons.length > 0 ? `Bloqueios: ${lab.blocking_reasons.join(", ")}` : null,
        unitMismatch ? `Unidade extraída (${lab.unit}) difere do esperado (${expectedUnit})` : null,
      ].filter(Boolean).join(" | ") || null,
      confidence: lab.is_interpretable ? lab.parser_confidence : "low",
    };
  }

  return result;
}

/**
 * Mescla dois conjuntos de labs canônicos.
 * Regra: campo com parsed_ok:true e confidence >= medium sobrepõe campo vazio/inválido.
 * Se ambos têm valor, o `incoming` (mais recente) vence.
 */
export function mergeCanonicalLabs(
  existing: MappedCanonicalLabs,
  incoming: MappedCanonicalLabs
): MappedCanonicalLabs {
  const CANONICAL_FIELDS: (keyof CanonicalLabsFields)[] = [
    "hemoglobin", "hematocrit", "leukocytes", "platelets",
    "crp", "ferritin", "glucose", "hba1c",
  ];

  const merged = { ...existing };

  for (const field of CANONICAL_FIELDS) {
    const incomingField = incoming[field];
    const existingField = existing[field];

    const incomingHasValue = incomingField.parsed_ok && incomingField.parsed_value !== null;
    const existingHasValue = existingField.parsed_ok && existingField.parsed_value !== null;

    // Incoming vence se tiver valor (mais recente)
    if (incomingHasValue) {
      merged[field] = incomingField;
    } else if (!existingHasValue && incomingField.confidence !== "not_found") {
      // Nenhum tem valor mas incoming tem info parcial — mantém o que tem mais informação
      merged[field] = incomingField;
    }
    // Senão mantém existing
  }

  // collected_date: usa o mais recente que não seja null
  if (incoming.collected_date && existing.collected_date) {
    merged.collected_date = incoming.collected_date > existing.collected_date
      ? incoming.collected_date
      : existing.collected_date;
  } else {
    merged.collected_date = incoming.collected_date ?? existing.collected_date;
  }

  // run_id: guarda ambos como string separada por vírgula (para rastreabilidade)
  const runIds = [existing.run_id, incoming.run_id].filter(Boolean);
  merged.run_id = runIds.length > 0 ? runIds.join(",") : null;

  return merged;
}

/**
 * Converte MappedCanonicalLabs para o formato RegenCanonical.labs,
 * pronto para salvar no banco.
 */
export function toRegenCanonicalLabs(
  mapped: MappedCanonicalLabs,
  source: "ocr" | "manual" | "integration" = "ocr"
): {
  hemoglobin: RegenLabValue;
  hematocrit: RegenLabValue;
  leukocytes: RegenLabValue;
  platelets: RegenLabValue;
  crp: RegenLabValue;
  ferritin: RegenLabValue;
  glucose: RegenLabValue;
  hba1c: RegenLabValue;
  collected_date: string | null;
  source: "manual" | "ocr" | "integration" | null;
} {
  const strip = ({ confidence: _c, ...rest }: MappedLabField): RegenLabValue => rest;
  return {
    hemoglobin:     strip(mapped.hemoglobin),
    hematocrit:     strip(mapped.hematocrit),
    leukocytes:     strip(mapped.leukocytes),
    platelets:      strip(mapped.platelets),
    crp:            strip(mapped.crp),
    ferritin:       strip(mapped.ferritin),
    glucose:        strip(mapped.glucose),
    hba1c:          strip(mapped.hba1c),
    collected_date: mapped.collected_date,
    source,
  };
}
