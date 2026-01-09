import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ClipboardList,
  Brain,
  FileText,
  BookOpen,
  Library,
  Handshake,
  Check,
  Sparkles,
  Crown,
  Tag,
  Percent,
  ShoppingBag,
} from "lucide-react";
import logoRegenapp from "@/assets/logo-regenapp-new.png";
import mockupScore from "@/assets/mockup-score-clinico.png";
import mockupAvaliacao from "@/assets/mockup-avaliacao-clinica.png";
import mockupRelatorios from "@/assets/mockup-relatorios.png";
import mockupProtocolos from "@/assets/mockup-protocolos.png";
import mockupDashboard from "@/assets/mockup-dashboard.png";

const features = [
  {
    icon: ClipboardList,
    title: "Avaliação clínica estruturada",
    items: [
      "Questionários organizados por caso",
      "Registro sistematizado de informações",
      "Histórico rastreável",
    ],
  },
  {
    icon: Brain,
    title: "Apoio à decisão clínica",
    items: [
      "Scores clínicos aplicados à prática regenerativa",
      "Avaliação de elegibilidade e preparo",
      "Identificação de riscos e pontos de atenção",
    ],
  },
  {
    icon: FileText,
    title: "Relatórios técnicos",
    items: [
      "Relatórios claros e padronizados",
      "Versões simples ou completas em PDF",
      "Linguagem adequada para prontuário",
    ],
  },
  {
    icon: BookOpen,
    title: "Protocolos clínicos",
    items: [
      "Protocolos padronizados por procedimento",
      "Atualizados conforme evidência e consenso",
    ],
  },
  {
    icon: Library,
    title: "Biblioteca científica curada",
    items: [
      "Conteúdo selecionado e interpretado",
      "Aplicação prática da evidência científica",
    ],
  },
  {
    icon: Handshake,
    title: "Ecossistema de parceiros",
    items: [
      "Fornecedores confiáveis",
      "Benefícios mediante uso do cupom REGENAPP",
    ],
  },
];

const plans = [
  {
    name: "Básico",
    price: "R$ 299,00",
    period: "/ mês",
    badge: null,
    items: [
      "Avaliação clínica estruturada",
      "Questionários clínicos base",
      "Relatórios clínicos simples",
      "Histórico básico de casos",
      "Acesso à aba de parceiros",
    ],
    buttonText: "Assinar Básico",
    planId: "basico",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "R$ 399,00",
    period: "/ mês",
    badge: "Mais indicado",
    items: [
      "Tudo do Básico",
      "Scores clínicos avançados",
      "Relatórios completos em PDF",
      "Casos ilimitados",
      "Biblioteca científica curada",
      "Protocolos clínicos padronizados",
    ],
    buttonText: "Assinar Premium",
    planId: "premium",
    highlighted: true,
  },
  {
    name: "PRO",
    price: "R$ 499,00",
    period: "/ mês",
    badge: "Máximo nível",
    items: [
      "Tudo do Premium",
      "IA de apoio à decisão clínica",
      "Simulação de cenários e alertas de risco",
      "Protocolos licenciados REGENAPP",
      "Relatórios nível expert",
      "Prioridade no suporte",
    ],
    buttonText: "Assinar PRO",
    planId: "pro",
    highlighted: false,
  },
];

const faqItems = [
  {
    question: "O REGENAPP substitui o julgamento clínico?",
    answer:
      "Não. O REGENAPP é uma ferramenta de apoio à decisão clínica. Toda conduta deve ser definida pelo profissional habilitado, com base em sua avaliação e experiência.",
  },
  {
    question: "Quem pode usar o REGENAPP?",
    answer:
      "Médicos e fisioterapeutas que realizam procedimentos regenerativos e buscam padronização, segurança e documentação técnica.",
  },
  {
    question: "O REGENAPP realiza procedimentos?",
    answer:
      "Não. O REGENAPP não realiza, prescreve ou automatiza procedimentos clínicos. Ele oferece suporte técnico para decisões clínicas mais seguras.",
  },
  {
    question: "Como funciona a cobrança?",
    answer:
      "A assinatura é mensal e recorrente. Você pode cancelar a qualquer momento, sem multas ou fidelidade.",
  },
  {
    question: "Posso testar antes de assinar?",
    answer:
      "Sim. Oferecemos um período de teste gratuito para que você conheça as funcionalidades antes de decidir.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim. Utilizamos criptografia e seguimos as melhores práticas de segurança da informação. Seus dados clínicos são protegidos conforme a LGPD.",
  },
  {
    question: "Como funciona o suporte?",
    answer:
      "Oferecemos suporte por e-mail e chat. Usuários do plano PRO têm prioridade no atendimento.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleSignup = () => {
    navigate("/auth?mode=signup");
  };

  const handlePlanSelect = (planId: string) => {
    navigate(`/auth?mode=signup&plan=${planId}`);
  };

  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <img src={logoRegenapp} alt="SYNTESY" className="h-8 md:h-10" />
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="sm" onClick={handleLogin}>
              Entrar
            </Button>
            <Button size="sm" onClick={handleSignup}>
              Criar conta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <img
            src={logoRegenapp}
            alt="SYNTESY"
            className="mx-auto mb-6 h-16 md:h-20 lg:h-24"
          />
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            SYNTESY
          </h1>
          <h2 className="mb-6 text-lg text-muted-foreground md:text-xl lg:text-2xl">
            Ferramenta de apoio à decisão clínica em procedimentos regenerativos
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-foreground md:text-lg">
            O SYNTESY é uma ferramenta de apoio à decisão clínica, desenvolvida
            para profissionais habilitados, com foco em prática segura e baseada
            em evidência.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" onClick={handleSignup} className="w-full sm:w-auto">
              Criar conta
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleLogin}
              className="w-full sm:w-auto"
            >
              Entrar
            </Button>
          </div>
        </div>
      </section>

      {/* Por que existe Section */}
      <section className="border-y border-border/40 bg-secondary/50 py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-center text-2xl font-semibold md:text-3xl">
            Por que o REGENAPP existe
          </h2>
          <p className="text-center text-base leading-relaxed text-muted-foreground md:text-lg">
            A prática clínica com procedimentos regenerativos exige critérios bem
            definidos, padronização de condutas, documentação técnica adequada e
            alinhamento com evidência científica.
          </p>
          <p className="mt-4 text-center text-base leading-relaxed text-muted-foreground md:text-lg">
            O REGENAPP foi criado para apoiar a tomada de decisão clínica,
            oferecendo estrutura, organização e suporte técnico, sem substituir o
            julgamento profissional.
          </p>
        </div>
      </section>

      {/* SEÇÃO VISUAL - FUNCIONALIDADES EM USO */}
      
      {/* 1) Score Clínico - Destaque Principal */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-2 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
                Scores clínicos para apoio à decisão
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                O REGENAPP utiliza scores clínicos estruturados para apoiar a avaliação, 
                o preparo do paciente e a tomada de decisão, sempre como suporte técnico 
                e nunca como substituição do julgamento profissional.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Score visual com indicador de elegibilidade</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Avaliação por domínios clínicos</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Identificação de bloqueios e alertas</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl">
                <img 
                  src={mockupScore} 
                  alt="Score clínico REGENAPP" 
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Exemplo ilustrativo de score clínico no REGENAPP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Avaliação Clínica e Questionário */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-2 items-center">
            <div className="order-1">
              <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl">
                <img 
                  src={mockupAvaliacao} 
                  alt="Avaliação clínica estruturada" 
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Exemplo ilustrativo de questionário clínico
                  </p>
                </div>
              </div>
            </div>
            <div className="order-2">
              <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
                Avaliação clínica estruturada
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                Questionários organizados por caso, com registro sistematizado das 
                informações clínicas e histórico rastreável.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Fluxo passo a passo intuitivo</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Campos estruturados por especialidade</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Histórico completo de avaliações</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3) Relatórios Clínicos */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-2 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
                Relatórios técnicos e documentação
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                Relatórios clínicos claros e padronizados, com versões simples ou 
                completas em PDF, adequados para prontuário e registro clínico.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Exportação em PDF profissional</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Cabeçalho institucional personalizável</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Linguagem adequada para prontuário</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl">
                <img 
                  src={mockupRelatorios} 
                  alt="Relatórios clínicos" 
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Exemplo ilustrativo de relatório clínico
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4) Protocolos Clínicos */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-2 items-center">
            <div className="order-1">
              <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl">
                <img 
                  src={mockupProtocolos} 
                  alt="Protocolos clínicos padronizados" 
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Exemplo ilustrativo de biblioteca de protocolos
                  </p>
                </div>
              </div>
            </div>
            <div className="order-2">
              <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
                Protocolos clínicos padronizados
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                Protocolos organizados por procedimento e contexto clínico, 
                com base em evidência e consenso.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Biblioteca categorizada por tipo de terapia</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Busca e filtros avançados</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>Atualização conforme evidência científica</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5) Visão Geral do App - Dashboard */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
              Tudo em um único ambiente clínico
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              O REGENAPP centraliza avaliação, decisão, documentação e acompanhamento 
              em um único sistema integrado e profissional.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl mx-auto max-w-5xl">
            <img 
              src={mockupDashboard} 
              alt="Dashboard REGENAPP" 
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
              <p className="text-xs text-muted-foreground text-center">
                Exemplo ilustrativo do painel principal do REGENAPP
              </p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Button size="lg" onClick={handleSignup}>
              Comece agora gratuitamente
            </Button>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section - Lista compacta */}
      <section className="py-16 md:py-20 border-t border-border/40">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold md:mb-12 md:text-3xl">
            Todas as funcionalidades
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center md:mt-12">
            <Button variant="outline" size="lg" onClick={scrollToPlans}>
              Ver planos
            </Button>
          </div>
        </div>
      </section>

      {/* Para quem é Section */}
      <section className="border-y border-border/40 bg-secondary/50 py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">
            Para quem é o REGENAPP
          </h2>
          <p className="mb-6 text-base text-foreground md:text-lg">
            Médicos e Fisioterapeutas que:
          </p>
          <div className="mb-8 space-y-3 text-left">
            <p className="flex items-center justify-center gap-2 text-base md:text-lg">
              <Check className="h-5 w-5 flex-shrink-0 text-primary" />
              <span>realizam procedimentos regenerativos</span>
            </p>
            <p className="flex items-center justify-center gap-2 text-base md:text-lg">
              <Check className="h-5 w-5 flex-shrink-0 text-primary" />
              <span>buscam padronização, segurança e documentação técnica</span>
            </p>
            <p className="flex items-center justify-center gap-2 text-base md:text-lg">
              <Check className="h-5 w-5 flex-shrink-0 text-primary" />
              <span>valorizam evidência científica e prática responsável</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground md:text-base">
            O REGENAPP não executa procedimentos nem define condutas. Ele oferece
            suporte técnico para decisões clínicas mais seguras.
          </p>
        </div>
      </section>

      {/* Parcerias com Fornecedores */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10">
              <Percent className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Benefício exclusivo</span>
            </div>
            <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
              Parcerias com fornecedores
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Usuários do REGENAPP têm acesso a <strong className="text-foreground">descontos exclusivos</strong> na 
              compra de insumos e materiais para procedimentos regenerativos em nossa rede de parceiros.
            </p>
          </div>

          {/* Categorias de parceiros */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {[
              { icon: Tag, title: "Ortobiológicos / PRP", desc: "Kits, tubos e materiais para coleta e processamento" },
              { icon: ShoppingBag, title: "Agulhas e materiais invasivos", desc: "Agulhas, cânulas e acessórios para procedimentos guiados" },
              { icon: Tag, title: "Ultrassom e acessórios", desc: "Gel, capas e consumíveis para ultrassonografia" },
              { icon: ShoppingBag, title: "Descartáveis e assepsia", desc: "Luvas, campos e materiais de proteção" },
              { icon: Tag, title: "Equipamentos", desc: "Equipamentos para reabilitação e fisioterapia" },
              { icon: ShoppingBag, title: "Suplementação", desc: "Suplementos e produtos para recovery clínico" },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Cupom destaque */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Como funciona?
                </h3>
                <p className="text-muted-foreground max-w-xl">
                  Ao acessar nossa aba de parceiros dentro do app, utilize o cupom exclusivo 
                  <span className="font-bold text-primary"> REGENAPP </span> 
                  para garantir descontos e condições especiais em sua compra.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xl tracking-wider shadow-lg">
                  REGENAPP
                </div>
                <span className="text-xs text-muted-foreground">Seu cupom de desconto</span>
              </div>
            </div>
          </div>

          {/* Benefícios */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Descontos exclusivos</h4>
              <p className="text-sm text-muted-foreground">Preços especiais para assinantes</p>
            </div>
            <div className="text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                <Handshake className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Fornecedores confiáveis</h4>
              <p className="text-sm text-muted-foreground">Parceiros selecionados com critério</p>
            </div>
            <div className="text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Compra direta</h4>
              <p className="text-sm text-muted-foreground">Acesse o site do parceiro pelo app</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" onClick={handleSignup}>
              Criar conta e acessar parceiros
            </Button>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section id="plans" className="py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold md:mb-12 md:text-3xl">
            Planos e valores
          </h2>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-border/40"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        plan.highlighted
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {plan.highlighted ? (
                        <Sparkles className="h-3 w-3" />
                      ) : (
                        <Crown className="h-3 w-3" />
                      )}
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardHeader className="pb-4 pt-8">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="flex-1 space-y-3">
                    {plan.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handlePlanSelect(plan.planId)}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-y border-border/40 bg-secondary/50 py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold md:mb-12 md:text-3xl">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="mb-8 text-xl font-medium md:text-2xl">
            Eleve sua prática clínica com mais segurança e respaldo técnico.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" onClick={handleSignup} className="w-full sm:w-auto">
              Criar conta
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleLogin}
              className="w-full sm:w-auto"
            >
              Entrar
            </Button>
          </div>
          <div className="mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/patient/login')}
              className="text-muted-foreground hover:text-foreground"
            >
              Área do Paciente →
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Legal */}
      <footer className="border-t border-border/40 bg-secondary/30 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <p className="text-center text-xs text-muted-foreground md:text-sm">
            O REGENAPP é uma ferramenta de apoio à decisão clínica, desenvolvida
            para profissionais habilitados. Não substitui julgamento profissional
            nem automatiza condutas terapêuticas.
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} REGENAPP. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
