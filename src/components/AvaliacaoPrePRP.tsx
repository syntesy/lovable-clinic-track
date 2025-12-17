import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, ClipboardList, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuestionBlock {
  id: string;
  title: string;
  questions: { id: string; text: string }[];
}

const questionBlocks: QuestionBlock[] = [
  {
    id: "dorCicatrizacao",
    title: "Dor e Cicatrização",
    questions: [
      { id: "q1", text: "Você sente dor persistente há mais de 3 meses?" },
      { id: "q2", text: "Já teve dificuldade de cicatrização em feridas ou cirurgias?" },
      { id: "q3", text: "Possui histórico de lesões que não melhoraram com tratamento convencional?" },
    ],
  },
  {
    id: "inflamacaoSistemica",
    title: "Inflamação Sistêmica",
    questions: [
      { id: "q4", text: "Você tem inchaço frequente nas articulações ou músculos?" },
      { id: "q5", text: "Possui diagnóstico de doença autoimune (artrite, lúpus, etc.)?" },
      { id: "q6", text: "Sente rigidez matinal que dura mais de 30 minutos?" },
      { id: "q7", text: "Tem infecções recorrentes (gripes, infecções urinárias, etc.)?" },
    ],
  },
  {
    id: "metabolismoEnergetico",
    title: "Metabolismo Energético",
    questions: [
      { id: "q8", text: "Sente fadiga frequente ou cansaço excessivo?" },
      { id: "q9", text: "Tem cãibras musculares com frequência?" },
      { id: "q10", text: "Dorme mal ou acorda cansado mesmo após dormir?" },
      { id: "q11", text: "Tem dificuldade de concentração ou 'névoa mental'?" },
    ],
  },
  {
    id: "ferroAnemia",
    title: "Ferro e Anemia",
    questions: [
      { id: "q12", text: "Já foi diagnosticado com anemia?" },
      { id: "q13", text: "Sente tonturas frequentes ou falta de ar ao esforço leve?" },
      { id: "q14", text: "Tem palidez na pele, unhas ou mucosas?" },
      { id: "q15", text: "É vegetariano/vegano ou tem dieta restritiva?" },
    ],
  },
  {
    id: "metabolismoGlicemico",
    title: "Metabolismo Glicêmico",
    questions: [
      { id: "q16", text: "Tem diagnóstico de diabetes ou pré-diabetes?" },
      { id: "q17", text: "Sente fome excessiva ou vontade de doces frequente?" },
      { id: "q18", text: "Tem gordura abdominal acumulada?" },
      { id: "q19", text: "Possui histórico familiar de diabetes?" },
    ],
  },
  {
    id: "eixoHormonal",
    title: "Eixo Hormonal",
    questions: [
      { id: "q20", text: "Tem sintomas de alteração tireoidiana (frio excessivo, ganho de peso, queda de cabelo)?" },
      { id: "q21", text: "Homens: sente diminuição de libido ou força muscular?" },
      { id: "q22", text: "Mulheres: tem ciclos menstruais irregulares?" },
      { id: "q23", text: "Está em uso de reposição hormonal?" },
    ],
  },
  {
    id: "medicamentos",
    title: "Uso de Medicamentos",
    questions: [
      { id: "q24", text: "Usou anti-inflamatórios (ibuprofeno, diclofenaco, etc.) nos últimos 7 dias?" },
      { id: "q25", text: "Usou corticoides (prednisona, dexametasona, infiltração) nos últimos 30 dias?" },
      { id: "q26", text: "Faz uso contínuo de anticoagulantes (AAS, varfarina, etc.)?" },
      { id: "q27", text: "Usa medicamentos imunossupressores?" },
    ],
  },
  {
    id: "estiloVida",
    title: "Estilo de Vida",
    questions: [
      { id: "q28", text: "Pratica atividade física regular (mínimo 3x/semana)?" },
      { id: "q29", text: "Consome álcool regularmente (mais de 2x/semana)?" },
      { id: "q30", text: "É fumante ou ex-fumante recente (menos de 1 ano)?" },
      { id: "q31", text: "Tem exposição solar adequada ou suplementa vitamina D?" },
    ],
  },
];

interface AvaliacaoPrePRPProps {
  patientId: string;
  patientName: string;
}

const AvaliacaoPrePRP = ({ patientId, patientName }: AvaliacaoPrePRPProps) => {
  const [answers, setAnswers] = useState<Record<string, Record<string, boolean>>>({});
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const handleAnswerChange = (blockId: string, questionId: string, checked: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        [questionId]: checked,
      },
    }));
  };

  const getQuestionText = (blockId: string, questionId: string): string => {
    const block = questionBlocks.find(b => b.id === blockId);
    const question = block?.questions.find(q => q.id === questionId);
    return question?.text || questionId;
  };

  const formatAnswersForAPI = () => {
    const formatted: Record<string, Record<string, boolean>> = {};
    for (const block of questionBlocks) {
      formatted[block.id] = {};
      for (const question of block.questions) {
        const questionText = question.text;
        formatted[block.id][questionText] = answers[block.id]?.[question.id] || false;
      }
    }
    return formatted;
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const formattedAnswers = formatAnswersForAPI();
      
      const { data, error } = await supabase.functions.invoke('analyze-prp', {
        body: { questionnaireData: formattedAnswers }
      });

      if (error) throw error;
      
      setAnalysis(data.analysis);
      toast.success("Análise concluída com sucesso!");
    } catch (error) {
      console.error("Error analyzing:", error);
      toast.error("Erro ao realizar análise. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuestionnaire = () => {
    setAnswers({});
    setAnalysis(null);
    setShowQuestionnaire(false);
  };

  const getStatusColor = (analysisText: string) => {
    if (analysisText.includes("🟢") || analysisText.toLowerCase().includes("favorável")) {
      return "text-green-600";
    }
    if (analysisText.includes("🔴") || analysisText.toLowerCase().includes("inadequado")) {
      return "text-red-600";
    }
    return "text-yellow-600";
  };

  if (!showQuestionnaire && !analysis) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-primary" />
            Avaliação Pré-PRP (Solo Biológico)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Avalie a condição biológica do paciente para terapias ortobiológicas (PRP). 
            O questionário analisa riscos metabólicos, inflamatórios e regenerativos.
          </p>
          <Button 
            onClick={() => setShowQuestionnaire(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Iniciar Avaliação Pré-PRP
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (analysis) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Resultado da Avaliação Pré-PRP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Paciente: <span className="font-medium text-foreground">{patientName}</span>
          </div>
          
          <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            <div className={`whitespace-pre-wrap text-sm ${getStatusColor(analysis)}`}>
              {analysis.split('\n').map((line, index) => {
                // Style headers
                if (line.startsWith('📌')) {
                  return (
                    <div key={index} className="font-bold text-foreground mt-4 mb-2">
                      {line}
                    </div>
                  );
                }
                // Style status indicators
                if (line.includes('🟢')) {
                  return (
                    <div key={index} className="text-green-600 font-medium">
                      {line}
                    </div>
                  );
                }
                if (line.includes('🟡')) {
                  return (
                    <div key={index} className="text-yellow-600 font-medium">
                      {line}
                    </div>
                  );
                }
                if (line.includes('🔴')) {
                  return (
                    <div key={index} className="text-red-600 font-medium">
                      {line}
                    </div>
                  );
                }
                // Style list items
                if (line.trim().startsWith('-')) {
                  return (
                    <div key={index} className="text-foreground ml-4">
                      {line}
                    </div>
                  );
                }
                return (
                  <div key={index} className="text-foreground">
                    {line}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={resetQuestionnaire}
            >
              Nova Avaliação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
          Questionário Pré-PRP - {patientName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Responda SIM ou NÃO para cada pergunta. As respostas serão analisadas por IA para avaliar o solo biológico do paciente.
        </p>

        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-6">
            {questionBlocks.map((block) => (
              <div key={block.id} className="space-y-3">
                <h3 className="font-semibold text-foreground border-b pb-2">
                  {block.title}
                </h3>
                <div className="space-y-3">
                  {block.questions.map((question) => (
                    <div key={question.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`${block.id}-${question.id}`}
                        checked={answers[block.id]?.[question.id] || false}
                        onCheckedChange={(checked) =>
                          handleAnswerChange(block.id, question.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`${block.id}-${question.id}`}
                        className="font-normal text-sm leading-relaxed cursor-pointer"
                      >
                        {question.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetQuestionnaire}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Analisar Solo Biológico
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvaliacaoPrePRP;
