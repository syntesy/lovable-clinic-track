
-- Add scientific_edit_justification column (nullable, cleared after each use)
ALTER TABLE public.procedure_standard_records
ADD COLUMN IF NOT EXISTS scientific_edit_justification text;

-- Trigger: enforce justification on validated scientific records when critical fields change
CREATE OR REPLACE FUNCTION public.enforce_scientific_edit_justification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only enforce when scientific_badge_status is VALIDATED
  IF OLD.scientific_badge_status = 'VALIDATED' THEN
    -- Check if any critical field changed
    IF (
      OLD.pathology IS DISTINCT FROM NEW.pathology OR
      OLD.anatomic_region IS DISTINCT FROM NEW.anatomic_region OR
      OLD.severity_classification IS DISTINCT FROM NEW.severity_classification OR
      OLD.protocol_id IS DISTINCT FROM NEW.protocol_id OR
      OLD.safety_checklist::text IS DISTINCT FROM NEW.safety_checklist::text OR
      OLD.material_traceability::text IS DISTINCT FROM NEW.material_traceability::text OR
      OLD.adverse_event_record::text IS DISTINCT FROM NEW.adverse_event_record::text OR
      OLD.clinical_standard_status IS DISTINCT FROM NEW.clinical_standard_status
    ) THEN
      -- Require justification
      IF NEW.scientific_edit_justification IS NULL OR TRIM(NEW.scientific_edit_justification) = '' THEN
        RAISE EXCEPTION 'scientific_justification_required: Alterações em registros científicos validados exigem justificativa.';
      END IF;

      -- Log to audit_logs
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
          'clinical_standard_status', OLD.clinical_standard_status
        ),
        jsonb_build_object(
          'pathology', NEW.pathology,
          'anatomic_region', NEW.anatomic_region,
          'severity_classification', NEW.severity_classification,
          'protocol_id', NEW.protocol_id,
          'clinical_standard_status', NEW.clinical_standard_status
        ),
        jsonb_build_object(
          'justification', NEW.scientific_edit_justification,
          'scientific_badge_status', NEW.scientific_badge_status,
          'timestamp', now()
        )
      );

      -- Clear justification after use (prevent reuse)
      NEW.scientific_edit_justification := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enforce_scientific_edit_justification
BEFORE UPDATE ON public.procedure_standard_records
FOR EACH ROW
EXECUTE FUNCTION public.enforce_scientific_edit_justification();

-- Update get_conformity_metrics to include scientific counts
CREATE OR REPLACE FUNCTION public.get_conformity_metrics(p_clinic_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_area text DEFAULT NULL::text, p_protocol_type text DEFAULT NULL::text, p_only_completed boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_kpis jsonb;
  v_top_protocols jsonb;
  v_pending jsonb;
  v_adverse jsonb;
  v_total int;
  v_with_protocol int;
  v_checklist_completed int;
  v_finalized int;
  v_adverse_count int;
  v_scientific_draft int;
  v_scientific_validated int;
  v_protocol_distribution jsonb;
BEGIN
  -- Total procedures
  SELECT COUNT(*) INTO v_total
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.created_at >= p_start AND psr.created_at < p_end
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_with_protocol
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.protocol_id IS NOT NULL
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_checklist_completed
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.safety_checklist_status = 'COMPLETED'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_finalized
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.clinical_standard_status = 'completed'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type));

  SELECT COUNT(*) INTO v_adverse_count
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.adverse_event_status = 'REPORTED'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- Scientific counts
  SELECT COUNT(*) INTO v_scientific_draft
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end
    AND psr.scientific_badge_status = 'DRAFT'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_scientific_validated
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end
    AND psr.scientific_badge_status = 'VALIDATED'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- Protocol distribution
  SELECT COALESCE(jsonb_agg(jsonb_build_object('type', pt, 'count', cnt)), '[]'::jsonb)
  INTO v_protocol_distribution
  FROM (
    SELECT pr.protocol_type::text AS pt, COUNT(*) AS cnt
    FROM procedure_standard_records psr
    JOIN protocols pr ON pr.id = psr.protocol_id
    WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
      AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed')
    GROUP BY pr.protocol_type ORDER BY cnt DESC
  ) sub;

  v_kpis := jsonb_build_object(
    'total', v_total,
    'withProtocol', v_with_protocol,
    'checklistCompleted', v_checklist_completed,
    'finalized', v_finalized,
    'adverseEvents', v_adverse_count,
    'scientificDraftCount', v_scientific_draft,
    'scientificValidatedCount', v_scientific_validated,
    'protocolDistribution', v_protocol_distribution
  );

  -- Top 10 protocols
  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_top_protocols
  FROM (
    SELECT pr.id AS protocol_id, pr.title, pr.protocol_type::text AS protocol_type,
      COUNT(psr.id) AS total_procedures,
      COUNT(CASE WHEN psr.safety_checklist_status = 'COMPLETED' THEN 1 END) AS checklist_completed_count
    FROM procedure_standard_records psr JOIN protocols pr ON pr.id = psr.protocol_id
    WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
      AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed')
    GROUP BY pr.id, pr.title, pr.protocol_type ORDER BY COUNT(psr.id) DESC LIMIT 10
  ) sub;

  -- Pending
  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_pending
  FROM (
    SELECT psr.id, psr.created_at, psr.attendance_id,
      psr.safety_checklist_status::text AS checklist_status,
      psr.clinical_standard_status AS finalization_status,
      pr.title AS protocol_title, pat.full_name AS patient_name
    FROM procedure_standard_records psr
    JOIN protocols pr ON pr.id = psr.protocol_id
    LEFT JOIN attendance_sessions att ON att.id = psr.attendance_id
    LEFT JOIN patients pat ON pat.id = att.patient_id
    WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end
      AND (psr.safety_checklist_status != 'COMPLETED' OR psr.clinical_standard_status != 'completed')
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
    ORDER BY psr.created_at DESC LIMIT 50
  ) sub;

  -- Adverse events
  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_adverse
  FROM (
    SELECT psr.id, psr.created_at, psr.attendance_id, psr.adverse_event_record,
      pr.title AS protocol_title, pat.full_name AS patient_name
    FROM procedure_standard_records psr
    JOIN protocols pr ON pr.id = psr.protocol_id
    LEFT JOIN attendance_sessions att ON att.id = psr.attendance_id
    LEFT JOIN patients pat ON pat.id = att.patient_id
    WHERE psr.clinic_id = p_clinic_id AND psr.created_at >= p_start AND psr.created_at < p_end
      AND psr.adverse_event_status = 'REPORTED'
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
    ORDER BY psr.created_at DESC LIMIT 50
  ) sub;

  v_result := jsonb_build_object(
    'kpis', v_kpis,
    'topProtocols', v_top_protocols,
    'pending', v_pending,
    'adverseEvents', v_adverse
  );

  RETURN v_result;
END;
$function$;
