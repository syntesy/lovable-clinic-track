/**
 * Hook for consuming Evidence Engine aggregates
 */

import { useState, useEffect, useCallback } from 'react';
import { getEvidenceForIntervention, refreshAggregate } from '@/services/EvidenceService';
import { EvidenceResult } from '@/types/evidence-aggregate';

export function useEvidenceAggregate(
  pathologyKey: string | null | undefined,
  interventionKey: string | null | undefined,
) {
  const [result, setResult] = useState<EvidenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!pathologyKey || !interventionKey) {
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getEvidenceForIntervention(pathologyKey, interventionKey);
      setResult(data);
    } catch (err: any) {
      console.error('[useEvidenceAggregate] Error:', err);
      setError(err.message || 'Erro ao carregar evidência');
    } finally {
      setLoading(false);
    }
  }, [pathologyKey, interventionKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refresh = useCallback(async () => {
    if (!pathologyKey || !interventionKey) return;
    try {
      setLoading(true);
      await refreshAggregate(pathologyKey, interventionKey);
      await fetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pathologyKey, interventionKey, fetch]);

  return { result, loading, error, refresh, refetch: fetch };
}
