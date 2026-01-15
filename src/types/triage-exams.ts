/**
 * TRIAGE EXAMS - Tipos e helpers para exames vindos da Triagem de Ortobiológicos
 * 
 * REGRA FUNDAMENTAL: A Avaliação Regenapp NÃO define quais exames devem ser realizados.
 * Ela apenas executa, acompanha e valida os exames solicitados pela Triagem.
 */

import { ExamGroup } from "./screening";

/**
 * Estrutura mínima de um exame para renderização na avaliação
 */
export interface TriageExamItem {
  code: string;          // Identificador do exame (ex: "hemoglobin")
  label: string;         // Nome exibido (ex: "Hemoglobina")
  status: "pendente" | "válido" | "desatualizado";
  is_critical: boolean;  // Definido pela triagem
  collected_at: string | null; // Data de coleta, quando existir
  axis?: string;         // Eixo/categoria do exame (ex: "HEMATOLÓGICO")
}

/**
 * Mapeamento de códigos de exame para labels em português
 * Fallback para exames não mapeados
 */
export const EXAM_CODE_LABELS: Record<string, string> = {
  // Hematológicos
  hemoglobin: "Hemoglobina",
  hemoglobina: "Hemoglobina",
  hematocrit: "Hematócrito",
  hematocrito: "Hematócrito",
  leukocytes: "Leucócitos",
  leucocitos: "Leucócitos",
  platelets: "Plaquetas",
  plaquetas: "Plaquetas",
  hemograma: "Hemograma Completo",
  hemograma_completo: "Hemograma Completo",
  
  // Inflamatórios
  crp: "PCR (Proteína C Reativa)",
  pcr: "PCR (Proteína C Reativa)",
  vhs: "VHS",
  
  // Metabólicos
  glucose: "Glicemia de Jejum",
  glicemia: "Glicemia de Jejum",
  hba1c: "HbA1c (Hemoglobina Glicada)",
  hemoglobina_glicada: "HbA1c (Hemoglobina Glicada)",
  
  // Nutricionais
  ferritin: "Ferritina",
  ferritina: "Ferritina",
  vitamin_d: "Vitamina D (25-OH)",
  vitamina_d: "Vitamina D (25-OH)",
  vitamin_b12: "Vitamina B12",
  vitamina_b12: "Vitamina B12",
  iron: "Ferro Sérico",
  ferro: "Ferro Sérico",
  transferrin_saturation: "Saturação de Transferrina",
  
  // Renais
  creatinine: "Creatinina",
  creatinina: "Creatinina",
  urea: "Ureia",
  ureia: "Ureia",
  
  // Hepáticos
  tgo: "TGO (AST)",
  tgp: "TGP (ALT)",
  ggt: "GGT",
  
  // Coagulação
  inr: "INR",
  tp: "Tempo de Protrombina",
  ttpa: "TTPA",
  
  // Tireoide
  tsh: "TSH",
  t4_livre: "T4 Livre",
  
  // Outros
  albumina: "Albumina",
  proteinas_totais: "Proteínas Totais",
};

/**
 * Normaliza código de exame para formato padrão (snake_case lowercase)
 */
export function normalizeExamCode(rawCode: string): string {
  return rawCode
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "_")     // Substitui caracteres especiais por _
    .replace(/^_+|_+$/g, "");        // Remove _ do início/fim
}

/**
 * Obtém label legível de um código de exame
 */
export function getExamLabel(code: string): string {
  const normalized = normalizeExamCode(code);
  return EXAM_CODE_LABELS[normalized] || EXAM_CODE_LABELS[code] || code;
}

/**
 * Extrai exames da triagem de ortobiológicos
 * 
 * @param analysisResult - Campo analysis_result (JSON string ou null)
 * @param recommendedExams - Campo recommended_exams (JSONB ou null)
 * @returns Lista de exames com estrutura normalizada
 */
export function extractExamsFromTriage(
  analysisResult: string | null,
  recommendedExams: ExamGroup[] | unknown[] | null
): TriageExamItem[] {
  const exams: TriageExamItem[] = [];
  const seenCodes = new Set<string>();

  // Primeiro: tentar extrair de analysis_result (formato mais recente)
  if (analysisResult) {
    try {
      const parsed = JSON.parse(analysisResult);
      
      // Formato: { requested_exams: { required: [...], optional: [...] } }
      const required = parsed?.requested_exams?.required || [];
      const optional = parsed?.requested_exams?.optional || [];
      
      // Exames obrigatórios são críticos
      for (const exam of required) {
        const code = typeof exam === "string" ? exam : exam?.code || exam?.name || "";
        if (code && !seenCodes.has(normalizeExamCode(code))) {
          seenCodes.add(normalizeExamCode(code));
          exams.push({
            code: normalizeExamCode(code),
            label: getExamLabel(code),
            status: "pendente",
            is_critical: true,
            collected_at: null,
            axis: typeof exam === "object" ? exam?.axis : undefined
          });
        }
      }
      
      // Exames opcionais não são críticos
      for (const exam of optional) {
        const code = typeof exam === "string" ? exam : exam?.code || exam?.name || "";
        if (code && !seenCodes.has(normalizeExamCode(code))) {
          seenCodes.add(normalizeExamCode(code));
          exams.push({
            code: normalizeExamCode(code),
            label: getExamLabel(code),
            status: "pendente",
            is_critical: false,
            collected_at: null,
            axis: typeof exam === "object" ? exam?.axis : undefined
          });
        }
      }
      
      // Se conseguiu extrair exames do analysis_result, retorna
      if (exams.length > 0) {
        return exams;
      }
    } catch {
      // Fallback para recommended_exams
    }
  }

  // Fallback: extrair de recommended_exams (formato ExamGroup[])
  if (Array.isArray(recommendedExams)) {
    for (const group of recommendedExams) {
      if (typeof group === "object" && group !== null && "exams" in group) {
        const examGroup = group as ExamGroup;
        const axis = examGroup.axis || "";
        const groupExams = examGroup.exams || [];
        
        // Determina se é crítico baseado no eixo (heurística)
        const isCriticalAxis = /hematol|inflama|metab|crítico|obrigat/i.test(axis);
        
        for (const examName of groupExams) {
          const normalizedCode = normalizeExamCode(examName);
          if (!seenCodes.has(normalizedCode)) {
            seenCodes.add(normalizedCode);
            exams.push({
              code: normalizedCode,
              label: getExamLabel(examName),
              status: "pendente",
              is_critical: isCriticalAxis,
              collected_at: null,
              axis
            });
          }
        }
      }
    }
  }

  return exams;
}

/**
 * Atualiza status dos exames baseado nos resultados validados
 */
export function updateExamsWithValidation(
  exams: TriageExamItem[],
  labsValidated: Record<string, { status: string; value?: number | null; date?: string | null }> | null,
  labsCollectedDate: string | null
): TriageExamItem[] {
  if (!labsValidated) return exams;
  
  return exams.map(exam => {
    const validation = labsValidated[exam.code];
    if (!validation) {
      return { ...exam, status: "pendente" as const, collected_at: labsCollectedDate };
    }
    
    const hasValue = validation.value !== null && validation.value !== undefined;
    const hasDate = validation.date || labsCollectedDate;
    
    if (validation.status === "USE" && hasValue && hasDate) {
      return { 
        ...exam, 
        status: "válido" as const, 
        collected_at: validation.date || labsCollectedDate 
      };
    }
    
    if (validation.status === "REPEAT" || validation.status === "REQUEST") {
      return { 
        ...exam, 
        status: "desatualizado" as const, 
        collected_at: validation.date || labsCollectedDate 
      };
    }
    
    return { ...exam, status: "pendente" as const, collected_at: labsCollectedDate };
  });
}

/**
 * Retorna apenas os exames críticos
 */
export function getCriticalExams(exams: TriageExamItem[]): TriageExamItem[] {
  return exams.filter(e => e.is_critical);
}

/**
 * Verifica se todos os exames críticos estão válidos
 */
export function areAllCriticalExamsValid(exams: TriageExamItem[]): boolean {
  const criticalExams = getCriticalExams(exams);
  if (criticalExams.length === 0) return false; // Sem exames críticos = não válido
  return criticalExams.every(e => e.status === "válido");
}
