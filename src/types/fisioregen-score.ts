// Tipos para FISIOREGEN SCORE

export type CRPStatus = "not_available" | "normal" | "mild" | "high";
export type SmokingStatus = "non_smoker" | "light_moderate" | "heavy" | "ex_smoker";
export type SmokingQuitBucket = "lt_6m" | "m6_12" | "gt_12m" | "unknown";
export type TissueType = "tendon" | "cartilage" | "ligament" | "muscle" | "enthesis" | "other" | "unknown";
export type TissueIntegrityGrade = "preserved" | "moderate" | "severe" | "complete_rupture";
export type TissueSubstrateViabilityGrade = "viable" | "moderate_changes" | "severe" | "collapse";
export type TissueBiologicStageGrade = "responsive" | "advanced_low_matrix" | "very_advanced";
export type PriorOrthobiologicAttempts = "first" | "failed_once" | "failed_2plus";
export type LogisticsCapacity = "high" | "medium" | "low";
export type AdherenceEstimate = "high" | "medium" | "low";
export type ExpectationRealism = "realistic" | "partial" | "unrealistic";

export type ScoreStatus = 
  | "NAO_APTO_NO_MOMENTO" 
  | "NAO_APTO" 
  | "APTO_COM_ALTO_RISCO" 
  | "APTO" 
  | "EXCELENTE_CANDIDATO";

export type BlockType =
  | "BLOCK_INF_OR_SKIN"
  | "BLOCK_CANCER_ACTIVE_TX"
  | "BLOCK_PLATELETS_LOW"
  | "BLOCK_COMPLETE_RUPTURE"
  | "BLOCK_BONE_COLLAPSE"
  | "BLOCK_ASPIRIN_WINDOW"
  | "BLOCK_NSAID_WINDOW"
  | "BLOCK_P2Y12_WINDOW"
  | "BLOCK_SYS_STEROID_WINDOW"
  | "BLOCK_LOCAL_STEROID_WINDOW";

export type FlagType =
  | "A_GLYCEMIA_BORDERLINE"
  | "A_GLYCEMIA_HIGH"
  | "A_HBA1C_REQUESTED"
  | "A_SMOKING"
  | "A_SMOKING_HEAVY"
  | "A_PLATELETS_REQUESTED"
  | "A_PLATELETS_BORDERLINE"
  | "A_CRP_NOT_AVAILABLE"
  | "A_CRP_MILD"
  | "A_CRP_HIGH"
  | "A_MEDS_GRAY_WINDOW"
  | "A_MEDS_DATE_MISSING"
  | "B_COMPLETE_RUPTURE"
  | "B_COLLAPSE"
  | "B_LOW_REGEN"
  | "B_PRIOR_FAILURE"
  | "B_MULTIPLE_FAILURES"
  | "C_LOGISTICS_LIMIT"
  | "C_LOGISTICS_POOR"
  | "C_ADH_MED"
  | "C_ADH_LOW"
  | "C_EXPECT_PARTIAL"
  | "C_EXPECT_UNREAL";

export interface FisioRegenFormData {
  // Tela 1: Bloqueios
  has_active_infection: boolean;
  has_skin_compromise_at_site: boolean;
  has_active_cancer_on_treatment: boolean;
  
  // Tela 2: Medicações
  use_aspirin: boolean;
  last_aspirin_date: string | null;
  use_nsaid_nonselective: boolean;
  last_nsaid_nonselective_date: string | null;
  use_p2y12: boolean;
  last_p2y12_date: string | null;
  use_systemic_corticosteroid: boolean;
  last_systemic_corticosteroid_date: string | null;
  use_local_corticosteroid_target: boolean;
  last_local_corticosteroid_target_date: string | null;
  
  // Tela 3: Exames
  diabetes_known: boolean;
  platelets_value: number | null;
  hba1c_value: number | null;
  crp_status: CRPStatus;
  
  // Tela 4: Tabagismo
  smoking_status: SmokingStatus;
  regen_smoking_quit_bucket: SmokingQuitBucket | null;
  
  // Tela 3: Comorbidades adicionais
  regen_has_hypertension: boolean;
  regen_has_dyslipidemia: boolean;
  
  // Tela 5: Prontidão tecidual (somente profissional)
  regen_tissue_type: TissueType;
  tissue_integrity_grade: TissueIntegrityGrade;
  tissue_substrate_viability_grade: TissueSubstrateViabilityGrade;
  tissue_biologic_stage_grade: TissueBiologicStageGrade;
  prior_orthobiologic_attempts: PriorOrthobiologicAttempts;
  structural_block_complete_rupture_or_avulsion: boolean;
  structural_block_bone_collapse_or_osteonecrosis: boolean;
  
  // Tela 6: Execução/adesão
  logistics_capacity: LogisticsCapacity;
  adherence_estimate: AdherenceEstimate;
  expectation_realism: ExpectationRealism;
}

export interface DomainScores {
  A: number;
  B: number;
  C: number;
}

export interface ComputedResult {
  biological_readiness_score: number;
  domains: DomainScores;
  status: ScoreStatus;
  bloqueio: boolean;
  score_valid: boolean;
  triggered_blocks: BlockType[];
  triggered_flags: FlagType[];
  mensagem_paciente: string;
  mensagem_profissional: string;
}

export const initialFormData: FisioRegenFormData = {
  // Bloqueios
  has_active_infection: false,
  has_skin_compromise_at_site: false,
  has_active_cancer_on_treatment: false,
  
  // Medicações
  use_aspirin: false,
  last_aspirin_date: null,
  use_nsaid_nonselective: false,
  last_nsaid_nonselective_date: null,
  use_p2y12: false,
  last_p2y12_date: null,
  use_systemic_corticosteroid: false,
  last_systemic_corticosteroid_date: null,
  use_local_corticosteroid_target: false,
  last_local_corticosteroid_target_date: null,
  
  // Exames
  diabetes_known: false,
  platelets_value: null,
  hba1c_value: null,
  crp_status: "not_available",
  
  // Tabagismo
  smoking_status: "non_smoker",
  regen_smoking_quit_bucket: null,
  
  // Comorbidades adicionais
  regen_has_hypertension: false,
  regen_has_dyslipidemia: false,
  
  // Prontidão tecidual (somente profissional)
  regen_tissue_type: "unknown",
  tissue_integrity_grade: "preserved",
  tissue_substrate_viability_grade: "viable",
  tissue_biologic_stage_grade: "responsive",
  prior_orthobiologic_attempts: "first",
  structural_block_complete_rupture_or_avulsion: false,
  structural_block_bone_collapse_or_osteonecrosis: false,
  
  // Execução/adesão
  logistics_capacity: "high",
  adherence_estimate: "high",
  expectation_realism: "realistic",
};
