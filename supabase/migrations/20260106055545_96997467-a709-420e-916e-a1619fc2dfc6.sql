-- Permitir que usuários autenticados acessem o schema edu via views public.*
-- (RLS nas tabelas edu.* continua sendo a barreira de acesso)

GRANT USAGE ON SCHEMA edu TO authenticated;

GRANT SELECT ON TABLE
  edu.institution_members,
  edu.institutions,
  edu.cohorts,
  edu.enrollments
TO authenticated;
