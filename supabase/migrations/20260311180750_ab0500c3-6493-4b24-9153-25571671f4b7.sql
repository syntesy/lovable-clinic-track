
-- TABELA 1: Fila de artigos para curadoria
CREATE TABLE IF NOT EXISTS public.academy_curation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pmid TEXT UNIQUE,
  doi TEXT,
  pmcid TEXT,
  title TEXT NOT NULL,
  abstract TEXT,
  authors JSONB DEFAULT '[]',
  journal TEXT,
  published_date DATE,
  full_text_type TEXT CHECK (full_text_type IN ('pmc_xml','pdf_upload','unpaywall_pdf','abstract_only')),
  full_text_url TEXT,
  pdf_storage_path TEXT,
  keywords TEXT[] DEFAULT '{}',
  source TEXT CHECK (source IN ('pubmed_auto','manual_upload','manual_doi')) DEFAULT 'manual_upload',
  status TEXT CHECK (status IN ('pending','processing','curated','rejected','error')) DEFAULT 'pending',
  error_message TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 2: Artigos curados e publicados
CREATE TABLE IF NOT EXISTS public.academy_curated_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID REFERENCES public.academy_curation_queue(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  authors JSONB DEFAULT '[]',
  journal TEXT,
  doi TEXT,
  published_date DATE,
  resumo_executivo TEXT,
  nivel_evidencia TEXT,
  tipo_estudo TEXT,
  aplicacao_clinica TEXT,
  metodologia_destaque TEXT,
  achados_principais TEXT,
  resultado_principal TEXT,
  limitacoes TEXT,
  conexoes_temas TEXT,
  score_relevancia NUMERIC(3,1) CHECK (score_relevancia >= 0 AND score_relevancia <= 10),
  score_breakdown JSONB DEFAULT '{}',
  classificacao TEXT CHECK (classificacao IN ('leitura_essencial','leitura_recomendada','leitura_opcional','referencia','contexto')),
  leitura_essencial BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  full_curation_markdown TEXT,
  source TEXT CHECK (source IN ('pmc','unpaywall','manual_upload','abstract_only')),
  visible_academy BOOLEAN DEFAULT TRUE,
  visible_reghen_feed BOOLEAN DEFAULT TRUE,
  curated_by_ai BOOLEAN DEFAULT TRUE,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 3: Keywords de busca configuráveis
CREATE TABLE IF NOT EXISTS public.academy_search_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  keyword_en TEXT,
  specialty TEXT,
  priority INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT TRUE,
  last_searched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 4: Log de execuções do agente automático
CREATE TABLE IF NOT EXISTS public.academy_agent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_type TEXT CHECK (run_type IN ('pubmed_scan','pmc_fetch','unpaywall','curate')),
  status TEXT CHECK (status IN ('success','error','partial')),
  articles_found INTEGER DEFAULT 0,
  articles_curated INTEGER DEFAULT 0,
  error_details TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_acq_status ON public.academy_curation_queue(status);
CREATE INDEX IF NOT EXISTS idx_acq_doi ON public.academy_curation_queue(doi);
CREATE INDEX IF NOT EXISTS idx_aca_score ON public.academy_curated_articles(score_relevancia DESC);
CREATE INDEX IF NOT EXISTS idx_aca_tags ON public.academy_curated_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_aca_visible ON public.academy_curated_articles(visible_academy, visible_reghen_feed);

-- RLS
ALTER TABLE public.academy_curation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_curated_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_search_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_agent_logs ENABLE ROW LEVEL SECURITY;

-- Policies: artigos curados visíveis para autenticados
CREATE POLICY "curated_articles_select_visible" ON public.academy_curated_articles
  FOR SELECT TO authenticated
  USING (visible_academy = TRUE);

-- Policies: admins podem gerenciar artigos curados
CREATE POLICY "curated_articles_all_for_admins" ON public.academy_curated_articles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: queue — owner ou admin
CREATE POLICY "queue_select_own_or_admin" ON public.academy_curation_queue
  FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "queue_insert_authenticated" ON public.academy_curation_queue
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "queue_update_admin" ON public.academy_curation_queue
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "queue_delete_admin" ON public.academy_curation_queue
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: keywords — leitura para autenticados, escrita para admins
CREATE POLICY "keywords_select_authenticated" ON public.academy_search_keywords
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "keywords_all_for_admins" ON public.academy_search_keywords
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: agent logs — leitura para admins
CREATE POLICY "agent_logs_select_admin" ON public.academy_agent_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "agent_logs_insert_admin" ON public.academy_agent_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
