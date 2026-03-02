
-- ══════════════════════════════════════
-- 1. Add versioning & integrity columns to lab_analysis_runs
-- ══════════════════════════════════════

ALTER TABLE public.lab_analysis_runs
  ADD COLUMN IF NOT EXISTS pipeline_version jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS input_hash text,
  ADD COLUMN IF NOT EXISTS output_hash text,
  ADD COLUMN IF NOT EXISTS analysis_confidence_score numeric,
  ADD COLUMN IF NOT EXISTS analysis_confidence_label text,
  ADD COLUMN IF NOT EXISTS was_manually_corrected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS correction_summary jsonb;

-- ══════════════════════════════════════
-- 2. Create immutable corrections audit table
-- ══════════════════════════════════════

CREATE TABLE public.lab_analysis_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.lab_analysis_runs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  lab_name text NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  reason text
);

CREATE INDEX idx_lab_corrections_run_id ON public.lab_analysis_corrections(run_id);
CREATE INDEX idx_lab_corrections_created_by ON public.lab_analysis_corrections(created_by);

-- ══════════════════════════════════════
-- 3. RLS for lab_analysis_corrections (append-only)
-- ══════════════════════════════════════

ALTER TABLE public.lab_analysis_corrections ENABLE ROW LEVEL SECURITY;

-- SELECT: user can see corrections for runs they own (via patient ownership)
CREATE POLICY "lab_corrections_select_own"
ON public.lab_analysis_corrections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lab_analysis_runs r
    WHERE r.id = run_id
    AND (
      r.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = r.patient_id AND p.professional_id = auth.uid()
      )
    )
  )
);

-- INSERT: authenticated user can insert corrections for their own runs
CREATE POLICY "lab_corrections_insert_own"
ON public.lab_analysis_corrections FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.lab_analysis_runs r
    WHERE r.id = run_id
    AND (
      r.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = r.patient_id AND p.professional_id = auth.uid()
      )
    )
  )
);

-- BLOCK UPDATE (append-only)
CREATE POLICY "lab_corrections_prevent_update"
ON public.lab_analysis_corrections FOR UPDATE
USING (false);

-- BLOCK DELETE (append-only)
CREATE POLICY "lab_corrections_prevent_delete"
ON public.lab_analysis_corrections FOR DELETE
USING (false);

-- Triggers to enforce append-only at DB level
CREATE OR REPLACE FUNCTION public.prevent_lab_correction_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'lab_analysis_corrections is append-only. UPDATE not allowed.';
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_lab_correction_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'lab_analysis_corrections is append-only. DELETE not allowed.';
END;
$$;

CREATE TRIGGER trg_prevent_lab_correction_update
BEFORE UPDATE ON public.lab_analysis_corrections
FOR EACH ROW EXECUTE FUNCTION public.prevent_lab_correction_update();

CREATE TRIGGER trg_prevent_lab_correction_delete
BEFORE DELETE ON public.lab_analysis_corrections
FOR EACH ROW EXECUTE FUNCTION public.prevent_lab_correction_delete();
