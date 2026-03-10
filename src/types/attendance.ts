// Types for the Attendance (Atendimento) system
// This is a UX-only container - no core clinical logic changes

export interface AttendanceSession {
  id: string;
  patient_id: string;
  created_at: string;
  involves_orthobiologics: boolean;
  title: string | null;
  user_id: string;
  closed_at: string | null;
  closed_by: string | null; // Audit trail: who closed the attendance
  // Report audit trail fields
  last_report_generated_at: string | null;
  last_report_record_id: string | null;
  last_report_type: 'preview' | 'pdf' | null;
  last_report_duration_ms: number | null;
}

// Helper to check if attendance is closed
export function isAttendanceClosed(attendance: AttendanceSession | null): boolean {
  return attendance?.closed_at != null;
}

export interface AttendanceFile {
  id: string;
  attendance_ref: string;
  patient_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_type: 'exam' | 'report' | 'image' | 'photo' | 'other';
  description: string | null;
  uploaded_at: string;
  user_id: string;
}

// Status machine for the clinical flow (S0-S3)
export type AttendanceStatus = 'S0' | 'S1' | 'S2' | 'S3';

export interface AttendanceStepConfig {
  id: string;
  label: string;
  icon: string;
}

// Re-export domain contracts as single source of truth
export { 
  type AttendanceStepId,
  INITIAL_STEP,
  getStepsForAttendance,
  isValidStep,
  normalizeStep,
  canAccessStep,
  validateStepForAttendance,
} from '@/domain/attendanceFlow';

// Step UI configuration (labels, icons)
// Follows the domain contract order
export const STEP_UI_CONFIG: Record<string, { label: string; icon: string }> = {
  clinical: { label: 'Avaliação Clínica', icon: 'stethoscope' },
  triage: { label: 'Triagem', icon: 'flask-conical' },
  plan: { label: 'Plano Terapêutico', icon: 'clipboard-list' },
  attachments: { label: 'Anexos', icon: 'paperclip' },
  report: { label: 'Relatório', icon: 'file-text' },
};

// Helper to format attendance title
export function formatAttendanceTitle(createdAt: string): string {
  const date = new Date(createdAt);
  return `Atendimento — ${date.toLocaleDateString('pt-BR')}`;
}
