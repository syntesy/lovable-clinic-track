-- =========================================================
-- REGENAPP CAREER ENGINE™ - Database Schema
-- Camada downstream, read-only sobre dados clínicos
-- Write-only sobre suas próprias tabelas
-- =========================================================

-- 1. career_metrics - Métricas calculadas periodicamente
CREATE TABLE public.career_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM
  metric_type TEXT NOT NULL, -- 'scientific_adherence', 'registry_completeness', 'followup_rate', etc.
  value NUMERIC NOT NULL DEFAULT 0,
  percentile NUMERIC, -- percentil anônimo em relação a todos os profissionais
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT career_metrics_period_format CHECK (period ~ '^\d{4}-\d{2}$')
);

-- 2. career_trends - Tendências temporais
CREATE TABLE public.career_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  trend_direction TEXT NOT NULL DEFAULT 'stable', -- 'increasing', 'decreasing', 'stable'
  trend_value NUMERIC DEFAULT 0,
  baseline_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. career_certifications - Certificações por trajetória
CREATE TABLE public.career_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certification_type TEXT NOT NULL, -- 'longitudinal_practice', 'scientific_excellence', 'registry_champion'
  certification_level TEXT NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  criteria_met JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. career_alerts - Alertas educativos privados
CREATE TABLE public.career_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'low_followup', 'incomplete_registry', 'opportunity', etc.
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'attention'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. career_opportunities - Sugestões de oportunidades
CREATE TABLE public.career_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  opportunity_type TEXT NOT NULL, -- 'research', 'course', 'collaboration', 'publication'
  title TEXT NOT NULL,
  description TEXT,
  relevance_score NUMERIC DEFAULT 0,
  is_viewed BOOLEAN DEFAULT false,
  is_interested BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. career_case_complexity - Índice de complexidade dos casos
CREATE TABLE public.career_case_complexity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'complexity_index',
  total_cases INTEGER DEFAULT 0,
  unique_diagnoses INTEGER DEFAULT 0,
  red_flags_count INTEGER DEFAULT 0,
  complexity_score NUMERIC DEFAULT 0,
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. career_consistency_index - Índice de coerência profissional
CREATE TABLE public.career_consistency_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'consistency_index',
  protocol_variance NUMERIC DEFAULT 0,
  technique_diversity NUMERIC DEFAULT 0,
  consistency_score NUMERIC DEFAULT 0,
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. career_narratives - Narrativas de evolução
CREATE TABLE public.career_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'narrative',
  narrative_type TEXT NOT NULL, -- 'monthly_summary', 'milestone', 'achievement'
  title TEXT NOT NULL,
  content TEXT,
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. career_access_logs - Logs de acesso ao Career Engine
CREATE TABLE public.career_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'view_dashboard', 'download_certificate', 'dismiss_alert'
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =========================================================
-- RLS POLICIES - Isolamento total por user_id
-- =========================================================

-- career_metrics
ALTER TABLE public.career_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career metrics"
  ON public.career_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career metrics"
  ON public.career_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career metrics"
  ON public.career_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- career_trends
ALTER TABLE public.career_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career trends"
  ON public.career_trends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career trends"
  ON public.career_trends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- career_certifications
ALTER TABLE public.career_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certifications"
  ON public.career_certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certifications"
  ON public.career_certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- career_alerts
ALTER TABLE public.career_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career alerts"
  ON public.career_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career alerts"
  ON public.career_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career alerts"
  ON public.career_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- career_opportunities
ALTER TABLE public.career_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own opportunities"
  ON public.career_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own opportunities"
  ON public.career_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunities"
  ON public.career_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

-- career_case_complexity
ALTER TABLE public.career_case_complexity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own case complexity"
  ON public.career_case_complexity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own case complexity"
  ON public.career_case_complexity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- career_consistency_index
ALTER TABLE public.career_consistency_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consistency index"
  ON public.career_consistency_index FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consistency index"
  ON public.career_consistency_index FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- career_narratives
ALTER TABLE public.career_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own narratives"
  ON public.career_narratives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own narratives"
  ON public.career_narratives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- career_access_logs
ALTER TABLE public.career_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access logs"
  ON public.career_access_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access logs"
  ON public.career_access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- INDEXES for performance
-- =========================================================

CREATE INDEX idx_career_metrics_user_period ON public.career_metrics(user_id, period);
CREATE INDEX idx_career_metrics_type ON public.career_metrics(metric_type);
CREATE INDEX idx_career_trends_user_period ON public.career_trends(user_id, period);
CREATE INDEX idx_career_alerts_user_unread ON public.career_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_career_certifications_user ON public.career_certifications(user_id);
CREATE INDEX idx_career_complexity_user_period ON public.career_case_complexity(user_id, period);
CREATE INDEX idx_career_consistency_user_period ON public.career_consistency_index(user_id, period);

-- =========================================================
-- FUNCTION: Update timestamp trigger
-- =========================================================

CREATE OR REPLACE FUNCTION public.career_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER career_metrics_updated_at
  BEFORE UPDATE ON public.career_metrics
  FOR EACH ROW EXECUTE FUNCTION public.career_update_updated_at();