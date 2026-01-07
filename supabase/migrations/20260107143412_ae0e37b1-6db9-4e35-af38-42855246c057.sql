-- Add therapy_item_code to registry_procedures for taxonomy linkage
ALTER TABLE public.registry_procedures 
ADD COLUMN therapy_item_code text REFERENCES public.therapy_items(code) ON DELETE SET NULL;

-- Create index for lookups
CREATE INDEX idx_registry_procedures_therapy_item ON public.registry_procedures(therapy_item_code);

-- Comment for documentation
COMMENT ON COLUMN public.registry_procedures.therapy_item_code IS 'FK to therapy_items for taxonomy-based tracking';