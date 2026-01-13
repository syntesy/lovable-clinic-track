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
 * PAINÉIS LABORATORIAIS - Agrupam analitos individuais
 * Ex: CBC (Hemograma) agrupa hemoglobina, leucócitos, plaquetas, hematócrito
 */
export interface LabPanel {
  code: string;
  label_pt: string;
  /** Label detalhado para exibição: "Hemograma Completo (inclui: ...)" */
  label_detailed: string;
  components: string[]; // códigos dos analitos
  priority: ExamPriority;
  synonyms: string[];
}

export const LAB_PANELS: LabPanel[] = [
  {
    code: "cbc",
    label_pt: "Hemograma Completo",
    label_detailed: "Hemograma Completo (inclui: Hemoglobina, Leucócitos, Plaquetas, Hematócrito)",
    components: ["hemoglobin", "leukocytes", "platelets", "hematocrit"],
    priority: "critical",
    synonyms: ["hemograma completo", "hemograma", "cbc", "complete blood count", "blood count"],
  },
  {
    code: "lipid_panel",
    label_pt: "Perfil Lipídico",
    label_detailed: "Perfil Lipídico (inclui: Colesterol Total, LDL, HDL, Triglicerídeos)",
    components: ["cholesterol", "ldl", "hdl", "triglycerides"],
    priority: "additional",
    synonyms: ["perfil lipídico", "perfil lipidico", "lipid panel", "colesterol total", "lipidograma"],
  },
];

// Mapa para lookup rápido de painéis
const PANEL_BY_CODE = new Map<string, LabPanel>();
LAB_PANELS.forEach(panel => PANEL_BY_CODE.set(panel.code, panel));

// Mapa de componente → painel (para agrupar analitos)
const COMPONENT_TO_PANEL = new Map<string, LabPanel>();
LAB_PANELS.forEach(panel => {
  panel.components.forEach(comp => COMPONENT_TO_PANEL.set(comp, panel));
});

/**
 * Catálogo completo de exames
 * Ordenado por prioridade: críticos primeiro, depois adicionais
 */
export const EXAM_CATALOG: ExamDefinition[] = [
  // === CRÍTICOS (obrigatórios para avaliação ortobiológica) ===
  {
    code: "hemoglobin",
    label_pt: "Hemoglobina",
    group_code: "cbc",
    priority: "critical",
    synonyms: ["hemoglobina", "hb", "hemoglobin", "hgb"],
  },
  {
    code: "leukocytes",
    label_pt: "Leucócitos",
    group_code: "cbc",
    priority: "critical",
    synonyms: ["leucócitos", "leucocitos", "leukocytes", "wbc", "globulos brancos", "glóbulos brancos"],
  },
  {
    code: "platelets",
    label_pt: "Plaquetas",
    group_code: "cbc",
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
    group_code: "cbc",
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

// Adiciona sinônimos de painéis ao mapa
LAB_PANELS.forEach(panel => {
  panel.synonyms.forEach(synonym => {
    // Cria um ExamDefinition virtual para painéis
    const virtualExam: ExamDefinition = {
      code: panel.code,
      label_pt: panel.label_pt,
      priority: panel.priority,
      synonyms: panel.synonyms,
    };
    EXAM_BY_SYNONYM.set(synonym.toLowerCase().trim(), virtualExam);
  });
});

/**
 * Obtém um exame pelo código canônico
 */
export function getExamByCode(code: string): ExamDefinition | undefined {
  return EXAM_BY_CODE.get(code);
}

/**
 * Obtém um painel pelo código
 */
export function getPanelByCode(code: string): LabPanel | undefined {
  return PANEL_BY_CODE.get(code);
}

/**
 * Obtém o label PT de um exame pelo código
 */
export function getExamLabel(code: string): string {
  // Primeiro verifica se é um painel
  const panel = PANEL_BY_CODE.get(code);
  if (panel) return panel.label_pt;
  
  const exam = EXAM_BY_CODE.get(code);
  return exam?.label_pt || code;
}

/**
 * Obtém o label detalhado de um painel (com componentes listados)
 */
export function getPanelDetailedLabel(code: string): string | null {
  const panel = PANEL_BY_CODE.get(code);
  return panel?.label_detailed || null;
}

/**
 * Verifica se um código é de um painel laboratorial
 */
export function isLabPanel(code: string): boolean {
  return PANEL_BY_CODE.has(code);
}

/**
 * Obtém os componentes de um painel
 */
export function getPanelComponents(code: string): string[] {
  const panel = PANEL_BY_CODE.get(code);
  return panel?.components || [];
}

/**
 * Verifica se um código é de exame crítico (incluindo painéis)
 */
export function isCriticalExam(code: string): boolean {
  const panel = PANEL_BY_CODE.get(code);
  if (panel) return panel.priority === "critical";
  
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
  
  // Primeiro, tenta match direto por código de exame
  if (EXAM_BY_CODE.has(normalized)) {
    return normalized;
  }
  
  // Depois, tenta match direto por código de painel
  if (PANEL_BY_CODE.has(normalized)) {
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
 * Normaliza uma lista de exames para códigos DETALHADOS (analitos individuais)
 * Expande painéis em seus componentes.
 * Remove duplicados e ordena por prioridade (críticos primeiro)
 */
export function normalizeExamListDetailed(input: string[] | null | undefined): string[] {
  if (!input || !Array.isArray(input) || input.length === 0) {
    return [];
  }

  const resolvedCodes = new Set<string>();
  
  for (const item of input) {
    if (!item || typeof item !== "string") continue;
    
    const code = resolveExamCode(item);
    if (code) {
      // Se for um painel, expande para seus componentes
      const panel = PANEL_BY_CODE.get(code);
      if (panel) {
        panel.components.forEach(comp => resolvedCodes.add(comp));
      } else {
        resolvedCodes.add(code);
      }
    }
  }
  
  // Converte para array e ordena por prioridade
  return sortExamCodes(Array.from(resolvedCodes));
}

/**
 * Normaliza uma lista de exames para códigos AGRUPADOS (painéis laboratoriais)
 * Agrupa analitos em seus painéis quando possível.
 * Remove duplicados e ordena por prioridade (críticos primeiro)
 */
export function normalizeExamListGrouped(input: string[] | null | undefined): string[] {
  if (!input || !Array.isArray(input) || input.length === 0) {
    return [];
  }

  const resolvedCodes = new Set<string>();
  const panelsAdded = new Set<string>();
  
  for (const item of input) {
    if (!item || typeof item !== "string") continue;
    
    const code = resolveExamCode(item);
    if (code) {
      // Se for um painel, adiciona diretamente
      if (PANEL_BY_CODE.has(code)) {
        resolvedCodes.add(code);
        panelsAdded.add(code);
      } else {
        // Se for um componente de painel, adiciona o painel em vez do componente
        const parentPanel = COMPONENT_TO_PANEL.get(code);
        if (parentPanel) {
          resolvedCodes.add(parentPanel.code);
          panelsAdded.add(parentPanel.code);
        } else {
          // Exame avulso, adiciona diretamente
          resolvedCodes.add(code);
        }
      }
    }
  }
  
  // Converte para array e ordena por prioridade
  return sortExamCodes(Array.from(resolvedCodes));
}

/**
 * Mantém compatibilidade: normaliza expandindo CBC para analitos (comportamento original)
 * @deprecated Use normalizeExamListDetailed ou normalizeExamListGrouped conforme contexto
 */
export function normalizeExamList(input: string[] | null | undefined): string[] {
  return normalizeExamListDetailed(input);
}

/**
 * Ordena códigos por prioridade (críticos primeiro) e alfabeticamente
 */
function sortExamCodes(codes: string[]): string[] {
  return codes.sort((a, b) => {
    const priorityA = isCriticalExam(a);
    const priorityB = isCriticalExam(b);
    
    // Críticos primeiro
    if (priorityA && !priorityB) return -1;
    if (!priorityA && priorityB) return 1;
    
    // Dentro da mesma prioridade, ordena alfabeticamente pelo label
    const labelA = getExamLabel(a);
    const labelB = getExamLabel(b);
    return labelA.localeCompare(labelB, "pt-BR");
  });
}

/**
 * Retorna os códigos de todos os exames críticos (NÃO painéis, apenas analitos)
 */
export function getCriticalExamCodes(): string[] {
  return EXAM_CATALOG
    .filter(exam => exam.priority === "critical")
    .map(exam => exam.code);
}

/**
 * Retorna os códigos de todos os painéis críticos
 */
export function getCriticalPanelCodes(): string[] {
  return LAB_PANELS
    .filter(panel => panel.priority === "critical")
    .map(panel => panel.code);
}

/**
 * Retorna os códigos de todos os exames adicionais (NÃO painéis)
 */
export function getAdditionalExamCodes(): string[] {
  return EXAM_CATALOG
    .filter(exam => exam.priority === "additional" && !exam.group_code)
    .map(exam => exam.code);
}

/**
 * Retorna os códigos de todos os painéis adicionais
 */
export function getAdditionalPanelCodes(): string[] {
  return LAB_PANELS
    .filter(panel => panel.priority === "additional")
    .map(panel => panel.code);
}

/**
 * Converte códigos para lista de objetos com id/label para UI
 */
export function examCodesToUIList(codes: string[]): Array<{ id: string; label: string; priority: ExamPriority; isPanel: boolean; components?: string[] }> {
  return codes.map(code => {
    const panel = PANEL_BY_CODE.get(code);
    if (panel) {
      return {
        id: code,
        label: panel.label_pt,
        priority: panel.priority,
        isPanel: true,
        components: panel.components,
      };
    }
    
    const exam = EXAM_BY_CODE.get(code);
    return {
      id: code,
      label: exam?.label_pt || code,
      priority: exam?.priority || "additional",
      isPanel: false,
    };
  });
}

/**
 * Obtém informações completas de exibição para UI com agrupamento
 */
export interface ExamDisplayInfo {
  code: string;
  label: string;
  detailedLabel?: string;
  priority: ExamPriority;
  isPanel: boolean;
  components: Array<{ code: string; label: string }>;
}

export function getExamDisplayInfo(code: string): ExamDisplayInfo {
  const panel = PANEL_BY_CODE.get(code);
  if (panel) {
    return {
      code: panel.code,
      label: panel.label_pt,
      detailedLabel: panel.label_detailed,
      priority: panel.priority,
      isPanel: true,
      components: panel.components.map(c => ({
        code: c,
        label: EXAM_BY_CODE.get(c)?.label_pt || c,
      })),
    };
  }
  
  const exam = EXAM_BY_CODE.get(code);
  return {
    code,
    label: exam?.label_pt || code,
    priority: exam?.priority || "additional",
    isPanel: false,
    components: [],
  };
}
