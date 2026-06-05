/**
 * @testSuite safety-layer — Camada 1 do motor clínico
 *
 * Trava o comportamento ATUAL de computeSafety().
 * Não altera nenhuma regra clínica — apenas verifica o comportamento existente.
 */

import { describe, it, expect } from "vitest";
import { computeSafety } from "@/lib/regen-engine/safety-layer";
import { defaultRegenCanonical } from "@/types/regen-canonical";
import type { RegenCanonical } from "@/types/regen-canonical";

function safeCanonical(overrides: Partial<RegenCanonical["safety"]> = {}): RegenCanonical {
  return {
    ...defaultRegenCanonical,
    safety: { ...defaultRegenCanonical.safety, ...overrides },
  };
}

// ── No block, no alert ────────────────────────────────────────────────────────

describe("computeSafety — sem contraindicação", () => {
  it("retorna block=false, alert=false quando safety é all-clear", () => {
    const result = computeSafety(
      safeCanonical({
        cancer_tx_now_or_last_12m: "no",
        fever_last_7d: "no",
        open_wound_or_skin_infection_at_pain_site: "no",
        active_infection: false,
        autoimmune_disease_active: false,
      })
    );
    expect(result.block).toBe(false);
    expect(result.alert).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });
});

// ── Block cases ───────────────────────────────────────────────────────────────

describe("computeSafety — bloqueios absolutos", () => {
  it("cancer ativo/recente → block=true, CANCER_ACTIVE_OR_RECENT_TX", () => {
    const result = computeSafety(safeCanonical({ cancer_tx_now_or_last_12m: "yes" }));
    expect(result.block).toBe(true);
    expect(result.reasons).toContain("CANCER_ACTIVE_OR_RECENT_TX");
  });

  it("febre nos últimos 7 dias → block=true, FEVER_LAST_7D", () => {
    const result = computeSafety(safeCanonical({ fever_last_7d: "yes" }));
    expect(result.block).toBe(true);
    expect(result.reasons).toContain("FEVER_LAST_7D");
  });

  it("infecção de pele no local → block=true, SKIN_INFECTION_AT_SITE", () => {
    const result = computeSafety(
      safeCanonical({ open_wound_or_skin_infection_at_pain_site: "yes" })
    );
    expect(result.block).toBe(true);
    expect(result.reasons).toContain("SKIN_INFECTION_AT_SITE");
  });

  it("active_infection=true → block=true, ACTIVE_INFECTION", () => {
    const result = computeSafety(safeCanonical({ active_infection: true }));
    expect(result.block).toBe(true);
    expect(result.reasons).toContain("ACTIVE_INFECTION");
  });

  it("doença autoimune ativa → block=true, AUTOIMMUNE_DISEASE_ACTIVE", () => {
    const result = computeSafety(safeCanonical({ autoimmune_disease_active: true }));
    expect(result.block).toBe(true);
    expect(result.reasons).toContain("AUTOIMMUNE_DISEASE_ACTIVE");
  });
});

// ── Alert cases ───────────────────────────────────────────────────────────────

describe("computeSafety — alertas (unknown)", () => {
  it("cancer unknown → alert=true, CANCER_STATUS_UNKNOWN, block=false", () => {
    const result = computeSafety(safeCanonical({ cancer_tx_now_or_last_12m: "unknown" }));
    expect(result.block).toBe(false);
    expect(result.alert).toBe(true);
    expect(result.reasons).toContain("CANCER_STATUS_UNKNOWN");
  });

  it("febre unknown → alert=true, FEVER_STATUS_UNKNOWN, block=false", () => {
    const result = computeSafety(safeCanonical({ fever_last_7d: "unknown" }));
    expect(result.block).toBe(false);
    expect(result.alert).toBe(true);
    expect(result.reasons).toContain("FEVER_STATUS_UNKNOWN");
  });

  it("infecção de pele unknown → alert=true, SKIN_INFECTION_STATUS_UNKNOWN", () => {
    const result = computeSafety(
      safeCanonical({ open_wound_or_skin_infection_at_pain_site: "unknown" })
    );
    expect(result.block).toBe(false);
    expect(result.alert).toBe(true);
    expect(result.reasons).toContain("SKIN_INFECTION_STATUS_UNKNOWN");
  });
});

// ── Multiple blocks ───────────────────────────────────────────────────────────

describe("computeSafety — múltiplos bloqueios", () => {
  it("cancer + febre → block=true com ambos os reasons", () => {
    const result = computeSafety(
      safeCanonical({ cancer_tx_now_or_last_12m: "yes", fever_last_7d: "yes" })
    );
    expect(result.block).toBe(true);
    expect(result.reasons).toContain("CANCER_ACTIVE_OR_RECENT_TX");
    expect(result.reasons).toContain("FEVER_LAST_7D");
  });

  it("febre + active_infection — ACTIVE_INFECTION NÃO é duplicado quando FEVER_LAST_7D já está", () => {
    const result = computeSafety(
      safeCanonical({ fever_last_7d: "yes", active_infection: true })
    );
    expect(result.block).toBe(true);
    expect(result.reasons).toContain("FEVER_LAST_7D");
    // ACTIVE_INFECTION não deve ser adicionado redundantemente
    expect(result.reasons).not.toContain("ACTIVE_INFECTION");
  });

  it("skin_infection + active_infection — ACTIVE_INFECTION NÃO é duplicado", () => {
    const result = computeSafety(
      safeCanonical({
        open_wound_or_skin_infection_at_pain_site: "yes",
        active_infection: true,
      })
    );
    expect(result.reasons).toContain("SKIN_INFECTION_AT_SITE");
    expect(result.reasons).not.toContain("ACTIVE_INFECTION");
  });
});
