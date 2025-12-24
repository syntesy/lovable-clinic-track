-- Create enum for curadoria status
CREATE TYPE curadoria_status AS ENUM (
  'sem_curadoria',
  'solicitada',
  'em_analise',
  'em_producao',
  'disponivel',
  'indeferida'
);

-- Create table for curadoria articles (storing article metadata)
CREATE TABLE public.curadoria_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  year INTEGER NOT NULL,
  journal TEXT NOT NULL,
  interest TEXT NOT NULL CHECK (interest IN ('PRP', 'PRF', 'PPP', 'BMP', 'Outro')),
  tags TEXT[] DEFAULT '{}',
  doi TEXT,
  pubmed_url TEXT,
  pdf_url TEXT,
  status curadoria_status NOT NULL DEFAULT 'sem_curadoria',
  practice_change TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for curadoria content (the actual curadoria when available)
CREATE TABLE public.curadoria_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.curadoria_articles(id) ON DELETE CASCADE,
  summary TEXT,
  objective TEXT,
  methodology TEXT,
  main_results TEXT,
  clinical_applicability TEXT,
  limitations TEXT,
  evidence_level TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id)
);

-- Create table for curadoria requests
CREATE TABLE public.curadoria_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.curadoria_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interest TEXT NOT NULL CHECK (interest IN ('PRP', 'PRF', 'PPP', 'BMP', 'Outro')),
  purpose TEXT CHECK (purpose IN ('pratica_clinica', 'ensino', 'pesquisa')),
  comment TEXT,
  status curadoria_status NOT NULL DEFAULT 'solicitada',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curadoria_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curadoria_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curadoria_requests ENABLE ROW LEVEL SECURITY;

-- Policies for curadoria_articles (all authenticated users can read)
CREATE POLICY "All authenticated users can view curadoria articles"
ON public.curadoria_articles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert curadoria articles"
ON public.curadoria_articles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update curadoria articles"
ON public.curadoria_articles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete curadoria articles"
ON public.curadoria_articles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for curadoria_content (all authenticated users can read)
CREATE POLICY "All authenticated users can view curadoria content"
ON public.curadoria_content
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage curadoria content"
ON public.curadoria_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies for curadoria_requests
CREATE POLICY "Users can view their own curadoria requests"
ON public.curadoria_requests
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all curadoria requests"
ON public.curadoria_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create curadoria requests"
ON public.curadoria_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update curadoria requests"
ON public.curadoria_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_curadoria_articles_updated_at
BEFORE UPDATE ON public.curadoria_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_curadoria_content_updated_at
BEFORE UPDATE ON public.curadoria_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_curadoria_requests_updated_at
BEFORE UPDATE ON public.curadoria_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock articles
INSERT INTO public.curadoria_articles (id, title, authors, year, journal, interest, tags, status, practice_change, doi, pdf_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Platelet-Rich Plasma for Knee Osteoarthritis: A Systematic Review', 'Silva, M.J. et al.', 2023, 'Journal of Orthopaedic Research', 'PRP', ARRAY['osteoartrite', 'joelho', 'revisão sistemática', 'injeção intra-articular'], 'disponivel', 'PRP mostra superioridade ao ácido hialurônico em OA de joelho grau II-III.', '10.1002/jor.25123', 'https://example.com/article1.pdf'),
('22222222-2222-2222-2222-222222222222', 'Clinical Outcomes of Leukocyte-Rich vs Leukocyte-Poor PRP in Tendinopathies', 'Chen, L. et al.', 2024, 'American Journal of Sports Medicine', 'PRP', ARRAY['tendinopatia', 'leucócitos', 'comparativo'], 'sem_curadoria', 'LR-PRP pode ser mais eficaz em tendinopatias crônicas degenerativas.', '10.1177/0363546524', 'https://example.com/article2.pdf'),
('33333333-3333-3333-3333-333333333333', 'PRF Membranes in Periodontal Regeneration: A Meta-Analysis', 'Rodrigues, A.P. et al.', 2023, 'Clinical Oral Investigations', 'PRF', ARRAY['periodontia', 'regeneração', 'meta-análise', 'membrana'], 'disponivel', 'PRF acelera cicatrização em defeitos intraósseos periodontais.', '10.1007/s00784-023', 'https://example.com/article3.pdf'),
('44444444-4444-4444-4444-444444444444', 'Advanced PRF (A-PRF) vs Standard PRF in Bone Augmentation', 'Miron, R.J. et al.', 2022, 'Journal of Clinical Periodontology', 'PRF', ARRAY['A-PRF', 'aumento ósseo', 'implantes'], 'em_producao', 'A-PRF libera fatores de crescimento por período mais prolongado.', '10.1111/jcpe.13612', 'https://example.com/article4.pdf'),
('55555555-5555-5555-5555-555555555555', 'Platelet-Poor Plasma in Dermatological Applications', 'Kim, S.H. et al.', 2024, 'Dermatologic Surgery', 'PPP', ARRAY['dermatologia', 'rejuvenescimento', 'cicatrizes'], 'disponivel', 'PPP pode ser combinado com microagulhamento para potencializar resultados.', '10.1097/DSS.0000000123', 'https://example.com/article5.pdf'),
('66666666-6666-6666-6666-666666666666', 'PPP as a Scaffold for Growth Factor Delivery in Wound Healing', 'Martinez, C.L. et al.', 2023, 'Wound Repair and Regeneration', 'PPP', ARRAY['cicatrização', 'feridas crônicas', 'scaffold'], 'solicitada', 'PPP serve como veículo para liberação controlada de fatores de crescimento.', '10.1111/wrr.13045', 'https://example.com/article6.pdf'),
('77777777-7777-7777-7777-777777777777', 'BMP-2 in Spinal Fusion: Long-Term Outcomes and Safety Profile', 'Johnson, D.R. et al.', 2023, 'Spine Journal', 'BMP', ARRAY['coluna', 'fusão espinhal', 'BMP-2', 'segurança'], 'disponivel', 'BMP-2 apresenta taxa de fusão superior mas requer dosagem cuidadosa.', '10.1016/j.spinee.2023', 'https://example.com/article7.pdf'),
('88888888-8888-8888-8888-888888888888', 'Bone Morphogenetic Proteins in Non-Union Fractures: Current Evidence', 'Williams, P.T. et al.', 2024, 'Journal of Bone and Joint Surgery', 'BMP', ARRAY['pseudoartrose', 'fraturas', 'consolidação óssea'], 'sem_curadoria', 'BMPs podem reduzir tempo de consolidação em pseudoartroses refratárias.', '10.2106/JBJS.23.00456', 'https://example.com/article8.pdf');

-- Insert curadoria content for available articles
INSERT INTO public.curadoria_content (article_id, summary, objective, methodology, main_results, clinical_applicability, limitations, evidence_level) VALUES
('11111111-1111-1111-1111-111111111111', 
 'Esta revisão sistemática analisa a eficácia do PRP no tratamento da osteoartrite de joelho comparado a outras terapias.',
 'Avaliar a eficácia clínica do plasma rico em plaquetas (PRP) no tratamento da osteoartrite de joelho em comparação com placebo, ácido hialurônico e corticosteroides.',
 'Revisão sistemática com meta-análise de 28 ensaios clínicos randomizados (n=2.341 pacientes). Avaliação de desfechos: WOMAC, VAS, IKDC em 3, 6 e 12 meses.',
 'PRP demonstrou superioridade estatisticamente significativa sobre ácido hialurônico (SMD -0.84, IC 95% -1.12 a -0.56) e placebo (SMD -1.23, IC 95% -1.52 a -0.94) em 6 meses. Melhores resultados em OA grau II-III de Kellgren-Lawrence.',
 'Considerar PRP como primeira linha em OA de joelho grau II-III em pacientes candidatos a tratamento conservador. Protocolo sugerido: 3 aplicações com intervalo de 2-4 semanas.',
 'Heterogeneidade nos protocolos de preparação do PRP. Ausência de padronização de concentração plaquetária. Follow-up máximo de 12 meses na maioria dos estudos.',
 'Nível 1A - Meta-análise de ECRs'),
('33333333-3333-3333-3333-333333333333',
 'Meta-análise sobre o uso de membranas de PRF na regeneração de defeitos periodontais intraósseos.',
 'Determinar se a adição de PRF aos procedimentos regenerativos periodontais melhora os resultados clínicos em defeitos intraósseos.',
 'Meta-análise de 15 ECRs comparando procedimentos com e sem PRF. Desfechos primários: ganho de inserção clínica (CAL) e redução de profundidade de sondagem (PD).',
 'O uso de PRF resultou em ganho adicional de CAL de 1.2mm (IC 95% 0.8-1.6mm, p<0.001) e redução adicional de PD de 0.9mm (IC 95% 0.6-1.2mm, p<0.001).',
 'Incorporar PRF como adjuvante em procedimentos regenerativos periodontais, especialmente em defeitos intraósseos de 2-3 paredes. Custo-benefício favorável.',
 'Variabilidade nos protocolos de centrifugação. Diferentes designs de defeitos incluídos. Necessidade de estudos de longo prazo.',
 'Nível 1A - Meta-análise de ECRs'),
('55555555-5555-5555-5555-555555555555',
 'Estudo sobre aplicações dermatológicas do plasma pobre em plaquetas em procedimentos estéticos e regenerativos.',
 'Avaliar a eficácia do PPP isolado e em combinação com microagulhamento para rejuvenescimento facial e tratamento de cicatrizes.',
 'ECR duplo-cego com 120 pacientes divididos em 4 grupos: PPP, microagulhamento, PPP+microagulhamento e controle. Avaliação por biópsia, GAIS e satisfação do paciente em 3 e 6 meses.',
 'A combinação PPP+microagulhamento mostrou melhora significativa na textura (78% vs 45% microagulhamento isolado), densidade de colágeno (+34% vs +18%) e satisfação do paciente (4.2 vs 3.1 na escala GAIS).',
 'PPP pode ser utilizado como veículo tópico durante microagulhamento, potencializando resultados. Protocolo: 3-4 sessões mensais para rejuvenescimento.',
 'Tamanho amostral limitado. Ausência de comparação direta com PRP. Follow-up de apenas 6 meses.',
 'Nível 2B - ECR'),
('77777777-7777-7777-7777-777777777777',
 'Análise de longo prazo sobre segurança e eficácia do BMP-2 em fusão espinhal lombar.',
 'Avaliar desfechos clínicos e eventos adversos do uso de BMP-2 (rhBMP-2) em fusão espinhal lombar em seguimento de 5-10 anos.',
 'Estudo de coorte retrospectivo multicêntrico com 2.847 pacientes submetidos a fusão lombar com BMP-2. Análise de taxas de fusão, reoperação e complicações.',
 'Taxa de fusão radiográfica de 96.2% em 24 meses. Taxa de reoperação de 8.3% em 5 anos. Complicações relacionadas ao BMP-2: edema transitório (12%), ossificação heterotópica (4.2%), radiculite (2.1%).',
 'BMP-2 é eficaz para fusão lombar mas requer atenção à dosagem. Evitar em espaços confinados (PLIF). Preferir em ALIF e fusões posterolaterais. Dose recomendada: 1.0-1.5mg/cc.',
 'Desenho retrospectivo. Possível viés de seleção. Variabilidade nas técnicas cirúrgicas e indicações.',
 'Nível 3 - Coorte retrospectivo');