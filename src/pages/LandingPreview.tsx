import { useCallback, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck, BarChart3, Shield, Activity, TestTube2, Gauge, Target } from "lucide-react";
import NucleusScene from "@/components/landing/nucleus/NucleusScene";
import logoReghen from "@/assets/logo-reghen.png";

// Scroll position map now lives in nucleus/constants.ts

const sectionEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const sectionAnim = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" as const },
  transition: { duration: 0.9, ease: sectionEase },
};

export default function LandingPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? Math.min(top / total, 1) : 0);
      setNavScrolled(top > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // nucleusPos removed — NucleusScene handles scroll internally

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

  return (
    <div className="min-h-screen text-foreground relative" style={{
      background: "linear-gradient(180deg, hsl(220 30% 14%) 0%, hsl(220 28% 16%) 30%, hsl(218 25% 18%) 60%, hsl(215 22% 15%) 100%)"
    }}>
      {/* WebGL Nucleus background — fixed canvas with R3F */}
      <NucleusScene scrollProgress={scrollProgress} />

      {/* Subtle grain overlay */}
      <div className="fixed inset-0 opacity-[0.025] z-[1]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }} aria-hidden="true" />

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

      {/* Content wrapper — above nucleus */}
      <div className="relative z-10">

        {/* ═══ SECTION 1: HERO ═══ */}
        <section className="min-h-screen flex items-center justify-center pt-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
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
              transition={{ duration: 0.8, delay: 1 }}
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

        {/* ═══ SECTION 2: COMO FUNCIONA ═══ */}
        <section className="min-h-screen flex items-center py-32 px-6">
          <div className="max-w-5xl mx-auto w-full">
            <motion.div {...sectionAnim} className="max-w-lg">
              <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-6">
                Como funciona
              </p>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-8 leading-tight">
                Do procedimento ao desfecho em 4 etapas
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              {[
                { step: "01", title: "Triagem estruturada", desc: "Avaliação clínica com critérios objetivos para decisão segura antes da intervenção." },
                { step: "02", title: "Procedimento padronizado", desc: "Registro completo do procedimento com protocolo, método, insumos e rastreabilidade." },
                { step: "03", title: "Acompanhamento longitudinal", desc: "Desfechos reportados pelo paciente em timepoints definidos: 30, 90, 180 e 365 dias." },
                { step: "04", title: "Análise e evolução", desc: "Painel interno com indicadores por patologia, procedimento e período de acompanhamento." },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.12 }}
                  className="p-7 rounded-xl bg-card/30 border border-border/10 backdrop-blur-sm"
                >
                  <span className="text-primary/40 text-3xl font-bold">{item.step}</span>
                  <h3 className="text-foreground text-[15px] font-medium mt-3 mb-2">{item.title}</h3>
                  <p className="text-muted-foreground/60 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: MÉTRICAS E RESULTADOS CLÍNICOS ═══ */}
        <section className="min-h-screen flex items-center py-32 px-6">
          <div className="max-w-5xl mx-auto w-full">
            <motion.div {...sectionAnim} className="text-center mb-16">
              <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">
                Métricas clínicas
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                Resultados mensuráveis em cada etapa
              </h2>
              <p className="text-muted-foreground text-[15px] max-w-2xl mx-auto">
                Acompanhe indicadores reais da sua prática regenerativa com dados longitudinais e rastreabilidade completa.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Activity, value: "VAS 0–10", label: "Escala de dor em cada timepoint" },
                { icon: BarChart3, value: "PRO", label: "Desfechos reportados pelo paciente" },
                { icon: TestTube2, value: "PRP/PRF", label: "Rastreabilidade de insumos biológicos" },
                { icon: Target, value: "NPS Clínico", label: "Satisfação longitudinal do paciente" },
                { icon: Gauge, value: "SCORE", label: "Índice de qualidade do procedimento" },
                { icon: Shield, value: "RLS/RBAC", label: "Governança por clínica e perfil" },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="p-6 rounded-xl bg-card/30 border border-border/10 backdrop-blur-sm text-center"
                >
                  <m.icon className="w-5 h-5 text-primary/50 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-primary text-xl font-bold mb-1">{m.value}</p>
                  <p className="text-muted-foreground/50 text-xs">{m.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 4: SCORE E QUALIDADE DO PRP ═══ */}
        <section className="min-h-screen flex items-center py-32 px-6">
          <div className="max-w-5xl mx-auto w-full">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div {...sectionAnim}>
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-6">
                  SCORE & Qualidade
                </p>
                <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-8 leading-tight">
                  Qualidade do PRP como indicador clínico
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-6">
                  O SCORE REGHEN integra variáveis do preparo, método de aplicação e contexto biológico
                  do paciente para gerar um índice de qualidade do procedimento.
                </p>
                <p className="text-muted-foreground/60 text-sm leading-relaxed">
                  Esse indicador permite comparação interna, identificação de padrões
                  e evolução longitudinal da prática clínica regenerativa.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { label: "Contagem plaquetária", value: "≥ 1.0M/μL" },
                  { label: "Fator de concentração", value: "3–5×" },
                  { label: "Leucócitos", value: "LP / LR" },
                  { label: "Volume final", value: "3–8 mL" },
                ].map((item) => (
                  <div key={item.label} className="p-5 rounded-xl bg-card/30 border border-border/10 backdrop-blur-sm">
                    <p className="text-primary text-lg font-bold">{item.value}</p>
                    <p className="text-muted-foreground/50 text-xs mt-1">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 5: CTA FINAL ═══ */}
        <section className="min-h-screen flex items-center justify-center py-32 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-6">
                Pronto para estruturar sua prática?
              </h2>
              <p className="text-muted-foreground mb-10 text-base">
                Comece a padronizar procedimentos e acompanhar desfechos com segurança e governança.
              </p>
              <button onClick={handleSignup} className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl transition-all duration-300">
                Criar conta gratuitamente <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-muted-foreground/40 text-xs mt-6">
                Sem cartão de crédito. Configuração em minutos.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-border/20 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <img src={logoReghen} alt="REGHEN" className="h-6 w-auto opacity-60" />
            <p className="text-muted-foreground/40 text-xs">
              © {new Date().getFullYear()} REGHEN. Infraestrutura clínica para Medicina Regenerativa.
            </p>
          </div>
        </footer>
      </div>

      {/* Back link */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => navigate("/")} className="px-4 py-2 text-xs bg-card/80 backdrop-blur border border-border/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar à landing atual
        </button>
      </div>
    </div>
  );
}
