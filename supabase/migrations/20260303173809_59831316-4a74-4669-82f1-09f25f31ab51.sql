
-- 1. Add job_id to academy_paper_ingestion for tracking async jobs
ALTER TABLE public.academy_paper_ingestion 
  ADD COLUMN IF NOT EXISTS job_id uuid DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_academy_paper_ingestion_job_id 
  ON public.academy_paper_ingestion (job_id) WHERE job_id IS NOT NULL;

-- 2. Add current_structured (jsonb) to academy_paper_fulltext as the canonical source of truth
ALTER TABLE public.academy_paper_fulltext 
  ADD COLUMN IF NOT EXISTS current_structured jsonb DEFAULT NULL;

-- 3. Add 'published' to paper_curation_status enum if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'published' AND enumtypid = 'public.paper_curation_status'::regtype) THEN
    ALTER TYPE public.paper_curation_status ADD VALUE 'published' AFTER 'ready';
  END IF;
END $$;

-- 4. Add 'needs_review' to paper_curation_status enum if not exists  
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'needs_review' AND enumtypid = 'public.paper_curation_status'::regtype) THEN
    ALTER TYPE public.paper_curation_status ADD VALUE 'needs_review' AFTER 'ready';
  END IF;
END $$;

-- 5. Add validation_report to academy_paper_curation
ALTER TABLE public.academy_paper_curation 
  ADD COLUMN IF NOT EXISTS validation_report jsonb DEFAULT NULL;
