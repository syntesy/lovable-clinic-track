/**
 * ResultsAnalyticsDashboard — Etapa 10: KPIs + Gráficos + Tabela paginada + RBAC.
 * RBAC: SECRETARY bloqueado via RequireGovernanceAccess no router.
 *       NURSE_TECH: read-only (view); PROFESSIONAL/ADMIN: acesso total.
 */

import { useMemo, useState } from "react";
import { useResultsAnalytics, type ResultsKpis } from "@/hooks/useResultsAnalytics";
import { useClinicProfessionals } from "@/hooks/useClinicProfessionals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle, Users, TrendingUp, CalendarCheck,
  Clock, ClipboardCheck, Link2, BarChart3, ExternalLink,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  PATHOLOGY_OPTIONS, ANATOMIC_REGION_OPTIONS,
} from "@/types/clinical-standard";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ResponsiveContainer,
} from "recharts";

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

// ─── Chart colors (using HSL from design tokens) ─────────────────
const RESPONSE_COLORS: Record<string, string> = {
  RESPONDER: "hsl(var(--primary))",
  NON_RESPONDER: "hsl(var(--muted-foreground))",
  WORSENING: "hsl(var(--destructive))",
  NO_DATA: "hsl(var(--border))",
};
const RESPONSE_LABELS: Record<string, string> = {
  RESPONDER: "Respondedor",
  NON_RESPONDER: "Não respondedor",
  WORSENING: "Piora",
  NO_DATA: "Sem dados",
};
const SEVERITY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--destructive))",
];

function ChartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground gap-2">
      <BarChart3 className="h-8 w-8 opacity-40" />
      <span className="text-sm">Sem dados suficientes para exibir este gráfico.</span>
    </div>
  );
}

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
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<"latest" | "delta" | "baseline">("latest");

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

      {/* ── Charts Section ── */}
      {!error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* A) Donut — Distribuição de Resposta */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Distribuição de resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dist = data?.charts?.response_distribution;
                  const entries = dist
                    ? Object.entries(dist).filter(([, v]) => v > 0)
                    : [];
                  if (noData || entries.length === 0) return <ChartEmpty />;
                  const pieData = entries.map(([key, value]) => ({
                    name: RESPONSE_LABELS[key] || key,
                    value,
                    fill: RESPONSE_COLORS[key] || "hsl(var(--muted))",
                  }));
                  return (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ReTooltip
                          formatter={(value: number) => [`${value}`, "Casos"]}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>

            {/* B) Bar — Gravidade no Baseline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Gravidade no baseline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dist = data?.charts?.severity_distribution;
                  const entries = dist
                    ? Object.entries(dist).filter(([, v]) => v > 0)
                    : [];
                  if (noData || entries.length === 0) return <ChartEmpty />;
                  const barData = entries.map(([key, value]) => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    casos: value,
                  }));
                  return (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={barData} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <ReTooltip
                          formatter={(value: number) => [`${value}`, "Casos"]}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="casos" radius={[4, 4, 0, 0]}>
                          {barData.map((_, i) => (
                            <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* C) Line — Evolução Temporal (full width) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Evolução ao longo do tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const series = data?.charts?.outcomes_over_time;
                if (noData || !series || series.length === 0) return <ChartEmpty />;
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <ReTooltip
                        formatter={(value: number) => [`${Math.round(value)}%`, "Respondedor"]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="responder_pct"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Cases Table ── */}
      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Casos
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Ordenar por</Label>
              <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); setPage(1); }}>
                <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Mais recente</SelectItem>
                  <SelectItem value="delta">Maior melhora</SelectItem>
                  <SelectItem value="baseline">Baseline mais alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Por página</Label>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Paciente</TableHead>
                  <TableHead className="text-xs">Procedimento</TableHead>
                  <TableHead className="text-xs">Patologia</TableHead>
                  <TableHead className="text-xs">Protocolo</TableHead>
                  <TableHead className="text-xs text-right">Baseline</TableHead>
                  <TableHead className="text-xs text-right">Último</TableHead>
                  <TableHead className="text-xs text-right">Δ</TableHead>
                  <TableHead className="text-xs">Classificação</TableHead>
                  <TableHead className="text-xs w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !data ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.cases?.items?.length ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhum caso encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.cases.items.map((c) => {
                    const hasDelta = c.classification !== "NO_DATA" && c.delta_value != null;
                    return (
                      <TableRow key={c.psr_id}>
                        <TableCell className="text-sm font-medium">{c.patient_display || "—"}</TableCell>
                        <TableCell className="text-sm">{c.procedure_type || "—"}</TableCell>
                        <TableCell className="text-sm">{c.pathology || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{c.protocol_title || "—"}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">
                          {c.baseline_value != null ? c.baseline_value : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-right tabular-nums">
                          {c.latest_value != null ? c.latest_value : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-right tabular-nums">
                          {hasDelta
                            ? `${c.delta_value! > 0 ? "+" : ""}${c.delta_value!.toFixed(1)} (${c.delta_pct != null ? `${c.delta_pct > 0 ? "+" : ""}${Math.round(c.delta_pct)}%` : ""})`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.classification === "RESPONDER" ? "default"
                              : c.classification === "WORSENING" ? "destructive"
                              : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {RESPONSE_LABELS[c.classification] || c.classification}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  if (c.patient_id) {
                                    window.open(`/pacientes/${c.patient_id}`, "_blank");
                                  }
                                }}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Abrir paciente</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {data?.cases && data.cases.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <span>
                Mostrando {((data.cases.page - 1) * data.cases.page_size) + 1}–{Math.min(data.cases.page * data.cases.page_size, data.cases.total)} de {data.cases.total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page * pageSize >= data.cases.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Debug (DEV only) ── */}
      {import.meta.env.DEV && (
        <>
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
        </>
      )}
    </div>
  );
}
