import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import logoReghen from "@/assets/logo-reghen.png";
import { supabase } from "@/integrations/supabase/client";

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Scroll-based parallax for subtle depth
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleSignup = () => {
    navigate("/auth?mode=signup");
  };

  const handleProsseguir = () => {
    if (isLoggedIn) {
      navigate("/select-environment");
    } else {
      navigate("/auth");
    }
  };

  // Animation variants - refined easing matching SelectEnvironmentPage (slower for quiet luxury)
  const fadeUp = {
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 30 
    },
    visible: (delay: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 1.1,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    }),
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.18,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const pillars = [
    {
      title: "Decisão estruturada",
      description: "Protocolos, critérios e apoio racional para decisões clínicas seguras.",
    },
    {
      title: "Execução responsável",
      description: "Padronização técnica e alinhamento com boas práticas clínicas.",
    },
    {
      title: "Base científica",
      description: "Integração com literatura, critérios de indicação e racional científico.",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-hidden">
      {/* Sophisticated layered background - matching SelectEnvironmentPage */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-b from-background via-background to-background"
        style={{ y: backgroundY }}
      />
      
      {/* Subtle radial gradients for depth */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.03),transparent)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,hsl(var(--accent)/0.04),transparent)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_50%_50%_at_0%_80%,hsl(var(--primary)/0.02),transparent)]" />
      
      {/* Ultra-subtle grid pattern */}
      <div 
        className="fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo - discreto no topo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="mb-14 md:mb-16"
        >
          <motion.img
            src={logoReghen}
            alt="REGHEN"
            className="h-16 md:h-20 w-auto object-contain"
            style={{ filter: "brightness(0.95)" }}
            whileHover={!prefersReducedMotion ? { scale: 1.02, filter: "brightness(1)" } : {}}
            transition={{ duration: 0.5 }}
          />
        </motion.div>

        {/* Headline principal - com quebra de linha deliberada */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.1}
          className="text-foreground text-[1.75rem] md:text-[2.75rem] lg:text-5xl font-light tracking-tight text-center max-w-4xl leading-[1.15] mb-6"
        >
          <span className="block">Infraestrutura clínica para</span>
          <span className="block">decisões regenerativas responsáveis.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.2}
          className="text-muted-foreground/75 text-base md:text-lg text-center max-w-2xl font-light mb-8"
        >
          Apoio estruturado à decisão clínica em procedimentos regenerativos.
        </motion.p>

        {/* Texto de apoio */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.3}
          className="text-muted-foreground/50 text-sm md:text-[15px] text-center max-w-xl font-light leading-relaxed mb-10"
        >
          Desenvolvido para profissionais habilitados, com foco em prática segura,
          padronização de condutas e alinhamento rigoroso com evidência científica.
        </motion.p>

        {/* CTAs - hierarquia clara */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.4}
          className="flex flex-col sm:flex-row items-center gap-4 mb-8"
        >
          <motion.button
            onClick={handleSignup}
            className="px-8 py-3.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-500 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            whileHover={!prefersReducedMotion ? { scale: 1.02, y: -1 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
            transition={{ duration: 0.4 }}
          >
            Criar conta
          </motion.button>
          <motion.button
            onClick={handleLogin}
            className="px-8 py-3.5 rounded-xl text-sm font-medium bg-transparent text-foreground/80 border border-border/40 transition-all duration-500 hover:border-border/60 hover:text-foreground hover:bg-card/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            whileHover={!prefersReducedMotion ? { scale: 1.02, y: -1 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
            transition={{ duration: 0.4 }}
          >
            Entrar
          </motion.button>
        </motion.div>

        {/* Microtexto abaixo dos CTAs */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.5}
          className="text-muted-foreground/35 text-[11px] tracking-[0.2em] font-light"
        >
          Um único ecossistema. Experiências claramente definidas.
        </motion.p>

        {/* Scroll indicator - ultra discreto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={!prefersReducedMotion ? { y: [0, 8, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-transparent via-muted-foreground/20 to-transparent"
          />
        </motion.div>
      </section>

      {/* ===== POR QUE O REGHEN EXISTE ===== */}
      <section className="relative z-10 py-32 md:py-40 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-muted-foreground/40 text-[10px] tracking-[0.35em] uppercase mb-8 font-light"
          >
            Propósito
          </motion.p>

          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="text-foreground text-2xl md:text-3xl font-light tracking-tight mb-10"
          >
            Por que o REGHEN existe
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={0.2}
            className="text-muted-foreground/75 text-base md:text-[17px] leading-[1.8] font-light mb-6"
          >
            A prática clínica regenerativa exige critérios bem definidos,
            documentação técnica consistente e decisões sustentadas por evidência.
          </motion.p>

          <motion.p
            variants={fadeUp}
            custom={0.3}
            className="text-muted-foreground/60 text-base md:text-[17px] leading-[1.8] font-light"
          >
            O REGHEN existe para oferecer estrutura —
            não atalhos, não promessas, não improviso.
          </motion.p>
        </motion.div>
      </section>

      {/* ===== O QUE O REGHEN É (PILARES) ===== */}
      <section className="relative z-10 py-32 md:py-40 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-muted-foreground/40 text-[10px] tracking-[0.35em] uppercase mb-8 font-light text-center"
          >
            Pilares
          </motion.p>

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                custom={0.1 + index * 0.1}
                className="group"
              >
                <motion.div 
                  className="p-8 md:p-10 rounded-2xl bg-card/30 border border-border/10 transition-all duration-700 group-hover:bg-card/50 group-hover:border-border/20 group-hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.08)] focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2 focus-within:ring-offset-background"
                  whileHover={!prefersReducedMotion ? { 
                    y: -3, 
                    boxShadow: "0 12px 40px -12px hsl(var(--primary) / 0.12), 0 0 0 1px hsl(var(--primary) / 0.05)" 
                  } : {}}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  tabIndex={0}
                >
                  {/* Minimal accent line */}
                  <div className="w-8 h-px bg-primary/30 mb-8 transition-all duration-700 group-hover:w-12 group-hover:bg-primary/50" />
                  
                  <h3 className="text-foreground text-lg font-medium tracking-tight mb-4">
                    {pillar.title}
                  </h3>
                  
                  <p className="text-muted-foreground/65 text-sm leading-[1.7] font-light">
                    {pillar.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ===== PARA QUEM FOI CRIADO ===== */}
      <section className="relative z-10 py-32 md:py-40 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-muted-foreground/40 text-[10px] tracking-[0.35em] uppercase mb-8 font-light"
          >
            Público
          </motion.p>

          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="text-foreground text-2xl md:text-3xl font-light tracking-tight mb-10"
          >
            Para quem o REGHEN foi criado
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={0.2}
            className="text-muted-foreground/75 text-base md:text-[17px] leading-[1.8] font-light"
          >
            O REGHEN é destinado exclusivamente a profissionais habilitados
            que atuam ou desejam atuar com medicina regenerativa de forma ética,
            responsável e baseada em evidência.
          </motion.p>
        </motion.div>
      </section>

      {/* ===== ECOSSISTEMA (com CTA ponte) ===== */}
      <section className="relative z-10 py-32 md:py-40 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-muted-foreground/40 text-[10px] tracking-[0.35em] uppercase mb-8 font-light"
          >
            Ecossistema
          </motion.p>

          <motion.h2
            variants={fadeUp}
            custom={0.1}
            className="text-foreground text-2xl md:text-3xl font-light tracking-tight mb-6"
          >
            Um único ecossistema. Experiências claramente definidas.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={0.2}
            className="text-muted-foreground/65 text-base md:text-[17px] leading-[1.8] font-light mb-12"
          >
            O REGHEN integra prática clínica, conhecimento aplicado
            e acompanhamento estruturado em uma infraestrutura coesa.
          </motion.p>

          {/* CTA Prosseguir */}
          <motion.div
            variants={fadeUp}
            custom={0.3}
          >
            <motion.button
              onClick={handleProsseguir}
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl text-sm font-medium bg-transparent text-foreground/70 border border-border/30 transition-all duration-500 hover:border-border/50 hover:text-foreground hover:bg-card/30 hover:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              whileHover={!prefersReducedMotion ? { scale: 1.02, y: -1 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
              transition={{ duration: 0.4 }}
            >
              Prosseguir
              <ArrowRight className="w-4 h-4 transition-transform duration-300" />
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 py-16 px-6 border-t border-border/10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo e texto institucional */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="flex flex-col items-center md:items-start gap-4"
            >
              <img
                src={logoReghen}
                alt="REGHEN"
                className="h-8 w-auto object-contain opacity-60"
              />
              <p className="text-muted-foreground/40 text-[11px] tracking-wide font-light">
                REGHEN · Infraestrutura clínica para medicina regenerativa
              </p>
            </motion.div>

            {/* Links mínimos */}
            <motion.div
              variants={fadeUp}
              custom={0.1}
              className="flex flex-wrap items-center justify-center gap-6 md:gap-8"
            >
              <button
                onClick={handleLogin}
                className="text-muted-foreground/50 text-xs font-light transition-all duration-300 hover:text-foreground/70 focus-visible:outline-none focus-visible:text-foreground"
              >
                Entrar
              </button>
              <button
                onClick={handleSignup}
                className="text-muted-foreground/50 text-xs font-light transition-all duration-300 hover:text-foreground/70 focus-visible:outline-none focus-visible:text-foreground"
              >
                Criar conta
              </button>
              <a
                href="#"
                className="text-muted-foreground/50 text-xs font-light transition-all duration-300 hover:text-foreground/70 focus-visible:outline-none focus-visible:text-foreground"
              >
                Termos
              </a>
              <a
                href="#"
                className="text-muted-foreground/50 text-xs font-light transition-all duration-300 hover:text-foreground/70 focus-visible:outline-none focus-visible:text-foreground"
              >
                Privacidade
              </a>
            </motion.div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
