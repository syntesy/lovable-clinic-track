-- Adicionar 'patient' ao enum app_role (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'patient' AND enumtypid = 'public.app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'patient';
    END IF;
END$$;

-- Tabela de acesso do paciente ao portal
CREATE TABLE IF NOT EXISTS public.patient_portal_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_surname TEXT NOT NULL,
    cpf_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(patient_id)
);

-- Tabela de prescrições
CREATE TABLE IF NOT EXISTS public.patient_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prescription_type TEXT NOT NULL CHECK (prescription_type IN ('alimentar', 'medicamentosa', 'suplementar')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    notes TEXT,
    is_visible_to_patient BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar campo de visibilidade para paciente nos relatórios existentes
ALTER TABLE public.patient_evaluation_reports 
ADD COLUMN IF NOT EXISTS is_visible_to_patient BOOLEAN DEFAULT false;

-- Tabela de parceiros
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    product_type TEXT NOT NULL,
    website_url TEXT NOT NULL,
    coupon_code TEXT DEFAULT 'REGENAPP',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de eventos do paciente (tracking)
CREATE TABLE IF NOT EXISTS public.patient_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES auth.users(id),
    event_name TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies para patient_portal_access
CREATE POLICY "Professionals can manage their patients portal access"
ON public.patient_portal_access
FOR ALL
TO authenticated
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- RLS Policies para patient_prescriptions
CREATE POLICY "Professionals can manage their prescriptions"
ON public.patient_prescriptions
FOR ALL
TO authenticated
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- RLS Policies para partners (público para leitura)
CREATE POLICY "Anyone can view active partners"
ON public.partners
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage partners"
ON public.partners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para patient_events
CREATE POLICY "Professionals can view their patient events"
ON public.patient_events
FOR SELECT
TO authenticated
USING (professional_id = auth.uid());

CREATE POLICY "Anyone can insert patient events"
ON public.patient_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_patient_portal_access_updated_at
BEFORE UPDATE ON public.patient_portal_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_prescriptions_updated_at
BEFORE UPDATE ON public.patient_prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar limite de pacientes por plano
CREATE OR REPLACE FUNCTION public.check_patient_limit(user_id UUID)
RETURNS TABLE (
    current_plan TEXT,
    active_patients INTEGER,
    max_patients INTEGER,
    can_add_patient BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_count INTEGER;
    v_max INTEGER;
BEGIN
    -- Buscar plano do usuário
    SELECT s.current_plan INTO v_plan
    FROM public.subscriptions s
    WHERE s.user_id = check_patient_limit.user_id;
    
    -- Se não tem subscription, assume basic
    IF v_plan IS NULL THEN
        v_plan := 'basic';
    END IF;
    
    -- Contar pacientes ativos
    SELECT COUNT(*) INTO v_count
    FROM public.patient_portal_access ppa
    WHERE ppa.professional_id = check_patient_limit.user_id
    AND ppa.is_active = true;
    
    -- Definir limite baseado no plano
    CASE v_plan
        WHEN 'basic' THEN v_max := 0;
        WHEN 'premium' THEN v_max := 100;
        WHEN 'pro' THEN v_max := -1; -- ilimitado
        ELSE v_max := 0;
    END CASE;
    
    current_plan := v_plan;
    active_patients := v_count;
    max_patients := v_max;
    can_add_patient := (v_max = -1) OR (v_count < v_max);
    
    RETURN NEXT;
END;
$$;

-- Função para autenticar paciente
CREATE OR REPLACE FUNCTION public.authenticate_patient(p_surname TEXT, p_cpf TEXT)
RETURNS TABLE (
    patient_id UUID,
    patient_name TEXT,
    professional_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cpf_hash TEXT;
BEGIN
    -- Gerar hash do CPF
    v_cpf_hash := encode(sha256(p_cpf::bytea), 'hex');
    
    -- Buscar paciente com credenciais correspondentes
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        ppa.professional_id
    FROM public.patient_portal_access ppa
    JOIN public.patients p ON p.id = ppa.patient_id
    WHERE LOWER(ppa.login_surname) = LOWER(p_surname)
    AND ppa.cpf_hash = v_cpf_hash
    AND ppa.is_active = true;
    
    -- Atualizar último login se encontrado
    UPDATE public.patient_portal_access
    SET last_login_at = now()
    WHERE LOWER(login_surname) = LOWER(p_surname)
    AND cpf_hash = v_cpf_hash
    AND is_active = true;
END;
$$;

-- Inserir parceiros iniciais
INSERT INTO public.partners (name, product_type, website_url, description) VALUES
('VitaSupply', 'Suplementos', 'https://vitasupply.com.br', 'Suplementos e vitaminas premium'),
('OrtoBio', 'Ortobiológicos / PRP', 'https://ortobio.com.br', 'Insumos para terapias regenerativas'),
('MedNeedles', 'Agulhas', 'https://medneedles.com.br', 'Agulhas especializadas para procedimentos'),
('UltraMed', 'Ultrassom', 'https://ultramed.com.br', 'Equipamentos de ultrassonografia'),
('BioDescart', 'Descartáveis', 'https://biodescart.com.br', 'Materiais descartáveis hospitalares')
ON CONFLICT DO NOTHING;