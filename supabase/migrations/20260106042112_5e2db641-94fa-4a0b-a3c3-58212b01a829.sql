-- ============================================================
-- REGENAPP Education / Academy
-- Migração 004: Storage bucket edu-assets + Policies
-- REGRA: Bucket PRIVADO | Isolamento por institution_id
-- ============================================================

-- ============================================================
-- 1) CRIAR BUCKET (PRIVADO)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'edu-assets',
  'edu-assets',
  false, -- PRIVADO
  52428800, -- 50MB max por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2) FUNÇÃO HELPER PARA EXTRAIR INSTITUTION_ID DO PATH
-- Criada no schema public pois storage não permite funções custom
-- ============================================================

CREATE OR REPLACE FUNCTION public.edu_storage_get_institution_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, edu, pg_temp
AS $$
DECLARE
  v_first_segment text;
  v_institution_id uuid;
BEGIN
  -- Extrair o primeiro segmento do path (antes da primeira /)
  v_first_segment := split_part(object_name, '/', 1);
  
  -- Tentar converter para UUID
  BEGIN
    v_institution_id := v_first_segment::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Se não for UUID válido, retornar NULL
    RETURN NULL;
  END;
  
  RETURN v_institution_id;
END;
$$;

-- ============================================================
-- 3) FUNÇÃO HELPER PARA VERIFICAR MEMBERSHIP EDU
-- ============================================================

CREATE OR REPLACE FUNCTION public.edu_storage_is_member(p_institution_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND status = 'active'
  )
$$;

-- ============================================================
-- 4) FUNÇÃO HELPER PARA VERIFICAR ROLE EDU PARA UPLOAD
-- ============================================================

CREATE OR REPLACE FUNCTION public.edu_storage_can_upload(p_institution_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND status = 'active'
      AND role IN ('teacher', 'director', 'institution_admin')
  )
$$;

-- ============================================================
-- 5) FUNÇÃO HELPER PARA VERIFICAR SE É INSTITUTION_ADMIN
-- ============================================================

CREATE OR REPLACE FUNCTION public.edu_storage_is_admin(p_institution_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND status = 'active'
      AND role = 'institution_admin'
  )
$$;

-- ============================================================
-- 6) POLICY: SELECT (download/visualização)
-- Permitir apenas para membros ativos da instituição do prefixo
-- ============================================================

CREATE POLICY "edu_assets_select_member"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'edu-assets'
  AND public.edu_storage_get_institution_id(name) IS NOT NULL
  AND public.edu_storage_is_member(
    public.edu_storage_get_institution_id(name),
    auth.uid()
  )
);

-- ============================================================
-- 7) POLICY: INSERT (upload)
-- Permitir apenas para teacher/director/institution_admin
-- Students NÃO podem fazer upload
-- ============================================================

CREATE POLICY "edu_assets_insert_staff"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'edu-assets'
  AND public.edu_storage_get_institution_id(name) IS NOT NULL
  AND public.edu_storage_can_upload(
    public.edu_storage_get_institution_id(name),
    auth.uid()
  )
);

-- ============================================================
-- 8) POLICY: UPDATE (overwrite)
-- PROIBIDO para TODOS - nenhum update permitido
-- ============================================================

CREATE POLICY "edu_assets_update_none"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'edu-assets'
  AND false -- Sempre nega
);

-- ============================================================
-- 9) POLICY: DELETE
-- Apenas institution_admin pode deletar
-- ============================================================

CREATE POLICY "edu_assets_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'edu-assets'
  AND public.edu_storage_get_institution_id(name) IS NOT NULL
  AND public.edu_storage_is_admin(
    public.edu_storage_get_institution_id(name),
    auth.uid()
  )
);

-- ============================================================
-- COMENTÁRIO FINAL:
-- Migração 004 cria bucket edu-assets PRIVADO + policies
-- Isolamento por prefixo institution_id/{...}
-- SELECT: membros ativos
-- INSERT: teacher/director/institution_admin
-- UPDATE: NINGUÉM
-- DELETE: institution_admin apenas
-- ============================================================