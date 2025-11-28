-- Criar tabela de pacientes
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Identificação
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  profession TEXT,
  sport_activity TEXT,
  
  -- Avaliação Clínica Inicial
  clinical_diagnosis TEXT,
  imaging_diagnosis TEXT,
  treated_region TEXT,
  symptoms_duration TEXT,
  
  -- Classificação da dor
  pain_type_nociceptive BOOLEAN DEFAULT false,
  pain_type_neuropathic BOOLEAN DEFAULT false,
  pain_type_nociplastic BOOLEAN DEFAULT false,
  
  previous_treatments TEXT,
  
  -- Escalas Baseline
  initial_vas NUMERIC(3,1) CHECK (initial_vas >= 0 AND initial_vas <= 10),
  initial_function NUMERIC(3,1) CHECK (initial_function >= 0 AND initial_function <= 10),
  initial_mobility NUMERIC(3,1) CHECK (initial_mobility >= 0 AND initial_mobility <= 10),
  specific_limitations TEXT,
  
  initial_images_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discharged')),
  
  -- Alta
  discharge_date DATE,
  final_vas NUMERIC(3,1) CHECK (final_vas >= 0 AND final_vas <= 10),
  final_function NUMERIC(3,1) CHECK (final_function >= 0 AND final_function <= 10),
  final_mobility NUMERIC(3,1) CHECK (final_mobility >= 0 AND final_mobility <= 10),
  total_sessions INTEGER,
  total_treatment_days INTEGER,
  final_outcome TEXT CHECK (final_outcome IN ('complete_resolution', 'significant_improvement', 'partial_improvement', 'no_response'))
);

-- Tabela de uploads/documentos dos pacientes
CREATE TABLE public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('consent_form', 'exam', 'clinical_report', 'initial_ultrasound')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de Protocolos MAC
CREATE TABLE public.mac_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Parâmetros da Luz
  light_type TEXT NOT NULL,
  wavelength NUMERIC NOT NULL,
  power NUMERIC NOT NULL,
  total_energy NUMERIC NOT NULL,
  fluence NUMERIC NOT NULL,
  irradiated_area NUMERIC NOT NULL,
  application_time NUMERIC NOT NULL,
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('continuous', 'pulsed')),
  frequency NUMERIC,
  distance_to_tissue NUMERIC,
  technique TEXT NOT NULL,
  estimated_depth NUMERIC,
  target_tissue TEXT NOT NULL,
  
  -- Fotossensibilizador
  uses_photosensitizer BOOLEAN DEFAULT false,
  photosensitizer_type TEXT,
  concentration NUMERIC,
  application_method TEXT,
  time_between_application_and_irradiation TEXT,
  
  -- Campos adicionais
  mac_time_per_session NUMERIC,
  accumulated_treatment_time NUMERIC,
  technical_observations TEXT,
  clinical_rationale TEXT
);

-- Tabela de Sessões/Evolução
CREATE TABLE public.treatment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  session_number INTEGER NOT NULL,
  
  -- Dados da sessão
  vas_on_day NUMERIC(3,1) CHECK (vas_on_day >= 0 AND vas_on_day <= 10),
  
  -- Técnicas adicionais
  used_epi BOOLEAN DEFAULT false,
  used_neuromodulation BOOLEAN DEFAULT false,
  used_infiltration BOOLEAN DEFAULT false,
  used_therapeutic_exercise BOOLEAN DEFAULT false,
  used_stretching BOOLEAN DEFAULT false,
  used_other_techniques BOOLEAN DEFAULT false,
  other_techniques_description TEXT,
  
  -- Registros clínicos
  session_description TEXT,
  clinical_observations TEXT,
  immediate_response TEXT,
  next_session_plan TEXT,
  
  -- Medidas
  improvement_percentage NUMERIC,
  function_score NUMERIC(3,1) CHECK (function_score >= 0 AND function_score <= 10),
  mobility_score NUMERIC(3,1) CHECK (mobility_score >= 0 AND mobility_score <= 10),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de imagens das sessões
CREATE TABLE public.session_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.treatment_sessions(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de Protocolos de Referência
CREATE TABLE public.reference_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  protocol_name TEXT NOT NULL,
  region TEXT NOT NULL,
  technique TEXT NOT NULL,
  wavelength TEXT NOT NULL,
  power TEXT NOT NULL,
  total_energy TEXT NOT NULL,
  fluence TEXT NOT NULL,
  application_time TEXT NOT NULL,
  irradiated_area TEXT NOT NULL,
  target_depth TEXT,
  uses_methylene_blue BOOLEAN DEFAULT false,
  methylene_blue_concentration TEXT,
  indications TEXT,
  observations TEXT,
  contraindications TEXT
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mac_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_protocols ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (público para simplificar - ajustar conforme necessário)
CREATE POLICY "Enable all operations for all users" ON public.patients FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.patient_documents FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.mac_protocols FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.treatment_sessions FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.session_images FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.reference_protocols FOR ALL USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patient_documents_patient_id ON public.patient_documents(patient_id);
CREATE INDEX idx_mac_protocols_patient_id ON public.mac_protocols(patient_id);
CREATE INDEX idx_treatment_sessions_patient_id ON public.treatment_sessions(patient_id);
CREATE INDEX idx_session_images_session_id ON public.session_images(session_id);