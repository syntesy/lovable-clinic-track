import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  FlaskConical, Users, Activity, BarChart3, TrendingUp, 
  Shield, Lock, AlertTriangle, RefreshCw, FileText, Eye,
  PieChart, MapPin, Stethoscope, Download
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

// Threshold mínimo para exibir dados
const MIN_SAMPLE_THRESHOLD = 10;

interface AggregatedData {
  totalEligibleCases: number;
  casesByRegion: Record<string, number>;
  casesByDiagnosis: Record<string, number>;
  scoreDistribution: { range: string; count: number }[];
  flagsFrequency: Record<string, number>;
  painEvolution: { timepoint: string; avgPain: number; count: number }[];
  procedureTypes: Record<string, number>;
}

const SCORE_RANGES = [
  { min: 0, max: 39, label: '0-39 (Baixo)' },
  { min: 40, max: 59, label: '40-59 (Moderado)' },
  { min: 60, max: 79, label: '60-79 (Bom)' },
  { min: 80, max: 100, label: '80-100 (Excelente)' }
];

const REGION_LABELS: Record<string, string> = {
  joelho: 'Joelho',
  ombro: 'Ombro',
  quadril: 'Quadril',
  cotovelo: 'Cotovelo',
  tornozelo: 'Tornozelo',
  mao: 'Mão/Punho',
  coluna: 'Coluna',
  outro: 'Outro'
};

const DIAGNOSIS_LABELS: Record<string, string> = {
  artrose: 'Artrose',
  tendinopatia: 'Tendinopatia',
  lesao_muscular: 'Lesão Muscular',
  lesao_ligamentar: 'Lesão Ligamentar',
  menisco: 'Lesão de Menisco',
  hernia_disco: 'Hérnia de Disco',
  outro: 'Outro'
};

const FLAG_LABELS: Record<string, string> = {
  red_flags_present: 'Red Flags',
  NSAID_recent: 'AINE Recente',
  steroid_oral_recent: 'Corticoide Oral Recente',
  steroid_infiltration_recent: 'Infiltração Corticoide Recente',
  anticoagulant: 'Anticoagulante',
  smoker: 'Tabagista',
  high_BMI: 'IMC Elevado'
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AdminRegistryDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState<AggregatedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        setIsAdmin(false);
        return false;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.session.user.id);

      const hasAdmin = roles?.some(r => r.role === 'admin') ?? false;
      setIsAdmin(hasAdmin);
      return hasAdmin;
    } catch {
      setIsAdmin(false);
      return false;
    }
  }, []);

  const logAccess = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      await supabase.from('registry_access_logs').insert({
        user_id: session.session.user.id,
        access_type: 'dashboard_view',
        access_details: { page: 'registry_dashboard', timestamp: new Date().toISOString() }
      });
    } catch (err) {
      console.error('Error logging access:', err);
    }
  }, []);

  const fetchAggregatedData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hasAccess = await checkAdminAccess();
      if (!hasAccess) {
        setLoading(false);
        return;
      }

      await logAccess();

      // Buscar episódios elegíveis
      const { data: episodes, error: episodesError } = await supabase
        .from('registry_episodes')
        .select('*')
        .eq('registry_eligible', true);

      if (episodesError) throw episodesError;

      if (!episodes || episodes.length < MIN_SAMPLE_THRESHOLD) {
        setData({
          totalEligibleCases: episodes?.length || 0,
          casesByRegion: {},
          casesByDiagnosis: {},
          scoreDistribution: [],
          flagsFrequency: {},
          painEvolution: [],
          procedureTypes: {}
        });
        setLoading(false);
        return;
      }

      const episodeIds = episodes.map(e => e.id);

      // Agregar por região
      const casesByRegion: Record<string, number> = {};
      episodes.forEach(ep => {
        const region = ep.region_primary || 'outro';
        casesByRegion[region] = (casesByRegion[region] || 0) + 1;
      });

      // Agregar por diagnóstico
      const casesByDiagnosis: Record<string, number> = {};
      episodes.forEach(ep => {
        const diagnosis = ep.suspected_diagnosis || 'outro';
        casesByDiagnosis[diagnosis] = (casesByDiagnosis[diagnosis] || 0) + 1;
      });

      // Buscar scores
      const { data: scores } = await supabase
        .from('registry_score_snapshots')
        .select('score_value')
        .in('episode_id', episodeIds);

      const scoreDistribution = SCORE_RANGES.map(range => ({
        range: range.label,
        count: scores?.filter(s => 
          s.score_value !== null && 
          s.score_value >= range.min && 
          s.score_value <= range.max
        ).length || 0
      }));

      // Buscar triagens para flags
      const { data: triages } = await supabase
        .from('registry_triage_snapshots')
        .select('red_flags_present, medications_flags_json, biological_soil_flags_json')
        .in('episode_id', episodeIds);

      const flagsFrequency: Record<string, number> = {
        red_flags_present: 0,
        NSAID_recent: 0,
        steroid_oral_recent: 0,
        steroid_infiltration_recent: 0,
        anticoagulant: 0,
        smoker: 0,
        high_BMI: 0
      };

      triages?.forEach(t => {
        if (t.red_flags_present) flagsFrequency.red_flags_present++;
        
        const medFlags = t.medications_flags_json as Record<string, boolean> | null;
        if (medFlags) {
          if (medFlags.NSAID_recent) flagsFrequency.NSAID_recent++;
          if (medFlags.steroid_oral_recent) flagsFrequency.steroid_oral_recent++;
          if (medFlags.steroid_infiltration_recent) flagsFrequency.steroid_infiltration_recent++;
          if (medFlags.anticoagulant) flagsFrequency.anticoagulant++;
        }

        const bioFlags = t.biological_soil_flags_json as Record<string, boolean> | null;
        if (bioFlags) {
          if (bioFlags.smoker) flagsFrequency.smoker++;
          if (bioFlags.high_BMI) flagsFrequency.high_BMI++;
        }
      });

      // Buscar follow-ups para evolução da dor
      const { data: followups } = await supabase
        .from('registry_followups')
        .select('timepoint, pain_0_10')
        .in('episode_id', episodeIds)
        .not('pain_0_10', 'is', null);

      const painByTimepoint: Record<string, { total: number; count: number }> = {};
      followups?.forEach(f => {
        if (!painByTimepoint[f.timepoint]) {
          painByTimepoint[f.timepoint] = { total: 0, count: 0 };
        }
        painByTimepoint[f.timepoint].total += Number(f.pain_0_10);
        painByTimepoint[f.timepoint].count++;
      });

      const timepointOrder = ['baseline', '1m', '3m', '6m', '12m'];
      const painEvolution = timepointOrder
        .filter(tp => painByTimepoint[tp]?.count >= 3) // Mínimo de 3 para média
        .map(tp => ({
          timepoint: tp === 'baseline' ? 'Inicial' : tp,
          avgPain: Math.round((painByTimepoint[tp].total / painByTimepoint[tp].count) * 10) / 10,
          count: painByTimepoint[tp].count
        }));

      // Buscar procedimentos
      const { data: procedures } = await supabase
        .from('registry_procedures_performed')
        .select('procedure_type')
        .in('episode_id', episodeIds);

      const procedureTypes: Record<string, number> = {};
      procedures?.forEach(p => {
        const type = p.procedure_type || 'Não especificado';
        procedureTypes[type] = (procedureTypes[type] || 0) + 1;
      });

      setData({
        totalEligibleCases: episodes.length,
        casesByRegion,
        casesByDiagnosis,
        scoreDistribution,
        flagsFrequency,
        painEvolution,
        procedureTypes
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar dados agregados');
      toast.error('Erro ao carregar dados do Registry');
    } finally {
      setLoading(false);
    }
  }, [checkAdminAccess, logAccess]);

  useEffect(() => {
    fetchAggregatedData();
  }, [fetchAggregatedData]);

  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Este painel está disponível apenas para administradores e parceiros institucionais.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Erro ao Carregar</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchAggregatedData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const insufficientData = !data || data.totalEligibleCases < MIN_SAMPLE_THRESHOLD;

  // Preparar dados para gráficos
  const regionChartData = Object.entries(data?.casesByRegion || {}).map(([key, value]) => ({
    name: REGION_LABELS[key] || key,
    value
  }));

  const diagnosisChartData = Object.entries(data?.casesByDiagnosis || {}).map(([key, value]) => ({
    name: DIAGNOSIS_LABELS[key] || key,
    value
  }));

  const flagsChartData = Object.entries(data?.flagsFrequency || {})
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: FLAG_LABELS[key] || key,
      value
    }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">REGENAPP Clinical Registry™</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Dados agregados e anonimizados para análise científica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/admin/registry/export')}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/admin/registry/governance')}>
            <Shield className="h-4 w-4" />
            Governança
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchAggregatedData}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">Privacidade e Anonimização</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Todos os dados exibidos são agregados e anonimizados. Nenhum dado individual de paciente 
                ou profissional é acessível neste painel. Threshold mínimo: {MIN_SAMPLE_THRESHOLD} casos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {insufficientData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Dados Insuficientes</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Para proteger a privacidade dos participantes, os gráficos só são exibidos 
              quando há pelo menos {MIN_SAMPLE_THRESHOLD} casos elegíveis.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Casos atuais: {data?.totalEligibleCases || 0}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="clinical" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Perfil Clínico
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Desfechos
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Casos Elegíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{data.totalEligibleCases}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Regiões Anatômicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{Object.keys(data.casesByRegion).length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tipos de Procedimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{Object.keys(data.procedureTypes).length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cases by Region */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Casos por Região Anatômica</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cases by Diagnosis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Casos por Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={diagnosisChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {diagnosisChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clinical Profile Tab */}
          <TabsContent value="clinical" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição de Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Flags Frequency */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Frequência de Flags Clínicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={flagsChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Outcomes Tab */}
          <TabsContent value="outcomes" className="space-y-4">
            {data.painEvolution.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evolução Média da Dor (0-10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.painEvolution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timepoint" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${value} (n=${data.painEvolution.find(p => p.avgPain === value)?.count || 0})`,
                            'Dor Média'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="avgPain" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 6 }}
                          name="Dor Média"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Baseado em casos com follow-up registrado (mínimo 3 casos por timepoint)
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Sem Dados de Follow-up</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Dados de evolução serão exibidos quando houver follow-ups registrados.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
