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
import { Loader2, Printer, FileText, ClipboardList, FlaskConical, History, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";
import { ptBR } from "date-fns/locale";

interface QuestionBlock {
  id: string;
  title: string;
  questions: string[];
}

const questionBlocks: QuestionBlock[] = [
  {
    id: "dorCicatrizacao",
    title: "DOR E CICATRIZAÇÃO",
    questions: [
      "Dor persistente há mais de 3 meses?",
      "Dificuldade de cicatrização em feridas ou cirurgias?",
      "Histórico de lesões que não melhoraram com tratamento convencional?"
    ]
  },
  {
    id: "inflamacaoSistemica",
    title: "INFLAMAÇÃO SISTÊMICA",
    questions: [
      "Inchaço frequente em articulações ou músculos?",
      "Diagnóstico de doença autoimune (artrite, lúpus etc.)?",
      "Rigidez matinal maior que 30 minutos?",
      "Infecções recorrentes (gripes, infecções urinárias etc.)?"
    ]
  },
  {
    id: "metabolismoEnergetico",
    title: "METABOLISMO ENERGÉTICO",
    questions: [
      "Fadiga frequente ou cansaço excessivo?",
      "Cãibras musculares frequentes?",
      "Sono não reparador?",
      "Dificuldade de concentração / \"névoa mental\"?"
    ]
  },
  {
    id: "ferroAnemia",
    title: "FERRO E ANEMIA",
    questions: [
      "Diagnóstico prévio de anemia?",
      "Tonturas ou falta de ar ao esforço leve?",
      "Palidez em pele, unhas ou mucosas?",
      "Dieta restritiva (vegetariano/vegano)?"
    ]
  },
  {
    id: "metabolismoGlicemico",
    title: "METABOLISMO GLICÊMICO",
    questions: [
      "Diabetes ou pré-diabetes?",
      "Vontade excessiva por doces?",
      "Gordura abdominal?",
      "Histórico familiar de diabetes?"
    ]
  },
  {
    id: "eixoHormonal",
    title: "EIXO HORMONAL",
    questions: [
      "Sintomas de disfunção tireoidiana?",
      "Homens: redução de libido ou força?",
      "Mulheres: ciclos menstruais irregulares?",
      "Uso de reposição hormonal?"
    ]
  },
  {
    id: "medicamentos",
    title: "USO DE MEDICAMENTOS",
    questions: [
      "Uso de anti-inflamatórios nos últimos 7 dias?",
      "Uso de corticoides (oral ou infiltração) nos últimos 3 meses?",
      "Uso contínuo de anticoagulantes/antiagregantes?",
      "Uso de medicamentos imunossupressores?"
    ]
  },
  {
    id: "estiloVida",
    title: "ESTILO DE VIDA",
    questions: [
      "Atividade física regular (≥3x/semana)?",
      "Consumo regular de álcool (>2x/semana)?",
      "Tabagismo atual ou recente (<1 ano)?",
      "Exposição solar adequada ou suplementação de vitamina D?"
    ]
  }
];

export default function TriagemBiologica() {
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, Record<string, boolean>>>({});
  const [analysis, setAnalysis] = useState<string>("");
  const [classification, setClassification] = useState<string>("");
  const [recommendedExams, setRecommendedExams] = useState<string[]>([]);
  const [patientOrientations, setPatientOrientations] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [labResultsText, setLabResultsText] = useState("");
  const [isAnalyzingLab, setIsAnalyzingLab] = useState(false);
  const [labInterpretation, setLabInterpretation] = useState("");
  const [activeTab, setActiveTab] = useState("triagem");
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printPreviewType, setPrintPreviewType] = useState<"exams" | "orientations">("exams");

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

  // Initialize answers
  useEffect(() => {
    const initialAnswers: Record<string, Record<string, boolean>> = {};
    questionBlocks.forEach(block => {
      initialAnswers[block.id] = {};
      block.questions.forEach(q => {
        initialAnswers[block.id][q] = false;
      });
    });
    setAnswers(initialAnswers);
  }, []);

  const handleAnswerChange = (blockId: string, question: string, checked: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        [question]: checked
      }
    }));
  };

  const handleAnalyze = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente antes de iniciar a triagem");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('triagem-prp', {
        body: { questionnaireData: answers, action: "questionnaire" }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      setClassification(data.classification);
      setRecommendedExams(data.recommendedExams || []);
      setPatientOrientations(data.patientOrientations || "");

      // Save to database
      const { error: saveError } = await supabase
        .from("prp_screenings")
        .insert({
          patient_id: selectedPatientId,
          questionnaire_responses: answers,
          analysis_result: data.analysis,
          classification: data.classification,
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

  const handleAnalyzeLabResults = async () => {
    if (!labResultsText.trim()) {
      toast.error("Insira os resultados dos exames");
      return;
    }

    if (!selectedPatientId) {
      toast.error("Selecione um paciente");
      return;
    }

    // Get latest screening
    const latestScreening = screenings?.[0];
    if (!latestScreening) {
      toast.error("Realize a triagem primeiro antes de inserir resultados");
      return;
    }

    setIsAnalyzingLab(true);
    try {
      const { data, error } = await supabase.functions.invoke('triagem-prp', {
        body: { labResults: { rawText: labResultsText }, action: "lab_results" }
      });

      if (error) throw error;

      setLabInterpretation(data.analysis);

      // Save lab results
      const { error: saveError } = await supabase
        .from("prp_lab_results")
        .insert({
          screening_id: latestScreening.id,
          raw_text: labResultsText,
          interpretation: data.analysis,
          updated_classification: data.classification
        });

      if (saveError) throw saveError;

      // Update screening classification if changed
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

  const handleOpenPrintPreview = (type: "exams" | "orientations") => {
    setPrintPreviewType(type);
    setPrintPreviewOpen(true);
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "APTO":
        return <Badge className="bg-emerald-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> APTO PARA ORTOBIOLÓGICO</Badge>;
      case "NAO_APTO_PREPARO":
        return <Badge className="bg-amber-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" /> NECESSITA PREPARO BIOLÓGICO</Badge>;
      case "CONTRAINDICADO":
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
          <p className="text-sm text-muted-foreground mt-1">
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
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Selecione um paciente para iniciar a triagem" />
            </SelectTrigger>
            <SelectContent>
              {patients?.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                              <div key={question} className="flex items-start space-x-3">
                                <Checkbox
                                  id={`${block.id}-${question}`}
                                  checked={answers[block.id]?.[question] || false}
                                  onCheckedChange={(checked) => 
                                    handleAnswerChange(block.id, question, checked as boolean)
                                  }
                                />
                                <Label 
                                  htmlFor={`${block.id}-${question}`}
                                  className="text-sm text-foreground/80 leading-tight cursor-pointer"
                                >
                                  {question}
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

              {/* Analysis Result */}
              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Análise Biológica da Triagem</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {getClassificationBadge(classification)}
                      </div>
                      <ScrollArea className="h-[450px] pr-4">
                        <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
                          {analysis}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center text-muted-foreground text-sm">
                      Preencha o questionário e clique em "Enviar para Análise" para ver os resultados
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lab Results Tab */}
          <TabsContent value="resultados" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Inserir Resultados de Exames</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Cole ou digite os resultados dos exames laboratoriais:</Label>
                    <Textarea
                      value={labResultsText}
                      onChange={(e) => setLabResultsText(e.target.value)}
                      placeholder="Exemplo:&#10;Hemograma: Hb 12.5 g/dL, Ht 38%&#10;Ferritina: 45 ng/mL&#10;Vitamina D: 28 ng/mL&#10;PCR: 3.2 mg/L&#10;..."
                      className="mt-2 min-h-[300px] font-mono text-sm"
                    />
                  </div>
                  <Button 
                    onClick={handleAnalyzeLabResults}
                    disabled={isAnalyzingLab || !labResultsText.trim()}
                    className="w-full"
                  >
                    {isAnalyzingLab ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando Exames...
                      </>
                    ) : (
                      "Analisar Resultados"
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
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
                        {labInterpretation}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                      Insira os resultados dos exames para ver a interpretação
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
                      <div className="space-y-2">
                        {recommendedExams.map((exam, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {exam}
                          </div>
                        ))}
                      </div>
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
                  {analysis ? (
                    <>
                      <ScrollArea className="h-[200px] pr-4">
                        <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {patientOrientations || "Orientações disponíveis na análise completa."}
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
                          <ScrollArea className="h-[200px]">
                            <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                              {screening.analysis_result}
                            </div>
                          </ScrollArea>
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
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
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
        content={printPreviewType === "exams" ? recommendedExams : (patientOrientations || analysis)}
      />
    </div>
  );
}
