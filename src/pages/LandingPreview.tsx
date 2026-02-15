import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, FileCheck, BarChart3, Shield, Building2, Users, Lock, FileText, Stethoscope, TestTube2, Gauge, ClipboardList } from "lucide-react";
import CellNucleusCanvas from "@/components/landing/CellNucleusCanvas";
import logoReghen from "@/assets/logo-reghen.png";

export default function LandingPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll progress 0→1 across entire page
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
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

  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground relative">
      {/* Nucleus canvas — fixed, scroll-driven */}
      <CellNucleusCanvas scrollProgress={scrollProgress} className="z-10" />

      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={logoReghen} alt="REGHEN" className="h-7 w-auto" />
          <div className="flex items-center gap-3">
            <button onClick={handleLogin} className="px-5 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </button>
            <button onClick={handleSignup} className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Criar conta
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 z-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl md:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-[1.1] mb-6"
          >
            Infraestrutura clínica para{" "}
            <span className="text-primary">Medicina Regenerativa</span>{" "}
            responsável.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted-foreground text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Padronize condutas, acompanhe desfechos e organize sua prática em
            Medicina Regenerativa com estrutura, clareza e segurança.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <button onClick={handleSignup} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl transition-all duration-300">
              Criar conta <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={handleLogin} className="px-8 py-3.5 rounded-xl text-sm font-medium border border-border/40 text-foreground/80 hover:border-border/60 hover:bg-secondary/30 transition-all duration-300">
              Entrar
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            {[
              { icon: FileCheck, text: "Procedimento padronizado" },
              { icon: BarChart3, text: "Desfechos por timepoint" },
              { icon: Shield, text: "Segurança por clínica" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2">
                <b.icon className="w-3.5 h-3.5 text-primary/60" />
                <span>{b.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ ABOUT — sphere moves right, text appears left ═══ */}
      <section className="relative min-h-screen flex items-center z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-6">
              Visão geral
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-8 leading-tight">
              O que é o REGHEN
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
              REGHEN é um sistema clínico estruturado para padronizar procedimentos
              regenerativos e organizar desfechos com governança e segurança.
            </p>
            <p className="text-muted-foreground/70 text-sm leading-relaxed">
              Ele transforma registros clínicos em dados analisáveis, preservando a
              autonomia da prática e o isolamento por clínica.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ MODULES — cards fade in staggered ═══ */}
      <section className="relative z-10 py-28 md:py-36 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9 }}
            className="text-center mb-16"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Módulos</p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Infraestrutura completa para a prática regenerativa
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: FileText, title: "Procedimento Padronizado (PSR)", desc: "Registro estruturado de cada procedimento com protocolo, método e rastreabilidade completa." },
              { icon: Stethoscope, title: "Triagem e Avaliação Estruturada", desc: "Critérios clínicos objetivos para decisão segura antes de cada intervenção regenerativa." },
              { icon: TestTube2, title: "Exames e Contexto Biológico", desc: "Integração de dados laboratoriais e perfil biológico para fundamentar a conduta clínica." },
              { icon: Gauge, title: "SCORE e Indicadores", desc: "Avaliação quantitativa e qualitativa para apoiar a tomada de decisão do profissional de saúde." },
              { icon: ClipboardList, title: "Desfechos do Paciente (PRO)", desc: "Registro longitudinal de desfechos reportados pelo paciente por timepoint definido." },
              { icon: BarChart3, title: "Análise de Resultados", desc: "Painel interno da clínica com filtros por procedimento, patologia e período de acompanhamento." },
            ].map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="group"
              >
                <div className="h-full p-6 md:p-7 rounded-xl bg-card/40 border border-border/15 backdrop-blur-sm transition-all duration-500 hover:border-border/30 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5">
                  <mod.icon className="w-5 h-5 text-primary/60 mb-4 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                  <h3 className="text-foreground text-[15px] font-medium mb-2">{mod.title}</h3>
                  <p className="text-muted-foreground/60 text-sm leading-relaxed">{mod.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECURITY ═══ */}
      <section className="relative z-10 py-28 md:py-36 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">Segurança</p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              Arquitetura pensada para proteção de dados clínicos
            </h2>
            <p className="text-muted-foreground text-[15px] max-w-2xl mx-auto">
              Segurança não é uma funcionalidade opcional. É a base da infraestrutura.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: "Isolamento por clínica", desc: "Cada clínica opera em um ambiente completamente isolado. Nenhum dado é compartilhado entre organizações." },
              { icon: Users, title: "Controle de acesso por perfil", desc: "Permissões granulares por função: administrador, profissional de saúde, técnico e recepção." },
              { icon: Lock, title: "Políticas de segurança no banco", desc: "Row Level Security garante que cada consulta ao banco respeita as permissões do usuário autenticado." },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="p-7 rounded-xl bg-card/40 border border-border/15 backdrop-blur-sm"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-5">
                  <p.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-foreground text-[15px] font-medium mb-2">{p.title}</h3>
                <p className="text-muted-foreground/60 text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Pronto para estruturar sua prática?
            </h2>
            <p className="text-muted-foreground mb-10">
              Comece a padronizar procedimentos e acompanhar desfechos com segurança e governança.
            </p>
            <button onClick={handleSignup} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-300">
              Criar conta <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-border/20 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={logoReghen} alt="REGHEN" className="h-6 w-auto opacity-60" />
          <p className="text-muted-foreground/40 text-xs">
            © {new Date().getFullYear()} REGHEN. Infraestrutura clínica para Medicina Regenerativa.
          </p>
        </div>
      </footer>

      {/* Back link */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => navigate("/")} className="px-4 py-2 text-xs bg-card/80 backdrop-blur border border-border/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar à landing atual
        </button>
      </div>
    </div>
  );
}
