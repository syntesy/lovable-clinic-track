-- Add category_code to curations for category-level curation fallback
ALTER TABLE public.curations 
ADD COLUMN category_code text REFERENCES public.therapy_categories(code) ON DELETE SET NULL;

-- Create index for category lookups
CREATE INDEX idx_curations_category_code ON public.curations(category_code);

-- Comment for documentation
COMMENT ON COLUMN public.curations.category_code IS 'FK to therapy_categories for category-level curation linkage';