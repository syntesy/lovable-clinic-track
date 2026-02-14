
-- ============================================================
-- Criar trigger para definir clinic_id automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION set_psr_clinic_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_clinic_id uuid;
BEGIN
  -- Se clinic_id não foi fornecido, obter de attendance_sessions
  IF NEW.clinic_id IS NULL AND NEW.attendance_id IS NOT NULL THEN
    SELECT clinics.id
    INTO v_clinic_id
    FROM clinics
    JOIN attendance_sessions ON attendance_sessions.user_id = clinics.owner_user_id
    WHERE attendance_sessions.id = NEW.attendance_id
    LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
      NEW.clinic_id := v_clinic_id;
    ELSE
      RAISE EXCEPTION 'Cannot determine clinic_id from attendance_id';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_psr_clinic_id ON procedure_standard_records;

CREATE TRIGGER trigger_set_psr_clinic_id
BEFORE INSERT ON procedure_standard_records
FOR EACH ROW
EXECUTE FUNCTION set_psr_clinic_id();
