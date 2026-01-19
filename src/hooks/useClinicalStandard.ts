import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ClinicalStandardFormData } from "@/types/clinical-standard";

interface ProcedureStandardRecord {
  id: string;
  attendance_id: string;
  procedure_type: string;
  pathology: string;
  anatomic_region: string;
  specific_location: string | null;
  severity_classification: string;
  symptom_duration: string | null;
  created_at: string;
  updated_at: string;
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
      // 1. Create procedure_standard_records
      const { data: recordData, error: recordError } = await supabase
        .from("procedure_standard_records")
        .insert({
          attendance_id: attendanceId,
          procedure_type: "PRP",
          pathology: formData.clinical_context.pathology,
          anatomic_region: formData.clinical_context.anatomic_region,
          specific_location: formData.clinical_context.specific_location || null,
          severity_classification: formData.severity.severity_classification + 
            (formData.severity.hernia_compression ? `|${formData.severity.hernia_compression}` : ''),
          symptom_duration: formData.clinical_context.symptom_duration || null,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // 2. Create prp_protocol_core
      const { error: prpError } = await supabase
        .from("prp_protocol_core")
        .insert({
          procedure_standard_record_id: recordData.id,
          sessions_count: formData.prp_protocol.sessions_count,
          sessions_interval: formData.prp_protocol.sessions_interval,
          volume_per_session_range: formData.prp_protocol.volume_per_session_range,
          prp_type: formData.prp_protocol.prp_type,
          prp_activation: formData.prp_protocol.prp_activation,
          activation_method: formData.prp_protocol.activation_method || null,
          imaging_guidance: formData.prp_protocol.imaging_guidance,
          prp_with_hyaluronic_acid: formData.associations.prp_with_hyaluronic_acid,
          hyaluronic_acid_type: formData.associations.hyaluronic_acid_type || null,
          recent_nsaid_use: formData.associations.recent_nsaid_use,
        });

      if (prpError) throw prpError;

      // 3. Create co_interventions_core
      const { error: coError } = await supabase
        .from("co_interventions_core")
        .insert({
          procedure_standard_record_id: recordData.id,
          exercise_therapy: formData.co_interventions.exercise_therapy,
          shockwave_therapy: formData.co_interventions.shockwave_therapy,
          epi_associated: formData.co_interventions.epi_associated,
        });

      if (coError) throw coError;

      // 4. Update attendance flag
      const { error: attendanceError } = await supabase
        .from("attendance_sessions")
        .update({ has_standardized_procedure: true })
        .eq("id", attendanceId);

      if (attendanceError) throw attendanceError;

      return recordData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["procedure-standard-record", variables.attendanceId],
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
