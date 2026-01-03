/**
 * useObservationalRegistry - Hook para Registro Observacional Fase 1
 * 
 * REGRA ABSOLUTA: Apenas LÊ dados do motor clínico.
 * NÃO altera regras, pesos, thresholds ou lógica S0-S3.
 * Camada PARALELA e OBSERVACIONAL.
 */

import { supabase } from "@/integrations/supabase/client";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";

// Types
interface RegistryCase {
  id: string;
  registry_case_id: string;
  screening_id: string | null;
  patient_id: string;
  site_id: string;
  professional_id: string;
  status: 'included' | 'withdrawn';
  consented_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
}

interface RegistryBaseline {
  age_range: string;
  sex: 'M' | 'F' | 'other' | 'not_informed';
  primary_diagnosis: string;
  anatomical_region: string;
  pain_duration_range: string;
  initial_pain_score: number;
  comorbidities: string[];
}

interface RegistryProcedure {
  procedure_type: string;
  procedure_date: string;
  image_guided: boolean;
  anatomical_site_detail: string;
  application_count: number;
  immediate_adverse_event: boolean;
  adverse_event_type?: string;
}

interface RegistryLabs {
  hemoglobin?: number;
  leukocytes?: number;
  platelets?: number;
  crp?: number;
  hba1c?: number;
  ferritin?: number;
  collection_date?: string;
  status: 'USE' | 'CAUTION' | 'AVOID';
}

interface EngineSnapshot {
  final_state: 'S0' | 'S1' | 'S2' | 'S3';
  engine_outputs: Record<string, unknown>;
  engine_computed_at: string;
  canonical_hash: string;
}

interface FollowupData {
  timepoint: 30 | 90 | 180 | 365;
  pain_score?: number;
  perceived_improvement?: number; // Likert 1-5
  return_to_activity?: boolean;
  new_intervention?: boolean;
  late_adverse_event?: boolean;
  adverse_event_type?: string;
}

// Consent text hash generator
const generateTextHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

const CONSENT_TEXT_V1 = `
Autorizo a utilização de meus dados clínicos ANONIMIZADOS para fins de pesquisa científica 
e construção de evidência clínica em medicina regenerativa. Entendo que:
- Nenhum dado identificável será compartilhado
- Posso retirar meu consentimento a qualquer momento
- Os dados serão utilizados conforme a LGPD
`;

export function useObservationalRegistry(patientId?: string, screeningId?: string) {
  const [registryCase, setRegistryCase] = useState<RegistryCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  /**
   * Busca caso existente no registry
   */
  const fetchRegistryCase = useCallback(async () => {
    if (!patientId) return null;

    try {
      const { data, error } = await supabase
        .from('registry_cases')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[ObservationalRegistry] Fetch error:', error);
        return null;
      }

      if (data) {
        setRegistryCase(data as RegistryCase);
        setHasConsent(data.status === 'included' && !!data.consented_at);
      }

      return data as RegistryCase | null;
    } catch (err) {
      console.error('[ObservationalRegistry] Fetch exception:', err);
      return null;
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchRegistryCase();
    }
  }, [patientId, fetchRegistryCase]);

  /**
   * Cria caso no registry com consentimento
   * SOMENTE leitura de dados existentes
   */
  const includeInRegistry = useCallback(async (): Promise<boolean> => {
    if (!patientId) {
      toast.error("ID do paciente não encontrado");
      return false;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) {
        toast.error("Usuário não autenticado");
        return false;
      }

      // Verificar se já existe
      const existing = await fetchRegistryCase();
      if (existing && existing.status === 'included') {
        toast.info("Este caso já está incluído no registro");
        return true;
      }

      // Criar registry case
      const { data: newCase, error: caseError } = await supabase
        .from('registry_cases')
        .insert({
          patient_id: patientId,
          screening_id: screeningId || null,
          professional_id: userId,
          status: 'included',
          consented_at: new Date().toISOString()
        })
        .select()
        .single();

      if (caseError) {
        console.error('[ObservationalRegistry] Insert error:', caseError);
        toast.error("Erro ao incluir no registro");
        return false;
      }

      const registryCaseId = newCase.registry_case_id;

      // Registrar consentimento audit
      const textHash = generateTextHash(CONSENT_TEXT_V1);
      await supabase
        .from('registry_consent_audit')
        .insert({
          registry_case_id: registryCaseId,
          consent_version: 'v1.0',
          accepted_at: new Date().toISOString(),
          text_hash: textHash
        });

      // Registrar evento de auditoria
      await supabase
        .from('registry_audit_events')
        .insert({
          registry_case_id: registryCaseId,
          event_type: 'case_included',
          user_id: userId,
          event_data: { screening_id: screeningId }
        });

      await supabase
        .from('registry_audit_events')
        .insert({
          registry_case_id: registryCaseId,
          event_type: 'consent_accepted',
          user_id: userId,
          event_data: { consent_version: 'v1.0', text_hash: textHash }
        });

      setRegistryCase(newCase as RegistryCase);
      setHasConsent(true);
      toast.success("Caso incluído no Registro Observacional");
      return true;
    } catch (err) {
      console.error('[ObservationalRegistry] Include exception:', err);
      toast.error("Erro ao incluir no registro");
      return false;
    } finally {
      setLoading(false);
    }
  }, [patientId, screeningId, fetchRegistryCase]);

  /**
   * Retirar consentimento
   */
  const withdrawConsent = useCallback(async (): Promise<boolean> => {
    if (!registryCase) {
      toast.error("Caso não encontrado no registro");
      return false;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { error } = await supabase
        .from('registry_cases')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString()
        })
        .eq('registry_case_id', registryCase.registry_case_id);

      if (error) {
        toast.error("Erro ao retirar consentimento");
        return false;
      }

      // Atualizar consent audit
      await supabase
        .from('registry_consent_audit')
        .update({ withdrawn_at: new Date().toISOString() })
        .eq('registry_case_id', registryCase.registry_case_id);

      // Registrar evento
      await supabase
        .from('registry_audit_events')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          event_type: 'consent_withdrawn',
          user_id: userId
        });

      setHasConsent(false);
      setRegistryCase(prev => prev ? { ...prev, status: 'withdrawn', withdrawn_at: new Date().toISOString() } : null);
      toast.success("Consentimento retirado com sucesso");
      return true;
    } catch (err) {
      console.error('[ObservationalRegistry] Withdraw exception:', err);
      toast.error("Erro ao retirar consentimento");
      return false;
    } finally {
      setLoading(false);
    }
  }, [registryCase]);

  /**
   * Capturar baseline anonimizado (NÃO identifica paciente)
   */
  const captureBaseline = useCallback(async (baseline: RegistryBaseline): Promise<boolean> => {
    if (!registryCase || registryCase.status !== 'included') {
      toast.error("Caso não está incluído no registro");
      return false;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { error } = await supabase
        .from('registry_baseline')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          age_range: baseline.age_range,
          sex: baseline.sex,
          primary_diagnosis: baseline.primary_diagnosis,
          anatomical_region: baseline.anatomical_region,
          pain_duration_range: baseline.pain_duration_range,
          initial_pain_score: baseline.initial_pain_score,
          comorbidities: baseline.comorbidities
        });

      if (error) {
        console.error('[ObservationalRegistry] Baseline error:', error);
        toast.error("Erro ao registrar baseline");
        return false;
      }

      await supabase
        .from('registry_audit_events')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          event_type: 'baseline_created',
          user_id: userId
        });

      return true;
    } catch (err) {
      console.error('[ObservationalRegistry] Baseline exception:', err);
      return false;
    }
  }, [registryCase]);

  /**
   * Registrar procedimento (evento index)
   */
  const captureProcedure = useCallback(async (procedure: RegistryProcedure): Promise<boolean> => {
    if (!registryCase || registryCase.status !== 'included') {
      toast.error("Caso não está incluído no registro");
      return false;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { error } = await supabase
        .from('registry_procedures')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          procedure_type: procedure.procedure_type,
          procedure_date: procedure.procedure_date,
          image_guided: procedure.image_guided,
          anatomical_site_detail: procedure.anatomical_site_detail,
          application_count: procedure.application_count,
          immediate_adverse_event: procedure.immediate_adverse_event,
          adverse_event_type: procedure.adverse_event_type || null
        });

      if (error) {
        console.error('[ObservationalRegistry] Procedure error:', error);
        toast.error("Erro ao registrar procedimento");
        return false;
      }

      await supabase
        .from('registry_audit_events')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          event_type: 'procedure_recorded',
          user_id: userId,
          event_data: { procedure_type: procedure.procedure_type }
        });

      return true;
    } catch (err) {
      console.error('[ObservationalRegistry] Procedure exception:', err);
      return false;
    }
  }, [registryCase]);

  /**
   * Registrar labs (opcional)
   */
  const captureLabs = useCallback(async (labs: RegistryLabs): Promise<boolean> => {
    if (!registryCase || registryCase.status !== 'included') {
      return false;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { error } = await supabase
        .from('registry_labs')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          hemoglobin: labs.hemoglobin,
          leukocytes: labs.leukocytes,
          platelets: labs.platelets,
          crp: labs.crp,
          hba1c: labs.hba1c,
          ferritin: labs.ferritin,
          collection_date: labs.collection_date,
          status: labs.status
        });

      if (error) {
        console.error('[ObservationalRegistry] Labs error:', error);
        return false;
      }

      await supabase
        .from('registry_audit_events')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          event_type: 'labs_recorded',
          user_id: userId
        });

      return true;
    } catch (err) {
      console.error('[ObservationalRegistry] Labs exception:', err);
      return false;
    }
  }, [registryCase]);

  /**
   * Capturar snapshot do motor (SOMENTE LEITURA)
   * Não recalcula - apenas copia estado atual
   */
  const captureEngineSnapshot = useCallback(async (snapshot: EngineSnapshot): Promise<boolean> => {
    if (!registryCase || registryCase.status !== 'included') {
      return false;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      // Use raw query since the table was just created and types not regenerated yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('registry_engine_snapshots')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          final_state: snapshot.final_state,
          engine_outputs: snapshot.engine_outputs,
          engine_computed_at: snapshot.engine_computed_at,
          canonical_hash: snapshot.canonical_hash
        });

      if (error) {
        console.error('[ObservationalRegistry] Snapshot error:', error);
        return false;
      }

      await supabase
        .from('registry_audit_events')
        .insert({
          registry_case_id: registryCase.registry_case_id,
          event_type: 'snapshot_created',
          user_id: userId,
          event_data: { final_state: snapshot.final_state }
        });

      return true;
    } catch (err) {
      console.error('[ObservationalRegistry] Snapshot exception:', err);
      return false;
    }
  }, [registryCase]);

  /**
   * Registrar follow-up longitudinal
   */
  const captureFollowup = useCallback(async (followup: FollowupData): Promise<boolean> => {
    if (!registryCase || registryCase.status !== 'included') {
      toast.error("Caso não está incluído no registro");
      return false;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      // Verificar se já existe follow-up para esse timepoint
      const { data: existing } = await supabase
        .from('registry_longitudinal_followups')
        .select('id')
        .eq('registry_case_id', registryCase.registry_case_id)
        .eq('timepoint', followup.timepoint)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('registry_longitudinal_followups')
          .update({
            pain_score: followup.pain_score,
            perceived_improvement: followup.perceived_improvement,
            return_to_activity: followup.return_to_activity,
            new_intervention: followup.new_intervention,
            late_adverse_event: followup.late_adverse_event,
            adverse_event_type: followup.adverse_event_type,
            completed_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('[ObservationalRegistry] Followup update error:', error);
          return false;
        }

        await supabase
          .from('registry_audit_events')
          .insert({
            registry_case_id: registryCase.registry_case_id,
            event_type: 'followup_updated',
            user_id: userId,
            event_data: { timepoint: followup.timepoint }
          });
      } else {
        // Insert
        const { error } = await supabase
          .from('registry_longitudinal_followups')
          .insert({
            registry_case_id: registryCase.registry_case_id,
            timepoint: followup.timepoint,
            pain_score: followup.pain_score,
            perceived_improvement: followup.perceived_improvement,
            return_to_activity: followup.return_to_activity,
            new_intervention: followup.new_intervention,
            late_adverse_event: followup.late_adverse_event,
            adverse_event_type: followup.adverse_event_type,
            completed_at: new Date().toISOString()
          });

        if (error) {
          console.error('[ObservationalRegistry] Followup insert error:', error);
          return false;
        }

        await supabase
          .from('registry_audit_events')
          .insert({
            registry_case_id: registryCase.registry_case_id,
            event_type: 'followup_created',
            user_id: userId,
            event_data: { timepoint: followup.timepoint }
          });
      }

      toast.success(`Follow-up D${followup.timepoint} registrado`);
      return true;
    } catch (err) {
      console.error('[ObservationalRegistry] Followup exception:', err);
      return false;
    }
  }, [registryCase]);

  /**
   * Buscar follow-ups existentes
   */
  const getFollowups = useCallback(async () => {
    if (!registryCase) return [];

    try {
      const { data, error } = await supabase
        .from('registry_longitudinal_followups')
        .select('*')
        .eq('registry_case_id', registryCase.registry_case_id)
        .order('timepoint');

      if (error) {
        console.error('[ObservationalRegistry] Get followups error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('[ObservationalRegistry] Get followups exception:', err);
      return [];
    }
  }, [registryCase]);

  // Status helpers
  const getStatus = useCallback((): 'not_included' | 'included' | 'withdrawn' => {
    if (!registryCase) return 'not_included';
    return registryCase.status === 'included' ? 'included' : 'withdrawn';
  }, [registryCase]);

  return {
    registryCase,
    loading,
    hasConsent,
    status: getStatus(),
    
    // Actions
    includeInRegistry,
    withdrawConsent,
    captureBaseline,
    captureProcedure,
    captureLabs,
    captureEngineSnapshot,
    captureFollowup,
    getFollowups,
    
    // Refresh
    refresh: fetchRegistryCase
  };
}
