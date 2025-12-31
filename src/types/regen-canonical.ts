/**
 * REGEN CANONICAL v1.1 - Estrutura canônica unificada para dados de triagem
 * 
 * Objetivo: Centralizar todos os dados de triagem (TriagemBiologica + FisioRegenScore)
 * em um formato padronizado, persistido em prp_screenings.questionnaire_responses.regen_canonical
 * 
 * SEM SCORE, SEM REGRAS CLÍNICAS - apenas estrutura de dados.
 * 
 * v1.1 - Correções:
 * - smoking.status: enum canônico publicável (never|former|current|unknown)
 * - labs: raw_value + parsed_value + unit + parsed_ok + notes
 * - diagnosis: separar suspected_diagnosis de primary_clinical_diagnosis
 * - data_quality_alerts: array de alertas de qualidade de dados
 */

// Enums canônicos PUBLICÁVEIS (padrão internacional)
export type RegenCanonicalSmokingStatus = "never" | "former" | "current" | "unknown";
export type RegenSmokingQuitBucket = "lt_6m" | "m6_12" | "gt_12m" | "unknown";
export type RegenPainRegion = "shoulder" | "elbow" | "hip" | "knee" | "ankle_foot" | "spine" | "other";
export type RegenSymptomDuration = "lt_3m" | "m3_6" | "gt_6m";
export type RegenSteroidRoute = "oral_injection" | "local_infiltration";
export type RegenTissueType = "tendon" | "cartilage" | "ligament" | "muscle" | "enthesis" | "other" | "unknown";
export type RegenLesionSeverity = "mild" | "moderate" | "severe";
export type RegenYesNoUnknown = "yes" | "no" | "unknown";

// Estrutura de um exame laboratorial individual
export interface RegenLabValue {
  raw_value: string | null;      // Valor original como string
  parsed_value: number | null;   // Valor parseado como número
  unit: string | null;           // Unidade de medida
  parsed_ok: boolean;            // Se o parsing foi bem-sucedido
  notes: string | null;          // Observações ou motivo de falha
}

// Alerta de qualidade de dados
export interface RegenDataQualityAlert {
  field: string;                 // Campo afetado
  alert_type: "conflict" | "parse_error" | "missing" | "out_of_range" | "inconsistent";
  message: string;               // Descrição do problema
  timestamp: string;             // Quando foi detectado
}

// Estrutura canônica completa
export interface RegenCanonical {
  schema_version: "regen_canonical_v1";
  captured_at: string; // ISO timestamp
  
  // ALERTAS DE QUALIDADE DE DADOS
  data_quality_alerts: RegenDataQualityAlert[];
  
  // SEGURANÇA BÁSICA
  safety: {
    cancer_tx_now_or_last_12m: RegenYesNoUnknown;
    fever_last_7d: RegenYesNoUnknown;
    open_wound_or_skin_infection_at_pain_site: RegenYesNoUnknown;
    active_infection: boolean;
    autoimmune_disease_active: boolean;
  };
  
  // QUEIXA PRINCIPAL
  complaint: {
    pain_region: RegenPainRegion | null;
    pain_region_text: string | null; // Para "other"
    symptom_duration_bucket: RegenSymptomDuration | null;
    pain_nrs: number | null; // 0-10
    suspected_diagnosis: string | null; // Diagnóstico suspeito (triagem)
  };
  
  // MEDICAÇÕES
  medications: {
    nsaid_recent_14d: RegenYesNoUnknown;
    days_since_last_nsaid: number | null;
    steroid_recent: RegenYesNoUnknown;
    steroid_route: RegenSteroidRoute | null;
    days_since_last_steroid: number | null;
    anticoagulant: boolean;
    immunosuppressor: boolean;
    aspirin: boolean;
    p2y12: boolean;
  };
  
  // TABAGISMO (enum canônico publicável)
  smoking: {
    status: RegenCanonicalSmokingStatus; // never | former | current | unknown
    quit_bucket: RegenSmokingQuitBucket | null;
  };
  
  // COMORBIDADES
  comorbidities: {
    has_diabetes: boolean;
    has_hypertension: boolean;
    has_dyslipidemia: boolean;
    diabetes_uncontrolled: boolean;
    renal_hepatic_disease: boolean;
  };
  
  // DIAGNÓSTICO (SOMENTE PROFISSIONAL)
  diagnosis: {
    tissue_type: RegenTissueType;
    lesion_severity: RegenLesionSeverity | null;
    primary_clinical_diagnosis: string | null; // Diagnóstico final do profissional
  };
  
  // LABS (estruturado com raw + parsed)
  labs: {
    hemoglobin: RegenLabValue;
    hematocrit: RegenLabValue;
    leukocytes: RegenLabValue;
    platelets: RegenLabValue;
    crp: RegenLabValue;
    ferritin: RegenLabValue;
    glucose: RegenLabValue;
    hba1c: RegenLabValue;
    collected_date: string | null;
    source: "manual" | "ocr" | "integration" | null;
  };
  
  // HISTÓRICO TERAPÊUTICO
  therapy_history: {
    prior_prp_prf_bmac: string | null;
    physiotherapy_6_weeks: boolean | null;
    prior_surgery_region: boolean | null;
  };
  
  // PREPARO DO SOLO BIOLÓGICO (flags)
  biological_soil: {
    no_recent_labs: boolean;
    anemia_or_low_iron_or_low_b12: boolean;
    smoker: boolean;
    high_bmi: boolean;
  };
  
  // NUTRIÇÃO
  nutrition: {
    low_sun_vitd: boolean;
    restrictive_diet: boolean;
    low_fruit_veg: boolean;
  };
  
  // ESTILO DE VIDA
  lifestyle: {
    sleep_quality: string | null;
    alcohol_gt_2wk: boolean;
    perceived_stress: string | null;
  };
  
  // PROCEDIMENTO PRETENDIDO
  intended_procedure: {
    type: string | null; // PRP, PRF, BMAC, etc.
  };
}

// Valor de lab padrão
export const defaultLabValue: RegenLabValue = {
  raw_value: null,
  parsed_value: null,
  unit: null,
  parsed_ok: false,
  notes: null,
};

// Valor inicial/default para RegenCanonical
export const defaultRegenCanonical: RegenCanonical = {
  schema_version: "regen_canonical_v1",
  captured_at: "",
  
  data_quality_alerts: [],
  
  safety: {
    cancer_tx_now_or_last_12m: "unknown",
    fever_last_7d: "unknown",
    open_wound_or_skin_infection_at_pain_site: "unknown",
    active_infection: false,
    autoimmune_disease_active: false,
  },
  
  complaint: {
    pain_region: null,
    pain_region_text: null,
    symptom_duration_bucket: null,
    pain_nrs: null,
    suspected_diagnosis: null,
  },
  
  medications: {
    nsaid_recent_14d: "unknown",
    days_since_last_nsaid: null,
    steroid_recent: "unknown",
    steroid_route: null,
    days_since_last_steroid: null,
    anticoagulant: false,
    immunosuppressor: false,
    aspirin: false,
    p2y12: false,
  },
  
  smoking: {
    status: "unknown",
    quit_bucket: null,
  },
  
  comorbidities: {
    has_diabetes: false,
    has_hypertension: false,
    has_dyslipidemia: false,
    diabetes_uncontrolled: false,
    renal_hepatic_disease: false,
  },
  
  diagnosis: {
    tissue_type: "unknown",
    lesion_severity: null,
    primary_clinical_diagnosis: null,
  },
  
  labs: {
    hemoglobin: { ...defaultLabValue },
    hematocrit: { ...defaultLabValue },
    leukocytes: { ...defaultLabValue },
    platelets: { ...defaultLabValue },
    crp: { ...defaultLabValue },
    ferritin: { ...defaultLabValue },
    glucose: { ...defaultLabValue },
    hba1c: { ...defaultLabValue },
    collected_date: null,
    source: null,
  },
  
  therapy_history: {
    prior_prp_prf_bmac: null,
    physiotherapy_6_weeks: null,
    prior_surgery_region: null,
  },
  
  biological_soil: {
    no_recent_labs: false,
    anemia_or_low_iron_or_low_b12: false,
    smoker: false,
    high_bmi: false,
  },
  
  nutrition: {
    low_sun_vitd: false,
    restrictive_diet: false,
    low_fruit_veg: false,
  },
  
  lifestyle: {
    sleep_quality: null,
    alcohol_gt_2wk: false,
    perceived_stress: null,
  },
  
  intended_procedure: {
    type: null,
  },
};
