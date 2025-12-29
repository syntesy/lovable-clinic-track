-- Fix patient authentication: validate CPF by matching against patient record (avoids cpf_hash mismatches)

DROP FUNCTION IF EXISTS public.authenticate_patient(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_patient(p_surname text, p_cpf text)
RETURNS TABLE(patient_id uuid, patient_name text, professional_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cpf text;
  v_surname text;
BEGIN
  v_cpf := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_surname := lower(trim(coalesce(p_surname, '')));

  IF length(v_cpf) <> 11 OR v_surname = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ppa.patient_id,
    p.full_name as patient_name,
    ppa.professional_id
  FROM public.patient_portal_access ppa
  JOIN public.patients p ON p.id = ppa.patient_id
  WHERE coalesce(ppa.is_active, true) = true
    AND regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = v_cpf
    AND (
      lower(coalesce(ppa.login_surname, '')) = v_surname
      OR lower(p.full_name) LIKE '%' || v_surname || '%'
    )
  LIMIT 1;

  UPDATE public.patient_portal_access ppa
  SET last_login_at = now()
  FROM public.patients p
  WHERE p.id = ppa.patient_id
    AND coalesce(ppa.is_active, true) = true
    AND regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = v_cpf
    AND (
      lower(coalesce(ppa.login_surname, '')) = v_surname
      OR lower(p.full_name) LIKE '%' || v_surname || '%'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.authenticate_patient(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.authenticate_patient(text, text) TO anon, authenticated;