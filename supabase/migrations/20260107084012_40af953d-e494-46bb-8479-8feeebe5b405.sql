-- 1. Adicionar coluna base_component_category_code (nullable, default NULL)
ALTER TABLE public.therapy_items 
ADD COLUMN base_component_category_code TEXT DEFAULT NULL;

-- 2. Adicionar FK para garantir integridade referencial
ALTER TABLE public.therapy_items 
ADD CONSTRAINT therapy_items_base_component_fkey 
FOREIGN KEY (base_component_category_code) 
REFERENCES public.therapy_categories(code) 
ON DELETE RESTRICT 
ON UPDATE RESTRICT;

-- 3. Popular dados para itens híbridos (HYB_*)
UPDATE public.therapy_items 
SET base_component_category_code = 'autologous_biologic'
WHERE code IN ('HYB_PRP_HA', 'HYB_PRP_PN', 'HYB_PRP_COL');

-- Comentário documentando o campo
COMMENT ON COLUMN public.therapy_items.base_component_category_code IS 'Categoria do componente base para itens híbridos (ex: HYB_* têm base autóloga). NULL para itens não-híbridos.';