/**
 * Testes automatizados para validação de exames dinâmicos da triagem
 * 
 * Cobertura:
 * - Deduplicação por code
 * - Ordenação determinística (críticos primeiro, pt-BR)
 * - Status "desatualizado" (> 90 dias)
 * - Regra S2 (areAllCriticalExamsValid)
 * - Cenários de QA
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  extractExamsFromTriage,
  updateExamsWithValidation,
  areAllCriticalExamsValid,
  getCriticalExams,
  normalizeExamCode,
  getExamLabel,
  isExamExpired,
  sortTriageExams,
  hasTriageExams,
  TriageExamItem
} from "@/types/triage-exams";

// Skip tests in production
const isProduction = import.meta.env.PROD;
const testFn = isProduction ? it.skip : it;

describe("Triage Exams - Normalização e Labels", () => {
  testFn("normaliza códigos corretamente", () => {
    expect(normalizeExamCode("Hemoglobina")).toBe("hemoglobina");
    expect(normalizeExamCode("PCR (Proteína C Reativa)")).toBe("pcr_proteina_c_reativa");
    expect(normalizeExamCode("vitamin_D")).toBe("vitamin_d");
    expect(normalizeExamCode("  Glicemia  ")).toBe("glicemia");
  });

  testFn("retorna labels corretos para códigos conhecidos", () => {
    expect(getExamLabel("hemoglobin")).toBe("Hemoglobina");
    expect(getExamLabel("platelets")).toBe("Plaquetas");
    expect(getExamLabel("vitamin_d")).toBe("Vitamina D (25-OH)");
  });

  testFn("retorna código original para exames desconhecidos", () => {
    expect(getExamLabel("exame_raro_xyz")).toBe("exame_raro_xyz");
  });
});

describe("Triage Exams - Deduplicação", () => {
  testFn("remove exames duplicados por code", () => {
    const analysisResult = JSON.stringify({
      requested_exams: {
        required: ["hemoglobin", "Hemoglobina", "HEMOGLOBIN"],
        optional: ["platelets", "Plaquetas"]
      }
    });

    const exams = extractExamsFromTriage(analysisResult, null);
    
    // Deve ter apenas 2 exames (hemoglobina + plaquetas)
    expect(exams.length).toBe(2);
    
    const codes = exams.map(e => e.code);
    expect(codes).toContain("hemoglobina");
    expect(codes).toContain("platelets");
  });

  testFn("nunca renderiza o mesmo exame mais de uma vez", () => {
    const analysisResult = JSON.stringify({
      requested_exams: {
        required: ["crp", "pcr", "PCR"],
        optional: ["CRP", "pcr"]
      }
    });

    const exams = extractExamsFromTriage(analysisResult, null);
    const uniqueCodes = new Set(exams.map(e => e.code));
    
    // Cada código deve aparecer apenas uma vez
    expect(exams.length).toBe(uniqueCodes.size);
  });
});

describe("Triage Exams - Ordenação Determinística", () => {
  testFn("ordena críticos antes de opcionais", () => {
    const analysisResult = JSON.stringify({
      requested_exams: {
        required: ["glucose"],
        optional: ["albumina", "ferritin"]
      }
    });

    const exams = extractExamsFromTriage(analysisResult, null);
    
    // O primeiro deve ser crítico
    expect(exams[0].is_critical).toBe(true);
    
    // Os opcionais vêm depois
    const optionalIndex = exams.findIndex(e => !e.is_critical);
    const criticalIndex = exams.findIndex(e => e.is_critical);
    expect(criticalIndex).toBeLessThan(optionalIndex);
  });

  testFn("ordena por label em pt-BR dentro de cada grupo", () => {
    const analysisResult = JSON.stringify({
      requested_exams: {
        required: ["glucose", "crp", "hemoglobin"],
        optional: ["vitamin_d", "ferritin", "albumina"]
      }
    });

    const exams = extractExamsFromTriage(analysisResult, null);
    
    const criticalExams = exams.filter(e => e.is_critical);
    const optionalExams = exams.filter(e => !e.is_critical);
    
    // Verificar ordenação alfabética pt-BR dos críticos
    const criticalLabels = criticalExams.map(e => e.label);
    const sortedCriticalLabels = [...criticalLabels].sort(
      (a, b) => new Intl.Collator("pt-BR").compare(a, b)
    );
    expect(criticalLabels).toEqual(sortedCriticalLabels);
    
    // Verificar ordenação alfabética pt-BR dos opcionais
    const optionalLabels = optionalExams.map(e => e.label);
    const sortedOptionalLabels = [...optionalLabels].sort(
      (a, b) => new Intl.Collator("pt-BR").compare(a, b)
    );
    expect(optionalLabels).toEqual(sortedOptionalLabels);
  });
});

describe("Triage Exams - Status Desatualizado", () => {
  testFn("marca como desatualizado quando collected_at > 90 dias", () => {
    // Data de 100 dias atrás
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const collectedAt = oldDate.toISOString();
    
    expect(isExamExpired(collectedAt)).toBe(true);
  });

  testFn("NÃO marca como desatualizado quando collected_at <= 90 dias", () => {
    // Data de 30 dias atrás
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    const collectedAt = recentDate.toISOString();
    
    expect(isExamExpired(collectedAt)).toBe(false);
  });

  testFn("NÃO marca como desatualizado quando collected_at é null", () => {
    expect(isExamExpired(null)).toBe(false);
  });

  testFn("updateExamsWithValidation aplica status desatualizado corretamente", () => {
    const exams: TriageExamItem[] = [
      { code: "hemoglobin", label: "Hemoglobina", status: "pendente", is_critical: true, collected_at: null }
    ];
    
    // Data de 100 dias atrás
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const labsCollectedDate = oldDate.toISOString();
    
    const labsValidated = {
      hemoglobin: { status: "USE", value: 14.5, date: labsCollectedDate }
    };
    
    const updated = updateExamsWithValidation(exams, labsValidated, labsCollectedDate);
    
    expect(updated[0].status).toBe("desatualizado");
    expect(updated[0].collected_at).toBe(labsCollectedDate);
  });
});

describe("Triage Exams - Regra S2 (areAllCriticalExamsValid)", () => {
  testFn("retorna true quando TODOS os críticos têm status === 'válido'", () => {
    const exams: TriageExamItem[] = [
      { code: "hemoglobin", label: "Hemoglobina", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      { code: "platelets", label: "Plaquetas", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      { code: "vitamin_d", label: "Vitamina D", status: "pendente", is_critical: false, collected_at: null }
    ];
    
    expect(areAllCriticalExamsValid(exams)).toBe(true);
  });

  testFn("retorna false quando pelo menos 1 crítico tem status !== 'válido'", () => {
    const exams: TriageExamItem[] = [
      { code: "hemoglobin", label: "Hemoglobina", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      { code: "platelets", label: "Plaquetas", status: "pendente", is_critical: true, collected_at: null },
      { code: "vitamin_d", label: "Vitamina D", status: "pendente", is_critical: false, collected_at: null }
    ];
    
    expect(areAllCriticalExamsValid(exams)).toBe(false);
  });

  testFn("retorna false quando não há exames críticos", () => {
    const exams: TriageExamItem[] = [
      { code: "vitamin_d", label: "Vitamina D", status: "válido", is_critical: false, collected_at: "2025-01-01" }
    ];
    
    expect(areAllCriticalExamsValid(exams)).toBe(false);
  });

  testFn("retorna false para lista vazia (sem triagem)", () => {
    expect(areAllCriticalExamsValid([])).toBe(false);
  });

  testFn("NÃO considera labels ou nomes - apenas is_critical e status", () => {
    // Mesmo que o label seja "hemograma", só is_critical e status importam
    const exams: TriageExamItem[] = [
      { code: "exame_custom_xyz", label: "Exame Personalizado XYZ", status: "válido", is_critical: true, collected_at: "2025-01-01" }
    ];
    
    expect(areAllCriticalExamsValid(exams)).toBe(true);
  });
});

describe("Triage Exams - Cenários de QA", () => {
  testFn("QA-a: Triagem com críticos válidos + opcionais pendentes → S2 = OK", () => {
    const exams: TriageExamItem[] = [
      // Críticos válidos
      { code: "hemoglobin", label: "Hemoglobina", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      { code: "platelets", label: "Plaquetas", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      { code: "crp", label: "PCR", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      // Opcionais pendentes
      { code: "vitamin_d", label: "Vitamina D", status: "pendente", is_critical: false, collected_at: null },
      { code: "ferritin", label: "Ferritina", status: "pendente", is_critical: false, collected_at: null }
    ];
    
    // S2 deve ser permitido (todos críticos válidos)
    expect(areAllCriticalExamsValid(exams)).toBe(true);
    expect(getCriticalExams(exams).every(e => e.status === "válido")).toBe(true);
  });

  testFn("QA-b: Triagem com pelo menos 1 crítico pendente → S2 = BLOQUEADO", () => {
    const exams: TriageExamItem[] = [
      // Críticos - 1 pendente
      { code: "hemoglobin", label: "Hemoglobina", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      { code: "platelets", label: "Plaquetas", status: "pendente", is_critical: true, collected_at: null }, // PENDENTE!
      { code: "crp", label: "PCR", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      // Opcionais
      { code: "vitamin_d", label: "Vitamina D", status: "válido", is_critical: false, collected_at: "2025-01-01" }
    ];
    
    // S2 deve ser BLOQUEADO (1 crítico pendente)
    expect(areAllCriticalExamsValid(exams)).toBe(false);
  });

  testFn("QA-c: Triagem com crítico desatualizado → S2 = BLOQUEADO", () => {
    const exams: TriageExamItem[] = [
      { code: "hemoglobin", label: "Hemoglobina", status: "válido", is_critical: true, collected_at: "2025-01-01" },
      { code: "platelets", label: "Plaquetas", status: "desatualizado", is_critical: true, collected_at: "2024-09-01" }, // DESATUALIZADO!
    ];
    
    // S2 deve ser BLOQUEADO (1 crítico desatualizado !== válido)
    expect(areAllCriticalExamsValid(exams)).toBe(false);
  });
});

describe("Triage Exams - Bloqueio sem Triagem", () => {
  testFn("hasTriageExams retorna false para lista vazia", () => {
    expect(hasTriageExams([])).toBe(false);
  });

  testFn("hasTriageExams retorna true quando há exames", () => {
    const exams: TriageExamItem[] = [
      { code: "hemoglobin", label: "Hemoglobina", status: "pendente", is_critical: true, collected_at: null }
    ];
    expect(hasTriageExams(exams)).toBe(true);
  });

  testFn("extractExamsFromTriage retorna lista vazia para null/undefined", () => {
    expect(extractExamsFromTriage(null, null).length).toBe(0);
    expect(extractExamsFromTriage("", null).length).toBe(0);
    expect(extractExamsFromTriage("{}", null).length).toBe(0);
  });
});
