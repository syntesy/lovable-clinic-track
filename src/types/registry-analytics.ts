// Types for Registry Analytics v1.1

export type ResponderStatus = 
  | 'ROBUST_RESPONDER' 
  | 'MODERATE_RESPONDER' 
  | 'NON_RESPONDER' 
  | 'INCONCLUSIVE';

export type ResponderReasonCode = 
  | 'NO_D90'
  | 'MISSING_BASELINE_PAIN'
  | 'MISSING_BASELINE_FUNCTION'
  | 'ROBUST_PAIN_D90'
  | 'ROBUST_FUNCTION_D90'
  | 'MODERATE_PAIN_D90'
  | 'MODERATE_FUNCTION_D90'
  | 'TRANSIENT_D30_ONLY'
  | 'WORSENED_D90'
  | 'INSUFFICIENT_DATA';

export interface RegistryCaseSummary {
  screening_id: string;
  clinician_id: string;
  patient_id: string;
  procedure_type: string;
  diagnosis: string | null;
  tissue_type: string | null;
  baseline_pain_nrs: number | null;
  baseline_function_score: number | null;
  followup_completion_rate: number;
  has_d30: boolean;
  has_d90: boolean;
  has_d180: boolean;
  has_d365: boolean;
  d30_pain: number | null;
  d90_pain: number | null;
  d180_pain: number | null;
  d365_pain: number | null;
  d30_function: number | null;
  d90_function: number | null;
  d180_function: number | null;
  d365_function: number | null;
  d30_global_change: string | null;
  d90_global_change: string | null;
  adverse_event_any: boolean;
  missed_count: number | null;
  responder_status: ResponderStatus;
  responder_reason_code: ResponderReasonCode;
  screening_created_at: string;
}

export interface RegistryFilters {
  diagnosis?: string;
  tissue_type?: string;
  procedure_type?: string;
  period?: 'd30' | 'd90' | 'd180' | 'd365' | 'all';
  d90_status?: 'completed' | 'inconclusive' | 'all';
}

export interface RegistryMetrics {
  totalCases: number;
  d90CompletionRate: number;
  missedRate: number;
  robustRate: number;
  moderateRate: number;
  nonResponderRate: number;
  inconclusiveRate: number;
}

export interface PainCurvePoint {
  timepoint: string;
  days: number;
  pain: number | null;
  function: number | null;
}

export interface RegistryExportLog {
  id: string;
  exported_by: string;
  exported_at: string;
  filters_json: Record<string, unknown>;
  row_count: number;
  export_version: string;
}

export const RESPONDER_STATUS_LABELS: Record<ResponderStatus, string> = {
  ROBUST_RESPONDER: 'Robusto',
  MODERATE_RESPONDER: 'Moderado',
  NON_RESPONDER: 'Não Respondedor',
  INCONCLUSIVE: 'Inconclusivo',
};

export const RESPONDER_STATUS_COLORS: Record<ResponderStatus, string> = {
  ROBUST_RESPONDER: 'bg-green-500',
  MODERATE_RESPONDER: 'bg-yellow-500',
  NON_RESPONDER: 'bg-red-500',
  INCONCLUSIVE: 'bg-gray-400',
};

export const REASON_CODE_LABELS: Record<ResponderReasonCode, string> = {
  NO_D90: 'Sem D90',
  MISSING_BASELINE_PAIN: 'Sem baseline de dor',
  MISSING_BASELINE_FUNCTION: 'Sem baseline de função',
  ROBUST_PAIN_D90: 'Δ Dor ≥ 4 em D90',
  ROBUST_FUNCTION_D90: 'Δ Função ≥ 30% em D90',
  MODERATE_PAIN_D90: 'Δ Dor ≥ 2 em D90',
  MODERATE_FUNCTION_D90: 'Δ Função ≥ 20% em D90',
  TRANSIENT_D30_ONLY: 'Melhora transitória D30',
  WORSENED_D90: 'Piora em D90',
  INSUFFICIENT_DATA: 'Dados insuficientes',
};

export const TIMEPOINT_DAYS: Record<string, number> = {
  'Baseline': 0,
  'D30': 30,
  'D90': 90,
  'D180': 180,
  'D365': 365,
};
