/**
 * Attendance Flow Domain Contract Tests
 * 
 * Sentinel tests to prevent regressions in:
 * - Step order and visibility
 * - Triage optional logic
 * - Navigation guards
 * 
 * Run: npx vitest run src/domain/__tests__/attendanceFlow.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getStepsForAttendance,
  isValidStep,
  normalizeStep,
  canAccessStep,
  validateStepForAttendance,
  INITIAL_STEP,
  BASE_STEPS,
  FULL_STEPS,
  type AttendanceStepId,
  type AttendanceForFlow,
} from '../attendanceFlow';

describe('Attendance Flow Domain Contract', () => {
  
  describe('Constants', () => {
    it('INITIAL_STEP should be "clinical"', () => {
      expect(INITIAL_STEP).toBe('clinical');
    });
    
    it('BASE_STEPS should NOT include triage', () => {
      expect(BASE_STEPS).not.toContain('triage');
      expect(BASE_STEPS).toEqual(['clinical', 'plan', 'attachments', 'report']);
    });
    
    it('FULL_STEPS should include triage after clinical', () => {
      expect(FULL_STEPS).toContain('triage');
      expect(FULL_STEPS).toEqual(['clinical', 'triage', 'plan', 'attachments', 'report']);
      expect(FULL_STEPS.indexOf('triage')).toBe(1); // After clinical
    });
  });
  
  describe('getStepsForAttendance', () => {
    
    describe('WITHOUT orthobiologic (is_orthobiologic = false/null/undefined)', () => {
      
      it('returns BASE_STEPS without triage when is_orthobiologic = false', () => {
        const attendance: AttendanceForFlow = { involves_orthobiologics: false };
        const steps = getStepsForAttendance(attendance);
        
        expect(steps).not.toContain('triage');
        expect(steps).toEqual(BASE_STEPS);
      });
      
      it('returns BASE_STEPS when attendance is null', () => {
        const steps = getStepsForAttendance(null);
        expect(steps).not.toContain('triage');
        expect(steps).toEqual(BASE_STEPS);
      });
      
      it('returns BASE_STEPS when attendance is undefined', () => {
        const steps = getStepsForAttendance(undefined);
        expect(steps).not.toContain('triage');
        expect(steps).toEqual(BASE_STEPS);
      });
    });
    
    describe('WITH orthobiologic (is_orthobiologic = true)', () => {
      
      it('returns FULL_STEPS including triage when is_orthobiologic = true', () => {
        const attendance: AttendanceForFlow = { involves_orthobiologics: true };
        const steps = getStepsForAttendance(attendance);
        
        expect(steps).toContain('triage');
        expect(steps).toEqual(FULL_STEPS);
      });
      
      it('triage appears after clinical', () => {
        const attendance: AttendanceForFlow = { involves_orthobiologics: true };
        const steps = getStepsForAttendance(attendance);
        
        const clinicalIdx = steps.indexOf('clinical');
        const triageIdx = steps.indexOf('triage');
        
        expect(triageIdx).toBe(clinicalIdx + 1);
      });
    });
  });
  
  describe('isValidStep', () => {
    
    it('returns true for all valid step IDs', () => {
      const validSteps: AttendanceStepId[] = ['clinical', 'triage', 'plan', 'attachments', 'report'];
      
      validSteps.forEach(step => {
        expect(isValidStep(step)).toBe(true);
      });
    });
    
    it('returns false for invalid strings', () => {
      expect(isValidStep('invalid')).toBe(false);
      expect(isValidStep('other')).toBe(false);
      expect(isValidStep('')).toBe(false);
    });
    
    it('returns false for null/undefined', () => {
      expect(isValidStep(null)).toBe(false);
      expect(isValidStep(undefined)).toBe(false);
    });
  });
  
  describe('normalizeStep', () => {
    
    it('returns valid step unchanged', () => {
      expect(normalizeStep('clinical')).toBe('clinical');
      expect(normalizeStep('triage')).toBe('triage');
      expect(normalizeStep('report')).toBe('report');
    });
    
    it('returns INITIAL_STEP for invalid input', () => {
      expect(normalizeStep('invalid')).toBe(INITIAL_STEP);
      expect(normalizeStep('')).toBe(INITIAL_STEP);
      expect(normalizeStep(null)).toBe(INITIAL_STEP);
      expect(normalizeStep(undefined)).toBe(INITIAL_STEP);
    });
  });
  
  describe('canAccessStep', () => {
    
    describe('triage access', () => {
      
      it('triage is accessible when is_orthobiologic = true', () => {
        const attendance: AttendanceForFlow = { involves_orthobiologics: true };
        expect(canAccessStep('triage', attendance)).toBe(true);
      });
      
      it('triage is NOT accessible when is_orthobiologic = false', () => {
        const attendance: AttendanceForFlow = { involves_orthobiologics: false };
        expect(canAccessStep('triage', attendance)).toBe(false);
      });
      
      it('triage is NOT accessible when attendance is null', () => {
        expect(canAccessStep('triage', null)).toBe(false);
      });
    });
    
    describe('other steps access', () => {
      
      it('clinical is always accessible', () => {
        expect(canAccessStep('clinical', { involves_orthobiologics: false })).toBe(true);
        expect(canAccessStep('clinical', { involves_orthobiologics: true })).toBe(true);
        expect(canAccessStep('clinical', null)).toBe(true);
      });
      
      it('plan is always accessible', () => {
        expect(canAccessStep('plan', { involves_orthobiologics: false })).toBe(true);
        expect(canAccessStep('plan', { involves_orthobiologics: true })).toBe(true);
      });
      
      it('attachments is always accessible', () => {
        expect(canAccessStep('attachments', { involves_orthobiologics: false })).toBe(true);
        expect(canAccessStep('attachments', { involves_orthobiologics: true })).toBe(true);
      });
      
      it('report is always accessible', () => {
        expect(canAccessStep('report', { involves_orthobiologics: false })).toBe(true);
        expect(canAccessStep('report', { involves_orthobiologics: true })).toBe(true);
      });
    });
  });
  
  describe('validateStepForAttendance', () => {
    
    it('returns valid step unchanged when accessible', () => {
      const attendance: AttendanceForFlow = { involves_orthobiologics: true };
      
      expect(validateStepForAttendance('clinical', attendance)).toBe('clinical');
      expect(validateStepForAttendance('triage', attendance)).toBe('triage');
      expect(validateStepForAttendance('plan', attendance)).toBe('plan');
    });
    
    it('returns "plan" when triage requested but not accessible', () => {
      const attendance: AttendanceForFlow = { involves_orthobiologics: false };
      
      expect(validateStepForAttendance('triage', attendance)).toBe('plan');
    });
    
    it('returns INITIAL_STEP for invalid step', () => {
      const attendance: AttendanceForFlow = { involves_orthobiologics: false };
      
      expect(validateStepForAttendance('invalid', attendance)).toBe(INITIAL_STEP);
      expect(validateStepForAttendance(null, attendance)).toBe(INITIAL_STEP);
      expect(validateStepForAttendance(undefined, attendance)).toBe(INITIAL_STEP);
    });
  });
  
  describe('Regression Guards', () => {
    
    it('step order is consistent with clinical flow', () => {
      // Clinical flow: Avaliação Clínica → Triagem (opcional) → Plano → Anexos → Relatório
      const expectedOrder = ['clinical', 'triage', 'plan', 'attachments', 'report'];
      expect(FULL_STEPS).toEqual(expectedOrder);
    });
    
    it('attachments step exists and is before report', () => {
      expect(BASE_STEPS).toContain('attachments');
      expect(BASE_STEPS.indexOf('attachments')).toBeLessThan(BASE_STEPS.indexOf('report'));
    });
  });
});
