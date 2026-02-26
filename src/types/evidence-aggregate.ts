/**
 * EVIDENCE ENGINE - Aggregate Types
 * Types for academy_evidence_mappings + academy_evidence_aggregates
 */

export type RecommendationStrength = 'strong' | 'moderate' | 'weak' | 'insufficient';
export type ConfidenceLevel = 'high' | 'moderate' | 'low';
export type DirectionSummary = 'favorable' | 'neutral' | 'harmful' | 'mixed' | 'unknown';

export interface EvidenceMapping {
  id: string;
  pathology_key: string;
  intervention_key: string;
  synonyms: string[];
  tags_required: string[];
  created_at: string;
}

export interface EvidenceAggregate {
  id: string;
  pathology_key: string;
  intervention_key: string;
  papers_count: number;
  best_level_evidence: string | null;
  average_method_score: number | null;
  average_evidence_score: number | null;
  consistency_score: number;
  recommendation_strength: RecommendationStrength;
  confidence_level: ConfidenceLevel;
  direction_summary: DirectionSummary;
  top_paper_ids: string[];
  reasons: string[];
  updated_at: string;
}

export interface EvidencePaperLite {
  paper_id: string;
  title: string;
  authors: string | null;
  year: number | null;
  nivel_evidencia: string | null;
  risco_vies: string | null;
  score_metodologico: number | null;
  evidence_score: number | null;
  direction: DirectionSummary;
  curation_status: string;
  abstract_text: string | null;
  curation_data: Record<string, unknown> | null;
}

export interface EvidenceResult {
  aggregate: EvidenceAggregate | null;
  papers: EvidencePaperLite[];
  isStale: boolean;
  fromCache: boolean;
}

// Labels PT-BR
export const STRENGTH_LABELS: Record<RecommendationStrength, string> = {
  strong: 'Forte',
  moderate: 'Moderada',
  weak: 'Fraca',
  insufficient: 'Insuficiente',
};

export const STRENGTH_COLORS: Record<RecommendationStrength, string> = {
  strong: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  moderate: 'bg-blue-100 text-blue-700 border-blue-300',
  weak: 'bg-amber-100 text-amber-700 border-amber-300',
  insufficient: 'bg-muted text-muted-foreground border-border',
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-blue-100 text-blue-700',
  low: 'bg-muted text-muted-foreground',
};

export const CONFIDENCE_LABELS_PTBR: Record<ConfidenceLevel, string> = {
  high: 'Alta',
  moderate: 'Moderada',
  low: 'Baixa',
};

export const DIRECTION_LABELS: Record<DirectionSummary, string> = {
  favorable: 'Favorável',
  neutral: 'Neutro',
  harmful: 'Desfavorável',
  mixed: 'Misto',
  unknown: 'Desconhecido',
};

export const DIRECTION_COLORS: Record<DirectionSummary, string> = {
  favorable: 'text-emerald-600',
  neutral: 'text-muted-foreground',
  harmful: 'text-red-600',
  mixed: 'text-amber-600',
  unknown: 'text-muted-foreground',
};
