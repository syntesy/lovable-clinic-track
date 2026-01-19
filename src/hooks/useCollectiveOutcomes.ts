/**
 * Hook for Collective Outcomes Dashboard
 * 
 * Fetches aggregated, anonymous outcome data for CSE collective intelligence
 * Only includes cases with: 
 * - is_comparable = true 
 * - clinical_standard_status IN ('eligible', 'eligible_with_penalty')
 * - baseline + at least 1 follow-up outcome
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from './useCollectiveInsights';
import { calculateNormalizedFunctionDelta, canCalculateFunctionDelta } from '@/lib/function-scale-map';

export type OutcomeTimepoint = 'baseline' | 'm1' | 'm3' | 'm6' | 'm12';
export type ResponseThreshold = 30 | 50;

export interface OutcomeStats {
  n_with_baseline: number;
  n_with_followup_m1: number;
  n_with_followup_m3: number;
  n_with_followup_m6: number;
  n_with_followup_m12: number;
}

export type TrendLabel = 'Dados insuficientes' | 'Dados iniciais' | 'Tendência positiva' | 'Sem tendência clara';
export type TrendColor = 'neutral' | 'warning' | 'success';

export interface TrendInfo {
  label: TrendLabel;
  color: TrendColor;
}

export interface ClusterOutcomeAggregation {
  cluster_key: string;
  case_count: number;
  n_with_outcomes: number; // baseline + at least 1 followup
  
  // Pain metrics with sample sizes per timepoint
  n_outcomes_used_pain_m1: number;
  n_outcomes_used_pain_m3: number;
  n_outcomes_used_pain_m6: number;
  n_outcomes_used_pain_m12: number;
  
  mean_delta_pain_m1: number | null;
  mean_delta_pain_m3: number | null;
  mean_delta_pain_m6: number | null;
  mean_delta_pain_m12: number | null;
  
  // Response rates 30% and 50%
  response_rate_pain_30_m1: number | null;
  response_rate_pain_30_m3: number | null;
  response_rate_pain_30_m6: number | null;
  response_rate_pain_30_m12: number | null;
  response_rate_pain_50_m1: number | null;
  response_rate_pain_50_m3: number | null;
  response_rate_pain_50_m6: number | null;
  response_rate_pain_50_m12: number | null;
  
  // Function metrics with sample sizes
  n_outcomes_used_function_m3: number;
  mean_delta_function_m3: number | null;
  
  // Trend labels per timepoint
  trend_m1: TrendInfo;
  trend_m3: TrendInfo;
  trend_m6: TrendInfo;
  trend_m12: TrendInfo;
}

const MIN_CLUSTER_SIZE = 5; // k-anonymity threshold
const MIN_TREND_N = 10; // Minimum for "Tendência positiva"

export function useCollectiveOutcomes(filters: DashboardFilters, selectedTimepoint: OutcomeTimepoint = 'm3') {
  return useQuery({
    queryKey: ['collective-outcomes', filters, selectedTimepoint],
    queryFn: async () => {
      // Step 1: Get all eligible procedure_standard_records
      let recordsQuery = supabase
        .from('procedure_standard_records')
        .select('id, cluster_key, clinical_standard_status, pathology, anatomic_region')
        .eq('is_comparable', true)
        .eq('procedure_type', filters.procedure_type);

      // Apply status filter
      if (filters.status === 'eligible') {
        recordsQuery = recordsQuery.eq('clinical_standard_status', 'eligible');
      } else if (filters.status === 'eligible_with_penalty') {
        recordsQuery = recordsQuery.eq('clinical_standard_status', 'eligible_with_penalty');
      } else {
        recordsQuery = recordsQuery.in('clinical_standard_status', ['eligible', 'eligible_with_penalty']);
      }

      // Apply pathology/region filters
      if (filters.pathology) {
        recordsQuery = recordsQuery.eq('pathology', filters.pathology);
      }
      if (filters.anatomic_region) {
        recordsQuery = recordsQuery.eq('anatomic_region', filters.anatomic_region);
      }

      const { data: records, error: recordsError } = await recordsQuery;
      if (recordsError) throw recordsError;

      if (!records || records.length === 0) {
        return {
          overview: createEmptyOverview(),
          clusters: [],
          totalRecords: 0,
        };
      }

      // Step 2: Get all outcomes linked to these procedure_standard_records
      const recordIds = records.map(r => r.id);
      
      const { data: outcomes, error: outcomesError } = await supabase
        .from('patient_reported_outcomes')
        .select('*')
        .in('procedure_standard_record_id', recordIds);

      if (outcomesError) throw outcomesError;

      // Step 3: Build outcome map by procedure_standard_record_id
      const outcomesByRecord = new Map<string, Map<string, any>>();
      for (const outcome of outcomes || []) {
        if (!outcome.procedure_standard_record_id) continue;
        
        if (!outcomesByRecord.has(outcome.procedure_standard_record_id)) {
          outcomesByRecord.set(outcome.procedure_standard_record_id, new Map());
        }
        outcomesByRecord.get(outcome.procedure_standard_record_id)!.set(outcome.timepoint, outcome);
      }

      // Step 4: Calculate overview stats
      const overview = calculateOverviewStats(outcomesByRecord);

      // Step 5: Calculate cluster aggregations with outcomes
      const clusters = calculateClusterOutcomeAggregations(records, outcomesByRecord);

      return {
        overview,
        clusters,
        totalRecords: records.length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get cluster outcome data for a specific cluster_key
 * Used in ClinicalStandardCard to show aggregated results
 */
export function useClusterOutcomes(clusterKey: string | null | undefined) {
  return useQuery({
    queryKey: ['cluster-outcomes', clusterKey],
    enabled: !!clusterKey,
    queryFn: async () => {
      if (!clusterKey) return null;

      // Get all comparable records for this cluster
      const { data: records, error: recordsError } = await supabase
        .from('procedure_standard_records')
        .select('id')
        .eq('cluster_key', clusterKey)
        .eq('is_comparable', true)
        .in('clinical_standard_status', ['eligible', 'eligible_with_penalty']);

      if (recordsError) throw recordsError;
      if (!records || records.length < MIN_CLUSTER_SIZE) return null;

      const recordIds = records.map(r => r.id);
      
      const { data: outcomes, error: outcomesError } = await supabase
        .from('patient_reported_outcomes')
        .select('*')
        .in('procedure_standard_record_id', recordIds);

      if (outcomesError) throw outcomesError;

      // Build outcome map
      const outcomesByRecord = new Map<string, Map<string, any>>();
      for (const outcome of outcomes || []) {
        if (!outcome.procedure_standard_record_id) continue;
        if (!outcomesByRecord.has(outcome.procedure_standard_record_id)) {
          outcomesByRecord.set(outcome.procedure_standard_record_id, new Map());
        }
        outcomesByRecord.get(outcome.procedure_standard_record_id)!.set(outcome.timepoint, outcome);
      }

      // Calculate metrics for this single cluster
      const aggregations = calculateClusterOutcomeAggregations(
        records.map(r => ({ ...r, cluster_key: clusterKey })),
        outcomesByRecord
      );

      return aggregations[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function createEmptyOverview(): OutcomeStats {
  return {
    n_with_baseline: 0,
    n_with_followup_m1: 0,
    n_with_followup_m3: 0,
    n_with_followup_m6: 0,
    n_with_followup_m12: 0,
  };
}

function calculateOverviewStats(outcomesByRecord: Map<string, Map<string, any>>): OutcomeStats {
  const stats: OutcomeStats = createEmptyOverview();

  for (const [, outcomes] of outcomesByRecord) {
    if (outcomes.has('baseline')) stats.n_with_baseline++;
    if (outcomes.has('m1')) stats.n_with_followup_m1++;
    if (outcomes.has('m3')) stats.n_with_followup_m3++;
    if (outcomes.has('m6')) stats.n_with_followup_m6++;
    if (outcomes.has('m12')) stats.n_with_followup_m12++;
  }

  return stats;
}

interface CaseData {
  baseline_pain: number;
  baseline_function?: number;
  baseline_function_type?: string;
  m1_pain?: number;
  m3_pain?: number;
  m6_pain?: number;
  m12_pain?: number;
  m3_function?: number;
  m3_function_type?: string;
}

function calculateClusterOutcomeAggregations(
  records: any[],
  outcomesByRecord: Map<string, Map<string, any>>
): ClusterOutcomeAggregation[] {
  // Group records by cluster_key
  const clusters = new Map<string, any[]>();
  
  for (const record of records) {
    const key = record.cluster_key || 'NO_CLUSTER';
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(record);
  }

  const aggregations: ClusterOutcomeAggregation[] = [];

  for (const [clusterKey, clusterRecords] of clusters) {
    const count = clusterRecords.length;
    
    // Apply k-anonymity
    if (count < MIN_CLUSTER_SIZE) continue;

    // Collect outcomes for this cluster
    const validCases: CaseData[] = [];

    for (const record of clusterRecords) {
      const outcomes = outcomesByRecord.get(record.id);
      if (!outcomes) continue;

      const baseline = outcomes.get('baseline');
      if (!baseline || baseline.pain_score === null) continue;

      // Need baseline + at least 1 follow-up
      const hasFollowup = outcomes.has('m1') || outcomes.has('m3') || outcomes.has('m6') || outcomes.has('m12');
      if (!hasFollowup) continue;

      const caseData: CaseData = {
        baseline_pain: baseline.pain_score,
        baseline_function: baseline.function_score ?? undefined,
        baseline_function_type: baseline.function_scale_type ?? undefined,
      };

      const m1 = outcomes.get('m1');
      if (m1?.pain_score !== null && m1?.pain_score !== undefined) caseData.m1_pain = m1.pain_score;
      
      const m3 = outcomes.get('m3');
      if (m3?.pain_score !== null && m3?.pain_score !== undefined) caseData.m3_pain = m3.pain_score;
      if (m3?.function_score !== null && m3?.function_score !== undefined) {
        caseData.m3_function = m3.function_score;
        caseData.m3_function_type = m3.function_scale_type ?? undefined;
      }
      
      const m6 = outcomes.get('m6');
      if (m6?.pain_score !== null && m6?.pain_score !== undefined) caseData.m6_pain = m6.pain_score;
      
      const m12 = outcomes.get('m12');
      if (m12?.pain_score !== null && m12?.pain_score !== undefined) caseData.m12_pain = m12.pain_score;

      validCases.push(caseData);
    }

    // Apply k-anonymity to outcomes too
    const nWithOutcomes = validCases.length;

    // Calculate metrics only if we have enough cases
    const metrics = calculateMetrics(validCases);

    // Calculate trends for each timepoint
    const trend_m1 = calculateTrend(metrics.n_outcomes_used_pain_m1, metrics.mean_delta_pain_m1, metrics.response_rate_pain_30_m1);
    const trend_m3 = calculateTrend(metrics.n_outcomes_used_pain_m3, metrics.mean_delta_pain_m3, metrics.response_rate_pain_30_m3);
    const trend_m6 = calculateTrend(metrics.n_outcomes_used_pain_m6, metrics.mean_delta_pain_m6, metrics.response_rate_pain_30_m6);
    const trend_m12 = calculateTrend(metrics.n_outcomes_used_pain_m12, metrics.mean_delta_pain_m12, metrics.response_rate_pain_30_m12);

    aggregations.push({
      cluster_key: clusterKey,
      case_count: count,
      n_with_outcomes: nWithOutcomes,
      ...metrics,
      trend_m1,
      trend_m3,
      trend_m6,
      trend_m12,
    });
  }

  return aggregations.sort((a, b) => b.case_count - a.case_count);
}

function calculateTrend(
  n: number, 
  meanDeltaPain: number | null, 
  responseRate30: number | null
): TrendInfo {
  if (n < MIN_CLUSTER_SIZE) {
    return { label: 'Dados insuficientes', color: 'neutral' };
  }
  
  if (n >= MIN_CLUSTER_SIZE && n < MIN_TREND_N) {
    return { label: 'Dados iniciais', color: 'warning' };
  }
  
  // n >= MIN_TREND_N
  const hasPositiveDelta = meanDeltaPain !== null && meanDeltaPain >= 2;
  const hasGoodResponse = responseRate30 !== null && responseRate30 >= 60;
  
  if (hasPositiveDelta || hasGoodResponse) {
    return { label: 'Tendência positiva', color: 'success' };
  }
  
  return { label: 'Sem tendência clara', color: 'neutral' };
}

interface MetricsResult {
  n_outcomes_used_pain_m1: number;
  n_outcomes_used_pain_m3: number;
  n_outcomes_used_pain_m6: number;
  n_outcomes_used_pain_m12: number;
  mean_delta_pain_m1: number | null;
  mean_delta_pain_m3: number | null;
  mean_delta_pain_m6: number | null;
  mean_delta_pain_m12: number | null;
  response_rate_pain_30_m1: number | null;
  response_rate_pain_30_m3: number | null;
  response_rate_pain_30_m6: number | null;
  response_rate_pain_30_m12: number | null;
  response_rate_pain_50_m1: number | null;
  response_rate_pain_50_m3: number | null;
  response_rate_pain_50_m6: number | null;
  response_rate_pain_50_m12: number | null;
  n_outcomes_used_function_m3: number;
  mean_delta_function_m3: number | null;
}

function calculateMetrics(cases: CaseData[]): MetricsResult {
  // Pain deltas per timepoint (baseline - followup, positive = improvement)
  const m1Cases = cases.filter(c => c.m1_pain !== undefined);
  const m3Cases = cases.filter(c => c.m3_pain !== undefined);
  const m6Cases = cases.filter(c => c.m6_pain !== undefined);
  const m12Cases = cases.filter(c => c.m12_pain !== undefined);

  const m1Deltas = m1Cases.map(c => c.baseline_pain - c.m1_pain!);
  const m3Deltas = m3Cases.map(c => c.baseline_pain - c.m3_pain!);
  const m6Deltas = m6Cases.map(c => c.baseline_pain - c.m6_pain!);
  const m12Deltas = m12Cases.map(c => c.baseline_pain - c.m12_pain!);

  // Response rates 30% and 50% for each timepoint
  const calculateResponseRate = (casesSubset: CaseData[], timepoint: 'm1' | 'm3' | 'm6' | 'm12', threshold: number): number | null => {
    // Filter out cases where baseline is 0 (cannot calculate percentage improvement)
    const validCases = casesSubset.filter(c => c.baseline_pain > 0);
    if (validCases.length < MIN_CLUSTER_SIZE) return null;
    
    let responders = 0;
    for (const c of validCases) {
      const followup = c[`${timepoint}_pain` as keyof CaseData] as number;
      const percentImprovement = ((c.baseline_pain - followup) / c.baseline_pain) * 100;
      if (percentImprovement >= threshold) responders++;
    }
    return Math.round((responders / validCases.length) * 100);
  };

  // Function delta (m3 only) - normalized so positive = improvement
  const m3FunctionCases = cases.filter(c => 
    c.baseline_function !== undefined && 
    c.m3_function !== undefined &&
    c.m3_function_type !== undefined &&
    canCalculateFunctionDelta(c.m3_function_type)
  );
  
  const m3FunctionDeltas = m3FunctionCases.map(c => 
    calculateNormalizedFunctionDelta(c.baseline_function, c.m3_function, c.m3_function_type)
  ).filter((d): d is number => d !== null);

  return {
    // N used for pain
    n_outcomes_used_pain_m1: m1Cases.length,
    n_outcomes_used_pain_m3: m3Cases.length,
    n_outcomes_used_pain_m6: m6Cases.length,
    n_outcomes_used_pain_m12: m12Cases.length,
    
    // Mean delta pain (only show if n >= MIN_CLUSTER_SIZE)
    mean_delta_pain_m1: m1Deltas.length >= MIN_CLUSTER_SIZE ? mean(m1Deltas) : null,
    mean_delta_pain_m3: m3Deltas.length >= MIN_CLUSTER_SIZE ? mean(m3Deltas) : null,
    mean_delta_pain_m6: m6Deltas.length >= MIN_CLUSTER_SIZE ? mean(m6Deltas) : null,
    mean_delta_pain_m12: m12Deltas.length >= MIN_CLUSTER_SIZE ? mean(m12Deltas) : null,
    
    // Response rate 30%
    response_rate_pain_30_m1: calculateResponseRate(m1Cases, 'm1', 30),
    response_rate_pain_30_m3: calculateResponseRate(m3Cases, 'm3', 30),
    response_rate_pain_30_m6: calculateResponseRate(m6Cases, 'm6', 30),
    response_rate_pain_30_m12: calculateResponseRate(m12Cases, 'm12', 30),
    
    // Response rate 50%
    response_rate_pain_50_m1: calculateResponseRate(m1Cases, 'm1', 50),
    response_rate_pain_50_m3: calculateResponseRate(m3Cases, 'm3', 50),
    response_rate_pain_50_m6: calculateResponseRate(m6Cases, 'm6', 50),
    response_rate_pain_50_m12: calculateResponseRate(m12Cases, 'm12', 50),
    
    // Function metrics
    n_outcomes_used_function_m3: m3FunctionDeltas.length,
    mean_delta_function_m3: m3FunctionDeltas.length >= MIN_CLUSTER_SIZE ? mean(m3FunctionDeltas) : null,
  };
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}
