-- Adicionar campo image_type na tabela session_images para categorizar as imagens
ALTER TABLE public.session_images
ADD COLUMN image_type text;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.session_images.image_type IS 'Tipo de imagem: ultrasound, thermography, blood_test, ou outros';