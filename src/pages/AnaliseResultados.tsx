/**
 * ResultsAnalyticsDashboard — Etapa 7: KPI cards + filtros completos.
 */

import { useMemo, useState } from "react";
import { useResultsAnalytics, type ResultsKpis } from "@/hooks/useResultsAnalytics";
import { useClinicProfessionals } from "@/hooks/useClinicProfessionals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, AlertTriangle, Users, TrendingUp, CalendarCheck,
  Clock, ClipboardCheck, Link2,
} from "lucide-react";
import {
  PATHOLOGY_OPTIONS, ANATOMIC_REGION_OPTIONS,
} from "@/types/clinical-standard";

// ─── Period helpers ───────────────────────────────────────────────
function monthsAgo(m: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d.toISOString();
}
const nowISO = new Date().toISOString();

type PeriodPreset = "3m" | "6m" | "12m" | "custom";

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
  { value: "custom", label: "Personalizado" },
];

const PROCEDURE_TYPES = [
  { value: "PRP", label: "PRP" },
  { value: "PROLOTERAPIA", label: "Proloterapia" },
  { value: "ACIDO_HIALURONICO", label: "Ácido Hialurônico" },
  { value: "OZONIOTERAPIA", label: "Ozonioterapia" },
];

// ─── KPI card definition ─────────────────────────────────────────
interface KpiDef {
  key: keyof ResultsKpis;
  label: string;
  unit?: string;
  icon: React.ElementType;
  format: (v: number | undefined | null) => string;
}

const fmt0 = (v: number | undefined | null) => v == null ? "—" : Math.round(v).toString();
const fmtPct = (v: number | undefined | null) => v == null ? "—" : `${Math.round(v)}`;

const KPI_DEFS: KpiDef[] = [
  { key: "total_cases", label: "Total de casos", icon: Users, format: fmt0 },
  { key: "response_rate_pct", label: "Respondedor", unit: "%", icon: TrendingUp, format: fmtPct },
  { key: "followup_coverage_pct", label: "Follow-up", unit: "%", icon: CalendarCheck, format: fmtPct },
  { key: "avg_time_to_followup_days", label: "Tempo médio follow-up", unit: "dias", icon: Clock, format: fmt0 },
  { key: "checklist_completed_pct", label: "Checklist completo", unit: "%", icon: ClipboardCheck, format: fmtPct },
  { key: "traceability_complete_pct", label: "Rastreabilidade", unit: "%", icon: Link2, format: fmtPct },
];

// ─── Component ────────────────────────────────────────────────────
export default function ResultsAnalyticsDashboard() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("12m");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [procedureType, setProcedureType] = useState<string | null>(null);
  const [pathology, setPathology] = useState<string | null>(null);
  const [anatomicRegion, setAnatomicRegion] = useState<string | null>(null);
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [protocolType, setProtocolType] = useState<string | null>(null);
  const [responsibleProfessionalId, setResponsibleProfessionalId] = useState<string | null>(null);
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [onlyScientific, setOnlyScientific] = useState(false);
  const [onlyValidated, setOnlyValidated] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [sort] = useState<"latest" | "delta" | "baseline">("latest");

  const { data: professionals } = useClinicProfessionals();

  const { start, end } = useMemo(() => {
    if (periodPreset === "custom") {
      return {
        start: customStart ? new Date(customStart).toISOString() : "",
        end: customEnd ? new Date(customEnd).toISOString() : "",
      };
    }
    const months = periodPreset === "3m" ? 3 : periodPreset === "6m" ? 6 : 12;
    return { start: monthsAgo(months), end: nowISO };
  }, [periodPreset, customStart, customEnd]);

  const resetPage = () => setPage(1);

  const hookParams = useMemo(
    () => ({
      start, end, procedureType, pathology, anatomicRegion,
      protocolId: protocolId || null, protocolType,
      responsibleProfessionalId, onlyCompleted, onlyScientific,
      scientificStatus: onlyValidated ? "validated" : null,
      page, pageSize, sort,
    }),
    [start, end, procedureType, pathology, anatomicRegion,
      protocolId, protocolType, responsibleProfessionalId,
      onlyCompleted, onlyScientific, onlyValidated, page, pageSize, sort]
  );

  const { data, loading, error } = useResultsAnalytics(hookParams, {
    enabled: !!start && !!end,
  });

  const noData = data && ((data.kpis as any)?.no_data === true || data.kpis.total_cases === 0);

  const debugParams = useMemo(() => ({ ...hookParams }), [hookParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Análise de Resultados
        </h1>
        <p className="text-muted-foreground mt-1">
          Painel consolidado dos desfechos clínicos da sua prática, com filtros
          por procedimento, patologia e período.
        </p>
      </div>

      {/* ── Filters Card ── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={periodPreset} onValueChange={(v) => { setPeriodPreset(v as PeriodPreset); resetPage(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIOD_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {periodPreset === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label>Início</Label>
                  <Input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); resetPage(); }} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fim</Label>
                  <Input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); resetPage(); }} />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Procedimento</Label>
              <Select value={procedureType ?? "__all__"} onValueChange={(v) => { setProcedureType(v === "__all__" ? null : v); resetPage(); }}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {PROCEDURE_TYPES.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Patologia</Label>
              <Select value={pathology ?? "__all__"} onValueChange={(v) => { setPathology(v === "__all__" ? null : v); resetPage(); }}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {PATHOLOGY_OPTIONS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Região anatômica</Label>
              <Select value={anatomicRegion ?? "__all__"} onValueChange={(v) => { setAnatomicRegion(v === "__all__" ? null : v); resetPage(); }}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {ANATOMIC_REGION_OPTIONS.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Profissional responsável</Label>
              <Select value={responsibleProfessionalId ?? "__all__"} onValueChange={(v) => { setResponsibleProfessionalId(v === "__all__" ? null : v); resetPage(); }}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {professionals?.map((p) => (<SelectItem key={p.user_id} value={p.user_id}>{p.email || p.user_id.slice(0, 8)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>ID do Protocolo</Label>
              <Input placeholder="UUID do protocolo (opcional)" value={protocolId ?? ""} onChange={(e) => { setProtocolId(e.target.value || null); resetPage(); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de protocolo</Label>
              <Input placeholder="Ex: REGEN_BASE, CUSTOM..." value={protocolType ?? ""} onChange={(e) => { setProtocolType(e.target.value || null); resetPage(); }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={onlyCompleted} onCheckedChange={(v) => { setOnlyCompleted(v); resetPage(); }} />
              <Label className="cursor-pointer">Somente finalizados</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={onlyScientific} onCheckedChange={(v) => { setOnlyScientific(v); resetPage(); }} />
              <Label className="cursor-pointer">Somente científicos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={onlyValidated} onCheckedChange={(v) => { setOnlyValidated(v); resetPage(); }} />
              <Label className="cursor-pointer">Somente validados</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── No-data banner ── */}
      {noData && (
        <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/40 p-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Sem dados suficientes para o período e filtros selecionados.
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="text-destructive font-medium">Erro: {error}</p>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI_DEFS.map((kpi) => {
          const Icon = kpi.icon;
          const raw = data?.kpis?.[kpi.key] as number | undefined | null;
          const isEmpty = noData || (!loading && data == null);

          return (
            <Card key={kpi.key} className={isEmpty ? "opacity-50" : ""}>
              <CardContent className="pt-5 pb-4 flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {kpi.label}
                  </p>
                  {loading && !data ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                      {isEmpty ? "—" : kpi.format(raw)}
                      {!isEmpty && kpi.unit && (
                        <span className="text-sm font-normal text-muted-foreground ml-0.5">
                          {kpi.unit}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Debug (bottom) ── */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground font-medium">
          🔍 Parâmetros atuais da RPC (debug)
        </summary>
        <pre className="mt-2 rounded-md border bg-muted/50 p-3 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(debugParams, null, 2)}
        </pre>
      </details>

      {data && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground font-medium">
            📦 JSON bruto (debug)
          </summary>
          <pre className="mt-2 rounded-md border bg-muted p-4 overflow-auto max-h-[50vh] whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
