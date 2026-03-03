-- Migration 0002: Academy Pipeline — Etapa 1 (Schema + Indices + RLS)
-- Rollback:
--   DROP TABLE IF EXISTS public.academy_review_task CASCADE;
--   DROP TABLE IF EXISTS public.academy_paper_ingestion CASCADE;
--   ALTER TABLE public.academy_papers DROP COLUMN IF EXISTS version, DROP COLUMN IF EXISTS locked_for_processing, DROP COLUMN IF EXISTS processing_started_at, DROP COLUMN IF EXISTS error_code;
--   ALTER TABLE public.academy_paper_curation DROP COLUMN IF EXISTS llm_input_hash, DROP COLUMN IF EXISTS llm_output_hash, DROP COLUMN IF EXISTS tokens_used, DROP COLUMN IF EXISTS cost_estimate_usd, DROP COLUMN IF EXISTS prompt_version, DROP COLUMN IF EXISTS model;
--   DROP INDEX IF EXISTS idx_academy_papers_unique_doi, idx_academy_papers_unique_pmid, idx_academy_papers_status, idx_academy_papers_created_at, idx_academy_papers_locked;

-- Applied via Lovable Cloud migrations (2 migrations due to partial rollback on enum error)
-- See supabase/migrations/ for actual applied SQL
