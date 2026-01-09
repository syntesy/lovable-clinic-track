
-- Remove old permissive policies that weren't dropped properly

-- curation_jobs
DROP POLICY IF EXISTS "Authenticated users can insert curation jobs" ON public.curation_jobs;

-- partner_events  
DROP POLICY IF EXISTS "Anyone can insert partner events" ON public.partner_events;

-- patient_events
DROP POLICY IF EXISTS "Anyone can insert patient events" ON public.patient_events;

-- registry_consent_logs
DROP POLICY IF EXISTS "System can insert consent logs" ON public.registry_consent_logs;
