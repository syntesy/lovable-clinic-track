import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Download, Sparkles, AlertCircle, CheckCircle2, 
  Target, Leaf, Clock, Heart, MessageSquare, History, Eye, Trash2,
  FlaskConical, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoReghen from "@/assets/logo-reghen.png";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generateDynamicReportContent, DynamicReportContent } from "@/lib/report-generator";

interface PatientData {
  id: string;
  full_name: string;
  age?: number | null;
  gender?: string | null;
  clinical_diagnosis?: string | null;
  treated_region?: string | null;
}

interface ScreeningData {
  id?: string;
  created_at?: string;
  classification?: string | null;
  analysis_result?: string | null;
  questionnaire_responses?: unknown;
}

interface EvaluationSource {
  evaluationId: string | null;
  evaluationDate: string | null;
  professionalResponsible: string | null;
}

interface SavedReport {
  id: string;
  generated_at: string;
  professional_name: string | null;
  professional_registration: string | null;
  report_content: {
    patient_name: string;
    classification: string | null;
    clinical_diagnosis: string | null;
    treated_region: string | null;
    dynamic_content?: DynamicReportContent;
    evaluation_source?: EvaluationSource;
  };
}

interface PatientEvaluationReportProps {
  patient: PatientData | null;
  latestScreening?: ScreeningData | null;
  professionalName?: string;
  professionalRegistration?: string;
}

export function PatientEvaluationReport({ 
  patient, 
  latestScreening,
  professionalName = "Profissional Responsável",
  professionalRegistration = "CREFITO-XX/XXXXX-F"
}: PatientEvaluationReportProps) {
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [viewingReport, setViewingReport] = useState<SavedReport | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [dynamicContent, setDynamicContent] = useState<DynamicReportContent | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const isPRPIndicado = latestScreening?.classification?.toUpperCase() === "APTO";
  const isPRPComPreparo = latestScreening?.classification?.toUpperCase() === "APTO_COM_PREPARO" ||
                         latestScreening?.classification?.toUpperCase() === "NAO_APTO_PREPARO";
  const isPRPNaoIndicado = latestScreening?.classification?.toUpperCase() === "NAO_APTO" || 
                          latestScreening?.classification?.toUpperCase() === "CONTRAINDICADO";

  // Fetch saved reports
  useEffect(() => {
    if (patient?.id) {
      fetchSavedReports();
    }
  }, [patient?.id]);

  const fetchSavedReports = async () => {
    if (!patient?.id) return;
    
    setIsLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('patient_evaluation_reports')
        .select('id, generated_at, professional_name, professional_registration, report_content')
        .eq('patient_id', patient.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setSavedReports((data || []) as unknown as SavedReport[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleGenerate = async () => {
    if (!patient) return;
    
    // VALIDAÇÃO: Não gerar sem avaliação
    if (!latestScreening || !latestScreening.id) {
      toast.error("Nenhuma avaliação encontrada. Crie uma avaliação para gerar o relatório.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Gerar conteúdo dinâmico baseado nos dados reais
      const generatedContent = generateDynamicReportContent(
        {
          classification: latestScreening?.classification,
          analysis_result: latestScreening?.analysis_result,
          questionnaire_responses: latestScreening?.questionnaire_responses as Record<string, unknown> | null,
        },
        {
          clinical_diagnosis: patient.clinical_diagnosis,
          treated_region: patient.treated_region,
        }
      );
      
      setDynamicContent(generatedContent);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Dados de rastreabilidade da avaliação
      const evaluationSource: EvaluationSource = {
        evaluationId: latestScreening.id || null,
        evaluationDate: latestScreening.created_at || null,
        professionalResponsible: professionalName,
      };
      
      // Prepare report content with dynamic data
      const reportContent = {
        patient_name: patient.full_name,
        patient_age: patient.age,
        patient_gender: patient.gender,
        classification: latestScreening?.classification || null,
        clinical_diagnosis: patient.clinical_diagnosis,
        treated_region: patient.treated_region,
        generated_date: new Date().toISOString(),
        dynamic_content: JSON.parse(JSON.stringify(generatedContent)),
        evaluation_source: JSON.parse(JSON.stringify(evaluationSource)),
      };

      // Save to database
      const { error } = await supabase
        .from('patient_evaluation_reports')
        .insert([{
          patient_id: patient.id,
          report_content: reportContent as unknown as Json,
          generated_by: user?.id,
          professional_name: professionalName,
          professional_registration: professionalRegistration,
        }]);

      if (error) throw error;

      setIsGenerated(true);
      toast.success("Relatório gerado e salvo no prontuário!");
      
      // Refresh saved reports list
      await fetchSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error("Erro ao salvar o relatório");
    } finally {
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteReportId) return;
    
    try {
      const { error } = await supabase
        .from('patient_evaluation_reports')
        .delete()
        .eq('id', deleteReportId);

      if (error) throw error;

      toast.success("Relatório excluído com sucesso!");
      setDeleteReportId(null);
      await fetchSavedReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error("Erro ao excluir o relatório");
    }
  };

  const handleViewReport = (report: SavedReport) => {
    setViewingReport(report);
    // Se o relatório salvo tem dynamic_content, use-o
    if (report.report_content.dynamic_content) {
      setDynamicContent(report.report_content.dynamic_content);
    } else {
      // Relatórios antigos: gerar conteúdo dinamicamente (fallback)
      const generatedContent = generateDynamicReportContent(
        {
          classification: report.report_content.classification,
          analysis_result: null,
          questionnaire_responses: null,
        },
        {
          clinical_diagnosis: report.report_content.clinical_diagnosis,
          treated_region: report.report_content.treated_region,
        }
      );
      setDynamicContent(generatedContent);
    }
    setIsGenerated(false);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !patient) return;

    const html2pdf = (await import('html2pdf.js')).default;
    
    const fileName = `Relatorio_Avaliacao_${patient.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    const options = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(reportRef.current).save();
  };

  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Get display data
  const evaluationSource = viewingReport?.report_content?.evaluation_source || {
    evaluationId: latestScreening?.id || null,
    evaluationDate: latestScreening?.created_at || null,
    professionalResponsible: professionalName,
  };
  
  const displayData = viewingReport ? {
    patientName: viewingReport.report_content.patient_name,
    classification: viewingReport.report_content.classification,
    clinicalDiagnosis: viewingReport.report_content.clinical_diagnosis,
    treatedRegion: viewingReport.report_content.treated_region,
    professionalName: viewingReport.professional_name || professionalName,
    professionalRegistration: viewingReport.professional_registration || professionalRegistration,
    generatedDate: format(new Date(viewingReport.generated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    evaluationSource,
  } : {
    patientName: patient?.full_name || '',
    classification: latestScreening?.classification,
    clinicalDiagnosis: patient?.clinical_diagnosis,
    treatedRegion: patient?.treated_region,
    professionalName,
    professionalRegistration,
    generatedDate: currentDate,
    evaluationSource,
  };
  
  // Verifica se há avaliação disponível
  const hasEvaluation = !!latestScreening?.id;

  const displayIsPRPIndicado = displayData.classification?.toUpperCase() === "APTO";
  const displayIsPRPComPreparo = displayData.classification?.toUpperCase() === "APTO_COM_PREPARO" ||
                                 displayData.classification?.toUpperCase() === "NAO_APTO_PREPARO";
  const displayIsPRPNaoIndicado = displayData.classification?.toUpperCase() === "NAO_APTO" || 
                                  displayData.classification?.toUpperCase() === "CONTRAINDICADO";

  if (!patient) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-16 text-center">
          <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-5" />
          <p className="text-muted-foreground text-lg">Selecione um paciente para gerar o relatório</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Principal - Geração do Relatório */}
      <Card className="bg-gradient-to-br from-card to-secondary/30 border-border shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Relatório de Avaliação e Plano Terapêutico
              </CardTitle>
              <p className="text-sm text-muted-foreground max-w-xl">
                Documento individualizado baseado nos dados reais da avaliação do paciente.
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Personalizado
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aviso de ausência de avaliação */}
          {!hasEvaluation && !viewingReport && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Nenhuma avaliação encontrada</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Crie uma avaliação clínica para poder gerar o relatório individualizado.
                    O relatório é gerado exclusivamente a partir dos dados da avaliação.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || (!hasEvaluation && !viewingReport)}
              className="gap-2"
              size="lg"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Gerando..." : "Gerar Relatório Individualizado"}
            </Button>
            
            {(isGenerated || viewingReport) && (
              <Button 
                onClick={handleExportPDF} 
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            )}

            {viewingReport && (
              <Button 
                onClick={() => {
                  setViewingReport(null);
                  setIsGenerated(false);
                  setDynamicContent(null);
                }} 
                variant="ghost"
                className="gap-2"
                size="lg"
              >
                Fechar Visualização
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Relatórios Salvos */}
      {savedReports.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Relatórios Salvos no Prontuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Relatório de {format(new Date(report.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Por: {report.professional_name || 'Profissional'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteReportId(report.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relatório Gerado ou Visualizado */}
      {(isGenerated || viewingReport) && dynamicContent && (
        <div 
          ref={reportRef}
          className="bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden print:shadow-none"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* CAPA DO RELATÓRIO */}
          <div className="bg-gradient-to-br from-[hsl(149,20%,37%)] to-[hsl(149,20%,30%)] text-white p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">
                  Relatório de Avaliação e Plano Terapêutico
                </h1>
                <div className="space-y-1">
                  <p className="text-lg font-medium">{displayData.patientName}</p>
                  <p className="text-white/80 text-sm">
                    {patient.age && `${patient.age} anos`}
                    {patient.gender && ` • ${patient.gender === "M" ? "Masculino" : "Feminino"}`}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <img 
                  src={logoReghen} 
                  alt="reghen"
                  className="h-10 w-auto ml-auto opacity-90"
                />
              </div>
            </div>
            <Separator className="my-6 bg-white/20" />
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Data de Geração</p>
                <p className="font-medium">{displayData.generatedDate}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Profissional</p>
                <p className="font-medium">{displayData.professionalName}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Registro</p>
                <p className="font-medium">{displayData.professionalRegistration}</p>
              </div>
            </div>
          </div>

          {/* CONTEÚDO DO RELATÓRIO */}
          <div className="p-8 space-y-8">
            
            {/* AVISO DE DADOS AUSENTES */}
            {dynamicContent.missingData.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Dados não identificados na avaliação:</p>
                    <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                      {dynamicContent.missingData.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* 1. OBJETIVO DO RELATÓRIO */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">1. Objetivo do Relatório</h2>
              </div>
              <div className="pl-10">
                <p className="text-gray-700 leading-relaxed">
                  {dynamicContent.objectiveText}
                </p>
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 2. O QUE FOI IDENTIFICADO NA AVALIAÇÃO */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">2. O Que Foi Identificado na Avaliação</h2>
              </div>
              <div className="pl-10 space-y-3">
                {/* Queixa Principal */}
                {dynamicContent.identifiedFindings.mainComplaint && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Queixa Principal</p>
                    <p className="text-gray-900 font-medium">{dynamicContent.identifiedFindings.mainComplaint}</p>
                  </div>
                )}
                
                {/* Diagnóstico e Região */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dynamicContent.identifiedFindings.diagnosis && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Diagnóstico</p>
                      <p className="text-gray-900 font-medium">{dynamicContent.identifiedFindings.diagnosis}</p>
                    </div>
                  )}
                  
                  {dynamicContent.identifiedFindings.region && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Região Avaliada</p>
                      <p className="text-gray-900 font-medium">{dynamicContent.identifiedFindings.region}</p>
                    </div>
                  )}
                </div>
                
                {/* Tempo e Intensidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dynamicContent.identifiedFindings.duration && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Duração dos Sintomas</p>
                      <p className="text-gray-900 font-medium">{dynamicContent.identifiedFindings.duration}</p>
                    </div>
                  )}
                  
                  {dynamicContent.identifiedFindings.painIntensity && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Intensidade da Dor</p>
                      <p className="text-gray-900 font-medium">{dynamicContent.identifiedFindings.painIntensity}</p>
                    </div>
                  )}
                </div>
                
                {/* Achados Clínicos */}
                {dynamicContent.identifiedFindings.clinicalFindings.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Achados Clínicos Relevantes</p>
                    <ul className="space-y-1">
                      {dynamicContent.identifiedFindings.clinicalFindings.map((finding, idx) => (
                        <li key={idx} className="text-gray-700 flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Fatores Nutricionais/Funcionais */}
                {dynamicContent.identifiedFindings.functionalLimitations.length > 0 && (
                  <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                    <p className="text-sm text-amber-700 uppercase tracking-wide mb-2">Fatores Nutricionais/Metabólicos Identificados</p>
                    <ul className="space-y-1">
                      {dynamicContent.identifiedFindings.functionalLimitations.map((limitation, idx) => (
                        <li key={idx} className="text-gray-700 flex items-start gap-2">
                          <span className="text-amber-600 mt-1">•</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 3. INDICAÇÃO DO PRP */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  displayIsPRPIndicado ? 'bg-green-100' : displayIsPRPNaoIndicado ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <AlertCircle className={`w-4 h-4 ${
                    displayIsPRPIndicado ? 'text-green-600' : displayIsPRPNaoIndicado ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  3. {displayIsPRPIndicado 
                    ? "Indicação para PRP" 
                    : displayIsPRPComPreparo 
                      ? "Necessidade de Preparo Antes do PRP" 
                      : displayIsPRPNaoIndicado
                        ? "Contraindicação Atual para PRP"
                        : "Avaliação de Elegibilidade para PRP"}
                </h2>
              </div>
              <div className="pl-10 space-y-3">
                <div className={`rounded-lg p-4 border ${
                  displayIsPRPIndicado 
                    ? 'bg-green-50 border-green-100' 
                    : displayIsPRPNaoIndicado 
                      ? 'bg-amber-50 border-amber-100' 
                      : 'bg-blue-50 border-blue-100'
                }`}>
                  <p className="text-gray-700 leading-relaxed">
                    {dynamicContent.prpIndicationReason}
                  </p>
                </div>
                
                {dynamicContent.prpNotes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Observação Clínica</p>
                    <p className="text-gray-700">{dynamicContent.prpNotes}</p>
                  </div>
                )}
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 4. PLANO TERAPÊUTICO */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">4. Plano Terapêutico Individualizado</h2>
              </div>
              <div className="pl-10 space-y-4">
                {dynamicContent.therapeuticPlan.prepSteps.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed">
                      Com base nos achados da sua avaliação, o seguinte plano foi elaborado:
                    </p>
                    <div className="grid gap-3">
                      {dynamicContent.therapeuticPlan.prepSteps.map((step, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-primary text-xs font-bold">{idx + 1}</span>
                            </div>
                            <p className="text-gray-700">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700">
                    O plano terapêutico será definido após análise completa dos dados clínicos e laboratoriais.
                  </p>
                )}
                
                {/* Exames Solicitados */}
                {(dynamicContent.therapeuticPlan.requiredExams.length > 0 || dynamicContent.therapeuticPlan.optionalExams.length > 0) && (
                  <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <FlaskConical className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-blue-800">Exames Laboratoriais</p>
                    </div>
                    
                    {dynamicContent.therapeuticPlan.requiredExams.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-blue-700 font-medium mb-1">Obrigatórios:</p>
                        <ul className="list-disc list-inside text-gray-700 text-sm">
                          {dynamicContent.therapeuticPlan.requiredExams.map((exam, idx) => (
                            <li key={idx}>{exam}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {dynamicContent.therapeuticPlan.optionalExams.length > 0 && (
                      <div>
                        <p className="text-sm text-blue-700 font-medium mb-1">Complementares:</p>
                        <ul className="list-disc list-inside text-gray-700 text-sm">
                          {dynamicContent.therapeuticPlan.optionalExams.map((exam, idx) => (
                            <li key={idx}>{exam}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Timeline */}
                {dynamicContent.therapeuticPlan.timeline && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Prazo estimado: {dynamicContent.therapeuticPlan.timeline}</span>
                  </div>
                )}
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 5. QUANDO O PRP PASSA A FAZER SENTIDO */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">5. Condições para Terapia Regenerativa</h2>
              </div>
              <div className="pl-10">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {displayIsPRPIndicado 
                      ? "Você já atende às condições para o tratamento regenerativo. Os próximos passos serão discutidos com seu profissional."
                      : "O momento ideal para terapia regenerativa é identificado quando as seguintes condições são atendidas:"}
                  </p>
                  {!displayIsPRPIndicado && dynamicContent.prpConditions.length > 0 && (
                    <ul className="space-y-2 text-gray-700">
                      {dynamicContent.prpConditions.map((condition, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <span>{condition}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 6. O QUE O PACIENTE PODE ESPERAR */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">6. O Que Você Pode Esperar</h2>
              </div>
              <div className="pl-10 space-y-4">
                <div className="grid gap-3">
                  {dynamicContent.expectations.map((expectation, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary text-xs font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-gray-700">{expectation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 7. CONSIDERAÇÕES FINAIS */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">7. Considerações Finais</h2>
              </div>
              <div className="pl-10">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-5 border border-primary/10">
                  <p className="text-gray-800 leading-relaxed">
                    {dynamicContent.finalConsiderations}
                  </p>
                </div>
              </div>
            </section>

            {/* RASTREABILIDADE - Fontes da Avaliação */}
            <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-medium">Fontes da Avaliação (Rastreabilidade)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400">ID da Avaliação:</span>
                  <span className="ml-1 font-mono">{displayData.evaluationSource?.evaluationId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Data da Avaliação:</span>
                  <span className="ml-1">
                    {displayData.evaluationSource?.evaluationDate 
                      ? format(new Date(displayData.evaluationSource.evaluationDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Profissional:</span>
                  <span className="ml-1">{displayData.evaluationSource?.professionalResponsible || displayData.professionalName}</span>
                </div>
              </div>
            </div>

            {/* RODAPÉ */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <img src={logoReghen} alt="reghen" className="h-5 w-auto opacity-60" />
                  <span>Documento gerado pelo reghen • Relatório individualizado</span>
                </div>
                <span>{displayData.generatedDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
