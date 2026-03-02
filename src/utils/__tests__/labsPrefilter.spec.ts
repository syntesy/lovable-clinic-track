import { describe, it, expect } from "vitest";
import { preFilterLabsText } from "@/utils/preFilterLabsText";
import { normalizeLabs } from "@/utils/normalizeLabs";

// ══════════════════════════════════════
// Helper
// ══════════════════════════════════════

function run(rawText: string) {
  const pre = preFilterLabsText(rawText);
  const normalized = normalizeLabs(pre.filtered_text);
  return { pre, normalized };
}

// ══════════════════════════════════════
// Caso 1 — Laudo com metadados + exames
// ══════════════════════════════════════

describe("Caso 1 — Laudo com metadados + exames", () => {
  const input = `RESPONSÁVEL TÉCNICO: Marise Cortes - CRBM-GO: 761
CNES: 2339714
Paciente: Fulano de Tal
Método: CÁLCULO PELA FÓRMULA CKD-EPI (2021)
Hemoglobina 13,5 g/dL (Ref 12,0 a 16,0)
Hematócrito 39,5 % (Ref 36,0 a 46,0)
Ferritina: 83 ng/mL (Ref 20 - 300)
Glicose: 95 mg/dL (Ref 70 - 99)
HbA1c: 5,7 % (Ref 4,0 - 5,6)
Assinado digitalmente sob o número: f450b2cac153c430e4592183c17bff`;

  it("filtered_text should NOT contain non-clinical metadata", () => {
    const { pre } = run(input);
    expect(pre.filtered_text).not.toMatch(/CNES/i);
    expect(pre.filtered_text).not.toMatch(/CRBM/i);
    expect(pre.filtered_text).not.toMatch(/Responsável\s+Técnic/i);
    expect(pre.filtered_text).not.toMatch(/Assinado\s+digitalmente/i);
    expect(pre.filtered_text).not.toMatch(/CKD[\s-]?EPI/i);
  });

  it("should extract expected biomarkers", () => {
    const { normalized } = run(input);
    const names = normalized.labs.map(l => l.name);
    expect(names).toContain("Hemoglobina");
    expect(names).toContain("Hematócrito");
    expect(names).toContain("Ferritina");
    expect(names).toContain("Glicose");
    expect(names).toContain("HbA1c");
  });

  it("HbA1c should have unit %", () => {
    const { normalized } = run(input);
    const hba1c = normalized.labs.find(l => l.name === "HbA1c");
    expect(hba1c).toBeDefined();
    expect(hba1c!.unit).toBe("%");
  });

  it("Ferritina should have unit ng/mL", () => {
    const { normalized } = run(input);
    const ferritina = normalized.labs.find(l => l.name === "Ferritina");
    expect(ferritina).toBeDefined();
    expect(ferritina!.unit).toBe("ng/mL");
  });

  it("excluded stats should be correct", () => {
    const { pre } = run(input);
    expect(pre.stats.excluded).toBeGreaterThanOrEqual(4); // CNES, CRBM, Método, Assinado
  });
});

// ══════════════════════════════════════
// Caso 2 — CNES e números gigantes não viram exames
// ══════════════════════════════════════

describe("Caso 2 — CNES e números gigantes não viram exames", () => {
  const input = `CNES: 2339714
Protocolo: 202512021129
Registro: 9007373-1
Ferritina: 22,2 ng/mL (Ref 20-300)`;

  it("excluded_lines should contain CNES/Protocolo/Registro", () => {
    const { pre } = run(input);
    const excludedTexts = pre.excluded_lines.map(e => e.line.toLowerCase());
    expect(excludedTexts.some(t => t.includes("cnes"))).toBe(true);
    expect(excludedTexts.some(t => t.includes("protocolo"))).toBe(true);
    expect(excludedTexts.some(t => t.includes("registro"))).toBe(true);
  });

  it("normalized.labs should contain ONLY Ferritina", () => {
    const { normalized } = run(input);
    const names = normalized.labs.map(l => l.name);
    expect(names).toContain("Ferritina");
    expect(names.length).toBe(1);
  });
});

// ══════════════════════════════════════
// Caso 3 — Linha sem biomarcador conhecido é excluída
// ══════════════════════════════════════

describe("Caso 3 — Linha sem biomarcador conhecido é excluída", () => {
  const input = `Resultado impresso por paciente (%PRECISIONCLIENTEPSC). Data Impressão: 02/12/25 11:29
COLESTEROL HDL 66 mg/dL`;

  it("first line should be excluded by NON_CLINICAL_METADATA_KEYWORD", () => {
    const { pre } = run(input);
    expect(pre.excluded_lines.length).toBeGreaterThanOrEqual(1);
    expect(pre.excluded_lines[0].reason).toBe("NON_CLINICAL_METADATA_KEYWORD");
  });

  it("HDL should be recognized with mg/dL", () => {
    const { normalized } = run(input);
    const hdl = normalized.labs.find(l => l.name === "HDL");
    expect(hdl).toBeDefined();
    expect(hdl!.unit).toBe("mg/dL");
    expect(hdl!.value).toBe(66);
  });
});

// ══════════════════════════════════════
// Caso 4 — Unidade ausente em biomarcador crítico bloqueia
// ══════════════════════════════════════

describe("Caso 4 — Unidade ausente em biomarcador crítico bloqueia", () => {
  const input = `Sódio: 140 (Ref 135-145)
Potássio: 4,2 (Ref 3,5-5,1)`;

  it("Sódio and Potássio should be in labs", () => {
    const { normalized } = run(input);
    const names = normalized.labs.map(l => l.name);
    expect(names).toContain("Sódio");
    expect(names).toContain("Potássio");
  });

  it("both should have is_interpretable=false", () => {
    const { normalized } = run(input);
    const sodio = normalized.labs.find(l => l.name === "Sódio");
    const potassio = normalized.labs.find(l => l.name === "Potássio");
    expect(sodio!.is_interpretable).toBe(false);
    expect(potassio!.is_interpretable).toBe(false);
  });

  it("blocking_reasons should contain critical missing unit reason", () => {
    const { normalized } = run(input);
    const sodio = normalized.labs.find(l => l.name === "Sódio");
    const potassio = normalized.labs.find(l => l.name === "Potássio");
    expect(sodio!.blocking_reasons).toContain("CRITICAL_MISSING_UNIT");
    expect(potassio!.blocking_reasons).toContain("CRITICAL_MISSING_UNIT");
  });
});

// ══════════════════════════════════════
// Caso 5 — OCR lixo / assinatura digital não vira Vitamina B12
// ══════════════════════════════════════

describe("Caso 5 — OCR lixo / assinatura digital não vira biomarcador válido", () => {
  const input = `Vitamina B12 923172
Este laudo foi assinado digitalmente sob o número: f450b2ca`;

  it("assinatura line should be excluded by prefilter", () => {
    const { pre } = run(input);
    const excludedTexts = pre.excluded_lines.map(e => e.line.toLowerCase());
    expect(excludedTexts.some(t => t.includes("assinado digitalmente"))).toBe(true);
  });

  it("Vitamina B12 with garbage value should be blocked (no unit, no ref)", () => {
    const { normalized } = run(input);
    const b12 = normalized.labs.find(l => l.name === "Vitamina B12");
    if (b12) {
      expect(b12.is_interpretable).toBe(false);
      expect(b12.blocking_reasons.length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════
// Caso 6 — "RESULTADO" genérico não vira biomarcador
// ══════════════════════════════════════

describe("Caso 6 — RESULTADO genérico não vira biomarcador", () => {
  const input = `RESULTADO: 805 pg/mL
Ferritina: 83 ng/mL (Ref 20-300)`;

  it("RESULTADO should NOT appear in labs", () => {
    const { normalized } = run(input);
    const names = normalized.labs.map(l => l.name);
    expect(names).not.toContain("RESULTADO");
    expect(names).not.toContain("Resultado");
  });

  it("Ferritina should still be parsed", () => {
    const { normalized } = run(input);
    const ferritina = normalized.labs.find(l => l.name === "Ferritina");
    expect(ferritina).toBeDefined();
    expect(ferritina!.value).toBe(83);
  });
});

// ══════════════════════════════════════
// Caso 7 — Admin headers are excluded
// ══════════════════════════════════════

describe("Caso 7 — Admin headers are excluded", () => {
  const input = `Laboratório: Lab Saúde LTDA
Endereço: Rua A, 123
Telefone: (62) 3333-4444
CNPJ: 12.345.678/0001-99
Glicose: 95 mg/dL (Ref 70-99)`;

  it("admin headers should be excluded", () => {
    const { pre } = run(input);
    expect(pre.stats.excluded).toBeGreaterThanOrEqual(4);
    expect(pre.filtered_text).not.toMatch(/Laboratório/i);
    expect(pre.filtered_text).not.toMatch(/Endereço/i);
    expect(pre.filtered_text).not.toMatch(/Telefone/i);
    expect(pre.filtered_text).not.toMatch(/CNPJ/i);
  });

  it("Glicose should still be parsed", () => {
    const { normalized } = run(input);
    const glicose = normalized.labs.find(l => l.name === "Glicose");
    expect(glicose).toBeDefined();
    expect(glicose!.value).toBe(95);
  });
});

// ══════════════════════════════════════
// Caso 8 — kept_lines is populated
// ══════════════════════════════════════

describe("Caso 8 — kept_lines is populated", () => {
  const input = `CNES: 123456
Glicose: 95 mg/dL`;

  it("kept_lines should contain only the biomarker line", () => {
    const { pre } = run(input);
    expect(pre.kept_lines.length).toBe(1);
    expect(pre.kept_lines[0]).toContain("Glicose");
  });
});
