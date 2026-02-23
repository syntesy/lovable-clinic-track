import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import logoReghen from "@/assets/logo-reghen.png";

export default function LandingHeroInstitutional() {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/select-environment";
  }, [location.search]);

  const handleSignup = useCallback(() => {
    navigate(`/auth?mode=signup&redirect=${encodeURIComponent(getRedirectPath())}`);
  }, [navigate, getRedirectPath]);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (d: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.9, delay: d, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "#080b14" }}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-32">
        <motion.img
          src={logoReghen}
          alt="REGHEN"
          className="h-20 md:h-24 w-auto mx-auto mb-10 opacity-80"
          initial="hidden" animate="visible" variants={fadeUp} custom={0}
        />

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={0.05}
          className="text-primary text-[11px] tracking-[0.3em] uppercase font-medium mb-6"
        >
          Infraestrutura Nacional
        </motion.p>

        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={0.1}
          className="text-white text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6"
          style={{ fontWeight: 400 }}
        >
          REGHEN{" "}
          <br className="hidden md:block" />
          <span className="text-white/60">Infraestrutura Nacional para Prática em{" "}</span>
          <span className="text-primary">Medicina Regenerativa</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={0.2}
          className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Organizando, mensurando e estruturando a Medicina Regenerativa com método, evidência e governança.
        </motion.p>

        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={0.35}
          className="flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={() => navigate("/reghen")}
            className="px-8 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Conhecer o REGHEN
          </button>
        </motion.div>
      </div>
    </section>
  );
}
