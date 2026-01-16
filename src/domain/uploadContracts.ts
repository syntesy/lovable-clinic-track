/**
 * Upload Domain Contracts
 * 
 * Single source of truth for upload payload types.
 * Prevents regression of customFileName or other unauthorized fields.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Valid file types for attendance uploads
 */
export type AttendanceFileType = 'exam' | 'report' | 'image' | 'photo' | 'other';

/**
 * Contract for uploading a file to an attendance.
 * 
 * IMPORTANT: This type intentionally does NOT include:
 * - customFileName (removed - caused bugs)
 * - Any other undocumented fields
 * 
 * Use 'description' for display name customization.
 */
export interface UploadAttendanceFileInput {
  /** UUID of the attendance session */
  attendanceId: string;
  
  /** UUID of the patient */
  patientId: string;
  
  /** The file to upload */
  file: File;
  
  /** Type/category of the file */
  fileType: AttendanceFileType;
  
  /** Optional display name (shown instead of file.name) */
  description?: string;
}

/**
 * Validates that an upload input conforms to the contract.
 * Returns an error message if invalid, or null if valid.
 * 
 * @param input - The input to validate
 * @returns Error message or null
 */
export function validateUploadInput(input: unknown): string | null {
  if (!input || typeof input !== 'object') {
    return 'Input must be an object';
  }
  
  const obj = input as Record<string, unknown>;
  
  if (typeof obj.attendanceId !== 'string' || !obj.attendanceId) {
    return 'attendanceId is required and must be a non-empty string';
  }
  
  if (typeof obj.patientId !== 'string' || !obj.patientId) {
    return 'patientId is required and must be a non-empty string';
  }
  
  if (!(obj.file instanceof File)) {
    return 'file is required and must be a File';
  }
  
  const validFileTypes: AttendanceFileType[] = ['exam', 'report', 'image', 'photo', 'other'];
  if (!validFileTypes.includes(obj.fileType as AttendanceFileType)) {
    return `fileType must be one of: ${validFileTypes.join(', ')}`;
  }
  
  if (obj.description !== undefined && typeof obj.description !== 'string') {
    return 'description must be a string if provided';
  }
  
  // Check for forbidden fields
  if ('customFileName' in obj) {
    return 'customFileName is not allowed - use description instead';
  }
  
  return null;
}

/**
 * Creates a validated upload input from raw form data.
 * Throws if validation fails.
 * 
 * @param data - Raw input data
 * @returns Validated UploadAttendanceFileInput
 */
export function createUploadInput(data: {
  attendanceId: string;
  patientId: string;
  file: File;
  fileType: AttendanceFileType;
  description?: string;
}): UploadAttendanceFileInput {
  const error = validateUploadInput(data);
  if (error) {
    throw new Error(`Invalid upload input: ${error}`);
  }
  
  return {
    attendanceId: data.attendanceId,
    patientId: data.patientId,
    file: data.file,
    fileType: data.fileType,
    description: data.description,
  };
}

// =============================================================================
// GUARD
// =============================================================================

/**
 * Guard to check if upload is allowed in current context.
 * Upload is ONLY allowed in the 'attachments' step.
 * 
 * @param currentStep - Current step ID
 * @returns true if upload is allowed
 */
export function canUploadInStep(currentStep: string): boolean {
  return currentStep === 'attachments';
}

/**
 * Error message for upload blocked outside attachments step
 */
export const UPLOAD_BLOCKED_MESSAGE = 'Abra a etapa Anexos para enviar arquivos.';
