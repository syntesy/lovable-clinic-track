
-- Add retry_count to academy_paper_ingestion for tracking retries
ALTER TABLE public.academy_paper_ingestion 
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

-- Add raw_payload column for storing full API response
ALTER TABLE public.academy_paper_ingestion 
  ADD COLUMN IF NOT EXISTS raw_payload jsonb;

-- Add fulltext_structured column for canonical structured output
ALTER TABLE public.academy_paper_ingestion 
  ADD COLUMN IF NOT EXISTS fulltext_structured jsonb;

-- Add 'needs_input' status to paper_curation_status enum
ALTER TYPE public.paper_curation_status ADD VALUE IF NOT EXISTS 'needs_input' AFTER 'ingesting';

-- Add 'error' status to paper_curation_status enum
ALTER TYPE public.paper_curation_status ADD VALUE IF NOT EXISTS 'error' AFTER 'needs_input';
