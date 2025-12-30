import { supabase } from "@/integrations/supabase/client";
import { useCallback, useState, useEffect } from "react";
import { Json } from "@/integrations/supabase/types";

interface RegistryEpisode {
  id: string;
  patient_id: string;
  clinician_id: string;
  status: string;
  registry_consent_status: string;
  registry_eligible: boolean;
  registry_case_id: string | null;
  region_primary: string | null;
  suspected_diagnosis: string | null;
  pain_duration: string | null;
  baseline_pain_0_10: number | null;
}

interface TriageFlags {
  red_flags_present: boolean;
  red_flags_list: string[];
  medications_flags_json: Record<string, boolean>;
  biological_soil_flags_json: Record<string, boolean>;
  nutrition_flags_json: Record<string, boolean>;
  lifestyle_flags_json: Record<string, boolean>;
}

/**
 * Hook completo para gerenciar Registry Episodes e Snapshots
 * Implementa captura automática sem alterar fluxo clínico
 */
export function useRegistryEpisode(patientId?: string) {
  const [episode, setEpisode] = useState<RegistryEpisode | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Busca ou cria episódio ativo para o paciente
   */
  const ensureActiveEpisode = useCallback(async (): Promise<string | null> => {
    if (!patientId) return null;

    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const clinicianId = session?.session?.user?.id;
      if (!clinicianId) return null;

      // Buscar episódio ativo existente
      const { data: existing, error: fetchError } = await supabase
        .from('registry_episodes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching episode:', fetchError);
        return null;
      }

      if (existing) {
        setEpisode(existing as RegistryEpisode);
        return existing.id;
      }

      // Criar novo episódio
      const { data: newEpisode, error: insertError } = await supabase
        .from('registry_episodes')
        .insert({
          patient_id: patientId,
          clinician_id: clinicianId,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating episode:', insertError);
        return null;
      }

      setEpisode(newEpisode as RegistryEpisode);
      return newEpisode.id;
    } catch (err) {
      console.error('ensureActiveEpisode error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  /**
   * Carrega episódio ativo quando patientId muda
   */
  useEffect(() => {
    if (patientId) {
      ensureActiveEpisode();
    }
  }, [patientId, ensureActiveEpisode]);

  /**
   * Captura snapshot de triagem com flags estruturados
   */
  const captureTriageSnapshot = useCallback(async (
    answersJson: Record<string, unknown>,
    flags: TriageFlags
  ): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      // Atualizar episódio com dados da triagem
      const regionPrimary = (answersJson.regiao_principal as string) || null;
      const suspectedDiagnosis = (answersJson.diagnostico_suspeito as string) || null;
      const painDuration = (answersJson.tempo_dor as string) || null;
      const baselinePain = (answersJson.dor_escala as number) || null;

      await supabase
        .from('registry_episodes')
        .update({
          region_primary: regionPrimary,
          suspected_diagnosis: suspectedDiagnosis,
          pain_duration: painDuration,
          baseline_pain_0_10: baselinePain,
          safety_block: flags.red_flags_present
        })
        .eq('id', episodeId);

      // Inserir snapshot de triagem
      const { error } = await supabase
        .from('registry_triage_snapshots')
        .insert({
          episode_id: episodeId,
          answers_json: answersJson as unknown as Json,
          red_flags_present: flags.red_flags_present,
          red_flags_list: flags.red_flags_list as unknown as Json,
          medications_flags_json: flags.medications_flags_json as unknown as Json,
          biological_soil_flags_json: flags.biological_soil_flags_json as unknown as Json,
          nutrition_flags_json: flags.nutrition_flags_json as unknown as Json,
          lifestyle_flags_json: flags.lifestyle_flags_json as unknown as Json
        });

      if (error) {
        console.error('Error capturing triage snapshot:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('captureTriageSnapshot error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  /**
   * Captura snapshot de score
   */
  const captureScoreSnapshot = useCallback(async (
    scoreValue: number,
    scoreClassification: string,
    reasoningJson: Record<string, unknown>,
    recommendationsJson: unknown[],
    context: 'triage_only' | 'triage_plus_labs' = 'triage_only'
  ): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      const { error } = await supabase
        .from('registry_score_snapshots')
        .insert({
          episode_id: episodeId,
          score_context: context,
          score_value: scoreValue,
          score_classification: scoreClassification,
          reasoning_json: reasoningJson as unknown as Json,
          recommendations_json: recommendationsJson as unknown as Json
        });

      if (error) {
        console.error('Error capturing score snapshot:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('captureScoreSnapshot error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  /**
   * Captura pedido de exames
   */
  const captureLabOrder = useCallback(async (
    requestedTests: string[]
  ): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      const { error } = await supabase
        .from('registry_lab_orders')
        .insert({
          episode_id: episodeId,
          requested_tests_json: requestedTests as unknown as Json
        });

      if (error) {
        console.error('Error capturing lab order:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('captureLabOrder error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  /**
   * Captura resultados de exames
   */
  const captureLabResult = useCallback(async (
    labsJson: Record<string, unknown>,
    collectedDate?: string,
    source: 'manual' | 'upload' = 'manual'
  ): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      const { error } = await supabase
        .from('registry_lab_results')
        .insert({
          episode_id: episodeId,
          labs_json: labsJson as unknown as Json,
          collected_date: collectedDate || null,
          source
        });

      if (error) {
        console.error('Error capturing lab result:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('captureLabResult error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  /**
   * Captura plano de procedimento
   */
  const captureProcedurePlan = useCallback(async (
    procedureType: string,
    target?: string,
    guidance?: boolean,
    plannedDate?: string,
    sessionsPlanned?: number,
    notes?: string
  ): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      // Atualizar episódio
      await supabase
        .from('registry_episodes')
        .update({ planned_procedure_type: procedureType })
        .eq('id', episodeId);

      const { error } = await supabase
        .from('registry_procedure_plans')
        .insert({
          episode_id: episodeId,
          procedure_type: procedureType,
          target: target || null,
          guidance: guidance ?? null,
          planned_date: plannedDate || null,
          sessions_planned: sessionsPlanned || null,
          notes: notes || null
        });

      if (error) {
        console.error('Error capturing procedure plan:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('captureProcedurePlan error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  /**
   * Captura procedimento realizado
   */
  const captureProcedurePerformed = useCallback(async (
    procedureType: string,
    performedDate: string,
    sessionNumber?: number,
    target?: string,
    guidance?: boolean,
    volumeUsed?: number,
    productDetails?: Record<string, unknown>,
    adverseEvent?: boolean,
    adverseEventNotes?: string,
    clinicianNotes?: string
  ): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      const { error } = await supabase
        .from('registry_procedures_performed')
        .insert({
          episode_id: episodeId,
          procedure_type: procedureType,
          performed_date: performedDate,
          session_number: sessionNumber || null,
          target: target || null,
          guidance: guidance ?? null,
          volume_used: volumeUsed || null,
          product_details_json: (productDetails || {}) as unknown as Json,
          adverse_event: adverseEvent ?? false,
          adverse_event_notes: adverseEventNotes || null,
          clinician_notes: clinicianNotes || null
        });

      if (error) {
        console.error('Error capturing procedure performed:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('captureProcedurePerformed error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  /**
   * Captura follow-up
   */
  const captureFollowup = useCallback(async (
    timepoint: 'baseline' | '1m' | '3m' | '6m' | '12m',
    pain0_10?: number,
    functionScore?: number,
    satisfaction0_10?: number,
    notes?: string
  ): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      const { error } = await supabase
        .from('registry_followups')
        .insert({
          episode_id: episodeId,
          timepoint,
          pain_0_10: pain0_10 ?? null,
          function_score: functionScore ?? null,
          patient_satisfaction_0_10: satisfaction0_10 ?? null,
          notes: notes || null
        });

      if (error) {
        console.error('Error capturing followup:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('captureFollowup error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  /**
   * Gera registry_case_id único
   */
  const generateCaseId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ORTHO-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  /**
   * Registra consentimento (aceitar ou recusar)
   */
  const registerConsent = useCallback(async (accepted: boolean): Promise<boolean> => {
    const episodeId = episode?.id || await ensureActiveEpisode();
    if (!episodeId) return false;

    try {
      const updateData: Record<string, unknown> = {
        registry_consent_status: accepted ? 'granted' : 'declined',
        registry_eligible: accepted
      };

      if (accepted) {
        updateData.registry_case_id = generateCaseId();
      }

      const { error } = await supabase
        .from('registry_episodes')
        .update(updateData)
        .eq('id', episodeId);

      if (error) {
        console.error('Error registering consent:', error);
        return false;
      }

      // Atualizar estado local
      setEpisode(prev => prev ? {
        ...prev,
        registry_consent_status: accepted ? 'granted' : 'declined',
        registry_eligible: accepted,
        registry_case_id: accepted ? (updateData.registry_case_id as string) : null
      } : null);

      return true;
    } catch (err) {
      console.error('registerConsent error:', err);
      return false;
    }
  }, [episode?.id, ensureActiveEpisode]);

  return {
    episode,
    loading,
    ensureActiveEpisode,
    captureTriageSnapshot,
    captureScoreSnapshot,
    captureLabOrder,
    captureLabResult,
    captureProcedurePlan,
    captureProcedurePerformed,
    captureFollowup,
    registerConsent,
    // Helpers
    isEligible: episode?.registry_eligible ?? false,
    consentStatus: episode?.registry_consent_status ?? 'not_asked',
    caseId: episode?.registry_case_id ?? null
  };
}
