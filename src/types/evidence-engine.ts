// =========================================================
// REGENAPP EVIDENCE ENGINE™ - Types & Constants
// Camada de agregação descritiva sobre o Clinical Registry™
// =========================================================

/**
 * K-ANONYMITY THRESHOLD
 * Minimum sample size to display aggregated metrics.
 * Snapshots with n_cases_total < K_MIN are hidden from non-admin users.
 */
export const K_MIN = 10;

/**
 * Represents an aggregation dimension (Pathology × Technique)
 */
export interface EvidenceDimension {
  id: string;
  pathology_tag: string;
  technique_tag: string;
  region_tag: string | null;
  created_at: string;
}

/**
 * Time window for snapshot aggregation
 */
export type TimeWindow = 'all_time' | 'last_12_months';

/**
 * Versioned snapshot of aggregated metrics (append-only)
 */
export interface EvidenceSnapshot {
  id: string;
  dimension_id: string;
  time_window: TimeWindow;
  
  // Required counts
  n_cases_total: number;
  n_with_followup_30: number;
  n_with_followup_90: number;
  n_with_followup_180: number;
  n_with_followup_365: number;
  
  // Optional metrics (null if not calculable)
  pain_baseline_mean: number | null;
  pain_baseline_median: number | null;
  pain_followup_90_mean: number | null;
  pain_followup_90_median: number | null;
  pct_improved_90: number | null;
  
  // Governance
  computed_at: string;
  version: number;
  canonical_hash: string;
  
  created_at: string;
}

/**
 * Link type for curation-dimension relationships
 */
export type CurationLinkType = 'supports' | 'contextual' | 'exploratory';

/**
 * Link between scientific curation and evidence dimension
 */
export interface CurationRegistryLink {
  id: string;
  curation_id: string;
  dimension_id: string;
  link_type: CurationLinkType;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

/**
 * Evidence audit event types
 */
export type EvidenceAuditEventType = 
  | 'snapshot_computed'
  | 'dimension_created'
  | 'link_created'
  | 'link_updated'
  | 'link_deleted'
  | 'batch_started'
  | 'batch_completed';

/**
 * Evidence audit log entry
 */
export interface EvidenceAuditLog {
  id: string;
  event_type: EvidenceAuditEventType;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Dashboard metrics summary
 */
export interface EvidenceDashboardMetrics {
  totalDimensions: number;
  totalCasesAggregated: number;
  lastUpdated: string | null;
  dimensionsWithD90: number;
}

/**
 * Dimension with latest snapshot (for UI)
 */
export interface DimensionWithSnapshot extends EvidenceDimension {
  latestSnapshot?: EvidenceSnapshot;
}

/**
 * Labels for link types (PT-BR)
 */
export const LINK_TYPE_LABELS: Record<CurationLinkType, string> = {
  supports: 'Suporta',
  contextual: 'Contextual',
  exploratory: 'Exploratório',
};

/**
 * Colors for link types
 */
export const LINK_TYPE_COLORS: Record<CurationLinkType, string> = {
  supports: 'bg-green-500/20 text-green-400 border-green-500/30',
  contextual: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  exploratory: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

/**
 * Time window labels (PT-BR)
 */
export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  all_time: 'Todo período',
  last_12_months: 'Últimos 12 meses',
};

/**
 * Normalize tag for storage (UPPER + TRIM)
 */
export function normalizeTag(tag: string): string {
  return (tag || '').trim().toUpperCase();
}

/**
 * Check if snapshot passes k-anonymity threshold
 */
export function passesKAnonymity(snapshot: EvidenceSnapshot): boolean {
  return snapshot.n_cases_total >= K_MIN;
}

/**
 * Format insufficient data message
 */
export function getInsufficientDataMessage(): string {
  return `Dados insuficientes para agregação (N < ${K_MIN}).`;
}
