import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Download, Sparkles, AlertCircle, CheckCircle2, 
  Target, Leaf, Clock, Heart, MessageSquare 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoRegenapp from "@/assets/logo-regenapp.png";

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
  const reportRef = useRef<HTMLDivElement>(null);

  const isPRPIndicado = latestScreening?.classification?.toUpperCase() === "APTO";
  const isPRPComPreparo = latestScreening?.classification?.toUpperCase() === "APTO_COM_PREPARO";
  const isPRPNaoIndicado = latestScreening?.classification?.toUpperCase() === "NAO_APTO" || 
                          latestScreening?.classification?.toUpperCase() === "CONTRAINDICADO";

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simula um pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsGenerated(true);
    setIsGenerating(false);
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
            
            {isGenerated && (
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
          </div>
        </CardContent>
      </Card>

      {/* Relatório Gerado */}
      {isGenerated && (
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
                  <p className="text-lg font-medium">{patient.full_name}</p>
                  <p className="text-white/80 text-sm">
                    {patient.age && `${patient.age} anos`}
                    {patient.gender && ` • ${patient.gender === "M" ? "Masculino" : "Feminino"}`}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <img 
                  src={logoRegenapp} 
                  alt="REGENAPP" 
                  className="h-10 w-auto ml-auto opacity-90"
                />
              </div>
            </div>
            <Separator className="my-6 bg-white/20" />
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Data de Geração</p>
                <p className="font-medium">{currentDate}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Profissional</p>
                <p className="font-medium">{professionalName}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">Registro</p>
                <p className="font-medium">{professionalRegistration}</p>
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
                {patient.clinical_diagnosis ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Diagnóstico Clínico</p>
                    <p className="text-gray-900 font-medium">{patient.clinical_diagnosis}</p>
                  </div>
                ) : null}
                
                {patient.treated_region ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Região Tratada</p>
                    <p className="text-gray-900 font-medium">{patient.treated_region}</p>
                  </div>
                ) : null}
                
                {!patient.clinical_diagnosis && !patient.treated_region && (
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
                  isPRPIndicado ? 'bg-green-100' : isPRPNaoIndicado ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <AlertCircle className={`w-4 h-4 ${
                    isPRPIndicado ? 'text-green-600' : isPRPNaoIndicado ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  3. {isPRPIndicado 
                    ? "Por Que o PRP Está Indicado" 
                    : isPRPComPreparo 
                      ? "Por Que Precisamos Preparar Primeiro" 
                      : "Por Que o PRP Não É Indicado Neste Momento"}
                </h2>
              </div>
              <div className="pl-10">
                {isPRPIndicado ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      <strong className="text-green-700">Boa notícia!</strong> Com base na sua avaliação atual, 
                      você apresenta condições favoráveis para realizar o tratamento com PRP (Plasma Rico em Plaquetas). 
                      Seu organismo demonstra estar preparado para responder de forma adequada a este tipo de terapia regenerativa.
                    </p>
                  </div>
                ) : isPRPComPreparo ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      <strong className="text-blue-700">Preparação necessária:</strong> O PRP pode ser uma excelente opção 
                      para o seu caso, mas primeiro precisamos preparar o terreno. Isso significa que seu tecido precisa 
                      de alguns ajustes antes de receber o tratamento regenerativo, garantindo assim melhores resultados.
                    </p>
                  </div>
                ) : isPRPNaoIndicado ? (
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
                  <img src={logoRegenapp} alt="REGENAPP" className="h-5 w-auto opacity-60" />
                  <span>Documento gerado pelo REGENAPP</span>
                </div>
                <span>{currentDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
