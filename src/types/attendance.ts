// Types for the Attendance (Atendimento) system
// This is a UX-only container - no core clinical logic changes

export interface AttendanceSession {
  id: string;
  patient_id: string;
  created_at: string;
  involves_orthobiologics: boolean;
  title: string | null;
  user_id: string;
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
  isConditional?: boolean; // Only shown if involves_orthobiologics
  requiresOrthobiologics?: boolean;
}

// Step definitions for the horizontal stepper
export const ATTENDANCE_STEPS: AttendanceStepConfig[] = [
  { id: 'complaint', label: 'Queixa & História', icon: 'stethoscope' },
  { id: 'exam', label: 'Exame & Achados', icon: 'activity' },
  { id: 'triage', label: 'Triagem de Ortobiológicos', icon: 'flask-conical', isConditional: true, requiresOrthobiologics: true },
  { id: 'labs', label: 'Exames Laboratoriais', icon: 'test-tube', isConditional: true, requiresOrthobiologics: true },
  { id: 'documents', label: 'Documentos & Imagens', icon: 'paperclip' },
  { id: 'plan', label: 'Plano Terapêutico', icon: 'clipboard-list' },
  { id: 'report', label: 'Relatório & Exportação', icon: 'file-text' },
];

// Helper to get visible steps based on orthobiologics flag
export function getVisibleSteps(involvesOrthobiologics: boolean): AttendanceStepConfig[] {
  return ATTENDANCE_STEPS.filter(step => {
    if (!step.isConditional) return true;
    return involvesOrthobiologics;
  });
}

// Helper to format attendance title
export function formatAttendanceTitle(createdAt: string): string {
  const date = new Date(createdAt);
  return `Atendimento — ${date.toLocaleDateString('pt-BR')}`;
}
