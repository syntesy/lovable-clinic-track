-- ============================================================
-- Migration: Clinical Outcome Classification Layer
-- Adds 4-level post-procedure outcome interpretation to
-- patient_reported_outcomes.
--
-- ADDITIVE ONLY: existing binary responder logic is untouched.
-- Classification is for UI/reports/dashboards only.
-- Must NOT be used to recommend, contraindicate, or deny procedures.
-- ============================================================

-- ── 1. Add columns to patient_reported_outcomes ──────────────────

ALTER TABLE patient_reported_outcomes
  ADD COLUMN IF NOT EXISTS clinical_outcome_classification text
    CHECK (clinical_outcome_classification IN ('very_favorable', 'favorable', 'partial', 'limited')),
  ADD COLUMN IF NOT EXISTS clinical_outcome_classification_reason text
    CHECK (clinical_outcome_classification_reason IN (
      'eva_only',
      'eva_plus_ifn_downgrade',
      'unavailable_missing_eva',
      'unavailable_invalid_range'
    )),
  ADD COLUMN IF NOT EXISTS delta_eva numeric,
  ADD COLUMN IF NOT EXISTS delta_ifn numeric;

-- Index for dashboard/analytics filtering by classification
CREATE INDEX IF NOT EXISTS idx_pro_clinical_outcome_classification
  ON patient_reported_outcomes (clinical_outcome_classification)
  WHERE clinical_outcome_classification IS NOT NULL;

-- ── 2. Compute function ───────────────────────────────────────────
-- Uses attendance_pathology.eva_pain / ifn_function as preferred baseline (per spec §3.2).
-- Skips baseline timepoint rows (no classification for t=0).
-- Skips rows with no procedure linkage.

CREATE OR REPLACE FUNCTION compute_clinical_outcome_for_pro(p_pro_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_timepoint         text;
  v_psr_id            uuid;
  v_followup_eva      numeric;
  v_followup_ifn      numeric;
  v_attendance_id     text;
  v_baseline_eva      numeric;
  v_baseline_ifn      numeric;
  v_delta_eva         numeric;
  v_delta_ifn         numeric;
  v_eva_class         text;
  v_classification    text;
  v_reason            text;
BEGIN
  -- Fetch follow-up record fields
  SELECT timepoint, procedure_standard_record_id, pain_score, function_score
    INTO v_timepoint, v_psr_id, v_followup_eva, v_followup_ifn
    FROM patient_reported_outcomes
   WHERE id = p_pro_id;

  -- Do not classify baseline timepoint
  IF v_timepoint = 'baseline' OR v_timepoint IS NULL THEN
    RETURN;
  END IF;

  -- Require procedure linkage
  IF v_psr_id IS NULL THEN
    RETURN;
  END IF;

  -- Missing follow-up EVA → unavailable
  IF v_followup_eva IS NULL THEN
    UPDATE patient_reported_outcomes
       SET clinical_outcome_classification        = NULL,
           clinical_outcome_classification_reason = 'unavailable_missing_eva',
           delta_eva                              = NULL,
           delta_ifn                              = NULL
     WHERE id = p_pro_id;
    RETURN;
  END IF;

  -- Get attendance_id from procedure record
  SELECT attendance_id INTO v_attendance_id
    FROM procedure_standard_records
   WHERE id = v_psr_id;

  IF v_attendance_id IS NULL THEN
    RETURN;
  END IF;

  -- Get baseline from attendance_pathology (preferred source per spec §3.2)
  SELECT eva_pain, ifn_function INTO v_baseline_eva, v_baseline_ifn
    FROM attendance_pathology
   WHERE attendance_id = v_attendance_id
   LIMIT 1;

  -- Missing baseline EVA → unavailable
  IF v_baseline_eva IS NULL THEN
    UPDATE patient_reported_outcomes
       SET clinical_outcome_classification        = NULL,
           clinical_outcome_classification_reason = 'unavailable_missing_eva',
           delta_eva                              = NULL,
           delta_ifn                              = NULL
     WHERE id = p_pro_id;
    RETURN;
  END IF;

  -- Validate EVA range 0–10
  IF v_baseline_eva < 0 OR v_baseline_eva > 10
     OR v_followup_eva < 0 OR v_followup_eva > 10 THEN
    UPDATE patient_reported_outcomes
       SET clinical_outcome_classification        = NULL,
           clinical_outcome_classification_reason = 'unavailable_invalid_range',
           delta_eva                              = NULL,
           delta_ifn                              = NULL
     WHERE id = p_pro_id;
    RETURN;
  END IF;

  -- Primary classification: delta_eva = baseline - followup (positive = improvement)
  v_delta_eva := v_baseline_eva - v_followup_eva;

  IF v_delta_eva >= 4 THEN
    v_eva_class := 'very_favorable';
  ELSIF v_delta_eva >= 2 THEN
    v_eva_class := 'favorable';
  ELSIF v_delta_eva = 1 THEN
    v_eva_class := 'partial';
  ELSE
    v_eva_class := 'limited';
  END IF;

  v_classification := v_eva_class;
  v_reason         := 'eva_only';
  v_delta_ifn      := NULL;

  -- Secondary IFN modifier: only for very_favorable / favorable, only when IFN data is valid 0–10
  IF v_baseline_ifn IS NOT NULL AND v_followup_ifn IS NOT NULL
     AND v_baseline_ifn >= 0 AND v_baseline_ifn <= 10
     AND v_followup_ifn >= 0 AND v_followup_ifn <= 10
     AND (v_eva_class = 'very_favorable' OR v_eva_class = 'favorable') THEN

    v_delta_ifn := v_baseline_ifn - v_followup_ifn;

    IF v_delta_ifn <= 0 THEN
      -- No functional improvement → downgrade by one level
      v_classification := CASE v_eva_class
                            WHEN 'very_favorable' THEN 'favorable'
                            ELSE 'partial'
                          END;
      v_reason := 'eva_plus_ifn_downgrade';
    END IF;
  END IF;

  UPDATE patient_reported_outcomes
     SET clinical_outcome_classification        = v_classification,
         clinical_outcome_classification_reason = v_reason,
         delta_eva                              = v_delta_eva,
         delta_ifn                              = v_delta_ifn
   WHERE id = p_pro_id;
END;
$$;

-- ── 3. Trigger: recompute on PRO insert/update ────────────────────

CREATE OR REPLACE FUNCTION trigger_fn_clinical_outcome_on_pro_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR (TG_OP = 'UPDATE' AND (
           NEW.pain_score                     IS DISTINCT FROM OLD.pain_score
        OR NEW.function_score                 IS DISTINCT FROM OLD.function_score
        OR NEW.procedure_standard_record_id   IS DISTINCT FROM OLD.procedure_standard_record_id
        OR NEW.timepoint                      IS DISTINCT FROM OLD.timepoint
     ))
  THEN
    PERFORM compute_clinical_outcome_for_pro(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_outcome_on_pro_change ON patient_reported_outcomes;
CREATE TRIGGER trg_clinical_outcome_on_pro_change
  AFTER INSERT OR UPDATE ON patient_reported_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_fn_clinical_outcome_on_pro_change();

-- ── 4. Trigger: recompute when baseline (attendance_pathology) changes ──

CREATE OR REPLACE FUNCTION trigger_fn_clinical_outcome_on_pathology_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.eva_pain IS DISTINCT FROM NEW.eva_pain
     OR OLD.ifn_function IS DISTINCT FROM NEW.ifn_function THEN
    -- Recompute all non-baseline PROs linked to procedures in this attendance
    PERFORM compute_clinical_outcome_for_pro(pro.id)
      FROM patient_reported_outcomes pro
      JOIN procedure_standard_records psr
        ON psr.id = pro.procedure_standard_record_id
     WHERE psr.attendance_id = NEW.attendance_id
       AND pro.timepoint != 'baseline';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_outcome_on_pathology_change ON attendance_pathology;
CREATE TRIGGER trg_clinical_outcome_on_pathology_change
  AFTER UPDATE ON attendance_pathology
  FOR EACH ROW
  EXECUTE FUNCTION trigger_fn_clinical_outcome_on_pathology_change();

-- ── 5. Backfill historical records ───────────────────────────────
-- Safe and idempotent: only processes rows with procedure linkage
-- and non-baseline timepoint. Missing EVA → classification stays null.

DO $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN
    SELECT id
      FROM patient_reported_outcomes
     WHERE timepoint != 'baseline'
       AND procedure_standard_record_id IS NOT NULL
  LOOP
    PERFORM compute_clinical_outcome_for_pro(v_id);
  END LOOP;
END;
$$;
