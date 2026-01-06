-- ============================================================
-- REGENAPP Education / Academy
-- Migração 001: Schema + Enums + Tabelas + Índices
-- REGRA: Tudo no schema edu.* | Sem triggers | Sem RLS | Sem policies
-- ============================================================

-- 1) PRÉ-REQUISITOS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS edu;

-- 2) ENUMS NO SCHEMA edu
-- NOTA: submit_decision é estritamente educacional e NÃO representa
-- decisão clínica, SCORE, prontidão ou recomendação terapêutica.

CREATE TYPE edu.institution_role AS ENUM ('student', 'teacher', 'director', 'institution_admin');
CREATE TYPE edu.publish_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE edu.institution_status AS ENUM ('active', 'suspended');
CREATE TYPE edu.cohort_status AS ENUM ('planned', 'active', 'ended');
CREATE TYPE edu.enrollment_status AS ENUM ('active', 'paused', 'ended');
CREATE TYPE edu.member_status AS ENUM ('active', 'inactive');
CREATE TYPE edu.consent_status AS ENUM ('verified', 'pending', 'blocked');
CREATE TYPE edu.evidence_source AS ENUM ('regenapp_curated', 'external');
CREATE TYPE edu.case_type AS ENUM ('simulated', 'derived_real');
CREATE TYPE edu.difficulty_level AS ENUM ('intro', 'intermediate', 'advanced');
CREATE TYPE edu.asset_type AS ENUM ('image', 'pdf', 'video_link');
CREATE TYPE edu.learning_object_type AS ENUM ('video', 'slides', 'pdf', 'checklist', 'reading', 'quiz');
CREATE TYPE edu.prompt_type AS ENUM ('multiple_choice', 'short_text', 'checklist');
CREATE TYPE edu.event_type AS ENUM ('open_cohort', 'open_module', 'view_case', 'view_content', 'submit_decision', 'submit_checkpoint');
CREATE TYPE edu.entity_type AS ENUM ('case', 'learning_object', 'scenario', 'checkpoint');
CREATE TYPE edu.link_target_type AS ENUM ('case', 'technique', 'concept', 'evidence');

-- ============================================================
-- 3) TABELAS - MULTI-TENANT / INSTITUIÇÕES
-- ============================================================

-- A) edu.institutions
CREATE TABLE edu.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status edu.institution_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- B) edu.institution_members
CREATE TABLE edu.institution_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  role edu.institution_role NOT NULL,
  status edu.member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id, role)
);

-- C) edu.programs
CREATE TABLE edu.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  title text NOT NULL,
  status edu.publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- D) edu.cohorts
CREATE TABLE edu.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  program_id uuid NOT NULL REFERENCES edu.programs(id) ON DELETE RESTRICT,
  title text NOT NULL,
  status edu.cohort_status NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- E) edu.modules
CREATE TABLE edu.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES edu.cohorts(id) ON DELETE RESTRICT,
  title text NOT NULL,
  status edu.publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, cohort_id)
);

-- F) edu.enrollments
CREATE TABLE edu.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES edu.cohorts(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  status edu.enrollment_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, user_id)
);

-- ============================================================
-- 4) TABELAS - TAXONOMIA
-- ============================================================

-- A) edu.techniques
CREATE TABLE edu.techniques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- B) edu.concepts
CREATE TABLE edu.concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5) TABELAS - CASOS EDUCACIONAIS
-- ============================================================

-- A) edu.cases
CREATE TABLE edu.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  module_id uuid NOT NULL REFERENCES edu.modules(id) ON DELETE RESTRICT,
  title text NOT NULL,
  case_type edu.case_type NOT NULL DEFAULT 'simulated',
  difficulty edu.difficulty_level NULL,
  status edu.publish_status NOT NULL DEFAULT 'draft',
  published_version_number int NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- B) edu.case_versions
CREATE TABLE edu.case_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  case_id uuid NOT NULL REFERENCES edu.cases(id) ON DELETE RESTRICT,
  version_number int NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, version_number)
);

-- C) edu.case_assets
CREATE TABLE edu.case_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  case_id uuid NOT NULL REFERENCES edu.cases(id) ON DELETE RESTRICT,
  asset_type edu.asset_type NOT NULL,
  storage_path text NULL,
  external_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_path IS NOT NULL OR external_url IS NOT NULL)
);

-- D) edu.case_consents
CREATE TABLE edu.case_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  case_id uuid NOT NULL REFERENCES edu.cases(id) ON DELETE RESTRICT UNIQUE,
  status edu.consent_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- E) edu.case_instructor_notes
CREATE TABLE edu.case_instructor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  case_id uuid NOT NULL REFERENCES edu.cases(id) ON DELETE RESTRICT,
  instructor_user_id uuid NOT NULL,
  notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6) TABELAS - CONTEÚDO
-- ============================================================

-- A) edu.learning_objects
CREATE TABLE edu.learning_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  module_id uuid NOT NULL REFERENCES edu.modules(id) ON DELETE RESTRICT,
  title text NOT NULL,
  object_type edu.learning_object_type NOT NULL,
  status edu.publish_status NOT NULL DEFAULT 'draft',
  storage_path text NULL,
  external_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_path IS NOT NULL OR external_url IS NOT NULL)
);

-- B) edu.learning_links
CREATE TABLE edu.learning_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  learning_object_id uuid NOT NULL REFERENCES edu.learning_objects(id) ON DELETE RESTRICT,
  target_type edu.link_target_type NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7) TABELAS - EVIDÊNCIA (LINKS EDUCACIONAIS)
-- Tabela para vincular evidências (curadoria REGENAPP ou externas).
-- NÃO altera a curadoria institucional (READ-ONLY em relação à curadoria).
-- ============================================================

CREATE TABLE edu.evidence_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  module_id uuid NULL REFERENCES edu.modules(id) ON DELETE RESTRICT,
  case_id uuid NULL REFERENCES edu.cases(id) ON DELETE RESTRICT,
  source edu.evidence_source NOT NULL,
  citation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8) TABELAS - DECISION REASONING LAB (EDUCACIONAL)
-- submit_decision é estritamente educacional e NÃO representa
-- decisão clínica, SCORE, prontidão ou recomendação terapêutica.
-- ============================================================

-- A) edu.decision_scenarios
CREATE TABLE edu.decision_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  case_id uuid NOT NULL REFERENCES edu.cases(id) ON DELETE RESTRICT,
  title text NOT NULL,
  status edu.publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- B) edu.decision_prompts
CREATE TABLE edu.decision_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  scenario_id uuid NOT NULL REFERENCES edu.decision_scenarios(id) ON DELETE RESTRICT,
  prompt_type edu.prompt_type NOT NULL,
  prompt_text text NOT NULL,
  order_index int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- C) edu.decision_attempts
CREATE TABLE edu.decision_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  scenario_id uuid NOT NULL REFERENCES edu.decision_scenarios(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  attempt_no int NOT NULL DEFAULT 1,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scenario_id, user_id, attempt_no)
);

-- D) edu.instructor_reference
CREATE TABLE edu.instructor_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  scenario_id uuid NOT NULL REFERENCES edu.decision_scenarios(id) ON DELETE RESTRICT,
  reference_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9) TABELAS - CHECKPOINTS
-- ============================================================

-- A) edu.checkpoints
CREATE TABLE edu.checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  module_id uuid NOT NULL REFERENCES edu.modules(id) ON DELETE RESTRICT,
  title text NOT NULL,
  status edu.publish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- B) edu.checkpoint_items
CREATE TABLE edu.checkpoint_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  checkpoint_id uuid NOT NULL REFERENCES edu.checkpoints(id) ON DELETE RESTRICT,
  item_text text NOT NULL,
  order_index int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- C) edu.checkpoint_attempts
CREATE TABLE edu.checkpoint_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  checkpoint_id uuid NOT NULL REFERENCES edu.checkpoints(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  attempt_no int NOT NULL DEFAULT 1,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (checkpoint_id, user_id, attempt_no)
);

-- ============================================================
-- 10) TABELAS - TRACKING / LOGS
-- ============================================================

-- A) edu.student_progress
CREATE TABLE edu.student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES edu.cohorts(id) ON DELETE RESTRICT,
  module_id uuid NOT NULL REFERENCES edu.modules(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  progress_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, module_id, user_id)
);

-- B) edu.activity_logs
CREATE TABLE edu.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES edu.institutions(id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES edu.cohorts(id) ON DELETE RESTRICT,
  module_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_type edu.event_type NOT NULL,
  entity_type edu.entity_type NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (module_id, cohort_id) REFERENCES edu.modules(id, cohort_id) ON DELETE RESTRICT
);

-- ============================================================
-- 11) ÍNDICES OBRIGATÓRIOS
-- ============================================================

CREATE INDEX idx_edu_institution_members_inst_user ON edu.institution_members(institution_id, user_id);
CREATE INDEX idx_edu_modules_cohort ON edu.modules(cohort_id);
CREATE INDEX idx_edu_enrollments_user ON edu.enrollments(user_id);
CREATE INDEX idx_edu_cases_module ON edu.cases(module_id);
CREATE INDEX idx_edu_learning_links_target ON edu.learning_links(target_type, target_id);
CREATE INDEX idx_edu_learning_links_object ON edu.learning_links(learning_object_id);
CREATE INDEX idx_edu_activity_logs_main ON edu.activity_logs(institution_id, cohort_id, module_id, user_id, created_at);
CREATE INDEX idx_edu_evidence_links_inst ON edu.evidence_links(institution_id);
CREATE INDEX idx_edu_evidence_links_module ON edu.evidence_links(module_id);
CREATE INDEX idx_edu_evidence_links_case ON edu.evidence_links(case_id);

-- ============================================================
-- COMENTÁRIO FINAL:
-- Esta migração cria APENAS estrutura DDL no schema edu.*
-- SEM triggers, SEM RLS, SEM policies, SEM storage, SEM UI
-- Nenhum objeto fora de edu.* foi alterado.
-- ============================================================