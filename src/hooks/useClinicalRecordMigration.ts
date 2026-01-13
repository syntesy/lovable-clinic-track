/**
 * Hook para migrar dados legados de prp_screenings para clinical_records
 * 
 * REGRA: Se clinical_records estiver vazio e prp_screenings.clinical_* tiver dados,
 * copia para clinical_records no primeiro acesso.
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LegacyScreeningData {
  clinical_chief_complaint?: string | null;
  clinical_anamnesis?: string | null;
  clinical_physical_exam?: string | null;
  clinical_diagnosis?: string | null;
}

interface ClinicalRecordData {
  id?: string;
  patient_id: string;
  chief_complaint?: string | null;
  anamnesis?: string | null;
  physical_exam?: string | null;
  clinical_diagnosis?: string | null;
  legacy_migrated_at?: string | null;
}

export function useClinicalRecordMigration() {
  /**
   * Migra dados legados de prp_screenings para clinical_records
   * Retorna true se migração foi realizada, false se não foi necessária
   */
  const migrateIfNeeded = useCallback(async (
    patientId: string,
    screeningId?: string
  ): Promise<{ migrated: boolean; record: ClinicalRecordData | null }> => {
    try {
      // 1. Buscar clinical_record mais recente
      const { data: existingRecords, error: recordError } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recordError) throw recordError;
      
      const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

      // 2. Verificar se já tem dados no prontuário
      const hasData = existingRecord && (
        (existingRecord.chief_complaint && String(existingRecord.chief_complaint).trim()) ||
        (existingRecord.anamnesis && String(existingRecord.anamnesis).trim()) ||
        ((existingRecord as Record<string, unknown>).physical_exam && String((existingRecord as Record<string, unknown>).physical_exam).trim()) ||
        ((existingRecord as Record<string, unknown>).clinical_diagnosis && String((existingRecord as Record<string, unknown>).clinical_diagnosis).trim())
      );

      // Se já tem dados ou já foi migrado, não precisa migrar
      if (hasData || (existingRecord as Record<string, unknown>)?.legacy_migrated_at) {
        return { migrated: false, record: existingRecord as ClinicalRecordData | null };
      }

      // 3. Buscar dados legados de prp_screenings
      let query = supabase
        .from("prp_screenings")
        .select("clinical_chief_complaint, clinical_anamnesis, clinical_physical_exam, clinical_diagnosis")
        .eq("patient_id", patientId);

      if (screeningId) {
        query = query.eq("id", screeningId);
      }

      const { data: screenings, error: screeningError } = await query
        .order("created_at", { ascending: false })
        .limit(1);

      if (screeningError) throw screeningError;

      const legacyData: LegacyScreeningData = screenings?.[0] || {};

      // 4. Verificar se há dados legados para migrar
      const hasLegacyData = 
        (legacyData.clinical_chief_complaint && String(legacyData.clinical_chief_complaint).trim()) ||
        (legacyData.clinical_anamnesis && String(legacyData.clinical_anamnesis).trim()) ||
        (legacyData.clinical_physical_exam && String(legacyData.clinical_physical_exam).trim()) ||
        (legacyData.clinical_diagnosis && String(legacyData.clinical_diagnosis).trim());

      if (!hasLegacyData) {
        return { migrated: false, record: existingRecord as ClinicalRecordData | null };
      }

      // 5. Realizar migração
      const migratedData = {
        patient_id: patientId,
        chief_complaint: legacyData.clinical_chief_complaint || null,
        anamnesis: legacyData.clinical_anamnesis || null,
        physical_exam: legacyData.clinical_physical_exam || null,
        clinical_diagnosis: legacyData.clinical_diagnosis || null,
        legacy_migrated_at: new Date().toISOString()
      };

      if (existingRecord) {
        // Update existing record
        const { data: updated, error: updateError } = await supabase
          .from("clinical_records")
          .update(migratedData)
          .eq("id", existingRecord.id)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log("[MIGRATION] Dados legados migrados para clinical_records:", {
          patientId,
          migratedFields: Object.keys(migratedData).filter(k => migratedData[k as keyof typeof migratedData])
        });

        return { migrated: true, record: updated as ClinicalRecordData };
      } else {
        // Insert new record
        const { data: inserted, error: insertError } = await supabase
          .from("clinical_records")
          .insert(migratedData)
          .select()
          .single();

        if (insertError) throw insertError;

        console.log("[MIGRATION] Novo clinical_record criado com dados legados:", {
          patientId,
          migratedFields: Object.keys(migratedData).filter(k => migratedData[k as keyof typeof migratedData])
        });

        return { migrated: true, record: inserted as ClinicalRecordData };
      }
    } catch (error) {
      console.error("[MIGRATION_ERROR]", error);
      return { migrated: false, record: null };
    }
  }, []);

  return { migrateIfNeeded };
}
