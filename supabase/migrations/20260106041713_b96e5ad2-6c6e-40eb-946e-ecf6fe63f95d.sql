-- ============================================================
-- REGENAPP Education / Academy
-- Migração 003: RLS HARD por tabela
-- REGRA: Tudo no schema edu.* | Sem UI | Sem storage
-- ============================================================

-- ============================================================
-- 1) ATIVAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE edu.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.institutions FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.institution_members FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.programs FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.cohorts FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.modules FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.enrollments FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.techniques FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.concepts FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.cases FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.case_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.case_versions FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.case_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.case_assets FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.case_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.case_consents FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.case_instructor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.case_instructor_notes FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.learning_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.learning_objects FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.learning_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.learning_links FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.evidence_links FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.decision_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.decision_scenarios FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.decision_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.decision_prompts FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.decision_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.decision_attempts FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.instructor_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.instructor_reference FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.checkpoints FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.checkpoint_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.checkpoint_items FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.checkpoint_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.checkpoint_attempts FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.student_progress FORCE ROW LEVEL SECURITY;

ALTER TABLE edu.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.activity_logs FORCE ROW LEVEL SECURITY;

-- ============================================================
-- 2) POLICIES: edu.institutions
-- ============================================================

-- SELECT: membros ativos
CREATE POLICY "institutions_select_member"
ON edu.institutions FOR SELECT
TO authenticated
USING (edu.is_member(id, auth.uid()));

-- INSERT: somente institution_admin (necessita institution existir primeiro - apenas via service role)
-- Para criar nova institution, usar service role ou admin global
CREATE POLICY "institutions_insert_none"
ON edu.institutions FOR INSERT
TO authenticated
WITH CHECK (false);

-- UPDATE: institution_admin da própria instituição
CREATE POLICY "institutions_update_admin"
ON edu.institutions FOR UPDATE
TO authenticated
USING (edu.has_role(id, auth.uid(), 'institution_admin'))
WITH CHECK (edu.has_role(id, auth.uid(), 'institution_admin'));

-- DELETE: ninguém (proteção)
CREATE POLICY "institutions_delete_none"
ON edu.institutions FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- 3) POLICIES: edu.institution_members
-- ============================================================

-- SELECT: membros ativos da instituição
CREATE POLICY "members_select_member"
ON edu.institution_members FOR SELECT
TO authenticated
USING (edu.is_member(institution_id, auth.uid()));

-- INSERT: somente institution_admin
CREATE POLICY "members_insert_admin"
ON edu.institution_members FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_role(institution_id, auth.uid(), 'institution_admin')
);

-- UPDATE: institution_admin, mas não pode alterar próprio role (anti self-escalation)
CREATE POLICY "members_update_admin"
ON edu.institution_members FOR UPDATE
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'institution_admin')
  AND user_id != auth.uid() -- Não pode editar próprio registro
)
WITH CHECK (
  edu.has_role(institution_id, auth.uid(), 'institution_admin')
  AND user_id != auth.uid()
);

-- DELETE: institution_admin, mas não pode deletar a si mesmo
CREATE POLICY "members_delete_admin"
ON edu.institution_members FOR DELETE
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'institution_admin')
  AND user_id != auth.uid()
);

-- ============================================================
-- 4) POLICIES: edu.programs
-- ============================================================

-- SELECT: staff vê tudo da instituição, student vê apenas published
CREATE POLICY "programs_select_staff"
ON edu.programs FOR SELECT
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "programs_select_student"
ON edu.programs FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND status = 'published'
);

-- INSERT/UPDATE: teacher, director, institution_admin
CREATE POLICY "programs_insert_staff"
ON edu.programs FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "programs_update_staff"
ON edu.programs FOR UPDATE
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
)
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

-- DELETE: teacher, director, institution_admin
CREATE POLICY "programs_delete_staff"
ON edu.programs FOR DELETE
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

-- ============================================================
-- 5) POLICIES: edu.cohorts
-- ============================================================

-- SELECT: staff vê tudo; student vê apenas onde está matriculado
CREATE POLICY "cohorts_select_staff"
ON edu.cohorts FOR SELECT
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "cohorts_select_student"
ON edu.cohorts FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND edu.is_enrolled(institution_id, id, auth.uid())
);

-- INSERT/UPDATE/DELETE: teacher, director, institution_admin
CREATE POLICY "cohorts_insert_staff"
ON edu.cohorts FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "cohorts_update_staff"
ON edu.cohorts FOR UPDATE
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
)
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "cohorts_delete_staff"
ON edu.cohorts FOR DELETE
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

-- ============================================================
-- 6) POLICIES: edu.modules
-- ============================================================

-- SELECT: staff vê tudo; student vê published + enrollment no cohort
CREATE POLICY "modules_select_staff"
ON edu.modules FOR SELECT
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "modules_select_student"
ON edu.modules FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND status = 'published'
  AND edu.is_enrolled(institution_id, cohort_id, auth.uid())
);

-- INSERT/UPDATE/DELETE: teacher, director, institution_admin
CREATE POLICY "modules_insert_staff"
ON edu.modules FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "modules_update_staff"
ON edu.modules FOR UPDATE
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
)
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "modules_delete_staff"
ON edu.modules FOR DELETE
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

-- ============================================================
-- 7) POLICIES: edu.enrollments
-- ============================================================

-- SELECT: staff vê tudo; student vê apenas sua própria matrícula
CREATE POLICY "enrollments_select_staff"
ON edu.enrollments FOR SELECT
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "enrollments_select_student"
ON edu.enrollments FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND user_id = auth.uid()
);

-- INSERT/UPDATE/DELETE: somente institution_admin
CREATE POLICY "enrollments_insert_admin"
ON edu.enrollments FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_role(institution_id, auth.uid(), 'institution_admin')
);

CREATE POLICY "enrollments_update_admin"
ON edu.enrollments FOR UPDATE
TO authenticated
USING (edu.has_role(institution_id, auth.uid(), 'institution_admin'))
WITH CHECK (edu.has_role(institution_id, auth.uid(), 'institution_admin'));

CREATE POLICY "enrollments_delete_admin"
ON edu.enrollments FOR DELETE
TO authenticated
USING (edu.has_role(institution_id, auth.uid(), 'institution_admin'));

-- ============================================================
-- 8) POLICIES: edu.techniques / edu.concepts (taxonomia)
-- ============================================================

-- SELECT: membros ativos
CREATE POLICY "techniques_select_member"
ON edu.techniques FOR SELECT
TO authenticated
USING (edu.is_member(institution_id, auth.uid()));

CREATE POLICY "concepts_select_member"
ON edu.concepts FOR SELECT
TO authenticated
USING (edu.is_member(institution_id, auth.uid()));

-- INSERT/UPDATE/DELETE: teacher, director, institution_admin
CREATE POLICY "techniques_insert_staff"
ON edu.techniques FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "techniques_update_staff"
ON edu.techniques FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "techniques_delete_staff"
ON edu.techniques FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "concepts_insert_staff"
ON edu.concepts FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "concepts_update_staff"
ON edu.concepts FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "concepts_delete_staff"
ON edu.concepts FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 9) POLICIES: edu.cases
-- ============================================================

-- SELECT: staff vê tudo; student vê published + enrollment no cohort do module
CREATE POLICY "cases_select_staff"
ON edu.cases FOR SELECT
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "cases_select_student"
ON edu.cases FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM edu.modules m
    WHERE m.id = module_id
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

-- INSERT/UPDATE/DELETE: teacher, director, institution_admin
CREATE POLICY "cases_insert_staff"
ON edu.cases FOR INSERT
TO authenticated
WITH CHECK (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "cases_update_staff"
ON edu.cases FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "cases_delete_staff"
ON edu.cases FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 10) POLICIES: edu.case_versions
-- ============================================================

-- SELECT: staff vê tudo; student vê apenas versão publicada
CREATE POLICY "case_versions_select_staff"
ON edu.case_versions FOR SELECT
TO authenticated
USING (
  edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[])
);

CREATE POLICY "case_versions_select_student"
ON edu.case_versions FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 FROM edu.cases c
    JOIN edu.modules m ON m.id = c.module_id
    WHERE c.id = case_id
    AND c.status = 'published'
    AND c.published_version_number = version_number
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

-- INSERT/UPDATE/DELETE: teacher, director, institution_admin
CREATE POLICY "case_versions_insert_staff"
ON edu.case_versions FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_versions_update_staff"
ON edu.case_versions FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_versions_delete_staff"
ON edu.case_versions FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 11) POLICIES: edu.case_assets
-- ============================================================

-- SELECT: staff vê tudo; student vê apenas de cases published
CREATE POLICY "case_assets_select_staff"
ON edu.case_assets FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_assets_select_student"
ON edu.case_assets FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 FROM edu.cases c
    JOIN edu.modules m ON m.id = c.module_id
    WHERE c.id = case_id
    AND c.status = 'published'
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

-- INSERT/UPDATE/DELETE: staff
CREATE POLICY "case_assets_insert_staff"
ON edu.case_assets FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_assets_update_staff"
ON edu.case_assets FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_assets_delete_staff"
ON edu.case_assets FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 12) POLICIES: edu.case_consents (staff only)
-- ============================================================

CREATE POLICY "case_consents_select_staff"
ON edu.case_consents FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_consents_insert_staff"
ON edu.case_consents FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_consents_update_staff"
ON edu.case_consents FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_consents_delete_staff"
ON edu.case_consents FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 13) POLICIES: edu.case_instructor_notes (staff only - student NUNCA vê)
-- ============================================================

CREATE POLICY "case_instructor_notes_select_staff"
ON edu.case_instructor_notes FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_instructor_notes_insert_staff"
ON edu.case_instructor_notes FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_instructor_notes_update_staff"
ON edu.case_instructor_notes FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "case_instructor_notes_delete_staff"
ON edu.case_instructor_notes FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 14) POLICIES: edu.learning_objects
-- ============================================================

CREATE POLICY "learning_objects_select_staff"
ON edu.learning_objects FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "learning_objects_select_student"
ON edu.learning_objects FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM edu.modules m
    WHERE m.id = module_id
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

CREATE POLICY "learning_objects_insert_staff"
ON edu.learning_objects FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "learning_objects_update_staff"
ON edu.learning_objects FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "learning_objects_delete_staff"
ON edu.learning_objects FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 15) POLICIES: edu.learning_links
-- ============================================================

CREATE POLICY "learning_links_select_staff"
ON edu.learning_links FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "learning_links_select_student"
ON edu.learning_links FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 FROM edu.learning_objects lo
    JOIN edu.modules m ON m.id = lo.module_id
    WHERE lo.id = learning_object_id
    AND lo.status = 'published'
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

CREATE POLICY "learning_links_insert_staff"
ON edu.learning_links FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "learning_links_update_staff"
ON edu.learning_links FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "learning_links_delete_staff"
ON edu.learning_links FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 16) POLICIES: edu.evidence_links
-- ============================================================

CREATE POLICY "evidence_links_select_staff"
ON edu.evidence_links FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "evidence_links_select_student"
ON edu.evidence_links FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND (
    -- Vinculado a módulo publicado onde está matriculado
    (module_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM edu.modules m
      WHERE m.id = module_id
      AND m.status = 'published'
      AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
    ))
    OR
    -- Vinculado a case publicado onde está matriculado
    (case_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM edu.cases c
      JOIN edu.modules m ON m.id = c.module_id
      WHERE c.id = case_id
      AND c.status = 'published'
      AND m.status = 'published'
      AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
    ))
  )
);

CREATE POLICY "evidence_links_insert_staff"
ON edu.evidence_links FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "evidence_links_update_staff"
ON edu.evidence_links FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "evidence_links_delete_staff"
ON edu.evidence_links FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 17) POLICIES: edu.decision_scenarios
-- ============================================================

CREATE POLICY "decision_scenarios_select_staff"
ON edu.decision_scenarios FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "decision_scenarios_select_student"
ON edu.decision_scenarios FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM edu.cases c
    JOIN edu.modules m ON m.id = c.module_id
    WHERE c.id = case_id
    AND c.status = 'published'
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

CREATE POLICY "decision_scenarios_insert_staff"
ON edu.decision_scenarios FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "decision_scenarios_update_staff"
ON edu.decision_scenarios FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "decision_scenarios_delete_staff"
ON edu.decision_scenarios FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 18) POLICIES: edu.decision_prompts
-- ============================================================

CREATE POLICY "decision_prompts_select_staff"
ON edu.decision_prompts FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "decision_prompts_select_student"
ON edu.decision_prompts FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 FROM edu.decision_scenarios ds
    JOIN edu.cases c ON c.id = ds.case_id
    JOIN edu.modules m ON m.id = c.module_id
    WHERE ds.id = scenario_id
    AND ds.status = 'published'
    AND c.status = 'published'
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

CREATE POLICY "decision_prompts_insert_staff"
ON edu.decision_prompts FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "decision_prompts_update_staff"
ON edu.decision_prompts FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "decision_prompts_delete_staff"
ON edu.decision_prompts FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 19) POLICIES: edu.decision_attempts (APPEND-ONLY para students)
-- ============================================================

-- SELECT: staff vê tudo; student vê apenas próprias
CREATE POLICY "decision_attempts_select_staff"
ON edu.decision_attempts FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "decision_attempts_select_student"
ON edu.decision_attempts FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND user_id = auth.uid()
);

-- INSERT: student apenas para si mesmo + scenario visível
CREATE POLICY "decision_attempts_insert_student"
ON edu.decision_attempts FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND edu.is_member(institution_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM edu.decision_scenarios ds
    JOIN edu.cases c ON c.id = ds.case_id
    JOIN edu.modules m ON m.id = c.module_id
    WHERE ds.id = scenario_id
    AND ds.status = 'published'
    AND c.status = 'published'
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

-- UPDATE/DELETE: NINGUÉM (append-only)
CREATE POLICY "decision_attempts_update_none"
ON edu.decision_attempts FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "decision_attempts_delete_none"
ON edu.decision_attempts FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- 20) POLICIES: edu.instructor_reference (staff only - student NUNCA vê)
-- ============================================================

CREATE POLICY "instructor_reference_select_staff"
ON edu.instructor_reference FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "instructor_reference_insert_staff"
ON edu.instructor_reference FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "instructor_reference_update_staff"
ON edu.instructor_reference FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "instructor_reference_delete_staff"
ON edu.instructor_reference FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 21) POLICIES: edu.checkpoints
-- ============================================================

CREATE POLICY "checkpoints_select_staff"
ON edu.checkpoints FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "checkpoints_select_student"
ON edu.checkpoints FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM edu.modules m
    WHERE m.id = module_id
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

CREATE POLICY "checkpoints_insert_staff"
ON edu.checkpoints FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "checkpoints_update_staff"
ON edu.checkpoints FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "checkpoints_delete_staff"
ON edu.checkpoints FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 22) POLICIES: edu.checkpoint_items
-- ============================================================

CREATE POLICY "checkpoint_items_select_staff"
ON edu.checkpoint_items FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "checkpoint_items_select_student"
ON edu.checkpoint_items FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND EXISTS (
    SELECT 1 FROM edu.checkpoints cp
    JOIN edu.modules m ON m.id = cp.module_id
    WHERE cp.id = checkpoint_id
    AND cp.status = 'published'
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

CREATE POLICY "checkpoint_items_insert_staff"
ON edu.checkpoint_items FOR INSERT
TO authenticated
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "checkpoint_items_update_staff"
ON edu.checkpoint_items FOR UPDATE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]))
WITH CHECK (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "checkpoint_items_delete_staff"
ON edu.checkpoint_items FOR DELETE
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

-- ============================================================
-- 23) POLICIES: edu.checkpoint_attempts (APPEND-ONLY para students)
-- ============================================================

CREATE POLICY "checkpoint_attempts_select_staff"
ON edu.checkpoint_attempts FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "checkpoint_attempts_select_student"
ON edu.checkpoint_attempts FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND user_id = auth.uid()
);

CREATE POLICY "checkpoint_attempts_insert_student"
ON edu.checkpoint_attempts FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND edu.is_member(institution_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM edu.checkpoints cp
    JOIN edu.modules m ON m.id = cp.module_id
    WHERE cp.id = checkpoint_id
    AND cp.status = 'published'
    AND m.status = 'published'
    AND edu.is_enrolled(m.institution_id, m.cohort_id, auth.uid())
  )
);

CREATE POLICY "checkpoint_attempts_update_none"
ON edu.checkpoint_attempts FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "checkpoint_attempts_delete_none"
ON edu.checkpoint_attempts FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- 24) POLICIES: edu.student_progress (READ-ONLY por client)
-- ============================================================

-- SELECT: staff vê tudo; student vê apenas próprio
CREATE POLICY "student_progress_select_staff"
ON edu.student_progress FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "student_progress_select_student"
ON edu.student_progress FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND user_id = auth.uid()
);

-- INSERT/UPDATE/DELETE: NINGUÉM via client (apenas trigger)
CREATE POLICY "student_progress_insert_none"
ON edu.student_progress FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "student_progress_update_none"
ON edu.student_progress FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "student_progress_delete_none"
ON edu.student_progress FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- 25) POLICIES: edu.activity_logs (APPEND-ONLY + user_id = auth.uid())
-- ============================================================

-- SELECT: staff vê tudo; student vê apenas próprios
CREATE POLICY "activity_logs_select_staff"
ON edu.activity_logs FOR SELECT
TO authenticated
USING (edu.has_any_role(institution_id, auth.uid(), ARRAY['teacher','director','institution_admin']::edu.institution_role[]));

CREATE POLICY "activity_logs_select_student"
ON edu.activity_logs FOR SELECT
TO authenticated
USING (
  edu.has_role(institution_id, auth.uid(), 'student')
  AND user_id = auth.uid()
);

-- INSERT: apenas para si mesmo + enrollment ativo
CREATE POLICY "activity_logs_insert_member"
ON edu.activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND edu.is_member(institution_id, auth.uid())
  AND edu.is_enrolled(institution_id, cohort_id, auth.uid())
);

-- UPDATE/DELETE: NINGUÉM (reforço do trigger append-only)
CREATE POLICY "activity_logs_update_none"
ON edu.activity_logs FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "activity_logs_delete_none"
ON edu.activity_logs FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- COMENTÁRIO FINAL:
-- Migração 003 ativa RLS + cria policies em todas as tabelas edu.*
-- SEM UI, SEM storage
-- Nenhum objeto fora de edu.* foi alterado.
-- ============================================================