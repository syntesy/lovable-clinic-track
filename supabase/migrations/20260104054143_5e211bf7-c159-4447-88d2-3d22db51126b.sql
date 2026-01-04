-- =========================================================
-- CAREER ENGINE™ - Constraints de Unicidade e DELETE policies
-- =========================================================

-- 1. Adicionar constraints de unicidade para idempotência
CREATE UNIQUE INDEX IF NOT EXISTS idx_career_metrics_unique 
  ON public.career_metrics(user_id, period, metric_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_career_trends_unique 
  ON public.career_trends(user_id, period, metric_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_career_complexity_unique 
  ON public.career_case_complexity(user_id, period, metric_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_career_consistency_unique 
  ON public.career_consistency_index(user_id, period, metric_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_career_alerts_unique 
  ON public.career_alerts(user_id, period, alert_type);

-- 2. Adicionar DELETE policies para completar o CRUD isolation
CREATE POLICY "Users can delete their own career metrics"
  ON public.career_metrics FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career trends"
  ON public.career_trends FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career alerts"
  ON public.career_alerts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications"
  ON public.career_certifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own opportunities"
  ON public.career_opportunities FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own case complexity"
  ON public.career_case_complexity FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consistency index"
  ON public.career_consistency_index FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own narratives"
  ON public.career_narratives FOR DELETE
  USING (auth.uid() = user_id);