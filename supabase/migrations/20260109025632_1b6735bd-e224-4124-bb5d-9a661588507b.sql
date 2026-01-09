
-- Fix remaining INSERT policies

-- 1. partner_events - has user_id column
DROP POLICY IF EXISTS "Authenticated users can insert partner events" ON public.partner_events;

CREATE POLICY "Authenticated users can insert partner events"
ON public.partner_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 2. patient_events - uses professional_id not user_id
DROP POLICY IF EXISTS "Authenticated users can insert patient events" ON public.patient_events;

CREATE POLICY "Professionals can insert patient events"
ON public.patient_events FOR INSERT
TO authenticated
WITH CHECK (professional_id = auth.uid() OR professional_id IS NULL);

-- 3. registry_consent_logs - has changed_by column
DROP POLICY IF EXISTS "Consent logs inserted via trigger" ON public.registry_consent_logs;

CREATE POLICY "Consent logs inserted via trigger"
ON public.registry_consent_logs FOR INSERT
TO authenticated
WITH CHECK (changed_by = auth.uid());
