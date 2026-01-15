/**
 * Clinical Records Service
 * Functions to manage clinical records (prontuários) within the attendance flow.
 * Provides "get or create" pattern using attendance_id FK for robust linking.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClinicalRecordBasic {
  id: string;
  patient_id: string;
  attendance_id: string | null;
  status: string;
  created_at: string;
  chief_complaint: string | null;
  anamnesis: string | null;
  physical_exam: string | null;
  clinical_diagnosis: string | null;
}

/**
 * Get the clinical record for an attendance by attendance_id (FK).
 * This is the PRIMARY lookup method - always use this for attendance context.
 */
export async function getClinicalRecordByAttendanceId(
  attendanceId: string
): Promise<ClinicalRecordBasic | null> {
  const { data, error } = await supabase
    .from("clinical_records")
    .select("id, patient_id, attendance_id, status, created_at, chief_complaint, anamnesis, physical_exam, clinical_diagnosis")
    .eq("attendance_id", attendanceId)
    .maybeSingle();

  if (error) throw error;
  return data as ClinicalRecordBasic | null;
}

/**
 * Create a new clinical record for an attendance.
 * Uses upsert-like pattern with unique constraint on attendance_id.
 * Returns the created record with ID.
 */
export async function createClinicalRecord(input: {
  attendanceId: string;
  patientId: string;
}): Promise<ClinicalRecordBasic> {
  const { data, error } = await supabase
    .from("clinical_records")
    .insert({
      patient_id: input.patientId,
      attendance_id: input.attendanceId,
      status: "draft",
      chief_complaint: "",
      anamnesis: "",
      physical_exam: "",
      clinical_diagnosis: "",
    })
    .select("id, patient_id, attendance_id, status, created_at, chief_complaint, anamnesis, physical_exam, clinical_diagnosis")
    .single();

  if (error) {
    // Handle unique constraint violation (duplicate attendance_id)
    if (error.code === "23505" && error.message?.includes("attendance")) {
      // Already exists - fetch it instead
      const existing = await getClinicalRecordByAttendanceId(input.attendanceId);
      if (existing) return existing;
    }
    throw error;
  }
  return data as ClinicalRecordBasic;
}

/**
 * Ensure a clinical record exists for an attendance.
 * Uses attendance_id FK for lookup (not time window).
 * Thread-safe: handles concurrent calls via unique constraint.
 * 
 * This is the main function to use when clicking "Criar Prontuário" in the attendance flow.
 */
export async function ensureClinicalRecordForAttendance(
  attendanceId: string,
  patientId: string
): Promise<ClinicalRecordBasic> {
  // First try to find existing record by attendance_id (FK lookup)
  const existing = await getClinicalRecordByAttendanceId(attendanceId);

  if (existing) {
    return existing;
  }

  // Create new record if none exists
  // Unique constraint on attendance_id prevents duplicates even with concurrent calls
  return await createClinicalRecord({
    attendanceId,
    patientId,
  });
}

/**
 * Check if a clinical record has minimum required data for report generation.
 * 
 * Relaxed criteria - considers "complete enough" if at least ONE of these is true:
 * - Conjunto A (clínico básico): chief_complaint AND anamnesis filled
 * - Conjunto B (diagnóstico): clinical_diagnosis filled
 * - Conjunto C (exame): physical_exam AND clinical_diagnosis filled
 * 
 * This prevents UX issues where users "can never generate a report".
 */
export function hasClinicalRecordMinimumData(record: ClinicalRecordBasic | null): boolean {
  if (!record) return false;
  
  const hasChiefComplaint = !!record.chief_complaint?.trim();
  const hasAnamnesis = !!record.anamnesis?.trim();
  const hasPhysicalExam = !!record.physical_exam?.trim();
  const hasDiagnosis = !!record.clinical_diagnosis?.trim();
  
  // Conjunto A: queixa + anamnese
  const conjuntoA = hasChiefComplaint && hasAnamnesis;
  
  // Conjunto B: diagnóstico preenchido
  const conjuntoB = hasDiagnosis;
  
  // Conjunto C: exame físico + diagnóstico
  const conjuntoC = hasPhysicalExam && hasDiagnosis;
  
  return conjuntoA || conjuntoB || conjuntoC;
}

// ============ Legacy/Analytics functions (for backwards compatibility) ============

/**
 * @deprecated Use getClinicalRecordByAttendanceId instead.
 * Get the clinical record created within an attendance's time window.
 * Only use this for analytics or migration purposes, NOT for main lookup.
 */
export async function getClinicalRecordByAttendanceTimeWindow(
  patientId: string,
  attendanceStartAt: string,
  attendanceEndAt: string | null
): Promise<ClinicalRecordBasic | null> {
  let query = supabase
    .from("clinical_records")
    .select("id, patient_id, attendance_id, status, created_at, chief_complaint, anamnesis, physical_exam, clinical_diagnosis")
    .eq("patient_id", patientId)
    .gte("created_at", attendanceStartAt);

  if (attendanceEndAt) {
    query = query.lte("created_at", attendanceEndAt);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ClinicalRecordBasic | null;
}
