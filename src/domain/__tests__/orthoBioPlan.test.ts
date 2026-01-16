/**
 * Tests for OrthoBio Procedure Catalog and Plan Generator
 * 
 * CRITICAL: These tests enforce the Procedure-Locked Output rule.
 * Any text for PRP must NEVER contain BMEC/BMA terms and vice versa.
 */

import { describe, it, expect } from "vitest";
import {
  generateOrthoBioPlan,
  containsForbiddenTerms,
  isValidProcedureCode,
  mapTaxonomyToProcedureCode,
  PROCEDURE_CATALOG,
  CATALOG_VERSION,
  type ProcedureCode,
  type PatientFactors,
  type OrthoBioPlanInput,
} from "../orthoBioProcedures";

// =============================================================================
// TEST 1: PRP não pode citar BMEC/BMA
// =============================================================================

describe("Procedure-Locked: PRP isolation", () => {
  it("PRP next_steps_text should NOT contain BMEC, BMAC, BMA, or 'medula'", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    // Check forbidden terms
    const lowerText = result.next_steps_text.toLowerCase();
    expect(lowerText).not.toContain("bmec");
    expect(lowerText).not.toContain("bmac");
    expect(lowerText).not.toContain("bma");
    expect(lowerText).not.toContain("medula");
    expect(lowerText).not.toContain("aspirado medular");
    expect(lowerText).not.toContain("elegibilidade medular");
  });

  it("PRP should NOT require CBC/hemograma by default", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const cbcExam = result.required_exams.find(
      (e) => e.exam_code === "CBC" && e.required === true
    );
    expect(cbcExam).toBeUndefined();
  });

  it("containsForbiddenTerms should detect violations for PRP", () => {
    const badText = "Para elegibilidade de BMAC, solicitar hemograma";
    const check = containsForbiddenTerms(badText, ["PRP"]);

    expect(check.hasForbidden).toBe(true);
    expect(check.violations.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// TEST 2: BMEC exige hemograma obrigatório
// =============================================================================

describe("Procedure-Locked: BMEC requirements", () => {
  it("BMEC should require CBC (hemograma) as mandatory", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["BMEC"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const cbcExam = result.required_exams.find(
      (e) => e.exam_code === "CBC" && e.required === true
    );
    expect(cbcExam).toBeDefined();
    expect(cbcExam?.label).toContain("Hemograma");
  });

  it("BMEC next_steps_text should mention hemograma", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["BMEC"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const lowerText = result.next_steps_text.toLowerCase();
    expect(lowerText).toContain("hemograma");
  });

  it("BMEC next_steps_text should NOT mention PRP", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["BMEC"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const lowerText = result.next_steps_text.toLowerCase();
    expect(lowerText).not.toContain("prp");
    expect(lowerText).not.toContain("plasma rico em plaquetas");
  });
});

// =============================================================================
// TEST 3: PRP com AINE recente gera alerta alto
// =============================================================================

describe("Dynamic Rules: NSAID alert for PRP", () => {
  it("PRP with nsaid_recent=true should generate high severity alert", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {
        nsaid_recent: true,
        days_since_last_nsaid: 2,
      },
    };

    const result = generateOrthoBioPlan(input);

    // Should have at least one high-severity alert
    const highAlert = result.alerts.find((a) => a.severity === "high");
    expect(highAlert).toBeDefined();
    expect(highAlert?.code).toBe("NSAID_RECENT_ALERT");
  });

  it("PRP with nsaid_recent=true should include reprogramming recommendation", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {
        nsaid_recent: true,
      },
    };

    const result = generateOrthoBioPlan(input);

    const lowerText = result.next_steps_text.toLowerCase();
    expect(lowerText).toContain("reprogramar");
  });

  it("PRP without nsaid_recent should NOT have NSAID alert", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {
        nsaid_recent: false,
      },
    };

    const result = generateOrthoBioPlan(input);

    const nsaidAlert = result.alerts.find((a) => a.code === "NSAID_RECENT_ALERT");
    expect(nsaidAlert).toBeUndefined();
  });

  it("eligibility_status should be ATTENTION when NSAID alert is triggered", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {
        nsaid_recent: true,
      },
    };

    const result = generateOrthoBioPlan(input);
    expect(result.eligibility_status).toBe("ATTENTION");
  });
});

// =============================================================================
// TEST 4: Combo PRP + BMEC
// =============================================================================

describe("Combo procedures: PRP + BMEC", () => {
  it("PRP + BMEC should include CBC requirement from BMEC", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP", "BMEC"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const cbcExam = result.required_exams.find(
      (e) => e.exam_code === "CBC" && e.required === true
    );
    expect(cbcExam).toBeDefined();
  });

  it("PRP + BMEC with NSAID should include NSAID alert", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP", "BMEC"],
      patient_factors: {
        nsaid_recent: true,
      },
    };

    const result = generateOrthoBioPlan(input);

    const nsaidAlert = result.alerts.find((a) => a.code === "NSAID_RECENT_ALERT");
    expect(nsaidAlert).toBeDefined();
  });

  it("PRP + BMEC should mention both procedures in next_steps", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP", "BMEC"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const text = result.next_steps_text.toLowerCase();
    expect(text).toContain("prp");
    expect(text).toContain("bmec");
  });

  it("Combo meta should list both procedures", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP", "BMEC"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    expect(result.meta.procedures_used).toContain("PRP");
    expect(result.meta.procedures_used).toContain("BMEC");
  });
});

// =============================================================================
// TEST 5: Blocking conditions
// =============================================================================

describe("Blocking conditions", () => {
  it("severe_anemia should block PRP with BLOCKED status", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {
        severe_anemia: true,
      },
    };

    const result = generateOrthoBioPlan(input);

    expect(result.eligibility_status).toBe("BLOCKED");
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.blocks.some((b) => b.code === "SEVERE_ANEMIA")).toBe(true);
  });

  it("active_infection should block all procedures", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {
        active_infection: true,
      },
    };

    const result = generateOrthoBioPlan(input);

    expect(result.eligibility_status).toBe("BLOCKED");
    expect(result.blocks.some((b) => b.code === "ACTIVE_INFECTION")).toBe(true);
  });

  it("thrombocytopenia should block PRP", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {
        thrombocytopenia: true,
      },
    };

    const result = generateOrthoBioPlan(input);

    expect(result.eligibility_status).toBe("BLOCKED");
    expect(result.blocks.some((b) => b.code === "THROMBOCYTOPENIA")).toBe(true);
  });
});

// =============================================================================
// TEST 6: Empty/invalid input handling
// =============================================================================

describe("Edge cases: Empty and invalid inputs", () => {
  it("Empty procedure_codes should return placeholder message", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: [],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    expect(result.next_steps_text).toContain("Selecione um procedimento");
    expect(result.meta.procedures_used).toHaveLength(0);
  });

  it("Invalid procedure code should be filtered out", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["INVALID_CODE" as ProcedureCode],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    expect(result.next_steps_text).toContain("Procedimento não reconhecido");
  });
});

// =============================================================================
// TEST 7: Utility functions
// =============================================================================

describe("Utility functions", () => {
  it("isValidProcedureCode should validate known codes", () => {
    expect(isValidProcedureCode("PRP")).toBe(true);
    expect(isValidProcedureCode("PRF")).toBe(true);
    expect(isValidProcedureCode("BMA")).toBe(true);
    expect(isValidProcedureCode("BMEC")).toBe(true);
    expect(isValidProcedureCode("NANOFAT")).toBe(true);
    expect(isValidProcedureCode("INVALID")).toBe(false);
  });

  it("mapTaxonomyToProcedureCode should map taxonomy codes correctly", () => {
    expect(mapTaxonomyToProcedureCode("AUTO_PRP")).toBe("PRP");
    expect(mapTaxonomyToProcedureCode("AUTO_LP_PRP")).toBe("PRP");
    expect(mapTaxonomyToProcedureCode("AUTO_PRF")).toBe("PRF");
    expect(mapTaxonomyToProcedureCode("AUTO_BMA")).toBe("BMA");
    expect(mapTaxonomyToProcedureCode("AUTO_BMAC")).toBe("BMEC");
    expect(mapTaxonomyToProcedureCode("AUTO_BMEC")).toBe("BMEC");
    expect(mapTaxonomyToProcedureCode("AUTO_NANOFAT")).toBe("NANOFAT");
    expect(mapTaxonomyToProcedureCode("UNKNOWN")).toBeNull();
  });

  it("CATALOG_VERSION should be defined", () => {
    expect(CATALOG_VERSION).toBeDefined();
    expect(CATALOG_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
  });
});

// =============================================================================
// TEST 8: Catalog completeness
// =============================================================================

describe("Catalog completeness", () => {
  const requiredProcedures: ProcedureCode[] = ["PRP", "PRF", "BMA", "BMEC", "NANOFAT"];

  it("All required procedures should be in catalog", () => {
    for (const proc of requiredProcedures) {
      expect(PROCEDURE_CATALOG[proc]).toBeDefined();
      expect(PROCEDURE_CATALOG[proc].procedure_code).toBe(proc);
      expect(PROCEDURE_CATALOG[proc].label_ptbr).toBeTruthy();
      expect(PROCEDURE_CATALOG[proc].next_steps_template_ptbr).toBeTruthy();
    }
  });

  it("Each procedure should have forbidden_terms array", () => {
    for (const proc of requiredProcedures) {
      expect(Array.isArray(PROCEDURE_CATALOG[proc].forbidden_terms)).toBe(true);
    }
  });

  it("Each procedure should have dynamic_rules array", () => {
    for (const proc of requiredProcedures) {
      expect(Array.isArray(PROCEDURE_CATALOG[proc].dynamic_rules)).toBe(true);
    }
  });
});

// =============================================================================
// TEST 9: BMA specific tests
// =============================================================================

describe("Procedure-Locked: BMA requirements", () => {
  it("BMA should require CBC (hemograma) as mandatory", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["BMA"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const cbcExam = result.required_exams.find(
      (e) => e.exam_code === "CBC" && e.required === true
    );
    expect(cbcExam).toBeDefined();
  });

  it("BMA next_steps_text should mention hemograma", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["BMA"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const lowerText = result.next_steps_text.toLowerCase();
    expect(lowerText).toContain("hemograma");
  });
});

// =============================================================================
// TEST 10: PRF specific tests
// =============================================================================

describe("Procedure-Locked: PRF isolation", () => {
  it("PRF should not require CBC by default", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRF"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const cbcExam = result.required_exams.find(
      (e) => e.exam_code === "CBC" && e.required === true
    );
    expect(cbcExam).toBeUndefined();
  });

  it("PRF next_steps_text should NOT contain BMEC/BMA terms", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRF"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    const lowerText = result.next_steps_text.toLowerCase();
    expect(lowerText).not.toContain("bmec");
    expect(lowerText).not.toContain("bmac");
    expect(lowerText).not.toContain("bma");
    expect(lowerText).not.toContain("medula");
  });

  it("PRF with NSAID should generate alert", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRF"],
      patient_factors: {
        nsaid_recent: true,
      },
    };

    const result = generateOrthoBioPlan(input);

    const nsaidAlert = result.alerts.find((a) => a.code === "NSAID_RECENT_ALERT");
    expect(nsaidAlert).toBeDefined();
  });
});

// =============================================================================
// TEST 11: Meta data correctness
// =============================================================================

describe("Meta data", () => {
  it("generated_at should be a valid ISO date", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    expect(result.meta.generated_at).toBeDefined();
    const date = new Date(result.meta.generated_at);
    expect(date.toString()).not.toBe("Invalid Date");
  });

  it("catalog_version should match CATALOG_VERSION constant", () => {
    const input: OrthoBioPlanInput = {
      procedure_codes: ["PRP"],
      patient_factors: {},
    };

    const result = generateOrthoBioPlan(input);

    expect(result.meta.catalog_version).toBe(CATALOG_VERSION);
  });
});
