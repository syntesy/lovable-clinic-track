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

export type OutcomeTimepoint = 'baseline' | 'm1' | 'm3' | 'm6' | 'm12';

export interface OutcomeStats {
  n_with_baseline: number;
  n_with_followup_m1: number;
  n_with_followup_m3: number;
  n_with_followup_m6: number;
  n_with_followup_m12: number;
}

export interface ClusterOutcomeAggregation {
  cluster_key: string;
  case_count: number;
  n_with_outcomes: number; // baseline + at least 1 followup
  mean_delta_pain_m1: number | null;
  mean_delta_pain_m3: number | null;
  mean_delta_pain_m6: number | null;
  mean_delta_pain_m12: number | null;
  response_rate_pain_30_m1: number | null;
  response_rate_pain_30_m3: number | null;
  response_rate_pain_30_m6: number | null;
  response_rate_pain_30_m12: number | null;
  mean_delta_function_m3: number | null;
}

const MIN_CLUSTER_SIZE = 5; // k-anonymity threshold

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
    const validCases: Array<{
      baseline_pain: number;
      m1_pain?: number;
      m3_pain?: number;
      m6_pain?: number;
      m12_pain?: number;
      baseline_function?: number;
      m3_function?: number;
    }> = [];

    for (const record of clusterRecords) {
      const outcomes = outcomesByRecord.get(record.id);
      if (!outcomes) continue;

      const baseline = outcomes.get('baseline');
      if (!baseline || baseline.pain_score === null) continue;

      // Need baseline + at least 1 follow-up
      const hasFollowup = outcomes.has('m1') || outcomes.has('m3') || outcomes.has('m6') || outcomes.has('m12');
      if (!hasFollowup) continue;

      const caseData: any = {
        baseline_pain: baseline.pain_score,
        baseline_function: baseline.function_score,
      };

      const m1 = outcomes.get('m1');
      if (m1?.pain_score !== null && m1?.pain_score !== undefined) caseData.m1_pain = m1.pain_score;
      
      const m3 = outcomes.get('m3');
      if (m3?.pain_score !== null && m3?.pain_score !== undefined) caseData.m3_pain = m3.pain_score;
      if (m3?.function_score !== null && m3?.function_score !== undefined) caseData.m3_function = m3.function_score;
      
      const m6 = outcomes.get('m6');
      if (m6?.pain_score !== null && m6?.pain_score !== undefined) caseData.m6_pain = m6.pain_score;
      
      const m12 = outcomes.get('m12');
      if (m12?.pain_score !== null && m12?.pain_score !== undefined) caseData.m12_pain = m12.pain_score;

      validCases.push(caseData);
    }

    // Apply k-anonymity to outcomes too
    const nWithOutcomes = validCases.length;

    // Calculate metrics only if we have enough cases
    const metrics = nWithOutcomes >= MIN_CLUSTER_SIZE 
      ? calculateMetrics(validCases) 
      : createEmptyMetrics();

    aggregations.push({
      cluster_key: clusterKey,
      case_count: count,
      n_with_outcomes: nWithOutcomes,
      ...metrics,
    });
  }

  return aggregations.sort((a, b) => b.case_count - a.case_count);
}

function calculateMetrics(cases: any[]): Omit<ClusterOutcomeAggregation, 'cluster_key' | 'case_count' | 'n_with_outcomes'> {
  // Mean delta pain for each timepoint
  const m1Deltas = cases.filter(c => c.m1_pain !== undefined).map(c => c.baseline_pain - c.m1_pain);
  const m3Deltas = cases.filter(c => c.m3_pain !== undefined).map(c => c.baseline_pain - c.m3_pain);
  const m6Deltas = cases.filter(c => c.m6_pain !== undefined).map(c => c.baseline_pain - c.m6_pain);
  const m12Deltas = cases.filter(c => c.m12_pain !== undefined).map(c => c.baseline_pain - c.m12_pain);

  // Response rate 30% for each timepoint
  const calculateResponseRate30 = (deltas: number[], baselines: number[]): number | null => {
    if (deltas.length < MIN_CLUSTER_SIZE) return null;
    let responders = 0;
    for (let i = 0; i < deltas.length; i++) {
      const improvementPct = (deltas[i] / baselines[i]) * 100;
      if (improvementPct >= 30) responders++;
    }
    return Math.round((responders / deltas.length) * 100);
  };

  const m1Baselines = cases.filter(c => c.m1_pain !== undefined).map(c => c.baseline_pain);
  const m3Baselines = cases.filter(c => c.m3_pain !== undefined).map(c => c.baseline_pain);
  const m6Baselines = cases.filter(c => c.m6_pain !== undefined).map(c => c.baseline_pain);
  const m12Baselines = cases.filter(c => c.m12_pain !== undefined).map(c => c.baseline_pain);

  // Function delta (m3 only for now)
  const m3FunctionDeltas = cases
    .filter(c => c.baseline_function !== undefined && c.m3_function !== undefined)
    .map(c => c.baseline_function - c.m3_function);

  return {
    mean_delta_pain_m1: m1Deltas.length >= MIN_CLUSTER_SIZE ? mean(m1Deltas) : null,
    mean_delta_pain_m3: m3Deltas.length >= MIN_CLUSTER_SIZE ? mean(m3Deltas) : null,
    mean_delta_pain_m6: m6Deltas.length >= MIN_CLUSTER_SIZE ? mean(m6Deltas) : null,
    mean_delta_pain_m12: m12Deltas.length >= MIN_CLUSTER_SIZE ? mean(m12Deltas) : null,
    response_rate_pain_30_m1: calculateResponseRate30(m1Deltas, m1Baselines),
    response_rate_pain_30_m3: calculateResponseRate30(m3Deltas, m3Baselines),
    response_rate_pain_30_m6: calculateResponseRate30(m6Deltas, m6Baselines),
    response_rate_pain_30_m12: calculateResponseRate30(m12Deltas, m12Baselines),
    mean_delta_function_m3: m3FunctionDeltas.length >= MIN_CLUSTER_SIZE ? mean(m3FunctionDeltas) : null,
  };
}

function createEmptyMetrics(): Omit<ClusterOutcomeAggregation, 'cluster_key' | 'case_count' | 'n_with_outcomes'> {
  return {
    mean_delta_pain_m1: null,
    mean_delta_pain_m3: null,
    mean_delta_pain_m6: null,
    mean_delta_pain_m12: null,
    response_rate_pain_30_m1: null,
    response_rate_pain_30_m3: null,
    response_rate_pain_30_m6: null,
    response_rate_pain_30_m12: null,
    mean_delta_function_m3: null,
  };
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}
