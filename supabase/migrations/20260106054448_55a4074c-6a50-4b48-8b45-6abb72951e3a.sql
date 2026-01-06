
-- Criar views no schema public que expõem as tabelas edu necessárias para o frontend
-- Usando colunas EXATAS que existem nas tabelas

-- View para institution_members
CREATE OR REPLACE VIEW public.edu_institution_members AS
SELECT 
  id,
  institution_id,
  user_id,
  role::text as role,
  status::text as status,
  created_at,
  updated_at
FROM edu.institution_members;

-- View para institutions
CREATE OR REPLACE VIEW public.edu_institutions AS
SELECT 
  id,
  name,
  slug,
  status::text as status,
  created_at,
  updated_at
FROM edu.institutions;

-- View para cohorts (usa title, não name)
CREATE OR REPLACE VIEW public.edu_cohorts AS
SELECT 
  id,
  institution_id,
  program_id,
  title as name,
  status::text as status,
  created_at,
  updated_at
FROM edu.cohorts;

-- View para enrollments (sem enrolled_at e completed_at que não existem)
CREATE OR REPLACE VIEW public.edu_enrollments AS
SELECT 
  id,
  institution_id,
  cohort_id,
  user_id,
  status::text as status,
  created_at,
  updated_at
FROM edu.enrollments;

-- Habilitar RLS nas views (herdam do schema edu)
ALTER VIEW public.edu_institution_members SET (security_invoker = true);
ALTER VIEW public.edu_institutions SET (security_invoker = true);
ALTER VIEW public.edu_cohorts SET (security_invoker = true);
ALTER VIEW public.edu_enrollments SET (security_invoker = true);

-- Conceder acesso às views para authenticated users
GRANT SELECT ON public.edu_institution_members TO authenticated;
GRANT SELECT ON public.edu_institutions TO authenticated;
GRANT SELECT ON public.edu_cohorts TO authenticated;
GRANT SELECT ON public.edu_enrollments TO authenticated;
