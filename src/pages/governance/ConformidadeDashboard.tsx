import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ClipboardCheck, ShieldCheck, CheckCircle2, AlertTriangle,
  FileText, BarChart3, Activity, ExternalLink, CalendarIcon, RefreshCw,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useConformityMetrics, type ConformityFilters } from "@/hooks/useConformityMetrics";
import { DateRange } from "react-day-picker";

function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

export default function ConformidadeDashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(now, 30),
    to: now,
  });
  const [area, setArea] = useState<string>("all");
  const [protocolType, setProtocolType] = useState<string>("all");
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const filters: ConformityFilters = useMemo(() => ({
    start: startOfDay(dateRange.from || subDays(now, 30)),
    end: endOfDay(dateRange.to || now),
    area: area === "all" ? null : area,
    protocolType: protocolType === "all" ? null : protocolType,
    onlyCompleted,
  }), [dateRange, area, protocolType, onlyCompleted]);

  const { data, isLoading, refetch } = useConformityMetrics(filters);

  const kpis = data?.kpis;
  const topProtocols = data?.topProtocols || [];
  const pending = data?.pending || [];
  const adverseEvents = data?.adverseEvents || [];

  // Drill-down state
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const filteredPending = selectedProtocolId
    ? pending.filter(p => {
        // find matching protocol from topProtocols
        const tp = topProtocols.find(t => t.protocol_id === selectedProtocolId);
        return tp && p.protocol_title === tp.title;
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conformidade</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores de governança clínica e aderência aos protocolos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Date Range */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 text-sm h-9">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateRange.from ? format(dateRange.from, "dd/MM/yy", { locale: ptBR }) : "..."}{" - "}
                    {dateRange.to ? format(dateRange.to, "dd/MM/yy", { locale: ptBR }) : "..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(r) => { if (r) setDateRange(r); }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                  <div className="p-2 border-t flex justify-end">
                    <Button size="sm" onClick={() => setCalOpen(false)}>Aplicar</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Area */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Área</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Ortobiológicos">Ortobiológicos</SelectItem>
                  <SelectItem value="MAC (Método de Aceleração Cicatricial)">MAC</SelectItem>
                  <SelectItem value="EPI">EPI</SelectItem>
                  <SelectItem value="Ondas de Choque">Ondas de Choque</SelectItem>
                  <SelectItem value="Injetáveis">Injetáveis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Protocol Type */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={protocolType} onValueChange={setProtocolType}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="REGEN_BASE">Base REGHEN</SelectItem>
                  <SelectItem value="DERIVED">Derivado</SelectItem>
                  <SelectItem value="INSTITUTIONAL">Institucional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Only completed toggle */}
            <div className="flex items-center gap-2 pb-0.5">
              <Switch id="only-completed" checked={onlyCompleted} onCheckedChange={setOnlyCompleted} />
              <Label htmlFor="only-completed" className="text-xs text-muted-foreground cursor-pointer">
                Somente finalizados
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard icon={FileText} title="Total Procedimentos" value={kpis.total} />
          <KPICard icon={ShieldCheck} title="Com Protocolo" value={pct(kpis.withProtocol, kpis.total)} subtitle={`${kpis.withProtocol}/${kpis.total}`} />
          <KPICard icon={CheckCircle2} title="Checklist Completo" value={pct(kpis.checklistCompleted, kpis.total)} subtitle={`${kpis.checklistCompleted}/${kpis.total}`} color="text-green-500" />
          <KPICard icon={ClipboardCheck} title="Finalizados" value={pct(kpis.finalized, kpis.total)} subtitle={`${kpis.finalized}/${kpis.total}`} color="text-blue-500" />
          <KPICard icon={AlertTriangle} title="Eventos Adversos" value={kpis.adverseEvents} subtitle={pct(kpis.adverseEvents, kpis.total)} color={kpis.adverseEvents > 0 ? "text-amber-500" : undefined} />
        </div>
      ) : null}

      {/* Protocol Distribution */}
      {kpis && kpis.protocolDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribuição por Tipo de Protocolo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            {kpis.protocolDistribution.map(d => (
              <Badge key={d.type} variant="outline" className="text-sm py-1 px-3">
                {d.type === "REGEN_BASE" ? "Base REGHEN" : d.type === "DERIVED" ? "Derivado" : d.type === "INSTITUTIONAL" ? "Institucional" : d.type}
                : <span className="font-bold ml-1">{d.count}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Protocols */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Protocolos Mais Usados (Top 10)
            {selectedProtocolId && (
              <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setSelectedProtocolId(null)}>
                Limpar filtro
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-32 w-full" /></div>
          ) : topProtocols.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Nenhum procedimento no período
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs">Protocolo</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs text-right">Procedimentos</TableHead>
                  <TableHead className="text-xs text-right">% Checklist OK</TableHead>
                  <TableHead className="text-xs w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProtocols.map(tp => (
                  <TableRow
                    key={tp.protocol_id}
                    className={cn(
                      "border-border cursor-pointer hover:bg-muted/50",
                      selectedProtocolId === tp.protocol_id && "bg-muted"
                    )}
                    onClick={() => setSelectedProtocolId(tp.protocol_id === selectedProtocolId ? null : tp.protocol_id)}
                  >
                    <TableCell className="text-sm font-medium py-3">{tp.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tp.protocol_type === "REGEN_BASE" ? "Base" : tp.protocol_type === "DERIVED" ? "Derivado" : "Institucional"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{tp.total_procedures}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-medium",
                        tp.total_procedures > 0 && tp.checklist_completed_count === tp.total_procedures
                          ? "text-green-500"
                          : "text-amber-500"
                      )}>
                        {pct(tp.checklist_completed_count, tp.total_procedures)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/governanca/protocolos/${tp.protocol_id}`);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drill-down: filtered pending by selected protocol */}
      {filteredPending && filteredPending.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Procedimentos do protocolo selecionado com pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PendingTable items={filteredPending} navigate={navigate} />
          </CardContent>
        </Card>
      )}

      {/* Pending Compliance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Pendências de Conformidade
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{pending.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-32 w-full" /></div>
          ) : pending.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Nenhuma pendência no período 🎉
            </div>
          ) : (
            <PendingTable items={pending} navigate={navigate} />
          )}
        </CardContent>
      </Card>

      {/* Adverse Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Eventos Adversos
            {adverseEvents.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{adverseEvents.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-32 w-full" /></div>
          ) : adverseEvents.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Nenhum evento adverso reportado no período
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Paciente</TableHead>
                  <TableHead className="text-xs">Protocolo</TableHead>
                  <TableHead className="text-xs">Severidade</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {adverseEvents.map(ae => (
                  <TableRow key={ae.id} className="border-border">
                    <TableCell className="text-sm py-3">
                      {format(new Date(ae.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">{ae.patient_name || "—"}</TableCell>
                    <TableCell className="text-sm">{ae.protocol_title}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={ae.adverse_event_record?.severity} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ae.adverse_event_record?.type || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate(`/atendimentos/${ae.attendance_id}`)}
                      >
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============= Sub-components =============

function KPICard({ icon: Icon, title, value, subtitle, color }: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{title}</p>
            <p className={cn("text-2xl font-bold", color || "text-foreground")}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("p-2 rounded-lg bg-muted/50", color || "text-primary")}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingTable({ items, navigate }: { items: any[]; navigate: (path: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-xs">Data</TableHead>
          <TableHead className="text-xs">Paciente</TableHead>
          <TableHead className="text-xs">Protocolo</TableHead>
          <TableHead className="text-xs">Checklist</TableHead>
          <TableHead className="text-xs">Finalização</TableHead>
          <TableHead className="text-xs w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(p => (
          <TableRow key={p.id} className="border-border">
            <TableCell className="text-sm py-3">
              {format(new Date(p.created_at), "dd/MM/yy", { locale: ptBR })}
            </TableCell>
            <TableCell className="text-sm">{p.patient_name || "—"}</TableCell>
            <TableCell className="text-sm">{p.protocol_title}</TableCell>
            <TableCell>
              <ChecklistBadge status={p.checklist_status} />
            </TableCell>
            <TableCell>
              <FinalizationBadge status={p.finalization_status} />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => navigate(`/atendimentos/${p.attendance_id}`)}
              >
                Abrir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ChecklistBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: "Completo", cls: "bg-green-500/10 text-green-500 border-green-500/20" },
    IN_PROGRESS: { label: "Em andamento", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    NOT_STARTED: { label: "Não iniciado", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <Badge variant="outline" className={cn("text-xs", s.cls)}>{s.label}</Badge>;
}

function FinalizationBadge({ status }: { status: string }) {
  const isComplete = status === "completed";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        isComplete
          ? "bg-green-500/10 text-green-500 border-green-500/20"
          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      )}
    >
      {isComplete ? "Finalizado" : "Pendente"}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity?: string }) {
  const map: Record<string, string> = {
    LEVE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    MODERADO: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    GRAVE: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", map[severity || ""] || "")}>
      {severity || "—"}
    </Badge>
  );
}
