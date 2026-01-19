/**
 * Performance Dashboard - Private Clinical Performance Seal
 * 
 * Phase 6 of CSE: Private benchmark comparing professional to national average
 * Two independent axes: Adherence/Volume and Clinical Results
 * 
 * Features:
 * - Separate metrics for Axis A (followup, eligibility, volume)
 * - Conservative mode for low n (10-19 cases)
 * - N shown for all clusters
 * - Non-punitive copy for below_average
 * - M3 as default timepoint
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Lock, TrendingUp, TrendingDown, Minus, Target, Activity, 
  CheckCircle2, AlertTriangle, XCircle, Info, BarChart3, FlaskConical
} from 'lucide-react';
import { 
  usePerformanceBenchmark, 
  PerformanceStatus, 
  AdherenceSeal,
  AdherenceMetric,
  ResultsSeal,
  ClusterResultSeal,
  ConfidenceLevel,
  getAdherenceMessage,
  getAdherenceMetricMessage,
  getResultsMessage,
  getClusterResultMessage,
  DEFAULT_TIMEPOINT,
} from '@/hooks/usePerformanceBenchmark';
import { OutcomeTimepoint } from '@/hooks/useCollectiveOutcomes';

const TIMEPOINT_LABELS: Record<OutcomeTimepoint, string> = {
  baseline: 'Baseline',
  m1: '1 mês',
  m3: '3 meses (padrão)',
  m6: '6 meses',
  m12: '12 meses',
};

function StatusIcon({ status }: { status: PerformanceStatus }) {
  switch (status) {
    case 'above_average':
      return <CheckCircle2 className="h-6 w-6 text-clinical-safe" />;
    case 'within_average':
      return <Minus className="h-6 w-6 text-clinical-warning" />;
    case 'below_average':
      return <AlertTriangle className="h-6 w-6 text-destructive" />;
    default:
      return <Info className="h-6 w-6 text-muted-foreground" />;
  }
}

function SmallStatusIcon({ status }: { status: PerformanceStatus }) {
  switch (status) {
    case 'above_average':
      return <CheckCircle2 className="h-4 w-4 text-clinical-safe" />;
    case 'within_average':
      return <Minus className="h-4 w-4 text-clinical-warning" />;
    case 'below_average':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status, isConservative = false }: { status: PerformanceStatus; isConservative?: boolean }) {
  const config: Record<PerformanceStatus, { label: string; className: string }> = {
    above_average: { 
      label: isConservative ? 'Dados iniciais' : 'Acima da média nacional', 
      className: isConservative 
        ? 'bg-clinical-warning/20 text-clinical-warning border-clinical-warning/30'
        : 'bg-clinical-safe/20 text-clinical-safe border-clinical-safe/30' 
    },
    within_average: { 
      label: isConservative ? 'Dados iniciais' : 'Dentro da média nacional', 
      className: 'bg-clinical-warning/20 text-clinical-warning border-clinical-warning/30' 
    },
    below_average: { 
      label: isConservative ? 'Dados iniciais' : 'Oportunidade de otimização', 
      className: isConservative 
        ? 'bg-clinical-warning/20 text-clinical-warning border-clinical-warning/30'
        : 'bg-destructive/20 text-destructive border-destructive/30' 
    },
    insufficient_data: { 
      label: 'Dados insuficientes', 
      className: 'bg-muted text-muted-foreground' 
    },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={`${className} text-sm px-3 py-1`}>
      {label}
    </Badge>
  );
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  if (level === 'high') return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-clinical-warning/10 text-clinical-warning border-clinical-warning/30 text-xs">
            <FlaskConical className="h-3 w-3 mr-1" />
            Preliminar
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-48">
            Amostra pequena (10-19 casos). Resultados podem variar com mais dados.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DeltaIndicator({ deltaPercent }: { deltaPercent: number | null }) {
  if (deltaPercent === null) return null;
  
  const pct = Math.round(deltaPercent * 100);
  const isPositive = pct > 0;
  const Icon = isPositive ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  const colorClass = isPositive ? 'text-clinical-safe' : pct < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="h-5 w-5" />
      <span className="text-xl font-bold">{isPositive ? '+' : ''}{pct}%</span>
    </div>
  );
}

function SmallDeltaIndicator({ deltaPercent }: { deltaPercent: number | null }) {
  if (deltaPercent === null) return <span className="text-muted-foreground text-sm">—</span>;
  
  const pct = Math.round(deltaPercent * 100);
  const isPositive = pct > 0;
  const colorClass = isPositive ? 'text-clinical-safe' : pct < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {isPositive ? '+' : ''}{pct}%
    </span>
  );
}

function AdherenceMetricCard({ metric }: { metric: AdherenceMetric }) {
  const message = getAdherenceMetricMessage(metric);
  const isPercentage = metric.label.includes('Follow-up') || metric.label.includes('Elegibilidade');
  
  return (
    <div className="p-3 rounded-lg bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{metric.label}</span>
        <SmallStatusIcon status={metric.status} />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold text-foreground">
            {metric.professional}{isPercentage ? '%' : ''}
          </span>
          <span className="text-muted-foreground mx-1">vs</span>
          <span className="text-muted-foreground">
            {metric.national}{isPercentage ? '%' : ''}
          </span>
        </div>
        <SmallDeltaIndicator deltaPercent={metric.deltaPercent} />
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function AdherenceSealCard({ seal }: { seal: AdherenceSeal }) {
  const message = getAdherenceMessage(seal);

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Aderência ao REGHEN</CardTitle>
              <CardDescription>Volume e qualidade de registros</CardDescription>
            </div>
          </div>
          <StatusIcon status={seal.overallStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={seal.overallStatus} />
          <DeltaIndicator deltaPercent={seal.overallDeltaPercent} />
        </div>

        <p className="text-sm text-muted-foreground">{message}</p>

        {/* Separate metrics for each dimension */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">Métricas individuais:</h4>
          <div className="grid gap-3">
            <AdherenceMetricCard metric={seal.followupMetric} />
            <AdherenceMetricCard metric={seal.eligibilityMetric} />
            <AdherenceMetricCard metric={seal.volumeMetric} />
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          Baseado em {seal.nCasesUsed} casos registrados
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsSealCard({ 
  seal, 
  selectedTimepoint, 
  onTimepointChange 
}: { 
  seal: ResultsSeal; 
  selectedTimepoint: OutcomeTimepoint;
  onTimepointChange: (tp: OutcomeTimepoint) => void;
}) {
  const message = getResultsMessage(seal);
  const isDefault = selectedTimepoint === DEFAULT_TIMEPOINT;

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Resultados Clínicos</CardTitle>
              <CardDescription>Comparação com média nacional por cluster</CardDescription>
            </div>
          </div>
          <StatusIcon status={seal.displayStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={seal.displayStatus} isConservative={seal.hasConservativeClusters} />
            {seal.hasConservativeClusters && (
              <ConfidenceBadge level="preliminary" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <DeltaIndicator deltaPercent={seal.deltaPercent} />
            <div className="flex items-center gap-1">
              <Select value={selectedTimepoint} onValueChange={(v) => onTimepointChange(v as OutcomeTimepoint)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m1">M1</SelectItem>
                  <SelectItem value="m3">M3 (oficial)</SelectItem>
                  <SelectItem value="m6">M6</SelectItem>
                  <SelectItem value="m12">M12</SelectItem>
                </SelectContent>
              </Select>
              {!isDefault && (
                <Badge variant="secondary" className="text-xs">Análise complementar</Badge>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{message}</p>

        {/* Show clusters considered and total n */}
        {seal.clusters.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Clusters avaliados (n≥10):</h4>
              <Badge variant="secondary" className="text-xs">
                Total: n={seal.nTotalCases}
              </Badge>
            </div>
            {seal.clusters.map((cluster) => (
              <ClusterResultCard key={cluster.clusterKey} cluster={cluster} />
            ))}
          </div>
        )}

        {seal.clusters.length === 0 && seal.status === 'insufficient_data' && (
          <div className="text-sm text-muted-foreground py-4 text-center">
            <Info className="h-5 w-5 mx-auto mb-2" />
            Nenhum cluster com n≥10 casos comparáveis encontrado.
          </div>
        )}

        {/* Summary of clusters considered */}
        {seal.clustersConsidered.length > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
            <span className="font-medium">Clusters considerados:</span>{' '}
            {seal.clustersConsidered.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClusterResultCard({ cluster }: { cluster: ClusterResultSeal }) {
  const message = getClusterResultMessage(cluster);

  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <StatusIcon status={cluster.displayStatus} />
          <span className="font-medium text-sm">{cluster.clusterLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {cluster.isConservativeMode && (
            <ConfidenceBadge level={cluster.confidenceLevel} />
          )}
          <Badge variant="secondary" className="text-xs">
            n={cluster.nCasesUsed} (nacional: {cluster.nNationalCases})
          </Badge>
          <DeltaIndicator deltaPercent={cluster.deltaPercent} />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">{message}</p>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <MetricComparison
          label="Δ Dor média"
          professional={cluster.metrics.professionalMeanDeltaPain?.toFixed(1) || '—'}
          national={cluster.metrics.nationalMeanDeltaPain?.toFixed(1) || '—'}
        />
        <MetricComparison
          label="Resposta ≥30%"
          professional={cluster.metrics.professionalResponseRate30 !== null ? `${cluster.metrics.professionalResponseRate30}%` : '—'}
          national={cluster.metrics.nationalResponseRate30 !== null ? `${cluster.metrics.nationalResponseRate30}%` : '—'}
        />
      </div>

      {/* Timepoint used */}
      <div className="text-xs text-muted-foreground pt-1">
        Timepoint: {cluster.timepointUsed.toUpperCase()}
      </div>
    </div>
  );
}

function MetricComparison({ 
  label, 
  professional, 
  national 
}: { 
  label: string; 
  professional: string; 
  national: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm">
        <span className="font-semibold text-foreground">{professional}</span>
        <span className="text-muted-foreground mx-1">vs</span>
        <span className="text-muted-foreground">{national}</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PerformanceDashboard() {
  const [selectedTimepoint, setSelectedTimepoint] = useState<OutcomeTimepoint>(DEFAULT_TIMEPOINT);
  const { data, isLoading, error } = usePerformanceBenchmark(selectedTimepoint);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Minha Performance Clínica
        </h1>
        <p className="text-muted-foreground">
          Comparação privada com a média nacional em casos clínicos semelhantes
        </p>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Selo privado e formativo.</strong> Estes dados são visíveis apenas para você.
          Não se trata de ranking nem comparação nominal — é feedback clínico estatisticamente 
          ajustado para apoiar sua prática baseada em evidências.
        </AlertDescription>
      </Alert>

      {/* Official timepoint note */}
      <Alert variant="default" className="bg-muted/30 border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Selo principal: M3 (3 meses).</strong> Este é o timepoint oficial para avaliação de performance.
          Outros timepoints (M1, M6, M12) são análises complementares.
        </AlertDescription>
      </Alert>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados de performance. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      ) : !data?.isEligible ? (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Dados insuficientes para benchmark</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {data?.eligibilityReason || 'Continue registrando protocolos padronizados e coletando outcomes para receber seu selo de performance clínica.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <AdherenceSealCard seal={data.adherenceSeal} />
          <ResultsSealCard 
            seal={data.resultsSeal} 
            selectedTimepoint={selectedTimepoint}
            onTimepointChange={setSelectedTimepoint}
          />
        </div>
      )}

      {/* Methodology Note */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Metodologia:</strong> O selo compara suas métricas com a média nacional 
                de todos os profissionais REGHEN em clusters clínicos semelhantes (mesma patologia, 
                região, gravidade). Apenas casos com baseline e follow-up completos são considerados.
              </p>
              <p>
                <strong>Classificação:</strong>{' '}
                <span className="text-clinical-safe">🟢 ≥+15%</span> acima da média,{' '}
                <span className="text-clinical-warning">🟡 ±15%</span> dentro da média,{' '}
                <span className="text-destructive">🔴 ≤-15%</span> oportunidade de otimização.
              </p>
              <p>
                <strong>Modo conservador:</strong> Clusters com 10-19 casos exibem{' '}
                <span className="text-clinical-warning">🟡 dados iniciais</span> independente do resultado,
                indicando que a estimativa pode variar com mais dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
