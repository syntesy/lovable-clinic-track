// =========================================================
// REGENAPP DILIGENCE & COMPLIANCE LAYER™ - Case Detail
// =========================================================

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Shield, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  ClipboardList,
  Download,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useDiligenceLayer } from '@/hooks/useDiligenceLayer';
import { 
  DiligenceCaseReport, 
  DiligenceCaseTimeline, 
  DiligenceChecklist,
  CaseReportContent,
  DILIGENCE_DISCLAIMER 
} from '@/types/diligence';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

export default function DiligenceCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const { 
    fetchCaseTimeline, 
    getOrCreateChecklist, 
    updateChecklistItem,
    generateCaseReport,
    logAction,
    loading 
  } = useDiligenceLayer();
  
  const [report, setReport] = useState<DiligenceCaseReport | null>(null);
  const [timeline, setTimeline] = useState<DiligenceCaseTimeline[]>([]);
  const [checklist, setChecklist] = useState<DiligenceChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) {
      loadCaseData();
    }
  }, [caseId]);

  const loadCaseData = async () => {
    if (!caseId) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch existing report
      const { data: existingReport } = await supabase
        .from('diligence_case_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('case_id', caseId)
        .order('report_version', { ascending: false })
        .limit(1)
        .single();

      if (existingReport) {
        setReport(existingReport as unknown as DiligenceCaseReport);
      }

      // Fetch timeline
      const timelineData = await fetchCaseTimeline(caseId);
      setTimeline(timelineData);

      // Fetch checklist
      const checklistData = await getOrCreateChecklist(caseId, 'pre_procedure');
      setChecklist(checklistData);

      // Try to find patient_id from screening or procedure
      const { data: screening } = await supabase
        .from('prp_screenings')
        .select('patient_id')
        .eq('id', caseId)
        .single();

      if (screening) {
        setPatientId(screening.patient_id);
      }
    } catch (error) {
      console.error('Error loading case data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!caseId || !patientId) {
      toast.error('Não foi possível gerar o relatório. Caso não encontrado.');
      return;
    }

    const newReport = await generateCaseReport(patientId, caseId);
    if (newReport) {
      setReport(newReport);
      toast.success('Relatório gerado com sucesso!');
      loadCaseData();
    }
  };

  const handleChecklistItemChange = async (itemId: string, checked: boolean) => {
    if (!checklist) return;
    await updateChecklistItem(checklist.id, itemId, checked);
    // Reload checklist
    if (caseId) {
      const updated = await getOrCreateChecklist(caseId, 'pre_procedure');
      setChecklist(updated);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !report) return;

    await logAction('download_report', caseId);

    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `relatorio-diligencia-${caseId?.substring(0, 8)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
    toast.success('PDF gerado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const reportContent = report?.report_content as CaseReportContent | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/diligence')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Caso {caseId?.substring(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground">
              Documentação de diligência técnica
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!report ? (
            <Button onClick={handleGenerateReport} disabled={loading || !patientId}>
              <FileCheck className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="border-amber-500/30 bg-amber-500/10 print:hidden">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-xs text-amber-200">
          {DILIGENCE_DISCLAIMER.trim().split('\n')[0]}
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="report" className="space-y-4">
        <TabsList className="bg-muted/50 print:hidden">
          <TabsTrigger value="report" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Relatório
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Linha do Tempo
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            Checklist
          </TabsTrigger>
        </TabsList>

        {/* Report Tab */}
        <TabsContent value="report">
          {!report ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum relatório gerado para este caso.</p>
                <Button 
                  className="mt-4" 
                  onClick={handleGenerateReport} 
                  disabled={loading || !patientId}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Gerar Relatório Agora
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border" ref={reportRef}>
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Relatório Factual de Diligência Técnica
                    </CardTitle>
                    <CardDescription>
                      Documento descritivo - Não constitui parecer jurídico
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    v{report.report_version}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Identification */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Identificador do Caso</p>
                    <p className="font-mono font-bold">{reportContent?.case_identifier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Código do Paciente</p>
                    <p className="font-mono">{reportContent?.patient_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data do Procedimento</p>
                    <p>{reportContent?.procedure_date ? format(new Date(reportContent.procedure_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Técnica Registrada</p>
                    <p>{reportContent?.technique_registered || '-'}</p>
                  </div>
                </div>

                <Separator />

                {/* Consent Status */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Consentimento
                  </h3>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant={reportContent?.consent_status.has_consent ? 'default' : 'destructive'}>
                        {reportContent?.consent_status.has_consent ? 'Registrado' : 'Não Registrado'}
                      </Badge>
                      {reportContent?.consent_status.consent_date && (
                        <span className="text-sm text-muted-foreground">
                          em {format(new Date(reportContent.consent_status.consent_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow-up Status */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Follow-up
                  </h3>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={reportContent?.followup_status.has_followup ? 'default' : 'secondary'}>
                        {reportContent?.followup_status.has_followup ? 'Registrado' : 'Não Registrado'}
                      </Badge>
                    </div>
                    {reportContent?.followup_status.timepoints_completed && reportContent.followup_status.timepoints_completed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reportContent.followup_status.timepoints_completed.map((tp, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tp}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Red Flags */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Red Flags Documentadas
                  </h3>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <Badge variant={reportContent?.red_flags_documented.has_red_flags ? 'destructive' : 'secondary'}>
                      {reportContent?.red_flags_documented.has_red_flags ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>

                {/* Scientific References */}
                {reportContent?.scientific_references && reportContent.scientific_references.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Referências Científicas Associadas</h3>
                    <div className="space-y-2">
                      {reportContent.scientific_references.map((ref, i) => (
                        <div key={i} className="p-2 bg-muted/20 rounded text-sm">
                          <p className="font-medium">{ref.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {ref.authors} - {ref.journal} ({ref.year})
                          </p>
                          {ref.doi && (
                            <p className="text-xs font-mono text-muted-foreground">DOI: {ref.doi}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Registration Events */}
                <div>
                  <h3 className="font-semibold mb-2">Eventos de Registro</h3>
                  <div className="space-y-2">
                    {reportContent?.registration_events.map((event, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-xs text-muted-foreground font-mono">
                          {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                        <span>{event.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Disclaimer */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {DILIGENCE_DISCLAIMER}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                  <span>
                    Gerado em: {format(new Date(report.generated_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </span>
                  <span className="font-mono">
                    Checksum: {report.pdf_checksum}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Linha do Tempo Técnica
              </CardTitle>
              <CardDescription>
                Sequência cronológica de eventos registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento registrado na linha do tempo.</p>
                  <p className="text-sm mt-2">Gere um relatório para popular a linha do tempo.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                  {timeline.map((event, i) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <div className="pl-4">
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(event.event_timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                        <p className="font-medium">{event.event_description}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Checklist de Boas Práticas
              </CardTitle>
              <CardDescription>
                Verificação de itens de diligência processual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!checklist ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Checklist não disponível.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={
                      checklist.status === 'completed' ? 'default' :
                      checklist.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {checklist.status === 'completed' ? 'Completo' :
                       checklist.status === 'in_progress' ? 'Em Progresso' : 'Pendente'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {(checklist.completed_items || []).length} / {(checklist.checklist_items || []).length} itens
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {(checklist.checklist_items || []).map((item: any) => {
                      const isCompleted = (checklist.completed_items || []).includes(item.id);
                      return (
                        <div 
                          key={item.id} 
                          className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg"
                        >
                          <Checkbox
                            id={item.id}
                            checked={isCompleted}
                            onCheckedChange={(checked) => 
                              handleChecklistItemChange(item.id, checked as boolean)
                            }
                            disabled={checklist.immutable}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={item.id} 
                              className={`font-medium cursor-pointer ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {item.label}
                              {item.required && (
                                <span className="text-destructive ml-1">*</span>
                              )}
                            </label>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
