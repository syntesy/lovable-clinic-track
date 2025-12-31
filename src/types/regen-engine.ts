/**
 * REGEN ENGINE TYPES v1
 * 
 * Tipos para a estrutura de saída do motor clínico.
 * Persistido em questionnaire_responses.regen_engine_outputs
 */

// Lab Recommendation
export interface LabRecommendation {
  lab_code: string;
  lab_name: string;
  status: "USE" | "REPEAT" | "REQUEST";
  validity: "VALID" | "CAUTION" | "EXPIRED" | "UNKNOWN";
  reason_code: string;
  rationale_short: string;
  days_since_collection?: number | null;
}

// Guidance item
export interface Guidance {
  code: string;
  category: "lifestyle" | "medication" | "nutrition" | "preparation" | "general";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

// Procedure Eligibility
export interface ProcedureEligibility {
  procedure_type: string;
  eligibility: "Recommended" | "Possible with adjustments" | "Not recommended" | "Cannot evaluate";
  gates_triggered: string[];
  rationale: string;
}

// Safety Layer Output
export interface SafetyOutput {
  block: boolean;
  alert: boolean;
  reasons: string[];
}

// CRS Layer Output
export interface CRSOutput {
  score: number;
  classification: "Not Ready" | "Conditionally Ready" | "Potentially Ready";
  confidence: "High" | "Medium" | "Low";
  missing: string[];
  penalties_applied: string[];
}

// DIE Layer Output
export interface DIEOutput {
  lab_recommendations: LabRecommendation[];
  labs_valid_count: number;
  labs_expired_count: number;
  labs_missing_count: number;
}

// BRS Layer Output
export interface BRSOutput {
  score: number;
  confidence: "High" | "Medium" | "Low";
  alerts: string[];
  reason_codes: string[];
  penalties_applied: string[];
}

// TOG Layer Output
export interface TOGOutput {
  guidance: Guidance[];
}

// PEE Layer Output
export interface PEEOutput {
  eligibility: ProcedureEligibility[];
}

// Data Quality Output
export interface DataQualityOutput {
  alerts: string[];
  completeness_percent: number;
}

// Complete Engine Output
export interface RegenEngineOutputs {
  ruleset_version: "regen_rules_v1";
  computed_at: string;
  safety: SafetyOutput;
  crs: CRSOutput | null; // null if safety.block=true
  die: DIEOutput | null;
  brs: BRSOutput | null;
  tog: TOGOutput | null;
  pee: PEEOutput | null;
  data_quality: DataQualityOutput;
}

// Default empty output
export const defaultEngineOutputs: RegenEngineOutputs = {
  ruleset_version: "regen_rules_v1",
  computed_at: "",
  safety: { block: false, alert: false, reasons: [] },
  crs: null,
  die: null,
  brs: null,
  tog: null,
  pee: null,
  data_quality: { alerts: [], completeness_percent: 0 },
};
