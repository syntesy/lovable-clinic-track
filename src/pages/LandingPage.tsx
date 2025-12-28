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
} from "lucide-react";
import logoRegenapp from "@/assets/logo-regenapp.png";

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
          <img src={logoRegenapp} alt="REGENAPP" className="h-8 md:h-10" />
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
            alt="REGENAPP"
            className="mx-auto mb-6 h-16 md:h-20 lg:h-24"
          />
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            REGENAPP
          </h1>
          <h2 className="mb-6 text-lg text-muted-foreground md:text-xl lg:text-2xl">
            Ferramenta de apoio à decisão clínica em procedimentos regenerativos
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-foreground md:text-lg">
            O REGENAPP é uma ferramenta de apoio à decisão clínica, desenvolvida
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

      {/* Funcionalidades Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-semibold md:mb-12 md:text-3xl">
            Funcionalidades do REGENAPP
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
