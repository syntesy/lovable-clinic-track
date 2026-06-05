/**
 * @testSuite orchestrator — Motor clínico completo (regen_engine_v1.0.0)
 *
 * Testes de integração que travam o comportamento ATUAL de runRegenEngine().
 * Verifica o contrato público: versão, guard de schema, early-return em safety block,
 * e presença de todas as camadas em execução normal.
 */

import { describe, it, expect } from "vitest";
import { runRegenEngine } from "@/lib/regen-engine/orchestrator";
import { defaultRegenCanonical } from "@/types/regen-canonical";
import type { RegenCanonical } from "@/types/regen-canonical";

function validCanonical(overrides: Partial<RegenCanonical> = {}): RegenCanonical {
  return {
    ...defaultRegenCanonical,
    schema_version: "regen_canonical_v1",
    captured_at: new Date().toISOString(),
    safety: {
      cancer_tx_now_or_last_12m: "no",
      fever_last_7d: "no",
      open_wound_or_skin_infection_at_pain_site: "no",
      active_infection: false,
      autoimmune_disease_active: false,
    },
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
    ...overrides,
  };
}

// ── Guard de schema ───────────────────────────────────────────────────────────

describe("runRegenEngine — guard de schema", () => {
  it("lança erro quando canonical é null", () => {
    expect(() => runRegenEngine(null as unknown as RegenCanonical)).toThrow(
      "REGEN ENGINE ERROR"
    );
  });

  it("lança erro quando schema_version é inválido", () => {
    const bad = { ...validCanonical(), schema_version: "wrong_version" as "regen_canonical_v1" };
    expect(() => runRegenEngine(bad)).toThrow("REGEN ENGINE ERROR");
  });

  it("lança erro quando schema_version está ausente", () => {
    const bad = { ...validCanonical() };
    delete (bad as Partial<RegenCanonical>).schema_version;
    expect(() => runRegenEngine(bad as RegenCanonical)).toThrow("REGEN ENGINE ERROR");
  });
});

// ── Versões congeladas ────────────────────────────────────────────────────────

describe("runRegenEngine — versões do motor", () => {
  it("engine_version deve ser 'regen_engine_v1.0.0'", () => {
    const result = runRegenEngine(validCanonical());
    expect(result.engine_version).toBe("regen_engine_v1.0.0");
  });

  it("ruleset_version deve ser 'regen_rules_v1'", () => {
    const result = runRegenEngine(validCanonical());
    expect(result.ruleset_version).toBe("regen_rules_v1");
  });

  it("computed_at deve ser um timestamp ISO válido", () => {
    const result = runRegenEngine(validCanonical());
    expect(() => new Date(result.computed_at)).not.toThrow();
    expect(new Date(result.computed_at).getTime()).not.toBeNaN();
  });
});

// ── Safety block — early return ───────────────────────────────────────────────

describe("runRegenEngine — early return quando safety.block=true", () => {
  it("cancer ativo → crs e brs ficam com valores default (null/undefined)", () => {
    const c = validCanonical({
      safety: {
        ...validCanonical().safety,
        cancer_tx_now_or_last_12m: "yes",
      },
    });
    const result = runRegenEngine(c);
    expect(result.safety.block).toBe(true);
    // crs, die, brs, tog, pee ficam com valores do defaultEngineOutputs (null)
    expect(result.crs).toBeNull();
    expect(result.die).toBeNull();
    expect(result.brs).toBeNull();
    expect(result.tog).toBeNull();
    expect(result.pee).toBeNull();
  });

  it("febre → early return, data_quality inclui alerta de bloqueio", () => {
    const c = validCanonical({
      safety: { ...validCanonical().safety, fever_last_7d: "yes" },
    });
    const result = runRegenEngine(c);
    expect(result.safety.block).toBe(true);
    expect(result.data_quality).toBeDefined();
    expect(
      result.data_quality?.alerts.some((a) => a.includes("bloqueada"))
    ).toBe(true);
  });
});

// ── Execução completa (sem bloqueio) ─────────────────────────────────────────

describe("runRegenEngine — execução completa", () => {
  it("todas as camadas retornam valores quando safety não bloqueia", () => {
    const result = runRegenEngine(validCanonical());
    expect(result.safety).toBeDefined();
    expect(result.safety.block).toBe(false);
    expect(result.crs).toBeDefined();
    expect(result.die).toBeDefined();
    expect(result.brs).toBeDefined();
    expect(result.tog).toBeDefined();
    expect(result.pee).toBeDefined();
    expect(result.data_quality).toBeDefined();
  });

  it("CRS retorna score entre 0 e 100", () => {
    const result = runRegenEngine(validCanonical());
    expect(result.crs!.score).toBeGreaterThanOrEqual(0);
    expect(result.crs!.score).toBeLessThanOrEqual(100);
  });

  it("BRS retorna score entre 0 e 100", () => {
    const result = runRegenEngine(validCanonical());
    expect(result.brs!.score).toBeGreaterThanOrEqual(0);
    expect(result.brs!.score).toBeLessThanOrEqual(100);
  });

  it("PEE retorna elegibilidade para PRP, PRF e BMAC", () => {
    const result = runRegenEngine(validCanonical());
    const types = result.pee!.eligibility.map((e) => e.procedure_type);
    expect(types).toContain("PRP");
    expect(types).toContain("PRF");
    expect(types).toContain("BMAC");
  });

  it("TOG sempre inclui disclaimer no final da lista", () => {
    const result = runRegenEngine(validCanonical());
    const guidance = result.tog!.guidance;
    expect(guidance.length).toBeGreaterThan(0);
    expect(guidance[guidance.length - 1].code).toBe("DISCLAIMER");
  });
});

// ── Cenário completo: NSAID recente ──────────────────────────────────────────

describe("runRegenEngine — cenário NSAID recente", () => {
  it("nsaid_recent_14d=yes → PRP não é Recommended, BRS tem NSAID_RECENT_14D", () => {
    const c = validCanonical({
      medications: {
        ...defaultRegenCanonical.medications,
        nsaid_recent_14d: "yes",
      },
    });
    const result = runRegenEngine(c);
    expect(result.brs!.reason_codes).toContain("NSAID_RECENT_14D");
    const prp = result.pee!.eligibility.find((e) => e.procedure_type === "PRP")!;
    expect(prp.eligibility).not.toBe("Recommended");
    expect(prp.gates_triggered).toContain("NSAID_RECENT");
  });
});
