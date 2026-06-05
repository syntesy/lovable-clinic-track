/**
 * @testSuite brs-layer — Camada 4 do motor clínico (Biological Readiness Score)
 *
 * Trava o comportamento ATUAL de computeBRS().
 * Base 100; penalidades por tabagismo, medicações, comorbidades e labs válidos.
 */

import { describe, it, expect } from "vitest";
import { computeBRS } from "@/lib/regen-engine/brs-layer";
import { computeDIE } from "@/lib/regen-engine/die-layer";
import { defaultRegenCanonical, defaultLabValue } from "@/types/regen-canonical";
import type { RegenCanonical, RegenLabValue } from "@/types/regen-canonical";
import type { DIEOutput } from "@/types/regen-engine";

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/** Canonical limpo (zero penalidades) */
function cleanCanonical(): RegenCanonical {
  return {
    ...defaultRegenCanonical,
    smoking: { status: "never", quit_bucket: null },
    medications: {
      nsaid_recent_14d: "no",
      days_since_last_nsaid: null,
      steroid_recent: "no",
      steroid_route: null,
      days_since_last_steroid: null,
      anticoagulant: false,
      immunosuppressor: false,
      aspirin: false,
      p2y12: false,
    },
    comorbidities: {
      has_diabetes: false,
      has_hypertension: false,
      has_dyslipidemia: false,
      diabetes_uncontrolled: false,
      renal_hepatic_disease: false,
    },
  };
}

/** DIE sem labs → nenhuma penalidade de lab no BRS */
function emptyDIE(): DIEOutput {
  return computeDIE(defaultRegenCanonical);
}

/** DIE com um lab válido e com valor */
function dieWithLab(
  labKey: keyof RegenCanonical["labs"],
  value: Partial<RegenLabValue>,
  daysAgo = 10
): DIEOutput {
  const c: RegenCanonical = {
    ...defaultRegenCanonical,
    labs: {
      ...defaultRegenCanonical.labs,
      collected_date: isoDateDaysAgo(daysAgo),
      [labKey]: { ...defaultLabValue, ...value },
    },
  };
  return computeDIE(c);
}

// ── Score base ────────────────────────────────────────────────────────────────

describe("computeBRS — score base", () => {
  it("canonical limpo → score=100, sem reason_codes", () => {
    const result = computeBRS(cleanCanonical(), emptyDIE());
    expect(result.score).toBe(100);
    expect(result.reason_codes).toHaveLength(0);
  });
});

// ── Tabagismo ─────────────────────────────────────────────────────────────────

describe("computeBRS — penalidades por tabagismo", () => {
  it("fumante ativo → -20, CURRENT_SMOKER", () => {
    const c = { ...cleanCanonical(), smoking: { status: "current" as const, quit_bucket: null } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(80);
    expect(result.reason_codes).toContain("CURRENT_SMOKER");
  });

  it("ex-fumante <6m → -15, FORMER_SMOKER_LT_6M", () => {
    const c = { ...cleanCanonical(), smoking: { status: "former" as const, quit_bucket: "lt_6m" as const } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(85);
    expect(result.reason_codes).toContain("FORMER_SMOKER_LT_6M");
  });

  it("ex-fumante 6-12m → -8, FORMER_SMOKER_6_12M", () => {
    const c = { ...cleanCanonical(), smoking: { status: "former" as const, quit_bucket: "m6_12" as const } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(92);
    expect(result.reason_codes).toContain("FORMER_SMOKER_6_12M");
  });

  it("ex-fumante >12m → -3, FORMER_SMOKER_GT_12M", () => {
    const c = { ...cleanCanonical(), smoking: { status: "former" as const, quit_bucket: "gt_12m" as const } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(97);
    expect(result.reason_codes).toContain("FORMER_SMOKER_GT_12M");
  });

  it("tabagismo unknown → -5, SMOKING_STATUS_UNKNOWN", () => {
    const c = { ...cleanCanonical(), smoking: { status: "unknown" as const, quit_bucket: null } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(95);
    expect(result.reason_codes).toContain("SMOKING_STATUS_UNKNOWN");
  });

  it("nunca fumou → sem penalidade", () => {
    const c = { ...cleanCanonical(), smoking: { status: "never" as const, quit_bucket: null } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(100);
    expect(result.reason_codes).not.toContain("CURRENT_SMOKER");
  });
});

// ── Medicações ────────────────────────────────────────────────────────────────

describe("computeBRS — penalidades por medicações", () => {
  it("AINE recente → -15, NSAID_RECENT_14D", () => {
    const c = { ...cleanCanonical(), medications: { ...cleanCanonical().medications, nsaid_recent_14d: "yes" as const } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(85);
    expect(result.reason_codes).toContain("NSAID_RECENT_14D");
  });

  it("corticoide infiltração local → -20, STEROID_LOCAL_RECENT", () => {
    const c = {
      ...cleanCanonical(),
      medications: {
        ...cleanCanonical().medications,
        steroid_recent: "yes" as const,
        steroid_route: "local_infiltration" as const,
      },
    };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(80);
    expect(result.reason_codes).toContain("STEROID_LOCAL_RECENT");
  });

  it("corticoide sistêmico → -10, STEROID_SYSTEMIC_RECENT", () => {
    const c = {
      ...cleanCanonical(),
      medications: {
        ...cleanCanonical().medications,
        steroid_recent: "yes" as const,
        steroid_route: "systemic" as const,
      },
    };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(90);
    expect(result.reason_codes).toContain("STEROID_SYSTEMIC_RECENT");
  });

  it("anticoagulante → -10, ANTICOAGULANT_USE", () => {
    const c = { ...cleanCanonical(), medications: { ...cleanCanonical().medications, anticoagulant: true } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(90);
    expect(result.reason_codes).toContain("ANTICOAGULANT_USE");
  });

  it("imunossupressor → -15, IMMUNOSUPPRESSOR_USE", () => {
    const c = { ...cleanCanonical(), medications: { ...cleanCanonical().medications, immunosuppressor: true } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(85);
    expect(result.reason_codes).toContain("IMMUNOSUPPRESSOR_USE");
  });

  it("antiplaquetário (aspirin) → -10, ANTIPLATELET_USE", () => {
    const c = { ...cleanCanonical(), medications: { ...cleanCanonical().medications, aspirin: true } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(90);
    expect(result.reason_codes).toContain("ANTIPLATELET_USE");
  });
});

// ── Comorbidades ──────────────────────────────────────────────────────────────

describe("computeBRS — penalidades por comorbidades", () => {
  it("diabetes descompensado → -20, DIABETES_UNCONTROLLED", () => {
    const c = { ...cleanCanonical(), comorbidities: { ...cleanCanonical().comorbidities, has_diabetes: true, diabetes_uncontrolled: true } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(80);
    expect(result.reason_codes).toContain("DIABETES_UNCONTROLLED");
    expect(result.reason_codes).not.toContain("DIABETES_CONTROLLED");
  });

  it("diabetes controlado → -5, DIABETES_CONTROLLED", () => {
    const c = { ...cleanCanonical(), comorbidities: { ...cleanCanonical().comorbidities, has_diabetes: true, diabetes_uncontrolled: false } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(95);
    expect(result.reason_codes).toContain("DIABETES_CONTROLLED");
  });

  it("doença renal/hepática → -15, RENAL_HEPATIC_DISEASE", () => {
    const c = { ...cleanCanonical(), comorbidities: { ...cleanCanonical().comorbidities, renal_hepatic_disease: true } };
    const result = computeBRS(c, emptyDIE());
    expect(result.score).toBe(85);
    expect(result.reason_codes).toContain("RENAL_HEPATIC_DISEASE");
  });
});

// ── Labs (penalidades aplicadas só em labs válidos) ───────────────────────────

describe("computeBRS — penalidades de labs (apenas em labs válidos)", () => {
  it("hemoglobin<10 (anemia severa) → -20, SEVERE_ANEMIA", () => {
    const canonical: RegenCanonical = {
      ...cleanCanonical(),
      labs: { ...defaultRegenCanonical.labs, collected_date: isoDateDaysAgo(10), hemoglobin: { raw_value: "9", parsed_ok: true, parsed_value: 9, unit: "g/dL", notes: null } },
    };
    const die = computeDIE(canonical);
    const result = computeBRS(canonical, die);
    expect(result.reason_codes).toContain("SEVERE_ANEMIA");
    expect(result.score).toBe(80);
  });

  it("hemoglobin 10-12 (anemia leve) → -10, MILD_ANEMIA", () => {
    const canonical: RegenCanonical = {
      ...cleanCanonical(),
      labs: { ...defaultRegenCanonical.labs, collected_date: isoDateDaysAgo(10), hemoglobin: { raw_value: "11", parsed_ok: true, parsed_value: 11, unit: "g/dL", notes: null } },
    };
    const die = computeDIE(canonical);
    const result = computeBRS(canonical, die);
    expect(result.reason_codes).toContain("MILD_ANEMIA");
    expect(result.score).toBe(90);
  });

  it("platelets<100 (trombocitopenia) → -25, THROMBOCYTOPENIA", () => {
    const canonical: RegenCanonical = {
      ...cleanCanonical(),
      labs: { ...defaultRegenCanonical.labs, collected_date: isoDateDaysAgo(10), platelets: { raw_value: "80", parsed_ok: true, parsed_value: 80, unit: "mil/µL", notes: null } },
    };
    const die = computeDIE(canonical);
    const result = computeBRS(canonical, die);
    expect(result.reason_codes).toContain("THROMBOCYTOPENIA");
    expect(result.score).toBe(75);
  });

  it("PCR>10 → -15, HIGH_CRP", () => {
    const canonical: RegenCanonical = {
      ...cleanCanonical(),
      labs: { ...defaultRegenCanonical.labs, collected_date: isoDateDaysAgo(10), crp: { raw_value: "15", parsed_ok: true, parsed_value: 15, unit: "mg/L", notes: null } },
    };
    const die = computeDIE(canonical);
    const result = computeBRS(canonical, die);
    expect(result.reason_codes).toContain("HIGH_CRP");
    expect(result.score).toBe(85);
  });

  it("lab EXPIRED não gera penalidade no BRS", () => {
    const canonical: RegenCanonical = {
      ...cleanCanonical(),
      labs: { ...defaultRegenCanonical.labs, collected_date: isoDateDaysAgo(91), hemoglobin: { raw_value: "9", parsed_ok: true, parsed_value: 9, unit: "g/dL", notes: null } },
    };
    const die = computeDIE(canonical);
    // hemoglobin está EXPIRED → não entra no BRS
    const result = computeBRS(canonical, die);
    expect(result.reason_codes).not.toContain("SEVERE_ANEMIA");
    expect(result.score).toBe(100);
  });
});

// ── Clamp ─────────────────────────────────────────────────────────────────────

describe("computeBRS — clamp 0-100", () => {
  it("score nunca fica negativo com múltiplas penalidades", () => {
    const canonical: RegenCanonical = {
      ...cleanCanonical(),
      smoking: { status: "current", quit_bucket: null },
      medications: { ...cleanCanonical().medications, nsaid_recent_14d: "yes", immunosuppressor: true, anticoagulant: true, aspirin: true },
      comorbidities: { has_diabetes: true, has_hypertension: false, has_dyslipidemia: false, diabetes_uncontrolled: true, renal_hepatic_disease: true },
      labs: {
        ...defaultRegenCanonical.labs,
        collected_date: isoDateDaysAgo(10),
        hemoglobin: { raw_value: "9", parsed_ok: true, parsed_value: 9, unit: "g/dL", notes: null },
        platelets: { raw_value: "80", parsed_ok: true, parsed_value: 80, unit: "mil/µL", notes: null },
        crp: { raw_value: "15", parsed_ok: true, parsed_value: 15, unit: "mg/L", notes: null },
      },
    };
    const die = computeDIE(canonical);
    const result = computeBRS(canonical, die);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
