
-- ETAPA 9.3 — Enforcement: validações server-side + method_run como campo crítico

-- =========================================================
-- 1) DESVIO EXIGE MOTIVO (trigger BEFORE INSERT OR UPDATE)
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_method_deviation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.method_deviation = true THEN
    IF NEW.method_deviation_reason IS NULL OR TRIM(NEW.method_deviation_reason) = '' THEN
      RAISE EXCEPTION 'Deviation reason is required when method_deviation is true';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_method_deviation
  BEFORE INSERT OR UPDATE ON public.procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_method_deviation();

-- =========================================================
-- 2) SYSTEM_TYPE OBRIGATÓRIO QUANDO requires_collection_or_prep
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_method_system_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_requires boolean;
  v_system_type text;
BEGIN
  -- Só validar se method_run existir
  IF NEW.method_run IS NULL THEN
    RETURN NEW;
  END IF;

  v_requires := COALESCE(
    (NEW.method_run -> 'meta' ->> 'requires_collection_or_prep')::boolean,
    false
  );

  IF v_requires THEN
    v_system_type := COALESCE(
      TRIM(NEW.method_run -> 'system' ->> 'system_type'),
      ''
    );

    IF v_system_type NOT IN ('OPEN', 'CLOSED', 'MIXED') THEN
      RAISE EXCEPTION 'System type (OPEN/CLOSED/MIXED) is required for collection/prep procedures';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_method_system_type
  BEFORE INSERT OR UPDATE ON public.procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_method_system_type();

-- =========================================================
-- 3) method_run COMO CAMPO CRÍTICO CIENTÍFICO
-- =========================================================
CREATE OR REPLACE FUNCTION public.enforce_scientific_edit_justification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.scientific_badge_status = 'VALIDATED' THEN
    IF (
      OLD.pathology IS DISTINCT FROM NEW.pathology OR
      OLD.anatomic_region IS DISTINCT FROM NEW.anatomic_region OR
      OLD.severity_classification IS DISTINCT FROM NEW.severity_classification OR
      OLD.protocol_id IS DISTINCT FROM NEW.protocol_id OR
      OLD.safety_checklist::text IS DISTINCT FROM NEW.safety_checklist::text OR
      OLD.material_traceability::text IS DISTINCT FROM NEW.material_traceability::text OR
      OLD.adverse_event_record::text IS DISTINCT FROM NEW.adverse_event_record::text OR
      OLD.clinical_standard_status IS DISTINCT FROM NEW.clinical_standard_status OR
      OLD.method_run::text IS DISTINCT FROM NEW.method_run::text
    ) THEN
      IF NEW.scientific_edit_justification IS NULL OR TRIM(NEW.scientific_edit_justification) = '' THEN
        RAISE EXCEPTION 'scientific_justification_required: Alterações em registros científicos validados exigem justificativa.';
      END IF;

      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data, additional_info)
      VALUES (
        auth.uid(),
        'SCIENTIFIC_EDIT',
        'procedure_standard_records',
        NEW.id,
        jsonb_build_object(
          'pathology', OLD.pathology,
          'anatomic_region', OLD.anatomic_region,
          'severity_classification', OLD.severity_classification,
          'protocol_id', OLD.protocol_id,
          'clinical_standard_status', OLD.clinical_standard_status,
          'method_run', OLD.method_run
        ),
        jsonb_build_object(
          'pathology', NEW.pathology,
          'anatomic_region', NEW.anatomic_region,
          'severity_classification', NEW.severity_classification,
          'protocol_id', NEW.protocol_id,
          'clinical_standard_status', NEW.clinical_standard_status,
          'method_run', NEW.method_run
        ),
        jsonb_build_object(
          'justification', NEW.scientific_edit_justification,
          'scientific_badge_status', NEW.scientific_badge_status,
          'timestamp', now()
        )
      );

      NEW.scientific_edit_justification := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
