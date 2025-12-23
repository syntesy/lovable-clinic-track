import { Json } from "@/integrations/supabase/types";

// Tipos para resultados de triagem PRP
export interface ExamGroup {
  axis: string;
  exams: string[];
  justification: string;
}

export interface LabResult {
  id: string;
  screening_id: string;
  lab_values: Record<string, unknown> | null;
  raw_text: string | null;
  interpretation: string | null;
  updated_classification: string | null;
  extracted_text: string | null;
  attached_files: unknown[] | null;
  created_at: string;
}

export interface PRPScreening {
  id: string;
  patient_id: string;
  screening_date: string;
  questionnaire_responses: Json;
  recommended_exams: ExamGroup[] | null;
  classification: string | null;
  analysis_result: string | null;
  patient_orientations: string | null;
  created_at: string;
  updated_at: string;
  prp_lab_results?: LabResult[];
}

// Helper para cast seguro de recommended_exams
export function parseRecommendedExams(exams: unknown): ExamGroup[] {
  if (!exams || !Array.isArray(exams)) return [];
  
  return exams.filter((item): item is ExamGroup => {
    return (
      typeof item === 'object' &&
      item !== null &&
      'axis' in item &&
      'exams' in item &&
      Array.isArray((item as ExamGroup).exams)
    );
  });
}

// Helper para cast seguro de lab_results
export function parseLabResults(results: unknown): LabResult[] {
  if (!results || !Array.isArray(results)) return [];
  
  return results.filter((item): item is LabResult => {
    return (
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'screening_id' in item
    );
  });
}
