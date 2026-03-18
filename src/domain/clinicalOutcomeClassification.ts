/**
 * Clinical Outcome Classification — 4-level post-procedure interpretation layer.
 *
 * IMPORTANT: This is a post-procedure outcome interpretation layer ONLY.
 * It must NEVER be used to recommend, contraindicate, approve, or deny a procedure.
 * The existing binary responder/non-responder logic is NOT affected by this module.
 *
 * Classification is based primarily on absolute change in EVA (pain),
 * secondarily modified by absolute change in IFN (function).
 */

// ── Types ──────────────────────────────────────────────────────────

export type ClinicalOutcomeClassificationValue =
  | 'very_favorable'
  | 'favorable'
  | 'partial'
  | 'limited';

export type ClinicalOutcomeClassificationReason =
  | 'eva_only'
  | 'eva_plus_ifn_downgrade'
  | 'unavailable_missing_eva'
  | 'unavailable_invalid_range';

export interface ClinicalOutcomeClassificationResult {
  classification: ClinicalOutcomeClassificationValue | null;
  reason: ClinicalOutcomeClassificationReason;
  delta_eva: number | null;
  delta_ifn: number | null;
}

export interface ClassifyParams {
  baseline_eva: number | null | undefined;
  followup_eva: number | null | undefined;
  baseline_ifn?: number | null | undefined;
  followup_ifn?: number | null | undefined;
}

// ── Canonical labels ───────────────────────────────────────────────

export const CLINICAL_OUTCOME_LABELS: Record<ClinicalOutcomeClassificationValue, string> = {
  very_favorable: 'Resposta muito favorável',
  favorable:      'Resposta favorável',
  partial:        'Resposta parcial',
  limited:        'Resposta limitada',
};

export const CLINICAL_OUTCOME_LABEL_UNAVAILABLE = 'Classificação indisponível';

// ── Badge color mapping (Tailwind) ─────────────────────────────────

export const CLINICAL_OUTCOME_BADGE_CLASSES: Record<ClinicalOutcomeClassificationValue, string> = {
  very_favorable: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  favorable:      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  partial:        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  limited:        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

// ── Validation ─────────────────────────────────────────────────────

const EVA_MIN = 0;
const EVA_MAX = 10;
const IFN_MIN = 0;
const IFN_MAX = 10;

function isValidEva(v: number): boolean {
  return Number.isFinite(v) && v >= EVA_MIN && v <= EVA_MAX;
}

function isValidIfn(v: number): boolean {
  return Number.isFinite(v) && v >= IFN_MIN && v <= IFN_MAX;
}

// ── Core classification function ───────────────────────────────────

/**
 * Classifies a single follow-up outcome based on EVA delta (primary)
 * and optional IFN delta (secondary downgrade modifier).
 *
 * Rules (section 4–6 of spec):
 * - delta_eva = baseline_eva - followup_eva  (positive = improvement)
 * - delta_ifn = baseline_ifn - followup_ifn  (positive = improvement)
 * - IFN only downgrades very_favorable → favorable or favorable → partial
 * - IFN is never used to upgrade
 * - partial and limited are never downgraded by IFN
 */
export function classifyClinicalOutcome(params: ClassifyParams): ClinicalOutcomeClassificationResult {
  const { baseline_eva, followup_eva, baseline_ifn, followup_ifn } = params;

  // 6.1 Missing EVA → unavailable
  if (baseline_eva == null || followup_eva == null) {
    return {
      classification: null,
      reason: 'unavailable_missing_eva',
      delta_eva: null,
      delta_ifn: null,
    };
  }

  // 6.3 Invalid EVA range → unavailable
  if (!isValidEva(baseline_eva) || !isValidEva(followup_eva)) {
    return {
      classification: null,
      reason: 'unavailable_invalid_range',
      delta_eva: null,
      delta_ifn: null,
    };
  }

  // Section 4: Primary classification by delta_eva
  const delta_eva = baseline_eva - followup_eva;

  let evaClassification: ClinicalOutcomeClassificationValue;
  if (delta_eva >= 4) {
    evaClassification = 'very_favorable';
  } else if (delta_eva >= 2) {
    evaClassification = 'favorable';
  } else if (delta_eva === 1) {
    evaClassification = 'partial';
  } else {
    // delta_eva <= 0 (no change or worsening)
    evaClassification = 'limited';
  }

  // Section 5: IFN secondary modifier
  // Only applies to very_favorable and favorable; never upgrades; never modifies partial/limited.
  const hasIfnData = baseline_ifn != null && followup_ifn != null;

  if (
    hasIfnData &&
    (evaClassification === 'very_favorable' || evaClassification === 'favorable')
  ) {
    // 6.3 Invalid IFN range → skip modifier, keep EVA classification
    if (!isValidIfn(baseline_ifn as number) || !isValidIfn(followup_ifn as number)) {
      return {
        classification: evaClassification,
        reason: 'eva_only',
        delta_eva,
        delta_ifn: null,
      };
    }

    const delta_ifn = (baseline_ifn as number) - (followup_ifn as number);

    if (delta_ifn <= 0) {
      // No functional improvement → downgrade by one level
      const downgraded: ClinicalOutcomeClassificationValue =
        evaClassification === 'very_favorable' ? 'favorable' : 'partial';

      return {
        classification: downgraded,
        reason: 'eva_plus_ifn_downgrade',
        delta_eva,
        delta_ifn,
      };
    }

    // IFN improved → keep EVA classification unchanged
    return {
      classification: evaClassification,
      reason: 'eva_only',
      delta_eva,
      delta_ifn,
    };
  }

  // 6.2 Missing IFN (or classification not subject to modifier) → EVA only
  const delta_ifn = hasIfnData
    ? (baseline_ifn as number) - (followup_ifn as number)
    : null;

  return {
    classification: evaClassification,
    reason: 'eva_only',
    delta_eva,
    delta_ifn,
  };
}
