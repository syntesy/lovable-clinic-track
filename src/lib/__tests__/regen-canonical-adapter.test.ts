/**
 * @testSuite regen-canonical-adapter
 * @auditRef BUG#1 — Auditoria REGHEN Março/2026
 * 
 * Histórico: o campo nsaid_recent_14d sempre retornava 'unknown' porque
 * regen-canonical-adapter.ts usava "aine_7_dias" (com underscore extra)
 * enquanto a UI emitia "aine_7dias". Corrigido em Março/2026.
 * Os testes do Grupo 1 previnem regressão deste bug.
 */

import { describe, it, expect } from "vitest";
import { buildRegenCanonicalFromTriagem } from "@/lib/regen-canonical-adapter";

// Helper to build minimal input
function buildInput(answers: Record<string, unknown> = {}) {
  return { answers } as Parameters<typeof buildRegenCanonicalFromTriagem>[0];
}

// =============================================================
// Grupo 1 — Medications (bug histórico BUG#1)
// =============================================================
describe("Grupo 1 — Medications (BUG#1: aine_7dias)", () => {
  it('deve mapear "aine_7dias" para nsaid_recent_14d = "yes"', () => {
    const canonical = buildRegenCanonicalFromTriagem(
      buildInput({ medicamentos: ["aine_7dias"] })
    );
    expect(canonical.medications.nsaid_recent_14d).toBe("yes");
  });

  it('deve retornar nsaid_recent_14d = "unknown" quando sem AINEs', () => {
    const canonical = buildRegenCanonicalFromTriagem(buildInput({ medicamentos: [] }));
    expect(canonical.medications.nsaid_recent_14d).toBe("unknown");
  });

  it('NÃO deve reconhecer "aine_7_dias" (string com underscore extra — bug histórico)', () => {
    const canonical = buildRegenCanonicalFromTriagem(
      buildInput({ medicamentos: ["aine_7_dias"] })
    );
    // A string errada NÃO deve ativar o campo
    expect(canonical.medications.nsaid_recent_14d).not.toBe("yes");
  });
});

// =============================================================
// Grupo 2 — Safety Layer
// =============================================================
describe("Grupo 2 — Safety Layer", () => {
  it('deve mapear cancer ativo para cancer_tx_now_or_last_12m = "yes"', () => {
    const canonical = buildRegenCanonicalFromTriagem(
      buildInput({ red_flags: ["cancer_ativo"] })
    );
    expect(canonical.safety.cancer_tx_now_or_last_12m).toBe("yes");
  });

  it('deve mapear febre recente para fever_last_7d = "yes"', () => {
    const canonical = buildRegenCanonicalFromTriagem(
      buildInput({ red_flags: ["infeccao_ativa_febre"] })
    );
    expect(canonical.safety.fever_last_7d).toBe("yes");
  });

  it('deve mapear infecção de pele no local para open_wound_or_skin_infection_at_pain_site = "yes"', () => {
    const canonical = buildRegenCanonicalFromTriagem(
      buildInput({ red_flags: ["infeccao_pele_local"] })
    );
    expect(canonical.safety.open_wound_or_skin_infection_at_pain_site).toBe("yes");
  });
});

// =============================================================
// Grupo 3 — Integridade estrutural
// =============================================================
describe("Grupo 3 — Integridade estrutural do RegenCanonical", () => {
  it("deve sempre retornar objeto com todas as seções obrigatórias", () => {
    const canonical = buildRegenCanonicalFromTriagem(buildInput());
    
    expect(canonical).toHaveProperty("safety");
    expect(canonical).toHaveProperty("complaint");
    expect(canonical).toHaveProperty("medications");
    expect(canonical).toHaveProperty("smoking");
    expect(canonical).toHaveProperty("comorbidities");
    expect(canonical).toHaveProperty("diagnosis");
    expect(canonical).toHaveProperty("labs");
    expect(canonical).toHaveProperty("therapy_history");
    expect(canonical).toHaveProperty("biological_soil");
    expect(canonical).toHaveProperty("nutrition");
    expect(canonical).toHaveProperty("lifestyle");
    expect(canonical).toHaveProperty("intended_procedure");
  });

  it("deve detectar conflito de tabagismo quando current + quit_bucket preenchidos simultaneamente", () => {
    const canonical = buildRegenCanonicalFromTriagem(
      buildInput({ fatores_preparo: ["tabagista"] }),
      { regen_smoking_quit_bucket: "lt_6m" } as any
    );
    // Conflito: indicado como fumante atual E ex-fumante → smoking_conflict alert
    const conflictAlerts = canonical.data_quality_alerts.filter(
      (a) => a.alert_type === "conflict" && a.field === "smoking.status"
    );
    expect(conflictAlerts.length).toBeGreaterThan(0);
  });
});
