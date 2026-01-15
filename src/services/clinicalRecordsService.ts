/**
 * Clinical Records Service
 * Functions to manage clinical records (prontuários) within the attendance flow.
 * Provides "get or create" pattern to ensure a record exists for an attendance.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClinicalRecordBasic {
  id: string;
  patient_id: string;
  status: string;
  created_at: string;
  chief_complaint: string | null;
  anamnesis: string | null;
  physical_exam: string | null;
  clinical_diagnosis: string | null;
}

/**
 * Get the clinical record created within an attendance's time window.
 * Since clinical records are linked to attendances by time, this finds the record
 * that was created during the attendance period.
 */
export async function getClinicalRecordByAttendanceTimeWindow(
  patientId: string,
  attendanceStartAt: string,
  attendanceEndAt: string | null
): Promise<ClinicalRecordBasic | null> {
  let query = supabase
    .from("clinical_records")
    .select("id, patient_id, status, created_at, chief_complaint, anamnesis, physical_exam, clinical_diagnosis")
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
  return data;
}

/**
 * Create a new clinical record for a patient.
 * Returns the created record with ID.
 */
export async function createClinicalRecord(patientId: string): Promise<ClinicalRecordBasic> {
  const { data, error } = await supabase
    .from("clinical_records")
    .insert({
      patient_id: patientId,
      status: "draft",
      chief_complaint: "",
      anamnesis: "",
      physical_exam: "",
      clinical_diagnosis: "",
    })
    .select("id, patient_id, status, created_at, chief_complaint, anamnesis, physical_exam, clinical_diagnosis")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Ensure a clinical record exists for an attendance (by time window).
 * If one exists within the time window, returns it.
 * If not, creates a new one.
 * 
 * This is the main function to use when clicking "Criar Prontuário" in the attendance flow.
 */
export async function ensureClinicalRecordForAttendance(
  patientId: string,
  attendanceStartAt: string,
  attendanceEndAt: string | null
): Promise<ClinicalRecordBasic> {
  // First try to find existing record within time window
  const existing = await getClinicalRecordByAttendanceTimeWindow(
    patientId,
    attendanceStartAt,
    attendanceEndAt
  );

  if (existing) {
    return existing;
  }

  // Create new record if none exists
  return await createClinicalRecord(patientId);
}

/**
 * Check if a clinical record has minimum required data for report generation.
 * Required fields: chief_complaint, anamnesis, physical_exam, clinical_diagnosis
 */
export function hasClinicalRecordMinimumData(record: ClinicalRecordBasic | null): boolean {
  if (!record) return false;
  
  return Boolean(
    record.chief_complaint?.trim() &&
    record.anamnesis?.trim() &&
    record.physical_exam?.trim() &&
    record.clinical_diagnosis?.trim()
  );
}
