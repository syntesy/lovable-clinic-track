
-- Add text sufficiency fields to academy_paper_fulltext
ALTER TABLE public.academy_paper_fulltext
  ADD COLUMN IF NOT EXISTS word_count integer,
  ADD COLUMN IF NOT EXISTS chunk_count integer,
  ADD COLUMN IF NOT EXISTS has_sufficient_text boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_scanned boolean DEFAULT true;
