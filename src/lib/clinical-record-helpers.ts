/**
 * Clinical Record Helpers
 * 
 * Guardrails para prevenir regressões:
 * - getClinicalRecordById: ÚNICO método para carregar prontuário específico (editor, print, relatório)
 * - getLatestClinicalRecord: permitido APENAS para "Visão Geral" / checklist de status
 * 
 * REGRA: Telas de edição, impressão e relatório DEVEM usar getClinicalRecordById
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClinicalRecord {
  id: string;
  patient_id: string;
  status: string;
  chief_complaint: string | null;
  anamnesis: string | null;
  physical_exam: string | null;
  clinical_diagnosis: string | null;
  legacy_migrated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Carrega um prontuário específico por ID
 * 
 * USO OBRIGATÓRIO para:
 * - Editor de prontuário
 * - Impressão de prontuário
 * - Relatório de prontuário específico
 * - Qualquer tela que exibe "Prontuário X"
 * 
 * @param patientId - ID do paciente (validação de segurança)
 * @param recordId - ID do prontuário
 * @throws Error se não encontrado
 */
export async function getClinicalRecordById(
  patientId: string,
  recordId: string
): Promise<ClinicalRecord> {
  const { data, error } = await supabase
    .from("clinical_records")
    .select("*")
    .eq("id", recordId)
    .eq("patient_id", patientId)
    .single();

  if (error) {
    console.error("[getClinicalRecordById] Error:", error);
    throw new Error(`Prontuário não encontrado: ${error.message}`);
  }

  console.log("[getClinicalRecordById] Loaded record:", recordId);
  return data as ClinicalRecord;
}

/**
 * Carrega o prontuário mais recente do paciente
 * 
 * USO PERMITIDO APENAS para:
 * - Visão geral / resumo
 * - Checklist de status (ClinicalAssessmentChecklist)
 * - Migração de dados legados
 * 
 * ⚠️ PROIBIDO usar para: editor, print, relatório, qualquer ação "Abrir prontuário X"
 * 
 * @param patientId - ID do paciente
 * @returns Prontuário mais recente ou null se não existir
 */
export async function getLatestClinicalRecord(
  patientId: string
): Promise<ClinicalRecord | null> {
  const { data, error } = await supabase
    .from("clinical_records")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[getLatestClinicalRecord] Error:", error);
    throw error;
  }

  const record = data && data.length > 0 ? data[0] : null;
  
  if (record) {
    console.log("[getLatestClinicalRecord] Found latest record:", record.id, "for patient:", patientId);
  } else {
    console.log("[getLatestClinicalRecord] No records found for patient:", patientId);
  }

  return record as ClinicalRecord | null;
}

/**
 * Lista todos os prontuários de um paciente
 * 
 * @param patientId - ID do paciente
 * @returns Lista de prontuários ordenada por data de criação (mais recente primeiro)
 */
export async function listClinicalRecords(
  patientId: string
): Promise<ClinicalRecord[]> {
  const { data, error } = await supabase
    .from("clinical_records")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listClinicalRecords] Error:", error);
    throw error;
  }

  console.log("[listClinicalRecords] Found", data?.length || 0, "records for patient:", patientId);
  return (data || []) as ClinicalRecord[];
}
