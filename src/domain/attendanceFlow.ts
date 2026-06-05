/**
 * Attendance Flow Domain Contract
 *
 * Single source of truth for:
 * - Step definitions and order
 * - Navigation guards
 * - Step validation
 *
 * Flow: Avaliação Clínica → Solo Biológico → Plano Terapêutico → Anexos → Relatório
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * All possible step IDs in the attendance flow.
 * 'triage' is only visible when attendance.involves_orthobiologics === true
 */
export type AttendanceStepId = 'clinical' | 'biological' | 'triage' | 'plan' | 'attachments' | 'report';

/**
 * Minimal attendance shape needed for step calculations
 */
export interface AttendanceForFlow {
  involves_orthobiologics: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Base steps that are always present (triage excluded).
 * Biological soil step is always included.
 */
export const BASE_STEPS: AttendanceStepId[] = ['clinical', 'biological', 'plan', 'attachments', 'report'];

/**
 * Complete steps including triage (for orthobiologic attendances)
 */
export const FULL_STEPS: AttendanceStepId[] = ['clinical', 'biological', 'plan', 'triage', 'attachments', 'report'];

/**
 * Initial step for any new attendance
 */
export const INITIAL_STEP: AttendanceStepId = 'clinical';

/**
 * Set of all valid step IDs for fast lookup
 */
const ALL_VALID_STEPS = new Set<string>(['clinical', 'biological', 'triage', 'plan', 'attachments', 'report']);

// =============================================================================
// STEP CALCULATION
// =============================================================================

/**
 * Returns the ordered list of steps for a given attendance.
 * This is the SINGLE SOURCE OF TRUTH for step order.
 * 
 * @param attendance - The attendance session (or minimal object with involves_orthobiologics)
 * @returns Ordered array of step IDs visible for this attendance
 */
export function getStepsForAttendance(attendance: AttendanceForFlow | null | undefined): AttendanceStepId[] {
  if (!attendance) {
    return BASE_STEPS;
  }
  
  if (attendance.involves_orthobiologics === true) {
    return FULL_STEPS;
  }
  
  return BASE_STEPS;
}

// =============================================================================
// GUARDS
// =============================================================================

/**
 * Type guard: checks if a string is a valid AttendanceStepId
 */
export function isValidStep(step: string | null | undefined): step is AttendanceStepId {
  if (!step) return false;
  return ALL_VALID_STEPS.has(step);
}

/**
 * Normalizes any step input to a valid AttendanceStepId.
 * Returns INITIAL_STEP if input is invalid.
 * 
 * @param step - Input step string (possibly invalid)
 * @returns Valid AttendanceStepId (fallback to INITIAL_STEP)
 */
export function normalizeStep(step: string | null | undefined): AttendanceStepId {
  if (isValidStep(step)) {
    return step;
  }
  return INITIAL_STEP;
}

/**
 * Checks if user can access a specific step for a given attendance.
 * 
 * Rules:
 * - 'triage' is only accessible when involves_orthobiologics === true
 * - All other steps are always accessible
 * 
 * @param step - The step to check access for
 * @param attendance - The attendance session
 * @returns true if step is accessible
 */
export function canAccessStep(step: AttendanceStepId, attendance: AttendanceForFlow | null | undefined): boolean {
  if (!attendance) {
    // Without attendance, only allow non-triage steps
    return step !== 'triage';
  }
  
  if (step === 'triage') {
    return attendance.involves_orthobiologics === true;
  }
  
  return true;
}

/**
 * Returns the previous valid step for navigation.
 * Respects orthobiologic rules.
 * 
 * @param currentStep - Current step
 * @param attendance - The attendance session
 * @returns Previous step ID or null if already at first step
 */
export function getPreviousStep(
  currentStep: AttendanceStepId,
  attendance: AttendanceForFlow | null | undefined
): AttendanceStepId | null {
  const steps = getStepsForAttendance(attendance);
  const currentIndex = steps.indexOf(currentStep);
  
  if (currentIndex <= 0) {
    return null;
  }
  
  return steps[currentIndex - 1];
}

/**
 * Returns the next valid step for navigation.
 * Respects orthobiologic rules.
 * 
 * @param currentStep - Current step
 * @param attendance - The attendance session
 * @returns Next step ID or null if already at last step
 */
export function getNextStep(
  currentStep: AttendanceStepId,
  attendance: AttendanceForFlow | null | undefined
): AttendanceStepId | null {
  const steps = getStepsForAttendance(attendance);
  const currentIndex = steps.indexOf(currentStep);
  
  if (currentIndex < 0 || currentIndex >= steps.length - 1) {
    return null;
  }
  
  return steps[currentIndex + 1];
}

/**
 * Validates and corrects a step selection.
 * If step is invalid or inaccessible, returns a safe fallback.
 * 
 * @param step - Requested step
 * @param attendance - The attendance session
 * @returns Validated step (may be different from input)
 */
export function validateStepForAttendance(
  step: string | null | undefined,
  attendance: AttendanceForFlow | null | undefined
): AttendanceStepId {
  const normalized = normalizeStep(step);
  
  if (canAccessStep(normalized, attendance)) {
    return normalized;
  }
  
  // If triage was requested but not allowed, skip it and land on attachments (the step after triage in the full flow)
  if (normalized === 'triage') {
    return 'attachments';
  }
  
  return INITIAL_STEP;
}
