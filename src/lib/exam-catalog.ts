/**
 * EXAM CATALOG - Catálogo Canônico de Exames Laboratoriais
 * 
 * Fonte única de verdade para códigos, labels e sinônimos de exames.
 * Usado para normalizar dados entre diferentes fontes (triagem IA, modal, impressão).
 */

export type ExamPriority = "critical" | "additional";

export interface ExamDefinition {
  code: string;
  label_pt: string;
  group_code?: string; // Ex: CBC agrupa hemoglobin, leukocytes, platelets
  priority: ExamPriority;
  synonyms: string[];
}

/**
 * Catálogo completo de exames
 * Ordenado por prioridade: críticos primeiro, depois adicionais
 */
export const EXAM_CATALOG: ExamDefinition[] = [
  // === CRÍTICOS (obrigatórios para avaliação ortobiológica) ===
  {
    code: "hemoglobin",
    label_pt: "Hemoglobina",
    group_code: "CBC",
    priority: "critical",
    synonyms: ["hemoglobina", "hb", "hemoglobin", "hgb"],
  },
  {
    code: "leukocytes",
    label_pt: "Leucócitos",
    group_code: "CBC",
    priority: "critical",
    synonyms: ["leucócitos", "leucocitos", "leukocytes", "wbc", "globulos brancos", "glóbulos brancos"],
  },
  {
    code: "platelets",
    label_pt: "Plaquetas",
    group_code: "CBC",
    priority: "critical",
    synonyms: ["plaquetas", "platelets", "plt", "contagem de plaquetas"],
  },
  {
    code: "crp",
    label_pt: "PCR (Proteína C Reativa)",
    priority: "critical",
    synonyms: ["pcr", "proteína c reativa", "proteina c reativa", "crp", "c-reactive protein", "pcr-us", "pcr ultrassensível", "pcr ultrassensivel"],
  },
  {
    code: "hba1c",
    label_pt: "HbA1c (Hemoglobina Glicada)",
    priority: "critical",
    synonyms: ["hba1c", "hemoglobina glicada", "a1c", "glicohemoglobina", "hemoglobin a1c"],
  },
  {
    code: "ferritin",
    label_pt: "Ferritina",
    priority: "critical",
    synonyms: ["ferritina", "ferritin"],
  },

  // === ADICIONAIS (opcionais, podem ser recomendados pela IA) ===
  {
    code: "vitamin_d",
    label_pt: "Vitamina D (25-OH)",
    priority: "additional",
    synonyms: ["vitamina d", "vitamin d", "25-oh", "25-oh-d", "25-hidroxivitamina d", "vit d", "25oh vitamina d"],
  },
  {
    code: "vitamin_b12",
    label_pt: "Vitamina B12",
    priority: "additional",
    synonyms: ["vitamina b12", "vitamin b12", "b12", "cobalamina", "cianocobalamina"],
  },
  {
    code: "iron",
    label_pt: "Ferro Sérico",
    priority: "additional",
    synonyms: ["ferro sérico", "ferro serico", "ferro", "iron", "serum iron", "fe"],
  },
  {
    code: "transferrin",
    label_pt: "Transferrina",
    priority: "additional",
    synonyms: ["transferrina", "transferrin"],
  },
  {
    code: "tsh",
    label_pt: "TSH",
    priority: "additional",
    synonyms: ["tsh", "hormônio tireoestimulante", "hormonio tireoestimulante", "tireoestimulante"],
  },
  {
    code: "urea",
    label_pt: "Ureia",
    priority: "additional",
    synonyms: ["ureia", "urea", "ureia sérica", "ureia serica"],
  },
  {
    code: "creatinine",
    label_pt: "Creatinina",
    priority: "additional",
    synonyms: ["creatinina", "creatinine", "cr"],
  },
  {
    code: "alt",
    label_pt: "ALT (TGP)",
    priority: "additional",
    synonyms: ["alt", "tgp", "alanina aminotransferase", "transaminase glutâmico-pirúvica"],
  },
  {
    code: "ast",
    label_pt: "AST (TGO)",
    priority: "additional",
    synonyms: ["ast", "tgo", "aspartato aminotransferase", "transaminase glutâmico-oxalacética"],
  },
  {
    code: "glucose",
    label_pt: "Glicemia de Jejum",
    priority: "additional",
    synonyms: ["glicemia", "glicemia de jejum", "glucose", "fasting glucose", "glicose"],
  },
  {
    code: "hematocrit",
    label_pt: "Hematócrito",
    group_code: "CBC",
    priority: "additional",
    synonyms: ["hematócrito", "hematocrito", "hematocrit", "hct", "ht"],
  },
  {
    code: "magnesium",
    label_pt: "Magnésio",
    priority: "additional",
    synonyms: ["magnésio", "magnesio", "magnesium", "mg sérico", "mg serico"],
  },
  {
    code: "cbc",
    label_pt: "Hemograma Completo",
    priority: "additional",
    synonyms: ["hemograma completo", "hemograma", "cbc", "complete blood count", "blood count"],
  },
  {
    code: "lipid_panel",
    label_pt: "Perfil Lipídico",
    priority: "additional",
    synonyms: ["perfil lipídico", "perfil lipidico", "lipid panel", "colesterol total", "lipidograma"],
  },
  {
    code: "insulin",
    label_pt: "Insulina",
    priority: "additional",
    synonyms: ["insulina", "insulin", "insulina de jejum"],
  },
  {
    code: "t3",
    label_pt: "T3 Livre",
    priority: "additional",
    synonyms: ["t3", "t3 livre", "triiodotironina", "free t3"],
  },
  {
    code: "t4",
    label_pt: "T4 Livre",
    priority: "additional",
    synonyms: ["t4", "t4 livre", "tiroxina", "free t4"],
  },
  {
    code: "testosterone",
    label_pt: "Testosterona",
    priority: "additional",
    synonyms: ["testosterona", "testosterone", "testosterona total"],
  },
];

// Mapa para lookup rápido por código
const EXAM_BY_CODE = new Map<string, ExamDefinition>();
EXAM_CATALOG.forEach(exam => EXAM_BY_CODE.set(exam.code, exam));

// Mapa para lookup por sinônimo (normalizado lowercase)
const EXAM_BY_SYNONYM = new Map<string, ExamDefinition>();
EXAM_CATALOG.forEach(exam => {
  exam.synonyms.forEach(synonym => {
    EXAM_BY_SYNONYM.set(synonym.toLowerCase().trim(), exam);
  });
  // Também adiciona o código e label como sinônimos
  EXAM_BY_SYNONYM.set(exam.code.toLowerCase(), exam);
  EXAM_BY_SYNONYM.set(exam.label_pt.toLowerCase(), exam);
});

/**
 * Obtém um exame pelo código canônico
 */
export function getExamByCode(code: string): ExamDefinition | undefined {
  return EXAM_BY_CODE.get(code);
}

/**
 * Obtém o label PT de um exame pelo código
 */
export function getExamLabel(code: string): string {
  const exam = EXAM_BY_CODE.get(code);
  return exam?.label_pt || code;
}

/**
 * Verifica se um código é de exame crítico
 */
export function isCriticalExam(code: string): boolean {
  const exam = EXAM_BY_CODE.get(code);
  return exam?.priority === "critical";
}

/**
 * Resolve um texto de exame para o código canônico
 * Ex: "Hemograma completo" → "cbc"
 * Ex: "Vitamina D" → "vitamin_d"
 * Ex: "PCR-us" → "crp"
 */
export function resolveExamCode(input: string): string | null {
  if (!input) return null;
  
  const normalized = input.toLowerCase().trim();
  
  // Primeiro, tenta match direto por código
  if (EXAM_BY_CODE.has(normalized)) {
    return normalized;
  }
  
  // Depois, tenta por sinônimo
  const exam = EXAM_BY_SYNONYM.get(normalized);
  if (exam) {
    return exam.code;
  }
  
  // Fallback: busca parcial nos sinônimos
  for (const [synonym, examDef] of EXAM_BY_SYNONYM.entries()) {
    if (normalized.includes(synonym) || synonym.includes(normalized)) {
      return examDef.code;
    }
  }
  
  return null;
}

/**
 * Normaliza uma lista de exames (strings ou códigos) para códigos canônicos
 * Remove duplicados e ordena por prioridade (críticos primeiro)
 */
export function normalizeExamList(input: string[] | null | undefined): string[] {
  if (!input || !Array.isArray(input) || input.length === 0) {
    return [];
  }

  const resolvedCodes = new Set<string>();
  
  for (const item of input) {
    if (!item || typeof item !== "string") continue;
    
    const code = resolveExamCode(item);
    if (code) {
      resolvedCodes.add(code);
      
      // Se for CBC (hemograma completo), adiciona os analitos individuais
      if (code === "cbc") {
        resolvedCodes.add("hemoglobin");
        resolvedCodes.add("leukocytes");
        resolvedCodes.add("platelets");
        resolvedCodes.add("hematocrit");
      }
    }
  }
  
  // Converte para array e ordena por prioridade
  const sorted = Array.from(resolvedCodes).sort((a, b) => {
    const examA = EXAM_BY_CODE.get(a);
    const examB = EXAM_BY_CODE.get(b);
    
    // Críticos primeiro
    if (examA?.priority === "critical" && examB?.priority !== "critical") return -1;
    if (examA?.priority !== "critical" && examB?.priority === "critical") return 1;
    
    // Dentro da mesma prioridade, ordena alfabeticamente pelo label
    const labelA = examA?.label_pt || a;
    const labelB = examB?.label_pt || b;
    return labelA.localeCompare(labelB, "pt-BR");
  });
  
  return sorted;
}

/**
 * Retorna os códigos de todos os exames críticos
 */
export function getCriticalExamCodes(): string[] {
  return EXAM_CATALOG
    .filter(exam => exam.priority === "critical")
    .map(exam => exam.code);
}

/**
 * Retorna os códigos de todos os exames adicionais
 */
export function getAdditionalExamCodes(): string[] {
  return EXAM_CATALOG
    .filter(exam => exam.priority === "additional")
    .map(exam => exam.code);
}

/**
 * Converte códigos para lista de objetos com id/label para UI
 */
export function examCodesToUIList(codes: string[]): Array<{ id: string; label: string; priority: ExamPriority }> {
  return codes.map(code => {
    const exam = EXAM_BY_CODE.get(code);
    return {
      id: code,
      label: exam?.label_pt || code,
      priority: exam?.priority || "additional",
    };
  });
}
