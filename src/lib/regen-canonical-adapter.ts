/**
 * REGEN CANONICAL ADAPTER
 * 
 * Mapeia campos do TriagemBiologica (questionnaire_responses) para o formato canônico.
 * Não altera, apaga ou renomeia nada do JSON original.
 * Apenas adiciona regen_canonical como uma chave adicional.
 */

import { 
  RegenCanonical, 
  defaultRegenCanonical,
  RegenPainRegion,
  RegenSymptomDuration,
  RegenSmokingStatus,
  RegenSmokingQuitBucket,
  RegenTissueType,
  RegenYesNoUnknown,
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
 * Converte dados do TriagemBiologica para formato canônico
 */
export function buildRegenCanonicalFromTriagem(
  questionnaireResponses: TriagemQuestionnaireResponses
): RegenCanonical {
  const answers = questionnaireResponses.answers || {};
  const providedExams = questionnaireResponses.provided_exams || {};
  const redFlags = answers.red_flags || [];
  const medicamentos = answers.medicamentos || [];
  const fatoresPreparo = answers.fatores_preparo || [];
  const fatoresNutricionais = answers.fatores_nutricionais || [];
  
  const canonical: RegenCanonical = {
    ...defaultRegenCanonical,
    schema_version: "regen_canonical_v1",
    captured_at: new Date().toISOString(),
    
    // SEGURANÇA
    safety: {
      cancer_tx_now_or_last_12m: redFlags.includes("cancer_ativo") ? "yes" : "unknown",
      fever_last_7d: redFlags.includes("infeccao_ativa_febre") ? "yes" : "unknown",
      open_wound_or_skin_infection_at_pain_site: redFlags.includes("infeccao_pele_local") ? "yes" : "unknown",
      active_infection: redFlags.includes("infeccao_ativa_febre") || redFlags.includes("infeccao_pele_local"),
      autoimmune_disease_active: redFlags.includes("doenca_autoimune_ativa"),
    },
    
    // QUEIXA
    complaint: {
      pain_region: REGION_MAP[answers.regiao_principal || ""] || null,
      pain_region_text: answers.regiao_principal === "outro" ? "Outro" : null,
      symptom_duration_bucket: DURATION_MAP[answers.tempo_dor || ""] || null,
      pain_nrs: answers.dor_escala ?? null,
      suspected_diagnosis: answers.diagnostico_suspeito || null,
      primary_diagnosis_free: null, // Preenchido pelo profissional
    },
    
    // MEDICAÇÕES
    medications: {
      nsaid_recent_14d: medicamentos.includes("aine_7_dias") ? "yes" : "unknown",
      days_since_last_nsaid: null, // Não capturado diretamente
      steroid_recent: (medicamentos.includes("corticoide_oral_30_dias") || medicamentos.includes("infiltracao_3_meses")) ? "yes" : "unknown",
      steroid_route: medicamentos.includes("infiltracao_3_meses") ? "local_infiltration" : 
                     medicamentos.includes("corticoide_oral_30_dias") ? "oral_injection" : null,
      days_since_last_steroid: null,
      anticoagulant: medicamentos.includes("anticoagulante"),
      immunosuppressor: medicamentos.includes("imunossupressor"),
      aspirin: false, // Não diferenciado no TriagemBiologica
      p2y12: false,
    },
    
    // TABAGISMO
    smoking: {
      status: fatoresPreparo.includes("tabagista") ? "light_moderate" : "non_smoker",
      quit_bucket: null,
    },
    
    // COMORBIDADES
    comorbidities: {
      has_diabetes: redFlags.includes("diabetes_descompensado"),
      has_hypertension: false, // Campo novo, não existe no TriagemBiologica atual
      has_dyslipidemia: false, // Campo novo
      diabetes_uncontrolled: redFlags.includes("diabetes_descompensado"),
      renal_hepatic_disease: redFlags.includes("doenca_renal_hepatica"),
    },
    
    // DIAGNÓSTICO
    diagnosis: {
      tissue_type: "unknown",
      lesion_severity: null,
      primary_diagnosis: null,
    },
    
    // LABS
    labs: {
      raw_text: null,
      parsed: {
        hemoglobin: providedExams.hemoglobina ? parseFloat(providedExams.hemoglobina) : null,
        hematocrit: providedExams.hematocrito ? parseFloat(providedExams.hematocrito) : null,
        leukocytes: providedExams.leucocitos ? parseFloat(providedExams.leucocitos) : null,
        platelets: providedExams.plaquetas ? parseFloat(providedExams.plaquetas) : null,
        crp: providedExams.pcr ? parseFloat(providedExams.pcr) : null,
        ferritin: providedExams.ferritina ? parseFloat(providedExams.ferritina) : null,
        glucose: providedExams.glicemia ? parseFloat(providedExams.glicemia) : null,
        hba1c: providedExams.hba1c ? parseFloat(providedExams.hba1c) : null,
      },
      collected_date: null,
      source: Object.keys(providedExams).length > 0 ? "manual" : null,
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
      smoker: fatoresPreparo.includes("tabagista"),
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
  const merged: RegenCanonical = { ...canonical };
  
  // Smoking quit bucket
  if (wizardData.regen_smoking_quit_bucket) {
    merged.smoking.quit_bucket = wizardData.regen_smoking_quit_bucket as RegenSmokingQuitBucket;
  }
  
  // Smoking status (se wizard tem ex_smoker)
  if (wizardData.smoking_status === "ex_smoker") {
    merged.smoking.status = "ex_smoker";
  } else if (wizardData.smoking_status) {
    merged.smoking.status = wizardData.smoking_status as RegenSmokingStatus;
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
