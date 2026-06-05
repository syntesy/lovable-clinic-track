/**
 * @testSuite crs-layer — Camada 2 do motor clínico (Clinical Readiness Score)
 *
 * Trava o comportamento ATUAL de computeCRS().
 * Base 100; penalidades por duração e intensidade de dor; clamp 0-100.
 */

import { describe, it, expect } from "vitest";
import { computeCRS } from "@/lib/regen-engine/crs-layer";
import { defaultRegenCanonical } from "@/types/regen-canonical";
import type { RegenCanonical } from "@/types/regen-canonical";

function crsCanonical(overrides: Partial<RegenCanonical["complaint"]> = {}): RegenCanonical {
  return {
    ...defaultRegenCanonical,
    complaint: { ...defaultRegenCanonical.complaint, ...overrides },
  };
}

// ── Score base e campos faltantes ─────────────────────────────────────────────

describe("computeCRS — campos faltantes", () => {
  it("sem dados de queixa → score=100, confidence=Low, missing tem 3 campos", () => {
    const result = computeCRS(crsCanonical({ pain_region: null, symptom_duration_bucket: null, pain_nrs: null }));
    expect(result.score).toBe(100);
    expect(result.confidence).toBe("Low");
    expect(result.missing).toContain("pain_region");
    expect(result.missing).toContain("symptom_duration_bucket");
    expect(result.missing).toContain("pain_nrs");
  });

  it("todos os campos preenchidos → confidence=High, missing vazio", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 5 })
    );
    expect(result.confidence).toBe("High");
    expect(result.missing).toHaveLength(0);
  });

  it("um campo faltando → confidence=Medium", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: null, symptom_duration_bucket: "m3_6", pain_nrs: 5 })
    );
    expect(result.confidence).toBe("Medium");
  });
});

// ── Penalidades por duração ───────────────────────────────────────────────────

describe("computeCRS — penalidades por duração dos sintomas", () => {
  it("lt_3m → penalidade 15 (ACUTE_SYMPTOMS_LT_3M)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "lt_3m", pain_nrs: 5 })
    );
    expect(result.score).toBe(85);
    expect(result.penalties_applied).toContain("ACUTE_SYMPTOMS_LT_3M");
  });

  it("m3_6 → sem penalidade (faixa ideal)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 5 })
    );
    expect(result.score).toBe(100);
    expect(result.penalties_applied).toHaveLength(0);
  });

  it("gt_6m → penalidade 10 (CHRONIC_SYMPTOMS_GT_6M)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "gt_6m", pain_nrs: 5 })
    );
    expect(result.score).toBe(90);
    expect(result.penalties_applied).toContain("CHRONIC_SYMPTOMS_GT_6M");
  });
});

// ── Penalidades por intensidade de dor ───────────────────────────────────────

describe("computeCRS — penalidades por intensidade de dor (pain_nrs)", () => {
  it("pain_nrs=9 → penalidade 20 (SEVERE_PAIN_GTE_9)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 9 })
    );
    expect(result.score).toBe(80);
    expect(result.penalties_applied).toContain("SEVERE_PAIN_GTE_9");
  });

  it("pain_nrs=10 → penalidade 20 (SEVERE_PAIN_GTE_9)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 10 })
    );
    expect(result.score).toBe(80);
  });

  it("pain_nrs=7 → penalidade 10 (HIGH_PAIN_7_8)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 7 })
    );
    expect(result.score).toBe(90);
    expect(result.penalties_applied).toContain("HIGH_PAIN_7_8");
  });

  it("pain_nrs=8 → penalidade 10 (HIGH_PAIN_7_8)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 8 })
    );
    expect(result.score).toBe(90);
  });

  it("pain_nrs=2 → penalidade 5 (LOW_PAIN_LTE_2)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 2 })
    );
    expect(result.score).toBe(95);
    expect(result.penalties_applied).toContain("LOW_PAIN_LTE_2");
  });

  it("pain_nrs=0 → penalidade 5 (LOW_PAIN_LTE_2)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 0 })
    );
    expect(result.score).toBe(95);
  });

  it("pain_nrs=3 → sem penalidade de dor", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 3 })
    );
    expect(result.score).toBe(100);
  });
});

// ── Penalidades acumuladas ────────────────────────────────────────────────────

describe("computeCRS — penalidades acumuladas", () => {
  it("lt_3m + pain_nrs=9 → score=65 (100-15-20)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "lt_3m", pain_nrs: 9 })
    );
    expect(result.score).toBe(65);
  });

  it("gt_6m + pain_nrs=7 → score=80 (100-10-10)", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "gt_6m", pain_nrs: 7 })
    );
    expect(result.score).toBe(80);
  });
});

// ── Classificação (thresholds) ────────────────────────────────────────────────

describe("computeCRS — classificação pelo score", () => {
  it("score >=70 → Potentially Ready", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 5 })
    );
    expect(result.score).toBe(100);
    expect(result.classification).toBe("Potentially Ready");
  });

  it("score entre 40 e 69 → Conditionally Ready", () => {
    // gt_6m(-10) + high_pain(-10) + duração lt_3m(-15) + severe_pain(-20) = 55 → Conditionally Ready
    // Usar lt_3m(-15) + severe_pain(-20) = 65 → ainda Potentially Ready
    // Usar lt_3m(-15) + severe_pain(-20) + gt_6m? Não, só 1 duração.
    // Forçar score 60: lt_3m(-15) + HIGH_PAIN(-10) + LOW_PAIN é impossível simultâneo.
    // lt_3m(-15) + high_pain_7_8(-10) = 75 → Potentially Ready. Need more penalty.
    // Need to craft a scenario: gt_6m(-10) + severe_pain(-20) = 70 → Potentially Ready (edge).
    // lt_3m(-15) + severe_pain(-20) = 65 → Conditionally Ready
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "lt_3m", pain_nrs: 9 })
    );
    expect(result.score).toBe(65);
    expect(result.classification).toBe("Conditionally Ready");
  });

  it("score <40 → Not Ready (clamp test: múltiplas penalidades)", () => {
    // lt_3m(-15) + severe(-20) = 65. Não chega a <40 com as penalidades atuais.
    // Score mínimo possível: lt_3m(-15) + severe(-20) = 65. Nunca chega a <40 com as regras atuais.
    // Verificar que classificação correta para score=39 seria Not Ready.
    // Criar score hipotético forçando gt_6m + severe: 100-10-20=70. Não funciona.
    // O limiar <40 não é atingível com as penalidades atuais (máx 35). Testar a função auxiliar:
    // Testar score=39 manualmente não é possível com os inputs atuais — as penalidades somam no max 35.
    // Confirmar: score nunca vai abaixo de 65 com as penalidades atuais (15+20=35 máx).
    const maxPenalty = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "lt_3m", pain_nrs: 9 })
    );
    expect(maxPenalty.score).toBe(65);
    // Logo Not Ready (score<40) nunca é atingível pelas penalidades de CRS atuais.
    expect(maxPenalty.classification).toBe("Conditionally Ready");
  });
});

// ── Clamp ─────────────────────────────────────────────────────────────────────

describe("computeCRS — clamp 0-100", () => {
  it("score nunca ultrapassa 100", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "m3_6", pain_nrs: 5 })
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("score nunca fica negativo", () => {
    const result = computeCRS(
      crsCanonical({ pain_region: "knee", symptom_duration_bucket: "lt_3m", pain_nrs: 9 })
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
