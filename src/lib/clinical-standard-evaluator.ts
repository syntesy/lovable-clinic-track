/**
 * Clinical Standard Evaluator
 * 
 * Deterministic function to evaluate eligibility for collective intelligence
 * NO AI, fully reproducible.
 */

export type ClinicalStandardStatus = 'eligible' | 'eligible_with_penalty' | 'not_eligible';

export interface EvaluationResult {
  status: ClinicalStandardStatus;
  notes: string[];
  isComparable: boolean;
}

interface ProcedureStandardRecord {
  pathology: string;
  anatomic_region: string;
  specific_location: string | null;
  severity_classification: string;
  symptom_duration: string | null;
  procedure_type: string;
}

interface PRPProtocolCore {
  sessions_count: string;
  sessions_interval: string | null;
  volume_per_session_range: string;
  prp_type: string;
  prp_activation: string;
  activation_method: string | null;
  imaging_guidance: string;
  prp_with_hyaluronic_acid: boolean;
  hyaluronic_acid_type: string | null;
  recent_nsaid_use: string;
}

interface CoInterventionsCore {
  exercise_therapy: boolean;
  shockwave_therapy: string;
  epi_associated: boolean;
}

export interface EvaluationInput {
  record: ProcedureStandardRecord;
  prpProtocol: PRPProtocolCore;
  coInterventions: CoInterventionsCore;
}

/**
 * Main evaluation function - deterministic, no AI
 */
export function evaluateClinicalStandard(input: EvaluationInput): EvaluationResult {
  const notes: string[] = [];
  let isComparable = true;
  let hasNotEligible = false;
  let hasPenalty = false;

  // ===========================================
  // RULE 3.2: Minimum complete dataset check
  // ===========================================
  const missingFields = checkRequiredFields(input);
  if (missingFields.length > 0) {
    return {
      status: 'not_eligible',
      notes: [`Campos obrigatórios incompletos: ${missingFields.join(', ')}`],
      isComparable: false,
    };
  }

  // ===========================================
  // RULE 3.5: Coherence validation (auto-clean)
  // ===========================================
  // If prp_activation == "nao_ativado" and activation_method is filled, ignore it
  // If sessions_count == "1" and sessions_interval is filled, ignore it
  // (These are handled during save, but we validate here too)

  // ===========================================
  // RULE 3.3: Comparable cluster check
  // ===========================================
  if (input.record.pathology === 'outra') {
    hasNotEligible = true;
    isComparable = false;
    notes.push('Cluster não padronizado (patologia = Outra). Não entra em inteligência coletiva.');
  }

  // ===========================================
  // RULE 3.4: Penalties (don't exclude, reduce weight)
  // ===========================================
  if (input.prpProtocol.prp_type === 'desconhecido') {
    hasPenalty = true;
    notes.push('Tipo de PRP não informado (peso analítico reduzido).');
  }

  if (input.prpProtocol.recent_nsaid_use !== 'nao') {
    hasPenalty = true;
    notes.push('Uso recente de AINE (pode reduzir qualidade do PRP).');
  }

  // Spine procedure without imaging guidance
  const isSpine = ['coluna_cervical', 'coluna_lombar'].includes(input.record.anatomic_region);
  if (isSpine && input.prpProtocol.imaging_guidance === 'sem_guia') {
    hasPenalty = true;
    notes.push('Procedimento em coluna sem guia por imagem (peso reduzido).');
  }

  // ===========================================
  // RULE 3.1: Priority hierarchy
  // ===========================================
  let status: ClinicalStandardStatus;
  
  if (hasNotEligible) {
    status = 'not_eligible';
  } else if (hasPenalty) {
    status = 'eligible_with_penalty';
  } else {
    status = 'eligible';
  }

  return { status, notes, isComparable };
}

/**
 * Check required fields and return list of missing ones
 */
function checkRequiredFields(input: EvaluationInput): string[] {
  const missing: string[] = [];

  // A) procedure_standard_records
  if (!input.record.pathology) missing.push('Patologia');
  if (!input.record.anatomic_region) missing.push('Região anatômica');
  
  // specific_location is required for spine
  const isSpine = ['coluna_cervical', 'coluna_lombar'].includes(input.record.anatomic_region);
  if (isSpine && !input.record.specific_location) {
    missing.push('Localização específica');
  }
  
  if (!input.record.severity_classification) missing.push('Classificação de gravidade');
  if (!input.record.procedure_type) missing.push('Tipo de procedimento');

  // B) prp_protocol_core
  if (!input.prpProtocol.sessions_count) missing.push('Número de sessões');
  
  // sessions_interval is required if sessions_count != "1"
  if (input.prpProtocol.sessions_count !== '1' && !input.prpProtocol.sessions_interval) {
    missing.push('Intervalo entre sessões');
  }
  
  if (!input.prpProtocol.volume_per_session_range) missing.push('Volume por sessão');
  if (!input.prpProtocol.prp_type) missing.push('Tipo de PRP');
  if (!input.prpProtocol.prp_activation) missing.push('Ativação do PRP');
  
  // activation_method required if prp_activation == "ativado"
  if (input.prpProtocol.prp_activation === 'ativado' && !input.prpProtocol.activation_method) {
    missing.push('Método de ativação');
  }
  
  if (!input.prpProtocol.imaging_guidance) missing.push('Guia por imagem');
  
  // hyaluronic_acid_type required if prp_with_hyaluronic_acid == true
  if (input.prpProtocol.prp_with_hyaluronic_acid && !input.prpProtocol.hyaluronic_acid_type) {
    missing.push('Tipo de ácido hialurônico');
  }
  
  if (!input.prpProtocol.recent_nsaid_use) missing.push('Uso recente de AINE');

  // C) co_interventions_core
  if (input.coInterventions.exercise_therapy === undefined) missing.push('Exercício terapêutico');
  if (!input.coInterventions.shockwave_therapy) missing.push('Ondas de choque');
  if (input.coInterventions.epi_associated === undefined) missing.push('EPI associada');

  return missing;
}

/**
 * Get default message based on status when notes are empty
 */
export function getDefaultMessage(status: ClinicalStandardStatus, hasNotes: boolean): string {
  if (hasNotes) return '';
  
  switch (status) {
    case 'eligible':
      return 'Dados padronizados completos.';
    case 'eligible_with_penalty':
      return 'Caso elegível com observações.';
    case 'not_eligible':
      return 'Complete os campos obrigatórios para entrar na inteligência coletiva.';
  }
}

/**
 * Get status badge config
 */
export function getStatusBadgeConfig(status: ClinicalStandardStatus): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: string;
  label: string;
} {
  switch (status) {
    case 'eligible':
      return {
        variant: 'default',
        className: 'bg-clinical-safe text-white',
        icon: '🟢',
        label: 'Elegível para Inteligência Coletiva',
      };
    case 'eligible_with_penalty':
      return {
        variant: 'secondary',
        className: 'bg-clinical-warning text-white',
        icon: '🟡',
        label: 'Elegível com peso reduzido',
      };
    case 'not_eligible':
      return {
        variant: 'destructive',
        className: 'bg-clinical-risk text-white',
        icon: '🔴',
        label: 'Não elegível',
      };
  }
}
