
-- =====================================================
-- SECURITY HARDENING MIGRATION v2
-- Fixes all detected security vulnerabilities
-- =====================================================

-- 1. REGISTRY_CASE_SUMMARY_V1_1 - Recreate view with security_invoker
DROP VIEW IF EXISTS public.registry_case_summary_v1_1;

CREATE VIEW public.registry_case_summary_v1_1 
WITH (security_invoker = true)
AS
SELECT
    s.id as screening_id,
    s.patient_id,
    p.professional_id as clinician_id,
    s.created_at as screening_created_at,
    (s.questionnaire_responses->>'baseline_pain_nrs')::numeric as baseline_pain_nrs,
    (s.questionnaire_responses->>'baseline_function_score')::numeric as baseline_function_score,
    (SELECT COUNT(*) FROM procedure_followups f WHERE f.screening_id = s.id AND f.status = 'completed') as followups_completed,
    (SELECT COUNT(*) FROM procedure_followups f WHERE f.screening_id = s.id) as followups_total,
    CASE 
        WHEN (SELECT COUNT(*) FROM procedure_followups f WHERE f.screening_id = s.id) > 0 
        THEN ROUND((SELECT COUNT(*) FROM procedure_followups f WHERE f.screening_id = s.id AND f.status = 'completed')::numeric / 
             (SELECT COUNT(*) FROM procedure_followups f WHERE f.screening_id = s.id)::numeric * 100, 2)
        ELSE 0
    END as followup_completion_rate,
    EXISTS(SELECT 1 FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D30' AND f.status = 'completed') as has_d30,
    (SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D30' AND f.status = 'completed' LIMIT 1) as d30_pain,
    (SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D30' AND f.status = 'completed' LIMIT 1) as d30_function,
    (SELECT global_change FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D30' AND f.status = 'completed' LIMIT 1) as d30_global_change,
    EXISTS(SELECT 1 FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed') as has_d90,
    (SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1) as d90_pain,
    (SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1) as d90_function,
    (SELECT global_change FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1) as d90_global_change,
    EXISTS(SELECT 1 FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D180' AND f.status = 'completed') as has_d180,
    (SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D180' AND f.status = 'completed' LIMIT 1) as d180_pain,
    (SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D180' AND f.status = 'completed' LIMIT 1) as d180_function,
    0 as d180_function_dummy,
    EXISTS(SELECT 1 FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D365' AND f.status = 'completed') as has_d365,
    (SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D365' AND f.status = 'completed' LIMIT 1) as d365_pain,
    (SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D365' AND f.status = 'completed' LIMIT 1) as d365_function,
    EXISTS(SELECT 1 FROM procedure_followups f WHERE f.screening_id = s.id AND f.adverse_event = true) as adverse_event_any,
    (SELECT COUNT(*) FROM procedure_followups f WHERE f.screening_id = s.id AND f.status = 'missed') as missed_count,
    (s.questionnaire_responses->>'procedure_type')::text as procedure_type,
    (s.questionnaire_responses->>'tissue_type')::text as tissue_type,
    s.clinical_diagnosis as diagnosis,
    CASE
        WHEN NOT EXISTS(SELECT 1 FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed') THEN 'INCONCLUSIVE'
        WHEN (s.questionnaire_responses->>'baseline_pain_nrs')::numeric IS NULL THEN 'INCONCLUSIVE'
        WHEN (SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1) IS NULL THEN 'INCONCLUSIVE'
        WHEN ((s.questionnaire_responses->>'baseline_pain_nrs')::numeric - COALESCE((SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 4 THEN 'ROBUST_RESPONDER'
        WHEN ((s.questionnaire_responses->>'baseline_function_score')::numeric - COALESCE((SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 30 THEN 'ROBUST_RESPONDER'
        WHEN ((s.questionnaire_responses->>'baseline_pain_nrs')::numeric - COALESCE((SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 2 THEN 'MODERATE_RESPONDER'
        WHEN ((s.questionnaire_responses->>'baseline_function_score')::numeric - COALESCE((SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 20 THEN 'MODERATE_RESPONDER'
        ELSE 'NON_RESPONDER'
    END as responder_status,
    CASE
        WHEN NOT EXISTS(SELECT 1 FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed') THEN 'NO_D90'
        WHEN (s.questionnaire_responses->>'baseline_pain_nrs')::numeric IS NULL THEN 'MISSING_BASELINE_PAIN'
        WHEN (s.questionnaire_responses->>'baseline_function_score')::numeric IS NULL THEN 'MISSING_BASELINE_FUNCTION'
        WHEN ((s.questionnaire_responses->>'baseline_pain_nrs')::numeric - COALESCE((SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 4 THEN 'ROBUST_PAIN_D90'
        WHEN ((s.questionnaire_responses->>'baseline_function_score')::numeric - COALESCE((SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 30 THEN 'ROBUST_FUNCTION_D90'
        WHEN ((s.questionnaire_responses->>'baseline_pain_nrs')::numeric - COALESCE((SELECT pain_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 2 THEN 'MODERATE_PAIN_D90'
        WHEN ((s.questionnaire_responses->>'baseline_function_score')::numeric - COALESCE((SELECT function_score FROM procedure_followups f WHERE f.screening_id = s.id AND f.timepoint = 'D90' AND f.status = 'completed' LIMIT 1), 0)) >= 20 THEN 'MODERATE_FUNCTION_D90'
        ELSE 'INSUFFICIENT_DATA'
    END as responder_reason_code,
    s.classification
FROM prp_screenings s
JOIN patients p ON s.patient_id = p.id;

GRANT SELECT ON public.registry_case_summary_v1_1 TO authenticated;

-- 2. TREATMENT_SESSIONS - Strengthen RLS
DROP POLICY IF EXISTS "Healthcare professionals can view treatment sessions" ON public.treatment_sessions;
DROP POLICY IF EXISTS "Healthcare professionals can insert treatment sessions" ON public.treatment_sessions;
DROP POLICY IF EXISTS "Healthcare professionals can update treatment sessions" ON public.treatment_sessions;
DROP POLICY IF EXISTS "Only admins can delete treatment sessions" ON public.treatment_sessions;

CREATE POLICY "Professionals can view own patient treatment sessions"
ON public.treatment_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = treatment_sessions.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can insert own patient treatment sessions"
ON public.treatment_sessions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = treatment_sessions.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can update own patient treatment sessions"
ON public.treatment_sessions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = treatment_sessions.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Only admins can delete treatment sessions"
ON public.treatment_sessions FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. ULTRASOUND_IMAGES - Strengthen RLS
DROP POLICY IF EXISTS "Healthcare professionals can view ultrasound images" ON public.ultrasound_images;
DROP POLICY IF EXISTS "Healthcare professionals can insert ultrasound images" ON public.ultrasound_images;
DROP POLICY IF EXISTS "Healthcare professionals can update ultrasound images" ON public.ultrasound_images;
DROP POLICY IF EXISTS "Only admins can delete ultrasound images" ON public.ultrasound_images;

CREATE POLICY "Professionals can view own patient ultrasound images"
ON public.ultrasound_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = ultrasound_images.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can insert own patient ultrasound images"
ON public.ultrasound_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = ultrasound_images.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can update own patient ultrasound images"
ON public.ultrasound_images FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = ultrasound_images.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Only admins can delete ultrasound images"
ON public.ultrasound_images FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 4. THERMOGRAPHY_IMAGES - Strengthen RLS
DROP POLICY IF EXISTS "Healthcare professionals can view thermography images" ON public.thermography_images;
DROP POLICY IF EXISTS "Healthcare professionals can insert thermography images" ON public.thermography_images;
DROP POLICY IF EXISTS "Healthcare professionals can update thermography images" ON public.thermography_images;
DROP POLICY IF EXISTS "Only admins can delete thermography images" ON public.thermography_images;

CREATE POLICY "Professionals can view own patient thermography images"
ON public.thermography_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = thermography_images.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can insert own patient thermography images"
ON public.thermography_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = thermography_images.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can update own patient thermography images"
ON public.thermography_images FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = thermography_images.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Only admins can delete thermography images"
ON public.thermography_images FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 5. SESSION_IMAGES - Strengthen RLS via treatment_sessions
DROP POLICY IF EXISTS "Healthcare professionals can view session images" ON public.session_images;
DROP POLICY IF EXISTS "Healthcare professionals can insert session images" ON public.session_images;
DROP POLICY IF EXISTS "Healthcare professionals can update session images" ON public.session_images;
DROP POLICY IF EXISTS "Only admins can delete session images" ON public.session_images;

CREATE POLICY "Professionals can view own patient session images"
ON public.session_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM treatment_sessions ts
        JOIN patients p ON p.id = ts.patient_id
        WHERE ts.id = session_images.session_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can insert own patient session images"
ON public.session_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM treatment_sessions ts
        JOIN patients p ON p.id = ts.patient_id
        WHERE ts.id = session_images.session_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can update own patient session images"
ON public.session_images FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM treatment_sessions ts
        JOIN patients p ON p.id = ts.patient_id
        WHERE ts.id = session_images.session_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Only admins can delete session images"
ON public.session_images FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 6. PATIENT_CONSENTS - Add audit and immutability
DROP POLICY IF EXISTS "Healthcare professionals can update patient consents" ON public.patient_consents;
DROP POLICY IF EXISTS "Healthcare professionals can view patient consents" ON public.patient_consents;
DROP POLICY IF EXISTS "Healthcare professionals can insert patient consents" ON public.patient_consents;

CREATE POLICY "Professionals can view own patient consents"
ON public.patient_consents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = patient_consents.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can insert own patient consents"
ON public.patient_consents FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = patient_consents.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can update non-accepted consents only"
ON public.patient_consents FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = patient_consents.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
    AND (accepted = false OR has_role(auth.uid(), 'admin'))
);

-- Audit trigger for consent changes
CREATE OR REPLACE FUNCTION public.audit_consent_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        additional_info
    ) VALUES (
        auth.uid(),
        TG_OP,
        'patient_consents',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        jsonb_build_object('timestamp', now(), 'operation', TG_OP)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS consent_audit_trigger ON public.patient_consents;
CREATE TRIGGER consent_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.patient_consents
FOR EACH ROW EXECUTE FUNCTION public.audit_consent_changes();

-- 7. REGISTRY_EPISODES - Strengthen RLS
DROP POLICY IF EXISTS "Clinicians can manage episodes" ON public.registry_episodes;
DROP POLICY IF EXISTS "Admins can view episodes" ON public.registry_episodes;

CREATE POLICY "Clinicians can view own patient episodes"
ON public.registry_episodes FOR SELECT
USING (clinician_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Clinicians can insert own patient episodes"
ON public.registry_episodes FOR INSERT
WITH CHECK (clinician_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Clinicians can update own patient episodes"
ON public.registry_episodes FOR UPDATE
USING (clinician_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete episodes"
ON public.registry_episodes FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 8. USER_PROFILES - Strict own-profile access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view only their own profile"
ON public.user_profiles FOR SELECT
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert only their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update only their own profile"
ON public.user_profiles FOR UPDATE
USING (id = auth.uid());

-- 9. PRP_LAB_RESULTS - Strengthen RLS via screening->patient
DROP POLICY IF EXISTS "Healthcare professionals can view prp lab results" ON public.prp_lab_results;
DROP POLICY IF EXISTS "Healthcare professionals can insert prp lab results" ON public.prp_lab_results;
DROP POLICY IF EXISTS "Healthcare professionals can update prp lab results" ON public.prp_lab_results;

CREATE POLICY "Professionals can view own patient lab results"
ON public.prp_lab_results FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM prp_screenings s
        JOIN patients p ON p.id = s.patient_id
        WHERE s.id = prp_lab_results.screening_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can insert own patient lab results"
ON public.prp_lab_results FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM prp_screenings s
        JOIN patients p ON p.id = s.patient_id
        WHERE s.id = prp_lab_results.screening_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can update own patient lab results"
ON public.prp_lab_results FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM prp_screenings s
        JOIN patients p ON p.id = s.patient_id
        WHERE s.id = prp_lab_results.screening_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

-- 10. PATIENT_DOCUMENTS - Strengthen RLS
DROP POLICY IF EXISTS "Healthcare professionals can view patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Healthcare professionals can insert patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Healthcare professionals can update patient documents" ON public.patient_documents;

CREATE POLICY "Professionals can view own patient documents"
ON public.patient_documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = patient_documents.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can insert own patient documents"
ON public.patient_documents FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = patient_documents.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Professionals can update own patient documents"
ON public.patient_documents FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM patients p 
        WHERE p.id = patient_documents.patient_id 
        AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
);
