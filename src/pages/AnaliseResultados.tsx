/**
 * ResultsAnalyticsDashboard — Etapa 6: Filtros completos + debug de params.
 * Exibe JSON bruto da RPC com filtros integrados ao hook.
 */

import { useMemo, useState } from "react";
import { useResultsAnalytics } from "@/hooks/useResultsAnalytics";
import { useClinicProfessionals } from "@/hooks/useClinicProfessionals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  PATHOLOGY_OPTIONS,
  ANATOMIC_REGION_OPTIONS,
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

// ─── Component ────────────────────────────────────────────────────

export default function ResultsAnalyticsDashboard() {
  // Period
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("12m");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Filters
  const [procedureType, setProcedureType] = useState<string | null>(null);
  const [pathology, setPathology] = useState<string | null>(null);
  const [anatomicRegion, setAnatomicRegion] = useState<string | null>(null);
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [protocolType, setProtocolType] = useState<string | null>(null);
  const [responsibleProfessionalId, setResponsibleProfessionalId] = useState<string | null>(null);

  // Toggles
  const [onlyCompleted, setOnlyCompleted] = useState(true);
  const [onlyScientific, setOnlyScientific] = useState(false);
  const [onlyValidated, setOnlyValidated] = useState(false);

  // Pagination (kept in state for later)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [sort] = useState<"latest" | "delta" | "baseline">("latest");

  // Professionals list
  const { data: professionals } = useClinicProfessionals();

  // Computed period
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

  // Reset page on any filter change
  const resetPage = () => setPage(1);

  // Build hook params
  const hookParams = useMemo(
    () => ({
      start,
      end,
      procedureType,
      pathology,
      anatomicRegion,
      protocolId: protocolId || null,
      protocolType,
      responsibleProfessionalId,
      onlyCompleted,
      onlyScientific,
      scientificStatus: onlyValidated ? "validated" : null,
      page,
      pageSize,
      sort,
    }),
    [
      start, end, procedureType, pathology, anatomicRegion,
      protocolId, protocolType, responsibleProfessionalId,
      onlyCompleted, onlyScientific, onlyValidated,
      page, pageSize, sort,
    ]
  );

  const { data, loading, error, refetch } = useResultsAnalytics(hookParams, {
    enabled: !!start && !!end,
  });

  const noData =
    data && ((data.kpis as any)?.no_data === true || data.cases.total === 0);

  // Debug params (omit clinic_id since it's resolved internally)
  const debugParams = useMemo(() => {
    const { ...rest } = hookParams;
    return rest;
  }, [hookParams]);

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
          {/* Row 1: Period */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select
                value={periodPreset}
                onValueChange={(v) => {
                  setPeriodPreset(v as PeriodPreset);
                  resetPage();
                }}
              >
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
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => { setCustomStart(e.target.value); resetPage(); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fim</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => { setCustomEnd(e.target.value); resetPage(); }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Row 2: Main filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Procedimento</Label>
              <Select
                value={procedureType ?? "__all__"}
                onValueChange={(v) => { setProcedureType(v === "__all__" ? null : v); resetPage(); }}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {PROCEDURE_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Patologia</Label>
              <Select
                value={pathology ?? "__all__"}
                onValueChange={(v) => { setPathology(v === "__all__" ? null : v); resetPage(); }}
              >
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {PATHOLOGY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Região anatômica</Label>
              <Select
                value={anatomicRegion ?? "__all__"}
                onValueChange={(v) => { setAnatomicRegion(v === "__all__" ? null : v); resetPage(); }}
              >
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {ANATOMIC_REGION_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Profissional responsável</Label>
              <Select
                value={responsibleProfessionalId ?? "__all__"}
                onValueChange={(v) => { setResponsibleProfessionalId(v === "__all__" ? null : v); resetPage(); }}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {professionals?.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.email || p.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Protocol filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>ID do Protocolo</Label>
              <Input
                placeholder="UUID do protocolo (opcional)"
                value={protocolId ?? ""}
                onChange={(e) => { setProtocolId(e.target.value || null); resetPage(); }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de protocolo</Label>
              <Input
                placeholder="Ex: REGEN_BASE, CUSTOM..."
                value={protocolType ?? ""}
                onChange={(e) => { setProtocolType(e.target.value || null); resetPage(); }}
              />
            </div>
          </div>

          {/* Row 4: Toggles */}
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

      {/* ── Debug: params enviados ── */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground font-medium">
          🔍 Parâmetros atuais da RPC (debug)
        </summary>
        <pre className="mt-2 rounded-md border bg-muted/50 p-3 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(debugParams, null, 2)}
        </pre>
      </details>

      {/* ── States ── */}
      {loading && !data && (
        <p className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </p>
      )}

      {error && (
        <p className="text-destructive font-medium">Erro: {error}</p>
      )}

      {noData && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Sem dados suficientes para o período/filtros selecionados.
        </div>
      )}

      {data && (
        <pre className="rounded-md border bg-muted p-4 text-xs overflow-auto max-h-[60vh] whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
