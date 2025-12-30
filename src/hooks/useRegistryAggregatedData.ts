import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AggregatedMetrics {
  totalEligibleCases: number;
  totalSnapshots: number;
  snapshotsByType: Record<string, number>;
  scoreDistribution: { range: string; count: number }[];
  procedureOutcomes: { outcome: string; count: number }[];
  monthlyTrend: { month: string; cases: number }[];
  averageFollowUpDays: number;
}

const MIN_SAMPLE_THRESHOLD = 5; // Mínimo de casos para exibir dados

export function useRegistryAggregatedData() {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminAccess = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      setIsAdmin(false);
      return false;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    const hasAdmin = !!data;
    setIsAdmin(hasAdmin);
    return hasAdmin;
  }, []);

  const logAccess = useCallback(async (accessType: string, details?: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) return;

    await supabase.from('registry_access_logs').insert([{
      user_id: userId,
      access_type: accessType,
      access_details: details ? JSON.parse(JSON.stringify(details)) : {},
      ip_address: null,
      user_agent: navigator.userAgent
    }]);
  }, []);

  const fetchAggregatedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hasAccess = await checkAdminAccess();
      if (!hasAccess) {
        setError('Acesso não autorizado');
        return;
      }

      // Log access
      await logAccess('view_dashboard');

      // Buscar snapshots elegíveis
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('registry_snapshots')
        .select('snapshot_type, snapshot_data, created_at, patient_id')
        .eq('is_eligible', true);

      if (snapshotsError) throw snapshotsError;

      if (!snapshots || snapshots.length < MIN_SAMPLE_THRESHOLD) {
        setMetrics({
          totalEligibleCases: 0,
          totalSnapshots: 0,
          snapshotsByType: {},
          scoreDistribution: [],
          procedureOutcomes: [],
          monthlyTrend: [],
          averageFollowUpDays: 0
        });
        return;
      }

      // Calcular métricas agregadas
      const uniquePatients = new Set(snapshots.map(s => s.patient_id));
      const totalEligibleCases = uniquePatients.size;
      const totalSnapshots = snapshots.length;

      // Snapshots por tipo
      const snapshotsByType: Record<string, number> = {};
      for (const s of snapshots) {
        snapshotsByType[s.snapshot_type] = (snapshotsByType[s.snapshot_type] || 0) + 1;
      }

      // Distribuição de scores (anonimizada)
      const scoreSnapshots = snapshots.filter(s => 
        s.snapshot_type === 'score_inicial' || s.snapshot_type === 'score_atualizado'
      );
      
      const scoreRanges = [
        { range: '0-3', min: 0, max: 3, count: 0 },
        { range: '4-5', min: 4, max: 5, count: 0 },
        { range: '6-7', min: 6, max: 7, count: 0 },
        { range: '8-10', min: 8, max: 10, count: 0 }
      ];

      for (const s of scoreSnapshots) {
        const data = s.snapshot_data as Record<string, unknown>;
        const score = typeof data?.score === 'number' ? data.score : null;
        if (score !== null) {
          for (const range of scoreRanges) {
            if (score >= range.min && score <= range.max) {
              range.count++;
              break;
            }
          }
        }
      }

      const scoreDistribution = scoreRanges
        .filter(r => r.count >= MIN_SAMPLE_THRESHOLD)
        .map(r => ({ range: r.range, count: r.count }));

      // Tendência mensal (últimos 6 meses)
      const monthlyMap = new Map<string, Set<string>>();
      for (const s of snapshots) {
        const month = s.created_at.slice(0, 7); // YYYY-MM
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, new Set());
        }
        monthlyMap.get(month)!.add(s.patient_id);
      }

      const monthlyTrend = Array.from(monthlyMap.entries())
        .map(([month, patients]) => ({ month, cases: patients.size }))
        .filter(m => m.cases >= MIN_SAMPLE_THRESHOLD)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

      // Outcomes de procedimentos (placeholder - seria calculado com dados reais)
      const procedureOutcomes: { outcome: string; count: number }[] = [];

      setMetrics({
        totalEligibleCases,
        totalSnapshots,
        snapshotsByType,
        scoreDistribution,
        procedureOutcomes,
        monthlyTrend,
        averageFollowUpDays: 0
      });

    } catch (err) {
      console.error('Error fetching aggregated data:', err);
      setError('Erro ao carregar dados agregados');
    } finally {
      setLoading(false);
    }
  }, [checkAdminAccess, logAccess]);

  useEffect(() => {
    fetchAggregatedData();
  }, [fetchAggregatedData]);

  return {
    metrics,
    loading,
    error,
    isAdmin,
    refresh: fetchAggregatedData,
    MIN_SAMPLE_THRESHOLD
  };
}
