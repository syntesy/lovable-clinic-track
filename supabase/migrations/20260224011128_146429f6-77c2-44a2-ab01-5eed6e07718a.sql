
-- Add scan_suspected to academy_paper_files
ALTER TABLE public.academy_paper_files
  ADD COLUMN IF NOT EXISTS scan_suspected boolean DEFAULT false;
