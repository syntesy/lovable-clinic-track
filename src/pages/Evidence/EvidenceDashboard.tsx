import { useEvidenceDashboard, useComputeEvidence } from '@/hooks/useEvidenceEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Database, 
  Calendar, 
  RefreshCw, 
  AlertTriangle,
  ChevronRight,
  FlaskConical,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function EvidenceDashboard() {
  const { metrics, loading, error, refetch } = useEvidenceDashboard();
  const { compute, computing, error: computeError, result } = useComputeEvidence();
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!data);
      }
    }
    checkAdmin();
  }, []);

  const handleCompute = async () => {
    const result = await compute();
    if (result) {
      toast({
        title: 'Evidência computada',
        description: `${result.dimensionsProcessed} dimensões processadas, ${result.snapshotsCreated} snapshots criados.`,
      });
      refetch();
    } else {
      toast({
        title: 'Erro ao computar',
        description: computeError || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Evidence Engine Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Evidence Engine powered by SYNTESY Clinical Registry™
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={handleCompute} disabled={computing}>
              <Activity className={`h-4 w-4 mr-1 ${computing ? 'animate-pulse' : ''}`} />
              {computing ? 'Computando...' : 'Recalcular Evidência'}
            </Button>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-muted/50 border-muted">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Dados observacionais agregados. Não comparativos. Não inferenciais.
          O SYNTESY Evidence Engine™ fornece análise descritiva apenas.
        </AlertDescription>
      </Alert>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Computation result */}
      {result && (
        <Alert className="bg-green-500/10 border-green-500/30">
          <AlertDescription>
            ✅ Última computação: {result.dimensionsProcessed} dimensões, {result.snapshotsCreated} snapshots criados.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dimensões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{metrics?.totalDimensions || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos Agregados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{metrics?.totalCasesAggregated || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dimensões com D90
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{metrics?.dimensionsWithD90 || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Atualização
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium">
                  {metrics?.lastUpdated 
                    ? format(new Date(metrics.lastUpdated), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : 'Nunca'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/evidence/dimensions">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Dimensões de Evidência
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Visualizar agregações por Patologia × Técnica
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/curadoria">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Curadoria Científica
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Artigos com dados observacionais vinculados
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sobre o SYNTESY Evidence Engine™
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            O Evidence Engine agrega dados anônimos do SYNTESY Clinical Registry™ para 
            fornecer estatísticas descritivas por combinação de Patologia × Técnica.
          </p>
          <p>
            <strong>Limitações importantes:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Dados observacionais — não constitui ensaio clínico comparativo</li>
            <li>Agregações com menos de 10 casos são ocultadas (k-anonymity)</li>
            <li>Não há inferência causal ou recomendação terapêutica</li>
            <li>Snapshots são versionados e imutáveis (append-only)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
