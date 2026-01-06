-- ============================================================
-- REGENAPP Education / Academy
-- Migração 004b: PATCH - Mover helpers de public.* para edu.*
-- REGRA: Zero funções Education em public.*
-- ============================================================

-- ============================================================
-- 1) CRIAR FUNÇÕES EQUIVALENTES EM edu.*
-- ============================================================

-- 1.1) edu.edu_storage_get_institution_id
CREATE OR REPLACE FUNCTION edu.edu_storage_get_institution_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
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

-- 1.2) edu.edu_storage_is_member
CREATE OR REPLACE FUNCTION edu.edu_storage_is_member(p_institution_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND status = 'active'
  )
$$;

-- 1.3) edu.edu_storage_can_upload
CREATE OR REPLACE FUNCTION edu.edu_storage_can_upload(p_institution_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM edu.institution_members
    WHERE institution_id = p_institution_id
      AND user_id = p_user_id
      AND status = 'active'
      AND role IN ('teacher', 'director', 'institution_admin')
  )
$$;

-- 1.4) edu.edu_storage_is_admin
CREATE OR REPLACE FUNCTION edu.edu_storage_is_admin(p_institution_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = edu, pg_temp
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
-- 2) REMOVER POLICIES ANTIGAS E RECRIAR COM edu.*
-- ============================================================

-- 2.1) DROP policies antigas
DROP POLICY IF EXISTS "edu_assets_select_member" ON storage.objects;
DROP POLICY IF EXISTS "edu_assets_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "edu_assets_update_none" ON storage.objects;
DROP POLICY IF EXISTS "edu_assets_delete_admin" ON storage.objects;

-- 2.2) RECRIAR SELECT usando edu.*
CREATE POLICY "edu_assets_select_member"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'edu-assets'
  AND edu.edu_storage_get_institution_id(name) IS NOT NULL
  AND edu.edu_storage_is_member(
    edu.edu_storage_get_institution_id(name),
    auth.uid()
  )
);

-- 2.3) RECRIAR INSERT usando edu.*
CREATE POLICY "edu_assets_insert_staff"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'edu-assets'
  AND edu.edu_storage_get_institution_id(name) IS NOT NULL
  AND edu.edu_storage_can_upload(
    edu.edu_storage_get_institution_id(name),
    auth.uid()
  )
);

-- 2.4) RECRIAR UPDATE (bloqueado)
CREATE POLICY "edu_assets_update_none"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'edu-assets'
  AND false
);

-- 2.5) RECRIAR DELETE usando edu.*
CREATE POLICY "edu_assets_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'edu-assets'
  AND edu.edu_storage_get_institution_id(name) IS NOT NULL
  AND edu.edu_storage_is_admin(
    edu.edu_storage_get_institution_id(name),
    auth.uid()
  )
);

-- ============================================================
-- 3) REMOVER FUNÇÕES DE public.* (LIMPEZA)
-- ============================================================

DROP FUNCTION IF EXISTS public.edu_storage_get_institution_id(text);
DROP FUNCTION IF EXISTS public.edu_storage_is_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.edu_storage_can_upload(uuid, uuid);
DROP FUNCTION IF EXISTS public.edu_storage_is_admin(uuid, uuid);

-- ============================================================
-- COMENTÁRIO FINAL:
-- PATCH 004b: Funções helper movidas de public.* para edu.*
-- Policies atualizadas para usar edu.*
-- Funções public.edu_storage_* removidas
-- Nenhum objeto do core clínico foi alterado.
-- ============================================================