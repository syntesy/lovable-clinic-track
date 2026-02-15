import { useCallback, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, FileCheck, BarChart3, Shield, Activity, TestTube2, Gauge, Target, CheckCircle2 } from "lucide-react";
import NucleusScene from "@/components/landing/nucleus/NucleusScene";
import logoReghen from "@/assets/logo-reghen.png";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
    <div className="min-h-screen text-white relative" style={{
      background: "linear-gradient(180deg, #070b18 0%, #0a1020 30%, #0c1228 60%, #080e1e 100%)"
    }}>
      {/* WebGL Nucleus — fixed background */}
      <NucleusScene scrollProgress={scrollProgress} />

      {/* Grain overlay */}
      <div className="fixed inset-0 opacity-[0.018] z-[1]" style={{
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
            ? "bg-[#070b18]/85 backdrop-blur-2xl border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={logoReghen} alt="REGHEN" className="h-7 w-auto" />
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

      {/* Content — above WebGL */}
      <div className="relative z-10">

        {/* ═══ HERO ═══ */}
        <section className="min-h-screen flex items-center justify-center pt-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <span className="px-3 py-1 text-[11px] font-semibold bg-primary/20 text-primary rounded-full tracking-wide uppercase">
                Novo
              </span>
              <span className="text-white/40 text-[13px]">Plataforma v2.0 — Medicina Regenerativa</span>
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
              className="text-white/45 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Padronize condutas, acompanhe desfechos e organize sua prática em
              Medicina Regenerativa com estrutura, clareza e segurança.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <button onClick={handleSignup} className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-[0_0_30px_-5px] shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/90 transition-all duration-300">
                Criar conta <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={handleLogin} className="px-8 py-3.5 rounded-xl text-sm font-medium border border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white hover:bg-white/[0.03] transition-all duration-300">
                Entrar
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-white/30"
            >
              {[
                { icon: FileCheck, text: "Procedimento padronizado" },
                { icon: BarChart3, text: "Desfechos por timepoint" },
                { icon: Shield, text: "Segurança por clínica" },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-2">
                  <b.icon className="w-3.5 h-3.5 text-primary/50" />
                  <span>{b.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ COMO FUNCIONA ═══ */}
        <section className="min-h-screen flex items-center py-32 px-6">
          <div className="max-w-6xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="max-w-lg mb-14"
            >
              <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">
                Como funciona
              </p>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight">
                Do procedimento ao desfecho em 4 etapas
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
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
                  transition={{ duration: 0.7, delay: i * 0.1, ease }}
                  className="group p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                  style={{ boxShadow: "0 4px 40px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
                >
                  <span className="text-primary/30 text-4xl font-bold">{item.step}</span>
                  <h3 className="text-white/90 text-[15px] font-medium mt-3 mb-2">{item.title}</h3>
                  <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ MÉTRICAS CLÍNICAS ═══ */}
        <section className="min-h-screen flex items-center py-32 px-6">
          <div className="max-w-6xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease }}
              className="text-center mb-16"
            >
              <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">
                Métricas clínicas
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                Resultados mensuráveis em cada etapa
              </h2>
              <p className="text-white/35 text-[15px] max-w-2xl mx-auto">
                Acompanhe indicadores reais da sua prática regenerativa com dados longitudinais e rastreabilidade completa.
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
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.07, ease }}
                  className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm text-center hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500"
                  style={{ boxShadow: "0 4px 40px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
                >
                  <m.icon className="w-5 h-5 text-primary/40 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-primary text-xl font-bold mb-1">{m.value}</p>
                  <p className="text-white/30 text-xs">{m.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES (RedSun-style alternating) ═══ */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto w-full">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
              >
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">
                  SCORE & Qualidade
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 leading-tight">
                  Qualidade do PRP como indicador clínico
                </h2>
                <p className="text-white/40 text-[15px] leading-relaxed mb-6">
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { label: "Contagem plaquetária", value: "≥ 1.0M/μL" },
                  { label: "Fator de concentração", value: "3–5×" },
                  { label: "Leucócitos", value: "LP / LR" },
                  { label: "Volume final", value: "3–8 mL" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-500"
                    style={{ boxShadow: "0 4px 40px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-primary text-lg font-bold">{item.value}</p>
                    <p className="text-white/30 text-xs mt-1">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Feature 2 — reversed */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
                className="md:order-2"
              >
                <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-semibold mb-4">
                  Segurança & Governança
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 leading-tight">
                  Dados clínicos protegidos por design
                </h2>
                <p className="text-white/40 text-[15px] leading-relaxed mb-6">
                  Cada clínica opera em isolamento lógico completo. Políticas de acesso granulares
                  garantem que cada profissional veja apenas os dados pertinentes ao seu contexto.
                </p>
                <ul className="space-y-3">
                  {["Row Level Security por clínica", "Controle de acesso baseado em perfis (RBAC)", "Audit log completo de todas as operações"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/50 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease }}
                className="md:order-1 grid grid-cols-1 gap-4"
              >
                {[
                  { title: "Isolamento por clínica", desc: "Cada organização possui seu próprio espaço de dados com barreiras lógicas intransponíveis." },
                  { title: "Permissões granulares", desc: "Admin, médico, fisioterapeuta — cada perfil com acesso restrito às suas responsabilidades." },
                  { title: "Rastreabilidade total", desc: "Cada ação registrada com timestamp, autor e contexto para compliance completo." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-all duration-500"
                    style={{ boxShadow: "0 4px 40px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" }}
                  >
                    <h3 className="text-white/85 text-[15px] font-medium mb-1.5">{item.title}</h3>
                    <p className="text-white/30 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ CTA FINAL ═══ */}
        <section className="min-h-[80vh] flex items-center justify-center py-32 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
            >
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-6">
                Pronto para estruturar sua prática?
              </h2>
              <p className="text-white/40 mb-10 text-base">
                Comece a padronizar procedimentos e acompanhar desfechos com segurança e governança.
              </p>
              <button onClick={handleSignup} className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-[0_0_40px_-8px] shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/90 transition-all duration-300">
                Criar conta gratuitamente <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-white/20 text-xs mt-6">
                Sem cartão de crédito. Configuração em minutos.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-white/[0.06] py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <img src={logoReghen} alt="REGHEN" className="h-6 w-auto opacity-40" />
            <p className="text-white/20 text-xs">
              © {new Date().getFullYear()} REGHEN. Infraestrutura clínica para Medicina Regenerativa.
            </p>
          </div>
        </footer>
      </div>

      {/* Back link */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => navigate("/")} className="px-4 py-2 text-xs bg-white/[0.05] backdrop-blur border border-white/[0.08] rounded-lg text-white/40 hover:text-white hover:border-white/20 transition-all">
          ← Voltar à landing atual
        </button>
      </div>
    </div>
  );
}
