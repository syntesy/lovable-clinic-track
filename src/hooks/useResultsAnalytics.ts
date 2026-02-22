/**
 * useResultsAnalytics — Hook para consumo da RPC get_results_analytics
 *
 * Resolve clinic_id do usuário logado, aplica debounce nos filtros
 * e retorna dados tipados para o módulo Análise de Resultados.
 *
 * Multi-tenant: clinic_id NUNCA vem do UI; é resolvido internamente.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────

export interface ResultsCase {
  psr_id: string;
  patient_id: string;
  patient_display: string;
  procedure_type: string | null;
  pathology: string | null;
  protocol_title: string | null;
  baseline_value: number | null;
  latest_value: number | null;
  delta_value: number | null;
  delta_pct: number | null;
  classification: "RESPONDER" | "NON_RESPONDER" | "WORSENING" | "NO_DATA";
  last_followup_at: string | null;
}

export interface ResultsKpis {
  total_cases: number;
  followup_coverage_pct: number;
  response_rate_pct: number;
  nonresponder_rate_pct: number;
  worsening_rate_pct: number;
  avg_time_to_followup_days: number;
  completion_pct: number;
  checklist_completed_pct: number;
  method_complete_pct: number;
  traceability_complete_pct: number;
  scientific_validated_count: number;
  scientific_draft_count: number;
  no_data?: boolean;
}

export interface ResultsCharts {
  response_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  outcomes_over_time: Array<{ month: string; responder_pct: number }>;
  top_protocols_internal: Array<{ protocol: string; count: number }>;
}

export interface ResultsAnalyticsResponse {
  kpis: ResultsKpis;
  charts: ResultsCharts;
  cases: {
    items: ResultsCase[];
    page: number;
    page_size: number;
    total: number;
  };
}

export interface ResultsAnalyticsParams {
  start: string;
  end: string;
  procedureType?: string | null;
  pathology?: string | null;
  anatomicRegion?: string | null;
  protocolId?: string | null;
  protocolType?: string | null;
  responsibleProfessionalId?: string | null;
  onlyCompleted?: boolean;
  onlyScientific?: boolean;
  scientificStatus?: string | null;
  page?: number;
  pageSize?: number;
  sort?: "latest" | "delta" | "baseline";
}

interface UseResultsAnalyticsOptions {
  debounceMs?: number;
  enabled?: boolean;
}

interface UseResultsAnalyticsReturn {
  data: ResultsAnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ─── Clinic resolver (cached per session) ─────────────────────────

let cachedClinicId: string | null = null;

async function resolveClinicId(): Promise<string | null> {
  if (cachedClinicId) return cachedClinicId;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("clinics")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    cachedClinicId = data.id;
  }
  return cachedClinicId;
}

// Reset cache on sign-out
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") cachedClinicId = null;
});

// ─── Hook ─────────────────────────────────────────────────────────

export function useResultsAnalytics(
  params: ResultsAnalyticsParams,
  options?: UseResultsAnalyticsOptions
): UseResultsAnalyticsReturn {
  const { debounceMs = 400, enabled = true } = options ?? {};

  const [data, setData] = useState<ResultsAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef(0); // simple generation counter for stale prevention

  const fetchData = useCallback(async () => {
    if (!params.start || !params.end) {
      setError("Período obrigatório (start/end).");
      setData(null);
      return;
    }

    const generation = ++abortRef.current;
    setLoading(true);
    setError(null);

    try {
      const clinicId = await resolveClinicId();
      if (!clinicId) {
        throw new Error("Clínica não encontrada para o usuário logado.");
      }

      if (generation !== abortRef.current) return; // stale

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "get_results_analytics",
        {
          p_clinic_id: clinicId,
          p_start: params.start,
          p_end: params.end,
          p_procedure_type: params.procedureType ?? null,
          p_pathology: params.pathology ?? null,
          p_anatomic_region: params.anatomicRegion ?? null,
          p_protocol_id: params.protocolId ?? null,
          p_protocol_type: params.protocolType ?? null,
          p_responsible_professional_id: params.responsibleProfessionalId ?? null,
          p_only_completed: params.onlyCompleted ?? true,
          p_only_scientific: params.onlyScientific ?? false,
          p_scientific_status: params.scientificStatus ?? null,
          p_page: params.page ?? 1,
          p_page_size: params.pageSize ?? 25,
          p_sort: params.sort ?? "latest",
        }
      );

      if (generation !== abortRef.current) return; // stale

      if (rpcError) throw new Error(rpcError.message);

      const parsed =
        typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;

      setData(parsed as ResultsAnalyticsResponse);
      setError(null);

      if (import.meta.env.DEV) {
        console.log("[useResultsAnalytics] OK", {
          total: (parsed as any)?.kpis?.total_cases,
        });
      }
    } catch (err: any) {
      if (generation !== abortRef.current) return;
      const msg = err?.message || "Erro desconhecido ao buscar análise.";
      setError(msg);
      setData(null);
      if (import.meta.env.DEV) {
        console.error("[useResultsAnalytics] Error:", msg);
      }
    } finally {
      if (generation === abortRef.current) setLoading(false);
    }
  }, [
    params.start,
    params.end,
    params.procedureType,
    params.pathology,
    params.anatomicRegion,
    params.protocolId,
    params.protocolType,
    params.responsibleProfessionalId,
    params.onlyCompleted,
    params.onlyScientific,
    params.scientificStatus,
    params.page,
    params.pageSize,
    params.sort,
  ]);

  // Debounced effect
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(fetchData, debounceMs);
    return () => clearTimeout(timer);
  }, [fetchData, enabled, debounceMs]);

  return { data, loading, error, refetch: fetchData };
}

// ─── NOTA TÉCNICA: Clusters & Analytics ───────────────────────
//
// Para cálculos agregados e clusters válidos, a RPC get_results_analytics
// deve filtrar apenas:
//   - diagnosis_stage = 'CONFIRMED'
//   - eva_pain IS NOT NULL AND ifn_function IS NOT NULL
//
// Índices parciais criados no banco:
//   idx_attendance_pathology_confirmed (attendance_id) WHERE diagnosis_stage = 'CONFIRMED'
//   idx_attendance_pathology_confirmed_full (pathology_id, structural_grade) WHERE diagnosis_stage = 'CONFIRMED'
//
// View materializada: considerar quando volume > ~50k confirmados.
