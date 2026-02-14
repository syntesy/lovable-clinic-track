/**
 * Compute Institutional Score from conformity KPIs.
 *
 * Weights:
 *   checklistCompletedPct  → 40%
 *   finalizedPct           → 25%
 *   traceabilityCompletePct→ 20%
 *   protocolLinkedPct      → 5%
 *   scientificValidatedRate→ 10%
 *
 * All inputs are ratios 0..1. Output is 0..100, 1 decimal.
 */
export interface InstitutionalScoreInput {
  checklistCompletedPct: number;
  finalizedPct: number;
  traceabilityCompletePct: number;
  protocolLinkedPct: number;
  scientificValidatedRate: number;
}

export function computeInstitutionalScore(m: InstitutionalScoreInput): number {
  const raw =
    m.checklistCompletedPct * 40 +
    m.finalizedPct * 25 +
    m.traceabilityCompletePct * 20 +
    m.protocolLinkedPct * 5 +
    m.scientificValidatedRate * 10;
  return Math.round(raw * 10) / 10;
}

export function buildScoreInput(kpis: {
  total: number;
  withProtocol?: number;
  checklistCompleted: number;
  finalized: number;
  traceabilityComplete?: number;
  scientificDraftCount?: number;
  scientificValidatedCount?: number;
}): InstitutionalScoreInput {
  const t = kpis.total || 1; // avoid div/0
  return {
    checklistCompletedPct: kpis.checklistCompleted / t,
    finalizedPct: kpis.finalized / t,
    traceabilityCompletePct: (kpis.traceabilityComplete ?? 0) / t,
    protocolLinkedPct: (kpis.withProtocol ?? 0) / t,
    scientificValidatedRate: (kpis.scientificValidatedCount ?? 0) / t,
  };
}
