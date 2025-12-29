-- Drop existing function first
DROP FUNCTION IF EXISTS public.authenticate_patient(text, text);

-- Recreate function to allow login with patient's real surname (case-insensitive partial match)
CREATE OR REPLACE FUNCTION public.authenticate_patient(p_surname text, p_cpf text)
RETURNS TABLE(patient_id uuid, patient_name text, professional_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cpf text;
  v_surname text;
  v_cpf_hash text;
BEGIN
  v_cpf := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_surname := lower(trim(coalesce(p_surname, '')));

  IF length(v_cpf) <> 11 OR v_surname = '' THEN
    RETURN;
  END IF;

  -- sha256 hash
  v_cpf_hash := encode(sha256(v_cpf::bytea), 'hex');

  -- Match by cpf_hash and either portal login_surname OR partial match on patient full_name
  RETURN QUERY
  SELECT
    ppa.patient_id,
    p.full_name as patient_name,
    ppa.professional_id
  FROM public.patient_portal_access ppa
  JOIN public.patients p ON p.id = ppa.patient_id
  WHERE coalesce(ppa.is_active, true) = true
    AND ppa.cpf_hash = v_cpf_hash
    AND (
      lower(coalesce(ppa.login_surname, '')) = v_surname
      OR lower(p.full_name) LIKE '%' || v_surname || '%'
    )
  LIMIT 1;

  -- Update last login
  UPDATE public.patient_portal_access
  SET last_login_at = now()
  WHERE cpf_hash = v_cpf_hash
    AND (
      lower(coalesce(login_surname, '')) = v_surname
      OR EXISTS (
        SELECT 1 FROM public.patients pt
        WHERE pt.id = patient_portal_access.patient_id
          AND lower(pt.full_name) LIKE '%' || v_surname || '%'
      )
    )
    AND is_active = true;
END;
$$;

-- Grant access
REVOKE ALL ON FUNCTION public.authenticate_patient(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.authenticate_patient(text, text) TO anon, authenticated;