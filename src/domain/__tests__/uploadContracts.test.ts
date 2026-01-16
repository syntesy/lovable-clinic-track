/**
 * Upload Contracts Domain Tests
 * 
 * Sentinel tests to prevent regressions in:
 * - Upload payload contract (no customFileName!)
 * - Upload step guard
 * 
 * Run: npx vitest run src/domain/__tests__/uploadContracts.test.ts
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  validateUploadInput,
  createUploadInput,
  canUploadInStep,
  UPLOAD_BLOCKED_MESSAGE,
  type UploadAttendanceFileInput,
  type AttendanceFileType,
} from '../uploadContracts';

describe('Upload Contracts Domain', () => {
  
  describe('UploadAttendanceFileInput Type Contract', () => {
    
    it('should have correct shape', () => {
      expectTypeOf<UploadAttendanceFileInput>().toHaveProperty('attendanceId');
      expectTypeOf<UploadAttendanceFileInput>().toHaveProperty('patientId');
      expectTypeOf<UploadAttendanceFileInput>().toHaveProperty('file');
      expectTypeOf<UploadAttendanceFileInput>().toHaveProperty('fileType');
      expectTypeOf<UploadAttendanceFileInput>().toHaveProperty('description');
    });
    
    it('should NOT allow customFileName - verified by validateUploadInput', () => {
      // This test documents that customFileName is explicitly forbidden at runtime
      const inputWithCustomFileName = {
        attendanceId: 'test',
        patientId: 'test',
        file: new File([], 'test.pdf'),
        fileType: 'exam',
        customFileName: 'custom.pdf', // FORBIDDEN!
      };
      
      const error = validateUploadInput(inputWithCustomFileName);
      expect(error).toContain('customFileName');
      expect(error).toContain('not allowed');
    });
    
    it('description should be optional', () => {
      const validWithoutDescription: UploadAttendanceFileInput = {
        attendanceId: 'test',
        patientId: 'test',
        file: new File([], 'test.pdf'),
        fileType: 'exam',
      };
      
      expect(validWithoutDescription.description).toBeUndefined();
    });
  });
  
  describe('validateUploadInput', () => {
    
    const validFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    it('returns null for valid input', () => {
      const input = {
        attendanceId: 'uuid-1',
        patientId: 'uuid-2',
        file: validFile,
        fileType: 'exam' as AttendanceFileType,
      };
      
      expect(validateUploadInput(input)).toBeNull();
    });
    
    it('returns null for valid input with description', () => {
      const input = {
        attendanceId: 'uuid-1',
        patientId: 'uuid-2',
        file: validFile,
        fileType: 'exam' as AttendanceFileType,
        description: 'My custom name',
      };
      
      expect(validateUploadInput(input)).toBeNull();
    });
    
    it('returns error for missing attendanceId', () => {
      const input = {
        patientId: 'uuid-2',
        file: validFile,
        fileType: 'exam',
      };
      
      expect(validateUploadInput(input)).toContain('attendanceId');
    });
    
    it('returns error for missing file', () => {
      const input = {
        attendanceId: 'uuid-1',
        patientId: 'uuid-2',
        fileType: 'exam',
      };
      
      expect(validateUploadInput(input)).toContain('file');
    });
    
    it('returns error for invalid fileType', () => {
      const input = {
        attendanceId: 'uuid-1',
        patientId: 'uuid-2',
        file: validFile,
        fileType: 'invalid',
      };
      
      expect(validateUploadInput(input)).toContain('fileType');
    });
    
    it('BLOCKS customFileName field', () => {
      const input = {
        attendanceId: 'uuid-1',
        patientId: 'uuid-2',
        file: validFile,
        fileType: 'exam',
        customFileName: 'should-be-blocked.pdf', // FORBIDDEN!
      };
      
      const error = validateUploadInput(input);
      expect(error).toContain('customFileName');
      expect(error).toContain('not allowed');
    });
  });
  
  describe('createUploadInput', () => {
    
    const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    it('creates valid input from data', () => {
      const result = createUploadInput({
        attendanceId: 'uuid-1',
        patientId: 'uuid-2',
        file: validFile,
        fileType: 'exam',
      });
      
      expect(result.attendanceId).toBe('uuid-1');
      expect(result.patientId).toBe('uuid-2');
      expect(result.file).toBe(validFile);
      expect(result.fileType).toBe('exam');
    });
    
    it('throws for invalid input', () => {
      expect(() => createUploadInput({
        attendanceId: '',
        patientId: 'uuid-2',
        file: validFile,
        fileType: 'exam',
      })).toThrow('Invalid upload input');
    });
  });
  
  describe('canUploadInStep', () => {
    
    it('allows upload only in "attachments" step', () => {
      expect(canUploadInStep('attachments')).toBe(true);
    });
    
    it('blocks upload in other steps', () => {
      expect(canUploadInStep('clinical')).toBe(false);
      expect(canUploadInStep('triage')).toBe(false);
      expect(canUploadInStep('plan')).toBe(false);
      expect(canUploadInStep('report')).toBe(false);
    });
    
    it('blocks upload for invalid steps', () => {
      expect(canUploadInStep('invalid')).toBe(false);
      expect(canUploadInStep('')).toBe(false);
    });
  });
  
  describe('UPLOAD_BLOCKED_MESSAGE', () => {
    
    it('should be user-friendly Portuguese message', () => {
      expect(UPLOAD_BLOCKED_MESSAGE).toContain('Anexos');
      expect(UPLOAD_BLOCKED_MESSAGE.length).toBeGreaterThan(10);
    });
  });
  
  describe('AttendanceFileType values', () => {
    
    it('includes expected file types', () => {
      const validTypes: AttendanceFileType[] = ['exam', 'report', 'image', 'photo', 'other'];
      
      // Each type should pass validation
      const validFile = new File(['test'], 'test.pdf');
      validTypes.forEach(fileType => {
        const input = {
          attendanceId: 'uuid-1',
          patientId: 'uuid-2',
          file: validFile,
          fileType,
        };
        expect(validateUploadInput(input)).toBeNull();
      });
    });
  });
});
