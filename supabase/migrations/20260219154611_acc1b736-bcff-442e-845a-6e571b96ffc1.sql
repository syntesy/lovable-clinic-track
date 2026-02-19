
-- 1. FIX user_profiles: Remove admin access to all profiles, restrict to owner only
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 2. FIX patient_consents: Remove duplicate/conflicting policies and make accepted consents immutable
DROP POLICY IF EXISTS "Professionals can update consents for own patients" ON public.patient_consents;
DROP POLICY IF EXISTS "Professionals can update non-accepted consents only" ON public.patient_consents;
DROP POLICY IF EXISTS "Professionals can insert consents for own patients" ON public.patient_consents;

-- Single UPDATE policy: only non-accepted consents can be updated
CREATE POLICY "Professionals can update non-accepted consents"
  ON public.patient_consents FOR UPDATE
  USING (
    accepted = false
    AND EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_consents.patient_id
      AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Professionals can view own patients consents" ON public.patient_consents;

-- 3. Create trigger to prevent any update on accepted consents (defense in depth)
CREATE OR REPLACE FUNCTION public.prevent_consent_update_after_acceptance()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF OLD.accepted = true THEN
    RAISE EXCEPTION 'Accepted consent records are immutable and cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_consent_update ON public.patient_consents;
CREATE TRIGGER trg_prevent_consent_update
  BEFORE UPDATE ON public.patient_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_consent_update_after_acceptance();
