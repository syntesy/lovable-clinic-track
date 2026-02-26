
-- Add missing columns to academy_paper_files
ALTER TABLE public.academy_paper_files 
  ADD COLUMN IF NOT EXISTS file_hash TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Unique partial index on file_hash for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_academy_paper_files_file_hash 
  ON public.academy_paper_files (file_hash) 
  WHERE file_hash IS NOT NULL;

-- Index on processing_status
CREATE INDEX IF NOT EXISTS idx_academy_paper_files_processing_status 
  ON public.academy_paper_files (processing_status);

-- Add request_id to academy_ai_logs
ALTER TABLE public.academy_ai_logs 
  ADD COLUMN IF NOT EXISTS request_id TEXT;
