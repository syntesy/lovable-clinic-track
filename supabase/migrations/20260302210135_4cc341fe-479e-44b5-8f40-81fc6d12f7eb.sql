
-- Add patient_id to lab_analysis_runs (allows direct patient exam analysis without attendance)
ALTER TABLE public.lab_analysis_runs 
  ADD COLUMN patient_id uuid REFERENCES public.patients(id);

-- Make attendance_id nullable (no longer required for patient-level uploads)
ALTER TABLE public.lab_analysis_runs 
  ALTER COLUMN attendance_id DROP NOT NULL;

-- Add constraint: at least one of patient_id or attendance_id must be set
ALTER TABLE public.lab_analysis_runs
  ADD CONSTRAINT lab_analysis_runs_patient_or_attendance 
  CHECK (patient_id IS NOT NULL OR attendance_id IS NOT NULL);

-- Index for patient_id lookups
CREATE INDEX idx_lab_analysis_runs_patient_id ON public.lab_analysis_runs(patient_id) WHERE patient_id IS NOT NULL;

-- Backfill patient_id from attendance_sessions for existing rows
UPDATE public.lab_analysis_runs lar
SET patient_id = a.patient_id
FROM public.attendance_sessions a
WHERE lar.attendance_id = a.id AND lar.patient_id IS NULL;

-- RLS policy: users can view their own patient's lab runs
CREATE POLICY "Users can view lab runs for their patients"
  ON public.lab_analysis_runs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = lab_analysis_runs.patient_id 
      AND p.professional_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.attendance_sessions a 
      WHERE a.id = lab_analysis_runs.attendance_id 
      AND a.user_id = auth.uid()
    )
  );

-- RLS policy: users can insert lab runs for their patients
CREATE POLICY "Users can insert lab runs for their patients"
  ON public.lab_analysis_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = lab_analysis_runs.patient_id 
      AND p.professional_id = auth.uid()
    )
  );
