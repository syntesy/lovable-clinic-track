/**
 * @testSuite exam-validity-alignment
 *
 * Garante que UI e motor sempre concordam sobre:
 * (a) validade de cada exame (dias)
 * (b) lista de exames críticos
 *
 * Se este teste falhar, significa que houve uma desincronização entre os dois lados
 * — a correção é sempre atualizar src/config/examValidity.ts, nunca os consumidores.
 */

import { describe, it, expect } from "vitest";
import { LAB_VALIDITY_DAYS, DEFAULT_VALIDITY_DAYS, CRITICAL_LAB_CODES } from "@/config/examValidity";
import { computeDIE } from "@/lib/regen-engine/die-layer";
import { REQUIRED_CRITICAL_LABS } from "@/types/regen-case-status";
import { isExamExpired } from "@/types/triage-exams";
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
  collectedDate: string | null
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

// ── Exames críticos: mesma lista nos dois lados ───────────────────────────────

describe("Alinhamento — lista de exames críticos", () => {
  it("CRITICAL_LAB_CODES e REQUIRED_CRITICAL_LABS têm o mesmo conteúdo", () => {
    expect([...CRITICAL_LAB_CODES].sort()).toEqual([...REQUIRED_CRITICAL_LABS].sort());
  });

  it("CRITICAL_LAB_CODES contém os 6 exames obrigatórios do PRD", () => {
    const expected = ["hemoglobin", "leukocytes", "platelets", "crp", "hba1c", "ferritin"];
    expect([...CRITICAL_LAB_CODES].sort()).toEqual(expected.sort());
  });

  it("CRITICAL_LAB_CODES tem exatamente 6 itens", () => {
    expect(CRITICAL_LAB_CODES).toHaveLength(6);
  });
});

// ── Validade dos exames: UI e motor concordam ─────────────────────────────────

describe("Alinhamento — validade de exames: UI vs motor", () => {
  const labsToCheck: Array<keyof typeof LAB_VALIDITY_DAYS> = [
    "hemoglobin", "hematocrit", "leukocytes", "platelets",
    "crp", "ferritin", "glucose", "hba1c",
  ];

  labsToCheck.forEach((labCode) => {
    const validityDays = LAB_VALIDITY_DAYS[labCode];

    it(`${labCode} — UI e motor concordam: validade = ${validityDays} dias`, () => {
      // ── Motor: lab expirado 1 dia acima do limite → EXPIRED
      const expiredCanonical = withLab(
        labCode as keyof RegenCanonical["labs"],
        { raw_value: "10", parsed_ok: true, parsed_value: 10 },
        isoDateDaysAgo(validityDays + 1)
      );
      const dieExpired = computeDIE(expiredCanonical);
      const expiredRec = dieExpired.lab_recommendations.find((r) => r.lab_code === labCode)!;
      expect(expiredRec.validity).toBe("EXPIRED");

      // ── UI: isExamExpired com mesma validade → true
      expect(isExamExpired(isoDateDaysAgo(validityDays + 1), validityDays)).toBe(true);

      // ── Motor: lab válido 1 dia abaixo do limite (antes da zona CAUTION) → USE
      // Para evitar cair na zona CAUTION (>80% do prazo), usamos 70% do prazo
      const validDays = Math.floor(validityDays * 0.7);
      const validCanonical = withLab(
        labCode as keyof RegenCanonical["labs"],
        { raw_value: "10", parsed_ok: true, parsed_value: 10 },
        isoDateDaysAgo(validDays)
      );
      const dieValid = computeDIE(validCanonical);
      const validRec = dieValid.lab_recommendations.find((r) => r.lab_code === labCode)!;
      expect(validRec.status).toBe("USE");

      // ── UI: isExamExpired com mesmo valor → false
      expect(isExamExpired(isoDateDaysAgo(validDays), validityDays)).toBe(false);
    });
  });
});

// ── DEFAULT_VALIDITY_DAYS ─────────────────────────────────────────────────────

describe("Alinhamento — DEFAULT_VALIDITY_DAYS", () => {
  it("DEFAULT_VALIDITY_DAYS é 90", () => {
    expect(DEFAULT_VALIDITY_DAYS).toBe(90);
  });

  it("todos os exames hematológicos padrão têm validade 90", () => {
    const standard = ["hemoglobin", "hematocrit", "leukocytes", "platelets", "glucose"];
    standard.forEach((lab) => {
      expect(LAB_VALIDITY_DAYS[lab]).toBe(DEFAULT_VALIDITY_DAYS);
    });
  });
});

// ── ESSENTIAL_LABS no DIE: crp, ferritin, hba1c agora geram ESSENTIAL_LAB_MISSING ──

describe("Alinhamento — ESSENTIAL_LABS no DIE (M3)", () => {
  const newEssentials = ["crp", "hba1c", "ferritin"];

  newEssentials.forEach((labCode) => {
    it(`${labCode} ausente → reason_code = ESSENTIAL_LAB_MISSING (não LAB_MISSING)`, () => {
      const c: RegenCanonical = {
        ...defaultRegenCanonical,
        labs: { ...defaultRegenCanonical.labs, [labCode]: { ...defaultLabValue, raw_value: null } },
      };
      const result = computeDIE(c);
      const rec = result.lab_recommendations.find((r) => r.lab_code === labCode)!;
      expect(rec.status).toBe("REQUEST");
      expect(rec.reason_code).toBe("ESSENTIAL_LAB_MISSING");
    });
  });
});
