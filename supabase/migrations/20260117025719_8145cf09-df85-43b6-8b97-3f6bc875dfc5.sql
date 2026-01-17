-- 1. Criar tabela de taxonomias clínicas oficiais
CREATE TABLE public.clinical_taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de associação mentor-taxonomia
CREATE TABLE public.mentor_taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  taxonomy_id UUID NOT NULL REFERENCES public.clinical_taxonomies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mentor_id, taxonomy_id)
);

-- 3. Criar tabela de checklist de curadoria científica (apenas admin)
CREATE TABLE public.mentor_curation_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE UNIQUE,
  formation_compatible BOOLEAN DEFAULT false,
  clinical_experience_verified BOOLEAN DEFAULT false,
  evidence_based_alignment BOOLEAN DEFAULT false,
  ethical_compliance BOOLEAN DEFAULT false,
  language_adequate BOOLEAN DEFAULT false,
  curator_notes TEXT,
  curated_by UUID REFERENCES auth.users(id),
  curated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Adicionar campo has_curation_seal ao mentors
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS has_curation_seal BOOLEAN DEFAULT false;

-- 5. Inserir taxonomias oficiais iniciais
INSERT INTO public.clinical_taxonomies (code, name, description, display_order) VALUES
  ('prp_hemoderivados', 'PRP e Hemoderivados', 'Plasma Rico em Plaquetas e derivados sanguíneos autólogos', 1),
  ('terapias_celulares', 'Terapias Celulares', 'Células-tronco mesenquimais e terapias baseadas em células', 2),
  ('dor_cronica', 'Dor Crônica e Neuropática', 'Manejo de dor crônica e condições neuropáticas', 3),
  ('ortopedia_regenerativa', 'Ortopedia Regenerativa', 'Tratamentos regenerativos para condições ortopédicas', 4),
  ('coluna_vertebral', 'Coluna Vertebral', 'Intervenções regenerativas na coluna', 5),
  ('medicina_esportiva', 'Medicina Esportiva Regenerativa', 'Tratamentos regenerativos para atletas e lesões esportivas', 6),
  ('intervencionismo_imagem', 'Intervencionismo Guiado por Imagem', 'Procedimentos guiados por ultrassom, fluoroscopia ou tomografia', 7);

-- 6. Enable RLS
ALTER TABLE public.clinical_taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_curation_checklists ENABLE ROW LEVEL SECURITY;

-- 7. Função helper para verificar se mentor tem selo
CREATE OR REPLACE FUNCTION public.mentor_has_valid_seal(mentor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.mentors m
    JOIN public.mentor_curation_checklists c ON c.mentor_id = m.id
    WHERE m.id = mentor_has_valid_seal.mentor_id
      AND m.status = 'approved'
      AND m.has_curation_seal = true
      AND c.formation_compatible = true
      AND c.clinical_experience_verified = true
      AND c.evidence_based_alignment = true
      AND c.ethical_compliance = true
      AND c.language_adequate = true
  );
$$;

-- 8. Função helper para verificar se mentor tem taxonomias
CREATE OR REPLACE FUNCTION public.mentor_has_taxonomies(mentor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.mentor_taxonomies
    WHERE mentor_id = mentor_has_taxonomies.mentor_id
  );
$$;

-- 9. RLS Policies para clinical_taxonomies
-- Todos podem ver taxonomias ativas
CREATE POLICY "Anyone can view active taxonomies"
ON public.clinical_taxonomies
FOR SELECT
USING (is_active = true);

-- Apenas admin pode gerenciar taxonomias
CREATE POLICY "Admins can manage taxonomies"
ON public.clinical_taxonomies
FOR ALL
TO authenticated
USING (public.is_edu_admin(auth.uid()))
WITH CHECK (public.is_edu_admin(auth.uid()));

-- 10. RLS Policies para mentor_taxonomies
-- Mentores podem ver suas próprias associações
CREATE POLICY "Mentors can view own taxonomies"
ON public.mentor_taxonomies
FOR SELECT
TO authenticated
USING (
  mentor_id IN (
    SELECT id FROM public.mentors WHERE user_id = auth.uid()
  )
  OR public.is_edu_admin(auth.uid())
);

-- Mentores podem gerenciar suas próprias associações
CREATE POLICY "Mentors can manage own taxonomies"
ON public.mentor_taxonomies
FOR INSERT
TO authenticated
WITH CHECK (
  mentor_id IN (
    SELECT id FROM public.mentors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Mentors can delete own taxonomies"
ON public.mentor_taxonomies
FOR DELETE
TO authenticated
USING (
  mentor_id IN (
    SELECT id FROM public.mentors WHERE user_id = auth.uid()
  )
);

-- Admin pode gerenciar todas as associações
CREATE POLICY "Admins can manage all mentor taxonomies"
ON public.mentor_taxonomies
FOR ALL
TO authenticated
USING (public.is_edu_admin(auth.uid()))
WITH CHECK (public.is_edu_admin(auth.uid()));

-- 11. RLS Policies para mentor_curation_checklists (APENAS ADMIN)
-- Apenas admin pode ver checklists
CREATE POLICY "Only admins can view curation checklists"
ON public.mentor_curation_checklists
FOR SELECT
TO authenticated
USING (public.is_edu_admin(auth.uid()));

-- Apenas admin pode gerenciar checklists
CREATE POLICY "Only admins can manage curation checklists"
ON public.mentor_curation_checklists
FOR ALL
TO authenticated
USING (public.is_edu_admin(auth.uid()))
WITH CHECK (public.is_edu_admin(auth.uid()));

-- 12. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinical_taxonomies_updated_at
BEFORE UPDATE ON public.clinical_taxonomies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_curation_checklists_updated_at
BEFORE UPDATE ON public.mentor_curation_checklists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();