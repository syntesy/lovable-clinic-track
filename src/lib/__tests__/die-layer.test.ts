/**
 * @testSuite die-layer — Camada 3 do motor clínico (Diagnostic Intelligence Engine)
 *
 * Trava o comportamento ATUAL de computeDIE() e getValidLabsForBRS().
 * Validades: hgb/hct/leuc/plt/gluc=90d, crp=30d, ferr/hba1c=180d.
 * CAUTION quando >80% do prazo; EXPIRED quando >100%.
 */

import { describe, it, expect } from "vitest";
import { computeDIE, getValidLabsForBRS } from "@/lib/regen-engine/die-layer";
import { defaultRegenCanonical, defaultLabValue } from "@/types/regen-canonical";
import type { RegenCanonical, RegenLabValue } from "@/types/regen-canonical";

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function withLab(
  labKey: keyof RegenCanonical["labs"],
  value: Partial<RegenLabValue>,
  collectedDate: string | null = null
): RegenCanonical {
  return {
    ...defaultRegenCanonical,
    labs: {
      ...defaultRegenCanonical.labs,
      collected_date: collectedDate,
      [labKey]: { ...defaultLabValue, ...value },
    },
  };
}

// ── Sem valor (REQUEST) ───────────────────────────────────────────────────────

describe("computeDIE — sem valor raw → REQUEST", () => {
  it("hemoglobin sem raw_value → REQUEST, ESSENTIAL_LAB_MISSING", () => {
    const c = withLab("hemoglobin", { raw_value: null }, null);
    const result = computeDIE(c);
    const hb = result.lab_recommendations.find((r) => r.lab_code === "hemoglobin")!;
    expect(hb.status).toBe("REQUEST");
    expect(hb.reason_code).toBe("ESSENTIAL_LAB_MISSING");
  });

  it("crp sem raw_value → REQUEST, ESSENTIAL_LAB_MISSING (crp agora é essencial — M3)", () => {
    const c = withLab("crp", { raw_value: null }, null);
    const result = computeDIE(c);
    const crp = result.lab_recommendations.find((r) => r.lab_code === "crp")!;
    expect(crp.status).toBe("REQUEST");
    expect(crp.reason_code).toBe("ESSENTIAL_LAB_MISSING");
  });

  it("glucose sem raw_value → REQUEST, LAB_MISSING (não é exame crítico)", () => {
    const c = withLab("glucose", { raw_value: null }, null);
    const result = computeDIE(c);
    const gluc = result.lab_recommendations.find((r) => r.lab_code === "glucose")!;
    expect(gluc.status).toBe("REQUEST");
    expect(gluc.reason_code).toBe("LAB_MISSING");
  });
});

// ── Parse falhou ──────────────────────────────────────────────────────────────

describe("computeDIE — parse falhou → REQUEST", () => {
  it("platelets com parsed_ok=false → REQUEST, PARSE_ERROR", () => {
    const c = withLab("platelets", { raw_value: "abc", parsed_ok: false }, isoDateDaysAgo(10));
    const result = computeDIE(c);
    const plt = result.lab_recommendations.find((r) => r.lab_code === "platelets")!;
    expect(plt.status).toBe("REQUEST");
    expect(plt.reason_code).toBe("PARSE_ERROR");
  });
});

// ── Validade temporal ─────────────────────────────────────────────────────────

describe("computeDIE — validade temporal (hemoglobin, validityDays=90)", () => {
  it("coletado há 91 dias → REPEAT, EXPIRED", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      isoDateDaysAgo(91)
    );
    const result = computeDIE(c);
    const hb = result.lab_recommendations.find((r) => r.lab_code === "hemoglobin")!;
    expect(hb.status).toBe("REPEAT");
    expect(hb.validity).toBe("EXPIRED");
    expect(hb.reason_code).toBe("LAB_EXPIRED");
  });

  it("coletado há 73 dias (>80% de 90) → USE, CAUTION", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      isoDateDaysAgo(73)
    );
    const result = computeDIE(c);
    const hb = result.lab_recommendations.find((r) => r.lab_code === "hemoglobin")!;
    expect(hb.status).toBe("USE");
    expect(hb.validity).toBe("CAUTION");
    expect(hb.reason_code).toBe("LAB_NEAR_EXPIRY");
  });

  it("coletado há 30 dias → USE, VALID", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      isoDateDaysAgo(30)
    );
    const result = computeDIE(c);
    const hb = result.lab_recommendations.find((r) => r.lab_code === "hemoglobin")!;
    expect(hb.status).toBe("USE");
    expect(hb.validity).toBe("VALID");
  });
});

describe("computeDIE — validade CRP (30 dias)", () => {
  it("crp coletado há 31 dias → REPEAT, EXPIRED", () => {
    const c = withLab(
      "crp",
      { raw_value: "3", parsed_ok: true, parsed_value: 3 },
      isoDateDaysAgo(31)
    );
    const result = computeDIE(c);
    const crp = result.lab_recommendations.find((r) => r.lab_code === "crp")!;
    expect(crp.status).toBe("REPEAT");
    expect(crp.validity).toBe("EXPIRED");
  });

  it("crp coletado há 25 dias (>80% de 30) → USE, CAUTION", () => {
    const c = withLab(
      "crp",
      { raw_value: "3", parsed_ok: true, parsed_value: 3 },
      isoDateDaysAgo(25)
    );
    const result = computeDIE(c);
    const crp = result.lab_recommendations.find((r) => r.lab_code === "crp")!;
    expect(crp.status).toBe("USE");
    expect(crp.validity).toBe("CAUTION");
  });
});

describe("computeDIE — validade ferritina/hba1c (180 dias)", () => {
  it("ferritina coletada há 181 dias → REPEAT, EXPIRED", () => {
    const c = withLab(
      "ferritin",
      { raw_value: "50", parsed_ok: true, parsed_value: 50 },
      isoDateDaysAgo(181)
    );
    const result = computeDIE(c);
    const ferr = result.lab_recommendations.find((r) => r.lab_code === "ferritin")!;
    expect(ferr.status).toBe("REPEAT");
    expect(ferr.validity).toBe("EXPIRED");
  });

  it("ferritina coletada há 60 dias (válida, <90) → USE, VALID", () => {
    const c = withLab(
      "ferritin",
      { raw_value: "50", parsed_ok: true, parsed_value: 50 },
      isoDateDaysAgo(60)
    );
    const result = computeDIE(c);
    const ferr = result.lab_recommendations.find((r) => r.lab_code === "ferritin")!;
    expect(ferr.status).toBe("USE");
    expect(ferr.validity).toBe("VALID");
  });
});

// ── Sem data de coleta ────────────────────────────────────────────────────────

describe("computeDIE — sem data de coleta → USE, UNKNOWN", () => {
  it("hemoglobin com valor mas sem collected_date → USE, UNKNOWN", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      null
    );
    const result = computeDIE(c);
    const hb = result.lab_recommendations.find((r) => r.lab_code === "hemoglobin")!;
    expect(hb.status).toBe("USE");
    expect(hb.validity).toBe("UNKNOWN");
  });
});

// ── Contagens ─────────────────────────────────────────────────────────────────

describe("computeDIE — contagens", () => {
  it("um lab válido → labs_valid_count=1", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      isoDateDaysAgo(10)
    );
    const result = computeDIE(c);
    const hbRec = result.lab_recommendations.find((r) => r.lab_code === "hemoglobin")!;
    expect(hbRec.status).toBe("USE");
    expect(result.labs_valid_count).toBeGreaterThanOrEqual(1);
  });
});

// ── getValidLabsForBRS ────────────────────────────────────────────────────────

describe("getValidLabsForBRS", () => {
  it("lab EXPIRED não entra no Set retornado", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      isoDateDaysAgo(91)
    );
    const die = computeDIE(c);
    const validLabs = getValidLabsForBRS(die);
    expect(validLabs.has("hemoglobin")).toBe(false);
  });

  it("lab USE/VALID entra no Set retornado", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      isoDateDaysAgo(10)
    );
    const die = computeDIE(c);
    const validLabs = getValidLabsForBRS(die);
    expect(validLabs.has("hemoglobin")).toBe(true);
  });

  it("lab USE/UNKNOWN (sem data) entra no Set retornado", () => {
    const c = withLab(
      "hemoglobin",
      { raw_value: "14", parsed_ok: true, parsed_value: 14 },
      null
    );
    const die = computeDIE(c);
    const validLabs = getValidLabsForBRS(die);
    expect(validLabs.has("hemoglobin")).toBe(true);
  });
});
