import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Printer, FileText, ClipboardList, FlaskConical, History, AlertTriangle, CheckCircle2, XCircle, Upload, Eye, Info, Stethoscope, ArrowRight, Code } from "lucide-react";
import { format } from "date-fns";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";
import { ExamFileUpload } from "@/components/ExamFileUpload";
import { ExtractedTextPreviewModal } from "@/components/ExtractedTextPreviewModal";
import { ptBR } from "date-fns/locale";

interface QuestionBlock {
  id: string;
  title: string;
  questions: { key: string; label: string }[];
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  type: "image" | "pdf";
}

interface ExtractedText {
  fileName: string;
  text: string;
  success: boolean;
  error?: string;
}

interface ExamGroup {
  axis: string;
  exams: string[];
  justification: string;
}

// Estrutura de resposta esperada do Assistant
interface TriagemAnalysisResult {
  eligibility: {
    overall_status: "APTO" | "APTO_COM_PREPARO" | "NAO_APTO" | "INDEFINIDO";
    prp: { status: string; notes?: string };
    prf: { status: string; notes?: string };
    bmac: { status: string; notes?: string };
  };
  key_reasons: string[];
  requested_exams: {
    required: string[];
    optional: string[];
  };
  next_steps: {
    what_to_do_now: string;
    timeline?: string;
  };
  raw_json?: any;
}

const questionBlocks: QuestionBlock[] = [
  {
    id: "eixoHormonal",
    title: "EIXO HORMONAL",
    questions: [
      { key: "sintomas_tireoide", label: "Sintomas de disfunção tireoidiana?" },
      { key: "homem_baixa_libido_forca", label: "Homens: redução de libido ou força?" },
      { key: "mulher_ciclo_irregular", label: "Mulheres: ciclos menstruais irregulares?" },
      { key: "reposicao_hormonal", label: "Uso de reposição hormonal?" }
    ]
  },
  {
    id: "medicamentos",
    title: "USO DE MEDICAMENTOS",
    questions: [
      { key: "antiinflamatorios_7_dias", label: "Uso de anti-inflamatórios nos últimos 7 dias?" },
      { key: "corticoide_3_meses", label: "Uso de corticoides (oral ou infiltração) nos últimos 3 meses?" },
      { key: "anticoagulantes_antiagregantes", label: "Uso contínuo de anticoagulantes/antiagregantes?" },
      { key: "imunossupressores", label: "Uso de medicamentos imunossupressores?" }
    ]
  },
  {
    id: "estiloVida",
    title: "ESTILO DE VIDA",
    questions: [
      { key: "atividade_fisica_regular", label: "Atividade física regular (≥3x/semana)?" },
      { key: "alcool_regular", label: "Consumo regular de álcool (>2x/semana)?" },
      { key: "tabagismo_recente", label: "Tabagismo atual ou recente (<1 ano)?" },
      { key: "vitamina_d_exposicao_ou_suplementacao", label: "Exposição solar adequada ou suplementação de vitamina D?" }
    ]
  }
];

export default function TriagemBiologica() {
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [analysisResult, setAnalysisResult] = useState<TriagemAnalysisResult | null>(null);
  const [rawAnalysisJson, setRawAnalysisJson] = useState<string>("");
  const [showRawJson, setShowRawJson] = useState(false);
  const [classification, setClassification] = useState<string>("");
  const [recommendedExams, setRecommendedExams] = useState<ExamGroup[]>([]);
  const [patientOrientations, setPatientOrientations] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [labResultsText, setLabResultsText] = useState("");
  const [isAnalyzingLab, setIsAnalyzingLab] = useState(false);
  const [labInterpretation, setLabInterpretation] = useState("");
  const [activeTab, setActiveTab] = useState("triagem");
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printPreviewType, setPrintPreviewType] = useState<"exams" | "orientations">("exams");
  
  // New states for file upload and OCR
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [consolidatedText, setConsolidatedText] = useState("");
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Fetch patients
  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return data;
    }
  });

  // Fetch screenings for selected patient
  const { data: screenings, isLoading: loadingScreenings } = useQuery({
    queryKey: ["prp_screenings", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const { data, error } = await supabase
        .from("prp_screenings")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("screening_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Initialize answers with flat keys
  useEffect(() => {
    const initialAnswers: Record<string, boolean> = {};
    questionBlocks.forEach(block => {
      block.questions.forEach(q => {
        initialAnswers[q.key] = false;
      });
    });
    setAnswers(initialAnswers);
  }, []);

  // Reset file uploads when patient changes
  useEffect(() => {
    setUploadedFiles([]);
    setExtractedTexts([]);
    setConsolidatedText("");
    setExtractionWarnings([]);
    setLabResultsText("");
    setLabInterpretation("");
    setAnalysisResult(null);
    setRawAnalysisJson("");
  }, [selectedPatientId]);

  const handleAnswerChange = (key: string, checked: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  // Monta o JSON cru para envio (SEM interpretações)
  const buildRawQuestionnaire = () => {
    return {
      mode: "TRIAGEM",
      patient_id: selectedPatientId,
      answers: { ...answers },
      provided_exams: []
    };
  };

  const handleAnalyze = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente antes de iniciar a triagem");
      return;
    }

    setIsAnalyzing(true);
    try {
      const rawQuestionnaire = buildRawQuestionnaire();
      
      const { data, error } = await supabase.functions.invoke('triagem-prp', {
        body: { rawQuestionnaire, action: "questionnaire" }
      });

      if (error) throw error;

      // Parse structured response
      if (data.structuredResult) {
        setAnalysisResult(data.structuredResult);
        setRawAnalysisJson(JSON.stringify(data.structuredResult, null, 2));
      }
      
      setClassification(data.classification || data.structuredResult?.eligibility?.overall_status || "");
      setRecommendedExams(data.recommendedExams || []);
      setPatientOrientations(data.patientOrientations || "");

      // Save to database
      const { error: saveError } = await supabase
        .from("prp_screenings")
        .insert({
          patient_id: selectedPatientId,
          questionnaire_responses: rawQuestionnaire,
          analysis_result: data.rawAnalysis || JSON.stringify(data.structuredResult),
          classification: data.classification || data.structuredResult?.eligibility?.overall_status,
          recommended_exams: data.recommendedExams,
          patient_orientations: data.patientOrientations
        });

      if (saveError) throw saveError;

      queryClient.invalidateQueries({ queryKey: ["prp_screenings", selectedPatientId] });
      toast.success("Triagem realizada e salva com sucesso!");
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error("Erro ao realizar análise. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractText = async () => {
    if (uploadedFiles.length === 0 && !labResultsText.trim()) {
      toast.error("Anexe arquivos ou digite os resultados");
      return;
    }

    if (uploadedFiles.length === 0) {
      setConsolidatedText(labResultsText);
      setExtractedTexts([]);
      setExtractionWarnings([]);
      setPreviewModalOpen(true);
      return;
    }

    setIsExtractingText(true);
    try {
      const imageUrls = uploadedFiles.map(file => ({
        url: file.url,
        fileName: file.name
      }));

      const { data, error } = await supabase.functions.invoke('triagem-prp', {
        body: { 
          action: "extract_text",
          imageUrls 
        }
      });

      if (error) throw error;

      setExtractedTexts(data.extractedTexts || []);
      setConsolidatedText(data.consolidatedText || "");
      setExtractionWarnings(data.warnings || []);

      if (data.successCount === 0) {
        toast.error("Não foi possível extrair texto dos arquivos");
      } else if (data.failCount > 0) {
        toast.warning(`${data.successCount} de ${data.totalFiles} arquivo(s) processado(s)`);
      } else {
        toast.success("Texto extraído com sucesso!");
      }

      setPreviewModalOpen(true);
    } catch (error) {
      console.error("Error extracting text:", error);
      toast.error("Erro ao extrair texto dos arquivos");
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleConfirmAndAnalyze = async (finalText: string) => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente");
      return;
    }

    const latestScreening = screenings?.[0];
    if (!latestScreening) {
      toast.error("Realize a triagem primeiro antes de inserir resultados");
      return;
    }

    setPreviewModalOpen(false);
    setIsAnalyzingLab(true);

    try {
      const { data, error } = await supabase.functions.invoke('triagem-prp', {
        body: { 
          labResults: { 
            rawText: finalText,
            extractedFromImages: consolidatedText 
          }, 
          action: "lab_results" 
        }
      });

      if (error) throw error;

      setLabInterpretation(data.analysis);

      const attachedFilesInfo = uploadedFiles.map(f => ({
        id: f.id,
        name: f.name,
        uploadedAt: f.uploadedAt.toISOString()
      }));

      const { error: saveError } = await supabase
        .from("prp_lab_results")
        .insert({
          screening_id: latestScreening.id,
          raw_text: labResultsText,
          extracted_text: consolidatedText,
          interpretation: data.analysis,
          updated_classification: data.classification,
          attached_files: attachedFilesInfo
        });

      if (saveError) throw saveError;

      if (data.classification) {
        await supabase
          .from("prp_screenings")
          .update({ classification: data.classification })
          .eq("id", latestScreening.id);
      }

      queryClient.invalidateQueries({ queryKey: ["prp_screenings", selectedPatientId] });
      toast.success("Resultados analisados com sucesso!");
    } catch (error) {
      console.error("Error analyzing lab:", error);
      toast.error("Erro ao analisar resultados. Tente novamente.");
    } finally {
      setIsAnalyzingLab(false);
    }
  };

  const handleAnalyzeLabResults = async () => {
    if (uploadedFiles.length > 0) {
      await handleExtractText();
    } else if (labResultsText.trim()) {
      setConsolidatedText("");
      setExtractedTexts([]);
      setExtractionWarnings([]);
      setPreviewModalOpen(true);
    } else {
      toast.error("Insira os resultados dos exames ou anexe arquivos");
    }
  };

  const handleOpenPrintPreview = (type: "exams" | "orientations") => {
    setPrintPreviewType(type);
    setPrintPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APTO":
        return <Badge className="bg-emerald-500 text-white text-sm px-3 py-1"><CheckCircle2 className="w-4 h-4 mr-1" /> APTO</Badge>;
      case "APTO_COM_PREPARO":
        return <Badge className="bg-amber-500 text-white text-sm px-3 py-1"><AlertTriangle className="w-4 h-4 mr-1" /> APTO COM PREPARO</Badge>;
      case "NAO_APTO":
      case "CONTRAINDICADO":
        return <Badge className="bg-red-500 text-white text-sm px-3 py-1"><XCircle className="w-4 h-4 mr-1" /> NÃO APTO</Badge>;
      case "INDEFINIDO":
        return <Badge className="bg-gray-500 text-white text-sm px-3 py-1"><Info className="w-4 h-4 mr-1" /> INDEFINIDO</Badge>;
      default:
        return <Badge variant="outline" className="text-sm px-3 py-1">{status || "Aguardando"}</Badge>;
    }
  };

  const getProcedureIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APTO":
      case "LIBERADO":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "APTO_COM_PREPARO":
      case "COM_RESSALVAS":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "NAO_APTO":
      case "CONTRAINDICADO":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls?.toUpperCase()) {
      case "APTO":
        return <Badge className="bg-emerald-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> APTO PARA ORTOBIOLÓGICO</Badge>;
      case "NAO_APTO_PREPARO":
      case "APTO_COM_PREPARO":
        return <Badge className="bg-amber-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" /> NECESSITA PREPARO BIOLÓGICO</Badge>;
      case "CONTRAINDICADO":
      case "NAO_APTO":
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" /> CONTRAINDICADO / ADIAR</Badge>;
      default:
        return null;
    }
  };

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Triagem Biológica Pré-PRP</h1>
          <p className="text-sm mt-1" style={{ color: '#5A6080' }}>
            Avaliação clínico-biológica para terapias ortobiológicas e leucoplaquetárias
          </p>
        </div>
      </div>

      {/* Patient Selection */}
      <Card className="bg-card/95 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Selecionar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPatients ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando pacientes...
            </div>
          ) : patients && patients.length > 0 ? (
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="w-full md:w-96 bg-background">
                <SelectValue placeholder="Selecione um paciente para iniciar a triagem" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {patients.map(patient => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum paciente cadastrado. Cadastre pacientes na aba "Pacientes" primeiro.
            </p>
          )}
          {selectedPatient && (
            <p className="mt-2 text-sm text-muted-foreground">
              Paciente selecionado: <span className="font-medium text-foreground">{selectedPatient.full_name}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      {selectedPatientId && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="triagem" className="flex items-center gap-2 py-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Triagem</span>
            </TabsTrigger>
            <TabsTrigger value="resultados" className="flex items-center gap-2 py-2">
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Exames</span>
            </TabsTrigger>
            <TabsTrigger value="impressao" className="flex items-center gap-2 py-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2 py-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Triagem Tab */}
          <TabsContent value="triagem" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Questionnaire */}
              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Questionário de Triagem Biológica</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                      {questionBlocks.map(block => (
                        <div key={block.id}>
                          <h3 className="text-sm font-semibold text-primary mb-3">{block.title}</h3>
                          <div className="space-y-3">
                            {block.questions.map(question => (
                              <div key={question.key} className="flex items-start space-x-3">
                                <Checkbox
                                  id={question.key}
                                  checked={answers[question.key] || false}
                                  onCheckedChange={(checked) => 
                                    handleAnswerChange(question.key, checked as boolean)
                                  }
                                />
                                <Label 
                                  htmlFor={question.key}
                                  className="text-sm text-foreground/80 leading-tight cursor-pointer"
                                >
                                  {question.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        "Enviar para Análise"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Result - Cards */}
              <div className="space-y-4">
                {analysisResult ? (
                  <>
                    {/* Card 1: Status Geral */}
                    <Card className="bg-card/95 backdrop-blur border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Status Geral
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-center py-4">
                          {getStatusBadge(analysisResult.eligibility?.overall_status)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 2: Elegibilidade por Procedimento */}
                    <Card className="bg-card/95 backdrop-blur border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Elegibilidade por Procedimento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                            {getProcedureIcon(analysisResult.eligibility?.prp?.status)}
                            <span className="text-sm font-medium mt-2">PRP</span>
                            <span className="text-xs text-muted-foreground">{analysisResult.eligibility?.prp?.status || "—"}</span>
                          </div>
                          <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                            {getProcedureIcon(analysisResult.eligibility?.prf?.status)}
                            <span className="text-sm font-medium mt-2">PRF</span>
                            <span className="text-xs text-muted-foreground">{analysisResult.eligibility?.prf?.status || "—"}</span>
                          </div>
                          <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                            {getProcedureIcon(analysisResult.eligibility?.bmac?.status)}
                            <span className="text-sm font-medium mt-2">BMAC</span>
                            <span className="text-xs text-muted-foreground">{analysisResult.eligibility?.bmac?.status || "—"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 3: Exames Necessários */}
                    <Card className="bg-card/95 backdrop-blur border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <FlaskConical className="w-4 h-4" />
                          Exames Necessários
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(analysisResult.requested_exams?.required?.length > 0 || analysisResult.requested_exams?.optional?.length > 0) ? (
                          <div className="space-y-3">
                            {analysisResult.requested_exams?.required?.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-red-500 uppercase">Obrigatórios</span>
                                <ul className="mt-1 space-y-1">
                                  {analysisResult.requested_exams.required.map((exam, idx) => (
                                    <li key={idx} className="text-sm flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                      {exam}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysisResult.requested_exams?.optional?.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-amber-500 uppercase">Opcionais</span>
                                <ul className="mt-1 space-y-1">
                                  {analysisResult.requested_exams.optional.map((exam, idx) => (
                                    <li key={idx} className="text-sm flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      {exam}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum exame adicional necessário</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Card 4: Motivo Principal */}
                    {analysisResult.key_reasons?.length > 0 && (
                      <Card className="bg-card/95 backdrop-blur border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Motivo Principal
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{analysisResult.key_reasons[0]}</p>
                          {analysisResult.key_reasons.length > 1 && (
                            <ul className="mt-2 space-y-1">
                              {analysisResult.key_reasons.slice(1).map((reason, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">• {reason}</li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Card 5: Próximo Passo */}
                    {analysisResult.next_steps?.what_to_do_now && (
                      <Card className="bg-card/95 backdrop-blur border-border/50 border-primary/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
                            <ArrowRight className="w-4 h-4" />
                            Próximo Passo
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">{analysisResult.next_steps.what_to_do_now}</p>
                          {analysisResult.next_steps.timeline && (
                            <p className="text-xs text-muted-foreground mt-1">{analysisResult.next_steps.timeline}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Botão Ver JSON (opcional) */}
                    <div className="flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="text-xs"
                      >
                        <Code className="w-3 h-3 mr-1" />
                        {showRawJson ? "Ocultar JSON" : "Ver JSON"}
                      </Button>
                    </div>

                    {showRawJson && (
                      <Card className="bg-background/50">
                        <CardContent className="pt-4">
                          <ScrollArea className="h-[200px]">
                            <pre className="text-xs font-mono whitespace-pre-wrap">{rawAnalysisJson}</pre>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="bg-card/95 backdrop-blur border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">Análise Biológica da Triagem</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                        Preencha o questionário e clique em "Enviar para Análise" para ver os resultados
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Lab Results Tab */}
          <TabsContent value="resultados" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Inserir Resultados de Exames
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload Section */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Upload className="w-4 h-4" />
                      Anexar Exames (OCR Automático)
                    </Label>
                    <ExamFileUpload
                      patientId={selectedPatientId}
                      files={uploadedFiles}
                      onFilesChange={setUploadedFiles}
                    />
                  </div>

                  <Separator />

                  {/* Manual Text Entry */}
                  <div>
                    <Label>Ou cole/digite os resultados dos exames:</Label>
                    <Textarea
                      value={labResultsText}
                      onChange={(e) => setLabResultsText(e.target.value)}
                      placeholder="Exemplo:&#10;Hemograma: Hb 12.5 g/dL, Ht 38%&#10;Ferritina: 45 ng/mL&#10;Vitamina D: 28 ng/mL&#10;PCR: 3.2 mg/L&#10;..."
                      className="mt-2 min-h-[200px] font-mono text-sm"
                    />
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={handleAnalyzeLabResults}
                    disabled={isAnalyzingLab || isExtractingText || (!labResultsText.trim() && uploadedFiles.length === 0)}
                    className="w-full"
                  >
                    {isExtractingText ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extraindo Texto...
                      </>
                    ) : isAnalyzingLab ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando Exames...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        {uploadedFiles.length > 0 ? "Extrair e Analisar" : "Analisar Resultados"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Interpretação dos Exames</CardTitle>
                </CardHeader>
                <CardContent>
                  {labInterpretation ? (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
                        {labInterpretation}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
                      <div>
                        <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Anexe arquivos de exames ou digite os resultados para ver a interpretação.</p>
                        <p className="mt-2 text-xs">O sistema irá extrair automaticamente os valores usando OCR/Vision.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Print Tab */}
          <TabsContent value="impressao" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Solicitação de Exames</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendedExams.length > 0 ? (
                    <>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {recommendedExams.map((group, idx) => (
                            <div key={idx} className="border-l-2 border-primary pl-3">
                              <h4 className="text-sm font-semibold text-primary mb-1">{group.axis}</h4>
                              <div className="space-y-1 mb-2">
                                {group.exams.map((exam, examIdx) => (
                                  <div key={examIdx} className="flex items-center gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                    {exam}
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground italic">
                                {group.justification}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button 
                        onClick={() => handleOpenPrintPreview("exams")}
                        className="w-full"
                        variant="outline"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir Solicitação de Exames
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Realize a triagem primeiro para ver os exames recomendados
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Orientações ao Paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResult ? (
                    <>
                      <ScrollArea className="h-[200px] pr-4">
                        <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {patientOrientations || analysisResult.next_steps?.what_to_do_now || "Orientações disponíveis na análise completa."}
                        </div>
                      </ScrollArea>
                      <Button 
                        onClick={() => handleOpenPrintPreview("orientations")}
                        className="w-full"
                        variant="outline"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir Orientações
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Realize a triagem primeiro para ver as orientações
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="historico" className="space-y-4">
            <Card className="bg-card/95 backdrop-blur border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Histórico de Triagens</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingScreenings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : screenings && screenings.length > 0 ? (
                  <div className="space-y-4">
                    {screenings.map(screening => (
                      <Card key={screening.id} className="bg-background/50">
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                            <div className="text-sm font-medium">
                              {format(new Date(screening.screening_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                            {getClassificationBadge(screening.classification || "")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Questionário salvo • Clique para ver detalhes
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma triagem realizada para este paciente
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedPatientId && (
        <Card className="bg-card/95 backdrop-blur border-border/50">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4" style={{ color: '#7A8099' }} />
            <p style={{ color: '#5A6080' }}>
              Selecione um paciente acima para iniciar a triagem biológica
            </p>
          </CardContent>
        </Card>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        open={printPreviewOpen}
        onOpenChange={setPrintPreviewOpen}
        type={printPreviewType}
        patientName={selectedPatient?.full_name || ""}
        content={printPreviewType === "exams" ? recommendedExams : (patientOrientations || "")}
      />

      {/* Extracted Text Preview Modal */}
      <ExtractedTextPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        extractedTexts={extractedTexts}
        consolidatedText={consolidatedText}
        warnings={extractionWarnings}
        manualText={labResultsText}
        onConfirm={handleConfirmAndAnalyze}
      />
    </div>
  );
}
