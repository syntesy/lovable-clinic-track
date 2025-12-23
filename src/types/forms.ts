// Tipos para formulários do sistema

export interface MACProtocolFormData {
  light_type: string;
  wavelength: string;
  power: string;
  total_energy: string;
  fluence: string;
  irradiated_area: string;
  application_time: string;
  delivery_mode: string;
  technique: string;
  target_tissue: string;
  frequency?: string;
  distance_to_tissue?: string;
  estimated_depth?: string;
  photosensitizer_type?: string;
  concentration?: string;
  application_method?: string;
  time_between_application_and_irradiation?: string;
  mac_time_per_session?: string;
  accumulated_treatment_time?: string;
  clinical_rationale?: string;
  technical_observations?: string;
}

export interface TreatmentSessionFormData {
  session_number: string;
  session_date: string;
  vas_on_day?: string;
  clinical_observations?: string;
  treatment_time_total?: string;
  pharmaceutical_used?: string;
  associated_techniques?: string;
  immediate_response?: string;
  next_session_plan?: string;
  function_score?: string;
  mobility_score?: string;
  improvement_percentage?: string;
}

export interface PatientFormData {
  full_name: string;
  age?: number;
  birth_date?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  profession?: string;
  sport_activity?: string;
  clinical_diagnosis?: string;
  imaging_diagnosis?: string;
  treated_region?: string;
  symptoms_duration?: string;
  previous_treatments?: string;
  specific_limitations?: string;
  initial_vas?: number;
  initial_function?: number;
  initial_mobility?: number;
  skin_phototype?: string;
}

export interface EPIProtocolFormData {
  protocol_name: string;
  injury_region?: string;
  specific_tissue?: string;
  needle_type?: string;
  technique?: string;
  current_intensity?: string;
  application_time?: string;
  session_frequency?: string;
  total_sessions?: string;
  clinical_observations?: string;
  contraindications?: string;
}

export interface OrtobiologicosProtocolFormData {
  protocol_name: string;
  therapy_type: string;
  collection_method?: string;
  processing_method?: string;
  volume_collected?: string;
  volume_applied?: string;
  application_site?: string;
  injection_technique?: string;
  associated_therapies?: string;
  session_frequency?: string;
  total_sessions?: string;
  clinical_observations?: string;
  contraindications?: string;
  pre_procedure_exams?: string;
}

// Tipo utilitário para parsing seguro de números
export const safeParseFloat = (value: string | undefined | null): number | null => {
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

export const safeParseInt = (value: string | undefined | null): number | null => {
  if (!value || value.trim() === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};
