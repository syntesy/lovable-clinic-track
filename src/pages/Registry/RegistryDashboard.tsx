import { useState, useMemo } from 'react';
import { useRegistryAnalytics, useRegistryExport } from '@/hooks/useRegistryAnalytics';
import { RegistryFilters, RegistryCaseSummary } from '@/types/registry-analytics';
import { FiltersBar } from '@/components/registry/FiltersBar';
import { MetricsCards } from '@/components/registry/MetricsCards';
import { CurvesPanel } from '@/components/registry/CurvesPanel';
import { ResponderBreakdown } from '@/components/registry/ResponderBreakdown';
import { CasesTable } from '@/components/registry/CasesTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, RefreshCw, BarChart3, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RegistryDashboard() {
  const [filters, setFilters] = useState<RegistryFilters>({});
  const [selectedCase, setSelectedCase] = useState<RegistryCaseSummary | undefined>();
  
  const { 
    cases, 
    metrics, 
    loading, 
    error, 
    refetch, 
    buildCohortCurves, 
    buildCaseCurve 
  } = useRegistryAnalytics(filters);
  
  const { exportToCSV, exporting } = useRegistryExport();
  const { toast } = useToast();

  // Extract unique procedure types for filter dropdown
  const procedureTypes = useMemo(() => {
    const types = new Set<string>();
    cases.forEach(c => {
      if (c.procedure_type && c.procedure_type !== 'unknown') {
        types.add(c.procedure_type);
      }
    });
    return Array.from(types).sort();
  }, [cases]);

  const cohortCurve = useMemo(() => buildCohortCurves(), [buildCohortCurves]);
  const caseCurve = useMemo(
    () => selectedCase ? buildCaseCurve(selectedCase) : undefined,
    [selectedCase, buildCaseCurve]
  );

  const handleExport = async () => {
    const success = await exportToCSV(cases, filters);
    if (success) {
      toast({
        title: 'Exportação concluída',
        description: `${cases.length} casos exportados com sucesso.`,
      });
    } else {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados.',
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
            <BarChart3 className="h-6 w-6 text-primary" />
            Registry Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            Análise descritiva de outcomes ortobiológicos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            size="sm" 
            onClick={handleExport} 
            disabled={exporting || cases.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-muted/50 border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Dados do registry para análise descritiva apenas. Não constitui ensaio clínico comparativo.
          Os dados exportados são anonimizados e não contêm informações pessoais identificáveis.
        </AlertDescription>
      </Alert>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <FiltersBar 
        filters={filters} 
        onFiltersChange={setFilters}
        procedureTypes={procedureTypes}
      />

      {/* Metrics */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CurvesPanel 
            cohortCurve={cohortCurve}
            selectedCase={selectedCase}
            caseCurve={caseCurve}
            loading={loading}
          />
        </div>
        <div>
          <ResponderBreakdown metrics={metrics} loading={loading} />
        </div>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Casos</CardTitle>
          <CardDescription>
            Clique em um caso para visualizar a curva individual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CasesTable 
            cases={cases} 
            loading={loading}
            onSelectCase={setSelectedCase}
            selectedCaseId={selectedCase?.screening_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
