import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ClipboardCheck, ShieldCheck, CheckCircle2, AlertTriangle,
  FileText, Activity, ExternalLink, Dna, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useConformityMetricsByProfessional, type ProfessionalConformityFilters } from "@/hooks/useConformityMetricsByProfessional";
import { useClinicProfessionals, useCurrentUserRole } from "@/hooks/useClinicProfessionals";
import { InstitutionalScoreCard, type ScoreDimension } from "@/components/admin/dashboard/InstitutionalScoreCard";
import { computeInstitutionalScore, buildScoreInput } from "@/lib/institutional-score";
import { DateRange } from "react-day-picker";

function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

interface ProfessionalViewProps {
  dateRange: DateRange;
  area: string;
  protocolType: string;
  onlyCompleted: boolean;
}

export function ProfessionalConformityView({
  dateRange, area, protocolType, onlyCompleted,
}: ProfessionalViewProps) {
  const navigate = useNavigate();
  const now = new Date();

  const { data: currentUser } = useCurrentUserRole();
  const { data: professionals = [], isLoading: loadingPros } = useClinicProfessionals();

  const isAdmin = currentUser?.role === "admin";

  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);

  // Resolve effective professional ID
  const effectiveProfId = isAdmin
    ? selectedProfId || currentUser?.userId || null
    : currentUser?.userId || null;

  const filters: ProfessionalConformityFilters = useMemo(() => ({
    start: startOfDay(dateRange.from || subDays(now, 30)),
    end: endOfDay(dateRange.to || now),
    professionalId: effectiveProfId,
    area: area === "all" ? null : area,
    protocolType: protocolType === "all" ? null : protocolType,
    onlyCompleted,
  }), [dateRange, effectiveProfId, area, protocolType, onlyCompleted]);

  const { data, isLoading } = useConformityMetricsByProfessional(filters);

  const kpis = data?.kpis;
  const topProtocols = data?.topProtocols || [];
  const pending = data?.pending || [];
  const adverseEvents = data?.adverseEvents || [];

  // Compute institutional score
  const score = useMemo(() => {
    if (!kpis || kpis.total === 0) return 0;
    return computeInstitutionalScore(buildScoreInput(kpis));
  }, [kpis]);

  const scoreDimensions: ScoreDimension[] = useMemo(() => {
    if (!kpis || kpis.total === 0) return [];
    const t = kpis.total;
    return [
      { axis: "Checklist", value: Math.round((kpis.checklistCompleted / t) * 100) },
      { axis: "Finalização", value: Math.round((kpis.finalized / t) * 100) },
      { axis: "Rastreabilidade", value: Math.round(((kpis.traceabilityComplete ?? 0) / t) * 100) },
      { axis: "Protocolo", value: Math.round(((kpis.withProtocol ?? 0) / t) * 100) },
      { axis: "Científico", value: Math.round(((kpis.scientificValidatedCount ?? 0) / t) * 100) },
    ];
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* Professional Selector (admin only) */}
      {isAdmin && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-end gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Profissional</p>
                <Select
                  value={selectedProfId || currentUser?.userId || ""}
                  onValueChange={setSelectedProfId}
                >
                  <SelectTrigger className="w-[280px] h-9 text-sm">
                    <SelectValue placeholder="Selecionar profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.email || p.user_id.slice(0, 8)} — {p.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {data?.professional && (
                <div className="text-sm text-muted-foreground pb-1">
                  <Badge variant="outline" className="text-xs">{data.professional.role}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isAdmin && currentUser && (
        <p className="text-sm text-muted-foreground">
          Visualizando sua performance individual
        </p>
      )}

      {/* Loading */}
      {(isLoading || !effectiveProfId) ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          {/* Institutional Score Card */}
          {kpis && kpis.total > 0 && (
            <InstitutionalScoreCard score={score} dimensions={scoreDimensions} />
          )}

          {/* KPI Cards */}
          {kpis && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KPICard icon={FileText} title="Total Procedimentos" value={kpis.total} />
              <KPICard icon={ShieldCheck} title="Com Protocolo" value={pct(kpis.withProtocol, kpis.total)} subtitle={`${kpis.withProtocol}/${kpis.total}`} />
              <KPICard icon={CheckCircle2} title="Checklist Completo" value={pct(kpis.checklistCompleted, kpis.total)} subtitle={`${kpis.checklistCompleted}/${kpis.total}`} color="text-green-500" />
              <KPICard icon={ClipboardCheck} title="Finalizados" value={pct(kpis.finalized, kpis.total)} subtitle={`${kpis.finalized}/${kpis.total}`} color="text-blue-500" />
              <KPICard icon={Package} title="Rastreabilidade" value={pct(kpis.traceabilityComplete ?? 0, kpis.total)} subtitle={`${kpis.traceabilityComplete ?? 0}/${kpis.total}`} color="text-teal-500" />
              <KPICard icon={Dna} title="Casos Científicos" value={(kpis.scientificDraftCount || 0) + (kpis.scientificValidatedCount || 0)} subtitle={`${kpis.scientificDraftCount || 0} rascunho · ${kpis.scientificValidatedCount || 0} validados`} color="text-emerald-500" />
            </div>
          )}

          {kpis && kpis.total === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Nenhum procedimento registrado para este profissional no período selecionado
            </div>
          )}

          {/* Top Protocols */}
          {topProtocols.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Protocolos Mais Usados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                      <TableRow key={tp.protocol_id} className="border-border">
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
                              ? "text-green-500" : "text-amber-500"
                          )}>
                            {pct(tp.checklist_completed_count, tp.total_procedures)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => navigate(`/governanca/protocolos/${tp.protocol_id}`)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Pendências
                  <Badge variant="secondary" className="ml-2 text-xs">{pending.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Paciente</TableHead>
                      <TableHead className="text-xs">Protocolo</TableHead>
                      <TableHead className="text-xs w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map(p => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="text-sm py-3">
                          {format(new Date(p.created_at), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm">{p.patient_name || "—"}</TableCell>
                        <TableCell className="text-sm">{p.protocol_title}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-xs"
                            onClick={() => navigate(`/atendimentos/${p.attendance_id}`)}>
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Adverse Events */}
          {adverseEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Eventos Adversos
                  <Badge variant="destructive" className="ml-2 text-xs">{adverseEvents.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Paciente</TableHead>
                      <TableHead className="text-xs">Protocolo</TableHead>
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
                          <Button variant="ghost" size="sm" className="text-xs"
                            onClick={() => navigate(`/atendimentos/${ae.attendance_id}`)}>
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-component ──
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
