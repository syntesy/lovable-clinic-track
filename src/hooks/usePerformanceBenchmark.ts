/**
 * Hook for Clinical Performance Benchmark (Phase 6)
 * 
 * Calculates private professional performance seals comparing
 * individual results to national average in comparable clusters.
 * 
 * Two independent axes:
 * - Axis A: Adherence/Volume (with separate metrics)
 * - Axis B: Clinical Results (with conservative mode for low n)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutcomeTimepoint } from './useCollectiveOutcomes';

// Minimum cases per cluster for professional seal eligibility
const MIN_PROFESSIONAL_CASES = 10;
// Threshold for conservative mode (10-19 cases)
const CONSERVATIVE_MODE_THRESHOLD = 20;
// K-anonymity threshold for national average
const MIN_CLUSTER_SIZE_NATIONAL = 5;
// Threshold for performance classification (±15%)
const PERFORMANCE_THRESHOLD = 0.15;
// Default timepoint for official seal
export const DEFAULT_TIMEPOINT: OutcomeTimepoint = 'm3';

export type PerformanceStatus = 'above_average' | 'within_average' | 'below_average' | 'insufficient_data';
export type ConfidenceLevel = 'high' | 'preliminary' | 'insufficient';

export interface AdherenceMetric {
  label: string;
  professional: number;
  national: number;
  deltaPercent: number | null;
  status: PerformanceStatus;
}

export interface AdherenceSeal {
  followupMetric: AdherenceMetric;
  eligibilityMetric: AdherenceMetric;
  volumeMetric: AdherenceMetric;
  overallStatus: PerformanceStatus;
  overallDeltaPercent: number | null;
  nCasesUsed: number;
}

export interface ClusterResultSeal {
  clusterKey: string;
  clusterLabel: string;
  status: PerformanceStatus;
  displayStatus: PerformanceStatus; // May be overridden for conservative mode
  confidenceLevel: ConfidenceLevel;
  deltaPercent: number | null;
  metrics: {
    professionalMeanDeltaPain: number | null;
    nationalMeanDeltaPain: number | null;
    professionalResponseRate30: number | null;
    nationalResponseRate30: number | null;
  };
  nCasesUsed: number;
  nNationalCases: number;
  timepointUsed: OutcomeTimepoint;
  isConservativeMode: boolean;
}

export interface ResultsSeal {
  status: PerformanceStatus;
  displayStatus: PerformanceStatus;
  deltaPercent: number | null;
  clusters: ClusterResultSeal[];
  nTotalCases: number;
  clustersConsidered: string[];
  hasConservativeClusters: boolean;
}

export interface PerformanceBenchmark {
  adherenceSeal: AdherenceSeal;
  resultsSeal: ResultsSeal;
  isEligible: boolean;
  eligibilityReason: string | null;
  calculatedAt: string;
  timepointUsed: OutcomeTimepoint;
}

function classifyPerformance(deltaPercent: number | null): PerformanceStatus {
  if (deltaPercent === null) return 'insufficient_data';
  if (deltaPercent >= PERFORMANCE_THRESHOLD) return 'above_average';
  if (deltaPercent <= -PERFORMANCE_THRESHOLD) return 'below_average';
  return 'within_average';
}

function getConfidenceLevel(nCases: number): ConfidenceLevel {
  if (nCases < MIN_PROFESSIONAL_CASES) return 'insufficient';
  if (nCases < CONSERVATIVE_MODE_THRESHOLD) return 'preliminary';
  return 'high';
}

function getPerformanceMessage(
  status: PerformanceStatus,
  deltaPercent: number | null,
  context: string,
  isConservative: boolean = false
): string {
  const pct = deltaPercent !== null ? Math.abs(Math.round(deltaPercent * 100)) : 0;
  
  const conservativeNote = isConservative 
    ? ' (estimativa com amostra pequena — dados iniciais)'
    : '';
  
  switch (status) {
    case 'above_average':
      return `Seus resultados estão ${pct}% acima da média nacional ${context}${conservativeNote}`;
    case 'within_average':
      return `Seus resultados estão alinhados à média nacional ${context}${conservativeNote}`;
    case 'below_average':
      return `Oportunidade de otimização: seus resultados estão ${pct}% abaixo da média nacional. Veja quais clusters puxaram sua média.`;
    default:
      return 'Dados insuficientes para benchmark neste momento.';
  }
}

/**
 * Logs seal calculation to audit_logs for traceability
 */
async function logSealCalculation(
  userId: string,
  benchmark: PerformanceBenchmark
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'PERFORMANCE_SEAL_CALCULATED',
      table_name: 'performance_benchmark',
      additional_info: {
        timestamp: benchmark.calculatedAt,
        timepoint_used: benchmark.timepointUsed,
        thresholds: {
          min_professional_cases: MIN_PROFESSIONAL_CASES,
          conservative_threshold: CONSERVATIVE_MODE_THRESHOLD,
          min_national_cases: MIN_CLUSTER_SIZE_NATIONAL,
          performance_threshold: PERFORMANCE_THRESHOLD,
        },
        adherence_n_used: benchmark.adherenceSeal.nCasesUsed,
        results_n_used: benchmark.resultsSeal.nTotalCases,
        clusters_evaluated: benchmark.resultsSeal.clustersConsidered,
        adherence_status: benchmark.adherenceSeal.overallStatus,
        results_status: benchmark.resultsSeal.status,
        has_conservative_clusters: benchmark.resultsSeal.hasConservativeClusters,
      },
    });
  } catch (error) {
    // Silent fail for audit - don't break the main flow
    console.warn('Failed to log seal calculation:', error);
  }
}

export function usePerformanceBenchmark(selectedTimepoint: OutcomeTimepoint = DEFAULT_TIMEPOINT) {
  return useQuery({
    queryKey: ['performance-benchmark', selectedTimepoint],
    queryFn: async (): Promise<PerformanceBenchmark> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Step 1: Get professional's procedure_standard_records via attendance_sessions
      const { data: attendances, error: attError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('user_id', user.id);

      if (attError) throw attError;

      const attendanceIds = attendances?.map(a => a.id) || [];

      if (attendanceIds.length === 0) {
        return createInsufficientData('Nenhum atendimento registrado.', selectedTimepoint);
      }

      // Get professional's procedure records
      const { data: profRecords, error: profError } = await supabase
        .from('procedure_standard_records')
        .select('id, cluster_key, clinical_standard_status, is_comparable, created_at, attendance_id')
        .in('attendance_id', attendanceIds);

      if (profError) throw profError;

      if (!profRecords || profRecords.length < MIN_PROFESSIONAL_CASES) {
        return createInsufficientData(`Mínimo de ${MIN_PROFESSIONAL_CASES} casos necessários.`, selectedTimepoint);
      }

      // Step 2: Calculate AXIS A - Adherence/Volume metrics (separate metrics)
      const adherenceSeal = await calculateAdherenceSeal(user.id, profRecords);

      // Step 3: Calculate AXIS B - Clinical Results per cluster (with conservative mode)
      const resultsSeal = await calculateResultsSeal(profRecords, selectedTimepoint);

      const isEligible = adherenceSeal.overallStatus !== 'insufficient_data' || 
                         resultsSeal.status !== 'insufficient_data';

      const calculatedAt = new Date().toISOString();

      const benchmark: PerformanceBenchmark = {
        adherenceSeal,
        resultsSeal,
        isEligible,
        eligibilityReason: isEligible ? null : 'Dados insuficientes para calcular benchmark.',
        calculatedAt,
        timepointUsed: selectedTimepoint,
      };

      // Log to audit (async, non-blocking)
      logSealCalculation(user.id, benchmark);

      return benchmark;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

function createInsufficientData(reason: string, timepoint: OutcomeTimepoint): PerformanceBenchmark {
  const emptyMetric: AdherenceMetric = {
    label: '',
    professional: 0,
    national: 0,
    deltaPercent: null,
    status: 'insufficient_data',
  };

  return {
    adherenceSeal: {
      followupMetric: { ...emptyMetric, label: 'Follow-up M3' },
      eligibilityMetric: { ...emptyMetric, label: 'Elegibilidade' },
      volumeMetric: { ...emptyMetric, label: 'Protocolos/mês' },
      overallStatus: 'insufficient_data',
      overallDeltaPercent: null,
      nCasesUsed: 0,
    },
    resultsSeal: {
      status: 'insufficient_data',
      displayStatus: 'insufficient_data',
      deltaPercent: null,
      clusters: [],
      nTotalCases: 0,
      clustersConsidered: [],
      hasConservativeClusters: false,
    },
    isEligible: false,
    eligibilityReason: reason,
    calculatedAt: new Date().toISOString(),
    timepointUsed: timepoint,
  };
}

async function calculateAdherenceSeal(
  userId: string,
  profRecords: any[]
): Promise<AdherenceSeal> {
  const profRecordIds = profRecords.map(r => r.id);
  
  // Get outcomes for professional's records
  const { data: profOutcomes } = await supabase
    .from('patient_reported_outcomes')
    .select('procedure_standard_record_id, timepoint')
    .in('procedure_standard_record_id', profRecordIds);

  // === METRIC 1: Follow-up Rate (M3) ===
  const recordsWithM3 = new Set(
    (profOutcomes || [])
      .filter(o => o.timepoint === 'm3')
      .map(o => o.procedure_standard_record_id)
  );
  const profFollowupRate = profRecords.length > 0 
    ? (recordsWithM3.size / profRecords.length) * 100
    : 0;

  // === METRIC 2: Eligibility Rate ===
  const eligibleRecords = profRecords.filter(r => 
    r.is_comparable && 
    ['eligible', 'eligible_with_penalty'].includes(r.clinical_standard_status)
  );
  const profEligibilityRate = profRecords.length > 0 
    ? (eligibleRecords.length / profRecords.length) * 100
    : 0;

  // === METRIC 3: Monthly Protocols (last 12 months) ===
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentRecords = profRecords.filter(r => 
    new Date(r.created_at) >= oneYearAgo
  );
  const profMonthlyProtocols = recentRecords.length / 12;

  // Get NATIONAL averages (all professionals, anonymized)
  const { data: allRecords } = await supabase
    .from('procedure_standard_records')
    .select('id, is_comparable, clinical_standard_status, created_at');

  const { data: allOutcomes } = await supabase
    .from('patient_reported_outcomes')
    .select('procedure_standard_record_id, timepoint')
    .eq('timepoint', 'm3');

  const allRecordIds = (allRecords || []).map(r => r.id);
  const nationalRecordsWithM3 = new Set(
    (allOutcomes || []).map(o => o.procedure_standard_record_id)
  );
  const nationalFollowupRate = allRecordIds.length > 0 
    ? (nationalRecordsWithM3.size / allRecordIds.length) * 100
    : 0;

  const nationalEligible = (allRecords || []).filter(r => 
    r.is_comparable && 
    ['eligible', 'eligible_with_penalty'].includes(r.clinical_standard_status)
  );
  const nationalEligibilityRate = allRecordIds.length > 0 
    ? (nationalEligible.length / allRecordIds.length) * 100
    : 0;

  const nationalRecentRecords = (allRecords || []).filter(r => 
    new Date(r.created_at) >= oneYearAgo
  );
  // Estimate unique professionals (rough approximation)
  const uniqueProfessionals = Math.max(1, Math.ceil(nationalRecentRecords.length / 50));
  const nationalMonthlyProtocols = nationalRecentRecords.length / 12 / uniqueProfessionals;

  // Calculate individual deltas
  const followupDelta = nationalFollowupRate > 0 
    ? (profFollowupRate - nationalFollowupRate) / nationalFollowupRate 
    : null;
  const eligibilityDelta = nationalEligibilityRate > 0 
    ? (profEligibilityRate - nationalEligibilityRate) / nationalEligibilityRate 
    : null;
  const volumeDelta = nationalMonthlyProtocols > 0 
    ? (profMonthlyProtocols - nationalMonthlyProtocols) / nationalMonthlyProtocols 
    : null;

  // Create separate metrics
  const followupMetric: AdherenceMetric = {
    label: 'Follow-up M3',
    professional: Math.round(profFollowupRate),
    national: Math.round(nationalFollowupRate),
    deltaPercent: followupDelta,
    status: classifyPerformance(followupDelta),
  };

  const eligibilityMetric: AdherenceMetric = {
    label: 'Elegibilidade CSE',
    professional: Math.round(profEligibilityRate),
    national: Math.round(nationalEligibilityRate),
    deltaPercent: eligibilityDelta,
    status: classifyPerformance(eligibilityDelta),
  };

  const volumeMetric: AdherenceMetric = {
    label: 'Protocolos/mês',
    professional: Math.round(profMonthlyProtocols * 10) / 10,
    national: Math.round(nationalMonthlyProtocols * 10) / 10,
    deltaPercent: volumeDelta,
    status: classifyPerformance(volumeDelta),
  };

  // Calculate overall (weighted by importance: followup + eligibility more than volume)
  const validDeltas = [followupDelta, eligibilityDelta].filter(d => d !== null) as number[];
  const avgDelta = validDeltas.length > 0 
    ? validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length 
    : null;

  return {
    followupMetric,
    eligibilityMetric,
    volumeMetric,
    overallStatus: classifyPerformance(avgDelta),
    overallDeltaPercent: avgDelta,
    nCasesUsed: profRecords.length,
  };
}

async function calculateResultsSeal(
  profRecords: any[],
  timepoint: OutcomeTimepoint
): Promise<ResultsSeal> {
  // Group professional's records by cluster_key
  const clusterGroups = new Map<string, any[]>();
  for (const record of profRecords) {
    if (!record.cluster_key || !record.is_comparable) continue;
    if (!['eligible', 'eligible_with_penalty'].includes(record.clinical_standard_status)) continue;
    
    if (!clusterGroups.has(record.cluster_key)) {
      clusterGroups.set(record.cluster_key, []);
    }
    clusterGroups.get(record.cluster_key)!.push(record);
  }

  const clusterSeals: ClusterResultSeal[] = [];
  let totalWeightedDelta = 0;
  let totalWeight = 0;
  const clustersConsidered: string[] = [];
  let hasConservativeClusters = false;

  for (const [clusterKey, records] of clusterGroups) {
    // Check minimum cases for professional
    if (records.length < MIN_PROFESSIONAL_CASES) continue;

    const profRecordIds = records.map(r => r.id);

    // Get professional's outcomes for this cluster
    // GUARDRAIL: Only consider cases with BOTH baseline AND follow-up
    const { data: profOutcomes } = await supabase
      .from('patient_reported_outcomes')
      .select('*')
      .in('procedure_standard_record_id', profRecordIds)
      .in('timepoint', ['baseline', timepoint]);

    // Build outcome map
    const outcomesByRecord = new Map<string, Map<string, any>>();
    for (const outcome of profOutcomes || []) {
      if (!outcome.procedure_standard_record_id) continue;
      if (!outcomesByRecord.has(outcome.procedure_standard_record_id)) {
        outcomesByRecord.set(outcome.procedure_standard_record_id, new Map());
      }
      outcomesByRecord.get(outcome.procedure_standard_record_id)!.set(outcome.timepoint, outcome);
    }

    // Calculate professional's metrics
    // GUARDRAIL: Only include cases with COMPLETE outcomes (baseline + follow-up)
    const profDeltas: number[] = [];
    let profResponders30 = 0;
    let profValidForResponse = 0;

    for (const [recordId, outcomes] of outcomesByRecord) {
      const baseline = outcomes.get('baseline');
      const followup = outcomes.get(timepoint);
      
      // GUARDRAIL: Require both baseline and follow-up
      if (baseline?.pain_score === null || followup?.pain_score === null) continue;
      if (baseline?.pain_score === undefined || followup?.pain_score === undefined) continue;
      
      const delta = baseline.pain_score - followup.pain_score;
      profDeltas.push(delta);
      
      // GUARDRAIL: Baseline > 0 for response rate calculation
      if (baseline.pain_score > 0) {
        profValidForResponse++;
        const pctImprovement = (delta / baseline.pain_score) * 100;
        if (pctImprovement >= 30) profResponders30++;
      }
    }

    if (profDeltas.length < MIN_CLUSTER_SIZE_NATIONAL) continue;

    const profMeanDeltaPain = profDeltas.reduce((a, b) => a + b, 0) / profDeltas.length;
    const profResponseRate30 = profValidForResponse > 0 
      ? (profResponders30 / profValidForResponse) * 100 
      : null;

    // Get NATIONAL averages for this cluster
    const { data: allClusterRecords } = await supabase
      .from('procedure_standard_records')
      .select('id')
      .eq('cluster_key', clusterKey)
      .eq('is_comparable', true)
      .in('clinical_standard_status', ['eligible', 'eligible_with_penalty']);

    if (!allClusterRecords || allClusterRecords.length < MIN_CLUSTER_SIZE_NATIONAL) continue;

    const allClusterRecordIds = allClusterRecords.map(r => r.id);

    const { data: allOutcomes } = await supabase
      .from('patient_reported_outcomes')
      .select('*')
      .in('procedure_standard_record_id', allClusterRecordIds)
      .in('timepoint', ['baseline', timepoint]);

    // Build national outcome map
    const nationalOutcomesByRecord = new Map<string, Map<string, any>>();
    for (const outcome of allOutcomes || []) {
      if (!outcome.procedure_standard_record_id) continue;
      if (!nationalOutcomesByRecord.has(outcome.procedure_standard_record_id)) {
        nationalOutcomesByRecord.set(outcome.procedure_standard_record_id, new Map());
      }
      nationalOutcomesByRecord.get(outcome.procedure_standard_record_id)!.set(outcome.timepoint, outcome);
    }

    // Calculate national metrics (same guardrails)
    const nationalDeltas: number[] = [];
    let nationalResponders30 = 0;
    let nationalValidForResponse = 0;

    for (const [, outcomes] of nationalOutcomesByRecord) {
      const baseline = outcomes.get('baseline');
      const followup = outcomes.get(timepoint);
      
      if (baseline?.pain_score === null || followup?.pain_score === null) continue;
      if (baseline?.pain_score === undefined || followup?.pain_score === undefined) continue;
      
      const delta = baseline.pain_score - followup.pain_score;
      nationalDeltas.push(delta);
      
      if (baseline.pain_score > 0) {
        nationalValidForResponse++;
        const pctImprovement = (delta / baseline.pain_score) * 100;
        if (pctImprovement >= 30) nationalResponders30++;
      }
    }

    if (nationalDeltas.length < MIN_CLUSTER_SIZE_NATIONAL) continue;

    const nationalMeanDeltaPain = nationalDeltas.reduce((a, b) => a + b, 0) / nationalDeltas.length;
    const nationalResponseRate30 = nationalValidForResponse > 0 
      ? (nationalResponders30 / nationalValidForResponse) * 100 
      : null;

    // Calculate delta percent
    const deltaPercent = nationalMeanDeltaPain !== 0 
      ? (profMeanDeltaPain - nationalMeanDeltaPain) / Math.abs(nationalMeanDeltaPain) 
      : null;

    // Create human-readable cluster label
    const clusterLabel = createClusterLabel(clusterKey);
    clustersConsidered.push(clusterLabel);

    // Determine confidence level and conservative mode
    const confidenceLevel = getConfidenceLevel(profDeltas.length);
    const isConservativeMode = confidenceLevel === 'preliminary';
    if (isConservativeMode) hasConservativeClusters = true;

    // Calculate raw status
    const rawStatus = classifyPerformance(deltaPercent);
    
    // Apply conservative mode override: force to within_average if low n
    const displayStatus = isConservativeMode ? 'within_average' : rawStatus;

    const clusterSeal: ClusterResultSeal = {
      clusterKey,
      clusterLabel,
      status: rawStatus,
      displayStatus,
      confidenceLevel,
      deltaPercent,
      metrics: {
        professionalMeanDeltaPain: Math.round(profMeanDeltaPain * 10) / 10,
        nationalMeanDeltaPain: Math.round(nationalMeanDeltaPain * 10) / 10,
        professionalResponseRate30: profResponseRate30 !== null ? Math.round(profResponseRate30) : null,
        nationalResponseRate30: nationalResponseRate30 !== null ? Math.round(nationalResponseRate30) : null,
      },
      nCasesUsed: profDeltas.length,
      nNationalCases: nationalDeltas.length,
      timepointUsed: timepoint,
      isConservativeMode,
    };

    clusterSeals.push(clusterSeal);

    // Weighted average for overall seal (only use non-conservative clusters for weighting)
    if (deltaPercent !== null && !isConservativeMode) {
      totalWeightedDelta += deltaPercent * profDeltas.length;
      totalWeight += profDeltas.length;
    }
  }

  // Sort by case count descending
  clusterSeals.sort((a, b) => b.nCasesUsed - a.nCasesUsed);

  // Calculate overall results seal
  const overallDelta = totalWeight > 0 ? totalWeightedDelta / totalWeight : null;
  const rawOverallStatus = classifyPerformance(overallDelta);

  // If all clusters are conservative, overall is also conservative
  const allConservative = clusterSeals.length > 0 && clusterSeals.every(c => c.isConservativeMode);
  const displayOverallStatus = allConservative ? 'within_average' : rawOverallStatus;

  return {
    status: rawOverallStatus,
    displayStatus: displayOverallStatus,
    deltaPercent: overallDelta,
    clusters: clusterSeals.slice(0, 5), // Top 5 clusters
    nTotalCases: clusterSeals.reduce((sum, c) => sum + c.nCasesUsed, 0),
    clustersConsidered,
    hasConservativeClusters,
  };
}

function createClusterLabel(clusterKey: string): string {
  const parts = clusterKey.split('|');
  const labelMap: Record<string, string> = {
    'PRP': 'PRP',
    'JOELHO': 'Joelho',
    'OMBRO': 'Ombro',
    'QUADRIL': 'Quadril',
    'ARTROSE': 'Artrose',
    'TENDINOPATIA': 'Tendinopatia',
    'KL_2': 'KL2',
    'KL_3': 'KL3',
    'LEVE': 'Leve',
    'MODERADA': 'Moderada',
    'HA:SIM': '+HA',
    'HA:NAO': '',
  };

  return parts
    .map(p => labelMap[p] || p)
    .filter(p => p && p !== '')
    .join(' ')
    .trim();
}

export function getAdherenceMetricMessage(metric: AdherenceMetric): string {
  const pct = metric.deltaPercent !== null ? Math.abs(Math.round(metric.deltaPercent * 100)) : 0;
  
  switch (metric.status) {
    case 'above_average':
      return `+${pct}% acima da média`;
    case 'within_average':
      return 'Dentro da média';
    case 'below_average':
      return `-${pct}% abaixo da média`;
    default:
      return 'Dados insuficientes';
  }
}

export function getAdherenceMessage(seal: AdherenceSeal): string {
  return getPerformanceMessage(seal.overallStatus, seal.overallDeltaPercent, 'em aderência ao protocolo REGHEN');
}

export function getResultsMessage(seal: ResultsSeal): string {
  const isConservative = seal.hasConservativeClusters;
  return getPerformanceMessage(seal.displayStatus, seal.deltaPercent, 'em resultados clínicos', isConservative);
}

export function getClusterResultMessage(seal: ClusterResultSeal): string {
  const context = `(${seal.clusterLabel}, ${seal.timepointUsed.toUpperCase()}, n=${seal.nCasesUsed})`;
  return getPerformanceMessage(seal.displayStatus, seal.deltaPercent, context, seal.isConservativeMode);
}
