-- ============================================
-- PARTE 1: Adicionar role 'research' ao enum
-- ============================================
-- Verificar se já existe antes de adicionar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'research' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'research';
  END IF;
END $$;