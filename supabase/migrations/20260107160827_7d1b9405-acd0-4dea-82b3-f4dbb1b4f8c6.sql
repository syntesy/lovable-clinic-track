-- Adicionar campos de integridade e versionamento
ALTER TABLE public.registry_exports_log 
ADD COLUMN IF NOT EXISTS export_hash text;

ALTER TABLE public.registry_exports_log 
ADD COLUMN IF NOT EXISTS view_version text NOT NULL DEFAULT 'v1';

-- Documentar
COMMENT ON COLUMN public.registry_exports_log.export_hash IS 
'SHA256 do conteúdo exportado. Comprova integridade sem armazenar arquivo.';

COMMENT ON COLUMN public.registry_exports_log.view_version IS 
'Versão da view usada (v1, v2, etc). Derivado do nome ou explícito.';