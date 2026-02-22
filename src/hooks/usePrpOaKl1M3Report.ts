/**
 * usePrpOaKl1M3Report — Shared hook for the PRP in OA KL1 with M3 follow-up report.
 *
 * Single data layer used by both:
 *   - "Minha Performance Clínica" (scope: CLINIC, clinic_id resolved internally)
 *   - "Padrões Clínicos" (scope: COLLECTIVE, no clinic_id filter)
 *
 * Cohort criteria:
 *   - attendance_pathology: diagnosis_stage = CONFIRMED, structural_model = KELLGREN_LAWRENCE, structural_grade = KL1
 *   - procedure_standard_records: procedure_type = PRP
 *   - patient_reported_outcomes: baseline + m3 with non-null pain_score AND function_score
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateNormalizedFunctionDelta } from '@/lib/function-scale-map';

// ─── Types ────────────────────────────────────────────────────────

export type ReportScope = 'CLINIC' | 'COLLECTIVE';

export interface DeltaPainStats {
  n: number;
  mean: number;
  median: number;
  stdDev: number;
  pctImproved2pts: number; // % with baseline - m3 >= 2
  pctAdverseEvent: number;
}

export interface DeltaFunctionStats {
  n: number;
  mean: number;
  median: number;
}

export interface ProtocolBreakdown {
  protocolId: string;
  protocolTitle: string;
  n: number;
  meanDeltaPain: number;
  meanDeltaFunction: number | null;
}

export interface PrpOaKl1M3Report {
  nTotalEligible: number;     // Total matching cohort (CONFIRMED + KL1 + PRP)
  nExcludedIncomplete: number; // Excluded due to missing baseline/m3
  nIncluded: number;           // Final included in analysis
  deltaPainStats: DeltaPainStats;
  deltaFunctionStats: DeltaFunctionStats;
  adverseEventRate: number;
  protocolBreakdown: ProtocolBreakdown[];
  // Raw case-level data (only for CLINIC scope)
  cases?: CaseDetail[];
}

export interface CaseDetail {
  attendanceId: string;
  baselinePain: number;
  m3Pain: number;
  deltaPain: number;
  baselineFunction: number | null;
  m3Function: number | null;
  deltaFunction: number | null;
  functionScaleType: string | null;
  protocolTitle: string | null;
  adverseEvent: boolean;
}

// ─── Clinic resolver ──────────────────────────────────────────────

let _cachedClinicId: string | null = null;

async function getClinicId(): Promise<string | null> {
  if (_cachedClinicId) return _cachedClinicId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('clinics')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (data?.id) _cachedClinicId = data.id;
  return _cachedClinicId;
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') _cachedClinicId = null;
});

// ─── Stats helpers ────────────────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(arr: number[], mean: number): number {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ─── Data fetching ────────────────────────────────────────────────

async function fetchReport(scope: ReportScope): Promise<PrpOaKl1M3Report> {
  let clinicId: string | null = null;
  if (scope === 'CLINIC') {
    clinicId = await getClinicId();
    if (!clinicId) throw new Error('Clínica não encontrada.');
  }

  // Step 1: Get all attendance_ids with CONFIRMED KL1 diagnosis
  const { data: confirmedAp, error: apError } = await supabase
    .from('attendance_pathology')
    .select('attendance_id')
    .eq('diagnosis_stage', 'CONFIRMED')
    .eq('structural_model', 'KELLGREN_LAWRENCE')
    .eq('structural_grade', 'KL1');

  if (apError) throw new Error(apError.message);
  if (!confirmedAp || confirmedAp.length === 0) {
    return emptyReport();
  }

  const attendanceIds = confirmedAp.map(r => r.attendance_id);

  // Step 2: Get PRP procedures for those attendances
  let psrQuery = supabase
    .from('procedure_standard_records')
    .select('id, attendance_id, protocol_id')
    .eq('procedure_type', 'PRP')
    .in('attendance_id', attendanceIds);

  if (scope === 'CLINIC' && clinicId) {
    psrQuery = psrQuery.eq('clinic_id', clinicId);
  }

  const { data: psrRecords, error: psrError } = await psrQuery;
  if (psrError) throw new Error(psrError.message);
  if (!psrRecords || psrRecords.length === 0) {
    return emptyReport();
  }

  const nTotalEligible = psrRecords.length;

  // Build maps for PSR -> attendance and PSR ids
  const psrIds = psrRecords.map(r => r.id);
  const psrAttendanceMap = new Map<string, string>(); // psrId -> attendanceId
  const psrProtocolMap = new Map<string, string | null>(); // psrId -> protocolId
  for (const psr of psrRecords) {
    psrAttendanceMap.set(psr.id, psr.attendance_id);
    psrProtocolMap.set(psr.id, psr.protocol_id);
  }
  const relevantAttendanceIds = [...new Set(psrRecords.map(r => r.attendance_id))];

  // Step 3: Get PROs (baseline + m3) for these procedures/attendances
  // First try by procedure_standard_record_id
  let proQuery = supabase
    .from('patient_reported_outcomes')
    .select('id, attendance_id, procedure_standard_record_id, timepoint, pain_score, function_score, function_scale_type, adverse_event')
    .in('timepoint', ['baseline', 'm3']);

  if (scope === 'CLINIC' && clinicId) {
    proQuery = proQuery.eq('clinic_id', clinicId);
  }

  // We need PROs linked to our PSRs or attendances
  // Fetch by attendance_id (covers both linked and unlinked PROs)
  proQuery = proQuery.in('attendance_id', relevantAttendanceIds);

  const { data: proRecords, error: proError } = await proQuery;
  if (proError) throw new Error(proError.message);

  // Step 4: Match PROs to PSRs
  // Priority: procedure_standard_record_id match, fallback: attendance_id match
  interface MatchedCase {
    psrId: string;
    attendanceId: string;
    protocolId: string | null;
    baseline: typeof proRecords[0];
    m3: typeof proRecords[0];
  }

  const matchedCases: MatchedCase[] = [];

  for (const psr of psrRecords) {
    // Find baseline and m3 PROs for this PSR
    // Priority 1: by procedure_standard_record_id
    let baseline = proRecords?.find(
      p => p.procedure_standard_record_id === psr.id && p.timepoint === 'baseline'
    );
    let m3 = proRecords?.find(
      p => p.procedure_standard_record_id === psr.id && p.timepoint === 'm3'
    );

    // Priority 2: fallback by attendance_id
    if (!baseline) {
      baseline = proRecords?.find(
        p => p.attendance_id === psr.attendance_id && p.timepoint === 'baseline' && !p.procedure_standard_record_id
      );
    }
    if (!m3) {
      m3 = proRecords?.find(
        p => p.attendance_id === psr.attendance_id && p.timepoint === 'm3' && !p.procedure_standard_record_id
      );
    }

    // Check completeness
    if (
      baseline && m3 &&
      baseline.pain_score !== null && m3.pain_score !== null &&
      baseline.function_score !== null && m3.function_score !== null
    ) {
      matchedCases.push({
        psrId: psr.id,
        attendanceId: psr.attendance_id,
        protocolId: psr.protocol_id,
        baseline,
        m3,
      });
    }
  }

  const nIncluded = matchedCases.length;
  const nExcluded = nTotalEligible - nIncluded;

  if (nIncluded === 0) {
    return {
      nTotalEligible,
      nExcludedIncomplete: nExcluded,
      nIncluded: 0,
      deltaPainStats: { n: 0, mean: 0, median: 0, stdDev: 0, pctImproved2pts: 0, pctAdverseEvent: 0 },
      deltaFunctionStats: { n: 0, mean: 0, median: 0 },
      adverseEventRate: 0,
      protocolBreakdown: [],
    };
  }

  // Step 5: Calculate metrics
  const deltaPains: number[] = [];
  const deltaFunctions: number[] = [];
  let adverseCount = 0;
  let improved2pts = 0;

  const cases: CaseDetail[] = [];

  for (const mc of matchedCases) {
    const dp = mc.m3.pain_score! - mc.baseline.pain_score!; // negative = improvement
    deltaPains.push(dp);

    if (mc.baseline.pain_score! - mc.m3.pain_score! >= 2) {
      improved2pts++;
    }

    if (mc.m3.adverse_event) {
      adverseCount++;
    }

    // Normalized function delta (positive = improvement)
    const scaleType = mc.m3.function_scale_type || mc.baseline.function_scale_type;
    const df = calculateNormalizedFunctionDelta(
      mc.baseline.function_score ? Number(mc.baseline.function_score) : null,
      mc.m3.function_score ? Number(mc.m3.function_score) : null,
      scaleType
    );
    if (df !== null) {
      deltaFunctions.push(df);
    }

    if (scope === 'CLINIC') {
      cases.push({
        attendanceId: mc.attendanceId,
        baselinePain: mc.baseline.pain_score!,
        m3Pain: mc.m3.pain_score!,
        deltaPain: dp,
        baselineFunction: mc.baseline.function_score ? Number(mc.baseline.function_score) : null,
        m3Function: mc.m3.function_score ? Number(mc.m3.function_score) : null,
        deltaFunction: df,
        functionScaleType: scaleType || null,
        protocolTitle: null, // will be enriched below
        adverseEvent: mc.m3.adverse_event,
      });
    }
  }

  const meanDeltaPain = mean(deltaPains);
  const deltaPainStats: DeltaPainStats = {
    n: nIncluded,
    mean: meanDeltaPain,
    median: median(deltaPains),
    stdDev: stdDev(deltaPains, meanDeltaPain),
    pctImproved2pts: Math.round((improved2pts / nIncluded) * 100),
    pctAdverseEvent: Math.round((adverseCount / nIncluded) * 100),
  };

  const meanDeltaFunc = mean(deltaFunctions);
  const deltaFunctionStats: DeltaFunctionStats = {
    n: deltaFunctions.length,
    mean: meanDeltaFunc,
    median: median(deltaFunctions),
  };

  // Step 6: Protocol breakdown
  const protocolIds = [...new Set(matchedCases.filter(mc => mc.protocolId).map(mc => mc.protocolId!))];
  let protocolTitleMap = new Map<string, string>();

  if (protocolIds.length > 0) {
    const { data: protocols } = await supabase
      .from('protocols')
      .select('id, title')
      .in('id', protocolIds);
    if (protocols) {
      for (const p of protocols) {
        protocolTitleMap.set(p.id, p.title);
      }
    }
  }

  // Group by protocol
  const byProtocol = new Map<string, { deltaPains: number[]; deltaFunctions: number[] }>();
  for (const mc of matchedCases) {
    const key = mc.protocolId || '__none__';
    if (!byProtocol.has(key)) {
      byProtocol.set(key, { deltaPains: [], deltaFunctions: [] });
    }
    const bucket = byProtocol.get(key)!;
    bucket.deltaPains.push(mc.m3.pain_score! - mc.baseline.pain_score!);

    const scaleType = mc.m3.function_scale_type || mc.baseline.function_scale_type;
    const df = calculateNormalizedFunctionDelta(
      mc.baseline.function_score ? Number(mc.baseline.function_score) : null,
      mc.m3.function_score ? Number(mc.m3.function_score) : null,
      scaleType
    );
    if (df !== null) bucket.deltaFunctions.push(df);
  }

  const protocolBreakdown: ProtocolBreakdown[] = [];
  for (const [key, bucket] of byProtocol.entries()) {
    const n = bucket.deltaPains.length;
    // For COLLECTIVE scope, enforce k-anonymity
    if (scope === 'COLLECTIVE' && n < 5) continue;

    protocolBreakdown.push({
      protocolId: key,
      protocolTitle: key === '__none__' ? 'Sem protocolo vinculado' : (protocolTitleMap.get(key) || key),
      n,
      meanDeltaPain: mean(bucket.deltaPains),
      meanDeltaFunction: bucket.deltaFunctions.length > 0 ? mean(bucket.deltaFunctions) : null,
    });
  }

  protocolBreakdown.sort((a, b) => b.n - a.n);

  // Enrich case protocol titles for CLINIC scope
  if (scope === 'CLINIC' && cases.length > 0) {
    for (let i = 0; i < matchedCases.length; i++) {
      const pid = matchedCases[i].protocolId;
      cases[i].protocolTitle = pid ? (protocolTitleMap.get(pid) || null) : null;
    }
  }

  const report: PrpOaKl1M3Report = {
    nTotalEligible,
    nExcludedIncomplete: nExcluded,
    nIncluded,
    deltaPainStats,
    deltaFunctionStats,
    adverseEventRate: Math.round((adverseCount / nIncluded) * 100),
    protocolBreakdown,
  };

  if (scope === 'CLINIC') {
    report.cases = cases;
  }

  return report;
}

function emptyReport(): PrpOaKl1M3Report {
  return {
    nTotalEligible: 0,
    nExcludedIncomplete: 0,
    nIncluded: 0,
    deltaPainStats: { n: 0, mean: 0, median: 0, stdDev: 0, pctImproved2pts: 0, pctAdverseEvent: 0 },
    deltaFunctionStats: { n: 0, mean: 0, median: 0 },
    adverseEventRate: 0,
    protocolBreakdown: [],
  };
}

// ─── Hook ─────────────────────────────────────────────────────────

export function usePrpOaKl1M3Report(scope: ReportScope) {
  return useQuery({
    queryKey: ['prp-oa-kl1-m3-report', scope],
    queryFn: () => fetchReport(scope),
    staleTime: 5 * 60 * 1000,
  });
}
