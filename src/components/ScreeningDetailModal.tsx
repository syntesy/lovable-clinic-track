import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, XCircle, ClipboardList, Pill, Activity, Heart, Apple, Moon, Ban, Check, X, FileText, Beaker } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { normalizeExamList, getExamLabel, isCriticalExam } from "@/lib/exam-catalog";

interface ScreeningDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screening: Tables<"prp_screenings"> | null;
}

interface QuestionnaireAnswers {
  idade?: number | null;
  sexo?: string;
  regiao_principal?: string;
  diagnostico_suspeito?: string;
  tempo_dor?: string;
  dor_escala?: number | null;
  procedimento_considerado?: string;
  red_flags?: string[];
  medicamentos?: string[];
  prp_prf_bmac_anterior?: string;
  fisioterapia_6_semanas?: boolean | null;
  cirurgia_previa_regiao?: boolean | null;
  fatores_preparo?: string[];
  fatores_nutricionais?: string[];
  qualidade_sono?: string;
  consumo_alcool_2x_semana?: boolean | null;
  nivel_estresse?: string;
}

interface QuestionnaireData {
  answers?: QuestionnaireAnswers;
  mode?: string;
  patient_id?: string;
  provided_exams?: any;
  // Suporte para estrutura antiga direta
  [key: string]: any;
}

// Mapeamento completo de opções para exibição (atualizado com as chaves do banco)
const allOptions = {
  regiao_principal: {
    ombro: "Ombro",
    cotovelo: "Cotovelo",
    punho_mao: "Punho / Mão",
    quadril: "Quadril",
    joelho: "Joelho",
    tornozelo_pe: "Tornozelo / Pé",
    coluna_cervical: "Coluna Cervical",
    coluna_lombar: "Coluna Lombar",
    coluna: "Coluna",
    outro: "Outro",
  },
  procedimento_considerado: {
    prp: "PRP (Plasma Rico em Plaquetas)",
    prf: "PRF (Fibrina Rica em Plaquetas)",
    bmac: "BMAC (Aspirado de Medula Óssea)",
    proloterapia: "Proloterapia",
    NAO_SEI: "Não sei / A definir",
    outro: "Outro / A definir",
  },
  tempo_dor: {
    agudo: "Agudo (< 6 semanas)",
    "menos_6sem": "Agudo (< 6 semanas)",
    subagudo: "Subagudo (6 sem – 3 meses)",
    "6-12sem": "Subagudo (6 sem – 3 meses)",
    cronico: "Crônico (> 3 meses)",
    "mais_12sem": "Crônico (> 3 meses)",
  },
  qualidade_sono: {
    boa: "Boa (>7h, restaurador)",
    regular: "Regular (5-7h ou má qualidade)",
    ruim: "Ruim (<5h)",
  },
  nivel_estresse: {
    baixo: "Baixo",
    moderado: "Moderado",
    alto: "Alto",
  },
  prp_prf_bmac_anterior: {
    nunca: "Nunca realizou",
    resposta_parcial: "Sim, resposta parcial",
    resposta_boa: "Sim, resposta boa",
    sem_resposta: "Sim, sem resposta",
  },
  red_flags: {
    infeccao_ativa: "Infecção ativa local ou sistêmica",
    infeccao_ativa_febre: "Infecção ativa / Febre",
    infeccao_pele_local: "Infecção de pele no local",
    neoplasia_ativa: "Neoplasia ativa (sólida ou hematológica)",
    cancer_ativo: "Câncer ativo / Tratamento oncológico",
    coagulopatia_grave: "Coagulopatia grave não controlada",
    disturbio_coagulacao: "Distúrbio de coagulação grave",
    trombocitopenia: "Trombocitopenia (<100 mil)",
    plaquetas_baixas: "Plaquetas muito baixas (<100.000)",
    anemia_grave: "Anemia grave (Hb <10)",
    anemia_severa: "Anemia severa (Hb <10)",
    gestacao: "Gestação",
    gravidez_amamentacao: "Gravidez ou amamentação",
    alergia_anestesico: "Alergia conhecida a anestésico local",
    alergia_anestesicos: "Alergia a anestésicos locais",
    instabilidade_articular: "Instabilidade articular significativa",
    diabetes_descompensado: "Diabetes descompensado",
    nenhum: "Nenhum",
  },
  medicamentos: {
    aine_continuo: "AINEs contínuo (>7 dias)",
    aine_7dias: "AINEs nos últimos 7 dias",
    corticoide_sistemico: "Corticoide sistêmico",
    corticoide_oral_4sem: "Corticoide oral nas últimas 4 semanas",
    anticoagulante: "Anticoagulante oral",
    anticoagulantes: "Anticoagulantes",
    imunossupressor: "Imunossupressor",
    imunossupressores: "Imunossupressores",
    quimio_radio: "Quimioterapia / Radioterapia recente",
    quimio_radioterapia: "Quimioterapia / Radioterapia",
    fluoroquinolona: "Fluoroquinolona últimos 60 dias",
    antibiotico_fluoroquinolona: "Fluoroquinolona últimos 60 dias",
    nenhum: "Nenhum",
  },
  fatores_preparo: {
    tabagista_ativo: "Tabagista ativo",
    tabagismo_atual: "Tabagismo atual",
    diabetes_descompensado: "Diabetes descompensado (HbA1c >8%)",
    obesidade: "Obesidade (IMC >30)",
    obesidade_imc_elevado: "Obesidade / IMC elevado",
    infiltracao_corticoide: "Infiltração corticoide local <3 meses",
    corticoide_local_3meses: "Infiltração de corticoide local <3 meses",
    sem_exames_60dias: "Sem exames laboratoriais nos últimos 60 dias",
    nenhum: "Nenhum",
  },
  fatores_nutricionais: {
    vitamina_d_baixa: "Vit D baixa (<30)",
    pouca_exposicao_solar_sem_vitamina_d: "Pouca exposição solar / Sem vitamina D",
    ferritina_baixa: "Ferritina <30",
    cansaco_fraqueza_queda_cabelo: "Cansaço / Fraqueza / Queda de cabelo (possível ferropenia)",
    b12_baixa: "B12 <300",
    omega3_baixo: "Ômega-3 baixo / não suplementa",
    baixo_consumo_frutas_verduras: "Baixo consumo de frutas e verduras",
    nenhum: "Nenhum / Sem dados",
  },
};

// Perguntas do questionário com suas opções
const questionnaireQuestions = {
  sectionA: {
    title: "A) Identificação do Caso",
    questions: [
      {
        key: "regiao_principal",
        question: "Qual a região principal da dor/lesão?",
        type: "single",
        options: allOptions.regiao_principal,
      },
      {
        key: "diagnostico_suspeito",
        question: "Qual o diagnóstico clínico suspeito ou confirmado?",
        type: "text",
      },
      {
        key: "tempo_dor",
        question: "Há quanto tempo o paciente apresenta dor?",
        type: "single",
        options: allOptions.tempo_dor,
      },
      {
        key: "dor_escala",
        question: "Qual a intensidade da dor (EVA 0-10)?",
        type: "number",
      },
    ],
  },
  sectionB: {
    title: "B) Procedimento Pretendido",
    questions: [
      {
        key: "procedimento_considerado",
        question: "Qual procedimento ortobiológico está sendo considerado?",
        type: "single",
        options: allOptions.procedimento_considerado,
      },
    ],
  },
  sectionC: {
    title: "C) Segurança / Red Flags",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    questions: [
      {
        key: "red_flags",
        question: "O paciente apresenta alguma das seguintes condições? (Marque todas que se aplicam)",
        type: "multi",
        options: allOptions.red_flags,
        critical: true,
      },
    ],
  },
  sectionD: {
    title: "D) Medicamentos Relevantes",
    icon: Pill,
    iconColor: "text-blue-500",
    questions: [
      {
        key: "medicamentos",
        question: "O paciente está em uso de algum dos seguintes medicamentos? (Marque todos que se aplicam)",
        type: "multi",
        options: allOptions.medicamentos,
      },
    ],
  },
  sectionE: {
    title: "E) Histórico Terapêutico",
    icon: Heart,
    iconColor: "text-pink-500",
    questions: [
      {
        key: "prp_prf_bmac_anterior",
        question: "O paciente já realizou PRP, PRF ou BMAC anteriormente?",
        type: "single",
        options: allOptions.prp_prf_bmac_anterior,
      },
      {
        key: "fisioterapia_6_semanas",
        question: "Realizou fisioterapia nas últimas 6 semanas?",
        type: "boolean",
      },
      {
        key: "cirurgia_previa_regiao",
        question: "Teve cirurgia prévia na região afetada?",
        type: "boolean",
      },
    ],
  },
  sectionF: {
    title: "F) Preparo do Solo Biológico",
    questions: [
      {
        key: "fatores_preparo",
        question: "O paciente apresenta algum dos seguintes fatores? (Marque todos que se aplicam)",
        type: "multi",
        options: allOptions.fatores_preparo,
      },
    ],
  },
  sectionG: {
    title: "G) Status Nutricional / Micronutrientes",
    icon: Apple,
    iconColor: "text-green-500",
    questions: [
      {
        key: "fatores_nutricionais",
        question: "Há alterações laboratoriais nutricionais? (Marque todos que se aplicam)",
        type: "multi",
        options: allOptions.fatores_nutricionais,
      },
    ],
  },
  sectionH: {
    title: "H) Estilo de Vida",
    icon: Moon,
    iconColor: "text-indigo-500",
    questions: [
      {
        key: "qualidade_sono",
        question: "Como é a qualidade do sono do paciente?",
        type: "single",
        options: allOptions.qualidade_sono,
      },
      {
        key: "consumo_alcool_2x_semana",
        question: "O paciente consome álcool 2 ou mais vezes por semana?",
        type: "boolean",
      },
      {
        key: "nivel_estresse",
        question: "Qual o nível de estresse percebido pelo paciente?",
        type: "single",
        options: allOptions.nivel_estresse,
      },
    ],
  },
};

export function ScreeningDetailModal({
  open,
  onOpenChange,
  screening,
}: ScreeningDetailModalProps) {
  if (!screening) return null;

  // Suporta ambas as estruturas: dados diretos ou dentro de .answers
  const rawData = screening.questionnaire_responses as QuestionnaireData;
  const responses: QuestionnaireAnswers = rawData?.answers 
    ? rawData.answers 
    : (rawData as unknown as QuestionnaireAnswers);
  const classification = screening.classification || "";
  const analysisResult = screening.analysis_result || "";

  const getClassificationBadge = () => {
    switch (classification) {
      case "APTO":
        return (
          <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            APTO
          </Badge>
        );
      case "NAO_APTO_PREPARO":
        return (
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 gap-1">
            <AlertTriangle className="w-3 h-3" />
            APTO COM PREPARO
          </Badge>
        );
      case "CONTRAINDICADO":
        return (
          <Badge className="bg-red-500/20 text-red-700 border-red-500/30 gap-1">
            <XCircle className="w-3 h-3" />
            CONTRAINDICADO / ADIAR
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {classification || "Não classificado"}
          </Badge>
        );
    }
  };

  // Renderizar resposta de acordo com o tipo
  const renderAnswer = (question: any, value: any) => {
    if (question.type === "text") {
      return (
        <p className="font-medium text-foreground mt-1">
          {value || "Não informado"}
        </p>
      );
    }

    if (question.type === "number") {
      return (
        <p className="font-medium text-foreground mt-1">
          {value !== null && value !== undefined ? `${value}/10` : "Não informado"}
        </p>
      );
    }

    if (question.type === "boolean") {
      return (
        <div className="flex items-center gap-2 mt-1">
          {value === true ? (
            <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1">
              <Check className="w-3 h-3" />
              Sim
            </Badge>
          ) : value === false ? (
            <Badge variant="secondary" className="gap-1">
              <X className="w-3 h-3" />
              Não
            </Badge>
          ) : (
            <span className="text-muted-foreground">Não informado</span>
          )}
        </div>
      );
    }

    if (question.type === "single" && question.options) {
      const selectedOption = question.options[value];
      return (
        <div className="mt-2 space-y-1">
          {Object.entries(question.options).map(([key, label]) => {
            const isSelected = key === value;
            return (
              <div
                key={key}
                className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "text-muted-foreground"
                }`}
              >
                {isSelected ? (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className={isSelected ? "font-medium text-foreground" : ""}>
                  {label as string}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (question.type === "multi" && question.options) {
      const selectedValues = Array.isArray(value) ? value : [];
      const hasNenhum = selectedValues.includes("nenhum");
      
      return (
        <div className="mt-2 space-y-1">
          {Object.entries(question.options).map(([key, label]) => {
            const isSelected = selectedValues.includes(key);
            const isCritical = question.critical && isSelected && key !== "nenhum";
            return (
              <div
                key={key}
                className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                  isCritical
                    ? "bg-red-500/10 border border-red-500/30"
                    : isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "text-muted-foreground"
                }`}
              >
                {isSelected ? (
                  <Check className={`w-4 h-4 flex-shrink-0 ${isCritical ? "text-red-500" : "text-primary"}`} />
                ) : (
                  <div className="w-4 h-4 rounded border border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className={`${isSelected ? "font-medium" : ""} ${isCritical ? "text-red-700 dark:text-red-400" : isSelected ? "text-foreground" : ""}`}>
                  {label as string}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return <span className="text-muted-foreground">Não informado</span>;
  };

  // Obter motivos de contraindicação
  const getContraindicationReasons = () => {
    const reasons: string[] = [];
    
    if (responses.red_flags && responses.red_flags.length > 0) {
      const criticalFlags = responses.red_flags.filter(f => f !== "nenhum");
      criticalFlags.forEach(flag => {
        const label = allOptions.red_flags[flag as keyof typeof allOptions.red_flags] || flag;
        reasons.push(`⚠️ ${label}`);
      });
    }
    
    if (responses.medicamentos && responses.medicamentos.length > 0) {
      const criticalMeds = responses.medicamentos.filter(m => m !== "nenhum");
      criticalMeds.forEach(med => {
        const label = allOptions.medicamentos[med as keyof typeof allOptions.medicamentos] || med;
        reasons.push(`💊 ${label}`);
      });
    }
    
    if (responses.fatores_preparo && responses.fatores_preparo.length > 0) {
      const factors = responses.fatores_preparo.filter(f => f !== "nenhum");
      factors.forEach(factor => {
        const label = allOptions.fatores_preparo[factor as keyof typeof allOptions.fatores_preparo] || factor;
        reasons.push(`🩺 ${label}`);
      });
    }

    if (responses.fatores_nutricionais && responses.fatores_nutricionais.length > 0) {
      const nutritional = responses.fatores_nutricionais.filter(n => n !== "nenhum");
      nutritional.forEach(item => {
        const label = allOptions.fatores_nutricionais[item as keyof typeof allOptions.fatores_nutricionais] || item;
        reasons.push(`🍎 ${label}`);
      });
    }
    
    return reasons;
  };

  const renderSection = (sectionKey: string, section: any) => {
    const IconComponent = section.icon;
    
    return (
      <Card key={sectionKey}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {IconComponent && <IconComponent className={`w-4 h-4 ${section.iconColor || "text-primary"}`} />}
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.questions.map((q: any) => (
            <div key={q.key} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-muted-foreground">
                {q.question}
              </p>
              {renderAnswer(q, responses[q.key as keyof QuestionnaireAnswers])}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-primary" />
            Avaliação Completa - Triagem de Ortobiológicos
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* Cabeçalho com data e classificação */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Data da avaliação</p>
                <p className="font-medium">
                  {format(new Date(screening.screening_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                <p className="text-sm text-muted-foreground">Classificação Final</p>
                {getClassificationBadge()}
              </div>
            </div>

            {/* Motivos de contraindicação/preparo */}
            {(classification === "CONTRAINDICADO" || classification === "NAO_APTO_PREPARO") && (
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Ban className="w-4 h-4" />
                    {classification === "CONTRAINDICADO" 
                      ? "Motivos da Contraindicação" 
                      : "Fatores que Requerem Preparo Prévio"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getContraindicationReasons().map((reason, idx) => (
                      <li key={idx} className="text-sm text-red-700 dark:text-red-400 font-medium">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Análise da Triagem - exibe com normalização de exames */}
            {analysisResult && (() => {
              // Tenta detectar se é JSON e extrair apenas os textos relevantes
              try {
                const parsed = JSON.parse(analysisResult);
                const keyReasons = parsed?.key_reasons || [];
                const rawRequestedExams = [
                  ...(parsed?.requested_exams?.required || []),
                  ...(parsed?.requested_exams?.optional || [])
                ];
                
                // NORMALIZAR exames usando catálogo canônico
                const normalizedExamCodes = normalizeExamList(rawRequestedExams);
                const hasContent = keyReasons.length > 0 || normalizedExamCodes.length > 0;
                
                if (!hasContent) return null;
                
                return (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Análise e Recomendações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {keyReasons.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Principais Motivos:</p>
                          <ul className="space-y-1">
                            {keyReasons.map((reason: string, idx: number) => (
                              <li key={idx} className="text-sm flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {normalizedExamCodes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Exames Solicitados:</p>
                          <ul className="space-y-1">
                            {normalizedExamCodes.map((code: string, idx: number) => {
                              const label = getExamLabel(code);
                              const critical = isCriticalExam(code);
                              return (
                                <li key={idx} className="text-sm flex items-center gap-2">
                                  {critical ? (
                                    <Beaker className="w-3 h-3 text-red-500" />
                                  ) : (
                                    <FileText className="w-3 h-3 text-blue-500" />
                                  )}
                                  <span className={critical ? "font-medium" : ""}>
                                    {label}
                                  </span>
                                  {critical && (
                                    <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                      Crítico
                                    </Badge>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              } catch {
                // Se não for JSON, exibe como texto simples (se não estiver vazio)
                if (analysisResult.trim()) {
                  return (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          Análise e Recomendações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                          {analysisResult}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              }
            })()}

            <Separator />

            <div className="text-center py-2">
              <h3 className="text-lg font-semibold text-foreground">Questionário Completo</h3>
              <p className="text-sm text-muted-foreground">Todas as perguntas e respostas do paciente</p>
            </div>

            {/* Renderizar todas as seções do questionário */}
            {Object.entries(questionnaireQuestions).map(([key, section]) => 
              renderSection(key, section)
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
