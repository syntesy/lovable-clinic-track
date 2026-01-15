/**
 * Gerador de Conteúdo Dinâmico para Relatório de Avaliação do Paciente
 * 
 * Este módulo gera textos individualizados baseados nos dados reais
 * da avaliação do paciente, sem usar textos genéricos.
 */

interface ScreeningAnswers {
  regiao_principal?: string;
  diagnostico_suspeito?: string;
  tempo_dor?: string;
  dor_escala?: number | null;
  red_flags?: string[];
  fatores_preparo?: string[];
  fatores_nutricionais?: string[];
  medicamentos?: string[];
  fisioterapia_6_semanas?: boolean;
  prp_prf_bmac_anterior?: string;
  cirurgia_previa_regiao?: boolean;
  qualidade_sono?: string;
  nivel_estresse?: string;
  consumo_alcool_2x_semana?: boolean;
  procedimento_considerado?: string;
}

interface AnalysisResult {
  eligibility?: {
    overall_status?: string;
    prp?: { status?: string; notes?: string };
    prf?: { status?: string; notes?: string };
    bmac?: { status?: string; notes?: string };
  };
  key_reasons?: string[];
  requested_exams?: {
    required?: string[];
    optional?: string[];
  };
  next_steps?: {
    what_to_do_now?: string;
    timeline?: string;
  };
}

export interface DynamicReportContent {
  // Seção 1: Objetivo
  objectiveText: string;
  
  // Seção 2: O que foi identificado
  identifiedFindings: {
    mainComplaint: string | null;
    region: string | null;
    diagnosis: string | null;
    duration: string | null;
    painIntensity: string | null;
    functionalLimitations: string[];
    clinicalFindings: string[];
  };
  
  // Seção 3: Indicação PRP
  prpIndicationReason: string;
  prpNotes: string | null;
  
  // Seção 4: Plano terapêutico
  therapeuticPlan: {
    prepSteps: string[];
    nextSteps: string | null;
    timeline: string | null;
    requiredExams: string[];
    optionalExams: string[];
  };
  
  // Seção 5: Quando PRP faz sentido
  prpConditions: string[];
  
  // Seção 6: Expectativas
  expectations: string[];
  
  // Seção 7: Considerações
  finalConsiderations: string;
  
  // Dados ausentes
  missingData: string[];
}

// Mapeamentos de valores para texto legível
const REGION_MAP: Record<string, string> = {
  joelho: "Joelho",
  ombro: "Ombro",
  quadril: "Quadril",
  cotovelo: "Cotovelo",
  tornozelo: "Tornozelo",
  pe: "Pé",
  coluna: "Coluna",
  punho: "Punho",
  mao: "Mão",
};

const DIAGNOSIS_MAP: Record<string, string> = {
  tendinopatia: "Tendinopatia",
  artrose: "Artrose / Osteoartrite",
  lesao_muscular: "Lesão Muscular",
  condropatia: "Condropatia",
  fasciite: "Fasciite Plantar",
  epicondilite: "Epicondilite",
  bursite: "Bursite",
  lesao_ligamentar: "Lesão Ligamentar",
};

const DURATION_MAP: Record<string, string> = {
  "<6sem": "menos de 6 semanas",
  "6-12sem": "6 a 12 semanas",
  ">6m": "mais de 6 meses",
  "lt_3m": "menos de 3 meses",
  "m3_6": "3 a 6 meses",
  "gt_6m": "mais de 6 meses",
};

const RED_FLAG_MAP: Record<string, string> = {
  diabetes_descompensado: "diabetes descompensado",
  imunossupressao: "uso de imunossupressores",
  cancer_ativo: "tratamento oncológico ativo",
  infeccao_ativa: "infecção ativa",
  febre_recente: "febre recente",
  ferida_aberta: "ferida aberta na região",
  doenca_autoimune: "doença autoimune ativa",
  nenhum: null,
};

const PREP_FACTOR_MAP: Record<string, string> = {
  sem_exames_60dias: "ausência de exames laboratoriais nos últimos 60 dias",
  anemia: "anemia identificada",
  baixa_ferritina: "baixa reserva de ferro",
  tabagismo: "tabagismo ativo",
  imc_elevado: "índice de massa corporal elevado",
  nenhum: null,
};

const NUTRITION_FACTOR_MAP: Record<string, string> = {
  pouca_exposicao_solar_sem_vitamina_d: "baixa exposição solar / possível deficiência de vitamina D",
  cansaco_fraqueza_queda_cabelo: "sinais de carência nutricional (cansaço, fraqueza, queda de cabelo)",
  baixo_consumo_frutas_verduras: "baixo consumo de frutas e verduras",
  dieta_restritiva: "dieta restritiva",
  nenhum: null,
};

const MEDICATION_MAP: Record<string, string> = {
  aines_7dias: "uso de anti-inflamatórios nos últimos 7 dias",
  aines_14dias: "uso de anti-inflamatórios nos últimos 14 dias",
  infiltracao_corticoide_3m: "infiltração com corticoide nos últimos 3 meses",
  corticoide_oral: "uso de corticoide oral",
  anticoagulante: "uso de anticoagulante",
  imunossupressor: "uso de imunossupressor",
};

const SLEEP_MAP: Record<string, string> = {
  boa: "qualidade de sono boa",
  regular: "qualidade de sono regular",
  ruim: "qualidade de sono ruim",
  pessima: "qualidade de sono muito ruim",
};

const STRESS_MAP: Record<string, string> = {
  baixo: "nível de estresse baixo",
  moderado: "nível de estresse moderado",
  alto: "nível de estresse alto",
};

/**
 * Gera conteúdo dinâmico para o relatório baseado nos dados reais da avaliação
 */
export function generateDynamicReportContent(
  screeningData: {
    classification?: string | null;
    analysis_result?: string | null;
    questionnaire_responses?: Record<string, unknown> | null;
  },
  patientData: {
    clinical_diagnosis?: string | null;
    treated_region?: string | null;
  }
): DynamicReportContent {
  const missingData: string[] = [];
  
  // Parse analysis_result se for string
  let analysisResult: AnalysisResult = {};
  if (screeningData.analysis_result) {
    try {
      analysisResult = typeof screeningData.analysis_result === 'string' 
        ? JSON.parse(screeningData.analysis_result) 
        : screeningData.analysis_result;
    } catch {
      console.error('Error parsing analysis_result');
    }
  }
  
  // Extrair answers do questionnaire_responses
  const answers: ScreeningAnswers = (screeningData.questionnaire_responses?.answers as ScreeningAnswers) || {};
  
  // ===== SEÇÃO 1: Objetivo =====
  const objectiveText = generateObjectiveText(answers, patientData);
  
  // ===== SEÇÃO 2: O que foi identificado =====
  const identifiedFindings = generateIdentifiedFindings(answers, patientData, missingData);
  
  // ===== SEÇÃO 3: Indicação PRP =====
  const { prpIndicationReason, prpNotes } = generatePRPIndication(
    screeningData.classification,
    analysisResult,
    answers
  );
  
  // ===== SEÇÃO 4: Plano terapêutico =====
  const therapeuticPlan = generateTherapeuticPlan(analysisResult, answers, missingData);
  
  // ===== SEÇÃO 5: Quando PRP faz sentido =====
  const prpConditions = generatePRPConditions(analysisResult, answers);
  
  // ===== SEÇÃO 6: Expectativas =====
  const expectations = generateExpectations(answers, analysisResult);
  
  // ===== SEÇÃO 7: Considerações =====
  const finalConsiderations = generateFinalConsiderations(answers, patientData);
  
  return {
    objectiveText,
    identifiedFindings,
    prpIndicationReason,
    prpNotes,
    therapeuticPlan,
    prpConditions,
    expectations,
    finalConsiderations,
    missingData,
  };
}

function generateObjectiveText(answers: ScreeningAnswers, patientData: { clinical_diagnosis?: string | null }): string {
  const region = answers.regiao_principal ? REGION_MAP[answers.regiao_principal] || answers.regiao_principal : null;
  const diagnosis = patientData.clinical_diagnosis || (answers.diagnostico_suspeito ? DIAGNOSIS_MAP[answers.diagnostico_suspeito] : null);
  
  if (region && diagnosis) {
    return `Este documento apresenta os resultados da avaliação clínica realizada para ${diagnosis} em ${region}. O objetivo é explicar de forma clara os achados identificados, o raciocínio por trás das decisões clínicas e o plano terapêutico individualizado proposto para o seu caso.`;
  } else if (region) {
    return `Este documento apresenta os resultados da avaliação clínica realizada para queixa em ${region}. O objetivo é explicar de forma clara os achados identificados, o raciocínio por trás das decisões clínicas e o plano terapêutico individualizado proposto.`;
  } else if (diagnosis) {
    return `Este documento apresenta os resultados da avaliação clínica realizada para ${diagnosis}. O objetivo é explicar de forma clara os achados identificados, o raciocínio por trás das decisões clínicas e o plano terapêutico individualizado proposto.`;
  }
  
  return `Este documento apresenta os resultados da sua avaliação clínica. O objetivo é explicar de forma clara os achados identificados, o raciocínio por trás das decisões clínicas e o plano terapêutico individualizado proposto para o seu caso.`;
}

function generateIdentifiedFindings(
  answers: ScreeningAnswers,
  patientData: { clinical_diagnosis?: string | null; treated_region?: string | null },
  missingData: string[]
): DynamicReportContent['identifiedFindings'] {
  const region = patientData.treated_region || (answers.regiao_principal ? REGION_MAP[answers.regiao_principal] : null);
  const diagnosis = patientData.clinical_diagnosis || (answers.diagnostico_suspeito ? DIAGNOSIS_MAP[answers.diagnostico_suspeito] : null);
  const duration = answers.tempo_dor ? DURATION_MAP[answers.tempo_dor] : null;
  
  // Queixa principal
  let mainComplaint: string | null = null;
  if (region && diagnosis) {
    mainComplaint = `Queixa de dor/desconforto em ${region} com hipótese diagnóstica de ${diagnosis}.`;
  } else if (region) {
    mainComplaint = `Queixa de dor/desconforto em ${region}.`;
  }
  
  if (!mainComplaint) {
    missingData.push("Queixa principal não identificada na avaliação");
  }
  
  // Intensidade da dor
  let painIntensity: string | null = null;
  if (answers.dor_escala !== undefined && answers.dor_escala !== null) {
    const scale = answers.dor_escala;
    if (scale === 0) {
      painIntensity = `Sem dor no momento da avaliação (escala 0/10).`;
    } else if (scale <= 3) {
      painIntensity = `Dor leve (escala ${scale}/10).`;
    } else if (scale <= 6) {
      painIntensity = `Dor moderada (escala ${scale}/10).`;
    } else {
      painIntensity = `Dor intensa (escala ${scale}/10).`;
    }
  } else {
    missingData.push("Intensidade da dor não informada");
  }
  
  // Achados clínicos
  const clinicalFindings: string[] = [];
  
  // Red flags
  if (answers.red_flags && answers.red_flags.length > 0) {
    answers.red_flags.forEach(flag => {
      const text = RED_FLAG_MAP[flag];
      if (text) clinicalFindings.push(`Identificado: ${text}`);
    });
  }
  
  // Fatores de preparo
  if (answers.fatores_preparo && answers.fatores_preparo.length > 0) {
    answers.fatores_preparo.forEach(factor => {
      const text = PREP_FACTOR_MAP[factor];
      if (text) clinicalFindings.push(`Fator que requer atenção: ${text}`);
    });
  }
  
  // Medicamentos
  if (answers.medicamentos && answers.medicamentos.length > 0) {
    answers.medicamentos.forEach(med => {
      const text = MEDICATION_MAP[med];
      if (text) clinicalFindings.push(text);
    });
  }
  
  // Histórico terapêutico
  if (answers.fisioterapia_6_semanas === true) {
    clinicalFindings.push("Realizou fisioterapia nas últimas 6 semanas");
  }
  if (answers.prp_prf_bmac_anterior && answers.prp_prf_bmac_anterior !== "nunca") {
    clinicalFindings.push(`Histórico de procedimento ortobiológico prévio: ${answers.prp_prf_bmac_anterior}`);
  }
  if (answers.cirurgia_previa_regiao === true) {
    clinicalFindings.push("Cirurgia prévia na região afetada");
  }
  
  // Limitações funcionais (fatores nutricionais como proxy)
  const functionalLimitations: string[] = [];
  if (answers.fatores_nutricionais && answers.fatores_nutricionais.length > 0) {
    answers.fatores_nutricionais.forEach(factor => {
      const text = NUTRITION_FACTOR_MAP[factor];
      if (text) functionalLimitations.push(text);
    });
  }
  
  // Estilo de vida
  if (answers.qualidade_sono) {
    const text = SLEEP_MAP[answers.qualidade_sono];
    if (text) clinicalFindings.push(text);
  }
  if (answers.nivel_estresse) {
    const text = STRESS_MAP[answers.nivel_estresse];
    if (text) clinicalFindings.push(text);
  }
  if (answers.consumo_alcool_2x_semana === true) {
    clinicalFindings.push("Consumo de álcool superior a 2x por semana");
  }
  
  return {
    mainComplaint,
    region,
    diagnosis,
    duration: duration ? `Tempo de sintomas: ${duration}` : null,
    painIntensity,
    functionalLimitations,
    clinicalFindings,
  };
}

function generatePRPIndication(
  classification: string | null | undefined,
  analysisResult: AnalysisResult,
  answers: ScreeningAnswers
): { prpIndicationReason: string; prpNotes: string | null } {
  const classUpper = classification?.toUpperCase();
  const prpAnalysis = analysisResult.eligibility?.prp;
  const keyReasons = analysisResult.key_reasons || [];
  
  let prpIndicationReason = "";
  let prpNotes: string | null = null;
  
  if (classUpper === "APTO") {
    prpIndicationReason = "Com base na avaliação realizada, você apresenta condições favoráveis para o tratamento com PRP (Plasma Rico em Plaquetas). ";
    
    if (keyReasons.length > 0) {
      prpIndicationReason += "Os fatores que suportam esta indicação incluem: ";
      prpIndicationReason += keyReasons.slice(0, 3).join("; ") + ".";
    } else {
      prpIndicationReason += "Seu organismo demonstra estar preparado para responder de forma adequada a este tipo de terapia regenerativa.";
    }
  } else if (classUpper === "APTO_COM_PREPARO" || classUpper === "NAO_APTO_PREPARO") {
    prpIndicationReason = "O PRP pode ser uma opção terapêutica para o seu caso, porém alguns aspectos precisam ser ajustados antes. ";
    
    if (keyReasons.length > 0) {
      prpIndicationReason += "Os principais pontos identificados foram: ";
      prpIndicationReason += keyReasons.join("; ") + ".";
    }
    
    if (prpAnalysis?.notes) {
      prpNotes = prpAnalysis.notes;
    }
  } else if (classUpper === "NAO_APTO" || classUpper === "CONTRAINDICADO") {
    prpIndicationReason = "Neste momento, o tratamento com PRP não é a opção mais indicada para você. ";
    
    if (keyReasons.length > 0) {
      prpIndicationReason += "Isso se deve aos seguintes fatores identificados na avaliação: ";
      prpIndicationReason += keyReasons.join("; ") + ".";
    } else {
      prpIndicationReason += "O seu organismo precisa de outras intervenções antes de poder se beneficiar desta terapia regenerativa.";
    }
    
    if (prpAnalysis?.notes) {
      prpNotes = prpAnalysis.notes;
    }
  } else {
    // Classificação não definida
    prpIndicationReason = "A indicação do PRP depende da análise completa dos dados clínicos e laboratoriais. ";
    
    if (keyReasons.length > 0) {
      prpIndicationReason += "Pontos relevantes identificados: " + keyReasons.join("; ") + ".";
    }
  }
  
  return { prpIndicationReason, prpNotes };
}

function generateTherapeuticPlan(
  analysisResult: AnalysisResult,
  answers: ScreeningAnswers,
  missingData: string[]
): DynamicReportContent['therapeuticPlan'] {
  const prepSteps: string[] = [];
  const requiredExams: string[] = analysisResult.requested_exams?.required || [];
  const optionalExams: string[] = analysisResult.requested_exams?.optional || [];
  
  // Gerar passos de preparo baseados nos fatores identificados
  if (answers.fatores_preparo?.includes("sem_exames_60dias")) {
    prepSteps.push("Realizar exames laboratoriais para avaliação do estado metabólico e capacidade regenerativa.");
  }
  
  if (answers.red_flags?.includes("diabetes_descompensado")) {
    prepSteps.push("Controle rigoroso da glicemia antes de procedimentos regenerativos.");
  }
  
  if (answers.medicamentos?.includes("infiltracao_corticoide_3m")) {
    prepSteps.push("Aguardar período adequado após última infiltração de corticoide para otimizar resposta tecidual.");
  }
  
  if (answers.fatores_nutricionais?.some(f => f !== "nenhum")) {
    prepSteps.push("Avaliação e correção de deficiências nutricionais identificadas.");
  }
  
  if (answers.qualidade_sono === "ruim" || answers.qualidade_sono === "pessima") {
    prepSteps.push("Abordar qualidade do sono como fator de recuperação tecidual.");
  }
  
  if (answers.nivel_estresse === "alto") {
    prepSteps.push("Gerenciamento do estresse como fator adjuvante ao tratamento.");
  }
  
  // Adicionar passos do analysis_result
  if (analysisResult.next_steps?.what_to_do_now) {
    prepSteps.push(analysisResult.next_steps.what_to_do_now);
  }
  
  if (prepSteps.length === 0) {
    missingData.push("Plano terapêutico detalhado não disponível");
  }
  
  return {
    prepSteps,
    nextSteps: analysisResult.next_steps?.what_to_do_now || null,
    timeline: analysisResult.next_steps?.timeline || null,
    requiredExams,
    optionalExams,
  };
}

function generatePRPConditions(analysisResult: AnalysisResult, answers: ScreeningAnswers): string[] {
  const conditions: string[] = [];
  
  // Condições gerais
  if (answers.fatores_preparo?.includes("sem_exames_60dias")) {
    conditions.push("Exames laboratoriais completos e dentro dos parâmetros esperados");
  }
  
  if (answers.red_flags?.includes("diabetes_descompensado")) {
    conditions.push("Glicemia e hemoglobina glicada controladas");
  }
  
  if (answers.fatores_nutricionais?.some(f => f.includes("vitamina"))) {
    conditions.push("Níveis adequados de vitamina D e outros nutrientes essenciais");
  }
  
  if (answers.medicamentos?.includes("infiltracao_corticoide_3m")) {
    conditions.push("Período mínimo de washout após última infiltração de corticoide");
  }
  
  // Condições padrão se não houver específicas
  if (conditions.length === 0) {
    conditions.push("Inflamação controlada e tecido organizado");
    conditions.push("Exames laboratoriais indicando boa capacidade regenerativa");
    conditions.push("Ausência de contraindicações clínicas");
  }
  
  // Adicionar timeline se disponível
  if (analysisResult.next_steps?.timeline) {
    conditions.push(`Prazo estimado para reavaliação: ${analysisResult.next_steps.timeline}`);
  }
  
  return conditions;
}

function generateExpectations(answers: ScreeningAnswers, analysisResult: AnalysisResult): string[] {
  const expectations: string[] = [];
  
  // Baseado no tempo de dor
  if (answers.tempo_dor === ">6m" || answers.tempo_dor === "gt_6m") {
    expectations.push("Por se tratar de uma condição crônica (mais de 6 meses), a recuperação será gradual e requer acompanhamento contínuo.");
  } else if (answers.tempo_dor === "6-12sem" || answers.tempo_dor === "m3_6") {
    expectations.push("O tempo de evolução do seu quadro favorece uma boa resposta ao tratamento proposto.");
  }
  
  // Baseado na fisioterapia prévia
  if (answers.fisioterapia_6_semanas === true) {
    expectations.push("O trabalho de fisioterapia já realizado contribui para a preparação do tecido.");
  } else if (answers.fisioterapia_6_semanas === false) {
    expectations.push("A reabilitação funcional será parte importante do plano terapêutico.");
  }
  
  // Timeline do analysis_result
  if (analysisResult.next_steps?.timeline) {
    expectations.push(`Reavaliação prevista em ${analysisResult.next_steps.timeline} para acompanhar evolução.`);
  }
  
  // Expectativas padrão
  expectations.push("Cada sessão contribui para a evolução do seu quadro de forma cumulativa.");
  expectations.push("Seu compromisso com as orientações é fundamental para maximizar os resultados.");
  
  return expectations;
}

function generateFinalConsiderations(
  answers: ScreeningAnswers,
  patientData: { clinical_diagnosis?: string | null }
): string {
  const diagnosis = patientData.clinical_diagnosis || (answers.diagnostico_suspeito ? DIAGNOSIS_MAP[answers.diagnostico_suspeito] : "seu quadro");
  
  return `As decisões do seu tratamento foram baseadas na análise individualizada dos dados da sua avaliação, considerando as características específicas de ${diagnosis}. O plano proposto foi elaborado visando as melhores condições para sua recuperação, respeitando o tempo e as necessidades do seu organismo.`;
}
