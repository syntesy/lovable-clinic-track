-- Fix: allow characterization_json as alternative to structural_grade
-- When characterization_json is present, structural_grade is not required
CREATE OR REPLACE FUNCTION public.validate_attendance_pathology_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- === SUSPECTED: force structural/confirmed fields to NULL ===
  IF NEW.diagnosis_stage = 'SUSPECTED' THEN
    NEW.structural_grade := NULL;
    NEW.structural_group := NULL;
    NEW.imaging_method := NULL;
    NEW.eva_pain := NULL;
    NEW.ifn_function := NULL;
    NEW.tear_percentage := NULL;
    NEW.disc_level_enum := NULL;
    NEW.disc_location_enum := NULL;
    NEW.confirmed_at := NULL;
    NEW.confirmed_by_professional_id := NULL;
  END IF;

  -- === Transition to CONFIRMED: validate and set traceability ===
  IF NEW.diagnosis_stage = 'CONFIRMED'
     AND (OLD.diagnosis_stage IS NULL OR OLD.diagnosis_stage IS DISTINCT FROM 'CONFIRMED') THEN

    -- SECURITY: require authenticated user
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'CONFIRMED requires authenticated user';
    END IF;

    -- Validate EVA and IFN
    IF NEW.eva_pain IS NULL OR NEW.ifn_function IS NULL THEN
      RAISE EXCEPTION 'EVA and IFN are required for CONFIRMED diagnosis';
    END IF;

    -- Validate structural fields when model is not NONE
    -- Skip if characterization_json is provided (characterization system replaces structural_grade)
    IF NEW.structural_model IS DISTINCT FROM 'NONE' AND NEW.characterization_json IS NULL THEN
      IF NEW.structural_grade IS NULL THEN
        RAISE EXCEPTION 'structural_grade is required for CONFIRMED with structural model';
      END IF;
      IF NEW.imaging_method IS NULL THEN
        RAISE EXCEPTION 'imaging_method is required for CONFIRMED with structural model';
      END IF;
    END IF;

    -- Disc herniation specific validations (always required, no characterization alternative)
    IF NEW.structural_model = 'DISC_HERNIATION_TYPE' THEN
      IF NEW.disc_level_enum IS NULL OR NEW.disc_location_enum IS NULL THEN
        RAISE EXCEPTION 'disc_level_enum and disc_location_enum are required for DISC_HERNIATION_TYPE';
      END IF;
      IF NEW.imaging_method IS DISTINCT FROM 'MRI' THEN
        RAISE EXCEPTION 'imaging_method must be MRI for DISC_HERNIATION_TYPE';
      END IF;
    END IF;

    -- Set traceability fields
    NEW.confirmed_at := now();
    NEW.confirmed_by_professional_id := auth.uid();
  END IF;

  -- === Already CONFIRMED: make traceability fields immutable ===
  IF OLD.diagnosis_stage = 'CONFIRMED' AND NEW.diagnosis_stage = 'CONFIRMED' THEN
    NEW.confirmed_at := OLD.confirmed_at;
    NEW.confirmed_by_professional_id := OLD.confirmed_by_professional_id;
  END IF;

  RETURN NEW;
END;
$function$;
