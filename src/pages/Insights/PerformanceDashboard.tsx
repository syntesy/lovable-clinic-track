/**
 * Performance Dashboard - Private Clinical Performance Seal
 * 
 * Phase 6 of CSE: Private benchmark comparing professional to national average
 * Two independent axes: Adherence/Volume and Clinical Results
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Lock, TrendingUp, TrendingDown, Minus, Target, Activity, 
  CheckCircle2, AlertTriangle, XCircle, Info, BarChart3
} from 'lucide-react';
import { 
  usePerformanceBenchmark, 
  PerformanceStatus, 
  AdherenceSeal,
  ResultsSeal,
  ClusterResultSeal,
  getAdherenceMessage,
  getResultsMessage,
  getClusterResultMessage,
} from '@/hooks/usePerformanceBenchmark';
import { OutcomeTimepoint } from '@/hooks/useCollectiveOutcomes';

const TIMEPOINT_LABELS: Record<OutcomeTimepoint, string> = {
  baseline: 'Baseline',
  m1: '1 mês',
  m3: '3 meses',
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

function StatusBadge({ status }: { status: PerformanceStatus }) {
  const config: Record<PerformanceStatus, { label: string; className: string }> = {
    above_average: { 
      label: 'Acima da média nacional', 
      className: 'bg-clinical-safe/20 text-clinical-safe border-clinical-safe/30' 
    },
    within_average: { 
      label: 'Dentro da média nacional', 
      className: 'bg-clinical-warning/20 text-clinical-warning border-clinical-warning/30' 
    },
    below_average: { 
      label: 'Abaixo da média nacional', 
      className: 'bg-destructive/20 text-destructive border-destructive/30' 
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
          <StatusIcon status={seal.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={seal.status} />
          <DeltaIndicator deltaPercent={seal.deltaPercent} />
        </div>

        <p className="text-sm text-muted-foreground">{message}</p>

        {seal.metrics && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <MetricComparison
              label="Follow-up M3"
              professional={`${seal.metrics.professionalFollowupRate}%`}
              national={`${seal.metrics.nationalFollowupRate}%`}
            />
            <MetricComparison
              label="Elegibilidade"
              professional={`${seal.metrics.professionalEligibilityRate}%`}
              national={`${seal.metrics.nationalEligibilityRate}%`}
            />
            <MetricComparison
              label="Protocolos/mês"
              professional={seal.metrics.professionalMonthlyProtocols.toFixed(1)}
              national={seal.metrics.nationalMonthlyProtocols.toFixed(1)}
            />
          </div>
        )}

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
          <StatusIcon status={seal.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={seal.status} />
          <div className="flex items-center gap-3">
            <DeltaIndicator deltaPercent={seal.deltaPercent} />
            <Select value={selectedTimepoint} onValueChange={(v) => onTimepointChange(v as OutcomeTimepoint)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m1">M1</SelectItem>
                <SelectItem value="m3">M3</SelectItem>
                <SelectItem value="m6">M6</SelectItem>
                <SelectItem value="m12">M12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{message}</p>

        {seal.clusters.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Clusters com dados suficientes (n≥10):</h4>
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

        <div className="text-xs text-muted-foreground pt-2">
          Total: {seal.nTotalCases} casos com outcomes válidos
        </div>
      </CardContent>
    </Card>
  );
}

function ClusterResultCard({ cluster }: { cluster: ClusterResultSeal }) {
  const message = getClusterResultMessage(cluster);

  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon status={cluster.status} />
          <span className="font-medium text-sm">{cluster.clusterLabel}</span>
          <Badge variant="secondary" className="text-xs">n={cluster.nCasesUsed}</Badge>
        </div>
        <DeltaIndicator deltaPercent={cluster.deltaPercent} />
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
  const [selectedTimepoint, setSelectedTimepoint] = useState<OutcomeTimepoint>('m3');
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
                região, gravidade).
              </p>
              <p>
                Classificação: <span className="text-clinical-safe">🟢 ≥+15%</span> acima da média, 
                <span className="text-clinical-warning"> 🟡 ±15%</span> dentro da média, 
                <span className="text-destructive"> 🔴 ≤-15%</span> abaixo da média.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
