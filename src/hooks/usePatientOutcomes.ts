/**
 * Hook for managing patient-reported outcomes
 * Handles outcome creation, linking to procedure_standard_records, and backfill
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OutcomeTimepoint = 'baseline' | 'm1' | 'm3' | 'm6' | 'm12';
export type FunctionScaleType = 'WOMAC' | 'KOOS' | 'ODI' | 'NDI' | 'DASH' | 'VISA_A' | 'OUTRA';

export type ClinicalOutcomeClassification =
  | 'very_favorable'
  | 'favorable'
  | 'partial'
  | 'limited';

export interface PatientReportedOutcome {
  id: string;
  attendance_id: string;
  procedure_standard_record_id: string | null;
  timepoint: OutcomeTimepoint;
  pain_score: number | null;
  function_scale_type: FunctionScaleType | null;
  function_score: number | null;
  // Classification layer (computed by DB trigger — additive, read-only from hook)
  clinical_outcome_classification: ClinicalOutcomeClassification | null;
  clinical_outcome_classification_reason: string | null;
  delta_eva: number | null;
  delta_ifn: number | null;
  submitted_at: string;
  created_at: string;
}

export interface CreateOutcomeInput {
  attendance_id: string;
  timepoint: OutcomeTimepoint;
  pain_score?: number | null;
  function_scale_type?: FunctionScaleType | null;
  function_score?: number | null;
}

/**
 * Link outcome to procedure_standard_record deterministically
 */
export async function linkOutcomeToProcedure(attendanceId: string): Promise<string | null> {
  // Find comparable procedure_standard_record for this attendance
  const { data: procedureRecord, error } = await supabase
    .from('procedure_standard_records')
    .select('id')
    .eq('attendance_id', attendanceId)
    .eq('procedure_type', 'PRP')
    .eq('is_comparable', true)
    .single();

  if (error || !procedureRecord) {
    return null;
  }

  return procedureRecord.id;
}

/**
 * Backfill outcomes when a procedure_standard_record is created
 * Links existing outcomes from the same attendance
 */
export async function backfillOutcomesForProcedure(
  attendanceId: string,
  procedureRecordId: string
): Promise<void> {
  const { error } = await supabase
    .from('patient_reported_outcomes')
    .update({ procedure_standard_record_id: procedureRecordId })
    .eq('attendance_id', attendanceId)
    .is('procedure_standard_record_id', null);

  if (error) {
    console.error('Error backfilling outcomes:', error);
  }
}

/**
 * Hook to get outcomes for an attendance
 */
export function useAttendanceOutcomes(attendanceId: string | null) {
  return useQuery({
    queryKey: ['attendance-outcomes', attendanceId],
    queryFn: async () => {
      if (!attendanceId) return [];
      
      const { data, error } = await supabase
        .from('patient_reported_outcomes')
        .select('*')
        .eq('attendance_id', attendanceId)
        .order('timepoint');

      if (error) throw error;
      return data as PatientReportedOutcome[];
    },
    enabled: !!attendanceId,
  });
}

/**
 * Hook to create/update an outcome
 */
export function useSaveOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOutcomeInput) => {
      // First try to link to a procedure_standard_record
      const procedureRecordId = await linkOutcomeToProcedure(input.attendance_id);

      // Upsert the outcome
      const { data, error } = await supabase
        .from('patient_reported_outcomes')
        .upsert({
          attendance_id: input.attendance_id,
          timepoint: input.timepoint,
          pain_score: input.pain_score,
          function_scale_type: input.function_scale_type,
          function_score: input.function_score,
          procedure_standard_record_id: procedureRecordId,
          submitted_at: new Date().toISOString(),
        }, {
          onConflict: 'attendance_id,timepoint',
        })
        .select()
        .single();

      if (error) throw error;
      return data as PatientReportedOutcome;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-outcomes', data.attendance_id] });
      queryClient.invalidateQueries({ queryKey: ['collective-outcomes'] });
    },
  });
}
