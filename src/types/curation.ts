export type EvidenceLevel = 'ia' | 'ib' | 'iia' | 'iib' | 'iii' | 'iv' | 'v';
export type BiasRisk = 'baixo' | 'moderado' | 'alto' | 'muito_alto' | 'incerto';
export type Applicability = 'alta' | 'moderada' | 'baixa' | 'muito_baixa' | 'nao_aplicavel';
export type CurationStatus = 'rascunho' | 'em_revisao' | 'aprovada' | 'disponivel' | 'rejeitada' | 'arquivada';

export interface Citation {
  doi?: string;
  pmid?: string;
  excerpt?: string;
  page?: string;
}

export interface Curation {
  id: string;
  article_id: string;
  version: number;
  status: CurationStatus;
  
  // Governance metadata
  created_by?: string;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  updated_at: string;
  
  // PICO structure
  objective?: string;
  design?: string;
  population?: string;
  sample_size?: string;
  intervention?: string;
  comparator?: string;
  
  // Results
  outcomes_primary?: string;
  outcomes_secondary?: string;
  results_key?: string;
  
  // Critical analysis
  adverse_events?: string;
  limitations?: string;
  authors_conclusion?: string;
  
  // Structured classifications
  evidence_level?: EvidenceLevel;
  bias_risk?: BiasRisk;
  applicability?: Applicability;
  
  // Clinical application
  clinical_takeaways?: string[];
  what_changes_in_practice?: string;
  
  // Structured citations
  citations?: Citation[];
}

export const evidenceLevelLabels: Record<EvidenceLevel, string> = {
  'ia': 'Ia - Revisão sistemática de ECRs',
  'ib': 'Ib - ECR individual',
  'iia': 'IIa - Estudo de coorte',
  'iib': 'IIb - Estudo de caso-controle',
  'iii': 'III - Série de casos',
  'iv': 'IV - Opinião de especialistas',
  'v': 'V - Raciocínio baseado em mecanismos'
};

export const biasRiskLabels: Record<BiasRisk, string> = {
  'baixo': 'Baixo risco de viés',
  'moderado': 'Risco moderado de viés',
  'alto': 'Alto risco de viés',
  'muito_alto': 'Muito alto risco de viés',
  'incerto': 'Risco incerto'
};

export const applicabilityLabels: Record<Applicability, string> = {
  'alta': 'Alta aplicabilidade',
  'moderada': 'Aplicabilidade moderada',
  'baixa': 'Baixa aplicabilidade',
  'muito_baixa': 'Muito baixa aplicabilidade',
  'nao_aplicavel': 'Não aplicável'
};

export const curationStatusConfig: Record<CurationStatus, { 
  label: string; 
  color: string; 
  badgeText: string;
  isAIDraft: boolean;
}> = {
  'rascunho': {
    label: 'Rascunho',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    badgeText: 'Rascunho IA — não revisado',
    isAIDraft: true
  },
  'em_revisao': {
    label: 'Em revisão',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    badgeText: 'Rascunho IA — não revisado',
    isAIDraft: true
  },
  'aprovada': {
    label: 'Aprovada',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeText: 'Aprovada — aguardando publicação',
    isAIDraft: false
  },
  'disponivel': {
    label: 'Disponível',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badgeText: 'Revisado por especialista',
    isAIDraft: false
  },
  'rejeitada': {
    label: 'Rejeitada',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    badgeText: 'Curadoria rejeitada',
    isAIDraft: false
  },
  'arquivada': {
    label: 'Arquivada',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    badgeText: 'Curadoria arquivada',
    isAIDraft: false
  }
};
