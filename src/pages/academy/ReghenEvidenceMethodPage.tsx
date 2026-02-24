import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, ShieldCheck, BookOpen, Target, Layers, AlertTriangle,
  CheckCircle2, GraduationCap, Scale, Eye, Brain, FileText,
} from "lucide-react";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";

const LAYERS = [
  {
    num: "01",
    title: "Estrutura Clínica (PICO)",
    icon: Target,
    desc: "Define População, Intervenção, Comparação e Desfechos (clínicos, funcionais e biológicos). Biomarcadores são categorizados separadamente de desfechos clínicos.",
  },
  {
    num: "02",
    title: "Metodologia",
    icon: FileText,
    desc: "Classifica o tipo de estudo (meta-análise, ECR, coorte, etc.), identifica se é humano ou pré-clínico, registra follow-up e tamanho amostral.",
  },
  {
    num: "03",
    title: "Confiabilidade",
    icon: CheckCircle2,
    desc: "Avalia randomização, grupo controle, cegamento, adequação do follow-up e clareza metodológica geral.",
  },
  {
    num: "04",
    title: "Aplicabilidade Clínica",
    icon: Scale,
    desc: "Classifica a aplicabilidade do estudo (alta, moderada, limitada ou experimental) com justificativa baseada nos dados.",
  },
  {
    num: "05",
    title: "Limitações Estruturadas",
    icon: AlertTriangle,
    desc: "Categoriza limitações em: metodológica, estatística, amostral, follow-up, generalização ou desfecho substituto.",
  },
  {
    num: "06",
    title: "Consistência com a Literatura",
    icon: Layers,
    desc: "Classifica se o estudo é confirmatório, complementar, divergente ou isolado em relação ao corpo de evidência existente.",
  },
  {
    num: "07",
    title: "Aplicação Educacional",
    icon: GraduationCap,
    desc: "Gera resumo didático, orientação de leitura guiada e posiciona o estudo no nível adequado da trilha de aprendizado.",
  },
];

const PRINCIPLES = [
  "Nunca prescrever conduta clínica — apenas interpretar evidência.",
  "Nunca inventar números, percentuais ou estatísticas não presentes no estudo.",
  "Nunca extrapolar além dos dados fornecidos.",
  "Revisão humana obrigatória antes da publicação.",
  "Biomarcadores não são desfechos clínicos.",
  "Informação ausente permanece como null — nunca inferida.",
];

export default function ReghenEvidenceMethodPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Reghen Evidence Method™
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Framework proprietário de curadoria científica com 7 camadas estruturadas, projetado para
            garantir transparência, reprodutibilidade e segurança na interpretação de evidência
            em fisioterapia regenerativa e medicina ortobiológica.
          </p>
          <div className="mt-4">
            <EvidenceMethodSeal size="md" />
          </div>
        </div>

        <Separator className="mb-10" />

        {/* O que é */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> O que é
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Reghen Evidence Method™ é um sistema de curadoria científica que padroniza a análise de
            artigos em 7 camadas obrigatórias. Cada artigo publicado na biblioteca passa por extração
            estruturada assistida por IA, seguida de validação humana. O resultado é um perfil de
            evidência transparente que alimenta o score de evidência, a leitura guiada, as trilhas de
            aprendizado e o sistema de perguntas à IA (RAG).
          </p>
        </section>

        {/* Princípios */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Princípios Fundamentais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRINCIPLES.map((p, i) => (
              <Card key={i} className="border-border">
                <CardContent className="py-3 px-4 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{p}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 7 Camadas */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> As 7 Camadas
          </h2>
          <div className="space-y-4">
            {LAYERS.map((layer) => (
              <Card key={layer.num} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                      <layer.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-mono">{layer.num}</Badge>
                        <h3 className="text-sm font-semibold text-foreground">{layer.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Como aparece */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Como isso aparece no sistema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Evidence Score", desc: "Score 0-100 derivado 100% das camadas estruturadas." },
              { title: "Leitura Guiada", desc: "Orientação educacional gerada a partir das layers 2, 3, 5 e 7." },
              { title: "Trilhas de Aprendizado", desc: "Papers organizados por nível (meta → rct → observacional)." },
              { title: "Perguntar à IA (RAG)", desc: "Contexto enriquecido com tipo de estudo, aplicabilidade e score." },
            ].map((item, i) => (
              <Card key={i} className="border-border">
                <CardContent className="py-4 px-5">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Disclaimers */}
        <section className="rounded-lg border border-border bg-muted/30 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" /> Disclaimers Clínicos
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>⚕️ O Evidence Score é uma métrica técnica heurística, <strong>não</strong> uma avaliação formal de risco de viés (RoB).</li>
            <li>⚕️ As sínteses são baseadas exclusivamente nos estudos disponíveis na biblioteca e <strong>não substituem</strong> avaliação clínica individual.</li>
            <li>⚕️ Nenhuma resposta do sistema constitui prescrição ou recomendação terapêutica.</li>
            <li>⚕️ A curadoria é gerada por IA e <strong>requer revisão humana</strong> antes da publicação.</li>
          </ul>
        </section>

        <div className="text-center mt-8">
          <EvidenceMethodSeal size="md" />
        </div>
      </div>
    </div>
  );
}
