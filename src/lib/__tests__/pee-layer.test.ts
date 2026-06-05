/**
 * @testSuite pee-layer — Camada 6 do motor clínico (Procedure Eligibility Engine)
 *
 * Trava o comportamento ATUAL de computePEE().
 * Avalia PRP, PRF e BMAC com base no BRS e nos ELIGIBILITY_GATES.
 */

import { describe, it, expect } from "vitest";
import { computePEE } from "@/lib/regen-engine/pee-layer";
import { defaultRegenCanonical, defaultLabValue } from "@/types/regen-canonical";
import type { RegenCanonical } from "@/types/regen-canonical";
import type { BRSOutput } from "@/types/regen-engine";

function brs(overrides: Partial<BRSOutput>): BRSOutput {
  return {
    score: 80,
    confidence: "High",
    alerts: [],
    reason_codes: [],
    penalties_applied: [],
    ...overrides,
  };
}

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
    labs: {
      ...defaultRegenCanonical.labs,
      collected_date: null,
    },
  };
}

// ── Estrutura de saída ────────────────────────────────────────────────────────

describe("computePEE — estrutura de saída", () => {
  it("sempre retorna eligibility para PRP, PRF e BMAC", () => {
    const result = computePEE(cleanCanonical(), brs({}));
    const types = result.eligibility.map((e) => e.procedure_type);
    expect(types).toContain("PRP");
    expect(types).toContain("PRF");
    expect(types).toContain("BMAC");
    expect(result.eligibility).toHaveLength(3);
  });
});

// ── BRS thresholds ────────────────────────────────────────────────────────────

describe("computePEE — thresholds de BRS", () => {
  it("BRS>=70, High confidence, sem gates → Recommended para todos", () => {
    const result = computePEE(cleanCanonical(), brs({ score: 75, confidence: "High" }));
    result.eligibility.forEach((e) => {
      expect(e.eligibility).toBe("Recommended");
    });
  });

  it("BRS>=70, Low confidence → nunca Recommended (Possible with adjustments)", () => {
    const result = computePEE(cleanCanonical(), brs({ score: 75, confidence: "Low" }));
    result.eligibility.forEach((e) => {
      expect(e.eligibility).toBe("Possible with adjustments");
      expect(e.eligibility).not.toBe("Recommended");
    });
  });

  it("BRS<40, High confidence → Not recommended para todos", () => {
    const result = computePEE(cleanCanonical(), brs({ score: 35, confidence: "High" }));
    result.eligibility.forEach((e) => {
      expect(e.eligibility).toBe("Not recommended");
    });
  });

  it("BRS<40, Low confidence → Cannot evaluate para todos", () => {
    const result = computePEE(cleanCanonical(), brs({ score: 35, confidence: "Low" }));
    result.eligibility.forEach((e) => {
      expect(e.eligibility).toBe("Cannot evaluate");
    });
  });

  it("BRS 40-69, High confidence, sem gates → Possible with adjustments para todos", () => {
    const result = computePEE(cleanCanonical(), brs({ score: 55, confidence: "High" }));
    result.eligibility.forEach((e) => {
      expect(e.eligibility).toBe("Possible with adjustments");
    });
  });
});

// ── Gates de downgrade ────────────────────────────────────────────────────────

describe("computePEE — gates de downgrade", () => {
  it("NSAID recente → downgrade PRP e PRF para 'Possible with adjustments', BMAC não afetado", () => {
    const c = { ...cleanCanonical(), medications: { ...cleanCanonical().medications, nsaid_recent_14d: "yes" as const } };
    const result = computePEE(c, brs({ score: 80 }));

    const prp = result.eligibility.find((e) => e.procedure_type === "PRP")!;
    const prf = result.eligibility.find((e) => e.procedure_type === "PRF")!;
    const bmac = result.eligibility.find((e) => e.procedure_type === "BMAC")!;

    expect(prp.eligibility).toBe("Possible with adjustments");
    expect(prp.gates_triggered).toContain("NSAID_RECENT");
    expect(prf.eligibility).toBe("Possible with adjustments");
    expect(prf.gates_triggered).toContain("NSAID_RECENT");
    // BMAC não está em affects de NSAID_RECENT
    expect(bmac.gates_triggered).not.toContain("NSAID_RECENT");
  });

  it("tabagismo ativo → downgrade PRP, PRF e BMAC", () => {
    const c = { ...cleanCanonical(), smoking: { status: "current" as const, quit_bucket: null } };
    const result = computePEE(c, brs({ score: 80 }));
    result.eligibility.forEach((e) => {
      expect(e.gates_triggered).toContain("CURRENT_SMOKER");
      expect(e.eligibility).toBe("Possible with adjustments");
    });
  });

  it("anticoagulante → downgrade PRP, PRF e BMAC", () => {
    const c = { ...cleanCanonical(), medications: { ...cleanCanonical().medications, anticoagulant: true } };
    const result = computePEE(c, brs({ score: 80 }));
    result.eligibility.forEach((e) => {
      expect(e.gates_triggered).toContain("ANTICOAGULANT");
      expect(e.eligibility).toBe("Possible with adjustments");
    });
  });
});

// ── Gates de bloqueio ─────────────────────────────────────────────────────────

describe("computePEE — gates de bloqueio (Not recommended)", () => {
  it("THROMBOCYTOPENIA no BRS reason_codes → Not recommended para PRP", () => {
    const result = computePEE(
      cleanCanonical(),
      brs({ score: 80, reason_codes: ["THROMBOCYTOPENIA"] })
    );
    const prp = result.eligibility.find((e) => e.procedure_type === "PRP")!;
    const prf = result.eligibility.find((e) => e.procedure_type === "PRF")!;
    expect(prp.eligibility).toBe("Not recommended");
    expect(prp.gates_triggered).toContain("THROMBOCYTOPENIA");
    // PRF não está em affects de THROMBOCYTOPENIA
    expect(prf.gates_triggered).not.toContain("THROMBOCYTOPENIA");
  });

  it("SEVERE_ANEMIA no BRS reason_codes → Not recommended para PRP e PRF", () => {
    const result = computePEE(
      cleanCanonical(),
      brs({ score: 80, reason_codes: ["SEVERE_ANEMIA"] })
    );
    const prp = result.eligibility.find((e) => e.procedure_type === "PRP")!;
    const prf = result.eligibility.find((e) => e.procedure_type === "PRF")!;
    const bmac = result.eligibility.find((e) => e.procedure_type === "BMAC")!;
    expect(prp.eligibility).toBe("Not recommended");
    expect(prf.eligibility).toBe("Not recommended");
    // BMAC não afetado pelo gate SEVERE_ANEMIA
    expect(bmac.gates_triggered).not.toContain("SEVERE_ANEMIA");
  });

  it("gate bloqueante supera BRS alto (BRS=95 com THROMBOCYTOPENIA → Not recommended PRP)", () => {
    const result = computePEE(
      cleanCanonical(),
      brs({ score: 95, confidence: "High", reason_codes: ["THROMBOCYTOPENIA"] })
    );
    const prp = result.eligibility.find((e) => e.procedure_type === "PRP")!;
    expect(prp.eligibility).toBe("Not recommended");
  });
});

// ── Gates_triggered vazio quando sem gates ────────────────────────────────────

describe("computePEE — sem gates", () => {
  it("BRS>=70 sem gates → gates_triggered vazio para todos", () => {
    const result = computePEE(cleanCanonical(), brs({ score: 80 }));
    result.eligibility.forEach((e) => {
      expect(e.gates_triggered).toHaveLength(0);
    });
  });
});
