-- Remove a constraint antiga e adiciona uma nova com os valores corretos
ALTER TABLE public.prp_screenings DROP CONSTRAINT IF EXISTS prp_screenings_classification_check;

ALTER TABLE public.prp_screenings ADD CONSTRAINT prp_screenings_classification_check 
CHECK (classification = ANY (ARRAY[
  'APTO'::text, 
  'APTO_COM_PREPARO'::text,
  'NAO_APTO'::text, 
  'NAO_APTO_PREPARO'::text, 
  'CONTRAINDICADO'::text,
  'INDEFINIDO'::text
]));