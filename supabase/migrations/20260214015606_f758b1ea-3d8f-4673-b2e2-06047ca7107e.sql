
-- =======================================================================
-- ETAPA 4: Vinculação obrigatória de protocolo em procedure_standard_records
-- =======================================================================

-- 1) SET NOT NULL (no existing records, safe to apply directly)
ALTER TABLE procedure_standard_records
  ALTER COLUMN protocol_id SET NOT NULL;

ALTER TABLE procedure_standard_records
  ALTER COLUMN protocol_version_id SET NOT NULL;

-- 2) Trigger: auto-set protocol_version_id on INSERT
CREATE OR REPLACE FUNCTION public.auto_set_protocol_version()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_latest_version uuid;
BEGIN
  -- Only auto-set on INSERT, and only if not explicitly provided
  IF TG_OP = 'INSERT' AND (NEW.protocol_version_id IS NULL) THEN
    SELECT id
    INTO v_latest_version
    FROM protocol_versions
    WHERE protocol_id = NEW.protocol_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_latest_version IS NULL THEN
      RAISE EXCEPTION 'Protocol % has no versions', NEW.protocol_id;
    END IF;

    NEW.protocol_version_id := v_latest_version;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_protocol_version
  BEFORE INSERT ON procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_protocol_version();

-- 3) Trigger: prevent inactive protocol usage
CREATE OR REPLACE FUNCTION public.prevent_inactive_protocol_psr()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM protocols
    WHERE id = NEW.protocol_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot use inactive protocol (id: %)', NEW.protocol_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_inactive_protocol
  BEFORE INSERT OR UPDATE ON procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_inactive_protocol_psr();

-- 4) Trigger: prevent finalization without completed checklist
CREATE OR REPLACE FUNCTION public.prevent_finalize_without_checklist()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.clinical_standard_status = 'completed'
     AND NEW.safety_checklist_status <> 'COMPLETED' THEN
    RAISE EXCEPTION 'Cannot finalize procedure without completed safety checklist';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_finalize_without_checklist
  BEFORE UPDATE ON procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_finalize_without_checklist();
