-- Create curation_jobs table for tracking AI generation jobs
CREATE TABLE public.curation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.curadoria_articles(id) ON DELETE CASCADE,
  curation_id UUID REFERENCES public.curations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for curation_jobs
CREATE POLICY "Authenticated users can view curation jobs"
  ON public.curation_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert curation jobs"
  ON public.curation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update curation jobs"
  ON public.curation_jobs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add missing columns to curations table if not exists
DO $$ 
BEGIN
  -- Add generated_by column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'curations' AND column_name = 'generated_by') THEN
    ALTER TABLE public.curations ADD COLUMN generated_by TEXT DEFAULT 'ai' CHECK (generated_by IN ('ai', 'human'));
  END IF;

  -- Add ai_notes column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'curations' AND column_name = 'ai_notes') THEN
    ALTER TABLE public.curations ADD COLUMN ai_notes TEXT;
  END IF;

  -- Add ai_coverage column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'curations' AND column_name = 'ai_coverage') THEN
    ALTER TABLE public.curations ADD COLUMN ai_coverage TEXT CHECK (ai_coverage IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Create index for faster job lookups
CREATE INDEX idx_curation_jobs_article_status ON public.curation_jobs(article_id, status);
CREATE INDEX idx_curation_jobs_status ON public.curation_jobs(status);

-- Enable realtime for curation_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.curation_jobs;