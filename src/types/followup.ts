// Types para o sistema de Follow-ups

export type FollowupTimepoint = 'D7' | 'D30' | 'D90' | 'D180' | 'D365';
export type FollowupStatus = 'pending' | 'completed' | 'missed' | 'cancelled';
export type GlobalChange = 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
export type AdverseEventSeverity = 'mild' | 'moderate' | 'severe';

export interface ProcedureFollowup {
  id: string;
  screening_id: string;
  patient_id: string;
  clinician_id: string;
  
  // Scheduling
  timepoint: FollowupTimepoint;
  scheduled_for: string;
  rescheduled_from: string | null;
  
  // Status
  status: FollowupStatus;
  completed_at: string | null;
  
  // Outcome data
  pain_score: number | null;
  function_score: number | null;
  function_text: string | null;
  global_change: GlobalChange | null;
  
  // Adverse events
  adverse_event: boolean;
  adverse_event_severity: AdverseEventSeverity | null;
  adverse_event_description: string | null;
  
  // Notes
  notes: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Joined data (opcional)
  patient?: {
    full_name: string;
    phone?: string;
  };
}

export interface FollowupOutcome {
  pain_score: number;
  function_score?: number;
  function_text?: string;
  global_change: GlobalChange;
  adverse_event: boolean;
  adverse_event_severity?: AdverseEventSeverity;
  adverse_event_description?: string;
  notes?: string;
}

export interface FollowupFilters {
  status?: FollowupStatus;
  period?: 'today' | 'next7days' | 'overdue' | 'all';
}

export const TIMEPOINT_LABELS: Record<FollowupTimepoint, string> = {
  D7: '7 dias',
  D30: '30 dias',
  D90: '90 dias',
  D180: '6 meses',
  D365: '1 ano',
};

export const STATUS_LABELS: Record<FollowupStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  missed: 'Perdido',
  cancelled: 'Cancelado',
};

export const GLOBAL_CHANGE_LABELS: Record<GlobalChange, string> = {
  much_better: 'Muito melhor',
  better: 'Melhor',
  same: 'Igual',
  worse: 'Pior',
  much_worse: 'Muito pior',
};

export const SEVERITY_LABELS: Record<AdverseEventSeverity, string> = {
  mild: 'Leve',
  moderate: 'Moderado',
  severe: 'Grave',
};
