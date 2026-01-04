// =========================================================
// REGENAPP CAREER ENGINE™ - Types & Constants
// Camada downstream, não clínica, exclusivamente operacional
// =========================================================

/**
 * Metric types for career tracking
 */
export type CareerMetricType = 
  | 'scientific_adherence'      // Percentil de adesão científica
  | 'registry_completeness'     // Percentil de completude de registro
  | 'followup_rate'             // Taxa de follow-up longitudinal
  | 'consistency_index'         // Índice de coerência profissional
  | 'complexity_index'          // Índice de complexidade média dos casos
  | 'technical_growth'          // Tendência de crescimento técnico
  | 'practice_maturity';        // Índice de maturidade de prática

/**
 * Trend directions
 */
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

/**
 * Certification levels
 */
export type CertificationLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Certification types
 */
export type CertificationType = 
  | 'longitudinal_practice'
  | 'scientific_excellence'
  | 'registry_champion'
  | 'followup_master'
  | 'complexity_expert';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'attention';

/**
 * Opportunity types
 */
export type OpportunityType = 'research' | 'course' | 'collaboration' | 'publication';

/**
 * Narrative types
 */
export type NarrativeType = 'monthly_summary' | 'milestone' | 'achievement';

// =========================================================
// Interfaces
// =========================================================

export interface CareerMetric {
  id: string;
  user_id: string;
  period: string;
  metric_type: CareerMetricType;
  value: number;
  percentile: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CareerTrend {
  id: string;
  user_id: string;
  period: string;
  metric_type: CareerMetricType;
  trend_direction: TrendDirection;
  trend_value: number;
  baseline_period: string | null;
  created_at: string;
}

export interface CareerCertification {
  id: string;
  user_id: string;
  certification_type: CertificationType;
  certification_level: CertificationLevel;
  earned_at: string;
  valid_until: string | null;
  criteria_met: Record<string, unknown>;
  created_at: string;
}

export interface CareerAlert {
  id: string;
  user_id: string;
  period: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface CareerOpportunity {
  id: string;
  user_id: string;
  period: string;
  opportunity_type: OpportunityType;
  title: string;
  description: string | null;
  relevance_score: number;
  is_viewed: boolean;
  is_interested: boolean | null;
  created_at: string;
}

export interface CareerCaseComplexity {
  id: string;
  user_id: string;
  period: string;
  metric_type: string;
  total_cases: number;
  unique_diagnoses: number;
  red_flags_count: number;
  complexity_score: number;
  value: number;
  created_at: string;
}

export interface CareerConsistencyIndex {
  id: string;
  user_id: string;
  period: string;
  metric_type: string;
  protocol_variance: number;
  technique_diversity: number;
  consistency_score: number;
  value: number;
  created_at: string;
}

export interface CareerNarrative {
  id: string;
  user_id: string;
  period: string;
  metric_type: string;
  narrative_type: NarrativeType;
  title: string;
  content: string | null;
  value: number;
  created_at: string;
}

// =========================================================
// Dashboard aggregated types
// =========================================================

export interface CareerDashboardMetrics {
  totalPatients: number;
  totalScreenings: number;
  totalFollowups: number;
  followupRate: number;
  registryCompletenessRate: number;
  scientificAdherenceRate: number;
  avgComplexity: number;
  consistencyScore: number;
  practiceMaturityScore: number;
}

export interface CareerRadarData {
  metric: string;
  value: number;
  percentile: number;
  fullMark: number;
}

export interface CareerTimelinePoint {
  period: string;
  maturity: number;
  volume: number;
  diversity: number;
}

// =========================================================
// Labels (PT-BR)
// =========================================================

export const METRIC_TYPE_LABELS: Record<CareerMetricType, string> = {
  scientific_adherence: 'Adesão Científica',
  registry_completeness: 'Completude de Registro',
  followup_rate: 'Taxa de Follow-up',
  consistency_index: 'Coerência Profissional',
  complexity_index: 'Complexidade de Casos',
  technical_growth: 'Crescimento Técnico',
  practice_maturity: 'Maturidade de Prática',
};

export const CERTIFICATION_TYPE_LABELS: Record<CertificationType, string> = {
  longitudinal_practice: 'Prática Longitudinal',
  scientific_excellence: 'Excelência Científica',
  registry_champion: 'Campeão de Registro',
  followup_master: 'Mestre em Follow-up',
  complexity_expert: 'Especialista em Complexidade',
};

export const CERTIFICATION_LEVEL_LABELS: Record<CertificationLevel, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
};

export const CERTIFICATION_LEVEL_COLORS: Record<CertificationLevel, string> = {
  bronze: 'bg-amber-700/20 text-amber-600 border-amber-700/30',
  silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  gold: 'bg-gold/20 text-gold border-gold/30',
  platinum: 'bg-teal/20 text-teal border-teal/30',
};

export const TREND_DIRECTION_LABELS: Record<TrendDirection, string> = {
  increasing: 'Em crescimento',
  decreasing: 'Em queda',
  stable: 'Estável',
};

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  attention: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  research: 'Pesquisa',
  course: 'Curso',
  collaboration: 'Colaboração',
  publication: 'Publicação',
};

// =========================================================
// Helper functions
// =========================================================

/**
 * Get current period in YYYY-MM format
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get previous period in YYYY-MM format
 */
export function getPreviousPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

/**
 * Format period for display (PT-BR)
 */
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

/**
 * Calculate percentile rank (for anonymous benchmarking)
 */
export function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  if (index === -1) return 100;
  return Math.round((index / sorted.length) * 100);
}
