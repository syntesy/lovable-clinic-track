
-- Add new source types for URL and PDF upload
ALTER TYPE public.paper_import_source ADD VALUE IF NOT EXISTS 'url';
ALTER TYPE public.paper_import_source ADD VALUE IF NOT EXISTS 'pdf_upload';

-- Add 'ingesting' status for the pipeline
ALTER TYPE public.paper_curation_status ADD VALUE IF NOT EXISTS 'ingesting' BEFORE 'draft';
