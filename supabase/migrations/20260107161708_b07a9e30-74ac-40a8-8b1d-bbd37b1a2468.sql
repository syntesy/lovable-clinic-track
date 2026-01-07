-- ============================================
-- Snapshots imutáveis para publicações
-- ============================================

CREATE TABLE IF NOT EXISTS public.research_export_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_code text UNIQUE NOT NULL, -- Ex: REGEN-2026-001
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  -- Dados do export
  export_log_id uuid REFERENCES public.registry_exports_log(id),
  export_hash text NOT NULL,
  view_name text NOT NULL DEFAULT 'registry_research_export_v1',
  view_version text NOT NULL,
  filters_json jsonb,
  row_count integer NOT NULL,
  
  -- Metadados para publicação
  title text, -- Nome do paper/estudo
  notes text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  doi text -- DOI do paper quando publicado
);

-- RLS
ALTER TABLE public.research_export_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: apenas admin/research podem criar e visualizar
CREATE POLICY "Snapshots read - admin/research"
ON public.research_export_snapshots
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'research')
);

CREATE POLICY "Snapshots insert - admin/research"
ON public.research_export_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'research')
);

-- Update apenas para marcar como publicado
CREATE POLICY "Snapshots update - admin only"
ON public.research_export_snapshots
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Impedir delete (imutável)
CREATE OR REPLACE FUNCTION public.prevent_snapshot_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'research_export_snapshots is immutable. DELETE not allowed.';
END;
$function$;

CREATE TRIGGER prevent_snapshot_delete
  BEFORE DELETE ON public.research_export_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_snapshot_delete();

-- Função para gerar código sequencial
CREATE OR REPLACE FUNCTION public.generate_snapshot_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year text;
  v_seq integer;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(snapshot_code, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM public.research_export_snapshots
  WHERE snapshot_code LIKE 'REGEN-' || v_year || '-%';
  
  RETURN 'REGEN-' || v_year || '-' || LPAD(v_seq::text, 3, '0');
END;
$function$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_snapshots_code ON public.research_export_snapshots(snapshot_code);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON public.research_export_snapshots(created_at DESC);

-- Comentários
COMMENT ON TABLE public.research_export_snapshots IS 
'Snapshots imutáveis de exports para publicações científicas.
Cada snapshot tem um código único (REGEN-YYYY-NNN) para citar em papers.';

COMMENT ON COLUMN public.research_export_snapshots.snapshot_code IS 
'Código citável: REGEN-YYYY-NNN (ex: REGEN-2026-001)';