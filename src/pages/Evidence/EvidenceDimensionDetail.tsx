import { useParams, Link } from 'react-router-dom';
import { useEvidenceDimensionDetail } from '@/hooks/useEvidenceEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Database, 
  RefreshCw, 
  AlertTriangle,
  Calendar,
  Hash,
  TrendingDown,
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  K_MIN, 
  getInsufficientDataMessage, 
  TIME_WINDOW_LABELS,
  LINK_TYPE_LABELS,
  LINK_TYPE_COLORS,
  EvidenceSnapshot
} from '@/types/evidence-engine';

export default function EvidenceDimensionDetail() {
  const { id } = useParams<{ id: string }>();
  const { dimension, snapshots, links, loading, error, refetch } = useEvidenceDimensionDetail(id);

  // Get latest snapshot per time window
  const latestAllTime = snapshots.find(s => s.time_window === 'all_time');
  const latestLast12 = snapshots.find(s => s.time_window === 'last_12_months');

  const renderMetricCard = (label: string, value: number | null, icon: React.ReactNode, suffix?: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-2xl font-bold">
            {value !== null ? `${value}${suffix || ''}` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const renderSnapshotMetrics = (snapshot: EvidenceSnapshot | undefined) => {
    if (!snapshot) {
      return (
        <Alert className="bg-muted/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhum snapshot disponível para esta janela temporal.
          </AlertDescription>
        </Alert>
      );
    }

    if (snapshot.n_cases_total < K_MIN) {
      return (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>{getInsufficientDataMessage()}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {/* Primary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderMetricCard('N total', snapshot.n_cases_total, <Users className="h-5 w-5 text-primary" />)}
          {renderMetricCard('Com D30', snapshot.n_with_followup_30, <Activity className="h-5 w-5 text-blue-500" />)}
          {renderMetricCard('Com D90', snapshot.n_with_followup_90, <Activity className="h-5 w-5 text-green-500" />)}
          {renderMetricCard('Com D365', snapshot.n_with_followup_365, <Activity className="h-5 w-5 text-purple-500" />)}
        </div>

        {/* Pain metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Métricas de Dor (NRS 0-10)
            </CardTitle>
            <CardDescription>
              Estatísticas descritivas do score de dor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead className="text-right">Baseline</TableHead>
                  <TableHead className="text-right">D90</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Média</TableCell>
                  <TableCell className="text-right font-medium">
                    {snapshot.pain_baseline_mean !== null ? snapshot.pain_baseline_mean.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {snapshot.pain_followup_90_mean !== null ? snapshot.pain_followup_90_mean.toFixed(1) : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mediana</TableCell>
                  <TableCell className="text-right font-medium">
                    {snapshot.pain_baseline_median !== null ? snapshot.pain_baseline_median.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {snapshot.pain_followup_90_median !== null ? snapshot.pain_followup_90_median.toFixed(1) : '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            {snapshot.pct_improved_90 !== null && (
              <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-sm text-muted-foreground">% Melhora ≥2pts em D90</p>
                <p className="text-2xl font-bold text-green-500">
                  {snapshot.pct_improved_90.toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Governance info */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Governança do Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><strong>Versão:</strong> v{snapshot.version}</p>
            <p><strong>Computado em:</strong> {format(new Date(snapshot.computed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
            <p className="break-all"><strong>Hash:</strong> <code className="text-xs">{snapshot.canonical_hash.slice(0, 32)}...</code></p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (error || !dimension) {
    return (
      <div className="space-y-6">
        <Link to="/evidence/dimensions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Dimensão não encontrada'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/evidence/dimensions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            {dimension.pathology_tag} × {dimension.technique_tag}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{dimension.pathology_tag}</Badge>
            <Badge variant="outline">{dimension.technique_tag}</Badge>
            {dimension.region_tag && (
              <Badge variant="outline" className="bg-muted">{dimension.region_tag}</Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-muted/50 border-muted">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Dados observacionais agregados. Não comparativos. Não inferenciais.
        </AlertDescription>
      </Alert>

      {/* Time window tabs */}
      <Tabs defaultValue="all_time">
        <TabsList>
          <TabsTrigger value="all_time">{TIME_WINDOW_LABELS.all_time}</TabsTrigger>
          <TabsTrigger value="last_12_months">{TIME_WINDOW_LABELS.last_12_months}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all_time" className="mt-4">
          {renderSnapshotMetrics(latestAllTime)}
        </TabsContent>
        
        <TabsContent value="last_12_months" className="mt-4">
          {renderSnapshotMetrics(latestLast12)}
        </TabsContent>
      </Tabs>

      {/* Linked curations */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Curadorias Vinculadas</CardTitle>
            <CardDescription>
              Artigos científicos relacionados a esta dimensão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge className={LINK_TYPE_COLORS[link.link_type]}>
                      {LINK_TYPE_LABELS[link.link_type]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Curação {link.curation_id.slice(0, 8)}...
                    </span>
                  </div>
                  <Link to={`/curadoria/${link.curation_id}`}>
                    <Button variant="ghost" size="sm">Ver curadoria</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
