import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logoReghen from "@/assets/logo-reghen.png";
import heroBg from "@/assets/hero-bg.png";
import heroBgReghen from "@/assets/hero-bg-reghen.png";
import slideBg01 from "@/assets/slide-bg-01-new.png";
import slideBg02 from "@/assets/slide-bg-02.jpg";
import slideBg03 from "@/assets/slide-bg-03.jpg";
import slideBg04 from "@/assets/slide-bg-04.jpg";
import slideBg05 from "@/assets/slide-bg-05.jpg";
import slideBg06 from "@/assets/slide-bg-06.jpg";

interface Slide {
  label: string;
  navLabel: string;
  headline: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  cta2?: string;
  cta2Link?: string;
  bg: string;
}

const slides: Slide[] = [
  {
    label: "INFRAESTRUTURA NACIONAL",
    navLabel: "REGHEN",
    headline: "Infraestrutura Nacional de Padronização da Medicina Regenerativa",
    subtitle: "Organizando, mensurando e estruturando a Medicina Regenerativa com método, evidência e governança.",
    cta: "Conhecer o REGHEN",
    ctaLink: "/reghen",
    bg: heroBgReghen,
  },
  {
    label: "CENÁRIO ATUAL",
    navLabel: "PROBLEMA",
    headline: "A prática regenerativa evoluiu.\nA estrutura científica precisa evoluir junto.",
    subtitle: "Sem padronização metodológica e mensuração longitudinal, a prática ocorre — mas não se consolida como sistema clínico consistente.",
    cta: "Entender o problema estrutural",
    ctaLink: "/problema",
    bg: slideBg01,
  },
  {
    label: "ARQUITETURA",
    navLabel: "ARQUITETURA",
    headline: "A Arquitetura que Organiza a Prática",
    subtitle: "Fluxo clínico estruturado, critérios objetivos e governança integrados em um único sistema metodológico.",
    cta: "Explorar a Arquitetura",
    ctaLink: "/arquitetura",
    bg: slideBg02,
  },
  {
    label: "BASE METODOLÓGICA",
    navLabel: "CIÊNCIA",
    headline: "Estrutura Científica REGHEN",
    subtitle: "Conversão da literatura científica em critérios clínicos aplicáveis, com mensuração objetiva e rastreabilidade metodológica.",
    cta: "Conhecer a base metodológica",
    ctaLink: "/estrutura-cientifica",
    bg: slideBg03,
  },
  {
    label: "GOVERNANÇA",
    navLabel: "GOVERNANÇA",
    headline: "Governança e Segurança Metodológica",
    subtitle: "Rastreabilidade, documentação estruturada e padronização técnica integradas à prática clínica.",
    cta: "Ver estrutura de governança",
    ctaLink: "/governanca-info",
    bg: slideBg04,
  },
  {
    label: "RESULTADOS",
    navLabel: "RESULTADOS",
    headline: "Da prática à evidência estruturada",
    subtitle: "Organização de dados clínicos, mensuração longitudinal e consolidação de desfechos com critérios objetivos.",
    cta: "Ver como os resultados são estruturados",
    ctaLink: "/resultados",
    bg: slideBg05,
  },
  {
    label: "ECOSSISTEMA",
    navLabel: "ECOSSISTEMA",
    headline: "Um Ecossistema Estruturado",
    subtitle: "Profissionais, centros e metodologia conectados por uma mesma arquitetura científica.",
    cta: "Conhecer o ecossistema",
    ctaLink: "/ecossistema",
    bg: slideBg06,
  },
  {
    label: "INTEGRAÇÃO",
    navLabel: "INTEGRAÇÃO",
    headline: "Integrar é operar dentro da infraestrutura.",
    subtitle: "A padronização da Medicina Regenerativa exige compromisso estrutural com método, mensuração e governança.",
    cta: "Conhecer a Integração",
    ctaLink: "/integracao",
    cta2: "Criar conta",
    cta2Link: "__signup__",
    bg: heroBg,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const isTransitioning = useRef(false);
  const [progress, setProgress] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const AUTO_PLAY_INTERVAL = 8000; // 8 seconds per slide
  const PROGRESS_STEP = 50; // update every 50ms

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

  const resetAutoPlay = useCallback(() => {
    setProgress(0);
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const goTo = useCallback((index: number) => {
    if (isTransitioning.current || index === current) return;
    isTransitioning.current = true;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    resetAutoPlay();
    setTimeout(() => { isTransitioning.current = false; }, 600);
  }, [current, resetAutoPlay]);

  const goNext = useCallback(() => {
    if (current < slides.length - 1) goTo(current + 1);
    else goTo(0); // loop back to first
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  // Auto-play with progress
  useEffect(() => {
    setProgress(0);
    let elapsed = 0;
    progressRef.current = setInterval(() => {
      elapsed += PROGRESS_STEP;
      setProgress(Math.min((elapsed / AUTO_PLAY_INTERVAL) * 100, 100));
    }, PROGRESS_STEP);

    autoPlayRef.current = setTimeout(() => {
      if (current < slides.length - 1) {
        goTo(current + 1);
      } else {
        goTo(0);
      }
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps


  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // Wheel navigation
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (e.deltaY > 30) goNext();
        else if (e.deltaY < -30) goPrev();
      }, 80);
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [goNext, goPrev]);

  const slide = slides[current];
  const slideNumber = String(current + 1).padStart(2, "0");

  const bgVariants = {
    enter: { opacity: 0, scale: 1.03 },
    center: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
    exit: { opacity: 0, scale: 1, transition: { duration: 0.4 } },
  };

  const contentVariants = {
    enter: (d: number) => ({
      opacity: 0,
      y: d > 0 ? 40 : -40,
    }),
    center: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
    exit: (d: number) => ({
      opacity: 0,
      y: d > 0 ? -30 : 30,
      transition: { duration: 0.3 },
    }),
  };

  const handleCtaClick = (link: string) => {
    if (link === "__signup__") {
      handleSignup();
    } else {
      navigate(link);
    }
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ background: "#080b14" }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 60) {
          if (diff > 0) goNext();
          else goPrev();
        }
      }}
    >
      {/* ═══ BACKGROUND ═══ */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 z-0"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${slide.bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.88,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080b14]/40 via-[#080b14]/15 to-[#080b14]/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b14]/25 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 md:px-12 h-20 flex items-center justify-between">
        <button onClick={() => goTo(0)} className="flex-shrink-0">
          <img src={logoReghen} alt="REGHEN" className="h-8 md:h-9 w-auto opacity-80 hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogin}
            className="px-5 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={handleSignup}
            className="px-5 py-2 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Criar conta
          </button>
        </div>
      </header>

      {/* ═══ SLIDE NUMBER (BOTH SIDES) ═══ */}
      <div className="absolute left-8 md:left-12 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.3, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-white text-sm md:text-base font-light tracking-[0.2em]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {slideNumber}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.3, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-white text-sm md:text-base font-light tracking-[0.2em]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {String(slides.length).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10 h-full flex items-center justify-center px-8 md:px-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="text-center max-w-4xl mx-auto"
          >
            {current === 0 ? (
              <>
                {/* Logo centered for first slide */}
                <img src={logoReghen} alt="REGHEN" className="h-16 md:h-24 lg:h-28 w-auto mx-auto mb-8 opacity-90" />
                {/* Headline */}
                <h1
                  className="text-white text-3xl md:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight mb-6"
                  style={{ fontWeight: 300, fontFamily: "Montserrat, sans-serif" }}
                >
                  {slide.headline}
                </h1>
                <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                  {slide.subtitle}
                </p>
              </>
            ) : (
              <>
                {/* Label */}
                <p className="text-primary text-[11px] md:text-[12px] tracking-[0.3em] uppercase font-medium mb-5">
                  {slide.label}
                </p>

                {/* Headline */}
                <h1
                  className="text-white text-3xl md:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight mb-6"
                  style={{ fontWeight: 300, fontFamily: "Montserrat, sans-serif" }}
                >
                  {slide.headline.split("\n").map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </h1>

                {/* Subtitle */}
                <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                  {slide.subtitle}
                </p>
              </>
            )}

            {/* CTA */}
            {current !== 0 && (
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleCtaClick(slide.ctaLink)}
                  className="px-8 py-3 text-sm font-medium border border-white/20 text-white/80 rounded-lg hover:border-white/40 hover:text-white hover:bg-white/[0.04] transition-all duration-300"
                >
                  {slide.cta}
                </button>
                {slide.cta2 && slide.cta2Link && (
                  <button
                    onClick={() => handleCtaClick(slide.cta2Link!)}
                    className="px-8 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors duration-300"
                  >
                    {slide.cta2}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ BOTTOM NAVIGATION ═══ */}
      <nav className="absolute bottom-0 left-0 right-0 z-30 px-6 md:px-12 pb-8">
        <div className="flex items-end gap-0 overflow-x-auto hide-scrollbar">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="flex-shrink-0 group relative text-left transition-all duration-300"
              style={{ minWidth: "140px", paddingRight: "24px" }}
            >
              {/* Progress bar */}
              <div className="w-full h-[2px] mb-3 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: i === current ? `${progress}%` : "0%",
                    background: i === current
                      ? "hsl(var(--primary))"
                      : "transparent",
                    transition: i === current ? "width 50ms linear" : "none",
                  }}
                />
              </div>
              <span
                className="text-[11px] tracking-[0.2em] uppercase font-medium transition-all duration-300"
                style={{
                  color: i === current ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)",
                }}
              >
                {s.navLabel}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
