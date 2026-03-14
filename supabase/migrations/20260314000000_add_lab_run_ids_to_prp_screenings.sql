-- Adiciona rastreabilidade entre análises de exames (lab_analysis_runs)
-- e triagens (prp_screenings).
--
-- lab_run_ids: array de UUIDs dos runs de análise que geraram os labs
-- do screening. Permite auditoria, reprocessamento e debug de scores.

ALTER TABLE prp_screenings
  ADD COLUMN IF NOT EXISTS lab_run_ids uuid[] DEFAULT '{}';

COMMENT ON COLUMN prp_screenings.lab_run_ids IS
  'IDs dos runs em lab_analysis_runs que originaram os labs deste screening. '
  'Array para suportar múltiplos PDFs (hemograma + bioquímica separados).';

-- Índice GIN para consultas do tipo: WHERE lab_run_ids @> ARRAY['uuid']
CREATE INDEX IF NOT EXISTS idx_prp_screenings_lab_run_ids
  ON prp_screenings USING GIN (lab_run_ids);
