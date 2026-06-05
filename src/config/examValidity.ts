// Single source of truth for exam validity periods and critical exam definitions.
// Both the engine (die-layer) and the UI (triage-exams) import from here.
// Any change propagates to both sides simultaneously.

/** Validity period per exam code (days). */
export const LAB_VALIDITY_DAYS: Readonly<Record<string, number>> = {
  hemoglobin:  90,
  hematocrit:  90,
  leukocytes:  90,
  platelets:   90,
  crp:         30,
  ferritin:    90,
  glucose:     90,
  hba1c:       90,
};

/** Fallback validity when an exam code is not listed in LAB_VALIDITY_DAYS. */
export const DEFAULT_VALIDITY_DAYS = 90;

/**
 * Canonical list of 6 critical labs required for:
 * - S2 gate (areAllCriticalLabsValid in regen-case-status)
 * - DIE essential classification (ESSENTIAL_LAB_MISSING reason_code)
 */
export const CRITICAL_LAB_CODES = [
  "hemoglobin",
  "leukocytes",
  "platelets",
  "crp",
  "hba1c",
  "ferritin",
] as const;

export type CriticalLabCode = typeof CRITICAL_LAB_CODES[number];
