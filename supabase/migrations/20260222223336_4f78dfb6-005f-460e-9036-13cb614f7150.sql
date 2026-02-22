-- Enforce CONFIRMED stage validation at DB level
CREATE OR REPLACE FUNCTION public.validate_attendance_pathology_stage()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- SUSPECTED: force structural fields to NULL
  IF NEW.diagnosis_stage = 'SUSPECTED' THEN
    NEW.structural_grade := NULL;
    NEW.structural_group := NULL;
    NEW.imaging_method := NULL;
    NEW.tear_percentage := NULL;
    NEW.disc_level_enum := NULL;
    NEW.disc_location_enum := NULL;
    NEW.eva_pain := NULL;
    NEW.ifn_function := NULL;
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

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS trg_validate_attendance_pathology_stage ON public.attendance_pathology;
CREATE TRIGGER trg_validate_attendance_pathology_stage
  BEFORE INSERT OR UPDATE ON public.attendance_pathology
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_attendance_pathology_stage();