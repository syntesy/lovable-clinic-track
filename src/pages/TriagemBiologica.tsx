import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Printer, FileText, ClipboardList, FlaskConical, History, AlertTriangle, CheckCircle2, XCircle, Upload, Eye, Info, Stethoscope, ArrowRight, Code, Ban } from "lucide-react";
import { format } from "date-fns";
import { PrintPreviewModal, RequestedExam } from "@/components/PrintPreviewModal";
import { ExamFileUpload } from "@/components/ExamFileUpload";
import { ExtractedTextPreviewModal } from "@/components/ExtractedTextPreviewModal";
import { ptBR } from "date-fns/locale";

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
  soil_preparation?: {
    needed: boolean;
    recommendations?: string[];
  };
  raw_json?: any;
}

// Estrutura do questionário clínico RESUMIDO
interface QuestionnaireAnswers {
  // A) Identificação do caso
  idade: number | null;
  sexo: string;
  regiao_principal: string;
  diagnostico_suspeito: string;
  tempo_dor: string;
  dor_escala: number | null;
  
  // B) Procedimento pretendido
  procedimento_considerado: string;
  
  // C) Segurança / Red flags (multi-select)
  red_flags: string[];
  
  // D) Medicamentos relevantes (multi-select)
  medicamentos: string[];
  
  // E) Histórico terapêutico
  prp_prf_bmac_anterior: string;
  fisioterapia_6_semanas: boolean | null;
  cirurgia_previa_regiao: boolean | null;
  
  // F) Preparo do solo biológico (multi-select)
  fatores_preparo: string[];
  
  // G) Status nutricional / micronutrientes (multi-select)
  fatores_nutricionais: string[];
  
  // H) Estilo de Vida
  qualidade_sono: string;
  consumo_alcool_2x_semana: boolean | null;
  nivel_estresse: string;
}

// Estrutura dos exames laboratoriais
interface LabExamValues {
  hemoglobina: string;
  hematocrito: string;
  leucocitos: string;
  plaquetas: string;
  pcr: string;
  ferritina: string;
  glicemia: string;
  hba1c: string;
}

const initialAnswers: QuestionnaireAnswers = {
  idade: null,
  sexo: "",
  regiao_principal: "",
  diagnostico_suspeito: "",
  tempo_dor: "",
  dor_escala: null,
  procedimento_considerado: "",
  red_flags: [],
  medicamentos: [],
  prp_prf_bmac_anterior: "",
  fisioterapia_6_semanas: null,
  cirurgia_previa_regiao: null,
  fatores_preparo: [],
  fatores_nutricionais: [],
  qualidade_sono: "",
  consumo_alcool_2x_semana: null,
  nivel_estresse: "",
};

const initialLabExams: LabExamValues = {
  hemoglobina: "",
  hematocrito: "",
  leucocitos: "",
  plaquetas: "",
  pcr: "",
  ferritina: "",
  glicemia: "",
  hba1c: "",
};

export default function TriagemBiologica() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("paciente");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialAnswers);
  const [labExams, setLabExams] = useState<LabExamValues>(initialLabExams);
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
  
  // States for file upload and OCR
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

  // Set patient from URL parameter
  useEffect(() => {
    if (patientIdFromUrl && patientIdFromUrl !== selectedPatientId) {
      setSelectedPatientId(patientIdFromUrl);
    }
  }, [patientIdFromUrl]);

  // Reset when patient changes
  useEffect(() => {
    setUploadedFiles([]);
    setExtractedTexts([]);
    setConsolidatedText("");
    setExtractionWarnings([]);
    setLabResultsText("");
    setLabInterpretation("");
    setAnalysisResult(null);
    setRawAnalysisJson("");
    setAnswers(initialAnswers);
    setLabExams(initialLabExams);
  }, [selectedPatientId]);

  // Helper for yes/no/null radio
  const YesNoRadio = ({ 
    value, 
    onChange, 
    id 
  }: { 
    value: boolean | null; 
    onChange: (val: boolean | null) => void; 
    id: string;
  }) => (
    <RadioGroup
      value={value === null ? "" : value ? "sim" : "nao"}
      onValueChange={(v) => onChange(v === "" ? null : v === "sim")}
      className="flex gap-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="sim" id={`${id}-sim`} />
        <Label htmlFor={`${id}-sim`} className="text-sm cursor-pointer">Sim</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="nao" id={`${id}-nao`} />
        <Label htmlFor={`${id}-nao`} className="text-sm cursor-pointer">Não</Label>
      </div>
    </RadioGroup>
  );

  // Build raw JSON for submission (NO interpretations)
  const buildRawQuestionnaire = () => {
    // Build provided_exams from labExams
    const providedExams: Record<string, string> = {};
    if (labExams.hemoglobina) providedExams.hemoglobina = labExams.hemoglobina;
    if (labExams.hematocrito) providedExams.hematocrito = labExams.hematocrito;
    if (labExams.leucocitos) providedExams.leucocitos = labExams.leucocitos;
    if (labExams.plaquetas) providedExams.plaquetas = labExams.plaquetas;
    if (labExams.pcr) providedExams.pcr = labExams.pcr;
    if (labExams.ferritina) providedExams.ferritina = labExams.ferritina;
    if (labExams.glicemia) providedExams.glicemia = labExams.glicemia;
    if (labExams.hba1c) providedExams.hba1c = labExams.hba1c;

    return {
      mode: "TRIAGEM",
      patient_id: selectedPatientId,
      answers: { ...answers },
      provided_exams: Object.keys(providedExams).length > 0 ? providedExams : null
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

  // Build the exams list from analysisResult.requested_exams for printing
  const getExamsForPrint = (): RequestedExam[] => {
    const exams: RequestedExam[] = [];
    
    // First priority: use analysisResult.requested_exams
    if (analysisResult?.requested_exams) {
      if (analysisResult.requested_exams.required?.length > 0) {
        analysisResult.requested_exams.required.forEach(exam => {
          // Parse exam string - format can be "Exam Name — Justification" or just "Exam Name"
          const parts = exam.split(/\s*[—–-]\s*/);
          exams.push({
            name: parts[0].trim(),
            justification: parts[1]?.trim() || "Avaliação para triagem biológica",
            type: "required"
          });
        });
      }
      
      if (analysisResult.requested_exams.optional?.length > 0) {
        analysisResult.requested_exams.optional.forEach(exam => {
          const parts = exam.split(/\s*[—–-]\s*/);
          exams.push({
            name: parts[0].trim(),
            justification: parts[1]?.trim() || "Investigação complementar",
            type: "optional"
          });
        });
      }
    }
    
    // Second priority: use recommendedExams (legacy format)
    if (exams.length === 0 && recommendedExams.length > 0) {
      recommendedExams.forEach(group => {
        group.exams.forEach(exam => {
          exams.push({
            name: exam,
            justification: group.justification,
            type: "required"
          });
        });
      });
    }
    
    return exams;
  };

  const hasExamsToRequest = (): boolean => {
    return getExamsForPrint().length > 0;
  };

  const handleOpenPrintPreview = (type: "exams" | "orientations") => {
    if (type === "exams" && !hasExamsToRequest()) {
      toast.warning("Nenhum exame foi indicado pela triagem");
      return;
    }
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
            Avaliação clínico-biológica para terapias ortobiológicas (PRP, PRF, BMAC)
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
                  <CardTitle className="text-base font-medium">Questionário Clínico de Ortobiológicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {/* A) Identificação do caso */}
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-3">A) IDENTIFICAÇÃO DO CASO</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="idade">Idade</Label>
                              <Input
                                id="idade"
                                type="number"
                                placeholder="Ex: 45"
                                value={answers.idade ?? ""}
                                onChange={(e) => setAnswers(prev => ({ ...prev, idade: e.target.value ? parseInt(e.target.value) : null }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="sexo">Sexo</Label>
                              <Select value={answers.sexo} onValueChange={(v) => setAnswers(prev => ({ ...prev, sexo: v }))}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Masculino</SelectItem>
                                  <SelectItem value="F">Feminino</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Região principal</Label>
                            <Select value={answers.regiao_principal} onValueChange={(v) => setAnswers(prev => ({ ...prev, regiao_principal: v }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione a região" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="joelho">Joelho</SelectItem>
                                <SelectItem value="ombro">Ombro</SelectItem>
                                <SelectItem value="quadril">Quadril</SelectItem>
                                <SelectItem value="cotovelo">Cotovelo</SelectItem>
                                <SelectItem value="tornozelo">Tornozelo</SelectItem>
                                <SelectItem value="mao">Mão/Punho</SelectItem>
                                <SelectItem value="coluna">Coluna</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Diagnóstico suspeito</Label>
                            <Select value={answers.diagnostico_suspeito} onValueChange={(v) => setAnswers(prev => ({ ...prev, diagnostico_suspeito: v }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione o diagnóstico" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="artrose">Artrose</SelectItem>
                                <SelectItem value="tendinopatia">Tendinopatia</SelectItem>
                                <SelectItem value="lesao_muscular">Lesão muscular</SelectItem>
                                <SelectItem value="lesao_ligamentar">Lesão ligamentar</SelectItem>
                                <SelectItem value="menisco">Lesão de menisco</SelectItem>
                                <SelectItem value="hernia_disco">Coluna - Hérnia de disco</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Tempo de dor</Label>
                              <Select value={answers.tempo_dor} onValueChange={(v) => setAnswers(prev => ({ ...prev, tempo_dor: v }))}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0-6sem">0-6 semanas</SelectItem>
                                  <SelectItem value="6-12sem">6-12 semanas</SelectItem>
                                  <SelectItem value="3-6m">3-6 meses</SelectItem>
                                  <SelectItem value=">6m">Mais de 6 meses</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="dor_escala">Dor (0-10)</Label>
                              <Input
                                id="dor_escala"
                                type="number"
                                min="0"
                                max="10"
                                placeholder="0-10"
                                value={answers.dor_escala ?? ""}
                                onChange={(e) => setAnswers(prev => ({ ...prev, dor_escala: e.target.value ? parseInt(e.target.value) : null }))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>

                      {/* B) Procedimento pretendido */}
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-3">B) PROCEDIMENTO PRETENDIDO</h3>
                        <div>
                          <Label>Procedimento considerado</Label>
                          <Select value={answers.procedimento_considerado} onValueChange={(v) => setAnswers(prev => ({ ...prev, procedimento_considerado: v }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione o procedimento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRP">PRP (Plasma Rico em Plaquetas)</SelectItem>
                              <SelectItem value="PRF">PRF (Fibrina Rica em Plaquetas)</SelectItem>
                              <SelectItem value="BMAC">BMAC (Aspirado de Medula Óssea)</SelectItem>
                              <SelectItem value="NAO_SEI">Não sei / A definir</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator className="mt-4" />
                      </div>

                      {/* C) Segurança / Red flags (multi-select) */}
                      <div>
                        <h3 className="text-sm font-semibold text-red-500 mb-3">C) SEGURANÇA / RED FLAGS</h3>
                        <Label className="text-sm text-muted-foreground mb-3 block">
                          Alguma das condições abaixo está presente? (selecione todas que se aplicam)
                        </Label>
                        <div className="space-y-2">
                          {[
                            { value: "infeccao_ativa_febre", label: "Infecção ativa ou febre recente" },
                            { value: "infeccao_pele_local", label: "Infecção de pele no local" },
                            { value: "cancer_ativo", label: "Câncer ativo em tratamento" },
                            { value: "doenca_autoimune_ativa", label: "Doença autoimune em atividade" },
                            { value: "diabetes_descompensado", label: "Diabetes descompensado" },
                            { value: "doenca_renal_hepatica", label: "Doença renal ou hepática importante" },
                          ].map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={item.value}
                                checked={answers.red_flags.includes(item.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAnswers(prev => ({ ...prev, red_flags: [...prev.red_flags.filter(v => v !== "nenhum"), item.value] }));
                                  } else {
                                    setAnswers(prev => ({ ...prev, red_flags: prev.red_flags.filter(v => v !== item.value) }));
                                  }
                                }}
                              />
                              <Label htmlFor={item.value} className="text-sm cursor-pointer">{item.label}</Label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2 pt-2 border-t">
                            <Checkbox
                              id="red_flags_nenhum"
                              checked={answers.red_flags.includes("nenhum")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAnswers(prev => ({ ...prev, red_flags: ["nenhum"] }));
                                } else {
                                  setAnswers(prev => ({ ...prev, red_flags: [] }));
                                }
                              }}
                            />
                            <Label htmlFor="red_flags_nenhum" className="text-sm cursor-pointer font-medium text-green-600">Nenhuma das alternativas</Label>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>

                      {/* D) Medicamentos relevantes (multi-select) */}
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-3">D) MEDICAMENTOS RELEVANTES</h3>
                        <Label className="text-sm text-muted-foreground mb-3 block">
                          Uso recente de algum dos medicamentos abaixo? (selecione todos que se aplicam)
                        </Label>
                        <div className="space-y-2">
                          {[
                            { value: "corticoide_oral_4sem", label: "Corticoide oral (<4 semanas)" },
                            { value: "infiltracao_corticoide_3m", label: "Infiltração com corticoide (<3 meses)" },
                            { value: "aine_7dias", label: "Anti-inflamatório (AINE) nos últimos 7 dias" },
                            { value: "anticoagulante", label: "Anticoagulante / antiagregante" },
                            { value: "imunossupressor", label: "Imunossupressor / biológico" },
                          ].map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={item.value}
                                checked={answers.medicamentos.includes(item.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAnswers(prev => ({ ...prev, medicamentos: [...prev.medicamentos.filter(v => v !== "nenhum"), item.value] }));
                                  } else {
                                    setAnswers(prev => ({ ...prev, medicamentos: prev.medicamentos.filter(v => v !== item.value) }));
                                  }
                                }}
                              />
                              <Label htmlFor={item.value} className="text-sm cursor-pointer">{item.label}</Label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2 pt-2 border-t">
                            <Checkbox
                              id="medicamentos_nenhum"
                              checked={answers.medicamentos.includes("nenhum")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAnswers(prev => ({ ...prev, medicamentos: ["nenhum"] }));
                                } else {
                                  setAnswers(prev => ({ ...prev, medicamentos: [] }));
                                }
                              }}
                            />
                            <Label htmlFor="medicamentos_nenhum" className="text-sm cursor-pointer font-medium text-green-600">Nenhum</Label>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>

                      {/* E) Histórico terapêutico */}
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-3">E) HISTÓRICO TERAPÊUTICO</h3>
                        <div className="space-y-4">
                          <div>
                            <Label>Já realizou PRP / PRF / BMAC anteriormente?</Label>
                            <Select value={answers.prp_prf_bmac_anterior} onValueChange={(v) => setAnswers(prev => ({ ...prev, prp_prf_bmac_anterior: v }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nunca">Nunca</SelectItem>
                                <SelectItem value="sim_boa_resposta">Sim, com boa resposta</SelectItem>
                                <SelectItem value="sim_sem_boa_resposta">Sim, sem boa resposta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Já realizou fisioterapia adequada (≥6 semanas) para este problema?</Label>
                            <div className="mt-2">
                              <YesNoRadio
                                id="fisioterapia"
                                value={answers.fisioterapia_6_semanas}
                                onChange={(v) => setAnswers(prev => ({ ...prev, fisioterapia_6_semanas: v }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">Cirurgia prévia na região?</Label>
                            <div className="mt-2">
                              <YesNoRadio
                                id="cirurgia_previa"
                                value={answers.cirurgia_previa_regiao}
                                onChange={(v) => setAnswers(prev => ({ ...prev, cirurgia_previa_regiao: v }))}
                              />
                            </div>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>

                      {/* F) Preparo do solo biológico (multi-select) */}
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-3">F) PREPARO DO SOLO BIOLÓGICO</h3>
                        <Label className="text-sm text-muted-foreground mb-3 block">
                          Algum dos fatores abaixo está presente? (selecione todos que se aplicam)
                        </Label>
                        <div className="space-y-2">
                          {[
                            { value: "sem_exames_60dias", label: "Não possui exames de sangue recentes (<60 dias)" },
                            { value: "historico_anemia_ferro_b12", label: "Histórico de anemia, ferro baixo ou B12 baixa" },
                            { value: "tabagismo_atual", label: "Tabagismo atual" },
                            { value: "obesidade_imc_elevado", label: "Obesidade / IMC elevado" },
                          ].map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={item.value}
                                checked={answers.fatores_preparo.includes(item.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAnswers(prev => ({ ...prev, fatores_preparo: [...prev.fatores_preparo.filter(v => v !== "nenhum"), item.value] }));
                                  } else {
                                    setAnswers(prev => ({ ...prev, fatores_preparo: prev.fatores_preparo.filter(v => v !== item.value) }));
                                  }
                                }}
                              />
                              <Label htmlFor={item.value} className="text-sm cursor-pointer">{item.label}</Label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2 pt-2 border-t">
                            <Checkbox
                              id="fatores_preparo_nenhum"
                              checked={answers.fatores_preparo.includes("nenhum")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAnswers(prev => ({ ...prev, fatores_preparo: ["nenhum"] }));
                                } else {
                                  setAnswers(prev => ({ ...prev, fatores_preparo: [] }));
                                }
                              }}
                            />
                            <Label htmlFor="fatores_preparo_nenhum" className="text-sm cursor-pointer font-medium text-green-600">Nenhum</Label>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>

                      {/* G) Status nutricional / micronutrientes (multi-select) */}
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-600 mb-3">G) STATUS NUTRICIONAL / MICRONUTRIENTES</h3>
                        <Label className="text-sm text-muted-foreground mb-3 block">
                          Em relação à nutrição e recuperação, você se identifica com alguma situação abaixo? (selecione todas que se aplicam)
                        </Label>
                        <div className="space-y-2">
                          {[
                            { value: "pouca_exposicao_solar_sem_vitamina_d", label: "Pouca exposição solar ou não uso vitamina D" },
                            { value: "cansaco_fraqueza_queda_cabelo", label: "Cansaço frequente, fraqueza ou queda de cabelo" },
                            { value: "dieta_vegetariana_vegana_restritiva", label: "Dieta vegetariana/vegana ou restritiva" },
                            { value: "caibras_recuperacao_lenta", label: "Cãibras frequentes ou recuperação muscular lenta" },
                            { value: "baixo_consumo_frutas_verduras", label: "Baixo consumo diário de frutas e verduras" },
                          ].map((item) => (
                            <div key={item.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={item.value}
                                checked={answers.fatores_nutricionais.includes(item.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAnswers(prev => ({ ...prev, fatores_nutricionais: [...prev.fatores_nutricionais.filter(v => v !== "nenhum"), item.value] }));
                                  } else {
                                    setAnswers(prev => ({ ...prev, fatores_nutricionais: prev.fatores_nutricionais.filter(v => v !== item.value) }));
                                  }
                                }}
                              />
                              <Label htmlFor={item.value} className="text-sm cursor-pointer">{item.label}</Label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2 pt-2 border-t">
                            <Checkbox
                              id="fatores_nutricionais_nenhum"
                              checked={answers.fatores_nutricionais.includes("nenhum")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAnswers(prev => ({ ...prev, fatores_nutricionais: ["nenhum"] }));
                                } else {
                                  setAnswers(prev => ({ ...prev, fatores_nutricionais: [] }));
                                }
                              }}
                            />
                            <Label htmlFor="fatores_nutricionais_nenhum" className="text-sm cursor-pointer font-medium text-green-600">Nenhuma das alternativas</Label>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>

                      {/* H) Estilo de Vida */}
                      <div>
                        <h3 className="text-sm font-semibold text-blue-600 mb-3">H) ESTILO DE VIDA</h3>
                        <div className="space-y-4">
                          <div>
                            <Label>Qualidade do sono</Label>
                            <Select value={answers.qualidade_sono} onValueChange={(v) => setAnswers(prev => ({ ...prev, qualidade_sono: v }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="boa">Boa</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="ruim">Ruim</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Consumo de álcool maior que 2 vezes por semana?</Label>
                            <div className="mt-2">
                              <YesNoRadio
                                id="alcool_frequente"
                                value={answers.consumo_alcool_2x_semana}
                                onChange={(v) => setAnswers(prev => ({ ...prev, consumo_alcool_2x_semana: v }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Nível de estresse percebido</Label>
                            <Select value={answers.nivel_estresse} onValueChange={(v) => setAnswers(prev => ({ ...prev, nivel_estresse: v }))}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="baixo">Baixo</SelectItem>
                                <SelectItem value="moderado">Moderado</SelectItem>
                                <SelectItem value="alto">Alto</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
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

                    {/* Card 4: Preparo do Solo */}
                    {analysisResult.soil_preparation?.needed && (
                      <Card className="bg-card/95 backdrop-blur border-amber-500/30 border-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            Preparo do Solo Biológico
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {analysisResult.soil_preparation.recommendations && analysisResult.soil_preparation.recommendations.length > 0 ? (
                            <ul className="space-y-1">
                              {analysisResult.soil_preparation.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm">Preparo necessário antes do procedimento</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Card 5: Motivo Principal */}
                    {analysisResult.key_reasons?.length > 0 && (
                      <Card className="bg-card/95 backdrop-blur border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Motivos Principais
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {analysisResult.key_reasons.map((reason, idx) => (
                              <li key={idx} className="text-sm">• {reason}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Card 6: Próximo Passo */}
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
                  {/* Structured Lab Input */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Hemograma</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="hb" className="text-xs">Hemoglobina (g/dL)</Label>
                        <Input
                          id="hb"
                          placeholder="Ex: 13.5"
                          value={labExams.hemoglobina}
                          onChange={(e) => setLabExams(prev => ({ ...prev, hemoglobina: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ht" className="text-xs">Hematócrito (%)</Label>
                        <Input
                          id="ht"
                          placeholder="Ex: 42"
                          value={labExams.hematocrito}
                          onChange={(e) => setLabExams(prev => ({ ...prev, hematocrito: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="leuco" className="text-xs">Leucócitos (/mm³)</Label>
                        <Input
                          id="leuco"
                          placeholder="Ex: 7500"
                          value={labExams.leucocitos}
                          onChange={(e) => setLabExams(prev => ({ ...prev, leucocitos: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="plaq" className="text-xs">Plaquetas (/mm³)</Label>
                        <Input
                          id="plaq"
                          placeholder="Ex: 250000"
                          value={labExams.plaquetas}
                          onChange={(e) => setLabExams(prev => ({ ...prev, plaquetas: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Separator />

                    <h4 className="text-sm font-semibold">Bioquímica</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="pcr" className="text-xs">PCR (mg/L)</Label>
                        <Input
                          id="pcr"
                          placeholder="Ex: 2.5"
                          value={labExams.pcr}
                          onChange={(e) => setLabExams(prev => ({ ...prev, pcr: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ferritina" className="text-xs">Ferritina (ng/mL)</Label>
                        <Input
                          id="ferritina"
                          placeholder="Ex: 80"
                          value={labExams.ferritina}
                          onChange={(e) => setLabExams(prev => ({ ...prev, ferritina: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="glicemia" className="text-xs">Glicemia (mg/dL)</Label>
                        <Input
                          id="glicemia"
                          placeholder="Ex: 95"
                          value={labExams.glicemia}
                          onChange={(e) => setLabExams(prev => ({ ...prev, glicemia: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hba1c" className="text-xs">HbA1c (%)</Label>
                        <Input
                          id="hba1c"
                          placeholder="Ex: 5.6"
                          value={labExams.hba1c}
                          onChange={(e) => setLabExams(prev => ({ ...prev, hba1c: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

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
                    <Label>Ou cole/digite outros resultados:</Label>
                    <Textarea
                      value={labResultsText}
                      onChange={(e) => setLabResultsText(e.target.value)}
                      placeholder="Cole aqui resultados adicionais..."
                      className="mt-2 min-h-[100px] font-mono text-sm"
                    />
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={handleAnalyzeLabResults}
                    disabled={isAnalyzingLab || isExtractingText}
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
                        <p>Preencha os valores dos exames ou anexe arquivos para ver a interpretação.</p>
                        <p className="mt-2 text-xs">Os resultados serão enviados ao Assistant para análise.</p>
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
                  {hasExamsToRequest() ? (
                    <>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                          {getExamsForPrint().filter(e => e.type === "required").length > 0 && (
                            <div className="border-l-2 border-red-500 pl-3">
                              <h4 className="text-sm font-semibold text-red-600 mb-2">OBRIGATÓRIOS</h4>
                              <div className="space-y-1">
                                {getExamsForPrint().filter(e => e.type === "required").map((exam, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                                    <div>
                                      <span className="font-medium">{exam.name}</span>
                                      {exam.justification && (
                                        <span className="text-muted-foreground"> — {exam.justification}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {getExamsForPrint().filter(e => e.type === "optional").length > 0 && (
                            <div className="border-l-2 border-amber-500 pl-3">
                              <h4 className="text-sm font-semibold text-amber-600 mb-2">OPCIONAIS</h4>
                              <div className="space-y-1">
                                {getExamsForPrint().filter(e => e.type === "optional").map((exam, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                    <div>
                                      <span className="font-medium">{exam.name}</span>
                                      {exam.justification && (
                                        <span> — {exam.justification}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                  ) : analysisResult ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Ban className="w-10 h-10 text-amber-500 mb-3" />
                      <p className="text-sm font-medium text-amber-700">Nenhum exame foi indicado pela triagem</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O paciente não necessita de exames laboratoriais adicionais
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
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
                    <p className="text-sm text-muted-foreground text-center py-8">
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
        content={printPreviewType === "exams" ? getExamsForPrint() : (patientOrientations || "")}
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
