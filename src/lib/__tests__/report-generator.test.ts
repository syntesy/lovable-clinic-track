/**
 * Testes de QA para o Gerador de Relatórios
 * 
 * APENAS PARA DESENVOLVIMENTO/CI - NÃO RODAR EM PRODUÇÃO
 * 
 * Estes testes validam:
 * 1. Relatório não pode ser vazio
 * 2. Contém região/tempo/dor quando existem nos dados
 * 3. Campos ausentes mostram "não informado" ou são omitidos
 * 4. NÃO contém frases genéricas proibidas
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateDynamicReportContent, DynamicReportContent } from '@/lib/report-generator';
import {
  ALL_TEST_FIXTURES,
  FORBIDDEN_GENERIC_PHRASES,
  TestFixture,
} from './fixtures/report-fixtures';

// Skip testes em produção
const isProduction = import.meta.env.PROD;

describe.skipIf(isProduction)('Report Generator QA Tests', () => {
  
  describe('Geração de Conteúdo Dinâmico', () => {
    
    ALL_TEST_FIXTURES.forEach((fixture: TestFixture) => {
      
      describe(`Fixture: ${fixture.name}`, () => {
        let generatedContent: DynamicReportContent;
        
        beforeAll(() => {
          generatedContent = generateDynamicReportContent(
            {
              classification: fixture.screening.classification,
              analysis_result: fixture.screening.analysis_result,
              questionnaire_responses: fixture.screening.questionnaire_responses,
            },
            {
              clinical_diagnosis: fixture.patient.clinical_diagnosis,
              treated_region: fixture.patient.treated_region,
            }
          );
        });
        
        it('deve gerar relatório não vazio', () => {
          expect(generatedContent).toBeDefined();
          expect(generatedContent.objectiveText).toBeTruthy();
          expect(generatedContent.objectiveText.length).toBeGreaterThan(10);
        });
        
        it('deve conter região quando esperado', () => {
          if (fixture.expectedContent.shouldHaveRegion) {
            expect(generatedContent.identifiedFindings.region).toBeTruthy();
          }
        });
        
        it('deve conter duração quando esperado', () => {
          if (fixture.expectedContent.shouldHaveDuration) {
            expect(generatedContent.identifiedFindings.duration).toBeTruthy();
          }
        });
        
        it('deve conter intensidade da dor quando esperado', () => {
          if (fixture.expectedContent.shouldHavePainIntensity) {
            expect(generatedContent.identifiedFindings.painIntensity).toBeTruthy();
          }
        });
        
        it('deve ter indicação PRP consistente com classificação', () => {
          expect(generatedContent.prpIndicationReason).toBeTruthy();
          expect(generatedContent.prpIndicationReason.length).toBeGreaterThan(20);
        });
        
        it('NÃO deve conter frases genéricas proibidas', () => {
          const allText = JSON.stringify(generatedContent).toLowerCase();
          
          FORBIDDEN_GENERIC_PHRASES.forEach(phrase => {
            expect(allText).not.toContain(phrase.toLowerCase());
          });
        });
        
        it('deve ter plano terapêutico ou indicação de dados ausentes', () => {
          const hasPlan = generatedContent.therapeuticPlan.prepSteps.length > 0;
          const hasMissingData = generatedContent.missingData.some(
            m => m.toLowerCase().includes('plano')
          );
          
          expect(hasPlan || hasMissingData).toBe(true);
        });
        
        it('deve ter expectativas definidas', () => {
          expect(generatedContent.expectations).toBeDefined();
          expect(Array.isArray(generatedContent.expectations)).toBe(true);
        });
        
        it('deve ter considerações finais personalizadas', () => {
          expect(generatedContent.finalConsiderations).toBeTruthy();
          expect(generatedContent.finalConsiderations.length).toBeGreaterThan(50);
        });
      });
    });
  });
  
  describe('Tratamento de Dados Ausentes', () => {
    
    it('deve lidar com screening vazio sem quebrar', () => {
      const content = generateDynamicReportContent(
        {
          classification: null,
          analysis_result: null,
          questionnaire_responses: null,
        },
        {
          clinical_diagnosis: null,
          treated_region: null,
        }
      );
      
      expect(content).toBeDefined();
      expect(content.objectiveText).toBeTruthy();
      // Deve registrar dados ausentes
      expect(content.missingData.length).toBeGreaterThan(0);
    });
    
    it('deve indicar "não informado" para campos críticos ausentes', () => {
      const content = generateDynamicReportContent(
        {
          classification: "APTO",
          analysis_result: null,
          questionnaire_responses: { answers: {} },
        },
        {
          clinical_diagnosis: null,
          treated_region: null,
        }
      );
      
      // Queixa principal não deve existir se não há dados
      expect(content.identifiedFindings.mainComplaint).toBeNull();
      
      // Deve estar registrado em missingData
      const hasMissingComplaint = content.missingData.some(
        m => m.toLowerCase().includes('queixa') || m.toLowerCase().includes('principal')
      );
      expect(hasMissingComplaint).toBe(true);
    });
    
    it('deve omitir seções opcionais quando não há dados', () => {
      const content = generateDynamicReportContent(
        {
          classification: "APTO",
          analysis_result: null,
          questionnaire_responses: { answers: {} },
        },
        {
          clinical_diagnosis: null,
          treated_region: null,
        }
      );
      
      // Achados clínicos devem estar vazios, não com texto genérico
      expect(content.identifiedFindings.clinicalFindings).toEqual([]);
      expect(content.identifiedFindings.functionalLimitations).toEqual([]);
    });
  });
  
  describe('Consistência entre Fixtures', () => {
    
    it('relatórios diferentes devem ter conteúdo diferente', () => {
      const contents = ALL_TEST_FIXTURES.map(fixture => 
        generateDynamicReportContent(
          {
            classification: fixture.screening.classification,
            analysis_result: fixture.screening.analysis_result,
            questionnaire_responses: fixture.screening.questionnaire_responses,
          },
          {
            clinical_diagnosis: fixture.patient.clinical_diagnosis,
            treated_region: fixture.patient.treated_region,
          }
        )
      );
      
      // Cada relatório deve ser único
      for (let i = 0; i < contents.length; i++) {
        for (let j = i + 1; j < contents.length; j++) {
          // Objetivos devem ser diferentes
          expect(contents[i].objectiveText).not.toEqual(contents[j].objectiveText);
          // Indicações PRP devem ser diferentes
          expect(contents[i].prpIndicationReason).not.toEqual(contents[j].prpIndicationReason);
        }
      }
    });
  });
  
  describe('QA Extra: Avaliações Semelhantes com Diferenças', () => {
    
    it('dois joelhos crônicos com dor/duração diferentes devem gerar relatórios diferentes', () => {
      // Fixture A: Joelho crônico - dor 8/10, >6 meses
      const fixtureA = ALL_TEST_FIXTURES.find(f => f.name === 'Joelho Crônico')!;
      // Fixture D: Joelho crônico variante - dor 5/10, 3-6 meses
      const fixtureD = ALL_TEST_FIXTURES.find(f => f.name === 'Joelho Crônico - Variante')!;
      
      expect(fixtureA).toBeDefined();
      expect(fixtureD).toBeDefined();
      
      const contentA = generateDynamicReportContent(
        {
          classification: fixtureA.screening.classification,
          analysis_result: fixtureA.screening.analysis_result,
          questionnaire_responses: fixtureA.screening.questionnaire_responses,
        },
        {
          clinical_diagnosis: fixtureA.patient.clinical_diagnosis,
          treated_region: fixtureA.patient.treated_region,
        }
      );
      
      const contentD = generateDynamicReportContent(
        {
          classification: fixtureD.screening.classification,
          analysis_result: fixtureD.screening.analysis_result,
          questionnaire_responses: fixtureD.screening.questionnaire_responses,
        },
        {
          clinical_diagnosis: fixtureD.patient.clinical_diagnosis,
          treated_region: fixtureD.patient.treated_region,
        }
      );
      
      // Intensidade da dor deve ser diferente
      expect(contentA.identifiedFindings.painIntensity).not.toEqual(
        contentD.identifiedFindings.painIntensity
      );
      
      // Duração deve ser diferente  
      expect(contentA.identifiedFindings.duration).not.toEqual(
        contentD.identifiedFindings.duration
      );
      
      // Classificação PRP pode ser diferente (APTO_COM_PREPARO vs APTO)
      expect(contentA.prpIndicationReason).not.toEqual(contentD.prpIndicationReason);
      
      // Achados clínicos devem ter diferenças
      const findingsA = JSON.stringify(contentA.identifiedFindings.clinicalFindings);
      const findingsD = JSON.stringify(contentD.identifiedFindings.clinicalFindings);
      expect(findingsA).not.toEqual(findingsD);
    });
  });
});
