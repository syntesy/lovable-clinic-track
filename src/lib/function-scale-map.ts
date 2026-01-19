/**
 * Function Scale Map
 * 
 * Defines scale properties for outcome function measures
 * Used to normalize delta calculations so positive delta always means improvement
 */

export type FunctionScaleType = 
  | 'WOMAC' 
  | 'KOOS' 
  | 'ODI' 
  | 'NDI' 
  | 'DASH' 
  | 'VISA_A' 
  | 'OUTRA';

interface FunctionScaleConfig {
  /** If true, higher score = better function. If false, lower score = better */
  higher_is_better: boolean | null;
  /** Human-readable name */
  label: string;
  /** Description of the scale */
  description: string;
  /** Typical score range */
  range: string;
}

/**
 * Map of function scale types to their configuration
 * 
 * Normalization rule:
 * - If higher_is_better === true:  delta = followup - baseline (positive = improvement)
 * - If higher_is_better === false: delta = baseline - followup (positive = improvement)
 * - If higher_is_better === null:  cannot calculate delta (unknown scale)
 */
export const FUNCTION_SCALE_MAP: Record<FunctionScaleType, FunctionScaleConfig> = {
  ODI: {
    higher_is_better: false,
    label: 'ODI (Oswestry Disability Index)',
    description: 'Incapacidade lombar - quanto menor, melhor',
    range: '0-100%',
  },
  NDI: {
    higher_is_better: false,
    label: 'NDI (Neck Disability Index)',
    description: 'Incapacidade cervical - quanto menor, melhor',
    range: '0-100%',
  },
  WOMAC: {
    higher_is_better: false,
    label: 'WOMAC',
    description: 'Dor/rigidez/função articular - quanto menor, melhor',
    range: '0-96',
  },
  KOOS: {
    higher_is_better: true,
    label: 'KOOS',
    description: 'Qualidade de vida joelho - quanto maior, melhor',
    range: '0-100',
  },
  DASH: {
    higher_is_better: false,
    label: 'DASH',
    description: 'Incapacidade membro superior - quanto menor, melhor',
    range: '0-100',
  },
  VISA_A: {
    higher_is_better: true,
    label: 'VISA-A',
    description: 'Função tendão Aquiles - quanto maior, melhor',
    range: '0-100',
  },
  OUTRA: {
    higher_is_better: null,
    label: 'Outra escala',
    description: 'Escala não padronizada - delta não calculável',
    range: 'Variável',
  },
};

/**
 * Calculate normalized delta where positive = improvement
 * 
 * @param baseline - Baseline score
 * @param followup - Follow-up score  
 * @param scaleType - The function scale type
 * @returns Normalized delta (positive = improvement) or null if cannot calculate
 */
export function calculateNormalizedFunctionDelta(
  baseline: number | null | undefined,
  followup: number | null | undefined,
  scaleType: string | null | undefined
): number | null {
  if (baseline === null || baseline === undefined) return null;
  if (followup === null || followup === undefined) return null;
  if (!scaleType) return null;

  const config = FUNCTION_SCALE_MAP[scaleType as FunctionScaleType];
  if (!config || config.higher_is_better === null) return null;

  // Normalize so positive = improvement
  if (config.higher_is_better) {
    // Higher is better: improvement = followup - baseline
    return followup - baseline;
  } else {
    // Lower is better: improvement = baseline - followup
    return baseline - followup;
  }
}

/**
 * Check if a scale type can have delta calculated
 */
export function canCalculateFunctionDelta(scaleType: string | null | undefined): boolean {
  if (!scaleType) return false;
  const config = FUNCTION_SCALE_MAP[scaleType as FunctionScaleType];
  return config?.higher_is_better !== null;
}

/**
 * Get the scale configuration
 */
export function getFunctionScaleConfig(scaleType: string | null | undefined): FunctionScaleConfig | null {
  if (!scaleType) return null;
  return FUNCTION_SCALE_MAP[scaleType as FunctionScaleType] || null;
}
