-- Tabela de categorias de terapias biológicas
CREATE TABLE public.therapy_categories (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  risk_class TEXT NOT NULL CHECK (risk_class IN ('low', 'medium', 'high')),
  requires_score BOOLEAN NOT NULL DEFAULT false,
  requires_checklist BOOLEAN NOT NULL DEFAULT false,
  requires_curadoria BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de terapias biológicas
CREATE TABLE public.therapy_items (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_code TEXT NOT NULL REFERENCES public.therapy_categories(code),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.therapy_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_items ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (dados de referência)
CREATE POLICY "Therapy categories are readable by authenticated users"
ON public.therapy_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Therapy items are readable by authenticated users"
ON public.therapy_items FOR SELECT
TO authenticated
USING (true);

-- Inserir as 4 categorias oficiais
INSERT INTO public.therapy_categories (code, name, risk_class, requires_score, requires_checklist, requires_curadoria) VALUES
  ('autologous_biologic', 'Intervenções Biológicas Autólogas', 'high', true, true, true),
  ('bio_stimulator', 'Bioestimuladores Teciduais', 'medium', false, true, true),
  ('injectable_nutrition', 'Terapias Injetáveis Nutricionais / Metabólicas', 'low', false, false, false),
  ('neuromodulation_light', 'Neuromodulação leve', 'medium', false, true, true);

-- Inserir todos os itens de terapia
INSERT INTO public.therapy_items (code, name, category_code) VALUES
  -- Vitaminas
  ('VIT_B12', 'Vitamina B12', 'injectable_nutrition'),
  ('VIT_B1', 'Tiamina', 'injectable_nutrition'),
  ('VIT_B6', 'Piridoxina', 'injectable_nutrition'),
  ('VIT_B9', 'Ácido fólico', 'injectable_nutrition'),
  ('VIT_C', 'Ácido ascórbico', 'injectable_nutrition'),
  ('VIT_D', 'Colecalciferol', 'injectable_nutrition'),
  -- Minerais
  ('MIN_MG', 'Magnésio', 'injectable_nutrition'),
  ('MIN_ZN', 'Zinco', 'injectable_nutrition'),
  ('MIN_SE', 'Selênio', 'injectable_nutrition'),
  ('MIN_CR', 'Cromo', 'injectable_nutrition'),
  ('MIN_CA', 'Cálcio', 'injectable_nutrition'),
  -- Aminoácidos
  ('AA_GLN', 'Glutamina', 'injectable_nutrition'),
  ('AA_ARG', 'Arginina', 'injectable_nutrition'),
  ('AA_CAR', 'Carnitina', 'injectable_nutrition'),
  ('AA_TAU', 'Taurina', 'injectable_nutrition'),
  ('AA_GLY', 'Glicina', 'injectable_nutrition'),
  ('AA_BCAA', 'BCAA', 'injectable_nutrition'),
  -- Cofatores metabólicos
  ('COF_Q10', 'Coenzima Q10', 'injectable_nutrition'),
  ('COF_NAD', 'NAD+ / precursores', 'injectable_nutrition'),
  ('COF_ALA', 'Ácido alfa-lipóico', 'injectable_nutrition'),
  ('COF_GSH', 'Glutationa', 'injectable_nutrition'),
  -- Antioxidantes / moduladores
  ('ANT_CUR', 'Curcumina injetável', 'bio_stimulator'),
  ('ANT_RES', 'Resveratrol', 'bio_stimulator'),
  ('ANT_SIL', 'Silício orgânico', 'bio_stimulator'),
  -- Bioestimuladores
  ('BIO_PN', 'Polinucleotídeos (PN / PDRN)', 'bio_stimulator'),
  ('BIO_COL', 'Colágeno injetável', 'bio_stimulator'),
  ('BIO_HA', 'Ácido hialurônico', 'bio_stimulator'),
  -- Neuromodulação leve
  ('NEU_LID', 'Lidocaína (microdoses)', 'neuromodulation_light'),
  ('NEU_PRO', 'Procaína', 'neuromodulation_light'),
  ('NEU_B12', 'B12 para neuropatia', 'neuromodulation_light');

-- Índice para busca por categoria
CREATE INDEX idx_therapy_items_category ON public.therapy_items(category_code);