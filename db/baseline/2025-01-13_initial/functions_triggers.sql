-- =====================================================
-- REGHEN FUNCTIONS & TRIGGERS - BASELINE EXPORT
-- Generated: 2025-01-13
-- Environment: Production (Lovable Cloud / Supabase)
-- Project ID: oedlipwpqkvhreqipoji
-- =====================================================


-- =====================================================
-- SECURITY HELPER FUNCTIONS
-- =====================================================

-- Function: has_role
-- Purpose: Check if a user has a specific role (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function: is_healthcare_professional
-- Purpose: Check if a user is a healthcare professional (admin or professional role)
CREATE OR REPLACE FUNCTION public.is_healthcare_professional(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'professional')
  )
$$;

-- Function: can_access_research_export
-- Purpose: Check if a user can access research export data
CREATE OR REPLACE FUNCTION public.can_access_research_export()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'research')
  );
END;
$$;


-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function: handle_new_user
-- Purpose: Create user profile when new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Function: assign_default_role
-- Purpose: Assign default 'professional' role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professional')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function: handle_new_user_subscription
-- Purpose: Create default subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, current_plan, status, next_renewal_date)
  VALUES (NEW.id, 'basic', 'active', NOW() + INTERVAL '30 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- =====================================================
-- SESSION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function: enforce_session_limit
-- Purpose: Limit active sessions per user (max 3)
CREATE OR REPLACE FUNCTION public.enforce_session_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    session_count INTEGER;
    oldest_session_id UUID;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM public.user_sessions
    WHERE user_id = NEW.user_id AND is_active = true;
    
    IF session_count >= 3 THEN
        SELECT id INTO oldest_session_id
        FROM public.user_sessions
        WHERE user_id = NEW.user_id AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
        
        UPDATE public.user_sessions
        SET is_active = false
        WHERE id = oldest_session_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function: cleanup_expired_sessions
-- Purpose: Remove expired or inactive sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.user_sessions
        WHERE expires_at < NOW() OR is_active = false
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$;


-- =====================================================
-- PATIENT MANAGEMENT FUNCTIONS
-- =====================================================

-- Function: set_patient_professional_id
-- Purpose: Automatically set professional_id from auth.uid()
CREATE OR REPLACE FUNCTION public.set_patient_professional_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.professional_id IS NULL THEN
    NEW.professional_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Function: check_patient_limit
-- Purpose: Check if professional can add more patients based on subscription
CREATE OR REPLACE FUNCTION public.check_patient_limit(user_id uuid)
RETURNS TABLE(current_plan text, active_patients integer, max_patients integer, can_add_patient boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_plan TEXT;
    v_count INTEGER;
    v_max INTEGER;
BEGIN
    SELECT s.current_plan INTO v_plan
    FROM public.subscriptions s
    WHERE s.user_id = check_patient_limit.user_id;
    
    IF v_plan IS NULL THEN
        v_plan := 'basic';
    END IF;
    
    SELECT COUNT(*) INTO v_count
    FROM public.patient_portal_access ppa
    WHERE ppa.professional_id = check_patient_limit.user_id
    AND ppa.is_active = true;
    
    CASE v_plan
        WHEN 'basic' THEN v_max := 0;
        WHEN 'premium' THEN v_max := 100;
        WHEN 'pro' THEN v_max := -1; -- ilimitado
        ELSE v_max := 0;
    END CASE;
    
    current_plan := v_plan;
    active_patients := v_count;
    max_patients := v_max;
    can_add_patient := (v_max = -1) OR (v_count < v_max);
    
    RETURN NEXT;
END;
$$;

-- Function: authenticate_patient
-- Purpose: Authenticate patient by surname and CPF
CREATE OR REPLACE FUNCTION public.authenticate_patient(p_surname text, p_cpf text)
RETURNS TABLE(patient_id uuid, patient_name text, professional_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cpf text;
  v_surname text;
BEGIN
  v_cpf := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_surname := lower(trim(coalesce(p_surname, '')));

  IF length(v_cpf) <> 11 OR v_surname = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ppa.patient_id,
    p.full_name as patient_name,
    ppa.professional_id
  FROM public.patient_portal_access ppa
  JOIN public.patients p ON p.id = ppa.patient_id
  WHERE coalesce(ppa.is_active, true) = true
    AND regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = v_cpf
    AND (
      lower(coalesce(ppa.login_surname, '')) = v_surname
      OR lower(p.full_name) LIKE '%' || v_surname || '%'
    )
  LIMIT 1;

  UPDATE public.patient_portal_access ppa
  SET last_login_at = now()
  FROM public.patients p
  WHERE p.id = ppa.patient_id
    AND coalesce(ppa.is_active, true) = true
    AND regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = v_cpf
    AND (
      lower(coalesce(ppa.login_surname, '')) = v_surname
      OR lower(p.full_name) LIKE '%' || v_surname || '%'
    );
END;
$$;


-- =====================================================
-- FOLLOWUP MANAGEMENT FUNCTIONS
-- =====================================================

-- Function: create_followups_for_screening
-- Purpose: Create follow-up entries for a screening
CREATE OR REPLACE FUNCTION public.create_followups_for_screening(
    p_screening_id uuid, 
    p_patient_id uuid, 
    p_clinician_id uuid, 
    p_procedure_date date DEFAULT CURRENT_DATE
)
RETURNS SETOF procedure_followups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_timepoints TEXT[] := ARRAY['D7', 'D30', 'D90', 'D180', 'D365'];
  v_days INTEGER[] := ARRAY[7, 30, 90, 180, 365];
  v_i INTEGER;
BEGIN
  FOR v_i IN 1..array_length(v_timepoints, 1) LOOP
    INSERT INTO public.procedure_followups (
      screening_id,
      patient_id,
      clinician_id,
      timepoint,
      scheduled_for,
      status
    ) VALUES (
      p_screening_id,
      p_patient_id,
      p_clinician_id,
      v_timepoints[v_i],
      p_procedure_date + v_days[v_i],
      'pending'
    )
    ON CONFLICT (screening_id, timepoint) DO NOTHING;
  END LOOP;
  
  RETURN QUERY SELECT * FROM public.procedure_followups WHERE screening_id = p_screening_id;
END;
$$;

-- Function: mark_missed_followups
-- Purpose: Mark follow-ups as missed if past due
CREATE OR REPLACE FUNCTION public.mark_missed_followups()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.procedure_followups
    SET status = 'missed', updated_at = now()
    WHERE status = 'pending'
      AND scheduled_for < CURRENT_DATE - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM updated;
  
  RETURN v_count;
END;
$$;

-- Function: auto_create_followups_on_procedure
-- Purpose: Trigger function to create follow-ups after procedure insert
CREATE OR REPLACE FUNCTION public.auto_create_followups_on_procedure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_screening_id UUID;
  v_timepoints TEXT[] := ARRAY['D30', 'D90', 'D180', 'D365'];
  v_days INTEGER[] := ARRAY[30, 90, 180, 365];
  v_i INTEGER;
BEGIN
  SELECT id INTO v_screening_id
  FROM public.prp_screenings
  WHERE patient_id = NEW.patient_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_screening_id IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_i IN 1..array_length(v_timepoints, 1) LOOP
    INSERT INTO public.procedure_followups (
      screening_id,
      patient_id,
      clinician_id,
      timepoint,
      scheduled_for,
      status
    ) VALUES (
      v_screening_id,
      NEW.patient_id,
      COALESCE(NEW.created_by, auth.uid()),
      v_timepoints[v_i],
      NEW.procedure_date + v_days[v_i],
      'pending'
    )
    ON CONFLICT (screening_id, timepoint) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;


-- =====================================================
-- TIMESTAMP MANAGEMENT FUNCTIONS
-- =====================================================

-- Function: update_updated_at_column
-- Purpose: Generic function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: update_registry_episode_updated_at
-- Purpose: Update updated_at for registry episodes
CREATE OR REPLACE FUNCTION public.update_registry_episode_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: career_update_updated_at
-- Purpose: Update updated_at for career tables
CREATE OR REPLACE FUNCTION public.career_update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- =====================================================
-- CONSENT & AUDIT FUNCTIONS
-- =====================================================

-- Function: audit_consent_changes
-- Purpose: Log consent changes to audit_logs
CREATE OR REPLACE FUNCTION public.audit_consent_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Function: log_consent_change
-- Purpose: Log consent status changes for registry episodes
CREATE OR REPLACE FUNCTION public.log_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.registry_consent_status IS DISTINCT FROM NEW.registry_consent_status THEN
    INSERT INTO public.registry_consent_logs (episode_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.registry_consent_status, NEW.registry_consent_status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Function: log_audit_action
-- Purpose: Helper to log audit actions
CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_action text, 
    p_table_name text DEFAULT NULL::text, 
    p_record_id uuid DEFAULT NULL::uuid, 
    p_old_data jsonb DEFAULT NULL::jsonb, 
    p_new_data jsonb DEFAULT NULL::jsonb, 
    p_additional_info jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_log_id UUID;
    v_user_email TEXT;
BEGIN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        additional_info
    ) VALUES (
        auth.uid(),
        v_user_email,
        p_action,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_additional_info
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;


-- =====================================================
-- REGISTRY CONSENT & SNAPSHOT FUNCTIONS
-- =====================================================

-- Function: update_snapshots_eligibility
-- Purpose: Update snapshot eligibility when consent is given
CREATE OR REPLACE FUNCTION public.update_snapshots_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.consent_given = true AND OLD.consent_given = false THEN
    UPDATE public.registry_snapshots
    SET is_eligible = true
    WHERE patient_id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$;


-- =====================================================
-- IMMUTABILITY & PROTECTION FUNCTIONS
-- =====================================================

-- Function: prevent_update_immutable
-- Purpose: Prevent updates to immutable records
CREATE OR REPLACE FUNCTION public.prevent_update_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.immutable = true THEN
    RAISE EXCEPTION 'Cannot update immutable record';
  END IF;
  RETURN NEW;
END;
$$;

-- Function: prevent_delete_diligence
-- Purpose: Prevent deletion of diligence records
CREATE OR REPLACE FUNCTION public.prevent_delete_diligence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'Cannot delete diligence records';
END;
$$;

-- Function: prevent_export_log_update
-- Purpose: Prevent updates to export logs (append-only)
CREATE OR REPLACE FUNCTION public.prevent_export_log_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'registry_exports_log is append-only. UPDATE not allowed.';
END;
$$;

-- Function: prevent_export_log_delete
-- Purpose: Prevent deletion of export logs (append-only)
CREATE OR REPLACE FUNCTION public.prevent_export_log_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'registry_exports_log is append-only. DELETE not allowed.';
END;
$$;

-- Function: prevent_snapshot_delete
-- Purpose: Prevent deletion of research export snapshots
CREATE OR REPLACE FUNCTION public.prevent_snapshot_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'research_export_snapshots is immutable. DELETE not allowed.';
END;
$$;


-- =====================================================
-- RESEARCH & PSEUDONYMIZATION FUNCTIONS
-- =====================================================

-- Function: pseudonymize_id
-- Purpose: Create pseudonymized ID for research export
CREATE OR REPLACE FUNCTION public.pseudonymize_id(original_id uuid, salt text DEFAULT 'regen_research_v1'::text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN SUBSTR(
    ENCODE(
      SHA256((original_id::TEXT || salt)::BYTEA),
      'hex'
    ),
    1, 16
  );
END;
$$;

-- Function: generate_case_uid
-- Purpose: Generate pseudonymized case UID for research
CREATE OR REPLACE FUNCTION public.generate_case_uid(p_case_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_salt text;
BEGIN
  SELECT value INTO v_salt
  FROM public.research_config
  WHERE key = 'pseudonymization_salt';
  
  IF v_salt IS NULL THEN
    RAISE EXCEPTION 'Salt de pseudonimização não configurado';
  END IF;
  
  RETURN encode(
    sha256(('case:' || p_case_id::text || ':' || v_salt)::bytea),
    'hex'
  );
END;
$$;

-- Function: generate_procedure_uid
-- Purpose: Generate pseudonymized procedure UID for research
CREATE OR REPLACE FUNCTION public.generate_procedure_uid(p_procedure_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_salt text;
BEGIN
  SELECT value INTO v_salt
  FROM public.research_config
  WHERE key = 'pseudonymization_salt';
  
  IF v_salt IS NULL THEN
    RAISE EXCEPTION 'Salt de pseudonimização não configurado';
  END IF;
  
  RETURN encode(
    sha256(('procedure:' || p_procedure_id::text || ':' || v_salt)::bytea),
    'hex'
  );
END;
$$;

-- Function: generate_clinician_uid
-- Purpose: Generate pseudonymized clinician UID for research
CREATE OR REPLACE FUNCTION public.generate_clinician_uid(p_clinician_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_salt text;
BEGIN
  SELECT value INTO v_salt
  FROM public.research_config
  WHERE key = 'pseudonymization_salt';
  
  IF v_salt IS NULL THEN
    RAISE EXCEPTION 'Salt de pseudonimização não configurado';
  END IF;
  
  RETURN encode(
    sha256(('clinician:' || p_clinician_id::text || ':' || v_salt)::bytea),
    'hex'
  );
END;
$$;

-- Function: generate_snapshot_code
-- Purpose: Generate unique code for research export snapshots
CREATE OR REPLACE FUNCTION public.generate_snapshot_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_year text;
  v_seq integer;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(snapshot_code, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM public.research_export_snapshots
  WHERE snapshot_code LIKE 'REGEN-' || v_year || '-%';
  
  RETURN 'REGEN-' || v_year || '-' || LPAD(v_seq::text, 3, '0');
END;
$$;


-- =====================================================
-- EVIDENCE ENGINE FUNCTIONS
-- =====================================================

-- Function: normalize_evidence_tag
-- Purpose: Normalize evidence tags for consistency
CREATE OR REPLACE FUNCTION public.normalize_evidence_tag(tag text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN UPPER(TRIM(COALESCE(tag, '')));
END;
$$;

-- Function: get_next_snapshot_version
-- Purpose: Get next version number for evidence snapshots
CREATE OR REPLACE FUNCTION public.get_next_snapshot_version(p_dimension_id uuid, p_time_window text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO v_max_version
  FROM public.evidence_snapshots
  WHERE dimension_id = p_dimension_id AND time_window = p_time_window;
  
  RETURN v_max_version + 1;
END;
$$;


-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function: generate_integrity_hash
-- Purpose: Generate SHA256 hash for data integrity
CREATE OR REPLACE FUNCTION public.generate_integrity_hash(data jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN encode(sha256(data::text::bytea), 'hex');
END;
$$;


-- =====================================================
-- TRIGGERS
-- =====================================================

-- Note: Triggers are typically created via migrations
-- The following triggers are referenced in the functions above:

-- Trigger: trigger_auto_create_followups
-- ON public.patient_procedures AFTER INSERT
-- EXECUTE FUNCTION auto_create_followups_on_procedure();

-- Trigger: trigger_enforce_session_limit
-- ON public.user_sessions BEFORE INSERT
-- EXECUTE FUNCTION enforce_session_limit();

-- Trigger: trigger_log_consent_change
-- ON public.registry_episodes AFTER UPDATE
-- EXECUTE FUNCTION log_consent_change();

-- Trigger: trigger_audit_consent_changes
-- ON public.patient_consents AFTER INSERT OR UPDATE OR DELETE
-- EXECUTE FUNCTION audit_consent_changes();

-- Trigger: trigger_update_snapshots_eligibility
-- ON public.registry_consents AFTER UPDATE
-- EXECUTE FUNCTION update_snapshots_eligibility();

-- Various updated_at triggers on tables...

-- =====================================================
-- FUNCTION + TRIGGER: prevent_final_record_update
-- Source: supabase/migrations/20260113150851_ccded645-e868-4f85-a671-af2c8df43490.sql
-- Blocks UPDATE on clinical_records when status is already 'final'.
-- Allows draft → final transition; blocks final → any.
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_final_record_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'final' THEN
    RAISE EXCEPTION 'Prontuário finalizado não pode ser editado. Status atual: final';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_final_record_update() IS
'Bloqueia edição de prontuários finalizados (status=final). Permite transição draft→final.';

DROP TRIGGER IF EXISTS prevent_final_record_update_trigger ON public.clinical_records;

CREATE TRIGGER prevent_final_record_update_trigger
BEFORE UPDATE ON public.clinical_records
FOR EACH ROW
EXECUTE FUNCTION public.prevent_final_record_update();


-- =====================================================
-- END OF FUNCTIONS & TRIGGERS
-- =====================================================
