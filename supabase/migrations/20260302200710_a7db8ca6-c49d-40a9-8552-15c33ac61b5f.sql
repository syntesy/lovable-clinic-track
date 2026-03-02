
CREATE TABLE public.lab_analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  bucket text,
  storage_path text,
  extraction_method text CHECK (extraction_method IN ('PDF_TEXT', 'OCR_PDF', 'OCR_IMAGE', 'MANUAL')),
  extraction_confidence text CHECK (extraction_confidence IN ('high', 'medium', 'low')),
  warnings jsonb DEFAULT '[]'::jsonb,
  raw_text text,
  normalized_json jsonb,
  analysis_json jsonb,
  model_meta jsonb,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_code text,
  error_debug jsonb
);

ALTER TABLE public.lab_analysis_runs ENABLE ROW LEVEL SECURITY;

-- Users can see their own runs
CREATE POLICY "Users can view own lab_analysis_runs"
  ON public.lab_analysis_runs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own runs
CREATE POLICY "Users can insert own lab_analysis_runs"
  ON public.lab_analysis_runs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Index for fast lookup by attendance
CREATE INDEX idx_lab_analysis_runs_attendance ON public.lab_analysis_runs(attendance_id, created_at DESC);
CREATE INDEX idx_lab_analysis_runs_user ON public.lab_analysis_runs(user_id);
