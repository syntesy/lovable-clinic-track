-- Garantir que FK tenha ON DELETE RESTRICT
-- Primeiro remover a FK existente e recriar com RESTRICT
ALTER TABLE public.therapy_items 
DROP CONSTRAINT IF EXISTS therapy_items_category_code_fkey;

ALTER TABLE public.therapy_items 
ADD CONSTRAINT therapy_items_category_code_fkey 
FOREIGN KEY (category_code) 
REFERENCES public.therapy_categories(code) 
ON DELETE RESTRICT 
ON UPDATE RESTRICT;

-- Adicionar comentários para documentar que são tabelas de referência (não PHI)
COMMENT ON TABLE public.therapy_categories IS 'Tabela de referência (taxonomia). Não contém dados de paciente (PHI). Somente leitura para usuários comuns.';
COMMENT ON TABLE public.therapy_items IS 'Tabela de referência (taxonomia). Não contém dados de paciente (PHI). Somente leitura para usuários comuns.';