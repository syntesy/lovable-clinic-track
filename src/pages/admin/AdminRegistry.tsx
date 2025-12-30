import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FlaskConical, 
  ShieldCheck, 
  BarChart3, 
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useRegistryAggregatedData } from '@/hooks/useRegistryAggregatedData';
import { Layout } from '@/components/Layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdminRegistry() {
  const navigate = useNavigate();
  const { metrics, loading, error, isAdmin, refresh, MIN_SAMPLE_THRESHOLD } = useRegistryAggregatedData();

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <ShieldCheck className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Este painel é acessível apenas para administradores.
          </p>
          <Button variant="outline" onClick={() => navigate('/pacientes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button onClick={refresh}>Tentar novamente</Button>
        </div>
      </Layout>
    );
  }

  const snapshotTypeLabels: Record<string, string> = {
    triagem: 'Triagem',
    score_inicial: 'Score Inicial',
    exames_solicitados: 'Exames Solicitados',
    exames_registrados: 'Exames Registrados',
    score_atualizado: 'Score Atualizado',
    procedimento_planejado: 'Procedimento Planejado',
    procedimento_realizado: 'Procedimento Realizado',
    follow_up: 'Follow-up'
  };

  const snapshotTypeData = metrics?.snapshotsByType 
    ? Object.entries(metrics.snapshotsByType)
        .filter(([_, count]) => count >= MIN_SAMPLE_THRESHOLD)
        .map(([type, count]) => ({
          name: snapshotTypeLabels[type] || type,
          value: count
        }))
    : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Orthoregen Clinical Registry™</h1>
              <p className="text-sm text-muted-foreground">
                Dados agregados e anonimizados para fins científicos
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={refresh}>
            Atualizar
          </Button>
        </div>

        {/* Privacy Notice */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-green-700 dark:text-green-400">Privacidade garantida:</span>
              <span className="text-green-600 dark:text-green-500 ml-1">
                Todos os dados são agregados e anonimizados. Nenhuma informação individual de paciente ou profissional é exibida.
                Métricas com menos de {MIN_SAMPLE_THRESHOLD} casos são ocultadas.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Casos Elegíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics?.totalEligibleCases && metrics.totalEligibleCases >= MIN_SAMPLE_THRESHOLD 
                  ? metrics.totalEligibleCases 
                  : `< ${MIN_SAMPLE_THRESHOLD}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pacientes com consentimento ativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total de Snapshots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics?.totalSnapshots && metrics.totalSnapshots >= MIN_SAMPLE_THRESHOLD 
                  ? metrics.totalSnapshots 
                  : `< ${MIN_SAMPLE_THRESHOLD}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registros de etapas clínicas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Etapas Capturadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {snapshotTypeData.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tipos de snapshots com dados suficientes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Snapshots por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Etapa Clínica</CardTitle>
              <CardDescription>
                Quantidade de registros por tipo de etapa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshotTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={snapshotTypeData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Dados insuficientes para exibição
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição de Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Scores</CardTitle>
              <CardDescription>
                Faixas de score FisioRegen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.scoreDistribution && metrics.scoreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.scoreDistribution}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ range, count }) => `${range}: ${count}`}
                    >
                      {metrics.scoreDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Dados insuficientes para exibição
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tendência Mensal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendência Mensal de Casos
              </CardTitle>
              <CardDescription>
                Evolução de casos elegíveis ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.monthlyTrend && metrics.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics.monthlyTrend}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="cases" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Dados insuficientes para exibição de tendência
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Separator />
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            <strong>Orthoregen Clinical Registry™</strong> - Dados para fins científicos e de pesquisa.
          </p>
          <p>
            Todos os acessos a este painel são registrados para auditoria (LGPD).
          </p>
        </div>
      </div>
    </Layout>
  );
}
