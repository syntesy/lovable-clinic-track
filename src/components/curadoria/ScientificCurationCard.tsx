import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Beaker, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Lightbulb,
  Scale,
  FileText,
  Award,
  Dna,
  Stethoscope,
  BookMarked
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CriterioPontuacao {
  nome: string;
  nota: number;
  maximo: number;
  icon: React.ReactNode;
}

interface RelevanciaItem {
  texto: string;
  tipo: 'positivo' | 'negativo' | 'alerta';
}

interface ScientificCurationData {
  // Informações do artigo
  titulo: string;
  autores: string;
  ano: number;
  revista: string;
  
  // Tipo de Estudo
  tipoEstudo: {
    classificacao: string;
    peso: number;
    justificativas: string[];
  };
  
  // Qualidade Metodológica
  qualidadeMetodologica: {
    peso: number;
    pontosFortes: string[];
    limitacoes: string[];
  };
  
  // Relevância Biológica
  relevanciaBiologica: {
    peso: number;
    itens: RelevanciaItem[];
    interpretacao: string[];
  };
  
  // Relevância Clínica
  relevanciaClinica: {
    peso: number;
    aplicacaoDireta: boolean;
    aplicacaoConceitual: boolean;
    observacoes: string[];
  };
  
  // Contribuição para Protocolos
  contribuicaoProtocolos: {
    peso: number;
    itens: string[];
  };
  
  // Consistência com Literatura
  consistenciaLiteratura: {
    peso: number;
    itens: string[];
  };
  
  // Nota Final
  notaFinal: {
    pontuacao: number;
    maximo: number;
    classificacao: string;
    tipo: 'alta' | 'media' | 'baixa';
  };
}

interface ScientificCurationCardProps {
  data: ScientificCurationData;
  className?: string;
}

// Helper to get color classes based on score percentage
function getScoreColor(score: number, max: number): string {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return "text-emerald-500";
  if (percentage >= 60) return "text-amber-500";
  return "text-red-500";
}

function getProgressColor(score: number, max: number): string {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getClassificationBadge(tipo: 'alta' | 'media' | 'baixa'): { bg: string; text: string; border: string } {
  switch (tipo) {
    case 'alta':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500/30' };
    case 'media':
      return { bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500/30' };
    case 'baixa':
      return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30' };
  }
}

export function ScientificCurationCard({ data, className }: ScientificCurationCardProps) {
  const criterios: CriterioPontuacao[] = [
    { nome: 'Tipo de Estudo', nota: data.tipoEstudo.peso, maximo: 5, icon: <FileText className="h-4 w-4" /> },
    { nome: 'Qualidade Metodológica', nota: data.qualidadeMetodologica.peso, maximo: 5, icon: <Scale className="h-4 w-4" /> },
    { nome: 'Relevância Biológica', nota: data.relevanciaBiologica.peso, maximo: 5, icon: <Dna className="h-4 w-4" /> },
    { nome: 'Relevância Clínica', nota: data.relevanciaClinica.peso, maximo: 5, icon: <Stethoscope className="h-4 w-4" /> },
    { nome: 'Contribuição p/ Protocolos', nota: data.contribuicaoProtocolos.peso, maximo: 5, icon: <Target className="h-4 w-4" /> },
    { nome: 'Consistência c/ Literatura', nota: data.consistenciaLiteratura.peso, maximo: 5, icon: <BookMarked className="h-4 w-4" /> },
  ];

  const badgeColors = getClassificationBadge(data.notaFinal.tipo);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Card - Nota Final */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4 text-primary" />
            <span>Classificação Científica REGENAPP</span>
          </div>
          <CardTitle className="text-lg font-semibold text-foreground leading-tight">
            {data.titulo}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.autores} · {data.revista}, {data.ano}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center bg-background/50">
                <div className="text-center">
                  <span className={cn("text-3xl font-bold", getScoreColor(data.notaFinal.pontuacao, data.notaFinal.maximo))}>
                    {data.notaFinal.pontuacao}
                  </span>
                  <span className="text-lg text-muted-foreground">/{data.notaFinal.maximo}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Badge className={cn("px-3 py-1", badgeColors.bg, badgeColors.text, badgeColors.border, "border")}>
                🏆 {data.notaFinal.classificacao}
              </Badge>
              <Progress 
                value={(data.notaFinal.pontuacao / data.notaFinal.maximo) * 100} 
                className="h-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {criterios.map((criterio, index) => (
          <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  {criterio.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {criterio.nome}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold", getScoreColor(criterio.nota, criterio.maximo))}>
                  {criterio.nota}
                </span>
                <span className="text-sm text-muted-foreground">/ {criterio.maximo}</span>
              </div>
              <div className="mt-2">
                <Progress 
                  value={(criterio.nota / criterio.maximo) * 100} 
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tipo de Estudo */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Tipo de Estudo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/30 border">
            {data.tipoEstudo.classificacao}
          </Badge>
          <div className="space-y-1">
            {data.tipoEstudo.justificativas.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Qualidade Metodológica */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Qualidade Metodológica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-emerald-500 mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Pontos Fortes
            </h4>
            <div className="space-y-1">
              {data.qualidadeMetodologica.pontosFortes.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-emerald-500">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium text-amber-500 mb-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> Limitações
            </h4>
            <div className="space-y-1">
              {data.qualidadeMetodologica.limitacoes.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-amber-500">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relevância Biológica */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Dna className="h-5 w-5 text-emerald-500" />
              Relevância Biológica para Ortobiológicos
            </CardTitle>
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 border">
              {data.relevanciaBiologica.peso}/5
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {data.relevanciaBiologica.itens.map((item, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-start gap-2 text-sm p-2 rounded-lg",
                  item.tipo === 'positivo' && "bg-emerald-500/10",
                  item.tipo === 'alerta' && "bg-amber-500/10",
                  item.tipo === 'negativo' && "bg-red-500/10"
                )}
              >
                {item.tipo === 'positivo' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
                {item.tipo === 'alerta' && <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                {item.tipo === 'negativo' && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                <span className="text-foreground">{item.texto}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-background/60 p-4 rounded-lg border border-emerald-500/20">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-emerald-500">
              <Lightbulb className="h-4 w-4" /> Interpretação REGENAPP
            </h4>
            <ul className="space-y-1">
              {data.relevanciaBiologica.interpretacao.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Relevância Clínica */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Relevância Clínica Direta
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 border">
              {data.relevanciaClinica.peso}/5
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              data.relevanciaClinica.aplicacaoDireta ? "bg-emerald-500/10" : "bg-red-500/10"
            )}>
              {data.relevanciaClinica.aplicacaoDireta ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">Aplicação Direta</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              data.relevanciaClinica.aplicacaoConceitual ? "bg-emerald-500/10" : "bg-red-500/10"
            )}>
              {data.relevanciaClinica.aplicacaoConceitual ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">Aplicação Conceitual</span>
            </div>
          </div>
          
          <div className="space-y-1">
            {data.relevanciaClinica.observacoes.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contribuição para Protocolos */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Contribuição para Construção de Protocolos
            </CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 border">
              {data.contribuicaoProtocolos.peso}/5
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.contribuicaoProtocolos.itens.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Consistência com Literatura */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-primary" />
              Coerência com a Literatura
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 border">
              {data.consistenciaLiteratura.peso}/5
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.consistenciaLiteratura.itens.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Aviso:</strong> Esta classificação científica tem finalidade educacional e de suporte à decisão clínica. 
            Não substitui a avaliação individual do profissional de saúde.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Exemplo de dados para demonstração
export const exampleCurationData: ScientificCurationData = {
  titulo: "Platelet-Rich Plasma Promotes Migration, Proliferation, and the Gene Expression of Scleraxis and VEGF in Paratenon-Derived Cells In Vitro",
  autores: "Imai et al.",
  ano: 2019,
  revista: "Sports Health",
  
  tipoEstudo: {
    classificacao: "Estudo experimental in vitro, controlado, com modelo animal (células de ratos)",
    peso: 2,
    justificativas: [
      "Não é estudo clínico em humanos",
      "Não avalia desfechos funcionais ou clínicos",
      "Excelente para mecanismo biológico, não para eficácia clínica direta"
    ]
  },
  
  qualidadeMetodologica: {
    peso: 4,
    pontosFortes: [
      "Protocolo experimental bem definido",
      "Grupos controle claros",
      "Repetição dos experimentos (≥4 vezes)",
      "Análise estatística adequada (Mann-Whitney, t-test pareado)",
      "Avaliação molecular objetiva (RT-PCR, marcadores específicos)"
    ],
    limitacoes: [
      "Modelo exclusivamente in vitro",
      "Ausência de estímulo mecânico (tensão), fundamental para maturação tendínea"
    ]
  },
  
  relevanciaBiologica: {
    peso: 5,
    itens: [
      { texto: "Aumenta migração celular", tipo: 'positivo' },
      { texto: "Aumenta proliferação celular", tipo: 'positivo' },
      { texto: "Aumenta expressão de Scleraxis (Scx) → marcador chave de linhagem tenogênica", tipo: 'positivo' },
      { texto: "Aumenta VEGF → angiogênese precoce", tipo: 'positivo' },
      { texto: "Reduz Tenomodulina (Tnmd) → marcador de maturação tardia", tipo: 'alerta' }
    ],
    interpretacao: [
      "PRP atua melhor na fase inicial do reparo",
      "Favorece ambiente pró-reparo, não maturação final",
      "Sustenta o conceito de preparação biológica do tecido"
    ]
  },
  
  relevanciaClinica: {
    peso: 3,
    aplicacaoDireta: false,
    aplicacaoConceitual: true,
    observacoes: [
      "NÃO define dose clínica",
      "NÃO define protocolo terapêutico",
      "NÃO prova eficácia clínica isolada",
      "MAS explica por que, quando e em que fase o PRP faz sentido"
    ]
  },
  
  contribuicaoProtocolos: {
    peso: 5,
    itens: [
      "PRP indicado em lesões agudas ou fases iniciais",
      "Importância do paratendão como alvo biológico",
      "Justificativa para não usar PRP isoladamente em lesões crônicas avançadas",
      "Base para janelas terapêuticas (timing do procedimento)"
    ]
  },
  
  consistenciaLiteratura: {
    peso: 4,
    itens: [
      "Cita estudos fundamentais (Docheva, Zhang, de Mos, etc.)",
      "Está alinhado com consenso biológico atual",
      "Não contradiz revisões sistemáticas",
      "Complementa a literatura com foco celular específico (PDCs)"
    ]
  },
  
  notaFinal: {
    pontuacao: 23,
    maximo: 30,
    classificacao: "ALTA RELEVÂNCIA CIENTÍFICA (MECANÍSTICA)",
    tipo: 'alta'
  }
};
