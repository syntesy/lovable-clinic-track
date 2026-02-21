
-- 1. Create protocol_status enum
CREATE TYPE public.protocol_status AS ENUM ('draft', 'active', 'archived');

-- 2. Add status column with default 'active' (to preserve existing data)
ALTER TABLE public.protocols ADD COLUMN status public.protocol_status NOT NULL DEFAULT 'active';

-- 3. Migrate existing data: is_active=true → 'active', is_active=false → 'draft'
UPDATE public.protocols SET status = CASE WHEN is_active = true THEN 'active'::protocol_status ELSE 'draft'::protocol_status END;

-- 4. Add UNIQUE constraint on (clinic_id, title) to prevent duplicates
ALTER TABLE public.protocols ADD CONSTRAINT protocols_clinic_title_unique UNIQUE (clinic_id, title);

-- 5. Add governance_action enum values for new audit events
-- (governance_action already exists, we need to add new values)
ALTER TYPE public.governance_action ADD VALUE IF NOT EXISTS 'PUBLISH';
ALTER TYPE public.governance_action ADD VALUE IF NOT EXISTS 'ARCHIVE';
ALTER TYPE public.governance_action ADD VALUE IF NOT EXISTS 'UPDATE_REFERENCE';
ALTER TYPE public.governance_action ADD VALUE IF NOT EXISTS 'VERSION_CREATED';

-- 6. Create trigger to block activation without evidence
CREATE OR REPLACE FUNCTION public.validate_protocol_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only check when transitioning TO 'active'
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    -- Check evidence_refs is not null and not empty array
    IF NEW.evidence_refs IS NULL OR 
       (jsonb_typeof(NEW.evidence_refs) = 'array' AND jsonb_array_length(NEW.evidence_refs) = 0) THEN
      RAISE EXCEPTION 'protocol_activation_blocked: Não é possível ativar protocolo sem pelo menos uma referência científica.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_protocol_activation
BEFORE UPDATE ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.validate_protocol_activation();

-- 7. Also validate on INSERT if status is 'active'
CREATE OR REPLACE FUNCTION public.validate_protocol_activation_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'active' THEN
    IF NEW.evidence_refs IS NULL OR 
       (jsonb_typeof(NEW.evidence_refs) = 'array' AND jsonb_array_length(NEW.evidence_refs) = 0) THEN
      RAISE EXCEPTION 'protocol_activation_blocked: Não é possível ativar protocolo sem pelo menos uma referência científica.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_protocol_activation_insert
BEFORE INSERT ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.validate_protocol_activation_insert();

-- 8. Keep is_active in sync with status for backward compatibility
CREATE OR REPLACE FUNCTION public.sync_protocol_is_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.is_active = (NEW.status = 'active');
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_sync_protocol_is_active
BEFORE INSERT OR UPDATE ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.sync_protocol_is_active();
