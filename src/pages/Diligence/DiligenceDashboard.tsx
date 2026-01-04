// =========================================================
// REGENAPP DILIGENCE & COMPLIANCE LAYER™ - Dashboard
// =========================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  ClipboardList,
  History,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDiligenceLayer } from '@/hooks/useDiligenceLayer';
import { DiligenceDashboardMetrics, DiligenceCaseReport, DiligenceComplianceLog } from '@/types/diligence';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_LABELS: Record<string, string> = {
  generate_report: 'Relatório gerado',
  view_report: 'Relatório visualizado',
  download_report: 'Relatório baixado',
  generate_practice_statement: 'Declaração gerada',
  update_checklist_status: 'Checklist atualizado',
  view_timeline: 'Linha do tempo visualizada',
  view_risk_matrix: 'Matriz de riscos visualizada',
  export_data: 'Dados exportados',
};

export default function DiligenceDashboard() {
  const navigate = useNavigate();
  const { fetchDashboardMetrics, fetchCaseReports, fetchComplianceLogs, generatePracticeStatement, loading } = useDiligenceLayer();
  
  const [metrics, setMetrics] = useState<DiligenceDashboardMetrics | null>(null);
  const [reports, setReports] = useState<DiligenceCaseReport[]>([]);
  const [logs, setLogs] = useState<DiligenceComplianceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [metricsData, reportsData, logsData] = await Promise.all([
      fetchDashboardMetrics(),
      fetchCaseReports(),
      fetchComplianceLogs(),
    ]);
    setMetrics(metricsData);
    setReports(reportsData);
    setLogs(logsData);
    setIsLoading(false);
  };

  const handleGeneratePracticeStatement = async () => {
    const statement = await generatePracticeStatement();
    if (statement) {
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Diligência & Compliance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro factual de diligência técnica e processual
          </p>
        </div>
        <Button onClick={handleGeneratePracticeStatement} disabled={loading}>
          <FileCheck className="h-4 w-4 mr-2" />
          Gerar Declaração de Prática
        </Button>
      </div>

      {/* Disclaimer */}
      <Alert className="border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-xs text-amber-200">
          <strong>Importante:</strong> Este módulo estrutura e demonstra diligência técnica e processual. 
          Não constitui parecer jurídico, aconselhamento legal ou garantia de conformidade regulatória. 
          A interpretação jurídica é sempre externa ao sistema.
        </AlertDescription>
      </Alert>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Casos Registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.totalCases || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
              <FileCheck className="h-3.5 w-3.5" />
              Relatórios Gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.casesWithReports || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Com Consentimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.casesWithConsent || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              Checklists Completos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.checklistsCompleted || 0}
            </div>
            {(metrics?.checklistsPending || 0) > 0 && (
              <p className="text-xs text-amber-500 mt-1">
                {metrics?.checklistsPending} pendentes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="reports" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            Logs de Compliance
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Relatórios de Caso</CardTitle>
              <CardDescription>
                Relatórios factuais gerados para documentação de diligência técnica
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum relatório gerado ainda.</p>
                  <p className="text-sm mt-2">
                    Acesse o detalhe de um paciente e clique em "Gerar Relatório" na aba de Diligência.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID do Caso</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Checksum</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono text-xs">
                          {report.case_id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{report.report_version}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(report.generated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {report.pdf_checksum || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/diligence/case/${report.case_id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Log de Compliance
              </CardTitle>
              <CardDescription>
                Registro imutável de todas as ações de diligência
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log registrado ainda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Caso</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.case_id ? log.case_id.substring(0, 8).toUpperCase() : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {log.action_details ? JSON.stringify(log.action_details) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
