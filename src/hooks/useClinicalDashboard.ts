/**
 * useClinicalDashboard
 *
 * Busca todas as métricas do Dashboard Clínico – Ortobiológicos.
 *
 * Cards 1–3 e 5–8 vêm de uma única chamada RPC (alta performance).
 * Card 4 (breakdown por técnica) vem de query separada.
 * Card 6 (comparação nacional) usa média agregada de todos os profissionais.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Período ────────────────────────────────────────────────────────────────

export type DashboardPeriod = "7d" | "30d" | "90d" | "12m" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export function periodToDateRange(period: DashboardPeriod, custom?: DateRange): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (period === "custom" && custom) return custom;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case "7d":  start.setDate(start.getDate() - 6);   break;
    case "30d": start.setDate(start.getDate() - 29);  break;
    case "90d": start.setDate(start.getDate() - 89);  break;
    case "12m": start.setFullYear(start.getFullYear() - 1); break;
  }

  return { start, end };
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Tipos de retorno ────────────────────────────────────────────────────────

export interface Card1Data {
  uniquePatients: number;
  consultations: number;
  procedures: number;
}

export interface Card2Data {
  activeTreatment: number;
}

export interface Card3Data {
  followup3m: number;
  followup6m: number;
  followup12m: number;
  overdue: number;
  total: number;
}

export interface Card4Data {
  total: number;
  byType: { type: string; count: number }[];
}

export interface Card5Data {
  improvementRate: number | null;  // % pacientes com melhora ≥ 50%
  totalWithFollowup: number;
  responders: number;
}

export interface Card6Data {
  professionalRate: number | null;
  nationalRate: number | null;
  hasEnoughData: boolean;
  minCasesRequired: number;
}

export interface Card7Data {
  nonResponseRate: number | null;  // % pacientes com melhora < 30%
  totalWithFollowup: number;
  nonResponders: number;
}

export interface Card8Data {
  pendingRate: number | null;
  pendingDue: number;
  pendingTotal: number;
}

export interface ClinicalDashboardData {
  card1: Card1Data;
  card2: Card2Data;
  card3: Card3Data;
  card4: Card4Data;
  card5: Card5Data;
  card6: Card6Data;
  card7: Card7Data;
  card8: Card8Data;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const MIN_CASES_NATIONAL = 10; // mínimo para comparação nacional
const PROCEDURE_TYPE_LABELS: Record<string, string> = {
  PRP:   "PRP",
  "L-PRP": "L-PRP",
  PRF:   "PRF",
  "i-PRF": "i-PRF",
  PPP:   "PPP",
  BMAC:  "BMAC",
  "PRP+HA": "PRP + HA",
};

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useClinicalDashboard(dateRange: DateRange) {
  return useQuery({
    queryKey: ["clinical-dashboard", toISODate(dateRange.start), toISODate(dateRange.end)],
    queryFn: async (): Promise<ClinicalDashboardData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Executa em paralelo: RPC principal + Card 4 + Card 6 nacional
      const [rpcResult, card4Result, nationalResult] = await Promise.all([
        // RPC principal (cards 1, 2, 3, 5, 7, 8)
        supabase.rpc("get_clinical_dashboard_metrics", {
          p_user_id: user.id,
          p_start:   toISODate(dateRange.start),
          p_end:     toISODate(dateRange.end),
        }),

        // Card 4: breakdown de procedimentos por técnica
        fetchProcedureBreakdown(user.id, dateRange),

        // Card 6: taxa de melhora nacional (todos os profissionais)
        fetchNationalImprovementRate(),
      ]);

      if (rpcResult.error) throw rpcResult.error;

      const rpc = rpcResult.data as Record<string, any>;

      const c1 = rpc.card1;
      const c2 = rpc.card2;
      const c3 = rpc.card3;
      const c5 = rpc.card5;
      const c7 = rpc.card7;
      const c8 = rpc.card8;

      const professionalRate: number | null = c5.improvement_rate ?? null;
      const nationalRate = nationalResult;

      return {
        card1: {
          uniquePatients: c1.unique_patients ?? 0,
          consultations:  c1.consultations   ?? 0,
          procedures:     c1.procedures      ?? 0,
        },
        card2: {
          activeTreatment: c2.active_treatment ?? 0,
        },
        card3: {
          followup3m:  c3.followup_3m  ?? 0,
          followup6m:  c3.followup_6m  ?? 0,
          followup12m: c3.followup_12m ?? 0,
          overdue:     c3.overdue      ?? 0,
          total: (c3.followup_3m ?? 0) + (c3.followup_6m ?? 0) + (c3.followup_12m ?? 0),
        },
        card4: card4Result,
        card5: {
          improvementRate:  professionalRate,
          totalWithFollowup: c5.total_with_followup ?? 0,
          responders:        c5.responders_50       ?? 0,
        },
        card6: {
          professionalRate,
          nationalRate,
          hasEnoughData: (c5.total_with_followup ?? 0) >= MIN_CASES_NATIONAL,
          minCasesRequired: MIN_CASES_NATIONAL,
        },
        card7: {
          nonResponseRate:   c7.non_response_rate    ?? null,
          totalWithFollowup: c7.total_with_followup  ?? 0,
          nonResponders:     c7.non_responders_30    ?? 0,
        },
        card8: {
          pendingRate:  c8.pending_rate  ?? null,
          pendingDue:   c8.pending_due   ?? 0,
          pendingTotal: c8.pending_total ?? 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ─── Card 4: breakdown por técnica ──────────────────────────────────────────

async function fetchProcedureBreakdown(
  userId: string,
  range: DateRange,
): Promise<Card4Data> {
  // Busca IDs dos atendimentos do profissional
  const { data: attendances } = await supabase
    .from("attendance_sessions")
    .select("id")
    .eq("user_id", userId);

  if (!attendances?.length) return { total: 0, byType: [] };

  const ids = attendances.map((a) => a.id);

  const { data: records } = await supabase
    .from("procedure_standard_records")
    .select("procedure_type")
    .in("attendance_id", ids)
    .gte("created_at", dateRange(range.start))
    .lte("created_at", dateRange(range.end, true));

  if (!records?.length) return { total: 0, byType: [] };

  const counts: Record<string, number> = {};
  for (const r of records) {
    const key = r.procedure_type ?? "Outro";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const byType = Object.entries(counts)
    .map(([type, count]) => ({
      type: PROCEDURE_TYPE_LABELS[type] ?? type,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return { total: records.length, byType };
}

function dateRange(d: Date, endOfDay = false): string {
  const copy = new Date(d);
  if (endOfDay) copy.setHours(23, 59, 59, 999);
  else copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

// ─── Card 6: taxa de melhora nacional ───────────────────────────────────────

async function fetchNationalImprovementRate(): Promise<number | null> {
  // Busca todos os pares baseline + followup de TODOS os profissionais
  const { data: baselines } = await supabase
    .from("patient_reported_outcomes")
    .select("procedure_standard_record_id, pain_score")
    .eq("timepoint", "baseline")
    .not("pain_score", "is", null)
    .gt("pain_score", 0);

  if (!baselines?.length) return null;

  const bMap = new Map(baselines.map((b) => [b.procedure_standard_record_id, b.pain_score]));
  const ids = baselines.map((b) => b.procedure_standard_record_id);

  const { data: followups } = await supabase
    .from("patient_reported_outcomes")
    .select("procedure_standard_record_id, pain_score")
    .in("procedure_standard_record_id", ids)
    .in("timepoint", ["m3", "m6", "m12"])
    .not("pain_score", "is", null);

  if (!followups?.length) return null;

  let total = 0;
  let responders = 0;
  const seen = new Set<string>();

  for (const f of followups) {
    const id = f.procedure_standard_record_id;
    if (seen.has(id)) continue; // usa apenas o primeiro follow-up encontrado
    seen.add(id);

    const baseline = bMap.get(id);
    if (baseline == null) continue;

    total++;
    const pct = ((baseline - f.pain_score) / baseline) * 100;
    if (pct >= 50) responders++;
  }

  if (total < MIN_CASES_NATIONAL) return null;
  return Math.round((responders / total) * 100);
}

// ─── Hook auxiliar: lista de pacientes com follow-up pendente ────────────────

export interface PendingFollowupPatient {
  patientId: string;
  patientName: string;
  timepoint: string;
  scheduledFor: string;
  daysOverdue: number;
}

export function usePendingFollowupPatients() {
  return useQuery({
    queryKey: ["pending-followup-patients"],
    queryFn: async (): Promise<PendingFollowupPatient[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("procedure_followups")
        .select("patient_id, timepoint, scheduled_for")
        .eq("clinician_id", user.id)
        .eq("status", "pending")
        .lt("scheduled_for", new Date().toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(100);

      if (error) throw error;

      const today = new Date();

      return (data ?? []).map((row) => {
        const sched = new Date(row.scheduled_for);
        const daysOverdue = Math.floor(
          (today.getTime() - sched.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          patientId:    row.patient_id,
          patientName:  "—", // sem join para manter performance; UI busca por conta
          timepoint:    row.timepoint,
          scheduledFor: row.scheduled_for,
          daysOverdue,
        };
      });
    },
    staleTime: 2 * 60 * 1000,
  });
}
