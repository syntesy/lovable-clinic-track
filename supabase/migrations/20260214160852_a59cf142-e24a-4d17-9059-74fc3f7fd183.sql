
-- ========================================================
-- ETAPA 3: RPC get_results_analytics
-- ========================================================

CREATE OR REPLACE FUNCTION public.get_results_analytics(
  p_clinic_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_procedure_type text DEFAULT NULL,
  p_pathology text DEFAULT NULL,
  p_anatomic_region text DEFAULT NULL,
  p_protocol_id uuid DEFAULT NULL,
  p_protocol_type text DEFAULT NULL,
  p_responsible_professional_id uuid DEFAULT NULL,
  p_only_completed boolean DEFAULT true,
  p_only_scientific boolean DEFAULT false,
  p_scientific_status text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 25,
  p_sort text DEFAULT 'latest'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_result json;
  v_kpis json;
  v_charts json;
  v_cases json;
  v_total_cases int;
  v_followup_coverage_pct numeric;
  v_response_rate_pct numeric;
  v_nonresponder_rate_pct numeric;
  v_worsening_rate_pct numeric;
  v_avg_time_to_followup numeric;
  v_completion_pct numeric;
  v_checklist_pct numeric;
  v_method_pct numeric;
  v_traceability_pct numeric;
  v_sci_validated int;
  v_sci_draft int;
  v_cases_total int;
  v_offset int;
  v_no_data boolean := false;
BEGIN
  -- ========================================
  -- SECURITY: verify caller belongs to clinic
  -- ========================================
  IF NOT EXISTS (
    SELECT 1 FROM public.clinics c
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE c.id = p_clinic_id
      AND c.is_active = true
      AND ur.role = ANY(ARRAY['admin'::app_role, 'professional'::app_role])
  ) THEN
    RAISE EXCEPTION 'Access denied: user does not belong to clinic or lacks required role';
  END IF;

  v_offset := (GREATEST(p_page, 1) - 1) * GREATEST(p_page_size, 1);

  -- ========================================
  -- CTE: filtered PSRs (all filters applied once)
  -- ========================================
  -- We use a temp table for performance with multiple aggregations
  CREATE TEMP TABLE _filtered_psr ON COMMIT DROP AS
  SELECT
    psr.id AS psr_id,
    psr.attendance_id,
    psr.procedure_type,
    psr.pathology,
    psr.anatomic_region,
    psr.protocol_id,
    psr.clinical_standard_status,
    psr.safety_checklist_status::text AS checklist_status,
    psr.scientific_badge_status::text AS sci_badge,
    psr.material_traceability,
    psr.method_run,
    psr.responsible_professional_user_id,
    psr.created_at AS psr_created_at,
    pr.title AS protocol_title,
    att.patient_id
  FROM public.procedure_standard_records psr
  JOIN public.attendance_sessions att ON att.id = psr.attendance_id
  LEFT JOIN public.protocols pr ON pr.id = psr.protocol_id
  WHERE psr.clinic_id = p_clinic_id
    AND psr.created_at >= p_start
    AND psr.created_at < p_end
    -- Filters
    AND (p_procedure_type IS NULL OR psr.procedure_type = p_procedure_type)
    AND (p_pathology IS NULL OR psr.pathology = p_pathology)
    AND (p_anatomic_region IS NULL OR psr.anatomic_region = p_anatomic_region)
    AND (p_protocol_id IS NULL OR psr.protocol_id = p_protocol_id)
    AND (p_protocol_type IS NULL OR pr.protocol_type::text = p_protocol_type)
    AND (p_responsible_professional_id IS NULL OR psr.responsible_professional_user_id = p_responsible_professional_id)
    AND (NOT p_only_completed OR psr.clinical_standard_status = 'completed')
    AND (NOT p_only_scientific OR psr.scientific_mode_enabled = true)
    AND (p_scientific_status IS NULL OR psr.scientific_badge_status::text = p_scientific_status);

  -- ========================================
  -- CTE: outcomes per PSR (baseline + latest)
  -- ========================================
  CREATE TEMP TABLE _psr_outcomes ON COMMIT DROP AS
  WITH ranked_outcomes AS (
    SELECT
      pro.procedure_standard_record_id AS psr_id,
      pro.timepoint,
      pro.pain_score,
      pro.function_score,
      pro.function_scale_type,
      pro.global_change,
      pro.adverse_event,
      pro.created_at AS outcome_at,
      -- Timepoint ordering: baseline=0, m1=1, m3=2, m6=3, m12=4
      CASE pro.timepoint
        WHEN 'baseline' THEN 0
        WHEN 'm1' THEN 1
        WHEN 'm3' THEN 2
        WHEN 'm6' THEN 3
        WHEN 'm12' THEN 4
        ELSE -1
      END AS tp_order
    FROM public.patient_reported_outcomes pro
    WHERE pro.clinic_id = p_clinic_id
      AND pro.procedure_standard_record_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM _filtered_psr fp WHERE fp.psr_id = pro.procedure_standard_record_id)
  ),
  baseline AS (
    SELECT DISTINCT ON (psr_id)
      psr_id,
      pain_score AS bl_pain,
      function_score AS bl_function,
      function_scale_type AS bl_scale,
      outcome_at AS bl_at
    FROM ranked_outcomes
    WHERE timepoint = 'baseline'
    ORDER BY psr_id, outcome_at DESC
  ),
  latest AS (
    SELECT DISTINCT ON (psr_id)
      psr_id,
      pain_score AS lt_pain,
      function_score AS lt_function,
      function_scale_type AS lt_scale,
      global_change AS lt_global_change,
      adverse_event AS lt_adverse,
      timepoint AS lt_timepoint,
      outcome_at AS lt_at,
      tp_order
    FROM ranked_outcomes
    WHERE tp_order > 0  -- exclude baseline
    ORDER BY psr_id, tp_order DESC, outcome_at DESC
  )
  SELECT
    fp.psr_id,
    fp.patient_id,
    fp.procedure_type,
    fp.pathology,
    fp.protocol_title,
    fp.checklist_status,
    fp.sci_badge,
    fp.material_traceability,
    fp.method_run,
    fp.psr_created_at,
    -- Baseline
    b.bl_pain,
    b.bl_function,
    b.bl_scale,
    b.bl_at,
    -- Latest followup
    l.lt_pain,
    l.lt_function,
    l.lt_scale,
    l.lt_global_change,
    l.lt_adverse,
    l.lt_timepoint,
    l.lt_at,
    -- Determine primary instrument: if pain baseline exists, use pain
    CASE
      WHEN b.bl_pain IS NOT NULL AND l.lt_pain IS NOT NULL THEN 'pain'
      WHEN b.bl_function IS NOT NULL AND l.lt_function IS NOT NULL THEN 'function'
      ELSE NULL
    END AS instrument,
    -- Delta for pain: latest - baseline (negative = improvement)
    CASE
      WHEN b.bl_pain IS NOT NULL AND l.lt_pain IS NOT NULL
        THEN l.lt_pain - b.bl_pain
      ELSE NULL
    END AS delta_pain,
    -- Delta for function: latest - baseline (positive = improvement)
    CASE
      WHEN b.bl_function IS NOT NULL AND l.lt_function IS NOT NULL
        THEN l.lt_function - b.bl_function
      ELSE NULL
    END AS delta_function,
    -- Delta pct for pain: (latest - baseline) / baseline * 100
    CASE
      WHEN b.bl_pain IS NOT NULL AND l.lt_pain IS NOT NULL AND b.bl_pain > 0
        THEN ROUND(((l.lt_pain - b.bl_pain)::numeric / b.bl_pain) * 100, 1)
      ELSE NULL
    END AS delta_pain_pct,
    -- Delta pct for function: (latest - baseline) / NULLIF(baseline,0) * 100
    CASE
      WHEN b.bl_function IS NOT NULL AND l.lt_function IS NOT NULL AND b.bl_function > 0
        THEN ROUND(((l.lt_function - b.bl_function)::numeric / b.bl_function) * 100, 1)
      ELSE NULL
    END AS delta_function_pct,
    -- Days between baseline and latest
    CASE
      WHEN b.bl_at IS NOT NULL AND l.lt_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (l.lt_at - b.bl_at)) / 86400.0
      ELSE NULL
    END AS days_to_followup,
    -- Has any followup (not just baseline)
    (l.psr_id IS NOT NULL) AS has_followup,
    -- Has baseline
    (b.psr_id IS NOT NULL) AS has_baseline
  FROM _filtered_psr fp
  LEFT JOIN baseline b ON b.psr_id = fp.psr_id
  LEFT JOIN latest l ON l.psr_id = fp.psr_id;

  -- ========================================
  -- Add classification column
  -- ========================================
  ALTER TABLE _psr_outcomes ADD COLUMN classification text;

  UPDATE _psr_outcomes SET classification =
    CASE
      -- No data: no baseline or no followup
      WHEN instrument IS NULL THEN 'NO_DATA'
      -- Pain instrument
      WHEN instrument = 'pain' THEN
        CASE
          -- Responder: reduction >= 2 points OR >= 30%
          WHEN delta_pain <= -2 OR (delta_pain_pct IS NOT NULL AND delta_pain_pct <= -30) THEN 'RESPONDER'
          -- Worsening: increase >= 2 points OR >= 30%
          WHEN delta_pain >= 2 OR (delta_pain_pct IS NOT NULL AND delta_pain_pct >= 30) THEN 'WORSENING'
          ELSE 'NON_RESPONDER'
        END
      -- Function instrument
      WHEN instrument = 'function' THEN
        CASE
          -- Responder: improvement >= 30%
          WHEN delta_function_pct IS NOT NULL AND delta_function_pct >= 30 THEN 'RESPONDER'
          -- Worsening: deterioration >= 30%
          WHEN delta_function_pct IS NOT NULL AND delta_function_pct <= -30 THEN 'WORSENING'
          ELSE 'NON_RESPONDER'
        END
      ELSE 'NO_DATA'
    END;

  -- ========================================
  -- KPIs
  -- ========================================
  SELECT COUNT(*) INTO v_total_cases FROM _psr_outcomes;

  IF v_total_cases = 0 THEN
    v_no_data := true;
  END IF;

  -- followup_coverage_pct: % with baseline + any followup
  SELECT ROUND(
    COALESCE(COUNT(*) FILTER (WHERE has_baseline AND has_followup)::numeric / NULLIF(v_total_cases, 0) * 100, 0), 1
  ) INTO v_followup_coverage_pct FROM _psr_outcomes;

  -- Response/non-responder/worsening rates (among those WITH data)
  SELECT
    ROUND(COALESCE(COUNT(*) FILTER (WHERE classification = 'RESPONDER')::numeric / NULLIF(COUNT(*) FILTER (WHERE classification != 'NO_DATA'), 0) * 100, 0), 1),
    ROUND(COALESCE(COUNT(*) FILTER (WHERE classification = 'NON_RESPONDER')::numeric / NULLIF(COUNT(*) FILTER (WHERE classification != 'NO_DATA'), 0) * 100, 0), 1),
    ROUND(COALESCE(COUNT(*) FILTER (WHERE classification = 'WORSENING')::numeric / NULLIF(COUNT(*) FILTER (WHERE classification != 'NO_DATA'), 0) * 100, 0), 1)
  INTO v_response_rate_pct, v_nonresponder_rate_pct, v_worsening_rate_pct
  FROM _psr_outcomes;

  -- avg_time_to_followup
  SELECT ROUND(COALESCE(AVG(days_to_followup), 0), 1)
  INTO v_avg_time_to_followup
  FROM _psr_outcomes WHERE days_to_followup IS NOT NULL;

  -- completion_pct (PSR with clinical_standard_status = completed, relative to filtered set)
  SELECT ROUND(
    COALESCE(COUNT(*) FILTER (WHERE checklist_status IS NOT NULL)::numeric / NULLIF(v_total_cases, 0) * 100, 0), 1
  ) INTO v_completion_pct FROM _psr_outcomes;

  -- checklist_completed_pct
  SELECT ROUND(
    COALESCE(COUNT(*) FILTER (WHERE checklist_status = 'COMPLETED')::numeric / NULLIF(v_total_cases, 0) * 100, 0), 1
  ) INTO v_checklist_pct FROM _psr_outcomes;

  -- method_complete_pct: method_run is not null and has fields
  SELECT ROUND(
    COALESCE(COUNT(*) FILTER (WHERE method_run IS NOT NULL AND method_run != '{}'::jsonb)::numeric / NULLIF(v_total_cases, 0) * 100, 0), 1
  ) INTO v_method_pct FROM _psr_outcomes;

  -- traceability_complete_pct
  SELECT ROUND(
    COALESCE(COUNT(*) FILTER (
      WHERE material_traceability IS NOT NULL
        AND material_traceability->>'manufacturer' IS NOT NULL AND material_traceability->>'manufacturer' != ''
        AND material_traceability->>'kit_system' IS NOT NULL AND material_traceability->>'kit_system' != ''
        AND material_traceability->>'lot' IS NOT NULL AND material_traceability->>'lot' != ''
        AND material_traceability->>'expiry_date' IS NOT NULL AND material_traceability->>'expiry_date' != ''
    )::numeric / NULLIF(v_total_cases, 0) * 100, 0), 1
  ) INTO v_traceability_pct FROM _psr_outcomes;

  -- scientific counts
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE sci_badge = 'VALIDATED'), 0),
    COALESCE(COUNT(*) FILTER (WHERE sci_badge = 'DRAFT'), 0)
  INTO v_sci_validated, v_sci_draft
  FROM _psr_outcomes;

  v_kpis := json_build_object(
    'total_cases', v_total_cases,
    'no_data', v_no_data,
    'followup_coverage_pct', v_followup_coverage_pct,
    'response_rate_pct', v_response_rate_pct,
    'nonresponder_rate_pct', v_nonresponder_rate_pct,
    'worsening_rate_pct', v_worsening_rate_pct,
    'avg_time_to_followup_days', v_avg_time_to_followup,
    'completion_pct', v_completion_pct,
    'checklist_completed_pct', v_checklist_pct,
    'method_complete_pct', v_method_pct,
    'traceability_complete_pct', v_traceability_pct,
    'scientific_validated_count', v_sci_validated,
    'scientific_draft_count', v_sci_draft
  );

  -- ========================================
  -- CHARTS
  -- ========================================
  v_charts := json_build_object(
    -- response_distribution
    'response_distribution', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
      FROM (
        SELECT classification AS label, COUNT(*) AS value
        FROM _psr_outcomes
        GROUP BY classification
        ORDER BY value DESC
      ) sub
    ),
    -- severity_distribution (baseline pain buckets)
    'severity_distribution', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
      FROM (
        SELECT
          CASE
            WHEN bl_pain BETWEEN 0 AND 3 THEN 'Leve (0-3)'
            WHEN bl_pain BETWEEN 4 AND 6 THEN 'Moderada (4-6)'
            WHEN bl_pain BETWEEN 7 AND 10 THEN 'Grave (7-10)'
            ELSE 'Sem baseline'
          END AS label,
          COUNT(*) AS value
        FROM _psr_outcomes
        GROUP BY 1
        ORDER BY
          CASE
            WHEN bl_pain BETWEEN 0 AND 3 THEN 1
            WHEN bl_pain BETWEEN 4 AND 6 THEN 2
            WHEN bl_pain BETWEEN 7 AND 10 THEN 3
            ELSE 4
          END
      ) sub
    ),
    -- outcomes_over_time: monthly % responder
    'outcomes_over_time', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
      FROM (
        SELECT
          TO_CHAR(DATE_TRUNC('month', psr_created_at), 'YYYY-MM') AS month,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE classification = 'RESPONDER') AS responders,
          ROUND(
            COALESCE(
              COUNT(*) FILTER (WHERE classification = 'RESPONDER')::numeric
              / NULLIF(COUNT(*) FILTER (WHERE classification != 'NO_DATA'), 0) * 100
            , 0), 1
          ) AS responder_pct
        FROM _psr_outcomes
        GROUP BY DATE_TRUNC('month', psr_created_at)
        ORDER BY DATE_TRUNC('month', psr_created_at)
      ) sub
    ),
    -- top_protocols_internal
    'top_protocols_internal', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
      FROM (
        SELECT
          protocol_title,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE classification = 'RESPONDER') AS responders,
          ROUND(
            COALESCE(
              COUNT(*) FILTER (WHERE classification = 'RESPONDER')::numeric
              / NULLIF(COUNT(*) FILTER (WHERE classification != 'NO_DATA'), 0) * 100
            , 0), 1
          ) AS responder_pct
        FROM _psr_outcomes
        WHERE protocol_title IS NOT NULL
        GROUP BY protocol_title
        ORDER BY total DESC
        LIMIT 10
      ) sub
    )
  );

  -- ========================================
  -- CASES (paginated)
  -- ========================================
  SELECT COUNT(*) INTO v_cases_total FROM _psr_outcomes;

  v_cases := json_build_object(
    'items', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
      FROM (
        SELECT
          o.psr_id,
          o.patient_id,
          -- Mask patient name: first name initial + last name initial
          (
            SELECT
              COALESCE(
                UPPER(LEFT(p.full_name, 1)) || '.' ||
                UPPER(LEFT(SPLIT_PART(p.full_name, ' ', array_length(string_to_array(p.full_name, ' '), 1)), 1)) || '.',
                '??'
              )
            FROM public.patients p WHERE p.id = o.patient_id
          ) AS patient_display,
          o.procedure_type,
          o.pathology,
          o.protocol_title,
          -- Baseline value (prefer pain, fallback function)
          COALESCE(o.bl_pain::numeric, o.bl_function) AS baseline_value,
          -- Latest value
          COALESCE(o.lt_pain::numeric, o.lt_function) AS latest_value,
          -- Delta value
          CASE
            WHEN o.instrument = 'pain' THEN o.delta_pain::numeric
            WHEN o.instrument = 'function' THEN o.delta_function
            ELSE NULL
          END AS delta_value,
          -- Delta pct
          CASE
            WHEN o.instrument = 'pain' THEN o.delta_pain_pct
            WHEN o.instrument = 'function' THEN o.delta_function_pct
            ELSE NULL
          END AS delta_pct,
          o.classification,
          o.lt_at AS last_followup_at
        FROM _psr_outcomes o
        ORDER BY
          CASE p_sort
            WHEN 'delta' THEN
              CASE
                WHEN o.instrument = 'pain' THEN o.delta_pain_pct
                WHEN o.instrument = 'function' THEN o.delta_function_pct
                ELSE NULL
              END
            WHEN 'baseline' THEN COALESCE(o.bl_pain::numeric, o.bl_function)
            ELSE NULL
          END DESC NULLS LAST,
          CASE WHEN p_sort = 'latest' OR p_sort NOT IN ('delta', 'baseline') THEN o.lt_at ELSE NULL END DESC NULLS LAST,
          o.psr_created_at DESC
        LIMIT p_page_size
        OFFSET v_offset
      ) sub
    ),
    'page', p_page,
    'page_size', p_page_size,
    'total', v_cases_total
  );

  -- ========================================
  -- FINAL RESULT
  -- ========================================
  v_result := json_build_object(
    'kpis', v_kpis,
    'charts', v_charts,
    'cases', v_cases
  );

  RETURN v_result;
END;
$function$;
