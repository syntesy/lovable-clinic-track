import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck, BarChart3, Shield, Building2, Users, Lock } from "lucide-react";
import CellNucleusCanvas from "@/components/landing/CellNucleusCanvas";
import logoReghen from "@/assets/logo-reghen.png";

export default function LandingPreview() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (d: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 1, delay: d, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* ═══════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/20"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={logoReghen} alt="REGHEN" className="h-7 w-auto" />
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogin}
              className="px-5 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Entrar
            </button>
            <button
              onClick={handleSignup}
              className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg transition-all duration-300 hover:bg-primary/90"
            >
              Criar conta
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════════════════════════════
          HERO — Full viewport with Cell Nucleus
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Canvas background */}
        <CellNucleusCanvas className="z-0" />

        {/* Content overlay */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.3}
            className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6"
          >
            Infraestrutura clínica para{" "}
            <span className="text-primary">Medicina Regenerativa</span>{" "}
            responsável.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.5}
            className="text-muted-foreground text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Padronize condutas, acompanhe desfechos e organize sua prática em
            Medicina Regenerativa com estrutura, clareza e segurança.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.7}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <button
              onClick={handleSignup}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-400 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            >
              Criar conta <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogin}
              className="px-8 py-3.5 rounded-xl text-sm font-medium border border-border/40 text-foreground/80 transition-all duration-400 hover:border-border/60 hover:bg-secondary/30"
            >
              Entrar
            </button>
          </motion.div>

          {/* Bullet points */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0.9}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            {[
              { icon: FileCheck, text: "Procedimento padronizado" },
              { icon: BarChart3, text: "Desfechos por timepoint" },
              { icon: Shield, text: "Segurança por clínica" },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-2">
                <b.icon className="w-3.5 h-3.5 text-primary/70" />
                <span>{b.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ABOUT — Simple text block with canvas accent
      ═══════════════════════════════════════════ */}
      <section className="relative py-32 md:py-40 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <CellNucleusCanvas className="opacity-30" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9 }}
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-6">
              Visão geral
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
              O que é o REGHEN
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              REGHEN é um sistema clínico estruturado para padronizar procedimentos
              regenerativos e organizar desfechos com governança e segurança. Ele
              transforma registros clínicos em dados analisáveis, preservando a
              autonomia da prática e o isolamento por clínica.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECURITY — 3 pillars with canvas
      ═══════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-6">
        <div className="absolute inset-0 bg-secondary/20" aria-hidden="true" />
        <div className="absolute inset-0 overflow-hidden">
          <CellNucleusCanvas className="opacity-20" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-4">
              Segurança
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Arquitetura pensada para proteção de dados clínicos
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: "Isolamento por clínica",
                desc: "Cada clínica opera em um ambiente completamente isolado. Nenhum dado é compartilhado entre organizações.",
              },
              {
                icon: Users,
                title: "Controle de acesso por perfil",
                desc: "Permissões granulares por função: administrador, profissional de saúde, técnico e recepção.",
              },
              {
                icon: Lock,
                title: "Políticas de segurança no banco",
                desc: "Row Level Security garante que cada consulta ao banco respeita as permissões do usuário autenticado.",
              },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-7 rounded-xl bg-card/60 border border-border/20 backdrop-blur-sm"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-5">
                  <p.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-foreground text-[15px] font-medium mb-2">{p.title}</h3>
                <p className="text-muted-foreground/70 text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer className="relative border-t border-border/20 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={logoReghen} alt="REGHEN" className="h-6 w-auto opacity-60" />
          <p className="text-muted-foreground/50 text-xs">
            © {new Date().getFullYear()} REGHEN. Infraestrutura clínica para Medicina Regenerativa.
          </p>
        </div>
      </footer>

      {/* Back to current landing link */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 text-xs bg-card border border-border/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar à landing atual
        </button>
      </div>
    </div>
  );
}
