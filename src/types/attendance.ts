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

// Step definitions for the Attendance flow (clinically correct sequence)
// 1) Avaliação Clínica → 2) Triagem (opcional) → 3) Plano Terapêutico → 4) Anexos → 5) Relatório
export const ATTENDANCE_STEPS: AttendanceStepConfig[] = [
  { id: 'clinical', label: 'Avaliação Clínica', icon: 'stethoscope' },
  { id: 'triage', label: 'Triagem', icon: 'flask-conical' },
  { id: 'plan', label: 'Plano Terapêutico', icon: 'clipboard-list' },
  { id: 'attachments', label: 'Anexos', icon: 'paperclip' },
  { id: 'report', label: 'Relatório', icon: 'file-text' },
];

// Helper to get visible steps based on attendance type
// If involves_orthobiologics is true, show triage step; otherwise hide it
export function getVisibleSteps(involvesOrthobiologics: boolean): AttendanceStepConfig[] {
  if (involvesOrthobiologics) {
    return ATTENDANCE_STEPS;
  }
  // Hide triage step for non-orthobiologic attendances
  return ATTENDANCE_STEPS.filter(step => step.id !== 'triage');
}

// Helper to format attendance title
export function formatAttendanceTitle(createdAt: string): string {
  const date = new Date(createdAt);
  return `Atendimento — ${date.toLocaleDateString('pt-BR')}`;
}
