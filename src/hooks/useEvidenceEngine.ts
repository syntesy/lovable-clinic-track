import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  EvidenceDimension, 
  EvidenceSnapshot, 
  DimensionWithSnapshot,
  EvidenceDashboardMetrics,
  CurationRegistryLink,
  K_MIN 
} from '@/types/evidence-engine';

/**
 * Hook for Evidence Engine dashboard metrics
 */
export function useEvidenceDashboard() {
  const [metrics, setMetrics] = useState<EvidenceDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dimensions count
      const { count: dimensionsCount, error: dimError } = await supabase
        .from('evidence_dimensions')
        .select('*', { count: 'exact', head: true });

      if (dimError) throw dimError;

      // Fetch latest snapshots for each dimension (all_time)
      // RLS will filter snapshots with n_cases_total < K_MIN
      const { data: snapshots, error: snapError } = await supabase
        .from('evidence_snapshots')
        .select('*')
        .eq('time_window', 'all_time')
        .order('computed_at', { ascending: false });

      if (snapError) throw snapError;

      // Get unique latest snapshot per dimension
      const latestByDimension = new Map<string, EvidenceSnapshot>();
      (snapshots || []).forEach((snap: EvidenceSnapshot) => {
        if (!latestByDimension.has(snap.dimension_id)) {
          latestByDimension.set(snap.dimension_id, snap);
        }
      });

      const latestSnapshots = Array.from(latestByDimension.values());

      // Calculate metrics
      const totalCases = latestSnapshots.reduce((acc, s) => acc + s.n_cases_total, 0);
      const withD90 = latestSnapshots.filter(s => s.n_with_followup_90 > 0).length;
      const lastUpdated = latestSnapshots.length > 0
        ? latestSnapshots.reduce((max, s) => s.computed_at > max ? s.computed_at : max, latestSnapshots[0].computed_at)
        : null;

      setMetrics({
        totalDimensions: dimensionsCount || 0,
        totalCasesAggregated: totalCases,
        lastUpdated,
        dimensionsWithD90: withD90,
      });

    } catch (err) {
      console.error('Error fetching evidence dashboard:', err);
      setError('Erro ao carregar métricas do Evidence Engine');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

/**
 * Hook for listing dimensions with their latest snapshots
 */
export function useEvidenceDimensions() {
  const [dimensions, setDimensions] = useState<DimensionWithSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDimensions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dimensions
      const { data: dims, error: dimError } = await supabase
        .from('evidence_dimensions')
        .select('*')
        .order('pathology_tag', { ascending: true });

      if (dimError) throw dimError;

      // Fetch all latest snapshots (all_time)
      const { data: snapshots, error: snapError } = await supabase
        .from('evidence_snapshots')
        .select('*')
        .eq('time_window', 'all_time')
        .order('version', { ascending: false });

      if (snapError) throw snapError;

      // Map snapshots to dimensions (get latest version per dimension)
      const snapshotMap = new Map<string, EvidenceSnapshot>();
      (snapshots || []).forEach((snap: EvidenceSnapshot) => {
        if (!snapshotMap.has(snap.dimension_id)) {
          snapshotMap.set(snap.dimension_id, snap);
        }
      });

      const dimensionsWithSnapshots: DimensionWithSnapshot[] = (dims || []).map((dim: EvidenceDimension) => ({
        ...dim,
        latestSnapshot: snapshotMap.get(dim.id),
      }));

      setDimensions(dimensionsWithSnapshots);

    } catch (err) {
      console.error('Error fetching evidence dimensions:', err);
      setError('Erro ao carregar dimensões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDimensions();
  }, [fetchDimensions]);

  return { dimensions, loading, error, refetch: fetchDimensions };
}

/**
 * Hook for a single dimension detail with all its snapshots
 */
export function useEvidenceDimensionDetail(dimensionId: string | undefined) {
  const [dimension, setDimension] = useState<EvidenceDimension | null>(null);
  const [snapshots, setSnapshots] = useState<EvidenceSnapshot[]>([]);
  const [links, setLinks] = useState<CurationRegistryLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!dimensionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch dimension
      const { data: dim, error: dimError } = await supabase
        .from('evidence_dimensions')
        .select('*')
        .eq('id', dimensionId)
        .single();

      if (dimError) throw dimError;
      setDimension(dim);

      // Fetch all snapshots for this dimension
      const { data: snaps, error: snapError } = await supabase
        .from('evidence_snapshots')
        .select('*')
        .eq('dimension_id', dimensionId)
        .order('time_window', { ascending: true })
        .order('version', { ascending: false });

      if (snapError) throw snapError;
      setSnapshots((snaps || []) as EvidenceSnapshot[]);

      // Fetch curation links
      const { data: linkData, error: linkError } = await supabase
        .from('curation_registry_links')
        .select('*')
        .eq('dimension_id', dimensionId);

      if (linkError) throw linkError;
      setLinks((linkData || []) as CurationRegistryLink[]);

    } catch (err) {
      console.error('Error fetching dimension detail:', err);
      setError('Erro ao carregar detalhes da dimensão');
    } finally {
      setLoading(false);
    }
  }, [dimensionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { dimension, snapshots, links, loading, error, refetch: fetchDetail };
}

/**
 * Hook for curation's linked evidence dimensions
 */
export function useCurationEvidence(curationId: string | undefined) {
  const [links, setLinks] = useState<(CurationRegistryLink & { dimension?: EvidenceDimension; snapshot?: EvidenceSnapshot })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!curationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch links for this curation
      const { data: linkData, error: linkError } = await supabase
        .from('curation_registry_links')
        .select('*')
        .eq('curation_id', curationId);

      if (linkError) throw linkError;

      if (!linkData || linkData.length === 0) {
        setLinks([]);
        return;
      }

      // Fetch dimensions for these links
      const dimensionIds = linkData.map(l => l.dimension_id);
      const { data: dims, error: dimError } = await supabase
        .from('evidence_dimensions')
        .select('*')
        .in('id', dimensionIds);

      if (dimError) throw dimError;

      // Fetch latest snapshots (all_time) for these dimensions
      const { data: snaps, error: snapError } = await supabase
        .from('evidence_snapshots')
        .select('*')
        .in('dimension_id', dimensionIds)
        .eq('time_window', 'all_time')
        .order('version', { ascending: false });

      if (snapError) throw snapError;

      // Map dimensions and snapshots
      const dimMap = new Map<string, EvidenceDimension>();
      (dims || []).forEach((d: EvidenceDimension) => dimMap.set(d.id, d));

      const snapMap = new Map<string, EvidenceSnapshot>();
      (snaps || []).forEach((s: EvidenceSnapshot) => {
        if (!snapMap.has(s.dimension_id)) {
          snapMap.set(s.dimension_id, s);
        }
      });

      const enrichedLinks = (linkData as CurationRegistryLink[]).map(link => ({
        ...link,
        dimension: dimMap.get(link.dimension_id),
        snapshot: snapMap.get(link.dimension_id),
      }));

      setLinks(enrichedLinks as (CurationRegistryLink & { dimension?: EvidenceDimension; snapshot?: EvidenceSnapshot })[]);

    } catch (err) {
      console.error('Error fetching curation evidence:', err);
      setError('Erro ao carregar evidências vinculadas');
    } finally {
      setLoading(false);
    }
  }, [curationId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return { links, loading, error, refetch: fetchLinks };
}

/**
 * Hook for admin to trigger evidence computation
 */
export function useComputeEvidence() {
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ dimensionsProcessed: number; snapshotsCreated: number } | null>(null);

  const compute = useCallback(async () => {
    try {
      setComputing(true);
      setError(null);
      setResult(null);

      const { data, error: fnError } = await supabase.functions.invoke('compute-evidence', {
        method: 'POST',
      });

      if (fnError) throw fnError;

      setResult(data);
      return data;

    } catch (err: any) {
      console.error('Error computing evidence:', err);
      setError(err.message || 'Erro ao computar evidência');
      return null;
    } finally {
      setComputing(false);
    }
  }, []);

  return { compute, computing, error, result };
}
