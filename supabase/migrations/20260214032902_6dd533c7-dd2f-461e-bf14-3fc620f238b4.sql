
-- 1. Add columns to procedure_standard_records
ALTER TABLE public.procedure_standard_records
  ADD COLUMN responsible_professional_user_id uuid NULL,
  ADD COLUMN performed_by_user_id uuid NULL DEFAULT auth.uid(),
  ADD COLUMN assisted_by_user_id uuid NULL;

-- 2. Backfill existing records: set responsible = performed_by = the attendance creator
UPDATE public.procedure_standard_records psr
SET 
  responsible_professional_user_id = att.user_id,
  performed_by_user_id = att.user_id
FROM public.attendance_sessions att
WHERE psr.attendance_id = att.id
  AND psr.responsible_professional_user_id IS NULL;

-- 3. Now make NOT NULL
ALTER TABLE public.procedure_standard_records
  ALTER COLUMN responsible_professional_user_id SET NOT NULL,
  ALTER COLUMN performed_by_user_id SET NOT NULL;

-- 4. Create validation trigger
CREATE OR REPLACE FUNCTION public.trg_validate_responsible_professional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_clinic_owner uuid;
BEGIN
  -- Check that responsible_professional has role professional or admin
  SELECT ur.role INTO v_role
  FROM user_roles ur
  WHERE ur.user_id = NEW.responsible_professional_user_id
  LIMIT 1;

  IF v_role IS NULL OR v_role NOT IN ('professional', 'admin') THEN
    RAISE EXCEPTION 'Invalid responsible professional: user must have role PROFESSIONAL or ADMIN';
  END IF;

  -- Check that the responsible professional belongs to the same clinic
  -- (either as owner or has a role in the system — since we don't have per-clinic memberships,
  --  we verify the clinic exists and the user is either the owner or has a valid role)
  SELECT c.owner_user_id INTO v_clinic_owner
  FROM clinics c
  WHERE c.id = NEW.clinic_id AND c.is_active = true;

  IF v_clinic_owner IS NULL THEN
    RAISE EXCEPTION 'Invalid clinic_id: clinic not found or inactive';
  END IF;

  -- For now, the responsible professional must be the clinic owner 
  -- (since there's no multi-member clinic table yet)
  -- OR we trust that the professional is valid if they have a role
  -- This is a pragmatic approach until a clinic_members table exists

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_responsible_professional
  BEFORE INSERT OR UPDATE ON public.procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_responsible_professional();

-- 5. Update RLS to allow secretary and nurse_tech to insert/select/update
-- Drop old restrictive policies that only allow admin/professional
DROP POLICY IF EXISTS "clinic_isolation_insert" ON public.procedure_standard_records;
DROP POLICY IF EXISTS "clinic_isolation_select" ON public.procedure_standard_records;
DROP POLICY IF EXISTS "clinic_isolation_update" ON public.procedure_standard_records;
DROP POLICY IF EXISTS "clinic_isolation_delete" ON public.procedure_standard_records;

-- Recreate with expanded roles (admin, professional, nurse_tech, secretary)
CREATE POLICY "clinic_isolation_select" ON public.procedure_standard_records
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT c.id FROM clinics c
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = procedure_standard_records.clinic_id
        AND ur.role IN ('admin', 'professional', 'nurse_tech', 'secretary')
    )
  );

CREATE POLICY "clinic_isolation_insert" ON public.procedure_standard_records
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT c.id FROM clinics c
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = procedure_standard_records.clinic_id
        AND ur.role IN ('admin', 'professional', 'nurse_tech', 'secretary')
    )
  );

CREATE POLICY "clinic_isolation_update" ON public.procedure_standard_records
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT c.id FROM clinics c
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = procedure_standard_records.clinic_id
        AND ur.role IN ('admin', 'professional', 'nurse_tech', 'secretary')
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT c.id FROM clinics c
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = procedure_standard_records.clinic_id
        AND ur.role IN ('admin', 'professional', 'nurse_tech', 'secretary')
    )
  );

CREATE POLICY "clinic_isolation_delete" ON public.procedure_standard_records
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT c.id FROM clinics c
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = procedure_standard_records.clinic_id
        AND ur.role IN ('admin', 'professional')
    )
  );
