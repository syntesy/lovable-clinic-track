
-- Fix curation_jobs UPDATE policy - should be admin only
DROP POLICY IF EXISTS "Service role can update curation jobs" ON public.curation_jobs;

CREATE POLICY "Admins can update curation jobs"
ON public.curation_jobs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
