import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  RegistryCaseSummary,
  RegistryFilters,
  RegistryMetrics,
  PainCurvePoint
} from '@/types/registry-analytics';
import { K_MIN } from '@/types/evidence-engine';
import { useToast } from '@/hooks/use-toast';

export function useRegistryAnalytics(filters?: RegistryFilters) {
  const [cases, setCases] = useState<RegistryCaseSummary[]>([]);
  const [metrics, setMetrics] = useState<RegistryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from the view - RLS will filter by clinician_id automatically
      const { data, error: fetchError } = await supabase
        .from('registry_case_summary_v1_1')
        .select('*');

      if (fetchError) throw fetchError;

      let filteredData = (data || []) as RegistryCaseSummary[];

      // Apply client-side filters
      if (filters?.diagnosis) {
        filteredData = filteredData.filter(c => 
          c.diagnosis?.toLowerCase().includes(filters.diagnosis!.toLowerCase())
        );
      }
      if (filters?.tissue_type) {
        filteredData = filteredData.filter(c => 
          c.tissue_type?.toLowerCase().includes(filters.tissue_type!.toLowerCase())
        );
      }
      if (filters?.procedure_type && filters.procedure_type !== 'all') {
        filteredData = filteredData.filter(c => 
          c.procedure_type === filters.procedure_type
        );
      }
      if (filters?.d90_status === 'completed') {
        filteredData = filteredData.filter(c => c.has_d90);
      } else if (filters?.d90_status === 'inconclusive') {
        filteredData = filteredData.filter(c => !c.has_d90);
      }

      setCases(filteredData);

      // Calculate metrics
      const total = filteredData.length;
      if (total === 0) {
        setMetrics({
          totalCases: 0,
          d90CompletionRate: 0,
          missedRate: 0,
          robustRate: 0,
          moderateRate: 0,
          nonResponderRate: 0,
          inconclusiveRate: 0,
        });
        return;
      }

      const d90Completed = filteredData.filter(c => c.has_d90).length;
      const missed = filteredData.reduce((acc, c) => acc + (c.missed_count || 0), 0);
      const totalFollowups = filteredData.length * 4; // 4 timepoints per case
      
      const robust = filteredData.filter(c => c.responder_status === 'ROBUST_RESPONDER').length;
      const moderate = filteredData.filter(c => c.responder_status === 'MODERATE_RESPONDER').length;
      const nonResponder = filteredData.filter(c => c.responder_status === 'NON_RESPONDER').length;
      const inconclusive = filteredData.filter(c => c.responder_status === 'INCONCLUSIVE').length;

      setMetrics({
        totalCases: total,
        d90CompletionRate: Math.round((d90Completed / total) * 100),
        missedRate: totalFollowups > 0 ? Math.round((missed / totalFollowups) * 100) : 0,
        robustRate: Math.round((robust / total) * 100),
        moderateRate: Math.round((moderate / total) * 100),
        nonResponderRate: Math.round((nonResponder / total) * 100),
        inconclusiveRate: Math.round((inconclusive / total) * 100),
      });

    } catch (err) {
      console.error('Error fetching registry analytics:', err);
      setError('Erro ao carregar dados do registry');
    } finally {
      setLoading(false);
    }
  }, [filters?.diagnosis, filters?.tissue_type, filters?.procedure_type, filters?.d90_status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build pain curves for a cohort
  const buildCohortCurves = useCallback((): PainCurvePoint[] => {
    if (cases.length === 0) return [];

    const timepoints = [
      { name: 'Baseline', days: 0 },
      { name: 'D30', days: 30 },
      { name: 'D90', days: 90 },
      { name: 'D180', days: 180 },
      { name: 'D365', days: 365 },
    ];

    return timepoints.map(tp => {
      let painValues: number[] = [];
      let functionValues: number[] = [];

      cases.forEach(c => {
        if (tp.days === 0 && c.baseline_pain_nrs !== null) {
          painValues.push(c.baseline_pain_nrs);
        } else if (tp.days === 30 && c.d30_pain !== null) {
          painValues.push(c.d30_pain);
          if (c.d30_function !== null) functionValues.push(c.d30_function);
        } else if (tp.days === 90 && c.d90_pain !== null) {
          painValues.push(c.d90_pain);
          if (c.d90_function !== null) functionValues.push(c.d90_function);
        } else if (tp.days === 180 && c.d180_pain !== null) {
          painValues.push(c.d180_pain);
          if (c.d180_function !== null) functionValues.push(c.d180_function);
        } else if (tp.days === 365 && c.d365_pain !== null) {
          painValues.push(c.d365_pain);
          if (c.d365_function !== null) functionValues.push(c.d365_function);
        }
      });

      return {
        timepoint: tp.name,
        days: tp.days,
        pain: painValues.length > 0 
          ? Math.round((painValues.reduce((a, b) => a + b, 0) / painValues.length) * 10) / 10 
          : null,
        function: functionValues.length > 0 
          ? Math.round((functionValues.reduce((a, b) => a + b, 0) / functionValues.length) * 10) / 10 
          : null,
      };
    });
  }, [cases]);

  // Build individual case curve
  const buildCaseCurve = useCallback((caseData: RegistryCaseSummary): PainCurvePoint[] => {
    return [
      { timepoint: 'Baseline', days: 0, pain: caseData.baseline_pain_nrs, function: caseData.baseline_function_score },
      { timepoint: 'D30', days: 30, pain: caseData.d30_pain, function: caseData.d30_function },
      { timepoint: 'D90', days: 90, pain: caseData.d90_pain, function: caseData.d90_function },
      { timepoint: 'D180', days: 180, pain: caseData.d180_pain, function: caseData.d180_function },
      { timepoint: 'D365', days: 365, pain: caseData.d365_pain, function: caseData.d365_function },
    ];
  }, []);

  return {
    cases,
    metrics,
    loading,
    error,
    refetch: fetchData,
    buildCohortCurves,
    buildCaseCurve,
  };
}

export function useRegistryExport() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = useCallback(async (
    cases: RegistryCaseSummary[],
    filters: RegistryFilters
  ): Promise<boolean> => {
    // k-anonymity floor: recusa export com menos de K_MIN casos.
    // Mesmo com clinician_id hasheado, combinações raras de atributos
    // (diagnóstico + procedimento + tecido) podem re-identificar pacientes.
    if (cases.length < K_MIN) {
      toast({
        title: 'Exportação bloqueada',
        description: `São necessários pelo menos ${K_MIN} casos para preservar o anonimato. Ajuste os filtros.`,
        variant: 'destructive',
      });
      return false;
    }

    try {
      setExporting(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Salt aleatório por export — Opção A (máxima privacidade).
      // Cada export produz hashes de clinician_id completamente distintos,
      // impedindo correlação entre arquivos mesmo do mesmo dia.
      //
      // Trade-off: não é possível agrupar por "mesmo clínico" entre dois exports.
      // Se no futuro houver necessidade de análises colaborativas com contagem
      // de clínicos distintos entre exports, migrar para Opção B:
      //   const salt = 'registry_v1_1_salt_' + YYYY-MM  (rotação mensal)
      // O default permanece Opção A enquanto o uso colaborativo não for definido.
      const salt = crypto.randomUUID();
      const rows: string[] = [];
      
      // Header
      rows.push([
        'registry_id',
        'clinician_id_hash',
        'diagnosis',
        'tissue_type',
        'procedure_type',
        'timepoint_days',
        'pain_nrs',
        'function_score',
        'global_change',
        'responder_status',
        'responder_reason_code',
        'adverse_event_present',
        'followup_status'
      ].join(','));

      // Generate rows - one per completed follow-up
      for (const c of cases) {
        const registryId = crypto.randomUUID();
        const clinicianHash = await hashString(c.clinician_id + salt);

        const timepoints = [
          { days: 30, pain: c.d30_pain, func: c.d30_function, gc: c.d30_global_change, has: c.has_d30 },
          { days: 90, pain: c.d90_pain, func: c.d90_function, gc: c.d90_global_change, has: c.has_d90 },
          { days: 180, pain: c.d180_pain, func: c.d180_function, gc: null, has: c.has_d180 },
          { days: 365, pain: c.d365_pain, func: c.d365_function, gc: null, has: c.has_d365 },
        ];

        for (const tp of timepoints) {
          if (tp.has) {
            rows.push([
              registryId,
              clinicianHash.slice(0, 16),
              escapeCSV(c.diagnosis || ''),
              escapeCSV(c.tissue_type || ''),
              escapeCSV(c.procedure_type),
              tp.days.toString(),
              tp.pain?.toString() || '',
              tp.func?.toString() || '',
              tp.gc || '',
              c.responder_status,
              c.responder_reason_code,
              c.adverse_event_any ? 'true' : 'false',
              'completed'
            ].join(','));
          }
        }
      }

      // Create and download CSV
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `registry_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log the export
      await supabase.from('registry_exports_log').insert([{
        exported_by: session.session.user.id,
        filters_json: JSON.parse(JSON.stringify(filters)),
        row_count: rows.length - 1, // Exclude header
        export_version: 'registry_export_v1_1'
      }]);

      return true;
    } catch (err) {
      console.error('Export error:', err);
      return false;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportToCSV, exporting };
}

// Helper functions
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
