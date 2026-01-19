/**
 * Hook for Collective Insights Dashboard
 * 
 * Fetches aggregated, anonymous data for CSE collective intelligence
 * Only includes: is_comparable = true AND clinical_standard_status IN ('eligible', 'eligible_with_penalty')
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardFilters {
  procedure_type: string;
  pathology?: string;
  anatomic_region?: string;
  status?: 'eligible' | 'eligible_with_penalty' | 'both';
  prp_with_ha?: boolean | 'all';
  imaging_guidance?: string;
}

export interface ClusterAggregation {
  cluster_key: string;
  case_count: number;
  sessions_distribution: Record<string, number>;
  interval_distribution: Record<string, number>;
  volume_distribution: Record<string, number>;
  guidance_distribution: Record<string, number>;
  pct_with_ha: number;
  pct_recent_nsaid: number;
  pct_shockwave: number;
  pct_epi: number;
}

export interface OverviewStats {
  total_eligible: number;
  total_with_penalty: number;
  pathology_distribution: Record<string, number>;
  region_distribution: Record<string, number>;
}

const MIN_CLUSTER_SIZE = 5; // k-anonymity threshold

export function useCollectiveInsights(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['collective-insights', filters],
    queryFn: async () => {
      // Build the base query for eligible records
      let query = supabase
        .from('procedure_standard_records')
        .select(`
          id,
          cluster_key,
          protocol_signature,
          pathology,
          anatomic_region,
          severity_classification,
          clinical_standard_status,
          prp_protocol_core (
            sessions_count,
            sessions_interval,
            volume_per_session_range,
            imaging_guidance,
            prp_type,
            prp_activation,
            recent_nsaid_use,
            prp_with_hyaluronic_acid
          ),
          co_interventions_core (
            exercise_therapy,
            shockwave_therapy,
            epi_associated
          )
        `)
        .eq('is_comparable', true)
        .eq('procedure_type', filters.procedure_type);

      // Apply status filter
      if (filters.status === 'eligible') {
        query = query.eq('clinical_standard_status', 'eligible');
      } else if (filters.status === 'eligible_with_penalty') {
        query = query.eq('clinical_standard_status', 'eligible_with_penalty');
      } else {
        // 'both' or undefined - include both eligible statuses
        query = query.in('clinical_standard_status', ['eligible', 'eligible_with_penalty']);
      }

      // Apply additional filters
      if (filters.pathology) {
        query = query.eq('pathology', filters.pathology);
      }
      if (filters.anatomic_region) {
        query = query.eq('anatomic_region', filters.anatomic_region);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data into aggregations
      const records = data || [];
      
      // Apply HA filter after fetch (nested data)
      let filteredRecords = records;
      if (filters.prp_with_ha !== 'all' && filters.prp_with_ha !== undefined) {
        filteredRecords = records.filter(r => {
          const prp = r.prp_protocol_core;
          if (!prp) return false;
          return prp.prp_with_hyaluronic_acid === filters.prp_with_ha;
        });
      }

      // Apply imaging guidance filter
      if (filters.imaging_guidance) {
        filteredRecords = filteredRecords.filter(r => {
          const prp = r.prp_protocol_core;
          if (!prp) return false;
          return prp.imaging_guidance === filters.imaging_guidance;
        });
      }

      // Calculate overview stats
      const overviewStats = calculateOverviewStats(filteredRecords);

      // Calculate cluster aggregations (with k-anonymity)
      const clusterAggregations = calculateClusterAggregations(filteredRecords);

      return {
        overview: overviewStats,
        clusters: clusterAggregations,
        totalRecords: filteredRecords.length,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function calculateOverviewStats(records: any[]): OverviewStats {
  const stats: OverviewStats = {
    total_eligible: 0,
    total_with_penalty: 0,
    pathology_distribution: {},
    region_distribution: {},
  };

  for (const record of records) {
    // Count by status
    if (record.clinical_standard_status === 'eligible') {
      stats.total_eligible++;
    } else if (record.clinical_standard_status === 'eligible_with_penalty') {
      stats.total_with_penalty++;
    }

    // Pathology distribution
    const pathology = record.pathology || 'unknown';
    stats.pathology_distribution[pathology] = (stats.pathology_distribution[pathology] || 0) + 1;

    // Region distribution
    const region = record.anatomic_region || 'unknown';
    stats.region_distribution[region] = (stats.region_distribution[region] || 0) + 1;
  }

  return stats;
}

function calculateClusterAggregations(records: any[]): ClusterAggregation[] {
  // Group by cluster_key
  const clusters: Record<string, any[]> = {};
  
  for (const record of records) {
    const key = record.cluster_key || 'NO_CLUSTER';
    if (!clusters[key]) {
      clusters[key] = [];
    }
    clusters[key].push(record);
  }

  // Calculate aggregations per cluster
  const aggregations: ClusterAggregation[] = [];

  for (const [clusterKey, clusterRecords] of Object.entries(clusters)) {
    const count = clusterRecords.length;
    
    // Apply k-anonymity: skip clusters with less than MIN_CLUSTER_SIZE
    if (count < MIN_CLUSTER_SIZE) continue;

    const sessionsDistribution: Record<string, number> = {};
    const intervalDistribution: Record<string, number> = {};
    const volumeDistribution: Record<string, number> = {};
    const guidanceDistribution: Record<string, number> = {};
    let haCount = 0;
    let nsaidCount = 0;
    let shockwaveCount = 0;
    let epiCount = 0;

    for (const record of clusterRecords) {
      const prp = record.prp_protocol_core;
      const coInt = record.co_interventions_core;

      if (prp) {
        // Sessions count
        const sessions = prp.sessions_count || 'unknown';
        sessionsDistribution[sessions] = (sessionsDistribution[sessions] || 0) + 1;

        // Interval
        const interval = prp.sessions_interval || 'N/A';
        intervalDistribution[interval] = (intervalDistribution[interval] || 0) + 1;

        // Volume
        const volume = prp.volume_per_session_range || 'unknown';
        volumeDistribution[volume] = (volumeDistribution[volume] || 0) + 1;

        // Guidance
        const guidance = prp.imaging_guidance || 'unknown';
        guidanceDistribution[guidance] = (guidanceDistribution[guidance] || 0) + 1;

        // HA
        if (prp.prp_with_hyaluronic_acid) haCount++;

        // NSAID
        if (prp.recent_nsaid_use && prp.recent_nsaid_use !== 'nao') nsaidCount++;
      }

      if (coInt) {
        // Shockwave
        if (coInt.shockwave_therapy && coInt.shockwave_therapy !== 'none') shockwaveCount++;

        // EPI
        if (coInt.epi_associated) epiCount++;
      }
    }

    aggregations.push({
      cluster_key: clusterKey,
      case_count: count,
      sessions_distribution: sessionsDistribution,
      interval_distribution: intervalDistribution,
      volume_distribution: volumeDistribution,
      guidance_distribution: guidanceDistribution,
      pct_with_ha: Math.round((haCount / count) * 100),
      pct_recent_nsaid: Math.round((nsaidCount / count) * 100),
      pct_shockwave: Math.round((shockwaveCount / count) * 100),
      pct_epi: Math.round((epiCount / count) * 100),
    });
  }

  // Sort by case count descending
  return aggregations.sort((a, b) => b.case_count - a.case_count);
}

/**
 * Get the most frequent value from a distribution
 */
export function getMostFrequent(distribution: Record<string, number>): string {
  let maxKey = '';
  let maxCount = 0;
  
  for (const [key, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count;
      maxKey = key;
    }
  }
  
  return maxKey || '-';
}
