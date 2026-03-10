/**
 * @testSuite tog-layer — GUIDANCE_MAP coverage
 * @auditRef BUG#3 — Auditoria REGHEN Março/2026
 * 
 * Histórico: BRS e CRS geravam 3 reason_codes sem mapeamento no GUIDANCE_MAP
 * (SMOKING_STATUS_UNKNOWN, FORMER_SMOKER_GT_12M, LOW_PAIN_LTE_2).
 * Pacientes recebiam penalidade no score sem orientação correspondente.
 * Corrigido em Março/2026. Este teste garante cobertura total futura.
 */

import { describe, it, expect } from "vitest";
import { GUIDANCE_MAP } from "@/lib/regen-engine/tog-layer";

// Todos os reason_codes que BRS e CRS podem gerar (extraídos do código-fonte)
const BRS_REASON_CODES = [
  // Tabagismo
  "CURRENT_SMOKER",
  "FORMER_SMOKER_LT_6M",
  "FORMER_SMOKER_6_12M",
  "FORMER_SMOKER_GT_12M",
  "FORMER_SMOKER_UNKNOWN_DURATION",
  "SMOKING_STATUS_UNKNOWN",
  // Medicações
  "NSAID_RECENT_14D",
  "STEROID_LOCAL_RECENT",
  "STEROID_SYSTEMIC_RECENT",
  "ANTICOAGULANT_USE",
  "IMMUNOSUPPRESSOR_USE",
  "ANTIPLATELET_USE",
  // Comorbidades
  "DIABETES_UNCONTROLLED",
  "DIABETES_CONTROLLED",
  "RENAL_HEPATIC_DISEASE",
  // Labs
  "SEVERE_ANEMIA",
  "MILD_ANEMIA",
  "THROMBOCYTOPENIA",
  "LOW_PLATELETS",
  "HIGH_CRP",
  "ELEVATED_CRP",
  "LOW_FERRITIN",
  "BORDERLINE_FERRITIN",
  "VERY_HIGH_HBA1C",
  "HIGH_HBA1C",
];

const CRS_REASON_CODES = [
  "ACUTE_SYMPTOMS_LT_3M",
  "CHRONIC_SYMPTOMS_GT_6M",
  "SEVERE_PAIN_GTE_9",
  "HIGH_PAIN_7_8",
  "LOW_PAIN_LTE_2",
];

const ALL_KNOWN_REASON_CODES = [...BRS_REASON_CODES, ...CRS_REASON_CODES];

describe("TOG GUIDANCE_MAP — cobertura completa de reason_codes", () => {
  it("GUIDANCE_MAP deve ter entrada para cada reason_code conhecido do BRS e CRS", () => {
    const unmapped = ALL_KNOWN_REASON_CODES.filter(
      (code) => !(code in GUIDANCE_MAP)
    );
    expect(
      unmapped,
      `Reason codes sem mapeamento no GUIDANCE_MAP: ${unmapped.join(", ")}`
    ).toEqual([]);
  });

  // Testes individuais para os 3 adicionados na Etapa 2
  it("GUIDANCE_MAP deve conter SMOKING_STATUS_UNKNOWN com campos obrigatórios", () => {
    const entry = GUIDANCE_MAP["SMOKING_STATUS_UNKNOWN"];
    expect(entry).toBeDefined();
    expect(entry.category).toBeTruthy();
    expect(entry.title).toBeTruthy();
    expect(entry.description).toBeTruthy();
    expect(entry.priority).toBeTruthy();
  });

  it("GUIDANCE_MAP deve conter FORMER_SMOKER_GT_12M com campos obrigatórios", () => {
    const entry = GUIDANCE_MAP["FORMER_SMOKER_GT_12M"];
    expect(entry).toBeDefined();
    expect(entry.category).toBe("lifestyle");
    expect(entry.title).toBeTruthy();
    expect(entry.description).toBeTruthy();
    expect(entry.priority).toBeTruthy();
  });

  it("GUIDANCE_MAP deve conter LOW_PAIN_LTE_2 com campos obrigatórios", () => {
    const entry = GUIDANCE_MAP["LOW_PAIN_LTE_2"];
    expect(entry).toBeDefined();
    expect(entry.category).toBe("general");
    expect(entry.title).toBeTruthy();
    expect(entry.description).toBeTruthy();
    expect(entry.priority).toBeTruthy();
  });

  // Validação estrutural de todas as entradas
  it("cada entrada do GUIDANCE_MAP deve ter category, title, description e priority válidos", () => {
    for (const [code, entry] of Object.entries(GUIDANCE_MAP)) {
      expect(entry.category, `${code}.category`).toBeTruthy();
      expect(entry.title, `${code}.title`).toBeTruthy();
      expect(entry.description, `${code}.description`).toBeTruthy();
      expect(["high", "medium", "low"], `${code}.priority válido`).toContain(entry.priority);
    }
  });
});
