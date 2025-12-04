-- Drop existing reference_protocols table and recreate with new structure
DROP TABLE IF EXISTS reference_protocols;

CREATE TABLE public.reference_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostico TEXT NOT NULL,
  regiao TEXT NOT NULL,
  tipo_luz_1 TEXT,
  tempo_luz_1 INTEGER,
  tipo_luz_2 TEXT,
  tempo_luz_2 INTEGER,
  tipo_luz_3 TEXT,
  tempo_luz_3 INTEGER,
  tipo_luz_4 TEXT,
  tempo_luz_4 INTEGER,
  efeito_luz TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reference_protocols ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view reference protocols" 
ON public.reference_protocols 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert reference protocols" 
ON public.reference_protocols 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reference protocols" 
ON public.reference_protocols 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete reference protocols" 
ON public.reference_protocols 
FOR DELETE 
USING (auth.uid() IS NOT NULL);