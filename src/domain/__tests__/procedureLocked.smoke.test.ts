/**
 * Smoke Test: Procedure-Locked "Impressão" Tab
 * 
 * Ensures the "Impressão" (Print) tab and related components
 * do NOT consume `analysisResult.next_steps` or `what_to_do_now`.
 * 
 * This is a static code analysis test that verifies the source code
 * doesn't contain forbidden patterns in procedure-locked contexts.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Files that render "Próximo Passo" or "Impressão" content
const PROCEDURE_LOCKED_FILES = [
  'src/pages/TriagemBiologica.tsx',
  'src/components/orthobio/NextStepCard.tsx',
  'src/components/PrintPreviewModal.tsx',
];

// Patterns that should NOT appear in procedure-locked contexts
const FORBIDDEN_PATTERNS = [
  /analysisResult\.next_steps\.what_to_do_now/g,
  /analysisResult\.next_steps\?\.what_to_do_now/g,
  /next_steps\.what_to_do_now/g,
  /\.what_to_do_now/g, // Any direct access to what_to_do_now
];

// Allowed exceptions (e.g., in comments, type definitions, or legacy fallbacks)
const EXCEPTION_PATTERNS = [
  /\/\/ Procedure-locked/,
  /\/\/ Legacy/,
  /interface.*NextSteps/,
  /type.*NextSteps/,
  /legacyNextSteps/,
];

describe('Procedure-Locked Smoke Tests', () => {
  describe('Impressão tab does not consume analysisResult.next_steps', () => {
    PROCEDURE_LOCKED_FILES.forEach((filePath) => {
      it(`${filePath} should not use forbidden next_steps patterns`, () => {
        const absolutePath = path.resolve(process.cwd(), filePath);
        
        // Skip if file doesn't exist (might be in different test environment)
        if (!fs.existsSync(absolutePath)) {
          console.warn(`Skipping ${filePath} - file not found`);
          return;
        }

        const content = fs.readFileSync(absolutePath, 'utf-8');
        const lines = content.split('\n');

        const violations: string[] = [];

        lines.forEach((line, index) => {
          const lineNumber = index + 1;
          
          // Check each forbidden pattern
          FORBIDDEN_PATTERNS.forEach((pattern) => {
            if (pattern.test(line)) {
              // Check if line has an exception
              const hasException = EXCEPTION_PATTERNS.some((exc) => exc.test(line));
              
              if (!hasException) {
                violations.push(`Line ${lineNumber}: ${line.trim()}`);
              }
            }
            // Reset regex lastIndex for global patterns
            pattern.lastIndex = 0;
          });
        });

        expect(violations, 
          `Found forbidden patterns in ${filePath}:\n${violations.join('\n')}`
        ).toHaveLength(0);
      });
    });
  });

  describe('NextStepCard uses only procedure-locked generator', () => {
    it('NextStepCard should import from orthoBioProcedures', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/orthobio/NextStepCard.tsx');
      
      if (!fs.existsSync(filePath)) {
        console.warn('Skipping NextStepCard test - file not found');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Support both single and double quote import styles
      expect(content).toMatch(/from\s+['"]@\/domain\/orthoBioProcedures['"]/);

      expect(content).toContain('generateOrthoBioPlan');
    });

    it('NextStepCard should NOT directly use LLM next_steps', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/orthobio/NextStepCard.tsx');
      
      if (!fs.existsSync(filePath)) {
        console.warn('Skipping NextStepCard test - file not found');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Should not contain direct consumption of analysisResult.next_steps
      expect(content).not.toMatch(/analysisResult\.next_steps/);
      expect(content).not.toMatch(/result\.next_steps\.what_to_do_now/);
    });
  });

  describe('TriagemBiologica Impressão tab uses procedure-locked generator', () => {
    it('Impressão tab should use generateOrthoBioPlan for orientations', () => {
      const filePath = path.resolve(process.cwd(), 'src/pages/TriagemBiologica.tsx');
      
      if (!fs.existsSync(filePath)) {
        console.warn('Skipping TriagemBiologica test - file not found');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Should import procedure-locked generator
      expect(content).toContain("generateOrthoBioPlan");
      expect(content).toContain("mapTaxonomyToProcedureCode");
      
      // The Impressão tab section should use procedure-locked generation
      // Check that "Orientações ao Paciente" section uses the generator
      expect(content).toMatch(/Procedure-locked.*generator/i);
    });
  });
});
