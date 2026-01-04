// Daily Clinical Dashboard - Types
// Cada card representa um EVENTO CLÍNICO ÚNICO: (Data + Horário + Caso)

export type ClinicalStage = 'avaliacao' | 'procedimento' | 'followup' | 'alta';

export interface ClinicalAlert {
  type: 'warning' | 'info' | 'critical';
  message: string;
  source?: string;
}

// Estrutura fixa do card conforme especificação
export interface ClinicalEventCard {
  id: string;
  
  // BLOCO 1 — TEMPO (sempre visível)
  event_date: string;
  time_start: string;
  time_end?: string;
  
  // BLOCO 2 — IDENTIFICAÇÃO
  patient_id: string;
  patient_name: string;
  case_id?: string;
  case_summary?: string; // Formato: "Região — Diagnóstico"
  
  // BLOCO 3 — ETAPA CLÍNICA (congelado no agendamento)
  clinical_stage: ClinicalStage;
  
  // BLOCO 4 — AÇÃO DO DIA
  today_action: string;
  
  // BLOCO 5 — STATUS CLÍNICO RECENTE (opcional)
  last_outcome?: string;
  
  // BLOCO 6 — ALERTAS CLÍNICOS (lista pré-calculada)
  alerts: ClinicalAlert[];
  
  // Metadados
  attended: boolean;
  attended_at?: string;
}

// Contadores do topo (fixos)
export interface DashboardCounters {
  avaliacoes: number;
  procedimentos: number;
  followups: number;
}

// Filtros da tela
export interface DashboardFilters {
  stage?: ClinicalStage;
  searchTerm?: string;
}

// Toggle de visualização
export type ViewMode = 'by_time' | 'by_stage';

// Stage labels e cores
export const STAGE_CONFIG: Record<ClinicalStage, { label: string; color: string; bgColor: string }> = {
  avaliacao: { 
    label: 'Avaliação', 
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  procedimento: { 
    label: 'Procedimento', 
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  followup: { 
    label: 'Follow-up', 
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  alta: { 
    label: 'Alta', 
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
};
