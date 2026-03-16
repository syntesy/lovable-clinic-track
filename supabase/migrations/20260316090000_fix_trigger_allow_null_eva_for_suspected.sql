-- Fix: EVA, IFN and structural fields only required for CONFIRMED stage
CREATE OR REPLACE FUNCTION public.validate_attendance_pathology_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_model text;
  v_stage text;
BEGIN
  v_stage := COALESCE(NEW.diagnosis_stage, 'SUSPECTED');

  -- Get structural_model from pathology
  IF NEW.pathology_id IS NOT NULL THEN
    SELECT structural_model INTO v_model FROM public.pathologies WHERE id = NEW.pathology_id;
  ELSE
    v_model := 'NONE';
  END IF;

  NEW.structural_model := v_model;

  -- EVA and IFN are only required for CONFIRMED diagnosis
  IF v_stage = 'CONFIRMED' THEN
    IF NEW.eva_pain IS NULL THEN
      RAISE EXCEPTION 'eva_pain is required';
    END IF;
    IF NEW.ifn_function IS NULL THEN
      RAISE EXCEPTION 'ifn_function is required';
    END IF;
    IF NEW.eva_pain < 0 OR NEW.eva_pain > 10 THEN
      RAISE EXCEPTION 'eva_pain must be 0-10';
    END IF;
    IF NEW.ifn_function < 0 OR NEW.ifn_function > 10 THEN
      RAISE EXCEPTION 'ifn_function must be 0-10';
    END IF;
  ELSE
    -- For SUSPECTED: validate range only if provided
    IF NEW.eva_pain IS NOT NULL AND (NEW.eva_pain < 0 OR NEW.eva_pain > 10) THEN
      RAISE EXCEPTION 'eva_pain must be 0-10';
    END IF;
    IF NEW.ifn_function IS NOT NULL AND (NEW.ifn_function < 0 OR NEW.ifn_function > 10) THEN
      RAISE EXCEPTION 'ifn_function must be 0-10';
    END IF;
  END IF;

  -- Structural validation only for CONFIRMED
  IF v_stage != 'CONFIRMED' OR v_model = 'NONE' THEN
    IF v_model = 'NONE' THEN
      NEW.structural_grade := NULL;
      NEW.structural_group := NULL;
      NEW.imaging_method := NULL;
      NEW.tear_percentage := NULL;
      NEW.disc_level_enum := NULL;
      NEW.disc_location_enum := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- All non-NONE CONFIRMED models require structural_grade and imaging_method
  IF NEW.structural_grade IS NULL OR TRIM(NEW.structural_grade) = '' THEN
    RAISE EXCEPTION 'structural_grade is required for model %', v_model;
  END IF;
  IF NEW.imaging_method IS NULL OR TRIM(NEW.imaging_method) = '' THEN
    RAISE EXCEPTION 'imaging_method is required for model %', v_model;
  END IF;

  NEW.structural_grade := UPPER(TRIM(NEW.structural_grade));
  NEW.imaging_method := UPPER(TRIM(NEW.imaging_method));

  IF v_model = 'KELLGREN_LAWRENCE' THEN
    IF NEW.structural_grade NOT IN ('KL0','KL1','KL2','KL3','KL4') THEN
      RAISE EXCEPTION 'Invalid KL grade: %', NEW.structural_grade;
    END IF;
    IF NEW.imaging_method NOT IN ('XR','MRI') THEN
      RAISE EXCEPTION 'Invalid imaging_method for KL: %', NEW.imaging_method;
    END IF;
    NEW.structural_group := CASE
      WHEN NEW.structural_grade IN ('KL0','KL1') THEN 'LEVE'
      WHEN NEW.structural_grade = 'KL2' THEN 'MODERADA'
      WHEN NEW.structural_grade = 'KL3' THEN 'GRAVE'
      WHEN NEW.structural_grade = 'KL4' THEN 'GRAVE_PLUS'
    END;
    NEW.tear_percentage := NULL;
    NEW.disc_level_enum := NULL;
    NEW.disc_location_enum := NULL;

  ELSIF v_model = 'TENDON_STRUCTURAL_INTEGRITY' THEN
    IF NEW.structural_grade NOT IN ('GRADE_0','GRADE_I','GRADE_II','GRADE_III','GRADE_IV') THEN
      RAISE EXCEPTION 'Invalid tendon grade: %', NEW.structural_grade;
    END IF;
    IF NEW.imaging_method NOT IN ('US','MRI') THEN
      RAISE EXCEPTION 'Invalid imaging_method for tendon: %', NEW.imaging_method;
    END IF;
    IF NEW.structural_grade NOT IN ('GRADE_II','GRADE_III') THEN
      NEW.tear_percentage := NULL;
    END IF;
    IF NEW.tear_percentage IS NOT NULL AND (NEW.tear_percentage < 1 OR NEW.tear_percentage > 99) THEN
      RAISE EXCEPTION 'tear_percentage must be 1-99';
    END IF;
    NEW.structural_group := NULL;
    NEW.disc_level_enum := NULL;
    NEW.disc_location_enum := NULL;

  ELSIF v_model = 'MUSCLE_INJURY_GRADE' THEN
    IF NEW.structural_grade NOT IN ('GRADE_I','GRADE_II','GRADE_III') THEN
      RAISE EXCEPTION 'Invalid muscle grade: %', NEW.structural_grade;
    END IF;
    IF NEW.imaging_method NOT IN ('US','MRI') THEN
      RAISE EXCEPTION 'Invalid imaging_method for muscle: %', NEW.imaging_method;
    END IF;
    NEW.structural_group := NULL;
    NEW.tear_percentage := NULL;
    NEW.disc_level_enum := NULL;
    NEW.disc_location_enum := NULL;

  ELSIF v_model = 'DISC_HERNIATION_TYPE' THEN
    IF NEW.structural_grade NOT IN ('PROTRUSAO','EXTRUSAO','SEQUESTRO') THEN
      RAISE EXCEPTION 'Invalid disc grade: %', NEW.structural_grade;
    END IF;
    IF NEW.imaging_method != 'MRI' THEN
      RAISE EXCEPTION 'imaging_method must be MRI for disc herniation';
    END IF;
    IF NEW.disc_level_enum IS NULL OR TRIM(NEW.disc_level_enum) = '' THEN
      RAISE EXCEPTION 'disc_level_enum is required for disc herniation';
    END IF;
    NEW.disc_level_enum := UPPER(TRIM(NEW.disc_level_enum));
    IF NEW.disc_level_enum NOT IN ('L1_L2','L2_L3','L3_L4','L4_L5','L5_S1','C3_C4','C4_C5','C5_C6','C6_C7') THEN
      RAISE EXCEPTION 'Invalid disc_level_enum: %', NEW.disc_level_enum;
    END IF;
    IF NEW.disc_location_enum IS NULL OR TRIM(NEW.disc_location_enum) = '' THEN
      RAISE EXCEPTION 'disc_location_enum is required for disc herniation';
    END IF;
    NEW.disc_location_enum := UPPER(TRIM(NEW.disc_location_enum));
    IF NEW.disc_location_enum NOT IN ('CENTRAL','PARAMEDIANA','FORAMINAL','EXTRAFORAMINAL') THEN
      RAISE EXCEPTION 'Invalid disc_location_enum: %', NEW.disc_location_enum;
    END IF;
    NEW.structural_group := NULL;
    NEW.tear_percentage := NULL;
  END IF;

  RETURN NEW;
END;
$$;
