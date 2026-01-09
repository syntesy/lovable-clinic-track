// =========================================================
// REGENAPP DILIGENCE & COMPLIANCE LAYER™ - Types
// Camada downstream, read-only sobre dados clínicos
// =========================================================

export interface DiligenceCaseReport {
  id: string;
  user_id: string;
  case_id: string;
  report_version: number;
  report_content: CaseReportContent;
  pdf_storage_path?: string;
  pdf_checksum?: string;
  generated_at: string;
  created_at: string;
  immutable: boolean;
}

export interface CaseReportContent {
  case_identifier: string;
  patient_code: string; // Anonymized
  procedure_date: string;
  technique_registered: string;
  scientific_references: ScientificReference[];
  consent_status: ConsentInfo;
  followup_status: FollowupInfo;
  red_flags_documented: RedFlagInfo;
  registration_events: RegistrationEvent[];
  disclaimer: string;
}

export interface ScientificReference {
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
}

export interface ConsentInfo {
  has_consent: boolean;
  consent_date?: string;
  consent_type?: string;
}

export interface FollowupInfo {
  has_followup: boolean;
  followup_dates: string[];
  timepoints_completed: string[];
}

export interface RedFlagInfo {
  has_red_flags: boolean;
  red_flags_list: string[];
  documented_at?: string;
}

export interface RegistrationEvent {
  event_type: string;
  timestamp: string;
  description: string;
}

export interface DiligenceCaseTimeline {
  id: string;
  user_id: string;
  case_id: string;
  event_type: string;
  event_description: string;
  event_timestamp: string;
  source_table?: string;
  source_record_id?: string;
  created_at: string;
  immutable: boolean;
}

export interface DiligenceRiskDisclosure {
  id: string;
  user_id: string;
  case_id: string;
  risk_category: string;
  risk_description: string;
  disclosed_at: string;
  disclosure_method?: string;
  patient_acknowledged?: boolean;
  created_at: string;
  immutable: boolean;
}

export interface DiligenceChecklist {
  id: string;
  user_id: string;
  case_id?: string;
  checklist_type: string;
  checklist_items: ChecklistItem[];
  completed_items: string[];
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  immutable: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  required: boolean;
}

export interface DiligencePracticeStatement {
  id: string;
  user_id: string;
  statement_type: string;
  statement_content: PracticeStatementContent;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  immutable: boolean;
}

export interface PracticeStatementContent {
  title: string;
  body: string;
  version: string;
  generated_at: string;
}

export interface DiligenceComplianceLog {
  id: string;
  user_id: string;
  case_id?: string;
  action: DiligenceAction;
  action_details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  immutable: boolean;
}

export type DiligenceAction =
  | 'generate_report'
  | 'view_report'
  | 'download_report'
  | 'generate_practice_statement'
  | 'update_checklist_status'
  | 'view_timeline'
  | 'view_risk_matrix'
  | 'export_data';

// Dashboard aggregated data
export interface DiligenceDashboardMetrics {
  totalCases: number;
  casesWithReports: number;
  casesWithConsent: number;
  casesWithFollowup: number;
  checklistsCompleted: number;
  checklistsPending: number;
  recentLogs: DiligenceComplianceLog[];
}

// Checklist templates
export const CHECKLIST_TEMPLATES: Record<string, ChecklistItem[]> = {
  pre_procedure: [
    { id: 'anamnesis', label: 'Anamnese completa registrada', required: true },
    { id: 'clinical_exam', label: 'Exame físico documentado', required: true },
    { id: 'imaging', label: 'Exames de imagem revisados', required: false },
    { id: 'labs', label: 'Exames laboratoriais verificados', required: true },
    { id: 'red_flags', label: 'Red flags avaliadas', required: true },
    { id: 'consent', label: 'Consentimento obtido', required: true },
    { id: 'risks_explained', label: 'Riscos explicados ao paciente', required: true },
  ],
  post_procedure: [
    { id: 'procedure_documented', label: 'Procedimento documentado', required: true },
    { id: 'adverse_events', label: 'Eventos adversos registrados', required: true },
    { id: 'followup_scheduled', label: 'Follow-up agendado', required: true },
    { id: 'instructions_provided', label: 'Orientações fornecidas', required: true },
  ],
  documentation: [
    { id: 'clinical_record', label: 'Prontuário atualizado', required: true },
    { id: 'scientific_basis', label: 'Base científica referenciada', required: false },
    { id: 'protocol_registered', label: 'Protocolo registrado', required: true },
  ],
};

// Disclaimer text
export const DILIGENCE_DISCLAIMER = `
Este documento é um relatório factual e descritivo de processo técnico.
Não constitui parecer jurídico, aconselhamento legal ou garantia de conformidade regulatória.
A interpretação jurídica deve ser feita por profissional habilitado.
SYNTESY Diligence & Compliance Layer™ - Registro de Diligência Técnica.
`;
