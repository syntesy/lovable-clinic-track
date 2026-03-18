/**
 * OutcomeReportCard — Generic, parameterized report visualization.
 * Replaces PrpOaKl1M3ReportCard with a fully dynamic component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ClinicalOutcomeBadge } from '@/components/ui/ClinicalOutcomeBadge';
import { Info, TrendingDown, TrendingUp, Activity, Users, AlertTriangle, BarChart3, ArrowDown } from 'lucide-react';
import {
  type ProcedureOutcomeReport,
  type ReportScope,
  type OutcomeReportParams,
  TIMEPOINT_OPTIONS,
} from '@/hooks/useProcedureOutcomeReport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

interface Props {
  data: ProcedureOutcomeReport | undefined;
  isLoading: boolean;
  error: Error | null;
  scope: ReportScope;
  params: OutcomeReportParams | null;
}

function getTimepointLabel(tp: string): string {
  return TIMEPOINT_OPTIONS.find(t => t.value === tp)?.label || tp.toUpperCase();
}

export function OutcomeReportCard({ data, isLoading, error, scope, params }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar relatório: {error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.nIncluded === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-12 text-center">
          <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Dados insuficientes</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {data?.nTotalEligible
              ? `${data.nTotalEligible} caso(s) elegível(eis), mas nenhum com baseline e follow-up completos.`
              : 'Nenhum caso encontrado com os critérios selecionados.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  // k-anonymity for COLLECTIVE
  if (scope === 'COLLECTIVE' && data.nIncluded < 5) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-12 text-center">
          <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Privacidade</h3>
          <p className="text-muted-foreground">
            Menos de 5 casos incluídos. Dados não exibidos por privacidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { deltaPainStats, deltaFunctionStats, protocolBreakdown } = data;
  const tpLabel = params ? getTimepointLabel(params.timepoint) : '';
  const histBuckets = buildHistogram(data.cases?.map(c => c.deltaPain) || []);

  return (
    <div className="space-y-6">
      {/* Eligibility Summary */}
      {scope === 'COLLECTIVE' && (
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            <Users className="h-3 w-3 mr-1" />
            Elegíveis: {data.nTotalEligible}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Excluídos (incompletos): {data.nExcludedIncomplete}
          </Badge>
          <Badge className="text-sm bg-primary/20 text-primary border-primary/30">
            Incluídos: {data.nIncluded}
          </Badge>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="N incluídos" value={data.nIncluded.toString()} icon={<Users className="h-4 w-4" />} />
        <KpiCard
          label="Δ Dor média"
          value={deltaPainStats.mean.toFixed(1)}
          subtitle={`Mediana: ${deltaPainStats.median.toFixed(1)} · DP: ${deltaPainStats.stdDev.toFixed(1)}${deltaPainStats.ci95Lower !== null ? ` · IC95: [${deltaPainStats.ci95Lower.toFixed(1)}, ${deltaPainStats.ci95Upper!.toFixed(1)}]` : ''}`}
          icon={deltaPainStats.mean < 0 ? <TrendingDown className="h-4 w-4 text-clinical-safe" /> : <TrendingUp className="h-4 w-4 text-destructive" />}
        />
        <KpiCard
          label="Melhora ≥ 2pts"
          value={`${deltaPainStats.pctImproved2pts}%`}
          subtitle={`${Math.round(deltaPainStats.pctImproved2pts * data.nIncluded / 100)} de ${data.nIncluded}`}
          icon={<Activity className="h-4 w-4" />}
        />
        <KpiCard
          label="Piora ≥ 2pts"
          value={`${deltaPainStats.pctWorsened2pts}%`}
          icon={<ArrowDown className="h-4 w-4 text-destructive" />}
        />
        <KpiCard
          label="Eventos adversos"
          value={`${deltaPainStats.pctAdverseEvent}%`}
          subtitle={`No follow-up ${tpLabel}`}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Function stats */}
      {deltaFunctionStats.n > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Função (normalizada)</CardTitle>
            <CardDescription>
              Positivo = melhora · n={deltaFunctionStats.n}
              {deltaFunctionStats.ci95Lower !== null && ` · IC95: [${deltaFunctionStats.ci95Lower.toFixed(1)}, ${deltaFunctionStats.ci95Upper!.toFixed(1)}]`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <span className="text-sm text-muted-foreground">Média</span>
                <p className={`text-xl font-bold ${deltaFunctionStats.mean > 0 ? 'text-clinical-safe' : 'text-destructive'}`}>
                  {deltaFunctionStats.mean > 0 ? '+' : ''}{deltaFunctionStats.mean.toFixed(1)}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Mediana</span>
                <p className={`text-xl font-bold ${deltaFunctionStats.median > 0 ? 'text-clinical-safe' : 'text-destructive'}`}>
                  {deltaFunctionStats.median > 0 ? '+' : ''}{deltaFunctionStats.median.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delta Pain Histogram — only for CLINIC with case data */}
      {scope === 'CLINIC' && histBuckets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Distribuição Δ Dor (EVA)
            </CardTitle>
            <CardDescription>Negativo = melhora</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={histBuckets}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histBuckets.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.value < 0 ? 'hsl(var(--clinical-safe))' : entry.value > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Protocol Breakdown */}
      {protocolBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Protocolo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Protocolo</th>
                    <th className="text-center py-2 px-2">N</th>
                    <th className="text-center py-2 px-2">Δ Dor média</th>
                    <th className="text-center py-2 px-2">Δ Função média</th>
                  </tr>
                </thead>
                <tbody>
                  {protocolBreakdown.map((pb) => (
                    <tr key={pb.protocolId} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{pb.protocolTitle}</td>
                      <td className="text-center py-2 px-2"><Badge variant="secondary">{pb.n}</Badge></td>
                      <td className="text-center py-2 px-2">
                        <span className={pb.meanDeltaPain < 0 ? 'text-clinical-safe' : 'text-destructive'}>
                          {pb.meanDeltaPain.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-center py-2 px-2">
                        {pb.meanDeltaFunction !== null ? (
                          <span className={pb.meanDeltaFunction > 0 ? 'text-clinical-safe' : 'text-destructive'}>
                            {pb.meanDeltaFunction > 0 ? '+' : ''}{pb.meanDeltaFunction.toFixed(1)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case details — only for CLINIC */}
      {scope === 'CLINIC' && data.cases && data.cases.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Casos incluídos</CardTitle>
            <CardDescription>{data.cases.length} atendimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">EVA Base</th>
                    <th className="text-left py-2 px-2">EVA {tpLabel}</th>
                    <th className="text-center py-2 px-2">Δ Dor</th>
                    <th className="text-center py-2 px-2">Δ Função</th>
                    <th className="text-left py-2 px-2">Desfecho Clínico</th>
                    <th className="text-left py-2 px-2">Protocolo</th>
                    <th className="text-center py-2 px-2">EA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cases.map((c, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2">{c.baselinePain}</td>
                      <td className="py-2 px-2">{c.followupPain}</td>
                      <td className="text-center py-2 px-2">
                        <span className={c.deltaPain < 0 ? 'text-clinical-safe font-medium' : c.deltaPain > 0 ? 'text-destructive' : ''}>
                          {c.deltaPain > 0 ? '+' : ''}{c.deltaPain}
                        </span>
                      </td>
                      <td className="text-center py-2 px-2">
                        {c.deltaFunction !== null ? (
                          <span className={c.deltaFunction > 0 ? 'text-clinical-safe' : 'text-destructive'}>
                            {c.deltaFunction > 0 ? '+' : ''}{c.deltaFunction.toFixed(1)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2">
                        <ClinicalOutcomeBadge classification={c.clinicalOutcomeClassification} />
                      </td>
                      <td className="py-2 px-2 max-w-[200px] truncate">{c.protocolTitle || '—'}</td>
                      <td className="text-center py-2 px-2">
                        {c.adverseEvent ? <AlertTriangle className="h-4 w-4 text-destructive mx-auto" /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function KpiCard({ label, value, subtitle, icon }: {
  label: string; value: string; subtitle?: string; icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Histogram helper ─────────────────────────────────────────────

interface HistBucket { label: string; count: number; value: number; }

function buildHistogram(deltas: number[]): HistBucket[] {
  if (deltas.length === 0) return [];
  const buckets: HistBucket[] = [
    { label: '≤-4', count: 0, value: -4 },
    { label: '-3', count: 0, value: -3 },
    { label: '-2', count: 0, value: -2 },
    { label: '-1', count: 0, value: -1 },
    { label: '0', count: 0, value: 0 },
    { label: '+1', count: 0, value: 1 },
    { label: '+2', count: 0, value: 2 },
    { label: '≥+3', count: 0, value: 3 },
  ];
  for (const d of deltas) {
    const rounded = Math.round(d);
    if (rounded <= -4) buckets[0].count++;
    else if (rounded === -3) buckets[1].count++;
    else if (rounded === -2) buckets[2].count++;
    else if (rounded === -1) buckets[3].count++;
    else if (rounded === 0) buckets[4].count++;
    else if (rounded === 1) buckets[5].count++;
    else if (rounded === 2) buckets[6].count++;
    else buckets[7].count++;
  }
  return buckets;
}
