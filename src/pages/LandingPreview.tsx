import { useCallback, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck, BarChart3, Shield, Activity, TestTube2, Gauge, Target, CheckCircle2, Zap, LineChart, Lock, Users, FlaskConical, ClipboardList } from "lucide-react";
import logoReghen from "@/assets/logo-reghen.png";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const cardStyle = {
  boxShadow: "0 2px 40px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
};

export default function LandingPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navScrolled, setNavScrolled] = useState(false);

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

  return (
    <div className="min-h-screen text-white relative" style={{ background: "#080b14" }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full opacity-[0.10]" style={{
          background: "radial-gradient(circle, hsl(25, 85%, 52%) 0%, hsl(15, 70%, 35%) 25%, transparent 65%)",
        }} />
        <div className="absolute top-[60%] right-[-15%] w-[700px] h-[700px] rounded-full opacity-[0.04]" style={{
          background: "radial-gradient(circle, hsl(30, 80%, 50%) 0%, transparent 70%)",
        }} />
      </div>

      {/* Grain */}
      <div className="fixed inset-0 opacity-[0.02] z-[2] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px 128px",
      }} aria-hidden="true" />

      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navScrolled ? "bg-[#080b14]/90 backdrop-blur-2xl border-b border-white/[0.06]" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={logoReghen} alt="REGHEN" className="h-7 w-auto" />
          <div className="hidden md:flex items-center gap-8 text-[13px] text-white/40">
            <a href="#features" className="hover:text-white transition-colors">Módulos</a>
            <a href="#metrics" className="hover:text-white transition-colors">Métricas</a>
            <a href="#security" className="hover:text-white transition-colors">Segurança</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogin} className="px-5 py-2 text-[13px] font-medium text-white/50 hover:text-white transition-colors">
              Entrar
            </button>
            <button onClick={handleSignup} className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Criar conta
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      <div className="relative z-10">

        {/* ═══ HERO ═══ */}
        <section className="pt-32 pb-8 px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] mb-10"
            >
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full tracking-wider uppercase">
                Novo
              </span>
              <span className="text-white/40 text-[13px]">Plataforma v2.0 — Medicina Regenerativa</span>
              <ArrowRight className="w-3 h-3 text-white/30" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease }}
              className="text-4xl md:text-5xl lg:text-[3.8rem] font-semibold tracking-tight leading-[1.08] mb-6"
            >
              Infraestrutura clínica para{" "}
              <span className="text-primary">Medicina Regenerativa</span>{" "}
              responsável.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease }}
              className="text-white/40 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Padronize condutas, acompanhe desfechos e organize sua prática em
              Medicina Regenerativa com estrutura, clareza e segurança.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-wrap justify-center gap-4 mb-20"
            >
              <button onClick={handleSignup} className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-[0_0_30px_-5px] shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/90 transition-all duration-300">
                Começar agora <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={handleLogin} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium border border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white hover:bg-white/[0.03] transition-all duration-300">
                Entrar <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Dashboard mock with glow arc (RedSun style) */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.3, ease }}
            className="max-w-5xl mx-auto relative"
          >
            {/* Glow arc behind dashboard */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120%] h-[300px] opacity-60 pointer-events-none" style={{
              background: "radial-gradient(ellipse 70% 100% at 50% 100%, hsl(25, 90%, 45%) 0%, hsl(20, 80%, 30%) 30%, transparent 70%)",
            }} aria-hidden="true" />

            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0d1117] overflow-hidden" style={cardStyle}>
              {/* Top bar */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-6 text-[11px] text-white/30">
                  <span className="text-primary/60 font-medium">Dashboard</span>
                  <span>Pacientes</span>
                  <span>Procedimentos</span>
                  <span className="hidden sm:inline">Evolução</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary/20" />
              </div>

              {/* Dashboard content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white/80 text-lg font-medium">Dashboard Clínico Científico</p>
                    <p className="text-white/25 text-xs" style={{ opacity: 0.7 }}>Monitoramento estruturado da prática regenerativa</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/40">
                    Últimos 30 dias
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "PROCEDIMENTOS DOCUMENTADOS", value: "127", change: "+6.9%", up: true, sub: null },
                    { label: "SEGUIMENTO LONGITUDINAL", value: "84%", change: null, up: true, sub: null },
                    { label: "RESPOSTA CLÍNICA GLOBAL", value: "73.2%", change: null, up: true, sub: "Baseado em escalas funcionais padronizadas" },
                    { label: "SCORE BIOLÓGICO MÉDIO", value: "8.4", change: null, up: true, sub: "Classificação de qualidade do PRP" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-[9px] text-white/25 tracking-wider uppercase mb-2">{kpi.label}</p>
                      <div className="flex items-end gap-2">
                        <span className="text-white/80 text-xl font-semibold">{kpi.value}</span>
                        {kpi.change && (
                          <span className="text-[10px] font-medium text-emerald-400/70">{kpi.change}</span>
                        )}
                      </div>
                      {kpi.sub && (
                        <p className="text-[8px] text-white/20 mt-1.5 leading-tight">{kpi.sub}</p>
                      )}
                      {/* Mini sparkline */}
                      <div className="flex items-end gap-[2px] h-4 mt-2">
                        {[30, 45, 35, 55, 40, 60, 50, 65, 55, 70, 60, 75].map((h, i) => (
                          <div key={i} className="flex-1 rounded-[1px] bg-primary/20" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart area */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5 mb-4">
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mb-4">Evolução Clínica Longitudinal (VAS / Função) — Últimos 12 Meses</p>
                  <div className="flex items-end gap-2 h-28">
                    {[35, 50, 40, 65, 55, 70, 60, 75, 80, 60, 85, 70].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-primary/10" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                {/* Table rows */}
                <div className="space-y-1.5">
                  {[1, 2, 3].map((r) => (
                    <div key={r} className="flex items-center gap-3 py-2.5 px-4 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                      <div className="w-7 h-7 rounded-full bg-primary/10" />
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 w-28 rounded bg-white/10" />
                        <div className="h-1 w-20 rounded bg-white/[0.05]" />
                      </div>
                      <div className="w-14 h-1.5 rounded bg-primary/15" />
                    </div>
                  ))}
                </div>

                {/* Scientific footer */}
                <p className="text-[9px] text-white/[0.35] text-center mt-5 tracking-wide">
                  Dados anonimizados • Escalas validadas • Padronização clínica
                </p>
              </div>
            </div>

            {/* Fade to background at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080b14] to-transparent pointer-events-none" />
          </motion.div>
        </section>

        {/* ═══ TRUST BAR ═══ */}
        <section className="py-16 px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <p className="text-white/20 text-xs tracking-widest uppercase mb-8">Infraestrutura utilizada por clínicas de referência</p>
            <div className="flex items-center justify-center gap-12 flex-wrap opacity-20">
              {["Clínica Alpha", "Instituto Beta", "Centro Gamma", "Ortho Delta", "Bio Epsilon"].map((name) => (
                <span key={name} className="text-white text-sm font-medium tracking-wide">{name}</span>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ BENTO FEATURE GRID (RedSun style) ═══ */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Bento grid — asymmetric like RedSun */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[280px]">
              {/* Card 1 — Triagem (tall left) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
                className="md:col-span-4 md:row-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 flex flex-col justify-between group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                style={cardStyle}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <ClipboardList className="w-5 h-5 text-primary/60" />
                  </div>
                  <h3 className="text-white/90 text-lg font-medium mb-2">Triagem Estruturada</h3>
                  <p className="text-white/35 text-sm leading-relaxed">
                    Avaliação clínica com critérios objetivos antes da intervenção. Scoring de elegibilidade e contraindicações.
                  </p>
                </div>
                <div className="mt-6 rounded-xl bg-white/[0.03] border border-white/[0.05] p-4">
                  <div className="space-y-2">
                    {["Critérios de inclusão", "Red flags", "Score de elegibilidade"].map((item, i) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${i < 2 ? "bg-emerald-500/30" : "bg-primary/30"}`} />
                        <span className="text-white/30 text-xs">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Card 2 — Procedimento (top right) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1, ease }}
                className="md:col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                style={cardStyle}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FlaskConical className="w-5 h-5 text-primary/60" />
                </div>
                <h3 className="text-white/90 text-[15px] font-medium mb-2">Procedimento Padronizado</h3>
                <p className="text-white/35 text-sm leading-relaxed">
                  Registro completo com protocolo, insumos e rastreabilidade total.
                </p>
              </motion.div>

              {/* Card 3 — Follow-up (top far right) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2, ease }}
                className="md:col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                style={cardStyle}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <LineChart className="w-5 h-5 text-primary/60" />
                </div>
                <h3 className="text-white/90 text-[15px] font-medium mb-2">Acompanhamento</h3>
                <p className="text-white/35 text-sm leading-relaxed">
                  Desfechos em timepoints: 30, 90, 180 e 365 dias com PROs.
                </p>
              </motion.div>

              {/* Card 4 — Dashboard image mock (bottom center, wide) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15, ease }}
                className="md:col-span-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 relative overflow-hidden"
                style={cardStyle}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-primary/60" />
                </div>
                <h3 className="text-white/90 text-[15px] font-medium mb-2">SCORE REGHEN</h3>
                <p className="text-white/35 text-sm leading-relaxed">
                  Índice de qualidade do procedimento com variáveis de preparo, método e contexto biológico.
                </p>
                {/* Mini chart decoration */}
                <div className="absolute bottom-4 right-4 flex items-end gap-1 h-16 opacity-30">
                  {[40, 60, 45, 75, 55, 80, 65].map((h, i) => (
                    <div key={i} className="w-3 rounded-sm bg-primary/40" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </motion.div>

              {/* Card 5 — AI (bottom right) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25, ease }}
                className="md:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                style={cardStyle}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5 text-primary/60" />
                </div>
                <h3 className="text-white/90 text-[15px] font-medium mb-2">Análise Clínica</h3>
                <p className="text-white/35 text-sm leading-relaxed">
                  Indicadores por patologia e período.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ POWERFUL FEATURES (RedSun alternating) ═══ */}
        <section id="metrics" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-20"
            >
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Funcionalidades Premium</h2>
              <p className="text-white/35 text-base max-w-2xl mx-auto">
                Explore a infraestrutura que redefine o padrão de qualidade em Medicina Regenerativa.
              </p>
            </motion.div>

            {/* Feature 1 — Text left, visual right */}
            <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
              >
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">
                  SCORE & Qualidade
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 leading-tight">
                  Qualidade do PRP como indicador clínico
                </h3>
                <p className="text-white/40 text-[15px] leading-relaxed mb-8">
                  O SCORE REGHEN integra variáveis do preparo, método de aplicação e contexto biológico
                  do paciente para gerar um índice de qualidade do procedimento.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Comparação interna entre procedimentos", "Identificação de padrões clínicos", "Evolução longitudinal da prática"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/50 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate("#")} className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                  Ver documentação <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 relative overflow-hidden"
                style={cardStyle}
              >
                {/* Mock UI inside */}
                <div className="space-y-4">
                  {[
                    { label: "Contagem plaquetária", value: "≥ 1.0M/μL", bar: 85 },
                    { label: "Fator de concentração", value: "3–5×", bar: 70 },
                    { label: "Leucócitos", value: "LP / LR", bar: 60 },
                    { label: "Volume final", value: "3–8 mL", bar: 75 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white/40 text-xs">{item.label}</span>
                          <span className="text-primary text-sm font-semibold">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary/30" style={{ width: `${item.bar}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Glow decoration */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
              </motion.div>
            </div>

            {/* Feature 2 — reversed */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
                className="md:order-2"
              >
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">
                  Segurança & Governança
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 leading-tight">
                  Dados clínicos protegidos por design
                </h3>
                <p className="text-white/40 text-[15px] leading-relaxed mb-8">
                  Cada clínica opera em isolamento lógico completo. Políticas de acesso granulares
                  garantem que cada profissional veja apenas os dados pertinentes ao seu contexto.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Row Level Security por clínica", "Controle de acesso baseado em perfis (RBAC)", "Audit log completo de todas as operações"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/50 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate("#")} className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                  Ver documentação <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
                className="md:order-1 space-y-4"
              >
                {[
                  { icon: Lock, title: "Isolamento por clínica", desc: "Cada organização com seu próprio espaço de dados isolado." },
                  { icon: Users, title: "Permissões granulares", desc: "Admin, médico, fisioterapeuta — acesso restrito por perfil." },
                  { icon: Shield, title: "Rastreabilidade total", desc: "Cada ação registrada com timestamp, autor e contexto." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 flex items-start gap-4"
                    style={cardStyle}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-primary/60" />
                    </div>
                    <div>
                      <h4 className="text-white/85 text-[15px] font-medium mb-1">{item.title}</h4>
                      <p className="text-white/30 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ METRICS GRID ═══ */}
        <section id="security" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-16"
            >
              <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">Métricas clínicas</p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">Resultados mensuráveis em cada etapa</h2>
              <p className="text-white/35 text-[15px] max-w-2xl mx-auto">
                Acompanhe indicadores reais da sua prática regenerativa com dados longitudinais.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                  style={cardStyle}
                >
                  <m.icon className="w-5 h-5 text-primary/40 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-primary text-xl font-bold mb-1">{m.value}</p>
                  <p className="text-white/30 text-xs">{m.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA FINAL (RedSun style — with glow) ═══ */}
        <section className="py-32 px-6 relative">
          {/* CTA glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none" style={{
            background: "radial-gradient(circle, hsl(25, 85%, 50%) 0%, transparent 70%)",
          }} aria-hidden="true" />

          <div className="max-w-2xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
            >
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
                Pronto para estruturar sua prática?
              </h2>
              <p className="text-white/40 mb-10 text-base leading-relaxed">
                Comece a padronizar procedimentos e acompanhar desfechos com segurança e governança.
              </p>
              <button onClick={handleSignup} className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-[0_0_40px_-8px] shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/90 transition-all duration-300">
                Criar conta gratuitamente <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-white/20 text-xs mt-6">Sem cartão de crédito. Configuração em minutos.</p>
            </motion.div>
          </div>
        </section>

        {/* ═══ FOOTER (RedSun style) ═══ */}
        <footer className="border-t border-white/[0.06] py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              <div>
                <img src={logoReghen} alt="REGHEN" className="h-6 w-auto mb-4 opacity-60" />
                <p className="text-white/25 text-xs leading-relaxed">
                  Infraestrutura clínica para Medicina Regenerativa responsável.
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Plataforma</p>
                <ul className="space-y-2 text-white/25 text-sm">
                  <li><a href="#features" className="hover:text-white/50 transition-colors">Módulos</a></li>
                  <li><a href="#metrics" className="hover:text-white/50 transition-colors">Métricas</a></li>
                  <li><a href="#security" className="hover:text-white/50 transition-colors">Segurança</a></li>
                </ul>
              </div>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Recursos</p>
                <ul className="space-y-2 text-white/25 text-sm">
                  <li><span className="cursor-default">Documentação</span></li>
                  <li><span className="cursor-default">Guia Clínico</span></li>
                  <li><span className="cursor-default">Suporte</span></li>
                </ul>
              </div>
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Legal</p>
                <ul className="space-y-2 text-white/25 text-sm">
                  <li><span className="cursor-default">Termos de Uso</span></li>
                  <li><span className="cursor-default">Privacidade</span></li>
                  <li><span className="cursor-default">LGPD</span></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-white/15 text-xs">© {new Date().getFullYear()} REGHEN. Todos os direitos reservados.</p>
              <p className="text-white/15 text-xs">Desenvolvido com excelência clínica.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Back link */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => navigate("/")} className="px-4 py-2 text-xs bg-white/[0.05] backdrop-blur border border-white/[0.08] rounded-lg text-white/40 hover:text-white hover:border-white/20 transition-all">
          ← Voltar
        </button>
      </div>
    </div>
  );
}
