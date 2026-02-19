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
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      <div className="max-w-7xl mx-auto px-6 w-full flex items-center py-20 lg:py-0 relative z-10">
        {/* Left - Copy */}
        <div className="max-w-2xl">
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

      </div>
    </section>
  );
}
