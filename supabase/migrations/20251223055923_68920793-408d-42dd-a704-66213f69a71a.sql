-- Drop as policies antigas de reference_protocols que ainda existem
DROP POLICY IF EXISTS "Authenticated users can delete reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Authenticated users can insert reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Authenticated users can update reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Authenticated users can view reference protocols" ON public.reference_protocols;

-- Drop policy antiga de audit_logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;