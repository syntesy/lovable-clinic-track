
-- ========================================================
-- ETAPA 2: Enriquecimento de patient_reported_outcomes
-- ========================================================

-- A) ALTER TABLE — adicionar colunas
ALTER TABLE public.patient_reported_outcomes
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id),
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id),
  ADD COLUMN IF NOT EXISTS global_change text,
  ADD COLUMN IF NOT EXISTS adverse_event boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adverse_event_description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ========================================================
-- B) ÍNDICES
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_pro_clinic_psr_timepoint
  ON public.patient_reported_outcomes (clinic_id, procedure_standard_record_id, timepoint);

CREATE INDEX IF NOT EXISTS idx_pro_clinic_patient
  ON public.patient_reported_outcomes (clinic_id, patient_id);

CREATE INDEX IF NOT EXISTS idx_pro_psr_timepoint
  ON public.patient_reported_outcomes (procedure_standard_record_id, timepoint);

-- UNIQUE constraint: um registro por PSR+timepoint
CREATE UNIQUE INDEX IF NOT EXISTS uq_pro_psr_timepoint
  ON public.patient_reported_outcomes (procedure_standard_record_id, timepoint)
  WHERE procedure_standard_record_id IS NOT NULL;

-- ========================================================
-- C) BACKFILL — popular clinic_id e patient_id
-- ========================================================
-- Caminho determinístico:
--   PRO.procedure_standard_record_id → PSR.clinic_id
--   PRO.attendance_id → attendance_sessions.patient_id
-- Idempotente: UPDATE ... SET ... FROM ... WHERE ... IS NULL

UPDATE public.patient_reported_outcomes pro
SET clinic_id = psr.clinic_id
FROM public.procedure_standard_records psr
WHERE pro.procedure_standard_record_id = psr.id
  AND pro.clinic_id IS NULL;

UPDATE public.patient_reported_outcomes pro
SET patient_id = att.patient_id
FROM public.attendance_sessions att
WHERE pro.attendance_id = att.id
  AND pro.patient_id IS NULL;

-- ========================================================
-- D) TRIGGER — auto-preencher clinic_id e patient_id
-- ========================================================
CREATE OR REPLACE FUNCTION public.trg_pro_autofill_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id uuid;
  v_patient_id uuid;
BEGIN
  -- Auto-fill clinic_id from PSR
  IF NEW.clinic_id IS NULL AND NEW.procedure_standard_record_id IS NOT NULL THEN
    SELECT psr.clinic_id INTO v_clinic_id
    FROM public.procedure_standard_records psr
    WHERE psr.id = NEW.procedure_standard_record_id;

    IF v_clinic_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine clinic_id: procedure_standard_record_id % not found', NEW.procedure_standard_record_id;
    END IF;
    NEW.clinic_id := v_clinic_id;
  END IF;

  -- Auto-fill patient_id from attendance_sessions
  IF NEW.patient_id IS NULL AND NEW.attendance_id IS NOT NULL THEN
    SELECT att.patient_id INTO v_patient_id
    FROM public.attendance_sessions att
    WHERE att.id = NEW.attendance_id;

    IF v_patient_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine patient_id: attendance_id % not found', NEW.attendance_id;
    END IF;
    NEW.patient_id := v_patient_id;
  END IF;

  -- Block insert without clinic_id
  IF NEW.clinic_id IS NULL THEN
    RAISE EXCEPTION 'clinic_id is required on patient_reported_outcomes';
  END IF;

  -- Update timestamp on UPDATE
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pro_autofill_tenant ON public.patient_reported_outcomes;
CREATE TRIGGER trg_pro_autofill_tenant
  BEFORE INSERT OR UPDATE ON public.patient_reported_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_pro_autofill_tenant();

-- ========================================================
-- E) RLS — MULTI-TENANT (replicando padrão do PSR)
-- ========================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can insert outcomes" ON public.patient_reported_outcomes;
DROP POLICY IF EXISTS "Users can update outcomes" ON public.patient_reported_outcomes;
DROP POLICY IF EXISTS "Users can view outcomes" ON public.patient_reported_outcomes;

-- SELECT: user must have role and clinic matches
CREATE POLICY "clinic_isolation_select"
ON public.patient_reported_outcomes FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT c.id FROM public.clinics c
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE c.id = patient_reported_outcomes.clinic_id
      AND ur.role = ANY(ARRAY['admin'::app_role, 'professional'::app_role, 'nurse_tech'::app_role, 'secretary'::app_role])
  )
);

-- INSERT: same pattern
CREATE POLICY "clinic_isolation_insert"
ON public.patient_reported_outcomes FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT c.id FROM public.clinics c
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE c.id = patient_reported_outcomes.clinic_id
      AND ur.role = ANY(ARRAY['admin'::app_role, 'professional'::app_role, 'nurse_tech'::app_role])
  )
);

-- UPDATE: same pattern
CREATE POLICY "clinic_isolation_update"
ON public.patient_reported_outcomes FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT c.id FROM public.clinics c
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE c.id = patient_reported_outcomes.clinic_id
      AND ur.role = ANY(ARRAY['admin'::app_role, 'professional'::app_role, 'nurse_tech'::app_role])
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT c.id FROM public.clinics c
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE c.id = patient_reported_outcomes.clinic_id
      AND ur.role = ANY(ARRAY['admin'::app_role, 'professional'::app_role, 'nurse_tech'::app_role])
  )
);

-- DELETE: admin + professional only
CREATE POLICY "clinic_isolation_delete"
ON public.patient_reported_outcomes FOR DELETE
TO authenticated
USING (
  clinic_id IN (
    SELECT c.id FROM public.clinics c
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE c.id = patient_reported_outcomes.clinic_id
      AND ur.role = ANY(ARRAY['admin'::app_role, 'professional'::app_role])
  )
);
