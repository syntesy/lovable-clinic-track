/**
 * Clinical Standard Engine - Core Dataset Types
 * 
 * Types for standardized procedure data collection (starting with PRP)
 */

// =============================================================================
// ENUMS / OPTIONS
// =============================================================================

export const PATHOLOGY_OPTIONS = [
  { value: 'artrose', label: 'Artrose' },
  { value: 'tendinopatia', label: 'Tendinopatia' },
  { value: 'lesao_muscular', label: 'Lesão muscular' },
  { value: 'hernia_disco', label: 'Hérnia de disco' },
  { value: 'outra', label: 'Outra (não comparável)' },
] as const;

export const ANATOMIC_REGION_OPTIONS = [
  { value: 'joelho', label: 'Joelho' },
  { value: 'ombro', label: 'Ombro' },
  { value: 'quadril', label: 'Quadril' },
  { value: 'cotovelo', label: 'Cotovelo' },
  { value: 'coluna_cervical', label: 'Coluna cervical' },
  { value: 'coluna_lombar', label: 'Coluna lombar' },
] as const;

export const SPINE_LOCATIONS = [
  { value: 'disco_intervertebral', label: 'Disco intervertebral' },
  { value: 'forame_neural', label: 'Forame neural' },
  { value: 'facetaria', label: 'Facetária' },
  { value: 'epidural', label: 'Epidural' },
] as const;

// Severity classifications per pathology
export const ARTROSE_SEVERITY = [
  { value: 'kl_0', label: 'Kellgren-Lawrence 0' },
  { value: 'kl_1', label: 'Kellgren-Lawrence 1' },
  { value: 'kl_2', label: 'Kellgren-Lawrence 2' },
  { value: 'kl_3', label: 'Kellgren-Lawrence 3' },
  { value: 'kl_4', label: 'Kellgren-Lawrence 4' },
] as const;

export const HERNIA_TYPE = [
  { value: 'protusao', label: 'Protusão' },
  { value: 'extrusao', label: 'Extrusão' },
  { value: 'sequestro', label: 'Sequestro' },
] as const;

export const HERNIA_COMPRESSION = [
  { value: 'leve', label: 'Compressão leve' },
  { value: 'moderada', label: 'Compressão moderada' },
  { value: 'severa', label: 'Compressão severa' },
] as const;

export const TENDINOPATIA_SEVERITY = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'severa', label: 'Severa' },
  { value: 'ruptura_parcial', label: 'Ruptura parcial' },
] as const;

export const LESAO_MUSCULAR_SEVERITY = [
  { value: 'grau_1', label: 'Grau I (leve)' },
  { value: 'grau_2', label: 'Grau II (moderada)' },
  { value: 'grau_3', label: 'Grau III (completa)' },
] as const;

// PRP Protocol options
export const SESSIONS_COUNT_OPTIONS = [
  { value: '1', label: '1 sessão' },
  { value: '2', label: '2 sessões' },
  { value: '3', label: '3 sessões' },
  { value: '>3', label: '>3 sessões' },
] as const;

export const SESSIONS_INTERVAL_OPTIONS = [
  { value: '1-2_semanas', label: '1–2 semanas' },
  { value: '3-4_semanas', label: '3–4 semanas' },
  { value: '4-6_semanas', label: '4–6 semanas' },
  { value: '>6_semanas', label: '>6 semanas' },
] as const;

export const VOLUME_OPTIONS = [
  { value: '1-3_ml', label: '1–3 ml' },
  { value: '4-6_ml', label: '4–6 ml' },
  { value: '7-10_ml', label: '7–10 ml' },
  { value: '>10_ml', label: '>10 ml' },
] as const;

export const PRP_TYPE_OPTIONS = [
  { value: 'lp_prp', label: 'LP-PRP (Leukocyte-Poor)' },
  { value: 'lr_prp', label: 'LR-PRP (Leukocyte-Rich)' },
  { value: 'desconhecido', label: 'Não soube informar' },
] as const;

export const PRP_ACTIVATION_OPTIONS = [
  { value: 'nao_ativado', label: 'Não ativado' },
  { value: 'ativado', label: 'Ativado' },
] as const;

export const ACTIVATION_METHOD_OPTIONS = [
  { value: 'cacl2', label: 'CaCl2' },
  { value: 'trombina', label: 'Trombina' },
  { value: 'outro', label: 'Outro' },
] as const;

export const IMAGING_GUIDANCE_OPTIONS = [
  { value: 'ultrassonografia', label: 'Ultrassonografia' },
  { value: 'radioscopia', label: 'Radioscopia' },
  { value: 'tomografia', label: 'Tomografia' },
  { value: 'sem_guia', label: 'Sem guia' },
] as const;

export const HA_TYPE_OPTIONS = [
  { value: 'baixo_peso', label: 'HA baixo peso molecular' },
  { value: 'alto_peso', label: 'HA alto peso molecular' },
  { value: 'desconhecido', label: 'Não soube informar' },
] as const;

export const NSAID_USE_OPTIONS = [
  { value: 'nao', label: 'Não' },
  { value: 'ate_7_dias', label: 'Sim – até 7 dias' },
  { value: '8_a_14_dias', label: 'Sim – 8 a 14 dias' },
  { value: '>14_dias', label: 'Sim – >14 dias' },
] as const;

export const SHOCKWAVE_OPTIONS = [
  { value: 'none', label: 'Não' },
  { value: '1-3', label: '1–3 sessões' },
  { value: '>3', label: '>3 sessões' },
] as const;

// =============================================================================
// FORM DATA TYPES
// =============================================================================

export interface ClinicalContextData {
  pathology: string;
  anatomic_region: string;
  specific_location?: string;
  symptom_duration?: string;
}

export interface SeverityData {
  severity_classification: string;
  hernia_compression?: string; // Only for hernia
}

export interface PRPProtocolData {
  sessions_count: string;
  sessions_interval: string;
  volume_per_session_range: string;
  prp_type: string;
  prp_activation: string;
  activation_method?: string;
  imaging_guidance: string;
}

export interface AssociationsData {
  prp_with_hyaluronic_acid: boolean;
  hyaluronic_acid_type?: string;
  recent_nsaid_use: string;
}

export interface CoInterventionsData {
  exercise_therapy: boolean;
  shockwave_therapy: string;
  epi_associated: boolean;
}

export interface ClinicalStandardFormData {
  clinical_context: ClinicalContextData;
  severity: SeverityData;
  prp_protocol: PRPProtocolData;
  associations: AssociationsData;
  co_interventions: CoInterventionsData;
}

export const defaultFormData: ClinicalStandardFormData = {
  clinical_context: {
    pathology: '',
    anatomic_region: '',
    specific_location: '',
    symptom_duration: '',
  },
  severity: {
    severity_classification: '',
    hernia_compression: '',
  },
  prp_protocol: {
    sessions_count: '',
    sessions_interval: '',
    volume_per_session_range: '',
    prp_type: '',
    prp_activation: '',
    activation_method: '',
    imaging_guidance: '',
  },
  associations: {
    prp_with_hyaluronic_acid: false,
    hyaluronic_acid_type: '',
    recent_nsaid_use: '',
  },
  co_interventions: {
    exercise_therapy: false,
    shockwave_therapy: 'none',
    epi_associated: false,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getSeverityOptionsForPathology(pathology: string) {
  switch (pathology) {
    case 'artrose':
      return ARTROSE_SEVERITY;
    case 'tendinopatia':
      return TENDINOPATIA_SEVERITY;
    case 'lesao_muscular':
      return LESAO_MUSCULAR_SEVERITY;
    case 'hernia_disco':
      return HERNIA_TYPE;
    default:
      return [];
  }
}

export function needsSpineLocation(region: string): boolean {
  return region === 'coluna_cervical' || region === 'coluna_lombar';
}

export function needsHerniaCompression(pathology: string): boolean {
  return pathology === 'hernia_disco';
}

export function isStep1Complete(data: ClinicalContextData): boolean {
  if (!data.pathology || !data.anatomic_region) return false;
  if (needsSpineLocation(data.anatomic_region) && !data.specific_location) return false;
  return true;
}

export function isStep2Complete(data: SeverityData, pathology: string): boolean {
  if (!data.severity_classification) return false;
  if (needsHerniaCompression(pathology) && !data.hernia_compression) return false;
  return true;
}

export function isStep3Complete(data: PRPProtocolData): boolean {
  return !!(
    data.sessions_count &&
    data.sessions_interval &&
    data.volume_per_session_range &&
    data.prp_type &&
    data.prp_activation &&
    data.imaging_guidance &&
    (data.prp_activation !== 'ativado' || data.activation_method)
  );
}

export function isStep4Complete(data: AssociationsData): boolean {
  if (!data.recent_nsaid_use) return false;
  if (data.prp_with_hyaluronic_acid && !data.hyaluronic_acid_type) return false;
  return true;
}

export function isStep5Complete(data: CoInterventionsData): boolean {
  return data.shockwave_therapy !== '';
}
