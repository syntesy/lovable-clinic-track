
-- ═══════════════════════════════════════════════════════════
-- Etapa 5: Hard Validation + Observabilidade + Qualidade
-- ═══════════════════════════════════════════════════════════

-- 1. Fulltext versioning columns
ALTER TABLE public.academy_paper_fulltext
  ADD COLUMN IF NOT EXISTS structured_hash text,
  ADD COLUMN IF NOT EXISTS structured_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS source_route text;

-- 2. Auto-tags + evidence_anchors + structured_version_used on curation
ALTER TABLE public.academy_paper_curation
  ADD COLUMN IF NOT EXISTS auto_tags jsonb,
  ADD COLUMN IF NOT EXISTS evidence_anchors jsonb,
  ADD COLUMN IF NOT EXISTS structured_version_used integer;

-- 3. Attempt sequence on ingestion
ALTER TABLE public.academy_paper_ingestion
  ADD COLUMN IF NOT EXISTS attempt_sequence integer NOT NULL DEFAULT 1;

-- 4. Create function to auto-increment structured_version and compute hash
CREATE OR REPLACE FUNCTION public.update_fulltext_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.current_structured IS DISTINCT FROM OLD.current_structured THEN
    NEW.structured_version := COALESCE(OLD.structured_version, 0) + 1;
    NEW.structured_hash := encode(sha256(NEW.current_structured::text::bytea), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_fulltext_version ON public.academy_paper_fulltext;
CREATE TRIGGER trg_update_fulltext_version
  BEFORE UPDATE ON public.academy_paper_fulltext
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fulltext_version();

-- Also compute hash on insert
CREATE OR REPLACE FUNCTION public.init_fulltext_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.current_structured IS NOT NULL THEN
    NEW.structured_hash := encode(sha256(NEW.current_structured::text::bytea), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_init_fulltext_version ON public.academy_paper_fulltext;
CREATE TRIGGER trg_init_fulltext_version
  BEFORE INSERT ON public.academy_paper_fulltext
  FOR EACH ROW
  EXECUTE FUNCTION public.init_fulltext_version();
