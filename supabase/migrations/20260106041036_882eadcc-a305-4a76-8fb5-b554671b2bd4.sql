-- ============================================================
-- REGENAPP Education / Academy
-- Migração 002: Funções Helper + Triggers Paranoicos
-- REGRA: Tudo no schema edu.* | Sem RLS/policies | Sem UI
-- ============================================================

-- ============================================================
-- 1) FUNÇÕES HELPER (SECURITY DEFINER + SEARCH_PATH TRAVADO)
-- ============================================================

-- 1.1) edu.is_member - verifica membership ativo
CREATE OR REPLACE FUNCTION edu.is_member(p_institution_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND status = 'active'
  )
$$;

-- 1.2) edu.has_role - verifica role específico
CREATE OR REPLACE FUNCTION edu.has_role(p_institution_id uuid, p_user_id uuid, p_role edu.institution_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND role = p_role
      AND status = 'active'
  )
$$;

-- 1.3) edu.has_any_role - verifica se possui algum dos roles
CREATE OR REPLACE FUNCTION edu.has_any_role(p_institution_id uuid, p_user_id uuid, p_roles edu.institution_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND role = ANY(p_roles)
      AND status = 'active'
  )
$$;

-- 1.4) edu.is_enrolled - verifica enrollment ativo
CREATE OR REPLACE FUNCTION edu.is_enrolled(p_institution_id uuid, p_cohort_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.enrollments
    WHERE institution_id = p_institution_id
      AND cohort_id = p_cohort_id
      AND user_id = p_user_id
      AND status = 'active'
  )
$$;

-- ============================================================
-- 2) FUNÇÃO GENÉRICA PARA updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION edu.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3) TRIGGERS DE CONSISTÊNCIA DE institution_id
-- ============================================================

-- 3.1) Cohorts: institution_id deve bater com programs
CREATE OR REPLACE FUNCTION edu.trg_cohorts_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_prog_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_prog_inst_id
  FROM edu.programs WHERE id = NEW.program_id;
  
  IF v_prog_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: program_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_prog_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: cohort deve pertencer à mesma instituição que program';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cohorts_institution_check
BEFORE INSERT OR UPDATE ON edu.cohorts
FOR EACH ROW EXECUTE FUNCTION edu.trg_cohorts_institution_check();

-- 3.2) Modules: institution_id coerente com cohort
CREATE OR REPLACE FUNCTION edu.trg_modules_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_cohort_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_cohort_inst_id
  FROM edu.cohorts WHERE id = NEW.cohort_id;
  
  IF v_cohort_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: cohort_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_cohort_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: module deve pertencer à mesma instituição que cohort';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_modules_institution_check
BEFORE INSERT OR UPDATE ON edu.modules
FOR EACH ROW EXECUTE FUNCTION edu.trg_modules_institution_check();

-- 3.3) Enrollments: institution_id coerente com cohort
CREATE OR REPLACE FUNCTION edu.trg_enrollments_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_cohort_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_cohort_inst_id
  FROM edu.cohorts WHERE id = NEW.cohort_id;
  
  IF v_cohort_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: cohort_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_cohort_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: enrollment deve pertencer à mesma instituição que cohort';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enrollments_institution_check
BEFORE INSERT OR UPDATE ON edu.enrollments
FOR EACH ROW EXECUTE FUNCTION edu.trg_enrollments_institution_check();

-- 3.4) Cases: institution_id coerente com module
CREATE OR REPLACE FUNCTION edu.trg_cases_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_module_inst_id
  FROM edu.modules WHERE id = NEW.module_id;
  
  IF v_module_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: module_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_module_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: case deve pertencer à mesma instituição que module';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cases_institution_check
BEFORE INSERT OR UPDATE ON edu.cases
FOR EACH ROW EXECUTE FUNCTION edu.trg_cases_institution_check();

-- 3.5) Case children: case_versions
CREATE OR REPLACE FUNCTION edu.trg_case_versions_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_case_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_case_inst_id
  FROM edu.cases WHERE id = NEW.case_id;
  
  IF v_case_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: case_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_case_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: case_version deve pertencer à mesma instituição que case';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_case_versions_institution_check
BEFORE INSERT OR UPDATE ON edu.case_versions
FOR EACH ROW EXECUTE FUNCTION edu.trg_case_versions_institution_check();

-- 3.5b) Case children: case_assets
CREATE OR REPLACE FUNCTION edu.trg_case_assets_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_case_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_case_inst_id
  FROM edu.cases WHERE id = NEW.case_id;
  
  IF v_case_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: case_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_case_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: case_asset deve pertencer à mesma instituição que case';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_case_assets_institution_check
BEFORE INSERT OR UPDATE ON edu.case_assets
FOR EACH ROW EXECUTE FUNCTION edu.trg_case_assets_institution_check();

-- 3.5c) Case children: case_consents
CREATE OR REPLACE FUNCTION edu.trg_case_consents_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_case_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_case_inst_id
  FROM edu.cases WHERE id = NEW.case_id;
  
  IF v_case_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: case_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_case_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: case_consent deve pertencer à mesma instituição que case';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_case_consents_institution_check
BEFORE INSERT OR UPDATE ON edu.case_consents
FOR EACH ROW EXECUTE FUNCTION edu.trg_case_consents_institution_check();

-- 3.5d) Case children: case_instructor_notes
CREATE OR REPLACE FUNCTION edu.trg_case_instructor_notes_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_case_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_case_inst_id
  FROM edu.cases WHERE id = NEW.case_id;
  
  IF v_case_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: case_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_case_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: case_instructor_note deve pertencer à mesma instituição que case';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_case_instructor_notes_institution_check
BEFORE INSERT OR UPDATE ON edu.case_instructor_notes
FOR EACH ROW EXECUTE FUNCTION edu.trg_case_instructor_notes_institution_check();

-- 3.6) Learning objects: institution_id coerente com module
CREATE OR REPLACE FUNCTION edu.trg_learning_objects_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_module_inst_id
  FROM edu.modules WHERE id = NEW.module_id;
  
  IF v_module_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: module_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_module_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: learning_object deve pertencer à mesma instituição que module';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_learning_objects_institution_check
BEFORE INSERT OR UPDATE ON edu.learning_objects
FOR EACH ROW EXECUTE FUNCTION edu.trg_learning_objects_institution_check();

-- 3.6b) Learning links: institution_id coerente com learning_object
CREATE OR REPLACE FUNCTION edu.trg_learning_links_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_lo_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_lo_inst_id
  FROM edu.learning_objects WHERE id = NEW.learning_object_id;
  
  IF v_lo_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: learning_object_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_lo_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: learning_link deve pertencer à mesma instituição que learning_object';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_learning_links_institution_check
BEFORE INSERT OR UPDATE ON edu.learning_links
FOR EACH ROW EXECUTE FUNCTION edu.trg_learning_links_institution_check();

-- 3.7) Evidence links: validar module_id e case_id quando informados
CREATE OR REPLACE FUNCTION edu.trg_evidence_links_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_ref_inst_id uuid;
BEGIN
  -- Validar module_id se informado
  IF NEW.module_id IS NOT NULL THEN
    SELECT institution_id INTO v_ref_inst_id
    FROM edu.modules WHERE id = NEW.module_id;
    
    IF v_ref_inst_id IS NULL THEN
      RAISE EXCEPTION 'institution_id mismatch: module_id não encontrado';
    END IF;
    
    IF NEW.institution_id != v_ref_inst_id THEN
      RAISE EXCEPTION 'institution_id mismatch: evidence_link.module_id deve pertencer à mesma instituição';
    END IF;
  END IF;
  
  -- Validar case_id se informado
  IF NEW.case_id IS NOT NULL THEN
    SELECT institution_id INTO v_ref_inst_id
    FROM edu.cases WHERE id = NEW.case_id;
    
    IF v_ref_inst_id IS NULL THEN
      RAISE EXCEPTION 'institution_id mismatch: case_id não encontrado';
    END IF;
    
    IF NEW.institution_id != v_ref_inst_id THEN
      RAISE EXCEPTION 'institution_id mismatch: evidence_link.case_id deve pertencer à mesma instituição';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evidence_links_institution_check
BEFORE INSERT OR UPDATE ON edu.evidence_links
FOR EACH ROW EXECUTE FUNCTION edu.trg_evidence_links_institution_check();

-- 3.8) Decision scenarios: institution_id coerente com case
CREATE OR REPLACE FUNCTION edu.trg_decision_scenarios_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_case_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_case_inst_id
  FROM edu.cases WHERE id = NEW.case_id;
  
  IF v_case_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: case_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_case_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: decision_scenario deve pertencer à mesma instituição que case';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decision_scenarios_institution_check
BEFORE INSERT OR UPDATE ON edu.decision_scenarios
FOR EACH ROW EXECUTE FUNCTION edu.trg_decision_scenarios_institution_check();

-- 3.8b) Decision prompts: institution_id coerente com scenario
CREATE OR REPLACE FUNCTION edu.trg_decision_prompts_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_scenario_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_scenario_inst_id
  FROM edu.decision_scenarios WHERE id = NEW.scenario_id;
  
  IF v_scenario_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: scenario_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_scenario_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: decision_prompt deve pertencer à mesma instituição que scenario';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decision_prompts_institution_check
BEFORE INSERT OR UPDATE ON edu.decision_prompts
FOR EACH ROW EXECUTE FUNCTION edu.trg_decision_prompts_institution_check();

-- 3.8c) Decision attempts: institution_id coerente com scenario
CREATE OR REPLACE FUNCTION edu.trg_decision_attempts_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_scenario_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_scenario_inst_id
  FROM edu.decision_scenarios WHERE id = NEW.scenario_id;
  
  IF v_scenario_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: scenario_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_scenario_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: decision_attempt deve pertencer à mesma instituição que scenario';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decision_attempts_institution_check
BEFORE INSERT OR UPDATE ON edu.decision_attempts
FOR EACH ROW EXECUTE FUNCTION edu.trg_decision_attempts_institution_check();

-- 3.8d) Instructor reference: institution_id coerente com scenario
CREATE OR REPLACE FUNCTION edu.trg_instructor_reference_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_scenario_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_scenario_inst_id
  FROM edu.decision_scenarios WHERE id = NEW.scenario_id;
  
  IF v_scenario_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: scenario_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_scenario_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: instructor_reference deve pertencer à mesma instituição que scenario';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_instructor_reference_institution_check
BEFORE INSERT OR UPDATE ON edu.instructor_reference
FOR EACH ROW EXECUTE FUNCTION edu.trg_instructor_reference_institution_check();

-- 3.9) Checkpoints: institution_id coerente com module
CREATE OR REPLACE FUNCTION edu.trg_checkpoints_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_module_inst_id
  FROM edu.modules WHERE id = NEW.module_id;
  
  IF v_module_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: module_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_module_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: checkpoint deve pertencer à mesma instituição que module';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkpoints_institution_check
BEFORE INSERT OR UPDATE ON edu.checkpoints
FOR EACH ROW EXECUTE FUNCTION edu.trg_checkpoints_institution_check();

-- 3.9b) Checkpoint items: institution_id coerente com checkpoint
CREATE OR REPLACE FUNCTION edu.trg_checkpoint_items_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_cp_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_cp_inst_id
  FROM edu.checkpoints WHERE id = NEW.checkpoint_id;
  
  IF v_cp_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: checkpoint_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_cp_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: checkpoint_item deve pertencer à mesma instituição que checkpoint';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkpoint_items_institution_check
BEFORE INSERT OR UPDATE ON edu.checkpoint_items
FOR EACH ROW EXECUTE FUNCTION edu.trg_checkpoint_items_institution_check();

-- 3.9c) Checkpoint attempts: institution_id coerente com checkpoint
CREATE OR REPLACE FUNCTION edu.trg_checkpoint_attempts_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_cp_inst_id uuid;
BEGIN
  SELECT institution_id INTO v_cp_inst_id
  FROM edu.checkpoints WHERE id = NEW.checkpoint_id;
  
  IF v_cp_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: checkpoint_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_cp_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: checkpoint_attempt deve pertencer à mesma instituição que checkpoint';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkpoint_attempts_institution_check
BEFORE INSERT OR UPDATE ON edu.checkpoint_attempts
FOR EACH ROW EXECUTE FUNCTION edu.trg_checkpoint_attempts_institution_check();

-- 3.10) Student progress: institution_id + cohort_id coerentes com module
CREATE OR REPLACE FUNCTION edu.trg_student_progress_institution_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_inst_id uuid;
  v_module_cohort_id uuid;
BEGIN
  SELECT institution_id, cohort_id INTO v_module_inst_id, v_module_cohort_id
  FROM edu.modules WHERE id = NEW.module_id;
  
  IF v_module_inst_id IS NULL THEN
    RAISE EXCEPTION 'institution_id mismatch: module_id não encontrado';
  END IF;
  
  IF NEW.institution_id != v_module_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: student_progress deve pertencer à mesma instituição que module';
  END IF;
  
  IF NEW.cohort_id != v_module_cohort_id THEN
    RAISE EXCEPTION 'cohort_id mismatch: student_progress.cohort_id deve bater com module.cohort_id';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_student_progress_institution_check
BEFORE INSERT OR UPDATE ON edu.student_progress
FOR EACH ROW EXECUTE FUNCTION edu.trg_student_progress_institution_check();

-- 3.11) Activity logs: validações completas
CREATE OR REPLACE FUNCTION edu.trg_activity_logs_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_inst_id uuid;
  v_module_cohort_id uuid;
  v_cohort_inst_id uuid;
  v_entity_inst_id uuid;
BEGIN
  -- Validar módulo existe e obter institution_id e cohort_id
  SELECT institution_id, cohort_id INTO v_module_inst_id, v_module_cohort_id
  FROM edu.modules WHERE id = NEW.module_id;
  
  IF v_module_inst_id IS NULL THEN
    RAISE EXCEPTION 'validation error: module_id não encontrado';
  END IF;
  
  -- Validar cohort existe e obter institution_id
  SELECT institution_id INTO v_cohort_inst_id
  FROM edu.cohorts WHERE id = NEW.cohort_id;
  
  IF v_cohort_inst_id IS NULL THEN
    RAISE EXCEPTION 'validation error: cohort_id não encontrado';
  END IF;
  
  -- Validar coerência institution_id
  IF NEW.institution_id != v_module_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: activity_log.institution_id deve bater com module.institution_id';
  END IF;
  
  IF NEW.institution_id != v_cohort_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: activity_log.institution_id deve bater com cohort.institution_id';
  END IF;
  
  -- Validar coerência module.cohort_id com NEW.cohort_id
  IF NEW.cohort_id != v_module_cohort_id THEN
    RAISE EXCEPTION 'cohort_id mismatch: module pertence a outro cohort';
  END IF;
  
  -- Validar entity_id existe e pertence à mesma instituição
  CASE NEW.entity_type
    WHEN 'case' THEN
      SELECT institution_id INTO v_entity_inst_id FROM edu.cases WHERE id = NEW.entity_id;
    WHEN 'learning_object' THEN
      SELECT institution_id INTO v_entity_inst_id FROM edu.learning_objects WHERE id = NEW.entity_id;
    WHEN 'scenario' THEN
      SELECT institution_id INTO v_entity_inst_id FROM edu.decision_scenarios WHERE id = NEW.entity_id;
    WHEN 'checkpoint' THEN
      SELECT institution_id INTO v_entity_inst_id FROM edu.checkpoints WHERE id = NEW.entity_id;
    ELSE
      RAISE EXCEPTION 'validation error: entity_type inválido';
  END CASE;
  
  IF v_entity_inst_id IS NULL THEN
    RAISE EXCEPTION 'validation error: entity_id não encontrado para entity_type=%', NEW.entity_type;
  END IF;
  
  IF NEW.institution_id != v_entity_inst_id THEN
    RAISE EXCEPTION 'institution_id mismatch: entity pertence a outra instituição';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_logs_validation
BEFORE INSERT ON edu.activity_logs
FOR EACH ROW EXECUTE FUNCTION edu.trg_activity_logs_validation();

-- ============================================================
-- 4) GUARDS DE PUBLICAÇÃO
-- ============================================================

-- 4.1) Cases: validações ao publicar
CREATE OR REPLACE FUNCTION edu.trg_cases_publish_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_status edu.publish_status;
  v_consent_status edu.consent_status;
  v_version_exists boolean;
BEGIN
  -- Só validar se está mudando para published
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    
    -- T1) Se derived_real, exigir consent verified
    IF NEW.case_type = 'derived_real' THEN
      SELECT status INTO v_consent_status
      FROM edu.case_consents WHERE case_id = NEW.id;
      
      IF v_consent_status IS NULL OR v_consent_status != 'verified' THEN
        RAISE EXCEPTION 'publish guard: case derived_real exige case_consent.status=verified';
      END IF;
    END IF;
    
    -- T2) Exigir module published
    SELECT status INTO v_module_status
    FROM edu.modules WHERE id = NEW.module_id;
    
    IF v_module_status != 'published' THEN
      RAISE EXCEPTION 'publish guard: module deve estar published antes de publicar case';
    END IF;
    
    -- T3) Exigir published_version_number e versão existir
    IF NEW.published_version_number IS NULL THEN
      RAISE EXCEPTION 'publish guard: published_version_number é obrigatório para publicar';
    END IF;
    
    SELECT EXISTS(
      SELECT 1 FROM edu.case_versions 
      WHERE case_id = NEW.id AND version_number = NEW.published_version_number
    ) INTO v_version_exists;
    
    IF NOT v_version_exists THEN
      RAISE EXCEPTION 'publish guard: case_version com version_number=% não existe', NEW.published_version_number;
    END IF;
  END IF;
  
  -- T4) Bloquear alteração de published_version_number se já publicado
  IF OLD.status = 'published' AND NEW.status = 'published' THEN
    IF OLD.published_version_number IS DISTINCT FROM NEW.published_version_number THEN
      RAISE EXCEPTION 'publish guard: não é permitido alterar published_version_number de case já publicado';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cases_publish_guard
BEFORE UPDATE ON edu.cases
FOR EACH ROW EXECUTE FUNCTION edu.trg_cases_publish_guard();

-- 4.2) Learning objects: exigir module published
CREATE OR REPLACE FUNCTION edu.trg_learning_objects_publish_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_status edu.publish_status;
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    SELECT status INTO v_module_status
    FROM edu.modules WHERE id = NEW.module_id;
    
    IF v_module_status != 'published' THEN
      RAISE EXCEPTION 'publish guard: module deve estar published antes de publicar learning_object';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_learning_objects_publish_guard
BEFORE UPDATE ON edu.learning_objects
FOR EACH ROW EXECUTE FUNCTION edu.trg_learning_objects_publish_guard();

-- 4.3) Checkpoints: exigir module published
CREATE OR REPLACE FUNCTION edu.trg_checkpoints_publish_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_module_status edu.publish_status;
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    SELECT status INTO v_module_status
    FROM edu.modules WHERE id = NEW.module_id;
    
    IF v_module_status != 'published' THEN
      RAISE EXCEPTION 'publish guard: module deve estar published antes de publicar checkpoint';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkpoints_publish_guard
BEFORE UPDATE ON edu.checkpoints
FOR EACH ROW EXECUTE FUNCTION edu.trg_checkpoints_publish_guard();

-- ============================================================
-- 5) VALIDAR learning_links TARGET EXISTE E MESMA INSTITUIÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION edu.trg_learning_links_target_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_target_inst_id uuid;
BEGIN
  CASE NEW.target_type
    WHEN 'case' THEN
      SELECT institution_id INTO v_target_inst_id FROM edu.cases WHERE id = NEW.target_id;
    WHEN 'technique' THEN
      SELECT institution_id INTO v_target_inst_id FROM edu.techniques WHERE id = NEW.target_id;
    WHEN 'concept' THEN
      SELECT institution_id INTO v_target_inst_id FROM edu.concepts WHERE id = NEW.target_id;
    WHEN 'evidence' THEN
      SELECT institution_id INTO v_target_inst_id FROM edu.evidence_links WHERE id = NEW.target_id;
    ELSE
      RAISE EXCEPTION 'learning_link validation: target_type inválido';
  END CASE;
  
  IF v_target_inst_id IS NULL THEN
    RAISE EXCEPTION 'learning_link validation: target_id não encontrado para target_type=%', NEW.target_type;
  END IF;
  
  IF NEW.institution_id != v_target_inst_id THEN
    RAISE EXCEPTION 'learning_link validation: target pertence a outra instituição';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_learning_links_target_validation
BEFORE INSERT OR UPDATE ON edu.learning_links
FOR EACH ROW EXECUTE FUNCTION edu.trg_learning_links_target_validation();

-- ============================================================
-- 6) ACTIVITY_LOGS — APPEND-ONLY
-- ============================================================

CREATE OR REPLACE FUNCTION edu.trg_activity_logs_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'activity_logs é append-only: UPDATE e DELETE são proibidos';
END;
$$;

CREATE TRIGGER trg_activity_logs_append_only
BEFORE UPDATE OR DELETE ON edu.activity_logs
FOR EACH ROW EXECUTE FUNCTION edu.trg_activity_logs_append_only();

-- ============================================================
-- 7) PROGRESS AUTO-UPDATE (AFTER INSERT EM activity_logs)
-- ============================================================

CREATE OR REPLACE FUNCTION edu.trg_activity_logs_update_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
DECLARE
  v_counter_key text;
BEGIN
  -- Determinar qual counter incrementar
  CASE NEW.event_type
    WHEN 'view_case' THEN v_counter_key := 'cases_viewed';
    WHEN 'view_content' THEN v_counter_key := 'contents_viewed';
    WHEN 'submit_decision' THEN v_counter_key := 'decisions_submitted';
    WHEN 'submit_checkpoint' THEN v_counter_key := 'checkpoints_submitted';
    ELSE v_counter_key := NULL;
  END CASE;
  
  -- Se event_type relevante, fazer UPSERT no student_progress
  IF v_counter_key IS NOT NULL THEN
    INSERT INTO edu.student_progress (
      institution_id,
      cohort_id,
      module_id,
      user_id,
      progress_json,
      updated_at
    ) VALUES (
      NEW.institution_id,
      NEW.cohort_id,
      NEW.module_id,
      NEW.user_id,
      jsonb_build_object(v_counter_key, 1),
      now()
    )
    ON CONFLICT (cohort_id, module_id, user_id)
    DO UPDATE SET
      progress_json = edu.student_progress.progress_json || 
        jsonb_build_object(
          v_counter_key, 
          COALESCE((edu.student_progress.progress_json->>v_counter_key)::int, 0) + 1
        ),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_logs_update_progress
AFTER INSERT ON edu.activity_logs
FOR EACH ROW EXECUTE FUNCTION edu.trg_activity_logs_update_progress();

-- ============================================================
-- 8) TRIGGERS DE updated_at PARA TODAS AS TABELAS
-- ============================================================

CREATE TRIGGER trg_institutions_updated_at
BEFORE UPDATE ON edu.institutions
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_institution_members_updated_at
BEFORE UPDATE ON edu.institution_members
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_programs_updated_at
BEFORE UPDATE ON edu.programs
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_cohorts_updated_at
BEFORE UPDATE ON edu.cohorts
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_modules_updated_at
BEFORE UPDATE ON edu.modules
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_enrollments_updated_at
BEFORE UPDATE ON edu.enrollments
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_techniques_updated_at
BEFORE UPDATE ON edu.techniques
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_concepts_updated_at
BEFORE UPDATE ON edu.concepts
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_cases_updated_at
BEFORE UPDATE ON edu.cases
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_case_versions_updated_at
BEFORE UPDATE ON edu.case_versions
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_case_assets_updated_at
BEFORE UPDATE ON edu.case_assets
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_case_consents_updated_at
BEFORE UPDATE ON edu.case_consents
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_case_instructor_notes_updated_at
BEFORE UPDATE ON edu.case_instructor_notes
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_learning_objects_updated_at
BEFORE UPDATE ON edu.learning_objects
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_learning_links_updated_at
BEFORE UPDATE ON edu.learning_links
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_evidence_links_updated_at
BEFORE UPDATE ON edu.evidence_links
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_decision_scenarios_updated_at
BEFORE UPDATE ON edu.decision_scenarios
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_decision_prompts_updated_at
BEFORE UPDATE ON edu.decision_prompts
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_decision_attempts_updated_at
BEFORE UPDATE ON edu.decision_attempts
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_instructor_reference_updated_at
BEFORE UPDATE ON edu.instructor_reference
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_checkpoints_updated_at
BEFORE UPDATE ON edu.checkpoints
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_checkpoint_items_updated_at
BEFORE UPDATE ON edu.checkpoint_items
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_checkpoint_attempts_updated_at
BEFORE UPDATE ON edu.checkpoint_attempts
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

CREATE TRIGGER trg_student_progress_updated_at
BEFORE UPDATE ON edu.student_progress
FOR EACH ROW EXECUTE FUNCTION edu.set_updated_at();

-- ============================================================
-- COMENTÁRIO FINAL:
-- Migração 002 cria APENAS funções + triggers no schema edu.*
-- SEM RLS, SEM policies, SEM UI, SEM storage
-- Nenhum objeto fora de edu.* foi alterado.
-- ============================================================