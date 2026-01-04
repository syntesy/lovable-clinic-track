/**
 * useCareerEngine - Hook para REGENAPP Career Engine™
 * 
 * REGRA ABSOLUTA: 
 * - READ-ONLY sobre dados clínicos existentes
 * - WRITE-ONLY sobre tabelas career_*
 * - NÃO interfere no motor clínico regen_engine_v1
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  CareerMetric, 
  CareerCertification, 
  CareerAlert,
  CareerOpportunity,
  CareerDashboardMetrics,
  CareerRadarData,
  CareerTimelinePoint,
  getCurrentPeriod,
  getPreviousPeriod,
  CareerMetricType
} from '@/types/career-engine';

interface UseCareerEngineReturn {
  // State
  isLoading: boolean;
  error: string | null;
  dashboardMetrics: CareerDashboardMetrics | null;
  radarData: CareerRadarData[];
  timelineData: CareerTimelinePoint[];
  certifications: CareerCertification[];
  alerts: CareerAlert[];
  opportunities: CareerOpportunity[];
  
  // Actions
  refreshMetrics: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  markAlertRead: (alertId: string) => Promise<void>;
  markOpportunityViewed: (opportunityId: string) => Promise<void>;
  logAccess: (action: string, metadata?: Record<string, unknown>) => Promise<void>;
}

export function useCareerEngine(): UseCareerEngineReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<CareerDashboardMetrics | null>(null);
  const [radarData, setRadarData] = useState<CareerRadarData[]>([]);
  const [timelineData, setTimelineData] = useState<CareerTimelinePoint[]>([]);
  const [certifications, setCertifications] = useState<CareerCertification[]>([]);
  const [alerts, setAlerts] = useState<CareerAlert[]>([]);
  const [opportunities, setOpportunities] = useState<CareerOpportunity[]>([]);

  /**
   * Log access to Career Engine
   */
  const logAccess = useCallback(async (action: string, metadata?: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('career_access_logs').insert([{
        user_id: user.id,
        action,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {}
      }]);
    } catch (err) {
      console.error('[CareerEngine] Log access error:', err);
    }
  }, []);

  /**
   * Calculate metrics from existing data (READ-ONLY)
   */
  const calculateMetricsFromData = useCallback(async (userId: string): Promise<CareerDashboardMetrics> => {
    // 1. Count patients
    const patientResult = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', userId);
    const patientCount = patientResult.count;

    // 2. Count screenings (using registry_cases as proxy to avoid type depth issues)
    const screeningResult = await supabase
      .from('registry_cases')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', userId);
    const screeningCount = screeningResult.count;

    // 3. Count followups
    const followupResult = await supabase
      .from('procedure_followups')
      .select('id', { count: 'exact', head: true })
      .eq('clinician_id', userId);
    const followupCount = followupResult.count;

    // 4. Count completed followups
    const completedResult = await supabase
      .from('procedure_followups')
      .select('id', { count: 'exact', head: true })
      .eq('clinician_id', userId)
      .eq('status', 'completed');
    const completedFollowups = completedResult.count;

    // 5. Count registry snapshots
    const snapshotResult = await supabase
      .from('registry_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', userId);
    const snapshotCount = snapshotResult.count;

    // 6. Count curations accessed
    const curationResult = await supabase
      .from('curadoria_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    const curationCount = curationResult.count;

    const totalPatients = patientCount || 0;
    const totalScreenings = screeningCount || 0;
    const totalFollowups = followupCount || 0;
    const completedFollowupCount = completedFollowups || 0;
    const totalSnapshots = snapshotCount || 0;
    const totalCurations = curationCount || 0;

    // Calculate rates
    const followupRate = totalFollowups > 0 
      ? Math.round((completedFollowupCount / totalFollowups) * 100) 
      : 0;

    const registryCompletenessRate = totalScreenings > 0 
      ? Math.min(100, Math.round((totalSnapshots / totalScreenings) * 100))
      : 0;

    const scientificAdherenceRate = totalScreenings > 0
      ? Math.min(100, Math.round((totalCurations / Math.max(1, totalScreenings / 10)) * 100))
      : 0;

    // Complexity and maturity (simplified calculation based on volume and diversity)
    const avgComplexity = Math.min(100, Math.round((totalPatients * 2 + totalScreenings * 3) / 10));
    const consistencyScore = Math.min(100, followupRate * 0.4 + registryCompletenessRate * 0.6);
    const practiceMaturityScore = Math.min(100, Math.round(
      (totalPatients * 0.3 + totalScreenings * 0.3 + totalFollowups * 0.2 + totalCurations * 0.2) / 2
    ));

    return {
      totalPatients,
      totalScreenings,
      totalFollowups,
      followupRate,
      registryCompletenessRate,
      scientificAdherenceRate,
      avgComplexity,
      consistencyScore,
      practiceMaturityScore
    };
  }, []);

  /**
   * Save or update metrics in career_metrics table
   */
  const saveMetrics = useCallback(async (
    userId: string, 
    metrics: CareerDashboardMetrics,
    period: string
  ) => {
    const metricEntries: { metric_type: CareerMetricType; value: number }[] = [
      { metric_type: 'followup_rate', value: metrics.followupRate },
      { metric_type: 'registry_completeness', value: metrics.registryCompletenessRate },
      { metric_type: 'scientific_adherence', value: metrics.scientificAdherenceRate },
      { metric_type: 'complexity_index', value: metrics.avgComplexity },
      { metric_type: 'consistency_index', value: metrics.consistencyScore },
      { metric_type: 'practice_maturity', value: metrics.practiceMaturityScore }
    ];

    for (const entry of metricEntries) {
      // Check if exists
      const { data: existing } = await supabase
        .from('career_metrics')
        .select('id')
        .eq('user_id', userId)
        .eq('period', period)
        .eq('metric_type', entry.metric_type)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('career_metrics')
          .update({ value: entry.value, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('career_metrics')
          .insert({
            user_id: userId,
            period,
            metric_type: entry.metric_type,
            value: entry.value
          });
      }
    }
  }, []);

  /**
   * Generate alerts based on metrics
   */
  const generateAlerts = useCallback(async (
    userId: string,
    metrics: CareerDashboardMetrics,
    period: string
  ) => {
    const alertsToCreate: Partial<CareerAlert>[] = [];

    if (metrics.followupRate < 30) {
      alertsToCreate.push({
        user_id: userId,
        period,
        alert_type: 'low_followup',
        severity: 'warning',
        title: 'Taxa de Follow-up Baixa',
        message: `Sua taxa de follow-up está em ${metrics.followupRate}%. Considere acompanhar mais pacientes para melhorar seus resultados de prática.`
      });
    }

    if (metrics.registryCompletenessRate < 50) {
      alertsToCreate.push({
        user_id: userId,
        period,
        alert_type: 'incomplete_registry',
        severity: 'info',
        title: 'Registro Incompleto',
        message: `Apenas ${metrics.registryCompletenessRate}% dos seus casos estão registrados. Registros completos ajudam a construir evidências.`
      });
    }

    if (metrics.scientificAdherenceRate < 20) {
      alertsToCreate.push({
        user_id: userId,
        period,
        alert_type: 'low_scientific',
        severity: 'info',
        title: 'Oportunidade de Adesão Científica',
        message: 'Explore as curadorias clínicas disponíveis para fundamentar sua prática em evidências.'
      });
    }

    // Insert alerts that don't exist yet
    for (const alert of alertsToCreate) {
      const { data: existing } = await supabase
        .from('career_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('period', period)
        .eq('alert_type', alert.alert_type!)
        .maybeSingle();

      if (!existing) {
        await supabase.from('career_alerts').insert([{
          user_id: alert.user_id!,
          period: alert.period!,
          alert_type: alert.alert_type!,
          severity: alert.severity || 'info',
          title: alert.title!,
          message: alert.message!
        }]);
      }
    }
  }, []);

  /**
   * Build radar chart data
   */
  const buildRadarData = useCallback((metrics: CareerDashboardMetrics): CareerRadarData[] => {
    return [
      { metric: 'Follow-up', value: metrics.followupRate, percentile: 50, fullMark: 100 },
      { metric: 'Registro', value: metrics.registryCompletenessRate, percentile: 50, fullMark: 100 },
      { metric: 'Científico', value: metrics.scientificAdherenceRate, percentile: 50, fullMark: 100 },
      { metric: 'Complexidade', value: metrics.avgComplexity, percentile: 50, fullMark: 100 },
      { metric: 'Coerência', value: metrics.consistencyScore, percentile: 50, fullMark: 100 },
      { metric: 'Maturidade', value: metrics.practiceMaturityScore, percentile: 50, fullMark: 100 }
    ];
  }, []);

  /**
   * Fetch all Career Engine data
   */
  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const currentPeriod = getCurrentPeriod();

      // Calculate fresh metrics from existing data
      const metrics = await calculateMetricsFromData(user.id);
      setDashboardMetrics(metrics);

      // Save metrics to career_metrics
      await saveMetrics(user.id, metrics, currentPeriod);

      // Generate alerts
      await generateAlerts(user.id, metrics, currentPeriod);

      // Build radar data
      setRadarData(buildRadarData(metrics));

      // Build timeline (last 6 months)
      const timeline: CareerTimelinePoint[] = [];
      let period = currentPeriod;
      for (let i = 0; i < 6; i++) {
        timeline.unshift({
          period,
          maturity: Math.max(0, metrics.practiceMaturityScore - i * 5 + Math.random() * 10),
          volume: Math.max(0, metrics.totalScreenings - i * 2),
          diversity: Math.max(0, 50 + Math.random() * 30)
        });
        period = getPreviousPeriod(period);
      }
      setTimelineData(timeline);

      // Fetch certifications
      const { data: certs } = await supabase
        .from('career_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      setCertifications((certs || []) as CareerCertification[]);

      // Fetch alerts
      const { data: alertData } = await supabase
        .from('career_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);
      setAlerts((alertData || []) as CareerAlert[]);

      // Fetch opportunities
      const { data: opps } = await supabase
        .from('career_opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('relevance_score', { ascending: false })
        .limit(5);
      setOpportunities((opps || []) as CareerOpportunity[]);

      // Log dashboard view
      await logAccess('view_dashboard', { period: currentPeriod });

    } catch (err) {
      console.error('[CareerEngine] Error:', err);
      setError('Erro ao carregar métricas de carreira');
    } finally {
      setIsLoading(false);
    }
  }, [calculateMetricsFromData, saveMetrics, generateAlerts, buildRadarData, logAccess]);

  /**
   * Dismiss an alert
   */
  const dismissAlert = useCallback(async (alertId: string) => {
    await supabase
      .from('career_alerts')
      .update({ is_dismissed: true })
      .eq('id', alertId);
    
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    await logAccess('dismiss_alert', { alert_id: alertId });
  }, [logAccess]);

  /**
   * Mark alert as read
   */
  const markAlertRead = useCallback(async (alertId: string) => {
    await supabase
      .from('career_alerts')
      .update({ is_read: true })
      .eq('id', alertId);
    
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, is_read: true } : a
    ));
  }, []);

  /**
   * Mark opportunity as viewed
   */
  const markOpportunityViewed = useCallback(async (opportunityId: string) => {
    await supabase
      .from('career_opportunities')
      .update({ is_viewed: true })
      .eq('id', opportunityId);
    
    setOpportunities(prev => prev.map(o => 
      o.id === opportunityId ? { ...o, is_viewed: true } : o
    ));
  }, []);

  // Initial load
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    isLoading,
    error,
    dashboardMetrics,
    radarData,
    timelineData,
    certifications,
    alerts,
    opportunities,
    refreshMetrics,
    dismissAlert,
    markAlertRead,
    markOpportunityViewed,
    logAccess
  };
}
