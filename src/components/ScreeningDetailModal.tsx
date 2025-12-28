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
import { AlertTriangle, CheckCircle2, XCircle, ClipboardList, Pill, Activity, Heart, Apple, Moon, Ban } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

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

const regionLabels: Record<string, string> = {
  ombro: "Ombro",
  cotovelo: "Cotovelo",
  punho_mao: "Punho / Mão",
  quadril: "Quadril",
  joelho: "Joelho",
  tornozelo_pe: "Tornozelo / Pé",
  coluna_cervical: "Coluna Cervical",
  coluna_lombar: "Coluna Lombar",
  outro: "Outro",
};

const procedureLabels: Record<string, string> = {
  prp: "PRP (Plasma Rico em Plaquetas)",
  prf: "PRF (Fibrina Rica em Plaquetas)",
  bmac: "BMAC (Aspirado de Medula Óssea)",
  proloterapia: "Proloterapia",
  outro: "Outro / A definir",
};

const painDurationLabels: Record<string, string> = {
  agudo: "Agudo (< 6 semanas)",
  subagudo: "Subagudo (6 sem – 3 meses)",
  cronico: "Crônico (> 3 meses)",
};

const sleepLabels: Record<string, string> = {
  boa: "Boa (>7h, restaurador)",
  regular: "Regular (5-7h ou má qualidade)",
  ruim: "Ruim (<5h)",
};

const stressLabels: Record<string, string> = {
  baixo: "Baixo",
  moderado: "Moderado",
  alto: "Alto",
};

const priorTreatmentLabels: Record<string, string> = {
  nunca: "Nunca realizou",
  resposta_parcial: "Sim, resposta parcial",
  resposta_boa: "Sim, resposta boa",
  sem_resposta: "Sim, sem resposta",
};

const redFlagLabels: Record<string, string> = {
  infeccao_ativa: "Infecção ativa local ou sistêmica",
  neoplasia_ativa: "Neoplasia ativa (sólida ou hematológica)",
  coagulopatia_grave: "Coagulopatia grave não controlada",
  trombocitopenia: "Trombocitopenia (<100 mil)",
  anemia_grave: "Anemia grave (Hb <10)",
  gestacao: "Gestação",
  alergia_anestesico: "Alergia conhecida a anestésico local",
  instabilidade_articular: "Instabilidade articular significativa",
  nenhum: "Nenhum",
};

const medicationLabels: Record<string, string> = {
  aine_continuo: "AINEs contínuo (>7 dias)",
  corticoide_sistemico: "Corticoide sistêmico",
  anticoagulante: "Anticoagulante oral",
  imunossupressor: "Imunossupressor",
  quimio_radio: "Quimioterapia / Radioterapia recente",
  fluoroquinolona: "Fluoroquinolona últimos 60 dias",
  nenhum: "Nenhum",
};

const preparationFactorLabels: Record<string, string> = {
  tabagista_ativo: "Tabagista ativo",
  diabetes_descompensado: "Diabetes descompensado (HbA1c >8%)",
  obesidade: "Obesidade (IMC >30)",
  infiltracao_corticoide: "Infiltração corticoide local <3 meses",
  nenhum: "Nenhum",
};

const nutritionalFactorLabels: Record<string, string> = {
  vitamina_d_baixa: "Vit D baixa (<30)",
  ferritina_baixa: "Ferritina <30",
  b12_baixa: "B12 <300",
  omega3_baixo: "Ômega-3 baixo / não suplementa",
  nenhum: "Nenhum / Sem dados",
};

export function ScreeningDetailModal({
  open,
  onOpenChange,
  screening,
}: ScreeningDetailModalProps) {
  if (!screening) return null;

  const responses = screening.questionnaire_responses as QuestionnaireAnswers;
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

  const getLabel = (value: string | undefined, labels: Record<string, string>) => {
    if (!value) return "Não informado";
    return labels[value] || value;
  };

  const getBooleanLabel = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return "Não informado";
    return value ? "Sim" : "Não";
  };

  const getArrayLabels = (values: string[] | undefined, labels: Record<string, string>) => {
    if (!values || values.length === 0) return ["Nenhum selecionado"];
    return values.map(v => labels[v] || v);
  };

  // Determine reasons for contraindication
  const getContraindicationReasons = () => {
    const reasons: string[] = [];
    
    // Check red flags
    if (responses.red_flags && responses.red_flags.length > 0) {
      const criticalFlags = responses.red_flags.filter(f => f !== "nenhum");
      if (criticalFlags.length > 0) {
        criticalFlags.forEach(flag => {
          reasons.push(`⚠️ ${redFlagLabels[flag] || flag}`);
        });
      }
    }
    
    // Check medications
    if (responses.medicamentos && responses.medicamentos.length > 0) {
      const criticalMeds = responses.medicamentos.filter(m => m !== "nenhum");
      if (criticalMeds.includes("anticoagulante")) {
        reasons.push("💊 Uso de anticoagulante oral");
      }
      if (criticalMeds.includes("imunossupressor")) {
        reasons.push("💊 Uso de imunossupressor");
      }
      if (criticalMeds.includes("quimio_radio")) {
        reasons.push("💊 Quimioterapia/Radioterapia recente");
      }
    }
    
    // Check preparation factors
    if (responses.fatores_preparo && responses.fatores_preparo.length > 0) {
      const factors = responses.fatores_preparo.filter(f => f !== "nenhum");
      if (factors.includes("infiltracao_corticoide")) {
        reasons.push("💉 Infiltração de corticoide local há menos de 3 meses");
      }
      if (factors.includes("diabetes_descompensado")) {
        reasons.push("🩺 Diabetes descompensado (HbA1c >8%)");
      }
    }
    
    return reasons;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-primary" />
            Detalhes da Triagem Biológica
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Header with date and classification */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Data da avaliação</p>
                <p className="font-medium">
                  {format(new Date(screening.screening_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm")}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                <p className="text-sm text-muted-foreground">Classificação</p>
                {getClassificationBadge()}
              </div>
            </div>

            {/* Reasons for contraindication/preparation */}
            {(classification === "CONTRAINDICADO" || classification === "NAO_APTO_PREPARO") && (
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Ban className="w-4 h-4" />
                    {classification === "CONTRAINDICADO" 
                      ? "Motivos da Contraindicação" 
                      : "Fatores que Requerem Preparo"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getContraindicationReasons().map((reason, idx) => (
                      <li key={idx} className="text-sm text-red-700 dark:text-red-400">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Análise da Triagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {analysisResult}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Identification */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">A) Identificação do Caso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Região Principal:</span>
                    <p className="font-medium">{getLabel(responses.regiao_principal, regionLabels)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Diagnóstico Suspeito:</span>
                    <p className="font-medium">{responses.diagnostico_suspeito || "Não informado"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tempo de Dor:</span>
                    <p className="font-medium">{getLabel(responses.tempo_dor, painDurationLabels)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Escala de Dor:</span>
                    <p className="font-medium">{responses.dor_escala !== null && responses.dor_escala !== undefined ? `${responses.dor_escala}/10` : "Não informado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Procedure */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">B) Procedimento Pretendido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {getLabel(responses.procedimento_considerado, procedureLabels)}
                </p>
              </CardContent>
            </Card>

            {/* Red Flags */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  C) Segurança / Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {getArrayLabels(responses.red_flags, redFlagLabels).map((label, idx) => (
                    <Badge 
                      key={idx} 
                      variant={label === "Nenhum" || label === "Nenhum selecionado" ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-500" />
                  D) Medicamentos Relevantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {getArrayLabels(responses.medicamentos, medicationLabels).map((label, idx) => (
                    <Badge 
                      key={idx} 
                      variant={label === "Nenhum" || label === "Nenhum selecionado" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Therapeutic History */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  E) Histórico Terapêutico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">PRP/PRF/BMAC anterior:</span>
                    <p className="font-medium">{getLabel(responses.prp_prf_bmac_anterior, priorTreatmentLabels)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fisioterapia últimas 6 sem:</span>
                    <p className="font-medium">{getBooleanLabel(responses.fisioterapia_6_semanas)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cirurgia prévia na região:</span>
                    <p className="font-medium">{getBooleanLabel(responses.cirurgia_previa_regiao)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Soil Preparation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">F) Preparo do Solo Biológico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {getArrayLabels(responses.fatores_preparo, preparationFactorLabels).map((label, idx) => (
                    <Badge 
                      key={idx} 
                      variant={label === "Nenhum" || label === "Nenhum selecionado" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nutritional Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Apple className="w-4 h-4 text-green-500" />
                  G) Status Nutricional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {getArrayLabels(responses.fatores_nutricionais, nutritionalFactorLabels).map((label, idx) => (
                    <Badge 
                      key={idx} 
                      variant={label.includes("Nenhum") || label === "Nenhum selecionado" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  H) Estilo de Vida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Qualidade do Sono:</span>
                    <p className="font-medium">{getLabel(responses.qualidade_sono, sleepLabels)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Álcool ≥2x/semana:</span>
                    <p className="font-medium">{getBooleanLabel(responses.consumo_alcool_2x_semana)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nível de Estresse:</span>
                    <p className="font-medium">{getLabel(responses.nivel_estresse, stressLabels)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Orientations */}
            {screening.patient_orientations && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Orientações ao Paciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {screening.patient_orientations}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
