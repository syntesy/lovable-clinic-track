
-- Fix 1: Restrict mentorship_sessions to authenticated users only
DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON public.mentorship_sessions;

CREATE POLICY "Authenticated users can view sessions"
ON public.mentorship_sessions FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix 2: Harden authenticate_patient function with rate limiting and audit logging
CREATE OR REPLACE FUNCTION public.authenticate_patient(p_surname text, p_cpf text)
RETURNS TABLE(patient_id uuid, patient_name text, professional_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_cpf text;
  v_surname text;
  v_attempt_count int;
  v_result RECORD;
BEGIN
  v_cpf := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_surname := lower(trim(coalesce(p_surname, '')));

  -- Basic input validation
  IF length(v_cpf) <> 11 OR v_surname = '' THEN
    -- Log failed attempt (invalid input)
    INSERT INTO public.audit_logs (action, table_name, additional_info)
    VALUES (
      'PATIENT_AUTH_FAILED',
      'patient_portal_access',
      jsonb_build_object(
        'reason', 'invalid_input',
        'timestamp', now()
      )
    );
    RETURN;
  END IF;

  -- Rate limiting: max 10 attempts per CPF in last 5 minutes
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.audit_logs
  WHERE action IN ('PATIENT_AUTH_FAILED', 'PATIENT_AUTH_SUCCESS')
    AND table_name = 'patient_portal_access'
    AND additional_info->>'cpf_hash' = encode(sha256(v_cpf::bytea), 'hex')
    AND created_at > now() - interval '5 minutes';

  IF v_attempt_count >= 10 THEN
    INSERT INTO public.audit_logs (action, table_name, additional_info)
    VALUES (
      'PATIENT_AUTH_RATE_LIMITED',
      'patient_portal_access',
      jsonb_build_object(
        'cpf_hash', encode(sha256(v_cpf::bytea), 'hex'),
        'attempts', v_attempt_count,
        'timestamp', now()
      )
    );
    RAISE EXCEPTION 'Too many authentication attempts. Please try again later.';
  END IF;

  -- Attempt authentication
  SELECT
    ppa.patient_id,
    p.full_name as patient_name,
    ppa.professional_id
  INTO v_result
  FROM public.patient_portal_access ppa
  JOIN public.patients p ON p.id = ppa.patient_id
  WHERE coalesce(ppa.is_active, true) = true
    AND regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = v_cpf
    AND (
      lower(coalesce(ppa.login_surname, '')) = v_surname
      OR lower(p.full_name) LIKE '%' || v_surname || '%'
    )
  LIMIT 1;

  IF v_result IS NULL THEN
    -- Log failed attempt
    INSERT INTO public.audit_logs (action, table_name, additional_info)
    VALUES (
      'PATIENT_AUTH_FAILED',
      'patient_portal_access',
      jsonb_build_object(
        'cpf_hash', encode(sha256(v_cpf::bytea), 'hex'),
        'reason', 'no_match',
        'timestamp', now()
      )
    );
    RETURN;
  END IF;

  -- Log successful attempt
  INSERT INTO public.audit_logs (action, table_name, record_id, additional_info)
  VALUES (
    'PATIENT_AUTH_SUCCESS',
    'patient_portal_access',
    v_result.patient_id,
    jsonb_build_object(
      'cpf_hash', encode(sha256(v_cpf::bytea), 'hex'),
      'timestamp', now()
    )
  );

  -- Update last login
  UPDATE public.patient_portal_access ppa
  SET last_login_at = now()
  WHERE ppa.patient_id = v_result.patient_id
    AND coalesce(ppa.is_active, true) = true;

  patient_id := v_result.patient_id;
  patient_name := v_result.patient_name;
  professional_id := v_result.professional_id;
  RETURN NEXT;
END;
$function$;
