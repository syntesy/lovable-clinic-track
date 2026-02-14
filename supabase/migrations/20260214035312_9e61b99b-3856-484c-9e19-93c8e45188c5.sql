
-- ============================================================
-- RPC: get_conformity_metrics_by_professional
-- Filters all procedure_standard_records by professional + clinic
-- Returns same shape as get_conformity_metrics + professional identity + traceability %
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_conformity_metrics_by_professional(
  p_clinic_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_professional_id uuid,
  p_area text DEFAULT NULL,
  p_protocol_type text DEFAULT NULL,
  p_only_completed boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_professional jsonb;
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
  v_traceability_complete int;
  v_protocol_distribution jsonb;
  v_prof_role text;
  v_prof_email text;
BEGIN
  -- Validate caller belongs to same clinic
  IF NOT EXISTS (
    SELECT 1 FROM clinics c
    WHERE c.id = p_clinic_id
      AND c.is_active = true
      AND c.owner_user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'professional')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get professional identity
  SELECT ur.role::text INTO v_prof_role
  FROM user_roles ur WHERE ur.user_id = p_professional_id;

  SELECT au.email INTO v_prof_email
  FROM auth.users au WHERE au.id = p_professional_id;

  v_professional := jsonb_build_object(
    'id', p_professional_id,
    'name', COALESCE(v_prof_email, p_professional_id::text),
    'role', COALESCE(v_prof_role, 'unknown')
  );

  -- Total procedures for this professional
  SELECT COUNT(*) INTO v_total
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_with_protocol
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.protocol_id IS NOT NULL
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_checklist_completed
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.safety_checklist_status = 'COMPLETED'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_finalized
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.clinical_standard_status = 'completed'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type));

  SELECT COUNT(*) INTO v_adverse_count
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end AND psr.adverse_event_status = 'REPORTED'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- Scientific counts
  SELECT COUNT(*) INTO v_scientific_draft
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end
    AND psr.scientific_badge_status = 'DRAFT'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  SELECT COUNT(*) INTO v_scientific_validated
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end
    AND psr.scientific_badge_status = 'VALIDATED'
    AND (p_area IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area))
    AND (p_protocol_type IS NULL OR EXISTS (SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- Traceability complete (manufacturer + kit_system + lot + expiry_date all filled)
  SELECT COUNT(*) INTO v_traceability_complete
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.responsible_professional_user_id = p_professional_id
    AND psr.created_at >= p_start AND psr.created_at < p_end
    AND psr.material_traceability IS NOT NULL
    AND psr.material_traceability->>'manufacturer' IS NOT NULL AND psr.material_traceability->>'manufacturer' != ''
    AND psr.material_traceability->>'kit_system' IS NOT NULL AND psr.material_traceability->>'kit_system' != ''
    AND psr.material_traceability->>'lot' IS NOT NULL AND psr.material_traceability->>'lot' != ''
    AND psr.material_traceability->>'expiry_date' IS NOT NULL AND psr.material_traceability->>'expiry_date' != ''
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
    WHERE psr.clinic_id = p_clinic_id
      AND psr.responsible_professional_user_id = p_professional_id
      AND psr.created_at >= p_start AND psr.created_at < p_end
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
    'traceabilityComplete', v_traceability_complete,
    'protocolDistribution', v_protocol_distribution
  );

  -- Top 10 protocols
  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb) INTO v_top_protocols
  FROM (
    SELECT pr.id AS protocol_id, pr.title, pr.protocol_type::text AS protocol_type,
      COUNT(psr.id) AS total_procedures,
      COUNT(CASE WHEN psr.safety_checklist_status = 'COMPLETED' THEN 1 END) AS checklist_completed_count
    FROM procedure_standard_records psr JOIN protocols pr ON pr.id = psr.protocol_id
    WHERE psr.clinic_id = p_clinic_id
      AND psr.responsible_professional_user_id = p_professional_id
      AND psr.created_at >= p_start AND psr.created_at < p_end
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
    WHERE psr.clinic_id = p_clinic_id
      AND psr.responsible_professional_user_id = p_professional_id
      AND psr.created_at >= p_start AND psr.created_at < p_end
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
    WHERE psr.clinic_id = p_clinic_id
      AND psr.responsible_professional_user_id = p_professional_id
      AND psr.created_at >= p_start AND psr.created_at < p_end
      AND psr.adverse_event_status = 'REPORTED'
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
    ORDER BY psr.created_at DESC LIMIT 50
  ) sub;

  v_result := jsonb_build_object(
    'professional', v_professional,
    'kpis', v_kpis,
    'topProtocols', v_top_protocols,
    'pending', v_pending,
    'adverseEvents', v_adverse
  );

  RETURN v_result;
END;
$$;
