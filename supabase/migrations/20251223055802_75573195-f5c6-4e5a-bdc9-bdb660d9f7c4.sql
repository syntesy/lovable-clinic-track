-- 1. Restringir inserts em audit_logs para profissionais de saúde apenas
DROP POLICY IF EXISTS "Inserts audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Healthcare professionals can insert audit logs" ON public.audit_logs;

CREATE POLICY "Healthcare professionals can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_healthcare_professional(auth.uid()));

-- 2. Remover UPDATE de clinical_record_versions (deve ser imutável - insert-only)
DROP POLICY IF EXISTS "Healthcare professionals can update clinical record versions" ON public.clinical_record_versions;

-- 3. Restringir reference_protocols para apenas admins poderem modificar
DROP POLICY IF EXISTS "Authenticated users can view reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Authenticated users can insert reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Authenticated users can update reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Authenticated users can delete reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Allow all authenticated users to read reference protocols" ON public.reference_protocols;
DROP POLICY IF EXISTS "Allow all authenticated users to modify reference protocols" ON public.reference_protocols;

-- Reference protocols - todos podem ler
CREATE POLICY "All users can read reference protocols"
ON public.reference_protocols
FOR SELECT
TO authenticated
USING (true);

-- Reference protocols - apenas admins podem inserir
CREATE POLICY "Admins can insert reference protocols"
ON public.reference_protocols
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reference protocols - apenas admins podem atualizar
CREATE POLICY "Admins can update reference protocols"
ON public.reference_protocols
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Reference protocols - apenas admins podem deletar
CREATE POLICY "Admins can delete reference protocols"
ON public.reference_protocols
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));