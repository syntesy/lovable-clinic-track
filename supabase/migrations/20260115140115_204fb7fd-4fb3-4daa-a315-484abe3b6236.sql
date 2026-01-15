-- ============================================
-- TABELA DE SNAPSHOTS DE RELATÓRIOS (IMUTÁVEL)
-- Para auditoria e rastreabilidade jurídica
-- ============================================

-- Criar tabela de snapshots de relatórios
CREATE TABLE public.report_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    evaluation_id UUID NULL,
    patient_id UUID NOT NULL,
    user_id UUID NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    generator_version TEXT NOT NULL,
    report_hash TEXT NOT NULL,
    report_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas eficientes
CREATE INDEX idx_report_snapshots_evaluation_id ON public.report_snapshots(evaluation_id);
CREATE INDEX idx_report_snapshots_patient_id ON public.report_snapshots(patient_id);
CREATE INDEX idx_report_snapshots_user_id ON public.report_snapshots(user_id);
CREATE INDEX idx_report_snapshots_generated_at ON public.report_snapshots(generated_at);

-- Habilitar RLS
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Profissionais só veem snapshots de seus pacientes
CREATE POLICY "Users can view their own report snapshots"
ON public.report_snapshots
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Profissionais podem criar snapshots para seus pacientes
CREATE POLICY "Users can create their own report snapshots"
ON public.report_snapshots
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- IMPORTANTE: Snapshots são imutáveis - não há política de UPDATE ou DELETE
-- Isso garante integridade para auditoria

-- Comentários para documentação
COMMENT ON TABLE public.report_snapshots IS 'Snapshots imutáveis de relatórios para auditoria e rastreabilidade jurídica';
COMMENT ON COLUMN public.report_snapshots.report_hash IS 'SHA-256 hash do JSON do relatório para verificação de integridade';
COMMENT ON COLUMN public.report_snapshots.generator_version IS 'Versão do gerador de relatórios usado';
COMMENT ON COLUMN public.report_snapshots.report_json IS 'Conteúdo completo do relatório no momento da geração';