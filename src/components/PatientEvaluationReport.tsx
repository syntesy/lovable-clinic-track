import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Download, Sparkles, AlertCircle, CheckCircle2, 
  Target, Leaf, Clock, Heart, MessageSquare, History, Eye, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoSyntesy from "@/assets/logo-syntesy.png";
import { supabase } from "@/integrations/supabase/client";
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

interface PatientData {
  id: string;
  full_name: string;
  age?: number | null;
  gender?: string | null;
  clinical_diagnosis?: string | null;
  treated_region?: string | null;
}

interface ScreeningData {
  classification?: string | null;
  analysis_result?: string | null;
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
  const reportRef = useRef<HTMLDivElement>(null);

  const isPRPIndicado = latestScreening?.classification?.toUpperCase() === "APTO";
  const isPRPComPreparo = latestScreening?.classification?.toUpperCase() === "APTO_COM_PREPARO";
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
      setSavedReports((data || []) as SavedReport[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleGenerate = async () => {
    if (!patient) return;
    
    setIsGenerating(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare report content
      const reportContent = {
        patient_name: patient.full_name,
        patient_age: patient.age,
        patient_gender: patient.gender,
        classification: latestScreening?.classification || null,
        clinical_diagnosis: patient.clinical_diagnosis,
        treated_region: patient.treated_region,
        generated_date: new Date().toISOString(),
      };

      // Save to database
      const { error } = await supabase
        .from('patient_evaluation_reports')
        .insert({
          patient_id: patient.id,
          report_content: reportContent,
          generated_by: user?.id,
          professional_name: professionalName,
          professional_registration: professionalRegistration,
        });

      if (error) throw error;

      setIsGenerated(true);
      toast.success("Relatório gerado e salvo no prontuário!");
      
      // Refresh saved reports list
      await fetchSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error("Erro ao salvar o relatório");
    } finally {
      setIsGenerating(false);
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

  const handleExportPDF = async () => {
    if (!reportRef.current || !patient) return;

    // Importação dinâmica do html2pdf
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

  // Get display data (either from viewing a saved report or current patient data)
  const displayData = viewingReport ? {
    patientName: viewingReport.report_content.patient_name,
    classification: viewingReport.report_content.classification,
    clinicalDiagnosis: viewingReport.report_content.clinical_diagnosis,
    treatedRegion: viewingReport.report_content.treated_region,
    professionalName: viewingReport.professional_name || professionalName,
    professionalRegistration: viewingReport.professional_registration || professionalRegistration,
    generatedDate: format(new Date(viewingReport.generated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
  } : {
    patientName: patient?.full_name || '',
    classification: latestScreening?.classification,
    clinicalDiagnosis: patient?.clinical_diagnosis,
    treatedRegion: patient?.treated_region,
    professionalName,
    professionalRegistration,
    generatedDate: currentDate,
  };

  const displayIsPRPIndicado = displayData.classification?.toUpperCase() === "APTO";
  const displayIsPRPComPreparo = displayData.classification?.toUpperCase() === "APTO_COM_PREPARO";
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
                Documento explicativo para o paciente sobre diagnóstico, decisões clínicas e plano de tratamento.
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Premium
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="gap-2"
              size="lg"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Gerando..." : "Gerar Relatório para o Paciente"}
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
                      onClick={() => {
                        setViewingReport(report);
                        setIsGenerated(false);
                      }}
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
      {(isGenerated || viewingReport) && (
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
                  src={logoSyntesy} 
                  alt="SYNTESY" 
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
                  Este documento tem como objetivo explicar de forma clara e acessível os achados da sua avaliação, 
                  o raciocínio por trás das decisões clínicas e o plano terapêutico proposto.
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
                {displayData.clinicalDiagnosis ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Diagnóstico Clínico</p>
                    <p className="text-gray-900 font-medium">{displayData.clinicalDiagnosis}</p>
                  </div>
                ) : null}
                
                {displayData.treatedRegion ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Região Tratada</p>
                    <p className="text-gray-900 font-medium">{displayData.treatedRegion}</p>
                  </div>
                ) : null}
                
                {!displayData.clinicalDiagnosis && !displayData.treatedRegion && (
                  <p className="text-gray-700 leading-relaxed">
                    Durante a avaliação inicial, foram analisados diversos aspectos do seu quadro clínico, 
                    incluindo histórico de dor, limitações funcionais e exames complementares. 
                    Essas informações serão utilizadas para definir o melhor caminho terapêutico para o seu caso.
                  </p>
                )}
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 3. POR QUE O PRP NÃO É INDICADO NESTE MOMENTO (CONDICIONAL) */}
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
                    ? "Por Que o PRP Está Indicado" 
                    : displayIsPRPComPreparo 
                      ? "Por Que Precisamos Preparar Primeiro" 
                      : "Por Que o PRP Não É Indicado Neste Momento"}
                </h2>
              </div>
              <div className="pl-10">
                {displayIsPRPIndicado ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      <strong className="text-green-700">Boa notícia!</strong> Com base na sua avaliação atual, 
                      você apresenta condições favoráveis para realizar o tratamento com PRP (Plasma Rico em Plaquetas). 
                      Seu organismo demonstra estar preparado para responder de forma adequada a este tipo de terapia regenerativa.
                    </p>
                  </div>
                ) : displayIsPRPComPreparo ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      <strong className="text-blue-700">Preparação necessária:</strong> O PRP pode ser uma excelente opção 
                      para o seu caso, mas primeiro precisamos preparar o terreno. Isso significa que seu tecido precisa 
                      de alguns ajustes antes de receber o tratamento regenerativo, garantindo assim melhores resultados.
                    </p>
                  </div>
                ) : displayIsPRPNaoIndicado ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      <strong className="text-amber-700">Atenção ao momento:</strong> Neste momento, o PRP não é a melhor 
                      opção para você. Isso não significa que nunca será indicado, mas sim que seu organismo precisa de 
                      outras intervenções primeiro. Quando um tecido está muito inflamado, desorganizado ou com baixa 
                      capacidade de resposta, aplicar PRP pode não trazer os benefícios esperados.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      A indicação do PRP depende de diversos fatores clínicos e laboratoriais que são avaliados 
                      individualmente. O objetivo é sempre garantir que seu organismo esteja nas melhores condições 
                      para responder ao tratamento regenerativo.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 4. PLANO DE PREPARO DO SOLO */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">4. Plano de Preparo do Solo</h2>
              </div>
              <div className="pl-10 space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Assim como um jardim precisa de solo preparado para que as sementes germinem, 
                  seu tecido precisa de condições adequadas para responder ao tratamento. 
                  O plano terapêutico é estruturado em etapas:
                </p>
                
                <div className="grid gap-4">
                  <div className="bg-red-50/50 rounded-lg p-4 border-l-4 border-red-400">
                    <h3 className="font-semibold text-gray-900 mb-2">Etapa 1: Redução da Inflamação</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Antes de estimular a regeneração, é fundamental controlar processos inflamatórios excessivos. 
                      Utilizamos técnicas específicas para modular a resposta inflamatória sem suprimi-la completamente, 
                      pois a inflamação controlada é parte do processo de cura.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50/50 rounded-lg p-4 border-l-4 border-purple-400">
                    <h3 className="font-semibold text-gray-900 mb-2">Etapa 2: Modulação Neural</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      A dor crônica pode criar padrões neurais que perpetuam o problema. 
                      Trabalhamos para "recalibrar" a comunicação entre seu sistema nervoso e os tecidos afetados, 
                      restaurando a sensibilidade normal e melhorando a função.
                    </p>
                  </div>
                  
                  <div className="bg-green-50/50 rounded-lg p-4 border-l-4 border-green-400">
                    <h3 className="font-semibold text-gray-900 mb-2">Etapa 3: Estímulo Metabólico Tecidual</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Preparamos o tecido para receber e responder adequadamente aos estímulos regenerativos. 
                      Isso inclui melhorar a circulação local, aumentar a oxigenação e criar condições ideais 
                      para que seu próprio corpo possa se regenerar.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="bg-gray-200" />

            {/* 5. QUANDO O PRP PASSA A FAZER SENTIDO */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[hsl(149,20%,37%)]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">5. Quando o PRP Passa a Fazer Sentido</h2>
              </div>
              <div className="pl-10">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    O PRP se torna uma opção quando seu organismo demonstra estar pronto. 
                    <strong> Não trabalhamos com datas fixas, mas sim com condições clínicas.</strong> 
                    O momento ideal é identificado quando:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span>A inflamação está controlada e o tecido está mais organizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span>Os exames laboratoriais indicam boa capacidade regenerativa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span>A dor neural está modulada e você apresenta melhora funcional</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span>Seu corpo está apto a responder positivamente ao estímulo biológico</span>
                    </li>
                  </ul>
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
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Melhora Progressiva</h4>
                      <p className="text-gray-600 text-sm">
                        A recuperação é gradual e contínua. Cada sessão contribui para a evolução do seu quadro.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Importância da Adesão</h4>
                      <p className="text-gray-600 text-sm">
                        Seu compromisso com o tratamento é fundamental. Seguir as orientações maximiza os resultados.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Acompanhamento Contínuo</h4>
                      <p className="text-gray-600 text-sm">
                        Monitoramos sua evolução constantemente, ajustando o plano conforme necessário.
                      </p>
                    </div>
                  </div>
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
                  <p className="text-gray-800 leading-relaxed italic">
                    "As decisões do seu tratamento são baseadas no comportamento do tecido e não apenas no nome do diagnóstico. 
                    Cada pessoa é única, e nosso objetivo é encontrar o caminho mais adequado para a sua recuperação."
                  </p>
                </div>
              </div>
            </section>

            {/* RODAPÉ */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <img src={logoSyntesy} alt="SYNTESY" className="h-5 w-auto opacity-60" />
                  <span>Documento gerado pelo SYNTESY</span>
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
