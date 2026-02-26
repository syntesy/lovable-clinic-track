
ALTER TABLE public.academy_paper_fulltext
  ADD COLUMN IF NOT EXISTS abstract TEXT,
  ADD COLUMN IF NOT EXISTS abstract_source TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS abstract_char_count INTEGER DEFAULT 0;
