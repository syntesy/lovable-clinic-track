import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, FileCheck, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

export default function LandingHero() {
  const navigate = useNavigate();
  const location = useLocation();

  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

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
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
    visible: (d: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.9, delay: d, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  const bullets = [
    { icon: FileCheck, text: "Procedimento padronizado por registro estruturado" },
    { icon: BarChart3, text: "Desfechos organizados por timepoint" },
    { icon: Shield, text: "Controle de acesso e segurança por clínica" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden" aria-labelledby="hero-heading">
      {/* Hero background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 lg:gap-20 items-center py-20 lg:py-0 relative z-10">
        {/* Left - Copy */}
        <div>
          <motion.h1
            id="hero-heading"
            initial="hidden" animate="visible" variants={fadeUp} custom={0.1}
            className="text-foreground text-3xl md:text-4xl lg:text-[2.75rem] font-semibold tracking-tight leading-[1.15] mb-6"
          >
            Infraestrutura clínica para Medicina Regenerativa responsável.
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={0.2}
            className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-xl"
          >
            Padronize condutas, acompanhe desfechos e organize sua prática em Medicina Regenerativa com estrutura, clareza e segurança.
          </motion.p>

          <motion.ul
            initial="hidden" animate="visible" variants={fadeUp} custom={0.3}
            className="space-y-3 mb-10"
          >
            {bullets.map((b) => (
              <li key={b.text} className="flex items-start gap-3 text-sm text-muted-foreground">
                <b.icon className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>{b.text}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={0.4}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={handleSignup}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-400 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
            >
              Criar conta <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogin}
              className="px-7 py-3 rounded-xl text-sm font-medium border border-border/40 text-foreground/80 transition-all duration-400 hover:border-border/60 hover:bg-secondary/30"
            >
              Entrar
            </button>
          </motion.div>
        </div>

        {/* Right - Dashboard mock */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <div className="relative">
            {/* Glow behind */}
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" aria-hidden="true" />
            
            {/* Mock dashboard */}
            <div className="relative bg-card border border-border/40 rounded-2xl p-6 shadow-xl">
              {/* Header bar */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-primary/60" />
                <div className="h-2 w-24 rounded-full bg-muted" />
                <div className="ml-auto h-2 w-16 rounded-full bg-muted" />
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {["Procedimentos", "Follow-ups", "Cobertura"].map((label) => (
                  <div key={label} className="bg-secondary/50 rounded-lg p-3">
                    <div className="h-1.5 w-10 rounded bg-muted-foreground/20 mb-2" />
                    <div className="h-5 w-14 rounded bg-primary/20" />
                    <p className="text-[10px] text-muted-foreground mt-1.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Chart mock */}
              <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                <div className="h-1.5 w-20 rounded bg-muted-foreground/20 mb-4" />
                <div className="flex items-end gap-1.5 h-20">
                  {[40, 55, 35, 70, 60, 80, 65, 75, 85, 50, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-primary/30"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Table mock */}
              <div className="space-y-2">
                {[1, 2, 3].map((r) => (
                  <div key={r} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/20">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <div className="flex-1 h-1.5 rounded bg-muted-foreground/15" />
                    <div className="w-12 h-1.5 rounded bg-primary/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
