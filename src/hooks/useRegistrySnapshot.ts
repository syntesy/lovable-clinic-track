import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import type { Json } from "@/integrations/supabase/types";

export type SnapshotType = 
  | 'triagem'
  | 'score_inicial'
  | 'exames_solicitados'
  | 'exames_registrados'
  | 'score_atualizado'
  | 'procedimento_planejado'
  | 'procedimento_realizado'
  | 'follow_up';

type SnapshotData = Record<string, Json | undefined> | Record<string, unknown>;

/**
 * Hook para capturar automaticamente snapshots do Registry
 * Captura dados anonimizáveis (sem nome, cpf, email, etc.)
 */
export function useRegistrySnapshot() {
  
  /**
   * Remove dados identificáveis do snapshot
   */
  const sanitizeData = useCallback((data: SnapshotData): SnapshotData => {
    const identifiableFields = [
      'full_name', 'name', 'patient_name', 'cpf', 'email', 'phone',
      'address', 'profession', 'photo_url', 'ip_address', 'user_agent'
    ];
    
    const sanitized = { ...data };
    
    for (const field of identifiableFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }
    
    // Recursively sanitize nested objects
    for (const key of Object.keys(sanitized)) {
      if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
        sanitized[key] = sanitizeData(sanitized[key] as SnapshotData);
      }
    }
    
    return sanitized;
  }, []);

  /**
   * Captura um snapshot do Registry
   */
  const captureSnapshot = useCallback(async (
    patientId: string,
    snapshotType: SnapshotType,
    snapshotData: SnapshotData,
    sourceRecordId?: string,
    sourceTable?: string
  ): Promise<boolean> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        console.warn('Registry: No user session, skipping snapshot');
        return false;
      }

      // Verificar se já existe consentimento para este paciente
      const { data: consent } = await supabase
        .from('registry_consents')
        .select('consent_given')
        .eq('patient_id', patientId)
        .maybeSingle();

      const isEligible = consent?.consent_given === true;

      // Buscar versão atual para este tipo de snapshot
      const { data: existingSnapshots } = await supabase
        .from('registry_snapshots')
        .select('snapshot_version')
        .eq('patient_id', patientId)
        .eq('snapshot_type', snapshotType)
        .order('snapshot_version', { ascending: false })
        .limit(1);

      const nextVersion = existingSnapshots && existingSnapshots.length > 0 
        ? existingSnapshots[0].snapshot_version + 1 
        : 1;

      // Sanitizar dados antes de salvar
      const sanitizedData = sanitizeData(snapshotData);

      const { error } = await supabase
        .from('registry_snapshots')
        .insert([{
          patient_id: patientId,
          professional_id: userId,
          snapshot_type: snapshotType,
          snapshot_version: nextVersion,
          snapshot_data: JSON.parse(JSON.stringify(sanitizedData)) as Json,
          source_record_id: sourceRecordId || null,
          source_table: sourceTable || null,
          is_eligible: isEligible
        }]);

      if (error) {
        console.error('Registry: Error capturing snapshot', error);
        return false;
      }

      console.log(`Registry: Captured ${snapshotType} snapshot v${nextVersion} for patient`);
      return true;
    } catch (err) {
      console.error('Registry: Unexpected error', err);
      return false;
    }
  }, [sanitizeData]);

  /**
   * Captura snapshot de triagem
   */
  const captureTriagemSnapshot = useCallback(async (
    patientId: string,
    questionnaireResponses: SnapshotData,
    classification?: string,
    screeningId?: string
  ) => {
    return captureSnapshot(
      patientId,
      'triagem',
      {
        questionnaire_responses: questionnaireResponses,
        classification,
        captured_at: new Date().toISOString()
      },
      screeningId,
      'prp_screenings'
    );
  }, [captureSnapshot]);

  /**
   * Captura snapshot de score
   */
  const captureScoreSnapshot = useCallback(async (
    patientId: string,
    scoreData: SnapshotData,
    isUpdated: boolean = false
  ) => {
    return captureSnapshot(
      patientId,
      isUpdated ? 'score_atualizado' : 'score_inicial',
      {
        ...scoreData,
        captured_at: new Date().toISOString()
      }
    );
  }, [captureSnapshot]);

  /**
   * Captura snapshot de exames solicitados
   */
  const captureExamesSolicitadosSnapshot = useCallback(async (
    patientId: string,
    recommendedExams: string[],
    screeningId?: string
  ) => {
    return captureSnapshot(
      patientId,
      'exames_solicitados',
      {
        recommended_exams: recommendedExams,
        captured_at: new Date().toISOString()
      },
      screeningId,
      'prp_screenings'
    );
  }, [captureSnapshot]);

  /**
   * Captura snapshot de exames registrados
   */
  const captureExamesRegistradosSnapshot = useCallback(async (
    patientId: string,
    labResults: SnapshotData,
    labResultId?: string
  ) => {
    return captureSnapshot(
      patientId,
      'exames_registrados',
      {
        lab_values: labResults,
        captured_at: new Date().toISOString()
      },
      labResultId,
      'prp_lab_results'
    );
  }, [captureSnapshot]);

  /**
   * Captura snapshot de procedimento
   */
  const captureProcedimentoSnapshot = useCallback(async (
    patientId: string,
    procedureData: SnapshotData,
    procedureId?: string,
    isPlanned: boolean = false
  ) => {
    return captureSnapshot(
      patientId,
      isPlanned ? 'procedimento_planejado' : 'procedimento_realizado',
      {
        ...procedureData,
        captured_at: new Date().toISOString()
      },
      procedureId,
      'patient_procedures'
    );
  }, [captureSnapshot]);

  /**
   * Captura snapshot de follow-up
   */
  const captureFollowUpSnapshot = useCallback(async (
    patientId: string,
    sessionData: SnapshotData,
    sessionId?: string
  ) => {
    return captureSnapshot(
      patientId,
      'follow_up',
      {
        ...sessionData,
        captured_at: new Date().toISOString()
      },
      sessionId,
      'treatment_sessions'
    );
  }, [captureSnapshot]);

  return {
    captureSnapshot,
    captureTriagemSnapshot,
    captureScoreSnapshot,
    captureExamesSolicitadosSnapshot,
    captureExamesRegistradosSnapshot,
    captureProcedimentoSnapshot,
    captureFollowUpSnapshot
  };
}
