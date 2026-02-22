
-- ============================================================
-- 1) RASTREABILIDADE: confirmed_at, confirmed_by_professional_id
-- ============================================================

ALTER TABLE public.attendance_pathology
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS confirmed_by_professional_id UUID NULL;

-- ============================================================
-- 2) Update trigger: auto-fill traceability + immutability
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_attendance_pathology_stage()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- SUSPECTED: force structural fields + traceability to NULL
  IF NEW.diagnosis_stage = 'SUSPECTED' THEN
    NEW.structural_grade := NULL;
    NEW.structural_group := NULL;
    NEW.imaging_method := NULL;
    NEW.tear_percentage := NULL;
    NEW.disc_level_enum := NULL;
    NEW.disc_location_enum := NULL;
    NEW.eva_pain := NULL;
    NEW.ifn_function := NULL;
    NEW.confirmed_at := NULL;
    NEW.confirmed_by_professional_id := NULL;
    RETURN NEW;
  END IF;

  -- CONFIRMED: validate required fields
  IF NEW.diagnosis_stage = 'CONFIRMED' THEN
    -- EVA and IFN always required
    IF NEW.eva_pain IS NULL THEN
      RAISE EXCEPTION 'eva_pain is required for CONFIRMED diagnosis';
    END IF;
    IF NEW.ifn_function IS NULL THEN
      RAISE EXCEPTION 'ifn_function is required for CONFIRMED diagnosis';
    END IF;

    -- Auto-fill traceability on first confirmation
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.diagnosis_stage IS DISTINCT FROM 'CONFIRMED') THEN
      NEW.confirmed_at := now();
      NEW.confirmed_by_professional_id := auth.uid();
    END IF;

    -- Immutability: preserve traceability after confirmed
    IF TG_OP = 'UPDATE' AND OLD.diagnosis_stage = 'CONFIRMED' THEN
      NEW.confirmed_at := OLD.confirmed_at;
      NEW.confirmed_by_professional_id := OLD.confirmed_by_professional_id;
    END IF;

    -- Structural validation when model != NONE
    IF NEW.structural_model IS NOT NULL AND NEW.structural_model != 'NONE' THEN
      IF NEW.structural_grade IS NULL THEN
        RAISE EXCEPTION 'structural_grade is required for CONFIRMED diagnosis with structural model %', NEW.structural_model;
      END IF;
      IF NEW.imaging_method IS NULL THEN
        RAISE EXCEPTION 'imaging_method is required for CONFIRMED diagnosis with structural model %', NEW.structural_model;
      END IF;

      -- DISC_HERNIATION_TYPE specifics
      IF NEW.structural_model = 'DISC_HERNIATION_TYPE' THEN
        IF NEW.disc_level_enum IS NULL THEN
          RAISE EXCEPTION 'disc_level_enum is required for DISC_HERNIATION_TYPE';
        END IF;
        IF NEW.disc_location_enum IS NULL THEN
          RAISE EXCEPTION 'disc_location_enum is required for DISC_HERNIATION_TYPE';
        END IF;
        IF NEW.imaging_method != 'MRI' THEN
          RAISE EXCEPTION 'imaging_method must be MRI for DISC_HERNIATION_TYPE';
        END IF;
      END IF;
    ELSE
      -- NONE model: clear structural fields
      NEW.structural_grade := NULL;
      NEW.structural_group := NULL;
      NEW.imaging_method := NULL;
      NEW.tear_percentage := NULL;
      NEW.disc_level_enum := NULL;
      NEW.disc_location_enum := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 3) SAFETY NET: Block procedure without CONFIRMED diagnosis
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_procedure_requires_confirmed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_stage text;
BEGIN
  -- Only check if attendance_id is provided
  IF NEW.attendance_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT diagnosis_stage INTO v_stage
  FROM public.attendance_pathology
  WHERE attendance_id = NEW.attendance_id
  LIMIT 1;

  -- If no pathology record exists or not CONFIRMED, block
  IF v_stage IS DISTINCT FROM 'CONFIRMED' THEN
    RAISE EXCEPTION 'Diagnóstico precisa estar CONFIRMED para iniciar procedimento. Stage atual: %', COALESCE(v_stage, 'NENHUM');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_require_confirmed_diagnosis ON public.procedure_standard_records;
CREATE TRIGGER trg_require_confirmed_diagnosis
  BEFORE INSERT ON public.procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_procedure_requires_confirmed();

-- ============================================================
-- 4) PARTIAL INDEX for analytics performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_attendance_pathology_confirmed
  ON public.attendance_pathology (attendance_id)
  WHERE diagnosis_stage = 'CONFIRMED';

CREATE INDEX IF NOT EXISTS idx_attendance_pathology_confirmed_full
  ON public.attendance_pathology (pathology_id, structural_grade)
  WHERE diagnosis_stage = 'CONFIRMED';
