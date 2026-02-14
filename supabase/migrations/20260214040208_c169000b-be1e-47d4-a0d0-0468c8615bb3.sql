-- ETAPA 9.1 — Adicionar colunas para method tracking (SEM LÓGICA)

-- 1. protocols: adicionar method_template
ALTER TABLE public.protocols
ADD COLUMN method_template jsonb NULL;

-- 2. procedure_standard_records: adicionar method tracking columns
ALTER TABLE public.procedure_standard_records
ADD COLUMN method_run jsonb NULL,
ADD COLUMN method_deviation boolean NOT NULL DEFAULT false,
ADD COLUMN method_deviation_reason text NULL;