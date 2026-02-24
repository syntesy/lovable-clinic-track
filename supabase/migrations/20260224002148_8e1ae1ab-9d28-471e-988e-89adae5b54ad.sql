
-- Campos faltantes no checklist
ALTER TABLE public.academy_papers ADD COLUMN IF NOT EXISTS curated_at TIMESTAMPTZ;
ALTER TABLE public.academy_papers ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN NOT NULL DEFAULT false;
