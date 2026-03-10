/**
 * REGEN CANONICAL ADAPTER v1.1
 * 
 * Mapeia campos do TriagemBiologica (questionnaire_responses) para o formato canônico.
 * Não altera, apaga ou renomeia nada do JSON original.
 * Apenas adiciona regen_canonical como uma chave adicional.
 * 
 * v1.1 - Correções:
 * - smoking.status: enum canônico publicável (never|former|current|unknown)
 * - labs: raw_value + parsed_value + unit + parsed_ok + notes
 * - diagnosis: separar suspected_diagnosis de primary_clinical_diagnosis
 * - data_quality_alerts: array de alertas de qualidade de dados
 */

import { 
  RegenCanonical, 
  defaultRegenCanonical,
  defaultLabValue,
  RegenPainRegion,
  RegenSymptomDuration,
  RegenCanonicalSmokingStatus,
  RegenSmokingQuitBucket,
  RegenTissueType,
  RegenLabValue,
  RegenDataQualityAlert,
} from "@/types/regen-canonical";
import { FisioRegenFormData } from "@/types/fisioregen-score";

// Interface esperada do questionário TriagemBiologica
interface TriagemAnswers {
  idade?: number | null;
  sexo?: string;
  regiao_principal?: string;
  diagnostico_suspeito?: string;
  tempo_dor?: string;
  dor_escala?: number | null;
  procedimento_considerado?: string;
  red_flags?: string[];
  medicamentos?: string[];
  prp_prf_bmac_anterior?: string;
  fisioterapia_6_semanas?: boolean | null;
  cirurgia_previa_regiao?: boolean | null;
  fatores_preparo?: string[];
  fatores_nutricionais?: string[];
  qualidade_sono?: string;
  consumo_alcool_2x_semana?: boolean | null;
  nivel_estresse?: string;
}

interface TriagemProvidedExams {
  hemoglobina?: string;
  hematocrito?: string;
  leucocitos?: string;
  plaquetas?: string;
  pcr?: string;
  ferritina?: string;
  glicemia?: string;
  hba1c?: string;
}

interface TriagemQuestionnaireResponses {
  mode?: string;
  patient_id?: string;
  answers?: TriagemAnswers;
  provided_exams?: TriagemProvidedExams | null;
  regen_canonical?: RegenCanonical; // Já pode existir
}

// Unidades padrão para cada exame
const LAB_UNITS: Record<string, string> = {
  hemoglobin: "g/dL",
  hematocrit: "%",
  leukocytes: "mil/mm³",
  platelets: "mil/mm³",
  crp: "mg/L",
  ferritin: "ng/mL",
  glucose: "mg/dL",
  hba1c: "%",
};

// Mapeamento de região TriagemBiologica → Canonical
const REGION_MAP: Record<string, RegenPainRegion> = {
  "joelho": "knee",
  "ombro": "shoulder",
  "quadril": "hip",
  "cotovelo": "elbow",
  "tornozelo": "ankle_foot",
  "mao": "other",
  "coluna": "spine",
  "outro": "other",
};

// Mapeamento de tempo de dor → Canonical
const DURATION_MAP: Record<string, RegenSymptomDuration> = {
  "0-6sem": "lt_3m",
  "6-12sem": "lt_3m",
  "3-6m": "m3_6",
  ">6m": "gt_6m",
};

/**
 * Parseia um valor de exame para número, retornando estrutura completa
 */
function parseLabValue(
  rawValue: string | undefined | null,
  labKey: string,
  alerts: RegenDataQualityAlert[]
): RegenLabValue {
  if (!rawValue || rawValue.trim() === "") {
    return { ...defaultLabValue };
  }

  const raw = rawValue.trim();
  // Remove caracteres não numéricos exceto ponto e vírgula
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = parseFloat(normalized);

  if (isNaN(parsed)) {
    alerts.push({
      field: `labs.${labKey}`,
      alert_type: "parse_error",
      message: `Não foi possível converter "${raw}" para número`,
      timestamp: new Date().toISOString(),
    });
    return {
      raw_value: raw,
      parsed_value: null,
      unit: LAB_UNITS[labKey] || null,
      parsed_ok: false,
      notes: `Parse error: "${raw}" não é um número válido`,
    };
  }

  return {
    raw_value: raw,
    parsed_value: parsed,
    unit: LAB_UNITS[labKey] || null,
    parsed_ok: true,
    notes: null,
  };
}

/**
 * Determina o status canônico de tabagismo baseado nos dados disponíveis
 */
function determineCanonicalSmokingStatus(
  fatoresPreparo: string[],
  wizardSmokingStatus?: string,
  wizardQuitBucket?: string
): { status: RegenCanonicalSmokingStatus; alerts: RegenDataQualityAlert[] } {
  const alerts: RegenDataQualityAlert[] = [];
  
  const isCurrentFromPreparo = fatoresPreparo.includes("tabagista") || fatoresPreparo.includes("tabagismo_atual");
  const isFormerFromWizard = wizardQuitBucket && wizardQuitBucket !== "unknown";
  const isCurrentFromWizard = wizardSmokingStatus === "heavy" || wizardSmokingStatus === "light_moderate";
  const isNonSmokerFromWizard = wizardSmokingStatus === "non_smoker";
  const isExSmokerFromWizard = wizardSmokingStatus === "ex_smoker";

  // Detectar conflito: current + quit_bucket preenchido
  if ((isCurrentFromPreparo || isCurrentFromWizard) && isFormerFromWizard) {
    alerts.push({
      field: "smoking.status",
      alert_type: "conflict",
      message: "Conflito: indicado como fumante atual E ex-fumante com quit_bucket",
      timestamp: new Date().toISOString(),
    });
    return { status: "unknown", alerts };
  }

  // Regra 1: fatores_preparo contém tabagismo_atual → current
  if (isCurrentFromPreparo) {
    return { status: "current", alerts };
  }

  // Regra 2: wizard indica fumante atual
  if (isCurrentFromWizard) {
    return { status: "current", alerts };
  }

  // Regra 3: wizard indica ex-fumante ou quit_bucket preenchido → former
  if (isExSmokerFromWizard || isFormerFromWizard) {
    return { status: "former", alerts };
  }

  // Regra 4: wizard indica não-fumante → never
  if (isNonSmokerFromWizard) {
    return { status: "never", alerts };
  }

  // Regra 5: nenhum dado → unknown (realmente não há informação)
  // Se não há NENHUMA informação de tabagismo, retornamos unknown
  if (!wizardSmokingStatus && fatoresPreparo.length === 0) {
    return { status: "unknown", alerts };
  }

  // Se temos algum dado mas não indica fumante → never
  return { status: "never", alerts };
}

/**
 * Converte dados do TriagemBiologica para formato canônico
 */
export function buildRegenCanonicalFromTriagem(
  questionnaireResponses: TriagemQuestionnaireResponses,
  wizardData?: Partial<FisioRegenFormData>
): RegenCanonical {
  const answers = questionnaireResponses.answers || {};
  const providedExams = questionnaireResponses.provided_exams || {};
  const redFlags = answers.red_flags || [];
  const medicamentos = answers.medicamentos || [];
  const fatoresPreparo = answers.fatores_preparo || [];
  const fatoresNutricionais = answers.fatores_nutricionais || [];
  
  const dataQualityAlerts: RegenDataQualityAlert[] = [];
  
  // Determinar status de tabagismo canônico
  const smokingResult = determineCanonicalSmokingStatus(
    fatoresPreparo,
    wizardData?.smoking_status,
    wizardData?.regen_smoking_quit_bucket
  );
  dataQualityAlerts.push(...smokingResult.alerts);
  
  // Parsear labs com raw + parsed
  const labHemoglobin = parseLabValue(providedExams.hemoglobina, "hemoglobin", dataQualityAlerts);
  const labHematocrit = parseLabValue(providedExams.hematocrito, "hematocrit", dataQualityAlerts);
  const labLeukocytes = parseLabValue(providedExams.leucocitos, "leukocytes", dataQualityAlerts);
  const labPlatelets = parseLabValue(providedExams.plaquetas, "platelets", dataQualityAlerts);
  const labCrp = parseLabValue(providedExams.pcr, "crp", dataQualityAlerts);
  const labFerritin = parseLabValue(providedExams.ferritina, "ferritin", dataQualityAlerts);
  const labGlucose = parseLabValue(providedExams.glicemia, "glucose", dataQualityAlerts);
  const labHba1c = parseLabValue(providedExams.hba1c, "hba1c", dataQualityAlerts);
  
  const hasAnyLab = [
    labHemoglobin, labHematocrit, labLeukocytes, labPlatelets,
    labCrp, labFerritin, labGlucose, labHba1c
  ].some(lab => lab.raw_value !== null);
  
  const canonical: RegenCanonical = {
    ...defaultRegenCanonical,
    schema_version: "regen_canonical_v1",
    captured_at: new Date().toISOString(),
    
    data_quality_alerts: dataQualityAlerts,
    
    // SEGURANÇA
    safety: {
      cancer_tx_now_or_last_12m: redFlags.includes("cancer_ativo") ? "yes" : "unknown",
      fever_last_7d: redFlags.includes("infeccao_ativa_febre") ? "yes" : "unknown",
      open_wound_or_skin_infection_at_pain_site: redFlags.includes("infeccao_pele_local") ? "yes" : "unknown",
      active_infection: redFlags.includes("infeccao_ativa_febre") || redFlags.includes("infeccao_pele_local"),
      autoimmune_disease_active: redFlags.includes("doenca_autoimune_ativa"),
    },
    
    // QUEIXA (suspected_diagnosis aqui)
    complaint: {
      pain_region: REGION_MAP[answers.regiao_principal || ""] || null,
      pain_region_text: answers.regiao_principal === "outro" ? "Outro" : null,
      symptom_duration_bucket: DURATION_MAP[answers.tempo_dor || ""] || null,
      pain_nrs: answers.dor_escala ?? null,
      suspected_diagnosis: answers.diagnostico_suspeito || null,
    },
    
    // MEDICAÇÕES
    medications: {
      nsaid_recent_14d: medicamentos.includes("aine_7dias") ? "yes" : "unknown",
      days_since_last_nsaid: null,
      steroid_recent: (medicamentos.includes("corticoide_oral_30_dias") || medicamentos.includes("infiltracao_3_meses")) ? "yes" : "unknown",
      steroid_route: medicamentos.includes("infiltracao_3_meses") ? "local_infiltration" : 
                     medicamentos.includes("corticoide_oral_30_dias") ? "oral_injection" : null,
      days_since_last_steroid: null,
      anticoagulant: medicamentos.includes("anticoagulante"),
      immunosuppressor: medicamentos.includes("imunossupressor"),
      aspirin: false,
      p2y12: false,
    },
    
    // TABAGISMO (enum canônico publicável)
    smoking: {
      status: smokingResult.status,
      quit_bucket: (wizardData?.regen_smoking_quit_bucket as RegenSmokingQuitBucket) || null,
    },
    
    // COMORBIDADES
    comorbidities: {
      has_diabetes: redFlags.includes("diabetes_descompensado"),
      has_hypertension: wizardData?.regen_has_hypertension ?? false,
      has_dyslipidemia: wizardData?.regen_has_dyslipidemia ?? false,
      diabetes_uncontrolled: redFlags.includes("diabetes_descompensado"),
      renal_hepatic_disease: redFlags.includes("doenca_renal_hepatica"),
    },
    
    // DIAGNÓSTICO (primary_clinical_diagnosis separado de suspected)
    diagnosis: {
      tissue_type: (wizardData?.regen_tissue_type as RegenTissueType) || "unknown",
      lesion_severity: null,
      primary_clinical_diagnosis: null, // Preenchido posteriormente pelo profissional
    },
    
    // LABS (com raw + parsed)
    labs: {
      hemoglobin: labHemoglobin,
      hematocrit: labHematocrit,
      leukocytes: labLeukocytes,
      platelets: labPlatelets,
      crp: labCrp,
      ferritin: labFerritin,
      glucose: labGlucose,
      hba1c: labHba1c,
      collected_date: null,
      source: hasAnyLab ? "manual" : null,
    },
    
    // HISTÓRICO TERAPÊUTICO
    therapy_history: {
      prior_prp_prf_bmac: answers.prp_prf_bmac_anterior || null,
      physiotherapy_6_weeks: answers.fisioterapia_6_semanas ?? null,
      prior_surgery_region: answers.cirurgia_previa_regiao ?? null,
    },
    
    // PREPARO DO SOLO
    biological_soil: {
      no_recent_labs: fatoresPreparo.includes("sem_exames_recentes"),
      anemia_or_low_iron_or_low_b12: fatoresPreparo.includes("anemia_ferritina_b12"),
      smoker: smokingResult.status === "current",
      high_bmi: fatoresPreparo.includes("imc_elevado"),
    },
    
    // NUTRIÇÃO
    nutrition: {
      low_sun_vitd: fatoresNutricionais.includes("pouca_exposicao_solar"),
      restrictive_diet: fatoresNutricionais.includes("dieta_restritiva"),
      low_fruit_veg: fatoresNutricionais.includes("pouca_fruta_vegetal"),
    },
    
    // ESTILO DE VIDA
    lifestyle: {
      sleep_quality: answers.qualidade_sono || null,
      alcohol_gt_2wk: answers.consumo_alcool_2x_semana ?? false,
      perceived_stress: answers.nivel_estresse || null,
    },
    
    // PROCEDIMENTO
    intended_procedure: {
      type: answers.procedimento_considerado || null,
    },
  };
  
  return canonical;
}

/**
 * Mescla campos do FisioRegenScore Wizard para o canônico
 * (4 novos campos: quit_bucket, hypertension, dyslipidemia, tissue_type)
 */
export function mergeWizardFieldsToCanonical(
  canonical: RegenCanonical,
  wizardData: Partial<FisioRegenFormData>
): RegenCanonical {
  const merged: RegenCanonical = { 
    ...canonical,
    data_quality_alerts: [...canonical.data_quality_alerts],
    smoking: { ...canonical.smoking },
    comorbidities: { ...canonical.comorbidities },
    diagnosis: { ...canonical.diagnosis },
  };
  
  // Smoking quit bucket
  if (wizardData.regen_smoking_quit_bucket && wizardData.regen_smoking_quit_bucket !== "unknown") {
    merged.smoking.quit_bucket = wizardData.regen_smoking_quit_bucket as RegenSmokingQuitBucket;
  }
  
  // Recalcular status de tabagismo se wizard tiver dados
  if (wizardData.smoking_status) {
    const smokingResult = determineCanonicalSmokingStatus(
      [], // Não temos fatores_preparo aqui
      wizardData.smoking_status,
      wizardData.regen_smoking_quit_bucket
    );
    merged.smoking.status = smokingResult.status;
    merged.data_quality_alerts.push(...smokingResult.alerts);
  }
  
  // Hipertensão
  if (wizardData.regen_has_hypertension !== undefined) {
    merged.comorbidities.has_hypertension = wizardData.regen_has_hypertension;
  }
  
  // Dislipidemia
  if (wizardData.regen_has_dyslipidemia !== undefined) {
    merged.comorbidities.has_dyslipidemia = wizardData.regen_has_dyslipidemia;
  }
  
  // Tipo de tecido
  if (wizardData.regen_tissue_type && wizardData.regen_tissue_type !== "unknown") {
    merged.diagnosis.tissue_type = wizardData.regen_tissue_type as RegenTissueType;
  }
  
  // Atualizar timestamp
  merged.captured_at = new Date().toISOString();
  
  return merged;
}

/**
 * Adiciona regen_canonical ao questionnaire_responses SEM modificar dados existentes
 */
export function appendRegenCanonical(
  originalResponses: Record<string, unknown>,
  canonical: RegenCanonical
): Record<string, unknown> {
  return {
    ...originalResponses,
    regen_canonical: canonical,
  };
}

/**
 * Extrai regen_canonical de questionnaire_responses se existir
 */
export function extractRegenCanonical(
  questionnaireResponses: unknown
): RegenCanonical | null {
  if (!questionnaireResponses || typeof questionnaireResponses !== "object") {
    return null;
  }
  
  const responses = questionnaireResponses as Record<string, unknown>;
  if (responses.regen_canonical && typeof responses.regen_canonical === "object") {
    const canonical = responses.regen_canonical as RegenCanonical;
    if (canonical.schema_version === "regen_canonical_v1") {
      return canonical;
    }
  }
  
  return null;
}
