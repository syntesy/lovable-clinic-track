
-- RPC: get_conformity_metrics
-- Returns KPIs, top protocols, pending items, and adverse events for a clinic within a date range.
-- Enforces clinic_id server-side for multi-tenant isolation.

CREATE OR REPLACE FUNCTION public.get_conformity_metrics(
  p_clinic_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_area text DEFAULT NULL,
  p_protocol_type text DEFAULT NULL,
  p_only_completed boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  v_protocol_distribution jsonb;
BEGIN
  -- ======== KPIs ========
  
  -- Total procedures in period
  SELECT COUNT(*) INTO v_total
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.created_at >= p_start
    AND psr.created_at < p_end
    AND (p_area IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area
    ))
    AND (p_protocol_type IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type
    ))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- With protocol linked (should be ~100% now)
  SELECT COUNT(*) INTO v_with_protocol
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.created_at >= p_start
    AND psr.created_at < p_end
    AND psr.protocol_id IS NOT NULL
    AND (p_area IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area
    ))
    AND (p_protocol_type IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type
    ))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- Checklist completed
  SELECT COUNT(*) INTO v_checklist_completed
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.created_at >= p_start
    AND psr.created_at < p_end
    AND psr.safety_checklist_status = 'COMPLETED'
    AND (p_area IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area
    ))
    AND (p_protocol_type IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type
    ))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- Finalized
  SELECT COUNT(*) INTO v_finalized
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.created_at >= p_start
    AND psr.created_at < p_end
    AND psr.clinical_standard_status = 'completed'
    AND (p_area IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area
    ))
    AND (p_protocol_type IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type
    ));

  -- Adverse events reported
  SELECT COUNT(*) INTO v_adverse_count
  FROM procedure_standard_records psr
  WHERE psr.clinic_id = p_clinic_id
    AND psr.created_at >= p_start
    AND psr.created_at < p_end
    AND psr.adverse_event_status = 'REPORTED'
    AND (p_area IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.area = p_area
    ))
    AND (p_protocol_type IS NULL OR EXISTS (
      SELECT 1 FROM protocols pr WHERE pr.id = psr.protocol_id AND pr.protocol_type::text = p_protocol_type
    ))
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed');

  -- Protocol type distribution
  SELECT COALESCE(jsonb_agg(jsonb_build_object('type', pt, 'count', cnt)), '[]'::jsonb)
  INTO v_protocol_distribution
  FROM (
    SELECT pr.protocol_type::text AS pt, COUNT(*) AS cnt
    FROM procedure_standard_records psr
    JOIN protocols pr ON pr.id = psr.protocol_id
    WHERE psr.clinic_id = p_clinic_id
      AND psr.created_at >= p_start
      AND psr.created_at < p_end
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
      AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed')
    GROUP BY pr.protocol_type
    ORDER BY cnt DESC
  ) sub;

  v_kpis := jsonb_build_object(
    'total', v_total,
    'withProtocol', v_with_protocol,
    'checklistCompleted', v_checklist_completed,
    'finalized', v_finalized,
    'adverseEvents', v_adverse_count,
    'protocolDistribution', v_protocol_distribution
  );

  -- ======== Top 10 Protocols ========
  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  INTO v_top_protocols
  FROM (
    SELECT 
      pr.id AS protocol_id,
      pr.title,
      pr.protocol_type::text AS protocol_type,
      COUNT(psr.id) AS total_procedures,
      COUNT(CASE WHEN psr.safety_checklist_status = 'COMPLETED' THEN 1 END) AS checklist_completed_count
    FROM procedure_standard_records psr
    JOIN protocols pr ON pr.id = psr.protocol_id
    WHERE psr.clinic_id = p_clinic_id
      AND psr.created_at >= p_start
      AND psr.created_at < p_end
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
      AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed')
    GROUP BY pr.id, pr.title, pr.protocol_type
    ORDER BY COUNT(psr.id) DESC
    LIMIT 10
  ) sub;

  -- ======== Pending Compliance ========
  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  INTO v_pending
  FROM (
    SELECT 
      psr.id,
      psr.created_at,
      psr.attendance_id,
      psr.safety_checklist_status::text AS checklist_status,
      psr.clinical_standard_status AS finalization_status,
      pr.title AS protocol_title,
      pat.full_name AS patient_name
    FROM procedure_standard_records psr
    JOIN protocols pr ON pr.id = psr.protocol_id
    LEFT JOIN attendance_sessions att ON att.id = psr.attendance_id
    LEFT JOIN patients pat ON pat.id = att.patient_id
    WHERE psr.clinic_id = p_clinic_id
      AND psr.created_at >= p_start
      AND psr.created_at < p_end
      AND (psr.safety_checklist_status != 'COMPLETED' OR psr.clinical_standard_status != 'completed')
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
    ORDER BY psr.created_at DESC
    LIMIT 50
  ) sub;

  -- ======== Adverse Events ========
  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  INTO v_adverse
  FROM (
    SELECT 
      psr.id,
      psr.created_at,
      psr.attendance_id,
      psr.adverse_event_record,
      pr.title AS protocol_title,
      pat.full_name AS patient_name
    FROM procedure_standard_records psr
    JOIN protocols pr ON pr.id = psr.protocol_id
    LEFT JOIN attendance_sessions att ON att.id = psr.attendance_id
    LEFT JOIN patients pat ON pat.id = att.patient_id
    WHERE psr.clinic_id = p_clinic_id
      AND psr.created_at >= p_start
      AND psr.created_at < p_end
      AND psr.adverse_event_status = 'REPORTED'
      AND (p_area IS NULL OR pr.area = p_area)
      AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
    ORDER BY psr.created_at DESC
    LIMIT 50
  ) sub;

  -- ======== Assemble result ========
  v_result := jsonb_build_object(
    'kpis', v_kpis,
    'topProtocols', v_top_protocols,
    'pending', v_pending,
    'adverseEvents', v_adverse
  );

  RETURN v_result;
END;
$$;
