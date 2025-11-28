-- Adicionar campo fototipo de pele à tabela patients
ALTER TABLE public.patients 
ADD COLUMN skin_phototype text;

-- Adicionar campo endereço à tabela patients
ALTER TABLE public.patients 
ADD COLUMN address text;

-- Criar tabela para registros clínicos (dados que eram do cadastro vão para cá)
CREATE TABLE public.clinical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  anamnesis text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela clinical_records
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for all users" ON public.clinical_records
FOR ALL USING (true);

-- Criar tabela para imagens de ultrassom
CREATE TABLE public.ultrasound_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  image_type text NOT NULL, -- Inicial, Controle, Pós-tratamento, Outro
  exam_date date NOT NULL,
  observations text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela ultrasound_images
ALTER TABLE public.ultrasound_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for all users" ON public.ultrasound_images
FOR ALL USING (true);

-- Criar tabela para imagens de termografia
CREATE TABLE public.thermography_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  exam_date date NOT NULL,
  evaluated_region text,
  observations text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela thermography_images
ALTER TABLE public.thermography_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for all users" ON public.thermography_images
FOR ALL USING (true);

-- Criar tabela para exames de sangue
CREATE TABLE public.blood_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  collection_date date NOT NULL,
  test_type text NOT NULL,
  observations text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela blood_tests
ALTER TABLE public.blood_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for all users" ON public.blood_tests
FOR ALL USING (true);

-- Criar tabela para termos de consentimento
CREATE TABLE public.consent_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela consent_forms
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for all users" ON public.consent_forms
FOR ALL USING (true);