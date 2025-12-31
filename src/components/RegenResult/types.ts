/**
 * REGEN RESULT UI - Types
 * 
 * Tipos para a UI de resultado do motor REGENAPP.
 * READ-ONLY, consome apenas regen_engine_outputs e regen_canonical para exibição.
 */

import { RegenEngineOutputs } from "@/types/regen-engine";
import { RegenCanonical } from "@/types/regen-canonical";

export interface RegenResultData {
  engineOutputs: RegenEngineOutputs;
  canonical: RegenCanonical;
  canonicalUpdatedAt?: string;
  caseId?: string;
  patientName?: string;
}

export type ResultState = "loading" | "empty" | "error" | "outdated" | "ready";

export interface ResultCardProps {
  className?: string;
}

// Mensagens padrão para estados
export const RESULT_MESSAGES = {
  LOADING: "Carregando resultado...",
  EMPTY: "Nenhum resultado disponível. Execute a avaliação para gerar o resultado.",
  ERROR: "Erro ao carregar dados. Verifique o console para detalhes.",
  OUTDATED: "Este resultado pode estar desatualizado. Recalcule para refletir os dados atuais.",
  SAFETY_BLOCK: "Condições de segurança impedem a interpretação completa do caso.",
  NOT_CALCULATED: "Não calculado devido a bloqueio de segurança.",
  NOT_AVAILABLE: "Não disponível nesta versão.",
  CLINICAL_DECISION: "Decisão final é do profissional. Não substitui julgamento clínico.",
  NO_PRESCRIPTION: "O sistema não escolhe tratamento.",
  PROFESSIONAL_USE: "Uso profissional. Não substitui julgamento clínico.",
  LOW_CONFIDENCE: "Evitar recomendações fortes devido a baixa confiança nos dados.",
  INCOMPLETE_DATA: "Dados incompletos — reduzir confiança interpretativa.",
} as const;

// Mapa de tradução para classificações
export const CLASSIFICATION_LABELS: Record<string, string> = {
  "Not Ready": "Não Preparado",
  "Conditionally Ready": "Condicionalmente Preparado",
  "Potentially Ready": "Potencialmente Preparado",
  "Recommended": "Recomendado",
  "Possible with adjustments": "Possível com ajustes",
  "Not recommended": "Não recomendado",
  "Cannot evaluate": "Não é possível avaliar",
};

// Mapa de tradução para confidence
export const CONFIDENCE_LABELS: Record<string, string> = {
  "High": "Alta",
  "Medium": "Média",
  "Low": "Baixa",
};

// Mapa de tradução para status de lab
export const LAB_STATUS_LABELS: Record<string, string> = {
  "USE": "USAR",
  "REPEAT": "REPETIR",
  "REQUEST": "SOLICITAR",
};

// Mapa de tradução para validity de lab
export const LAB_VALIDITY_LABELS: Record<string, string> = {
  "VALID": "Válido",
  "CAUTION": "Atenção",
  "EXPIRED": "Expirado",
  "UNKNOWN": "Desconhecido",
};

// Mapa de tradução para categorias de orientação
export const GUIDANCE_CATEGORY_LABELS: Record<string, string> = {
  "lifestyle": "Estilo de Vida",
  "medication": "Medicação",
  "nutrition": "Nutrição",
  "preparation": "Preparação",
  "general": "Geral",
};

// Mapa de prioridades
export const PRIORITY_LABELS: Record<string, string> = {
  "high": "Alta",
  "medium": "Média",
  "low": "Baixa",
};
