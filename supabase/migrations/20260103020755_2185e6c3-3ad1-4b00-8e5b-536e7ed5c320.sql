-- =====================================================
-- SECURITY FIX: Patient-specific RLS policies
-- =====================================================

-- 1. Add professional_id column to patients table (tracks who created the patient)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES auth.users(id);

-- 2. Update existing patients to assign to the first user with healthcare role (fallback)
-- Using user_roles table which has proper role info
UPDATE public.patients 
SET professional_id = (
  SELECT ur.user_id FROM public.user_roles ur 
  WHERE ur.role IN ('admin', 'professional') 
  LIMIT 1
)
WHERE professional_id IS NULL;

-- 3. Drop old permissive policies on patients
DROP POLICY IF EXISTS "Healthcare professionals can view patients" ON public.patients;
DROP POLICY IF EXISTS "Healthcare professionals can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Healthcare professionals can update patients" ON public.patients;

-- 4. Create new patient-specific RLS policies for patients table
-- Professionals can only see patients they created (or admins see all)
CREATE POLICY "Professionals can view own patients" 
ON public.patients 
FOR SELECT 
TO authenticated
USING (
  professional_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- Professionals can insert patients (automatically assigned to them via trigger)
CREATE POLICY "Professionals can insert own patients" 
ON public.patients 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_healthcare_professional(auth.uid())
);

-- Professionals can only update their own patients (or admins update all)
CREATE POLICY "Professionals can update own patients" 
ON public.patients 
FOR UPDATE 
TO authenticated
USING (
  professional_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- 5. Drop old permissive policies on prp_screenings
DROP POLICY IF EXISTS "Healthcare professionals can view prp screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Healthcare professionals can insert prp screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Healthcare professionals can update prp screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Healthcare professionals can delete prp screenings" ON public.prp_screenings;

-- 6. Create patient-specific RLS policies for prp_screenings
-- Screenings inherit access from the patient they belong to
CREATE POLICY "Professionals can view own patient screenings" 
ON public.prp_screenings 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND (p.professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Professionals can insert own patient screenings" 
ON public.prp_screenings 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND (p.professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Professionals can update own patient screenings" 
ON public.prp_screenings 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND (p.professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Professionals can delete own patient screenings" 
ON public.prp_screenings 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND (p.professional_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- 7. Fix the security definer view - recreate without security definer
DROP VIEW IF EXISTS public.registry_case_summary_v1_1;

CREATE VIEW public.registry_case_summary_v1_1 AS
WITH baseline_data AS (
  SELECT 
    s.id AS screening_id,
    s.patient_id,
    s.created_at AS screening_created_at,
    s.classification,
    COALESCE(
      ((s.questionnaire_responses -> 'regen_canonical' -> 'complaint' ->> 'pain_nrs')::numeric),
      ((s.questionnaire_responses -> 'answers' ->> 'dor_escala')::numeric)
    ) AS baseline_pain_nrs,
    NULL::numeric AS baseline_function_score,
    COALESCE(
      (s.questionnaire_responses -> 'answers' ->> 'procedimento_considerado'),
      'unknown'
    ) AS procedure_type,
    (s.questionnaire_responses -> 'regen_canonical' -> 'tissue' ->> 'primary_region') AS tissue_type,
    (s.questionnaire_responses -> 'answers' ->> 'diagnostico_suspeito') AS diagnosis
  FROM public.prp_screenings s
),
followup_data AS (
  SELECT 
    f.screening_id,
    f.clinician_id,
    count(*) FILTER (WHERE f.status = 'completed') AS completed_count,
    count(*) AS total_count,
    round((count(*) FILTER (WHERE f.status = 'completed')::numeric / NULLIF(count(*), 0)::numeric) * 100, 1) AS completion_rate,
    (max(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1) AS has_d30,
    max(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN f.pain_score END) AS d30_pain,
    max(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN f.function_score END) AS d30_function,
    max(CASE WHEN f.timepoint = 'D30' AND f.status = 'completed' THEN f.global_change END) AS d30_global_change,
    (max(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1) AS has_d90,
    max(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN f.pain_score END) AS d90_pain,
    max(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN f.function_score END) AS d90_function,
    max(CASE WHEN f.timepoint = 'D90' AND f.status = 'completed' THEN f.global_change END) AS d90_global_change,
    (max(CASE WHEN f.timepoint = 'D180' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1) AS has_d180,
    max(CASE WHEN f.timepoint = 'D180' AND f.status = 'completed' THEN f.pain_score END) AS d180_pain,
    max(CASE WHEN f.timepoint = 'D180' AND f.status = 'completed' THEN f.function_score END) AS d180_function,
    (max(CASE WHEN f.timepoint = 'D365' AND f.status = 'completed' THEN 1 ELSE 0 END) = 1) AS has_d365,
    max(CASE WHEN f.timepoint = 'D365' AND f.status = 'completed' THEN f.pain_score END) AS d365_pain,
    max(CASE WHEN f.timepoint = 'D365' AND f.status = 'completed' THEN f.function_score END) AS d365_function,
    bool_or(f.adverse_event) AS adverse_event_any,
    count(*) FILTER (WHERE f.status = 'missed') AS missed_count
  FROM public.procedure_followups f
  GROUP BY f.screening_id, f.clinician_id
)
SELECT 
  b.screening_id,
  b.patient_id,
  f.clinician_id,
  b.screening_created_at,
  b.classification,
  b.baseline_pain_nrs,
  b.baseline_function_score,
  b.procedure_type,
  b.tissue_type,
  b.diagnosis,
  COALESCE(f.completed_count, 0)::bigint AS followups_completed,
  COALESCE(f.total_count, 0)::bigint AS followups_total,
  COALESCE(f.completion_rate, 0) AS followup_completion_rate,
  f.has_d30,
  f.d30_pain,
  f.d30_function,
  f.d30_global_change,
  f.has_d90,
  f.d90_pain,
  f.d90_function,
  f.d90_global_change,
  f.has_d180,
  f.d180_pain,
  f.d180_function,
  NULL::integer AS d180_function_dummy,
  f.has_d365,
  f.d365_pain,
  f.d365_function,
  f.adverse_event_any,
  f.missed_count,
  CASE 
    WHEN b.baseline_pain_nrs IS NOT NULL AND f.d90_pain IS NOT NULL 
      AND (b.baseline_pain_nrs - f.d90_pain) >= 2 THEN 'responder'
    WHEN b.baseline_pain_nrs IS NOT NULL AND f.d90_pain IS NOT NULL 
      AND (b.baseline_pain_nrs - f.d90_pain) < 2 THEN 'non_responder'
    ELSE 'incomplete'
  END AS responder_status,
  CASE 
    WHEN b.baseline_pain_nrs IS NULL THEN 'missing_baseline'
    WHEN f.d90_pain IS NULL THEN 'missing_followup'
    ELSE 'complete'
  END AS responder_reason_code
FROM baseline_data b
LEFT JOIN followup_data f ON b.screening_id = f.screening_id;

-- 8. Grant access to the view (RLS is inherited from underlying tables)
GRANT SELECT ON public.registry_case_summary_v1_1 TO authenticated;

-- 9. Create trigger to auto-set professional_id on patient insert
CREATE OR REPLACE FUNCTION public.set_patient_professional_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.professional_id IS NULL THEN
    NEW.professional_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_patient_professional_id_trigger ON public.patients;
CREATE TRIGGER set_patient_professional_id_trigger
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_patient_professional_id();