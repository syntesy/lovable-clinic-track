
-- =====================================================
-- FIX RLS POLICIES - Proteção de Dados Sensíveis
-- =====================================================

-- 1. PRP_SCREENINGS TABLE - Via patient_id -> patients.professional_id
DROP POLICY IF EXISTS "Clinicians can view own screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Clinicians can insert own screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Clinicians can update own screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Clinicians can delete own screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Users can view own screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Users can insert own screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Users can update own screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Users can delete own screenings" ON public.prp_screenings;

CREATE POLICY "Professionals can view screenings for own patients"
ON public.prp_screenings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = prp_screenings.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert screenings for own patients"
ON public.prp_screenings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = prp_screenings.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update screenings for own patients"
ON public.prp_screenings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = prp_screenings.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can delete screenings for own patients"
ON public.prp_screenings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = prp_screenings.patient_id
    AND p.professional_id = auth.uid()
  )
);

-- 2. CLINICAL_RECORDS TABLE - Prontuários médicos
DROP POLICY IF EXISTS "Professionals can view own patients clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Professionals can insert clinical records for own patients" ON public.clinical_records;
DROP POLICY IF EXISTS "Professionals can update clinical records for own patients" ON public.clinical_records;
DROP POLICY IF EXISTS "Users can view clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Users can insert clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Users can update clinical records" ON public.clinical_records;

CREATE POLICY "Professionals can view own patients clinical records"
ON public.clinical_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = clinical_records.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert clinical records for own patients"
ON public.clinical_records FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = clinical_records.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update clinical records for own patients"
ON public.clinical_records FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = clinical_records.patient_id
    AND p.professional_id = auth.uid()
  )
);

-- 3. PATIENT_PROCEDURES TABLE
DROP POLICY IF EXISTS "Professionals can view own patients procedures" ON public.patient_procedures;
DROP POLICY IF EXISTS "Professionals can insert procedures for own patients" ON public.patient_procedures;
DROP POLICY IF EXISTS "Professionals can update procedures for own patients" ON public.patient_procedures;
DROP POLICY IF EXISTS "Users can view procedures" ON public.patient_procedures;
DROP POLICY IF EXISTS "Users can insert procedures" ON public.patient_procedures;
DROP POLICY IF EXISTS "Users can update procedures" ON public.patient_procedures;

CREATE POLICY "Professionals can view own patients procedures"
ON public.patient_procedures FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_procedures.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert procedures for own patients"
ON public.patient_procedures FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_procedures.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update procedures for own patients"
ON public.patient_procedures FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_procedures.patient_id
    AND p.professional_id = auth.uid()
  )
);

-- 4. BLOOD_TESTS TABLE
DROP POLICY IF EXISTS "Professionals can view own patients blood tests" ON public.blood_tests;
DROP POLICY IF EXISTS "Professionals can insert blood tests for own patients" ON public.blood_tests;
DROP POLICY IF EXISTS "Professionals can update blood tests for own patients" ON public.blood_tests;
DROP POLICY IF EXISTS "Professionals can delete blood tests for own patients" ON public.blood_tests;
DROP POLICY IF EXISTS "Users can view blood tests" ON public.blood_tests;
DROP POLICY IF EXISTS "Users can insert blood tests" ON public.blood_tests;

CREATE POLICY "Professionals can view own patients blood tests"
ON public.blood_tests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = blood_tests.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert blood tests for own patients"
ON public.blood_tests FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = blood_tests.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update blood tests for own patients"
ON public.blood_tests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = blood_tests.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can delete blood tests for own patients"
ON public.blood_tests FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = blood_tests.patient_id
    AND p.professional_id = auth.uid()
  )
);

-- 5. PATIENT_CONSENTS TABLE
DROP POLICY IF EXISTS "Professionals can view own patients consents" ON public.patient_consents;
DROP POLICY IF EXISTS "Professionals can insert consents for own patients" ON public.patient_consents;
DROP POLICY IF EXISTS "Professionals can update consents for own patients" ON public.patient_consents;
DROP POLICY IF EXISTS "Users can view consents" ON public.patient_consents;
DROP POLICY IF EXISTS "Users can insert consents" ON public.patient_consents;

CREATE POLICY "Professionals can view own patients consents"
ON public.patient_consents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_consents.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert consents for own patients"
ON public.patient_consents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_consents.patient_id
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update consents for own patients"
ON public.patient_consents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_consents.patient_id
    AND p.professional_id = auth.uid()
  )
);

-- 6. PROCEDURE_FOLLOWUPS TABLE - Has clinician_id
DROP POLICY IF EXISTS "Clinicians can view own followups" ON public.procedure_followups;
DROP POLICY IF EXISTS "Clinicians can insert own followups" ON public.procedure_followups;
DROP POLICY IF EXISTS "Clinicians can update own followups" ON public.procedure_followups;

CREATE POLICY "Clinicians can view own followups"
ON public.procedure_followups FOR SELECT
TO authenticated
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can insert own followups"
ON public.procedure_followups FOR INSERT
TO authenticated
WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own followups"
ON public.procedure_followups FOR UPDATE
TO authenticated
USING (clinician_id = auth.uid());

-- 7. USER_ROLES TABLE - Apenas admin pode gerenciar roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. SUBSCRIPTIONS TABLE
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 9. USER_PROFILES TABLE
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 10. AUDIT_LOGS TABLE - Apenas admins podem ver todos, usuários veem os próprios
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
