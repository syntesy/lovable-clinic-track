/**
 * REGEN CASE STATUS - Máquina de Estados do Fluxo REGENAPP
 * 
 * S0: Triagem Concluída (aguardando avaliação clínica + exames)
 * S1: Avaliação Clínica Concluída (aguardando exames)
 * S2: Exames Completos e Válidos (pronto para score definitivo)
 * S3: Score Definitivo Gerado
 */

export type RegenCaseStatus = "S0" | "S1" | "S2" | "S3";

export interface RegenCaseStatusInfo {
  status: RegenCaseStatus;
  label: string;
  description: string;
  color: "blue" | "yellow" | "green" | "red";
  provisionalLabel?: string;
}

export const REGEN_CASE_STATUS_MAP: Record<RegenCaseStatus, RegenCaseStatusInfo> = {
  S0: {
    status: "S0",
    label: "SCORE PROVISÓRIO",
    description: "AGUARDANDO AVALIAÇÃO CLÍNICA E EXAMES",
    color: "blue",
    provisionalLabel: "Triagem concluída, aguardando avaliação profissional"
  },
  S1: {
    status: "S1",
    label: "SCORE PROVISÓRIO",
    description: "AGUARDANDO EXAMES",
    color: "yellow",
    provisionalLabel: "Avaliação clínica concluída, aguardando exames laboratoriais"
  },
  S2: {
    status: "S2",
    label: "AVALIAÇÃO COMPLETA",
    description: "EXAMES DISPONÍVEIS",
    color: "green",
    provisionalLabel: "Pronto para gerar Score Definitivo REGENAPP"
  },
  S3: {
    status: "S3",
    label: "SCORE DEFINITIVO GERADO",
    description: "",
    color: "red",
    provisionalLabel: null
  }
};

// Exames críticos obrigatórios (campos exatos do canonical)
export const REQUIRED_CRITICAL_LABS = [
  "hemoglobin",
  "leukocytes",
  "platelets",
  "crp",
  "hba1c",
  "ferritin"
] as const;

export type RequiredCriticalLab = typeof REQUIRED_CRITICAL_LABS[number];

// Labels para exames em português
export const CRITICAL_LAB_LABELS: Record<RequiredCriticalLab, string> = {
  hemoglobin: "Hemoglobina",
  leukocytes: "Leucócitos",
  platelets: "Plaquetas",
  crp: "PCR (Proteína C Reativa)",
  hba1c: "HbA1c (Hemoglobina Glicada)",
  ferritin: "Ferritina"
};

/**
 * Verifica se avaliação clínica está completa
 */
export function isClinicalAssessmentComplete(data: {
  clinical_chief_complaint?: string | null;
  clinical_anamnesis?: string | null;
  clinical_physical_exam?: string | null;
  clinical_diagnosis?: string | null;
}): boolean {
  return !!(
    data.clinical_chief_complaint?.trim() &&
    data.clinical_anamnesis?.trim() &&
    data.clinical_physical_exam?.trim() &&
    data.clinical_diagnosis?.trim()
  );
}

/**
 * Estrutura esperada para cada exame validado
 */
export interface ValidatedLabData {
  status: string;        // DIE status: "USE" | "REPEAT" | "REQUEST"
  value?: number | null; // Valor numérico do exame
  date?: string | null;  // Data da coleta (ISO string)
}

/**
 * Verifica se todos os exames críticos estão válidos
 * Requisitos: valor preenchido + data preenchida + DIE = USE
 */
export function areAllCriticalLabsValid(labsValidated: Record<string, ValidatedLabData> | null): boolean {
  if (!labsValidated) return false;
  
  return REQUIRED_CRITICAL_LABS.every(lab => {
    const labData = labsValidated[lab];
    if (!labData) return false;
    
    // Verifica os 3 requisitos obrigatórios:
    // 1. status === "USE"
    // 2. valor preenchido (não null/undefined)
    // 3. data preenchida (não null/undefined/vazia)
    const hasValidStatus = labData.status === "USE";
    const hasValue = labData.value !== null && labData.value !== undefined;
    const hasDate = labData.date !== null && labData.date !== undefined && labData.date !== "";
    
    return hasValidStatus && hasValue && hasDate;
  });
}

/**
 * Retorna detalhes sobre qual requisito está faltando para cada exame
 */
export function getLabValidationDetails(labsValidated: Record<string, ValidatedLabData> | null): Record<string, {
  isValid: boolean;
  missingValue: boolean;
  missingDate: boolean;
  invalidStatus: boolean;
}> {
  const result: Record<string, { isValid: boolean; missingValue: boolean; missingDate: boolean; invalidStatus: boolean }> = {};
  
  REQUIRED_CRITICAL_LABS.forEach(lab => {
    const labData = labsValidated?.[lab];
    if (!labData) {
      result[lab] = { isValid: false, missingValue: true, missingDate: true, invalidStatus: true };
    } else {
      const hasValue = labData.value !== null && labData.value !== undefined;
      const hasDate = labData.date !== null && labData.date !== undefined && labData.date !== "";
      const hasValidStatus = labData.status === "USE";
      result[lab] = {
        isValid: hasValue && hasDate && hasValidStatus,
        missingValue: !hasValue,
        missingDate: !hasDate,
        invalidStatus: !hasValidStatus
      };
    }
  });
  
  return result;
}

/**
 * Determina o status correto baseado nos dados
 */
export function computeCaseStatus(data: {
  triage_completed_at?: string | null;
  clinical_chief_complaint?: string | null;
  clinical_anamnesis?: string | null;
  clinical_physical_exam?: string | null;
  clinical_diagnosis?: string | null;
  labs_validated?: Record<string, ValidatedLabData> | null;
  regen_engine_outputs?: unknown;
}): RegenCaseStatus {
  // S3: Score definitivo já existe
  if (data.regen_engine_outputs) {
    return "S3";
  }
  
  // Verificar avaliação clínica
  const clinicalComplete = isClinicalAssessmentComplete({
    clinical_chief_complaint: data.clinical_chief_complaint,
    clinical_anamnesis: data.clinical_anamnesis,
    clinical_physical_exam: data.clinical_physical_exam,
    clinical_diagnosis: data.clinical_diagnosis
  });
  
  // S2: Avaliação clínica completa + exames válidos
  if (clinicalComplete && areAllCriticalLabsValid(data.labs_validated)) {
    return "S2";
  }
  
  // S1: Avaliação clínica completa, mas exames pendentes
  if (clinicalComplete) {
    return "S1";
  }
  
  // S0: Apenas triagem concluída
  return "S0";
}

/**
 * Ações permitidas por estado
 */
export interface StateActions {
  canGenerateExamRequest: boolean;
  canGeneratePreReport: boolean;
  canGenerateDefinitiveScore: boolean;
  canRecalculate: boolean;
}

export function getAllowedActions(status: RegenCaseStatus): StateActions {
  switch (status) {
    case "S0":
      return {
        canGenerateExamRequest: false,
        canGeneratePreReport: false,
        canGenerateDefinitiveScore: false,
        canRecalculate: false
      };
    case "S1":
      return {
        canGenerateExamRequest: true,
        canGeneratePreReport: true,
        canGenerateDefinitiveScore: false,
        canRecalculate: false
      };
    case "S2":
      return {
        canGenerateExamRequest: true,
        canGeneratePreReport: true,
        canGenerateDefinitiveScore: true,
        canRecalculate: false
      };
    case "S3":
      return {
        canGenerateExamRequest: true,
        canGeneratePreReport: true,
        canGenerateDefinitiveScore: false,
        canRecalculate: true
      };
  }
}