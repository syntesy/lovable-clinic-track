/**
 * useProcedureOutcomeReport — Dynamic, parameterized outcome report engine.
 *
 * Replaces the hardcoded usePrpOaKl1M3Report with a fully configurable hook.
 * Single data layer used by both:
 *   - "Minha Performance Clínica" (scope: CLINIC)
 *   - "Padrões Clínicos" (scope: COLLECTIVE)
 *
 * Cohort: attendance_pathology (CONFIRMED) + procedure_standard_records + PRO (baseline + timepoint)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateNormalizedFunctionDelta } from '@/lib/function-scale-map';
import {
  classifyClinicalOutcome,
  type ClinicalOutcomeClassificationValue,
} from '@/domain/clinicalOutcomeClassification';

// ─── Types ────────────────────────────────────────────────────────

export type ReportScope = 'CLINIC' | 'COLLECTIVE';

export interface OutcomeReportParams {
  procedure_type: string;
  category_id?: string;
  pathology_id?: string;
  structural_model?: string;
  structural_grade?: string;
  timepoint: string; // m1, m3, m6, m12
}

export interface DeltaPainStats {
  n: number;
  mean: number;
  median: number;
  stdDev: number;
  ci95Lower: number | null;
  ci95Upper: number | null;
  pctImproved2pts: number;
  pctWorsened2pts: number;
  pctAdverseEvent: number;
}

export interface DeltaFunctionStats {
  n: number;
  mean: number;
  median: number;
  ci95Lower: number | null;
  ci95Upper: number | null;
}

export interface ProtocolBreakdown {
  protocolId: string;
  protocolTitle: string;
  n: number;
  meanDeltaPain: number;
  meanDeltaFunction: number | null;
}

export interface CaseDetail {
  attendanceId: string;
  baselinePain: number;
  followupPain: number;
  deltaPain: number;
  baselineFunction: number | null;
  followupFunction: number | null;
  deltaFunction: number | null;
  functionScaleType: string | null;
  protocolTitle: string | null;
  adverseEvent: boolean;
  // 4-level clinical outcome classification (additive layer — interpretation only)
  clinicalOutcomeClassification: ClinicalOutcomeClassificationValue | null;
}

export interface ProcedureOutcomeReport {
  nTotalEligible: number;
  nExcludedIncomplete: number;
  nIncluded: number;
  deltaPainStats: DeltaPainStats;
  deltaFunctionStats: DeltaFunctionStats;
  adverseEventRate: number;
  protocolBreakdown: ProtocolBreakdown[];
  cases?: CaseDetail[];
}

// ─── Preset definitions ───────────────────────────────────────────

export interface ReportPreset {
  id: string;
  label: string;
  params: OutcomeReportParams;
}

export const REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'prp-oa-kl1-m3',
    label: 'PRP · Artrose KL1 · M3',
    params: {
      procedure_type: 'PRP',
      structural_model: 'KELLGREN_LAWRENCE',
      structural_grade: 'KL1',
      timepoint: 'm3',
    },
  },
];

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

function calcMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calcStdDev(arr: number[], m: number): number {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function calcMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function calcCI95(arr: number[], m: number, sd: number): [number | null, number | null] {
  if (arr.length < 30) return [null, null];
  const se = sd / Math.sqrt(arr.length);
  return [m - 1.96 * se, m + 1.96 * se];
}

// ─── Data fetching ────────────────────────────────────────────────

async function fetchReport(scope: ReportScope, params: OutcomeReportParams): Promise<ProcedureOutcomeReport> {
  let clinicId: string | null = null;
  if (scope === 'CLINIC') {
    clinicId = await getClinicId();
    if (!clinicId) throw new Error('Clínica não encontrada.');
  }

  // Step 1: Get attendance_ids matching diagnosis criteria
  let apQuery = supabase
    .from('attendance_pathology')
    .select('attendance_id')
    .eq('diagnosis_stage', 'CONFIRMED');

  if (params.structural_model) {
    apQuery = apQuery.eq('structural_model', params.structural_model);
  }
  if (params.structural_grade) {
    apQuery = apQuery.eq('structural_grade', params.structural_grade);
  }
  if (params.category_id) {
    apQuery = apQuery.eq('category_id', params.category_id);
  }
  if (params.pathology_id) {
    apQuery = apQuery.eq('pathology_id', params.pathology_id);
  }

  const { data: confirmedAp, error: apError } = await apQuery;
  if (apError) throw new Error(apError.message);
  if (!confirmedAp || confirmedAp.length === 0) return emptyReport();

  const attendanceIds = confirmedAp.map(r => r.attendance_id);

  // Step 2: Get procedures for those attendances
  let psrQuery = supabase
    .from('procedure_standard_records')
    .select('id, attendance_id, protocol_id')
    .eq('procedure_type', params.procedure_type)
    .in('attendance_id', attendanceIds);

  if (scope === 'CLINIC' && clinicId) {
    psrQuery = psrQuery.eq('clinic_id', clinicId);
  }

  const { data: psrRecords, error: psrError } = await psrQuery;
  if (psrError) throw new Error(psrError.message);
  if (!psrRecords || psrRecords.length === 0) return emptyReport();

  const nTotalEligible = psrRecords.length;
  const relevantAttendanceIds = [...new Set(psrRecords.map(r => r.attendance_id))];

  // Step 3: Get PROs (baseline + follow-up) for these procedures/attendances
  let proQuery = supabase
    .from('patient_reported_outcomes')
    .select('id, attendance_id, procedure_standard_record_id, timepoint, pain_score, function_score, function_scale_type, adverse_event')
    .in('timepoint', ['baseline', params.timepoint]);

  if (scope === 'CLINIC' && clinicId) {
    proQuery = proQuery.eq('clinic_id', clinicId);
  }

  proQuery = proQuery.in('attendance_id', relevantAttendanceIds);

  const { data: proRecords, error: proError } = await proQuery;
  if (proError) throw new Error(proError.message);

  // Step 4: Match PROs to PSRs with priority linkage
  interface MatchedCase {
    psrId: string;
    attendanceId: string;
    protocolId: string | null;
    baseline: typeof proRecords[0];
    followup: typeof proRecords[0];
  }

  const matchedCases: MatchedCase[] = [];

  for (const psr of psrRecords) {
    // Priority 1: by procedure_standard_record_id
    let baseline = proRecords?.find(
      p => p.procedure_standard_record_id === psr.id && p.timepoint === 'baseline'
    );
    let followup = proRecords?.find(
      p => p.procedure_standard_record_id === psr.id && p.timepoint === params.timepoint
    );

    // Priority 2: fallback by attendance_id (only unlinked PROs)
    if (!baseline) {
      baseline = proRecords?.find(
        p => p.attendance_id === psr.attendance_id && p.timepoint === 'baseline' && !p.procedure_standard_record_id
      );
    }
    if (!followup) {
      followup = proRecords?.find(
        p => p.attendance_id === psr.attendance_id && p.timepoint === params.timepoint && !p.procedure_standard_record_id
      );
    }

    // Check completeness for pain
    if (
      baseline && followup &&
      baseline.pain_score !== null && followup.pain_score !== null
    ) {
      matchedCases.push({
        psrId: psr.id,
        attendanceId: psr.attendance_id,
        protocolId: psr.protocol_id,
        baseline,
        followup,
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
      deltaPainStats: emptyPainStats(),
      deltaFunctionStats: emptyFuncStats(),
      adverseEventRate: 0,
      protocolBreakdown: [],
    };
  }

  // Step 5: Calculate metrics
  const deltaPains: number[] = [];
  const deltaFunctions: number[] = [];
  let adverseCount = 0;
  let improved2pts = 0;
  let worsened2pts = 0;

  const cases: CaseDetail[] = [];

  for (const mc of matchedCases) {
    const dp = mc.followup.pain_score! - mc.baseline.pain_score!;
    deltaPains.push(dp);

    if (mc.baseline.pain_score! - mc.followup.pain_score! >= 2) improved2pts++;
    if (mc.followup.pain_score! - mc.baseline.pain_score! >= 2) worsened2pts++;
    if (mc.followup.adverse_event) adverseCount++;

    // Normalized function delta
    const scaleType = mc.followup.function_scale_type || mc.baseline.function_scale_type;
    const df = (mc.baseline.function_score !== null && mc.followup.function_score !== null)
      ? calculateNormalizedFunctionDelta(
          Number(mc.baseline.function_score),
          Number(mc.followup.function_score),
          scaleType
        )
      : null;
    if (df !== null) deltaFunctions.push(df);

    if (scope === 'CLINIC') {
      const baselineFn = mc.baseline.function_score != null ? Number(mc.baseline.function_score) : null;
      const followupFn = mc.followup.function_score != null ? Number(mc.followup.function_score) : null;
      const outcomeClass = classifyClinicalOutcome({
        baseline_eva: mc.baseline.pain_score,
        followup_eva: mc.followup.pain_score,
        baseline_ifn: baselineFn,
        followup_ifn: followupFn,
      });
      cases.push({
        attendanceId: mc.attendanceId,
        baselinePain: mc.baseline.pain_score!,
        followupPain: mc.followup.pain_score!,
        deltaPain: dp,
        baselineFunction: baselineFn,
        followupFunction: followupFn,
        deltaFunction: df,
        functionScaleType: scaleType || null,
        protocolTitle: null,
        adverseEvent: mc.followup.adverse_event,
        clinicalOutcomeClassification: outcomeClass.classification,
      });
    }
  }

  const meanDP = calcMean(deltaPains);
  const sdDP = calcStdDev(deltaPains, meanDP);
  const [ci95LowerPain, ci95UpperPain] = calcCI95(deltaPains, meanDP, sdDP);

  const deltaPainStats: DeltaPainStats = {
    n: nIncluded,
    mean: meanDP,
    median: calcMedian(deltaPains),
    stdDev: sdDP,
    ci95Lower: ci95LowerPain,
    ci95Upper: ci95UpperPain,
    pctImproved2pts: Math.round((improved2pts / nIncluded) * 100),
    pctWorsened2pts: Math.round((worsened2pts / nIncluded) * 100),
    pctAdverseEvent: Math.round((adverseCount / nIncluded) * 100),
  };

  const meanDF = calcMean(deltaFunctions);
  const sdDF = calcStdDev(deltaFunctions, meanDF);
  const [ci95LowerFunc, ci95UpperFunc] = calcCI95(deltaFunctions, meanDF, sdDF);

  const deltaFunctionStats: DeltaFunctionStats = {
    n: deltaFunctions.length,
    mean: meanDF,
    median: calcMedian(deltaFunctions),
    ci95Lower: ci95LowerFunc,
    ci95Upper: ci95UpperFunc,
  };

  // Step 6: Protocol breakdown
  const protocolIds = [...new Set(matchedCases.filter(mc => mc.protocolId).map(mc => mc.protocolId!))];
  const protocolTitleMap = new Map<string, string>();

  if (protocolIds.length > 0) {
    const { data: protocols } = await supabase
      .from('protocols')
      .select('id, title')
      .in('id', protocolIds);
    if (protocols) {
      for (const p of protocols) protocolTitleMap.set(p.id, p.title);
    }
  }

  const byProtocol = new Map<string, { deltaPains: number[]; deltaFunctions: number[] }>();
  for (const mc of matchedCases) {
    const key = mc.protocolId || '__none__';
    if (!byProtocol.has(key)) byProtocol.set(key, { deltaPains: [], deltaFunctions: [] });
    const bucket = byProtocol.get(key)!;
    bucket.deltaPains.push(mc.followup.pain_score! - mc.baseline.pain_score!);

    const scaleType = mc.followup.function_scale_type || mc.baseline.function_scale_type;
    const df = (mc.baseline.function_score !== null && mc.followup.function_score !== null)
      ? calculateNormalizedFunctionDelta(Number(mc.baseline.function_score), Number(mc.followup.function_score), scaleType)
      : null;
    if (df !== null) bucket.deltaFunctions.push(df);
  }

  const protocolBreakdown: ProtocolBreakdown[] = [];
  for (const [key, bucket] of byProtocol.entries()) {
    const n = bucket.deltaPains.length;
    if (scope === 'COLLECTIVE' && n < 5) continue;

    protocolBreakdown.push({
      protocolId: key,
      protocolTitle: key === '__none__' ? 'Sem protocolo vinculado' : (protocolTitleMap.get(key) || key),
      n,
      meanDeltaPain: calcMean(bucket.deltaPains),
      meanDeltaFunction: bucket.deltaFunctions.length > 0 ? calcMean(bucket.deltaFunctions) : null,
    });
  }
  protocolBreakdown.sort((a, b) => b.n - a.n);

  // Enrich case protocol titles
  if (scope === 'CLINIC' && cases.length > 0) {
    for (let i = 0; i < matchedCases.length; i++) {
      const pid = matchedCases[i].protocolId;
      cases[i].protocolTitle = pid ? (protocolTitleMap.get(pid) || null) : null;
    }
  }

  const report: ProcedureOutcomeReport = {
    nTotalEligible,
    nExcludedIncomplete: nExcluded,
    nIncluded,
    deltaPainStats,
    deltaFunctionStats,
    adverseEventRate: Math.round((adverseCount / nIncluded) * 100),
    protocolBreakdown,
  };

  if (scope === 'CLINIC') report.cases = cases;
  return report;
}

function emptyPainStats(): DeltaPainStats {
  return { n: 0, mean: 0, median: 0, stdDev: 0, ci95Lower: null, ci95Upper: null, pctImproved2pts: 0, pctWorsened2pts: 0, pctAdverseEvent: 0 };
}

function emptyFuncStats(): DeltaFunctionStats {
  return { n: 0, mean: 0, median: 0, ci95Lower: null, ci95Upper: null };
}

function emptyReport(): ProcedureOutcomeReport {
  return {
    nTotalEligible: 0,
    nExcludedIncomplete: 0,
    nIncluded: 0,
    deltaPainStats: emptyPainStats(),
    deltaFunctionStats: emptyFuncStats(),
    adverseEventRate: 0,
    protocolBreakdown: [],
  };
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useProcedureOutcomeReport(scope: ReportScope, params: OutcomeReportParams | null) {
  return useQuery({
    queryKey: ['procedure-outcome-report', scope, params],
    queryFn: () => fetchReport(scope, params!),
    enabled: !!params && !!params.procedure_type && !!params.timepoint,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Dynamic filter options hooks ─────────────────────────────────

export function useProcedureTypes() {
  return useQuery({
    queryKey: ['procedure-types-distinct'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_standard_records')
        .select('procedure_type')
        .not('procedure_type', 'is', null);
      if (error) throw error;
      const unique = [...new Set((data || []).map(r => r.procedure_type).filter(Boolean))];
      return unique.sort();
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function usePathologyCategories() {
  return useQuery({
    queryKey: ['pathology-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pathology_categories')
        .select('id, label, code')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function usePathologiesByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['pathologies-by-category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pathologies')
        .select('id, label, code, structural_model')
        .eq('category_id', categoryId!)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  });
}

/** Returns grade options for a given structural model */
export function getStructuralGradeOptions(model: string | undefined): { value: string; label: string }[] {
  switch (model) {
    case 'KELLGREN_LAWRENCE':
      return [
        { value: 'KL0', label: 'KL 0 – Normal' },
        { value: 'KL1', label: 'KL 1 – Duvidoso' },
        { value: 'KL2', label: 'KL 2 – Mínimo' },
        { value: 'KL3', label: 'KL 3 – Moderado' },
        { value: 'KL4', label: 'KL 4 – Grave' },
      ];
    case 'TENDON_STRUCTURAL_INTEGRITY':
      return [
        { value: 'GRADE_0', label: 'Grau 0 – Normal' },
        { value: 'GRADE_I', label: 'Grau I – Sem ruptura' },
        { value: 'GRADE_II', label: 'Grau II – Ruptura <50%' },
        { value: 'GRADE_III', label: 'Grau III – Ruptura ≥50%' },
        { value: 'GRADE_IV', label: 'Grau IV – Ruptura completa' },
      ];
    case 'MUSCLE_INJURY_GRADE':
      return [
        { value: 'GRADE_I', label: 'Grau I' },
        { value: 'GRADE_II', label: 'Grau II' },
        { value: 'GRADE_III', label: 'Grau III' },
      ];
    case 'DISC_HERNIATION_TYPE':
      return [
        { value: 'PROTRUSAO', label: 'Protrusão' },
        { value: 'EXTRUSAO', label: 'Extrusão' },
        { value: 'SEQUESTRO', label: 'Sequestro' },
      ];
    default:
      return [];
  }
}

export const TIMEPOINT_OPTIONS = [
  { value: 'm1', label: '1 mês' },
  { value: 'm3', label: '3 meses' },
  { value: 'm6', label: '6 meses' },
  { value: 'm12', label: '12 meses' },
];
