/**
 * Hook for Clinical Performance Benchmark (Phase 6)
 * 
 * Calculates private professional performance seals comparing
 * individual results to national average in comparable clusters.
 * 
 * Two independent axes:
 * - Axis A: Adherence/Volume
 * - Axis B: Clinical Results
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutcomeTimepoint } from './useCollectiveOutcomes';

// Minimum cases per cluster for professional seal eligibility
const MIN_PROFESSIONAL_CASES = 10;
// K-anonymity threshold for national average
const MIN_CLUSTER_SIZE_NATIONAL = 5;
// Threshold for performance classification (±15%)
const PERFORMANCE_THRESHOLD = 0.15;

export type PerformanceStatus = 'above_average' | 'within_average' | 'below_average' | 'insufficient_data';

export interface AdherenceSeal {
  status: PerformanceStatus;
  deltaPercent: number | null;
  metrics: {
    professionalFollowupRate: number;
    nationalFollowupRate: number;
    professionalEligibilityRate: number;
    nationalEligibilityRate: number;
    professionalMonthlyProtocols: number;
    nationalMonthlyProtocols: number;
  } | null;
  nCasesUsed: number;
}

export interface ClusterResultSeal {
  clusterKey: string;
  clusterLabel: string;
  status: PerformanceStatus;
  deltaPercent: number | null;
  metrics: {
    professionalMeanDeltaPain: number | null;
    nationalMeanDeltaPain: number | null;
    professionalResponseRate30: number | null;
    nationalResponseRate30: number | null;
  };
  nCasesUsed: number;
  timepointUsed: OutcomeTimepoint;
}

export interface ResultsSeal {
  status: PerformanceStatus;
  deltaPercent: number | null;
  clusters: ClusterResultSeal[];
  nTotalCases: number;
}

export interface PerformanceBenchmark {
  adherenceSeal: AdherenceSeal;
  resultsSeal: ResultsSeal;
  isEligible: boolean;
  eligibilityReason: string | null;
}

function classifyPerformance(deltaPercent: number | null): PerformanceStatus {
  if (deltaPercent === null) return 'insufficient_data';
  if (deltaPercent >= PERFORMANCE_THRESHOLD) return 'above_average';
  if (deltaPercent <= -PERFORMANCE_THRESHOLD) return 'below_average';
  return 'within_average';
}

function getPerformanceMessage(
  status: PerformanceStatus,
  deltaPercent: number | null,
  context: string
): string {
  const pct = deltaPercent !== null ? Math.abs(Math.round(deltaPercent * 100)) : 0;
  
  switch (status) {
    case 'above_average':
      return `Seus resultados estão ${pct}% acima da média nacional ${context}`;
    case 'within_average':
      return `Seus resultados estão alinhados à média nacional ${context}`;
    case 'below_average':
      return `Seus resultados estão ${pct}% abaixo da média nacional. Há oportunidade de otimização de protocolo.`;
    default:
      return 'Dados insuficientes para benchmark neste momento.';
  }
}

export function usePerformanceBenchmark(selectedTimepoint: OutcomeTimepoint = 'm3') {
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
        return createInsufficientData('Nenhum atendimento registrado.');
      }

      // Get professional's procedure records
      const { data: profRecords, error: profError } = await supabase
        .from('procedure_standard_records')
        .select('id, cluster_key, clinical_standard_status, is_comparable, created_at, attendance_id')
        .in('attendance_id', attendanceIds);

      if (profError) throw profError;

      if (!profRecords || profRecords.length < MIN_PROFESSIONAL_CASES) {
        return createInsufficientData(`Mínimo de ${MIN_PROFESSIONAL_CASES} casos necessários.`);
      }

      // Step 2: Calculate AXIS A - Adherence/Volume metrics
      const adherenceSeal = await calculateAdherenceSeal(user.id, profRecords);

      // Step 3: Calculate AXIS B - Clinical Results per cluster
      const resultsSeal = await calculateResultsSeal(profRecords, selectedTimepoint);

      const isEligible = adherenceSeal.status !== 'insufficient_data' || 
                         resultsSeal.status !== 'insufficient_data';

      return {
        adherenceSeal,
        resultsSeal,
        isEligible,
        eligibilityReason: isEligible ? null : 'Dados insuficientes para calcular benchmark.',
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

function createInsufficientData(reason: string): PerformanceBenchmark {
  return {
    adherenceSeal: {
      status: 'insufficient_data',
      deltaPercent: null,
      metrics: null,
      nCasesUsed: 0,
    },
    resultsSeal: {
      status: 'insufficient_data',
      deltaPercent: null,
      clusters: [],
      nTotalCases: 0,
    },
    isEligible: false,
    eligibilityReason: reason,
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

  // Calculate professional's followup rate (m3)
  const recordsWithM3 = new Set(
    (profOutcomes || [])
      .filter(o => o.timepoint === 'm3')
      .map(o => o.procedure_standard_record_id)
  );
  const profFollowupRate = profRecords.length > 0 
    ? recordsWithM3.size / profRecords.length 
    : 0;

  // Calculate professional's eligibility rate
  const eligibleRecords = profRecords.filter(r => 
    r.is_comparable && 
    ['eligible', 'eligible_with_penalty'].includes(r.clinical_standard_status)
  );
  const profEligibilityRate = profRecords.length > 0 
    ? eligibleRecords.length / profRecords.length 
    : 0;

  // Calculate professional's monthly protocols (last 12 months)
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
    ? nationalRecordsWithM3.size / allRecordIds.length 
    : 0;

  const nationalEligible = (allRecords || []).filter(r => 
    r.is_comparable && 
    ['eligible', 'eligible_with_penalty'].includes(r.clinical_standard_status)
  );
  const nationalEligibilityRate = allRecordIds.length > 0 
    ? nationalEligible.length / allRecordIds.length 
    : 0;

  const nationalRecentRecords = (allRecords || []).filter(r => 
    new Date(r.created_at) >= oneYearAgo
  );
  // Estimate unique professionals (rough approximation)
  const uniqueProfessionals = Math.max(1, Math.ceil(nationalRecentRecords.length / 50));
  const nationalMonthlyProtocols = nationalRecentRecords.length / 12 / uniqueProfessionals;

  // Calculate composite delta (average of the three metrics)
  const followupDelta = nationalFollowupRate > 0 
    ? (profFollowupRate - nationalFollowupRate) / nationalFollowupRate 
    : null;
  const eligibilityDelta = nationalEligibilityRate > 0 
    ? (profEligibilityRate - nationalEligibilityRate) / nationalEligibilityRate 
    : null;
  const monthlyDelta = nationalMonthlyProtocols > 0 
    ? (profMonthlyProtocols - nationalMonthlyProtocols) / nationalMonthlyProtocols 
    : null;

  const validDeltas = [followupDelta, eligibilityDelta, monthlyDelta].filter(d => d !== null) as number[];
  const avgDelta = validDeltas.length > 0 
    ? validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length 
    : null;

  return {
    status: classifyPerformance(avgDelta),
    deltaPercent: avgDelta,
    metrics: {
      professionalFollowupRate: Math.round(profFollowupRate * 100),
      nationalFollowupRate: Math.round(nationalFollowupRate * 100),
      professionalEligibilityRate: Math.round(profEligibilityRate * 100),
      nationalEligibilityRate: Math.round(nationalEligibilityRate * 100),
      professionalMonthlyProtocols: Math.round(profMonthlyProtocols * 10) / 10,
      nationalMonthlyProtocols: Math.round(nationalMonthlyProtocols * 10) / 10,
    },
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

  for (const [clusterKey, records] of clusterGroups) {
    // Check minimum cases for professional
    if (records.length < MIN_PROFESSIONAL_CASES) continue;

    const profRecordIds = records.map(r => r.id);

    // Get professional's outcomes for this cluster
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
    const profDeltas: number[] = [];
    let profResponders30 = 0;
    let profValidForResponse = 0;

    for (const [recordId, outcomes] of outcomesByRecord) {
      const baseline = outcomes.get('baseline');
      const followup = outcomes.get(timepoint);
      
      if (baseline?.pain_score !== null && followup?.pain_score !== null) {
        const delta = baseline.pain_score - followup.pain_score;
        profDeltas.push(delta);
        
        if (baseline.pain_score > 0) {
          profValidForResponse++;
          const pctImprovement = (delta / baseline.pain_score) * 100;
          if (pctImprovement >= 30) profResponders30++;
        }
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

    // Calculate national metrics
    const nationalDeltas: number[] = [];
    let nationalResponders30 = 0;
    let nationalValidForResponse = 0;

    for (const [, outcomes] of nationalOutcomesByRecord) {
      const baseline = outcomes.get('baseline');
      const followup = outcomes.get(timepoint);
      
      if (baseline?.pain_score !== null && followup?.pain_score !== null) {
        const delta = baseline.pain_score - followup.pain_score;
        nationalDeltas.push(delta);
        
        if (baseline.pain_score > 0) {
          nationalValidForResponse++;
          const pctImprovement = (delta / baseline.pain_score) * 100;
          if (pctImprovement >= 30) nationalResponders30++;
        }
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

    const clusterSeal: ClusterResultSeal = {
      clusterKey,
      clusterLabel,
      status: classifyPerformance(deltaPercent),
      deltaPercent,
      metrics: {
        professionalMeanDeltaPain: Math.round(profMeanDeltaPain * 10) / 10,
        nationalMeanDeltaPain: Math.round(nationalMeanDeltaPain * 10) / 10,
        professionalResponseRate30: profResponseRate30 !== null ? Math.round(profResponseRate30) : null,
        nationalResponseRate30: nationalResponseRate30 !== null ? Math.round(nationalResponseRate30) : null,
      },
      nCasesUsed: profDeltas.length,
      timepointUsed: timepoint,
    };

    clusterSeals.push(clusterSeal);

    // Weighted average for overall seal
    if (deltaPercent !== null) {
      totalWeightedDelta += deltaPercent * profDeltas.length;
      totalWeight += profDeltas.length;
    }
  }

  // Sort by case count descending
  clusterSeals.sort((a, b) => b.nCasesUsed - a.nCasesUsed);

  // Calculate overall results seal
  const overallDelta = totalWeight > 0 ? totalWeightedDelta / totalWeight : null;

  return {
    status: classifyPerformance(overallDelta),
    deltaPercent: overallDelta,
    clusters: clusterSeals.slice(0, 5), // Top 5 clusters
    nTotalCases: totalWeight,
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

export function getAdherenceMessage(seal: AdherenceSeal): string {
  return getPerformanceMessage(seal.status, seal.deltaPercent, 'em aderência ao protocolo REGHEN');
}

export function getResultsMessage(seal: ResultsSeal): string {
  return getPerformanceMessage(seal.status, seal.deltaPercent, 'em resultados clínicos');
}

export function getClusterResultMessage(seal: ClusterResultSeal): string {
  const context = `(${seal.clusterLabel}, ${seal.timepointUsed}, n=${seal.nCasesUsed})`;
  return getPerformanceMessage(seal.status, seal.deltaPercent, context);
}
