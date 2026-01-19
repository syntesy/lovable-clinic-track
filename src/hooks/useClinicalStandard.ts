import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ClinicalStandardFormData } from "@/types/clinical-standard";
import { evaluateClinicalStandard, type EvaluationInput, type ClinicalStandardStatus } from "@/lib/clinical-standard-evaluator";

interface ProcedureStandardRecord {
  id: string;
  attendance_id: string;
  procedure_type: string;
  pathology: string;
  anatomic_region: string;
  specific_location: string | null;
  severity_classification: string;
  symptom_duration: string | null;
  clinical_standard_status: ClinicalStandardStatus;
  clinical_standard_notes: string[];
  is_comparable: boolean;
  last_evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PRPProtocolRecord {
  id: string;
  procedure_standard_record_id: string;
  sessions_count: string;
  sessions_interval: string | null;
  volume_per_session_range: string;
  prp_type: string;
  prp_activation: string;
  activation_method: string | null;
  imaging_guidance: string;
  prp_with_hyaluronic_acid: boolean;
  hyaluronic_acid_type: string | null;
  recent_nsaid_use: string;
}

interface CoInterventionsRecord {
  id: string;
  procedure_standard_record_id: string;
  exercise_therapy: boolean;
  shockwave_therapy: string;
  epi_associated: boolean;
}

export interface FullProcedureRecord {
  record: ProcedureStandardRecord;
  prpProtocol: PRPProtocolRecord | null;
  coInterventions: CoInterventionsRecord | null;
}

export function useProcedureStandardRecord(attendanceId: string | null) {
  return useQuery({
    queryKey: ["procedure-standard-record", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return null;
      
      const { data, error } = await supabase
        .from("procedure_standard_records")
        .select("*")
        .eq("attendance_id", attendanceId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProcedureStandardRecord | null;
    },
    enabled: !!attendanceId,
  });
}

export function useFullProcedureRecord(attendanceId: string | null) {
  return useQuery({
    queryKey: ["full-procedure-record", attendanceId],
    queryFn: async (): Promise<FullProcedureRecord | null> => {
      if (!attendanceId) return null;
      
      // Fetch the main record
      const { data: record, error: recordError } = await supabase
        .from("procedure_standard_records")
        .select("*")
        .eq("attendance_id", attendanceId)
        .maybeSingle();
      
      if (recordError) throw recordError;
      if (!record) return null;

      // Fetch related records in parallel
      const [prpResult, coIntResult] = await Promise.all([
        supabase
          .from("prp_protocol_core")
          .select("*")
          .eq("procedure_standard_record_id", record.id)
          .maybeSingle(),
        supabase
          .from("co_interventions_core")
          .select("*")
          .eq("procedure_standard_record_id", record.id)
          .maybeSingle(),
      ]);

      if (prpResult.error) throw prpResult.error;
      if (coIntResult.error) throw coIntResult.error;

      return {
        record: record as ProcedureStandardRecord,
        prpProtocol: prpResult.data as PRPProtocolRecord | null,
        coInterventions: coIntResult.data as CoInterventionsRecord | null,
      };
    },
    enabled: !!attendanceId,
  });
}

/**
 * Evaluate and update the clinical standard status
 */
async function runEvaluation(recordId: string): Promise<void> {
  // Fetch all data needed for evaluation
  const { data: record, error: recordError } = await supabase
    .from("procedure_standard_records")
    .select("*")
    .eq("id", recordId)
    .single();

  if (recordError) throw recordError;

  const [prpResult, coIntResult] = await Promise.all([
    supabase
      .from("prp_protocol_core")
      .select("*")
      .eq("procedure_standard_record_id", recordId)
      .maybeSingle(),
    supabase
      .from("co_interventions_core")
      .select("*")
      .eq("procedure_standard_record_id", recordId)
      .maybeSingle(),
  ]);

  if (prpResult.error) throw prpResult.error;
  if (coIntResult.error) throw coIntResult.error;

  // Build evaluation input
  const input: EvaluationInput = {
    record: {
      pathology: record.pathology,
      anatomic_region: record.anatomic_region,
      specific_location: record.specific_location,
      severity_classification: record.severity_classification,
      symptom_duration: record.symptom_duration,
      procedure_type: record.procedure_type,
    },
    prpProtocol: prpResult.data ? {
      sessions_count: prpResult.data.sessions_count,
      sessions_interval: prpResult.data.sessions_interval,
      volume_per_session_range: prpResult.data.volume_per_session_range,
      prp_type: prpResult.data.prp_type,
      prp_activation: prpResult.data.prp_activation,
      activation_method: prpResult.data.activation_method,
      imaging_guidance: prpResult.data.imaging_guidance,
      prp_with_hyaluronic_acid: prpResult.data.prp_with_hyaluronic_acid,
      hyaluronic_acid_type: prpResult.data.hyaluronic_acid_type,
      recent_nsaid_use: prpResult.data.recent_nsaid_use,
    } : {
      sessions_count: '',
      sessions_interval: null,
      volume_per_session_range: '',
      prp_type: '',
      prp_activation: '',
      activation_method: null,
      imaging_guidance: '',
      prp_with_hyaluronic_acid: false,
      hyaluronic_acid_type: null,
      recent_nsaid_use: '',
    },
    coInterventions: coIntResult.data ? {
      exercise_therapy: coIntResult.data.exercise_therapy,
      shockwave_therapy: coIntResult.data.shockwave_therapy,
      epi_associated: coIntResult.data.epi_associated,
    } : {
      exercise_therapy: false,
      shockwave_therapy: '',
      epi_associated: false,
    },
  };

  // Run evaluation
  const result = evaluateClinicalStandard(input);

  // Update record with evaluation results
  const { error: updateError } = await supabase
    .from("procedure_standard_records")
    .update({
      clinical_standard_status: result.status,
      clinical_standard_notes: result.notes,
      is_comparable: result.isComparable,
      last_evaluated_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  if (updateError) throw updateError;
}

export function useSaveClinicalStandard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attendanceId,
      formData,
    }: {
      attendanceId: string;
      formData: ClinicalStandardFormData;
    }) => {
      // Apply coherence rules before saving
      const cleanedData = applyCoherenceRules(formData);

      // 1. Create procedure_standard_records
      const { data: recordData, error: recordError } = await supabase
        .from("procedure_standard_records")
        .insert({
          attendance_id: attendanceId,
          procedure_type: "PRP",
          pathology: cleanedData.clinical_context.pathology,
          anatomic_region: cleanedData.clinical_context.anatomic_region,
          specific_location: cleanedData.clinical_context.specific_location || null,
          severity_classification: cleanedData.severity.severity_classification + 
            (cleanedData.severity.hernia_compression ? `|${cleanedData.severity.hernia_compression}` : ''),
          symptom_duration: cleanedData.clinical_context.symptom_duration || null,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // 2. Create prp_protocol_core
      const { error: prpError } = await supabase
        .from("prp_protocol_core")
        .insert({
          procedure_standard_record_id: recordData.id,
          sessions_count: cleanedData.prp_protocol.sessions_count,
          sessions_interval: cleanedData.prp_protocol.sessions_interval || null,
          volume_per_session_range: cleanedData.prp_protocol.volume_per_session_range,
          prp_type: cleanedData.prp_protocol.prp_type,
          prp_activation: cleanedData.prp_protocol.prp_activation,
          activation_method: cleanedData.prp_protocol.activation_method || null,
          imaging_guidance: cleanedData.prp_protocol.imaging_guidance,
          prp_with_hyaluronic_acid: cleanedData.associations.prp_with_hyaluronic_acid,
          hyaluronic_acid_type: cleanedData.associations.hyaluronic_acid_type || null,
          recent_nsaid_use: cleanedData.associations.recent_nsaid_use,
        });

      if (prpError) throw prpError;

      // 3. Create co_interventions_core
      const { error: coError } = await supabase
        .from("co_interventions_core")
        .insert({
          procedure_standard_record_id: recordData.id,
          exercise_therapy: cleanedData.co_interventions.exercise_therapy,
          shockwave_therapy: cleanedData.co_interventions.shockwave_therapy,
          epi_associated: cleanedData.co_interventions.epi_associated,
        });

      if (coError) throw coError;

      // 4. Update attendance flag
      const { error: attendanceError } = await supabase
        .from("attendance_sessions")
        .update({ has_standardized_procedure: true })
        .eq("id", attendanceId);

      if (attendanceError) throw attendanceError;

      // 5. Run evaluation
      await runEvaluation(recordData.id);

      return recordData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["procedure-standard-record", variables.attendanceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["full-procedure-record", variables.attendanceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", variables.attendanceId],
      });
      toast.success("Protocolo padronizado salvo com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error saving clinical standard:", error);
      toast.error("Erro ao salvar protocolo padronizado.");
    },
  });
}

/**
 * Apply coherence rules (Rule 3.5)
 */
function applyCoherenceRules(formData: ClinicalStandardFormData): ClinicalStandardFormData {
  const cleaned = JSON.parse(JSON.stringify(formData)) as ClinicalStandardFormData;

  // If prp_activation == "nao_ativado", clear activation_method
  if (cleaned.prp_protocol.prp_activation === 'nao_ativado') {
    cleaned.prp_protocol.activation_method = '';
  }

  // If sessions_count == "1", clear sessions_interval
  if (cleaned.prp_protocol.sessions_count === '1') {
    cleaned.prp_protocol.sessions_interval = '';
  }

  // If prp_with_hyaluronic_acid == false, clear hyaluronic_acid_type
  if (!cleaned.associations.prp_with_hyaluronic_acid) {
    cleaned.associations.hyaluronic_acid_type = '';
  }

  return cleaned;
}
