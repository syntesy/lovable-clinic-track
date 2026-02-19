import { useCallback, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, FileCheck, BarChart3, Shield,
  Activity, TestTube2, Gauge, Target, CheckCircle2, Zap,
  LineChart, Lock, Users, FlaskConical, ClipboardList,
  Stethoscope, FileText, PieChart, CalendarCheck, TrendingUp,
  Building2, ChevronDown,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logoReghen from "@/assets/logo-reghen.png";
import heroBg from "@/assets/hero-bg.png";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const glassCard = "rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-sm";
const glassCardHover = "hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-2xl hover:shadow-primary/[0.06] hover:-translate-y-1";
const cardShadow = {
  boxShadow: "0 4px 50px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
};

/* ─── DATA ─── */
const navLinks = [
  { label: "Visão geral", href: "#visao-geral" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Módulos", href: "#modulos" },
  { label: "Segurança", href: "#seguranca" },
  { label: "FAQ", href: "#faq" },
];

const steps = [
  { num: "01", title: "Paciente e atendimento", desc: "Cadastro e abertura do atendimento clínico.", icon: FileText },
  { num: "02", title: "Registro Padronizado (PSR)", desc: "Procedimento documentado com estrutura e rastreabilidade.", icon: ClipboardList },
  { num: "03", title: "Checklist e método", desc: "Verificação técnica, protocolo e controle de conformidade.", icon: CheckCircle2 },
  { num: "04", title: "Desfechos longitudinais", desc: "Registro por timepoint: baseline → m1 → m3 → m6 → m12.", icon: TrendingUp },
  { num: "05", title: "Painel de análise", desc: "Visualização interna dos resultados da clínica.", icon: BarChart3 },
];

const modules = [
  { icon: FileText, title: "Procedimento Padronizado (PSR)", desc: "Registro estruturado de cada procedimento com protocolo, método e rastreabilidade completa." },
  { icon: Stethoscope, title: "Triagem e Avaliação Estruturada", desc: "Critérios clínicos objetivos para decisão segura antes de cada intervenção regenerativa." },
  { icon: TestTube2, title: "Exames e Contexto Biológico", desc: "Integração de dados laboratoriais e perfil biológico para fundamentar a conduta clínica." },
  { icon: Gauge, title: "SCORE e Indicadores", desc: "Avaliação quantitativa e qualitativa para apoiar a tomada de decisão do profissional de saúde." },
  { icon: ClipboardList, title: "Desfechos do Paciente (PRO)", desc: "Registro longitudinal de desfechos reportados pelo paciente por timepoint definido." },
  { icon: BarChart3, title: "Análise de Resultados", desc: "Painel interno da clínica com filtros por procedimento, patologia e período de acompanhamento." },
];

const securityPillars = [
  { icon: Building2, title: "Isolamento por clínica", desc: "Cada clínica opera em um ambiente completamente isolado. Nenhum dado é compartilhado entre organizações." },
  { icon: Users, title: "Controle de acesso por perfil", desc: "Permissões granulares por função: administrador, profissional de saúde, técnico e recepção." },
  { icon: Lock, title: "Políticas de segurança no banco", desc: "Row Level Security garante que cada consulta ao banco respeita as permissões do usuário autenticado." },
];

const metrics = [
  { icon: Activity, value: "VAS 0–10", label: "Escala de dor em cada timepoint" },
  { icon: BarChart3, value: "PRO", label: "Desfechos reportados pelo paciente" },
  { icon: TestTube2, value: "PRP/PRF", label: "Rastreabilidade de insumos biológicos" },
  { icon: Target, value: "NPS Clínico", label: "Satisfação longitudinal do paciente" },
  { icon: Gauge, value: "SCORE", label: "Índice de qualidade do procedimento" },
  { icon: Shield, value: "RLS/RBAC", label: "Governança por clínica e perfil" },
];

const faqs = [
  { q: "O REGHEN é exclusivo para médicos?", a: "Não. O REGHEN é destinado a profissionais de saúde habilitados que atuam ou desejam atuar com medicina regenerativa de forma ética e baseada em evidência." },
  { q: "O sistema compara resultados entre clínicas?", a: "Não. O REGHEN não realiza qualquer comparação entre clínicas ou profissionais. Todos os dados são isolados por organização." },
  { q: "Como funciona o isolamento por clínica?", a: "Cada clínica opera em um ambiente completamente isolado no banco de dados. Políticas de segurança (RLS) garantem que nenhum dado seja acessível fora da organização correspondente." },
  { q: "É possível acompanhar desfechos por período?", a: "Sim. O sistema organiza desfechos por timepoints definidos (baseline, 1 mês, 3 meses, 6 meses e 12 meses)." },
  { q: "Preciso preencher todos os campos do procedimento?", a: "Campos obrigatórios são definidos pelo protocolo ativo. O sistema orienta o preenchimento mínimo para garantir rastreabilidade." },
];

/* ─── COMPONENT ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getRedirectPath = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  }, [location.search]);

  const handleLogin = useCallback(() => {
    navigate(`/auth?redirect=${encodeURIComponent(getRedirectPath())}`);
  }, [navigate, getRedirectPath]);

  const handleSignup = useCallback(() => {
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`);
  }, [navigate, getRedirectPath]);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "#080b14" }}>
      {/* Skip link */}
      <a href="#hero-heading" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">
        Ir para conteúdo principal
      </a>

      {/* ═══ AMBIENT GLOWS ═══ */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] left-[20%] w-[900px] h-[900px] rounded-full opacity-[0.07]" style={{
          background: "radial-gradient(circle, hsl(13, 74%, 55%) 0%, transparent 60%)",
        }} />
        <div className="absolute top-[50%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{
          background: "radial-gradient(circle, hsl(25, 80%, 50%) 0%, transparent 70%)",
        }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.03]" style={{
          background: "radial-gradient(circle, hsl(200, 60%, 40%) 0%, transparent 65%)",
        }} />
      </div>

      {/* Grain overlay */}
      <div className="fixed inset-0 opacity-[0.018] z-[2] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px 128px",
      }} aria-hidden="true" />

      {/* Progress bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-primary via-primary/80 to-primary/40" style={{ scaleX: scrollYProgress }} />

      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          navScrolled
            ? "bg-[#080b14]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex-shrink-0">
            <img src={logoReghen} alt="REGHEN" className="h-7 w-auto" />
          </button>
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="px-4 py-2 text-[13px] text-white/35 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/[0.04]"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={handleLogin} className="px-5 py-2 text-[13px] font-medium text-white/45 hover:text-white transition-colors">
              Entrar
            </button>
            <button onClick={handleSignup} className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
              Criar conta
            </button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden p-2 text-white/50" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              {mobileOpen ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden bg-[#080b14]/95 backdrop-blur-2xl border-b border-white/[0.06] px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => scrollTo(link.href)} className="block w-full text-left py-2 text-sm text-white/40 hover:text-white">{link.label}</button>
            ))}
            <div className="flex gap-3 pt-3 border-t border-white/[0.06]">
              <button onClick={handleLogin} className="flex-1 py-2.5 text-sm border border-white/[0.08] rounded-lg text-white/40">Entrar</button>
              <button onClick={handleSignup} className="flex-1 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg">Criar conta</button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10">

        {/* ════════ HERO ════════ */}
        <motion.section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden" style={{ opacity: heroOpacity, scale: heroScale }}>
          {/* Hero BG Image */}
          <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.7 }} />
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#080b14]/40 via-[#080b14]/20 to-[#080b14]" />
          {/* Radial glow behind text */}
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full opacity-[0.12] pointer-events-none" style={{
            background: "radial-gradient(ellipse, hsl(13, 74%, 55%) 0%, transparent 70%)",
          }} aria-hidden="true" />

          <div className="relative z-10 max-w-4xl mx-auto text-center pt-24">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="mb-14 mt-16 flex justify-center"
            >
              <img src={logoReghen} alt="REGHEN" className="h-28 w-auto opacity-80" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, delay: 0.5, ease }}
              className="text-4xl md:text-5xl lg:text-[4rem] font-bold tracking-tight leading-[1.06] mb-7"
            >
              Decisão clínica baseada em ciência.{" "}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-orange-400">
                  Não em tentativa e erro.
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease }}
              className="text-white/50 text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto"
            >
              <p className="mb-4">
                O REGHEN é uma plataforma estruturada para padronizar procedimentos regenerativos, mensurar risco biológico e transformar desfechos clínicos em evidência real.
              </p>
              <p className="text-white/35">
                Cada registro se torna dado analisável.<br />
                Cada procedimento, um aprendizado validado.
              </p>
            </motion.div>

            {/* Selo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.0, ease }}
              className="text-[11px] tracking-[0.3em] uppercase text-white/25 mb-12"
            >
              Baseado em evidência. Orientado por dados.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <button onClick={handleSignup} className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_-5px] hover:shadow-primary/40">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative">Começar agora</span>
                <ArrowRight className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={handleLogin} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-medium border border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white hover:bg-white/[0.04] transition-all duration-500">
                Entrar
              </button>
            </motion.div>

            {/* Dashboard Mock */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1.4, delay: 1.4, ease }}
              className="max-w-5xl mx-auto relative perspective-1000"
            >

              <div className={`relative ${glassCard} overflow-hidden`} style={cardShadow}>
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/40" />
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-6 text-[11px] text-white/25">
                    <span className="text-primary/60 font-medium">Dashboard</span>
                    <span>Pacientes</span>
                    <span>Procedimentos</span>
                    <span className="hidden sm:inline">Evolução</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary/20" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-white/80 text-lg font-medium">Dashboard Clínico Científico</p>
                      <p className="text-white/25 text-xs">Monitoramento estruturado da prática regenerativa</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/35">Últimos 30 dias</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                    {[
                      { label: "RESULTADO CLÍNICO MÉDIO", value: "68%" },
                      { label: "TAXA DE RESPOSTA CLÍNICA", value: "72%" },
                      { label: "SEGUIMENTO ATIVO", value: "84%" },
                      { label: "SCORE BIOLÓGICO MÉDIO", value: "8.4" },
                      { label: "CASOS ESTRUTURADOS", value: "127%" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="group relative p-5 rounded-xl bg-white/[0.06] border border-white/[0.12] backdrop-blur-sm hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_-4px_rgba(160,111,76,0.15)]">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <p className="relative text-[10px] text-white/35 tracking-[0.15em] uppercase mb-3 font-medium">{kpi.label}</p>
                        <div className="relative flex items-end gap-2">
                          <span className="text-white/90 text-2xl font-bold tracking-tight">{kpi.value}</span>
                        </div>
                        <div className="relative flex items-end gap-[3px] h-5 mt-3">
                          {[30, 45, 35, 55, 40, 60, 50, 65, 55, 70, 60, 75].map((h, i) => (
                            <div key={i} className="flex-1 rounded-[2px] bg-primary/30" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                    <p className="text-[10px] text-white/20 uppercase tracking-wider mb-4">Evolução Clínica Longitudinal (VAS / Função) — 12 Meses</p>
                    <div className="flex items-end gap-2 h-28">
                      {[35, 50, 40, 65, 55, 70, 60, 75, 80, 60, 85, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 1.6 + i * 0.05, ease }}
                          className="flex-1 rounded-sm bg-gradient-to-t from-primary/50 to-primary/10"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-white/[0.25] text-center mt-4 tracking-wide">
                    Dados anonimizados • Escalas validadas • Padronização clínica
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080b14] to-transparent pointer-events-none" />
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          >
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="w-5 h-5 text-white/20" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ════════ ABOUT / VISÃO GERAL ════════ */}
        <section id="visao-geral" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">O que é o REGHEN</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 leading-snug">
                  Estrutura para decisões clínicas,{" "}
                  <span className="text-white/40">não atalhos.</span>
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: 0.15, ease }}
                className="space-y-6"
              >
                <p className="text-white/70 text-[15px] leading-[1.9]">
                  REGHEN é um sistema clínico estruturado para padronizar procedimentos regenerativos
                  e organizar desfechos com governança e segurança.
                </p>
                <p className="text-white/50 text-[15px] leading-[1.9]">
                  Ele transforma registros clínicos em dados analisáveis, preservando a autonomia
                  da prática e o isolamento por clínica.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-white/[0.12] to-transparent" />
                  <span className="text-white/40 text-[11px] tracking-widest uppercase">Baseado em evidência</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════ COMO FUNCIONA (TIMELINE) ════════ */}
        <section id="como-funciona" className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">Como funciona</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Da consulta ao desfecho, <span className="text-white/40">com estrutura</span>
              </h2>
            </motion.div>

            {/* Timeline — Desktop */}
            <div className="hidden md:grid grid-cols-5 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease }}
                  className={`relative p-6 ${glassCard} ${glassCardHover} transition-all duration-700 group`}
                  style={cardShadow}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-500">
                      <step.icon className="w-4.5 h-4.5 text-primary/60 group-hover:text-primary transition-colors duration-500" />
                    </div>
                    <span className="text-white/[0.08] text-2xl font-bold">{step.num}</span>
                  </div>
                  <h3 className="text-white/85 text-sm font-semibold mb-2">{step.title}</h3>
                  <p className="text-white/30 text-xs leading-relaxed">{step.desc}</p>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-white/[0.08] to-transparent hidden md:block" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Timeline — Mobile */}
            <div className="md:hidden space-y-4">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`p-5 ${glassCard} flex items-start gap-4`}
                  style={cardShadow}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-4 h-4 text-primary/60" />
                  </div>
                  <div>
                    <span className="text-white/[0.1] text-xs font-bold">{step.num}</span>
                    <h3 className="text-white/85 text-sm font-semibold mb-1">{step.title}</h3>
                    <p className="text-white/30 text-xs leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ MÓDULOS (Bento Grid) ════════ */}
        <section id="modulos" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">Módulos</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Infraestrutura completa <span className="text-white/40">para a prática regenerativa</span>
              </h2>
              <p className="text-white/30 text-[15px] max-w-2xl mx-auto">
                Cada módulo foi projetado para uma etapa específica do fluxo clínico.
              </p>
            </motion.div>

            {/* Asymmetric Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[240px]">
              {modules.map((mod, i) => {
                const spans = [
                  "md:col-span-4 md:row-span-2",
                  "md:col-span-4",
                  "md:col-span-4",
                  "md:col-span-5",
                  "md:col-span-4",
                  "md:col-span-3",
                ];
                return (
                  <motion.div
                    key={mod.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.08, ease }}
                    className={`${spans[i]} ${glassCard} ${glassCardHover} transition-all duration-700 p-7 flex flex-col justify-between group relative overflow-hidden`}
                    style={cardShadow}
                  >
                    {/* Corner glow on hover */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/0 group-hover:bg-primary/[0.06] blur-3xl transition-all duration-700" />

                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-primary/[0.08] flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-500">
                        <mod.icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors duration-500" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-white/90 text-[15px] font-semibold mb-2">{mod.title}</h3>
                      <p className="text-white/30 text-sm leading-relaxed">{mod.desc}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-primary/40 group-hover:text-primary/70 text-xs font-medium mt-auto pt-4 transition-colors duration-500">
                      <span>Explorar</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════ FEATURES ALTERNADAS ════════ */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-24"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">Funcionalidades</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Funcionalidades <span className="text-white/40">premium</span>
              </h2>
            </motion.div>

            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease }}
              >
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">SCORE & Qualidade</p>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 leading-tight">
                  Qualidade do PRP como <span className="text-white/40">indicador clínico</span>
                </h3>
                <p className="text-white/35 text-[15px] leading-relaxed mb-8">
                  O SCORE REGHEN integra variáveis do preparo, método de aplicação e contexto biológico
                  do paciente para gerar um índice de qualidade do procedimento.
                </p>
                <ul className="space-y-4">
                  {["Comparação interna entre procedimentos", "Identificação de padrões clínicos", "Evolução longitudinal da prática"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/45 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-primary/[0.08] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary/60" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease }}
                className={`${glassCard} p-8 relative overflow-hidden`}
                style={cardShadow}
              >
                <div className="space-y-5">
                  {[
                    { label: "Contagem plaquetária", value: "≥ 1.0M/μL", bar: 85 },
                    { label: "Fator de concentração", value: "3–5×", bar: 70 },
                    { label: "Leucócitos", value: "LP / LR", bar: 60 },
                    { label: "Volume final", value: "3–8 mL", bar: 75 },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/35 text-xs">{item.label}</span>
                        <span className="text-primary text-sm font-semibold">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.bar}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease }}
                          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary/20"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
              </motion.div>
            </div>

            {/* Section divider */}
            <div className="flex items-center gap-6 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>

            {/* Feature 2 — Reversed */}
            <div className="grid md:grid-cols-2 gap-16 items-center mt-24">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease }}
                className="md:order-2"
              >
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">Segurança & Governança</p>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 leading-tight">
                  Dados clínicos <span className="text-white/40">protegidos por design</span>
                </h3>
                <p className="text-white/35 text-[15px] leading-relaxed mb-8">
                  Cada clínica opera em isolamento lógico completo. Políticas de acesso granulares
                  garantem que cada profissional veja apenas os dados pertinentes ao seu contexto.
                </p>
                <ul className="space-y-4">
                  {["Row Level Security por clínica", "Controle de acesso baseado em perfis (RBAC)", "Audit log completo de todas as operações"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/45 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-primary/[0.08] flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary/60" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease }}
                className="md:order-1 space-y-4"
              >
                {securityPillars.map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className={`p-6 ${glassCard} ${glassCardHover} transition-all duration-700 flex items-start gap-4 group`}
                    style={cardShadow}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors duration-500">
                      <item.icon className="w-4.5 h-4.5 text-primary/60 group-hover:text-primary transition-colors duration-500" />
                    </div>
                    <div>
                      <h4 className="text-white/85 text-[15px] font-semibold mb-1">{item.title}</h4>
                      <p className="text-white/28 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════ MÉTRICAS ════════ */}
        <section id="seguranca" className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.015] to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">Métricas clínicas</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Resultados mensuráveis <span className="text-white/40">em cada etapa</span>
              </h2>
              <p className="text-white/30 text-[15px] max-w-2xl mx-auto">
                Acompanhe indicadores reais da sua prática regenerativa com dados longitudinais.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease }}
                  className={`p-7 ${glassCard} ${glassCardHover} transition-all duration-700 text-center group relative overflow-hidden`}
                  style={cardShadow}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.03] group-hover:to-transparent transition-all duration-700" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/[0.08] flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors duration-500">
                      <m.icon className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors duration-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-primary text-xl font-bold mb-1">{m.value}</p>
                    <p className="text-white/25 text-xs">{m.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ FAQ ════════ */}
        <section id="faq" className="py-32 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">FAQ</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Perguntas <span className="text-white/40">frequentes</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className={`${glassCard} px-6 data-[state=open]:bg-white/[0.04] data-[state=open]:border-white/[0.1] transition-all duration-500`}
                    style={cardShadow}
                  >
                    <AccordionTrigger className="text-sm font-medium text-white/80 hover:text-white hover:no-underline py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/35 text-sm leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ════════ CTA FINAL ════════ */}
        <section className="py-32 px-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.06] pointer-events-none" style={{
            background: "radial-gradient(circle, hsl(13, 74%, 55%) 0%, transparent 65%)",
          }} aria-hidden="true" />

          <div className="max-w-2xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease }}
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Pronto para estruturar <span className="text-white/40">sua prática?</span>
              </h2>
              <p className="text-white/35 mb-10 text-base leading-relaxed">
                Comece a padronizar procedimentos e acompanhar desfechos com segurança e governança.
              </p>
              <button onClick={handleSignup} className="group relative inline-flex items-center gap-2.5 px-10 py-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground overflow-hidden transition-all duration-500 hover:shadow-[0_0_60px_-8px] hover:shadow-primary/40">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative">Criar conta gratuitamente</span>
                <ArrowRight className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-white/15 text-xs mt-6">Sem cartão de crédito. Configuração em minutos.</p>
            </motion.div>
          </div>
        </section>

        {/* ════════ FOOTER ════════ */}
        <footer className="border-t border-white/[0.06] py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              <div>
                <img src={logoReghen} alt="REGHEN" className="h-6 w-auto mb-4 opacity-50" />
                <p className="text-white/20 text-xs leading-relaxed">
                  Infraestrutura clínica para Medicina Regenerativa.
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Plataforma</p>
                <ul className="space-y-2.5 text-white/20 text-sm">
                  <li><button onClick={() => scrollTo("#modulos")} className="hover:text-white/50 transition-colors">Módulos</button></li>
                  <li><button onClick={() => scrollTo("#seguranca")} className="hover:text-white/50 transition-colors">Métricas</button></li>
                  <li><button onClick={() => scrollTo("#faq")} className="hover:text-white/50 transition-colors">FAQ</button></li>
                </ul>
              </div>
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Recursos</p>
                <ul className="space-y-2.5 text-white/20 text-sm">
                  <li><span className="cursor-default">Documentação</span></li>
                  <li><span className="cursor-default">Guia Clínico</span></li>
                  <li><span className="cursor-default">Suporte</span></li>
                </ul>
              </div>
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Legal</p>
                <ul className="space-y-2.5 text-white/20 text-sm">
                  <li><span className="cursor-default">Termos de Uso</span></li>
                  <li><span className="cursor-default">Privacidade</span></li>
                  <li><span className="cursor-default">LGPD</span></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-white/10 text-xs">© {new Date().getFullYear()} REGHEN. Todos os direitos reservados.</p>
              <p className="text-white/10 text-xs">Desenvolvido com excelência clínica.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
