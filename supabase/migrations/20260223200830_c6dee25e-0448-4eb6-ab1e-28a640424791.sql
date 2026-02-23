
-- Fix overly permissive INSERT policy on audit log — restrict to authenticated users
DROP POLICY IF EXISTS "service_insert_audit_log" ON public.academy_audit_log;
CREATE POLICY "authenticated_insert_audit_log" ON public.academy_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
