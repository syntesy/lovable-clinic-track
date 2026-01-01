-- =========================================================
-- REGISTRY ANALYTICS v1.1 - READ-ONLY MODULE
-- =========================================================

-- =========================================================
-- 1. CREATE VIEW: registry_case_summary_v1_1
-- =========================================================
CREATE OR REPLACE VIEW public.registry_case_summary_v1_1 AS
WITH baseline_data AS (
  SELECT 
    s.id AS screening_id,
    s.patient_id,
    s.created_at,
    s.classification,
    -- Extract baseline pain (NRS 0-10) from questionnaire_responses
    COALESCE(
      (s.questionnaire_responses->'regen_canonical'->'complaint'->>'pain_nrs')::numeric,
      (s.questionnaire_responses->'answers'->>'dor_escala')::numeric
    ) AS baseline_pain_nrs,
    -- Baseline function explicitly null - not available in current data
    NULL::numeric AS baseline_function_score,
    -- Procedure type from answers
    COALESCE(
      (s.questionnaire_responses->'answers'->>'procedimento_considerado'),
      'unknown'
    ) AS procedure_type,
    -- Suspected diagnosis
    (s.questionnaire_responses->'regen_canonical'->'tissue'->>'primary_region') AS tissue_type,
    (s.questionnaire_responses->'answers'->>'diagnostico_suspeito') AS diagnosis
  FROM public.prp_screenings s
),
followup_data AS (
  SELECT 
    f.screening_id,
    f.clinician_id,
    COUNT(*) FILTER (WHERE f.status = 'completed') AS completed_count,
    COUNT(*) AS total_count,
    ROUND((COUNT(*) FILTER (WHERE f.status = 'completed')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) AS completion_rate,
    -- D30 data
    MAX(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1 AS has_d30,
    MAX(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN f.pain_score END) AS d30_pain,
    MAX(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN f.function_score END) AS d30_function,
    MAX(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN f.global_change END) AS d30_global_change,
    -- D90 data
    MAX(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1 AS has_d90,
    MAX(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN f.pain_score END) AS d90_pain,
    MAX(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN f.function_score END) AS d90_function,
    MAX(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN f.global_change END) AS d90_global_change,
    -- D180 data
    MAX(CASE WHEN f.timepoint = 'D180' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1 AS has_d180,
    MAX(CASE WHEN f.timepoint = 'D180' AND f.status = 'completed' THEN f.pain_score END) AS d180_pain,
    MAX(CASE WHEN f.timepoint = 'D180' AND f.status = 'completed' THEN f.function_score END) AS d180_function,
    -- D365 data
    MAX(CASE WHEN f.timepoint = 'D365' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1 AS has_d365,
    MAX(CASE WHEN f.timepoint = 'D365' AND f.status = 'completed' THEN f.pain_score END) AS d365_pain,
    MAX(CASE WHEN f.timepoint = 'D365' AND f.status = 'completed' THEN f.function_score END) AS d365_function,
    -- Adverse events
    BOOL_OR(f.adverse_event) AS adverse_event_any,
    COUNT(*) FILTER (WHERE f.status = 'missed') AS missed_count
  FROM public.procedure_followups f
  GROUP BY f.screening_id, f.clinician_id
),
procedure_data AS (
  SELECT DISTINCT ON (pp.patient_id)
    pp.patient_id,
    pp.procedure_type AS actual_procedure_type,
    pp.procedure_date
  FROM public.patient_procedures pp
  ORDER BY pp.patient_id, pp.created_at DESC
)
SELECT
  bd.screening_id,
  fd.clinician_id,
  bd.patient_id,
  COALESCE(pd.actual_procedure_type, bd.procedure_type, 'unknown') AS procedure_type,
  bd.diagnosis,
  bd.tissue_type,
  bd.baseline_pain_nrs,
  bd.baseline_function_score,
  COALESCE(fd.completion_rate, 0) AS followup_completion_rate,
  COALESCE(fd.has_d30, false) AS has_d30,
  COALESCE(fd.has_d90, false) AS has_d90,
  COALESCE(fd.has_d180, false) AS has_d180,
  COALESCE(fd.has_d365, false) AS has_d365,
  fd.d30_pain,
  fd.d90_pain,
  fd.d180_pain,
  fd.d365_pain,
  fd.d30_function,
  fd.d90_function,
  fd.d180_function,
  fd.d365_function,
  fd.d30_global_change,
  fd.d90_global_change,
  COALESCE(fd.adverse_event_any, false) AS adverse_event_any,
  fd.missed_count,
  -- Responder status calculation (function disabled since baseline_function_score is always null)
  CASE
    WHEN NOT COALESCE(fd.has_d90, false) THEN 'INCONCLUSIVE'
    WHEN bd.baseline_pain_nrs IS NULL THEN 'INCONCLUSIVE'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) >= 4 THEN 'ROBUST_RESPONDER'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) <= -2 THEN 'NON_RESPONDER'
    WHEN fd.d90_global_change IN ('worse', 'much_worse') THEN 'NON_RESPONDER'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d30_pain, bd.baseline_pain_nrs)) >= 2
         AND (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) < 2
    THEN 'NON_RESPONDER'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) >= 2 THEN 'MODERATE_RESPONDER'
    ELSE 'NON_RESPONDER'
  END AS responder_status,
  -- Responder reason code
  CASE
    WHEN NOT COALESCE(fd.has_d90, false) THEN 'NO_D90'
    WHEN bd.baseline_pain_nrs IS NULL THEN 'MISSING_BASELINE_PAIN'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) >= 4 THEN 'ROBUST_PAIN_D90'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) <= -2 THEN 'WORSENED_D90'
    WHEN fd.d90_global_change IN ('worse', 'much_worse') THEN 'WORSENED_D90'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d30_pain, bd.baseline_pain_nrs)) >= 2
         AND (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) < 2
    THEN 'TRANSIENT_D30_ONLY'
    WHEN (bd.baseline_pain_nrs - COALESCE(fd.d90_pain, bd.baseline_pain_nrs)) >= 2 THEN 'MODERATE_PAIN_D90'
    ELSE 'INSUFFICIENT_DATA'
  END AS responder_reason_code,
  bd.created_at AS screening_created_at
FROM baseline_data bd
LEFT JOIN followup_data fd ON bd.screening_id = fd.screening_id
LEFT JOIN procedure_data pd ON bd.patient_id = pd.patient_id;

-- =========================================================
-- 2. CREATE TABLE: registry_exports_log
-- =========================================================
CREATE TABLE IF NOT EXISTS public.registry_exports_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exported_by UUID NOT NULL,
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_count INTEGER NOT NULL DEFAULT 0,
  export_version TEXT NOT NULL DEFAULT 'registry_export_v1_1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registry_exports_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export logs"
  ON public.registry_exports_log FOR SELECT
  USING (exported_by = auth.uid());

CREATE POLICY "Users can insert their own export logs"
  ON public.registry_exports_log FOR INSERT
  WITH CHECK (exported_by = auth.uid());

CREATE POLICY "Admins can view all export logs"
  ON public.registry_exports_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 3. INDEXES FOR PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_procedure_followups_screening_timepoint 
  ON public.procedure_followups(screening_id, timepoint, status);

CREATE INDEX IF NOT EXISTS idx_prp_screenings_patient 
  ON public.prp_screenings(patient_id);

COMMENT ON VIEW public.registry_case_summary_v1_1 IS 'Registry Analytics v1.1 - READ-ONLY view for analytics dashboard with responder classification.';
COMMENT ON TABLE public.registry_exports_log IS 'Tracks all CSV exports from the registry for audit purposes.';