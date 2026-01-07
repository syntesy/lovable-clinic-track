-- Adicionar campo therapy_item_code na tabela curations para vincular à taxonomia
ALTER TABLE public.curations 
ADD COLUMN therapy_item_code TEXT DEFAULT NULL;

-- Adicionar FK para garantir integridade
ALTER TABLE public.curations 
ADD CONSTRAINT curations_therapy_item_fkey 
FOREIGN KEY (therapy_item_code) 
REFERENCES public.therapy_items(code) 
ON DELETE SET NULL;

-- Comentário para documentar
COMMENT ON COLUMN public.curations.therapy_item_code IS 'Vínculo opcional com item da taxonomia de terapias. Permite filtrar curadorias por terapia/procedimento.';

-- Criar índice para buscas
CREATE INDEX idx_curations_therapy_item ON public.curations(therapy_item_code) WHERE therapy_item_code IS NOT NULL;