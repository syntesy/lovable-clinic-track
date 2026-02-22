/**
 * Collective Dashboard - Anonymous Aggregated Clinical Patterns & Outcomes
 * 
 * Phase 3+4+5 of CSE: Shows aggregated data without exposing individual cases
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info, Users, TrendingUp, Shield, FlaskConical, Activity, HeartPulse, Target, TrendingDown, Minus } from 'lucide-react';
import { useCollectiveInsights, DashboardFilters, getMostFrequent } from '@/hooks/useCollectiveInsights';
import { useCollectiveOutcomes, OutcomeTimepoint, ResponseThreshold, ClusterOutcomeAggregation, TrendInfo } from '@/hooks/useCollectiveOutcomes';
import { humanReadableClusterKey } from '@/lib/cluster-signature-generator';
import { usePrpOaKl1M3Report } from '@/hooks/usePrpOaKl1M3Report';
import { PrpOaKl1M3ReportCard } from '@/components/insights/PrpOaKl1M3ReportCard';
import {
  PATHOLOGY_OPTIONS,
  ANATOMIC_REGION_OPTIONS,
  IMAGING_GUIDANCE_OPTIONS,
} from '@/types/clinical-standard';

// Human-readable labels for values
const LABEL_MAP: Record<string, string> = {
  // Sessions
  '1': '1 sessão',
  '2': '2 sessões',
  '3': '3 sessões',
  '>3': '>3 sessões',
  // Intervals
  '1-2_semanas': '1-2 sem',
  '3-4_semanas': '3-4 sem',
  '4-6_semanas': '4-6 sem',
  '>6_semanas': '>6 sem',
  'N/A': 'N/A',
  // Volume
  '1-3_ml': '1-3 ml',
  '4-6_ml': '4-6 ml',
  '7-10_ml': '7-10 ml',
  '>10_ml': '>10 ml',
  // Guidance
  'ultrassonografia': 'US',
  'radioscopia': 'RX',
  'tomografia': 'TC',
  'sem_guia': 'Sem guia',
  // Pathology
  'artrose': 'Artrose',
  'tendinopatia': 'Tendinopatia',
  'lesao_muscular': 'Lesão Muscular',
  'hernia_disco': 'Hérnia',
  // Region
  'joelho': 'Joelho',
  'ombro': 'Ombro',
  'quadril': 'Quadril',
  'cotovelo': 'Cotovelo',
  'coluna_cervical': 'C. Cervical',
  'coluna_lombar': 'C. Lombar',
};

const TIMEPOINT_LABELS: Record<OutcomeTimepoint, string> = {
  baseline: 'Baseline',
  m1: '1 mês',
  m3: '3 meses',
  m6: '6 meses',
  m12: '12 meses',
};

function getLabel(value: string): string {
  return LABEL_MAP[value] || value;
}

function TrendBadge({ trend }: { trend: TrendInfo }) {
  const colorClasses: Record<string, string> = {
    neutral: 'bg-muted text-muted-foreground',
    warning: 'bg-clinical-warning/20 text-clinical-warning',
    success: 'bg-clinical-safe/20 text-clinical-safe',
  };

  const Icon = trend.color === 'success' ? TrendingUp : trend.color === 'warning' ? Minus : TrendingDown;

  return (
    <Badge variant="outline" className={`${colorClasses[trend.color]} gap-1`}>
      <Icon className="h-3 w-3" />
      {trend.label}
    </Badge>
  );
}

export default function CollectiveDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    procedure_type: 'PRP',
    status: 'both',
    prp_with_ha: 'all',
  });
  const [selectedTimepoint, setSelectedTimepoint] = useState<OutcomeTimepoint>('m3');
  const [responseThreshold, setResponseThreshold] = useState<ResponseThreshold>(30);

  const { data: protocolData, isLoading: protocolLoading } = useCollectiveInsights(filters);
  const { data: outcomeData, isLoading: outcomeLoading } = useCollectiveOutcomes(filters, selectedTimepoint);
  const { data: prpReport, isLoading: prpLoading, error: prpError } = usePrpOaKl1M3Report('COLLECTIVE');

  const updateFilter = (key: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Padrões Clínicos</h1>
        <p className="text-muted-foreground">
          Inteligência coletiva agregada e anônima
        </p>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Dados agregados e anônimos. Resultados em tempo real conforme preenchimento.
          Grupos com menos de 5 casos não são exibidos por privacidade.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="prp">Protocolos PRP</TabsTrigger>
          <TabsTrigger value="resultados" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="prp-oa-kl1" className="flex items-center gap-1">
            <FlaskConical className="h-4 w-4" />
            PRP · Artrose KL1
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab data={protocolData} isLoading={protocolLoading} />
        </TabsContent>

        <TabsContent value="prp" className="space-y-4">
          <PRPTab 
            data={protocolData} 
            isLoading={protocolLoading} 
            filters={filters}
            onFilterChange={updateFilter}
          />
        </TabsContent>

        <TabsContent value="resultados" className="space-y-4">
          <ResultadosTab 
            protocolData={protocolData}
            outcomeData={outcomeData} 
            isLoading={outcomeLoading} 
            filters={filters}
            onFilterChange={updateFilter}
            selectedTimepoint={selectedTimepoint}
            onTimepointChange={setSelectedTimepoint}
            responseThreshold={responseThreshold}
            onResponseThresholdChange={setResponseThreshold}
          />
        </TabsContent>

        <TabsContent value="prp-oa-kl1" className="space-y-4">
          <Alert variant="default" className="bg-muted/30 border-muted">
            <FlaskConical className="h-4 w-4" />
            <AlertDescription>
              <strong>Relatório agregado: PRP em Artrose KL1 – Follow-up 3 meses.</strong>{' '}
              Dados anônimos de todas as clínicas. Mínimo 5 casos para exibição.
            </AlertDescription>
          </Alert>
          <PrpOaKl1M3ReportCard
            data={prpReport}
            isLoading={prpLoading}
            error={prpError}
            scope="COLLECTIVE"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TabProps {
  data: any;
  isLoading: boolean;
}

function OverviewTab({ data, isLoading }: TabProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  const overview = data?.overview;
  const totalCases = (overview?.total_eligible || 0) + (overview?.total_with_penalty || 0);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Elegíveis</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalCases}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🟢</span>
              <span className="text-sm text-muted-foreground">Elegíveis</span>
            </div>
            <p className="text-2xl font-bold mt-2">{overview?.total_eligible || 0}</p>
            {totalCases > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((overview?.total_eligible || 0) / totalCases * 100)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🟡</span>
              <span className="text-sm text-muted-foreground">Com Penalidade</span>
            </div>
            <p className="text-2xl font-bold mt-2">{overview?.total_with_penalty || 0}</p>
            {totalCases > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((overview?.total_with_penalty || 0) / totalCases * 100)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clusters Válidos</span>
            </div>
            <p className="text-2xl font-bold mt-2">{data?.clusters?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Patologia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(overview?.pathology_distribution || {}).map(([key, count]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">{getLabel(key)}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
              {Object.keys(overview?.pathology_distribution || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Região</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(overview?.region_distribution || {}).map(([key, count]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">{getLabel(key)}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
              {Object.keys(overview?.region_distribution || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface PRPTabProps extends TabProps {
  filters: DashboardFilters;
  onFilterChange: (key: keyof DashboardFilters, value: any) => void;
}

function PRPTab({ data, isLoading, filters, onFilterChange }: PRPTabProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  const clusters = data?.clusters || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Refine a visualização dos dados agregados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patologia</label>
              <Select
                value={filters.pathology || 'all'}
                onValueChange={(v) => onFilterChange('pathology', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PATHOLOGY_OPTIONS.filter(o => o.value !== 'outra').map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select
                value={filters.anatomic_region || 'all'}
                onValueChange={(v) => onFilterChange('anatomic_region', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {ANATOMIC_REGION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || 'both'}
                onValueChange={(v) => onFilterChange('status', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Todos elegíveis</SelectItem>
                  <SelectItem value="eligible">🟢 Apenas elegíveis</SelectItem>
                  <SelectItem value="eligible_with_penalty">🟡 Com penalidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Guia por Imagem</label>
              <Select
                value={filters.imaging_guidance || 'all'}
                onValueChange={(v) => onFilterChange('imaging_guidance', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {IMAGING_GUIDANCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clusters Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Padrões Mais Usados
          </CardTitle>
          <CardDescription>
            Clusters clínicos ordenados por frequência (mín. 5 casos por cluster)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clusters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum cluster com dados suficientes.</p>
              <p className="text-sm">Aguarde mais registros para visualizar padrões.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Cluster</th>
                    <th className="text-center py-2 px-2">N</th>
                    <th className="text-center py-2 px-2">🟡 %</th>
                    <th className="text-center py-2 px-2">Motivos Penalidade</th>
                    <th className="text-center py-2 px-2">Sessões</th>
                    <th className="text-center py-2 px-2">Intervalo</th>
                    <th className="text-center py-2 px-2">Volume</th>
                    <th className="text-center py-2 px-2">Guia</th>
                    <th className="text-center py-2 px-2">% HA</th>
                    <th className="text-center py-2 px-2">% Choque</th>
                    <th className="text-center py-2 px-2">% EPI</th>
                  </tr>
                </thead>
                <tbody>
                  {clusters.map((cluster: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">
                        {humanReadableClusterKey(cluster.cluster_key)}
                      </td>
                      <td className="text-center py-2 px-2">
                        <Badge>{cluster.case_count}</Badge>
                      </td>
                      <td className="text-center py-2 px-2">
                        {cluster.pct_penalty > 0 ? (
                          <Badge variant="secondary" className="bg-clinical-warning/20 text-clinical-warning">
                            {cluster.pct_penalty}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0%</span>
                        )}
                      </td>
                      <td className="text-left py-2 px-2 text-xs">
                        {cluster.top_penalty_reasons.length > 0 ? (
                          <div className="space-y-0.5">
                            {cluster.top_penalty_reasons.slice(0, 2).map((r: any, i: number) => (
                              <div key={i} className="text-muted-foreground">
                                {r.reason} <span className="text-clinical-warning">{r.pct}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        {getLabel(getMostFrequent(cluster.sessions_distribution))}
                      </td>
                      <td className="text-center py-2 px-2">
                        {getLabel(getMostFrequent(cluster.interval_distribution))}
                      </td>
                      <td className="text-center py-2 px-2">
                        {getLabel(getMostFrequent(cluster.volume_distribution))}
                      </td>
                      <td className="text-center py-2 px-2">
                        {getLabel(getMostFrequent(cluster.guidance_distribution))}
                      </td>
                      <td className="text-center py-2 px-2">{cluster.pct_with_ha}%</td>
                      <td className="text-center py-2 px-2">{cluster.pct_shockwave}%</td>
                      <td className="text-center py-2 px-2">{cluster.pct_epi}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ResultadosTabProps {
  protocolData: any;
  outcomeData: any;
  isLoading: boolean;
  filters: DashboardFilters;
  onFilterChange: (key: keyof DashboardFilters, value: any) => void;
  selectedTimepoint: OutcomeTimepoint;
  onTimepointChange: (t: OutcomeTimepoint) => void;
  responseThreshold: ResponseThreshold;
  onResponseThresholdChange: (t: ResponseThreshold) => void;
}

function ResultadosTab({ 
  protocolData,
  outcomeData, 
  isLoading, 
  filters, 
  onFilterChange,
  selectedTimepoint,
  onTimepointChange,
  responseThreshold,
  onResponseThresholdChange,
}: ResultadosTabProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  const overview = outcomeData?.overview;
  const clusters = outcomeData?.clusters || [];
  const totalRecords = protocolData?.totalRecords || 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Resultados</CardTitle>
          <CardDescription>
            Visualize métricas de dor e função por cluster clínico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patologia</label>
              <Select
                value={filters.pathology || 'all'}
                onValueChange={(v) => onFilterChange('pathology', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PATHOLOGY_OPTIONS.filter(o => o.value !== 'outra').map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select
                value={filters.anatomic_region || 'all'}
                onValueChange={(v) => onFilterChange('anatomic_region', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {ANATOMIC_REGION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || 'both'}
                onValueChange={(v) => onFilterChange('status', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Todos elegíveis</SelectItem>
                  <SelectItem value="eligible">🟢 Apenas elegíveis</SelectItem>
                  <SelectItem value="eligible_with_penalty">🟡 Com penalidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timepoint de Referência</label>
              <Select
                value={selectedTimepoint}
                onValueChange={(v) => onTimepointChange(v as OutcomeTimepoint)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m1">1 mês</SelectItem>
                  <SelectItem value="m3">3 meses (padrão)</SelectItem>
                  <SelectItem value="m6">6 meses</SelectItem>
                  <SelectItem value="m12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Limiar de Resposta</Label>
              <div className="flex items-center gap-3 h-10">
                <button
                  onClick={() => onResponseThresholdChange(30)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    responseThreshold === 30 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  ≥30%
                </button>
                <button
                  onClick={() => onResponseThresholdChange(50)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    responseThreshold === 50 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  ≥50%
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outcome Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Protocolos</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalRecords}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Com Baseline</span>
            </div>
            <p className="text-2xl font-bold mt-2">{overview?.n_with_baseline || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Follow-up 1m</span>
            </div>
            <p className="text-2xl font-bold mt-2">{overview?.n_with_followup_m1 || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Follow-up 3m</span>
            </div>
            <p className="text-2xl font-bold mt-2">{overview?.n_with_followup_m3 || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Follow-up 6m+</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {(overview?.n_with_followup_m6 || 0) + (overview?.n_with_followup_m12 || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outcomes by Cluster Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resultados por Cluster
          </CardTitle>
          <CardDescription>
            Métricas de dor e resposta clínica agregadas (mín. 5 casos com outcomes por cluster)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clusters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum cluster com outcomes suficientes.</p>
              <p className="text-sm">Aguarde mais registros de baseline + follow-up para visualizar resultados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Cluster</th>
                    <th className="text-center py-2 px-2">N Total</th>
                    <th className="text-center py-2 px-2">
                      Δ Dor ({TIMEPOINT_LABELS[selectedTimepoint]})
                    </th>
                    <th className="text-center py-2 px-2">
                      Resp. ≥{responseThreshold}% ({TIMEPOINT_LABELS[selectedTimepoint]})
                    </th>
                    <th className="text-center py-2 px-2">Δ Função (3m)</th>
                    <th className="text-center py-2 px-2">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {clusters.map((cluster: ClusterOutcomeAggregation, idx: number) => {
                    // Get metrics for selected timepoint
                    const deltaPain = cluster[`mean_delta_pain_${selectedTimepoint}` as keyof ClusterOutcomeAggregation] as number | null;
                    const nPain = cluster[`n_outcomes_used_pain_${selectedTimepoint}` as keyof ClusterOutcomeAggregation] as number;
                    const responseRate = responseThreshold === 30
                      ? cluster[`response_rate_pain_30_${selectedTimepoint}` as keyof ClusterOutcomeAggregation] as number | null
                      : cluster[`response_rate_pain_50_${selectedTimepoint}` as keyof ClusterOutcomeAggregation] as number | null;
                    const trend = cluster[`trend_${selectedTimepoint}` as keyof ClusterOutcomeAggregation] as TrendInfo;
                    
                    return (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">
                          {humanReadableClusterKey(cluster.cluster_key)}
                        </td>
                        <td className="text-center py-2 px-2">
                          <Badge variant="outline">{cluster.case_count}</Badge>
                        </td>
                        <td className="text-center py-2 px-2">
                          {deltaPain !== null ? (
                            <span className={deltaPain > 0 ? 'text-clinical-safe font-medium' : 'text-muted-foreground'}>
                              {deltaPain > 0 ? '-' : '+'}{Math.abs(deltaPain)} pts
                              <span className="text-xs text-muted-foreground ml-1">(n={nPain})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Dados insuf.{nPain > 0 ? ` (n=${nPain})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="text-center py-2 px-2">
                          {responseRate !== null ? (
                            <span>
                              <Badge 
                                variant={responseRate >= 50 ? 'default' : 'secondary'}
                                className={responseRate >= 50 ? 'bg-clinical-safe' : ''}
                              >
                                {responseRate}%
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-1">(n={nPain})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Dados insuf.</span>
                          )}
                        </td>
                        <td className="text-center py-2 px-2">
                          {cluster.mean_delta_function_m3 !== null ? (
                            <span className={cluster.mean_delta_function_m3 > 0 ? 'text-clinical-safe' : 'text-muted-foreground'}>
                              {cluster.mean_delta_function_m3 > 0 ? '+' : ''}{cluster.mean_delta_function_m3}
                              <span className="text-xs text-muted-foreground ml-1">(n={cluster.n_outcomes_used_function_m3})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="text-center py-2 px-2">
                          <TrendBadge trend={trend} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
