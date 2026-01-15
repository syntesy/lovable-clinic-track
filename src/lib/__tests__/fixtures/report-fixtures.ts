/**
 * Fixtures de Teste para QA do Gerador de Relatórios
 * 
 * APENAS PARA DESENVOLVIMENTO/TESTE - NÃO USAR EM PRODUÇÃO
 * 
 * Estas fixtures simulam diferentes cenários clínicos para validar
 * que o relatório gera conteúdo dinâmico e não genérico.
 */

import { DynamicReportContent } from '@/lib/report-generator';

export interface TestPatient {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  clinical_diagnosis: string | null;
  treated_region: string | null;
}

export interface TestScreening {
  id: string;
  created_at: string;
  classification: string;
  analysis_result: string;
  questionnaire_responses: {
    answers: Record<string, unknown>;
  };
}

export interface TestFixture {
  name: string;
  description: string;
  patient: TestPatient;
  screening: TestScreening;
  expectedContent: {
    shouldHaveRegion: boolean;
    shouldHaveDuration: boolean;
    shouldHavePainIntensity: boolean;
    shouldHaveClinicalFindings: boolean;
    prpClassification: 'apto' | 'apto_com_preparo' | 'nao_apto' | 'contraindicado';
  };
}

/**
 * FIXTURE A: Joelho crônico com dor alta + meses + limitação funcional
 */
export const FIXTURE_JOELHO_CRONICO: TestFixture = {
  name: "Joelho Crônico",
  description: "Paciente com dor no joelho há mais de 6 meses, intensidade alta, limitações funcionais",
  patient: {
    id: "test-patient-joelho-001",
    full_name: "Maria Silva (Teste)",
    age: 55,
    gender: "F",
    clinical_diagnosis: "Artrose de Joelho Grau III",
    treated_region: "Joelho Direito",
  },
  screening: {
    id: "test-screening-joelho-001",
    created_at: new Date().toISOString(),
    classification: "APTO_COM_PREPARO",
    analysis_result: JSON.stringify({
      eligibility: {
        overall_status: "APTO_COM_PREPARO",
        prp: { status: "elegivel_com_preparo", notes: "Necessita ajuste de vitamina D" },
      },
      key_reasons: [
        "Cronicidade do quadro (>6 meses) favorece resposta ao PRP",
        "Necessidade de correção de vitamina D antes do procedimento",
      ],
      requested_exams: {
        required: ["Hemograma completo", "Vitamina D", "Ferritina"],
        optional: ["PCR", "VHS"],
      },
      next_steps: {
        what_to_do_now: "Suplementar vitamina D e repetir exame em 30 dias",
        timeline: "4-6 semanas",
      },
    }),
    questionnaire_responses: {
      answers: {
        regiao_principal: "joelho",
        diagnostico_suspeito: "artrose",
        tempo_dor: "gt_6m",
        dor_escala: 8,
        red_flags: ["nenhum"],
        fatores_preparo: ["sem_exames_60dias"],
        fatores_nutricionais: ["pouca_exposicao_solar_sem_vitamina_d"],
        medicamentos: ["aines_14dias"],
        fisioterapia_6_semanas: true,
        prp_prf_bmac_anterior: "nunca",
        cirurgia_previa_regiao: false,
        qualidade_sono: "regular",
        nivel_estresse: "moderado",
        consumo_alcool_2x_semana: false,
        procedimento_considerado: "prp",
      },
    },
  },
  expectedContent: {
    shouldHaveRegion: true,
    shouldHaveDuration: true,
    shouldHavePainIntensity: true,
    shouldHaveClinicalFindings: true,
    prpClassification: 'apto_com_preparo',
  },
};

/**
 * FIXTURE B: Ombro agudo com dor moderada + semanas
 */
export const FIXTURE_OMBRO_AGUDO: TestFixture = {
  name: "Ombro Agudo",
  description: "Paciente com tendinopatia de ombro há 8 semanas, dor moderada",
  patient: {
    id: "test-patient-ombro-001",
    full_name: "João Santos (Teste)",
    age: 42,
    gender: "M",
    clinical_diagnosis: "Tendinopatia do Supraespinhal",
    treated_region: "Ombro Esquerdo",
  },
  screening: {
    id: "test-screening-ombro-001",
    created_at: new Date().toISOString(),
    classification: "APTO",
    analysis_result: JSON.stringify({
      eligibility: {
        overall_status: "APTO",
        prp: { status: "elegivel", notes: null },
      },
      key_reasons: [
        "Quadro subagudo com boa resposta esperada",
        "Sem contraindicações identificadas",
        "Exames laboratoriais adequados",
      ],
      requested_exams: {
        required: [],
        optional: ["Ultrassonografia de controle"],
      },
      next_steps: {
        what_to_do_now: "Agendar procedimento",
        timeline: "1-2 semanas",
      },
    }),
    questionnaire_responses: {
      answers: {
        regiao_principal: "ombro",
        diagnostico_suspeito: "tendinopatia",
        tempo_dor: "6-12sem",
        dor_escala: 5,
        red_flags: ["nenhum"],
        fatores_preparo: ["nenhum"],
        fatores_nutricionais: ["nenhum"],
        medicamentos: [],
        fisioterapia_6_semanas: true,
        prp_prf_bmac_anterior: "nunca",
        cirurgia_previa_regiao: false,
        qualidade_sono: "boa",
        nivel_estresse: "baixo",
        consumo_alcool_2x_semana: false,
        procedimento_considerado: "prp",
      },
    },
  },
  expectedContent: {
    shouldHaveRegion: true,
    shouldHaveDuration: true,
    shouldHavePainIntensity: true,
    shouldHaveClinicalFindings: false,
    prpClassification: 'apto',
  },
};

/**
 * FIXTURE C: Coluna com componente neuropático - Contraindicado
 */
export const FIXTURE_COLUNA_NEUROPATICO: TestFixture = {
  name: "Coluna com Componente Neuropático",
  description: "Paciente com dor lombar irradiada, componente neuropático, contraindicado para PRP",
  patient: {
    id: "test-patient-coluna-001",
    full_name: "Ana Oliveira (Teste)",
    age: 48,
    gender: "F",
    clinical_diagnosis: "Lombalgia com Radiculopatia L5",
    treated_region: "Coluna Lombar",
  },
  screening: {
    id: "test-screening-coluna-001",
    created_at: new Date().toISOString(),
    classification: "NAO_APTO",
    analysis_result: JSON.stringify({
      eligibility: {
        overall_status: "NAO_APTO",
        prp: { status: "contraindicado", notes: "Componente neuropático requer abordagem específica" },
      },
      key_reasons: [
        "Presença de componente neuropático",
        "Diabetes descompensado identificado",
        "Necessidade de investigação complementar antes de ortobiológicos",
      ],
      requested_exams: {
        required: ["Ressonância Magnética", "HbA1c", "Eletroneuromiografia"],
        optional: [],
      },
      next_steps: {
        what_to_do_now: "Encaminhamento para especialista em coluna",
        timeline: "Indefinido - aguardar avaliação",
      },
    }),
    questionnaire_responses: {
      answers: {
        regiao_principal: "coluna",
        diagnostico_suspeito: "lesao_ligamentar",
        tempo_dor: "gt_6m",
        dor_escala: 7,
        red_flags: ["diabetes_descompensado"],
        fatores_preparo: ["sem_exames_60dias", "anemia"],
        fatores_nutricionais: ["cansaco_fraqueza_queda_cabelo"],
        medicamentos: ["aines_7dias", "corticoide_oral"],
        fisioterapia_6_semanas: false,
        prp_prf_bmac_anterior: "nunca",
        cirurgia_previa_regiao: true,
        qualidade_sono: "ruim",
        nivel_estresse: "alto",
        consumo_alcool_2x_semana: true,
        procedimento_considerado: "nenhum",
      },
    },
  },
  expectedContent: {
    shouldHaveRegion: true,
    shouldHaveDuration: true,
    shouldHavePainIntensity: true,
    shouldHaveClinicalFindings: true,
    prpClassification: 'nao_apto',
  },
};

/**
 * FIXTURE D: Joelho crônico VARIANTE (diferenças em dor/duração)
 * Para QA de validação que relatórios diferentes são gerados
 */
export const FIXTURE_JOELHO_CRONICO_VARIANTE: TestFixture = {
  name: "Joelho Crônico - Variante",
  description: "Outro paciente com joelho crônico mas com dor menor e duração diferente",
  patient: {
    id: "test-patient-joelho-002",
    full_name: "Carlos Pereira (Teste)",
    age: 62,
    gender: "M",
    clinical_diagnosis: "Artrose de Joelho Grau II",
    treated_region: "Joelho Esquerdo",
  },
  screening: {
    id: "test-screening-joelho-002",
    created_at: new Date().toISOString(),
    classification: "APTO",
    analysis_result: JSON.stringify({
      eligibility: {
        overall_status: "APTO",
        prp: { status: "elegivel", notes: "Exames OK" },
      },
      key_reasons: [
        "Quadro crônico com grau moderado de degeneração",
        "Sem contraindicações",
        "Exames laboratoriais satisfatórios",
      ],
      requested_exams: {
        required: [],
        optional: ["Hemograma de controle"],
      },
      next_steps: {
        what_to_do_now: "Agendar PRP",
        timeline: "2 semanas",
      },
    }),
    questionnaire_responses: {
      answers: {
        regiao_principal: "joelho",
        diagnostico_suspeito: "artrose",
        tempo_dor: "m3_6", // 3-6 meses (diferente da fixture A)
        dor_escala: 5, // Dor moderada (diferente de 8)
        red_flags: ["nenhum"],
        fatores_preparo: ["nenhum"],
        fatores_nutricionais: ["nenhum"],
        medicamentos: [],
        fisioterapia_6_semanas: false,
        prp_prf_bmac_anterior: "nunca",
        cirurgia_previa_regiao: false,
        qualidade_sono: "boa",
        nivel_estresse: "baixo",
        consumo_alcool_2x_semana: false,
        procedimento_considerado: "prp",
      },
    },
  },
  expectedContent: {
    shouldHaveRegion: true,
    shouldHaveDuration: true,
    shouldHavePainIntensity: true,
    shouldHaveClinicalFindings: false,
    prpClassification: 'apto',
  },
};

/**
 * Lista de todas as fixtures disponíveis
 */
export const ALL_TEST_FIXTURES: TestFixture[] = [
  FIXTURE_JOELHO_CRONICO,
  FIXTURE_OMBRO_AGUDO,
  FIXTURE_COLUNA_NEUROPATICO,
  FIXTURE_JOELHO_CRONICO_VARIANTE,
];

/**
 * Frases genéricas PROIBIDAS que não devem aparecer em relatórios
 * baseados em dados reais
 */
export const FORBIDDEN_GENERIC_PHRASES = [
  "foram analisados diversos aspectos",
  "após análise criteriosa",
  "considerando os fatores clínicos",
  "de acordo com os protocolos",
  "seguindo as melhores práticas",
  "conforme orientações médicas",
  "baseado em evidências científicas",
  "procedimento padrão",
  "tratamento convencional",
];
