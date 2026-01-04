/**
 * REGENAPP Career Engine™ - Dashboard Principal
 * 
 * IMPORTANTE: Este painel apresenta apenas métricas operacionais
 * sobre a prática profissional. NÃO contém análises clínicas,
 * recomendações terapêuticas ou dados de outros profissionais.
 */

import { useCareerEngine } from '@/hooks/useCareerEngine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  TrendingUp, 
  Award, 
  Bell, 
  Lightbulb, 
  Target,
  Users,
  ClipboardCheck,
  BookOpen,
  Activity,
  Shield,
  X
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  formatPeriod,
  CERTIFICATION_LEVEL_LABELS,
  CERTIFICATION_TYPE_LABELS,
  CERTIFICATION_LEVEL_COLORS,
  ALERT_SEVERITY_COLORS
} from '@/types/career-engine';

export default function CareerDashboard() {
  const {
    isLoading,
    error,
    dashboardMetrics,
    radarData,
    timelineData,
    certifications,
    alerts,
    opportunities,
    refreshMetrics,
    dismissAlert
  } = useCareerEngine();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-teal" />
            REGENAPP Career Engine™
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas operacionais da sua prática profissional
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshMetrics}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Disclaimer */}
      <Alert className="border-muted bg-muted/20">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-xs text-muted-foreground">
          Este painel apresenta apenas métricas operacionais sobre sua prática. 
          Não contém análises clínicas, recomendações terapêuticas ou comparações identificáveis com outros profissionais.
        </AlertDescription>
      </Alert>

      {/* Insufficient Data Warning */}
      {dashboardMetrics && dashboardMetrics.totalPatients < 5 && (
        <Alert className="border-gold/30 bg-gold/10">
          <AlertDescription className="text-xs text-gold">
            <strong>Dados insuficientes:</strong> Com menos de 5 pacientes cadastrados, as métricas e percentis 
            podem não refletir padrões estatisticamente significativos. Continue desenvolvendo sua prática para 
            obter insights mais precisos.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              Pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {dashboardMetrics?.totalPatients || 0}
            </div>
            {dashboardMetrics && dashboardMetrics.totalPatients < 5 && (
              <p className="text-xs text-gold mt-1">Dados insuficientes</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Triagens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {dashboardMetrics?.totalScreenings || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5" />
              Follow-ups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {dashboardMetrics?.totalFollowups || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardMetrics?.followupRate || 0}% completados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Target className="h-3.5 w-3.5" />
              Maturidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-teal">
              {dashboardMetrics?.practiceMaturityScore || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">pontos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="certifications">Certificações</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {alerts.filter(a => !a.is_read).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {alerts.filter(a => !a.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal" />
                  Radar de Evolução Profissional
                </CardTitle>
                <CardDescription>
                  Visão multidimensional da sua prática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <Radar
                        name="Seu Perfil"
                        dataKey="value"
                        stroke="hsl(var(--teal))"
                        fill="hsl(var(--teal))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gold" />
                  Indicadores de Prática
                </CardTitle>
                <CardDescription>
                  Métricas operacionais detalhadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MetricBar 
                  label="Taxa de Follow-up" 
                  value={dashboardMetrics?.followupRate || 0} 
                  color="teal"
                />
                <MetricBar 
                  label="Completude de Registro" 
                  value={dashboardMetrics?.registryCompletenessRate || 0} 
                  color="gold"
                />
                <MetricBar 
                  label="Adesão Científica" 
                  value={dashboardMetrics?.scientificAdherenceRate || 0} 
                  color="teal"
                />
                <MetricBar 
                  label="Coerência Profissional" 
                  value={dashboardMetrics?.consistencyScore || 0} 
                  color="gold"
                />
                <MetricBar 
                  label="Complexidade Média" 
                  value={dashboardMetrics?.avgComplexity || 0} 
                  color="teal"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal" />
                Linha do Tempo de Maturidade
              </CardTitle>
              <CardDescription>
                Evolução dos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={(p) => formatPeriod(p).slice(0, 3)}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(p) => formatPeriod(p as string)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="maturity"
                      name="Maturidade"
                      stroke="hsl(var(--teal))"
                      fill="hsl(var(--teal))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      name="Volume"
                      stroke="hsl(var(--gold))"
                      fill="hsl(var(--gold))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-gold" />
                Certificações
              </CardTitle>
              <CardDescription>
                Reconhecimentos por trajetória longitudinal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certifications.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Continue desenvolvendo sua prática para conquistar certificações.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Certificações são baseadas em trajetória longitudinal, não em mérito clínico.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certifications.map((cert) => (
                    <div 
                      key={cert.id}
                      className="p-4 rounded-lg border border-border bg-card/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className={CERTIFICATION_LEVEL_COLORS[cert.certification_level]}>
                            {CERTIFICATION_LEVEL_LABELS[cert.certification_level]}
                          </Badge>
                          <h4 className="font-medium mt-2">
                            {CERTIFICATION_TYPE_LABELS[cert.certification_type]}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Conquistado em {new Date(cert.earned_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Award className="h-8 w-8 text-gold" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-gold" />
                Alertas Educativos
              </CardTitle>
              <CardDescription>
                Sugestões para desenvolvimento profissional (não clínico)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum alerta no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-lg border ${ALERT_SEVERITY_COLORS[alert.severity]} flex items-start justify-between gap-4`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs mt-1 opacity-80">{alert.message}</p>
                        <p className="text-xs mt-2 opacity-60">
                          {formatPeriod(alert.period)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-60 hover:opacity-100"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-teal" />
                  Oportunidades
                </CardTitle>
                <CardDescription>
                  Sugestões de desenvolvimento (não comerciais)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <div 
                      key={opp.id}
                      className="p-4 rounded-lg border border-border bg-card/50"
                    >
                      <Badge variant="outline" className="mb-2">
                        {opp.opportunity_type}
                      </Badge>
                      <h4 className="font-medium text-sm">{opp.title}</h4>
                      {opp.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {opp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Disclaimer */}
      <div className="border-t border-border pt-4 mt-8">
        <p className="text-xs text-muted-foreground text-center">
          O Career Engine não avalia pacientes, não decide tratamentos e não interfere no cuidado clínico.
          Existe exclusivamente para estruturar, proteger e desenvolver o profissional.
        </p>
      </div>
    </div>
  );
}

// Helper component for metric bars
function MetricBar({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: 'teal' | 'gold';
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            color === 'teal' ? 'bg-teal' : 'bg-gold'
          }`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
