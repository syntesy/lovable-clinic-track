import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logoReghen from "@/assets/logo-reghen.png";
import slideBg01 from "@/assets/slide-bg-01.jpg";
import slideBg02 from "@/assets/slide-bg-02.jpg";
import slideBg03 from "@/assets/slide-bg-03.jpg";
import slideBg04 from "@/assets/slide-bg-04.jpg";
import slideBg05 from "@/assets/slide-bg-05.jpg";
import slideBg06 from "@/assets/slide-bg-06.jpg";

const AUTOPLAY_MS = 6000;

const slides = [
  {
    id: "problema",
    label: "Problema",
    title: "O problema da\nMedicina Regenerativa",
    subtitle: "Evidência fragmentada, protocolos variáveis e desfechos pouco comparáveis. Sem padronização, a prática vira tentativa e erro.",
    tagline: "O cenário atual precisa de estrutura.",
    bg: slideBg01,
    route: "/problema",
  },
  {
    id: "estrutura-clinica",
    label: "Estrutura Clínica",
    title: "Estrutura clínica\npadronizada",
    subtitle: "Do primeiro registro ao follow-up, tudo documentado em um fluxo consistente e auditável.",
    tagline: "Baseado em evidência. Orientado por dados.",
    bg: slideBg02,
    route: "/estrutura-clinica",
  },
  {
    id: "score",
    label: "SCORE",
    title: "SCORE biológico\ne técnico",
    subtitle: "Um índice estruturado para apoiar elegibilidade, risco e qualidade do procedimento com base em variáveis objetivas.",
    tagline: "Quantificação objetiva da qualidade técnica.",
    bg: slideBg03,
    route: "/score",
  },
  {
    id: "resultados",
    label: "Resultados",
    title: "Resultados\nmensuráveis",
    subtitle: "VAS, PRO, NPS e desfechos longitudinais por timepoints — mensuração real do que funciona na sua prática.",
    tagline: "Cada etapa documentada. Cada resultado rastreável.",
    bg: slideBg04,
    route: "/resultados",
  },
  {
    id: "evidencia",
    label: "Evidência",
    title: "Evidência conectada\nà prática",
    subtitle: "Curadoria científica e rastreabilidade: cada decisão clínica conectada ao que existe de melhor na literatura.",
    tagline: "Decisão clínica baseada em ciência.",
    bg: slideBg05,
    route: "/evidencia",
  },
  {
    id: "integridade",
    label: "Integridade",
    title: "Integridade estrutural\ndos dados",
    subtitle: "Consistência metodológica, rastreabilidade e estabilidade dos registros para produzir dados comparáveis e confiáveis.",
    tagline: "Governança estrutural dos dados clínicos.",
    bg: slideBg06,
    route: "/integridade",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

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

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setProgress(0);
    startTimeRef.current = Date.now();
    setIsPaused(false);
  }, []);

  const next = useCallback(() => {
    goTo((active + 1) % slides.length);
  }, [active, goTo]);

  // Autoplay + progress
  useEffect(() => {
    if (isPaused) return;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / AUTOPLAY_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        next();
      }
    };

    timerRef.current = setInterval(tick, 30);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, active, next]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goTo((active + 1) % slides.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo((active - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  const handleNavClick = (idx: number) => {
    setIsPaused(true);
    goTo(idx);
    setTimeout(() => setIsPaused(false), 3000);
  };

  const current = slides[active];
  const padNum = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: "#080b14" }}>
      {/* ═══ FULLSCREEN BACKGROUND ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${current.bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b14]/80 via-transparent to-[#080b14]/30" />
        </motion.div>
      </AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <header className="absolute top-0 left-0 right-0 z-30 px-8 md:px-12 h-20 flex items-center justify-between">
        <button onClick={() => goTo(0)} className="flex-shrink-0">
          <img src={logoReghen} alt="REGHEN" className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity" />
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

      {/* ═══ SLIDE COUNTER — LEFT ═══ */}
      <div className="absolute left-8 md:left-12 top-1/2 -translate-y-1/2 z-20">
        <AnimatePresence mode="wait">
          <motion.span
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-white/30 text-4xl md:text-5xl font-light tracking-widest"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {padNum(active + 1)}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ═══ SLIDE COUNTER — RIGHT ═══ */}
      <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 z-20">
        <span
          className="text-white/20 text-4xl md:text-5xl font-light tracking-widest"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {padNum(slides.length)}
        </span>
      </div>

      {/* ═══ CENTER CONTENT ═══ */}
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 md:px-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-5xl"
          >
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6 whitespace-pre-line"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
            >
              {current.title}
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
              {current.subtitle}
            </p>
            {current.tagline && (
              <p className="text-white/30 text-xs md:text-sm tracking-[0.2em] uppercase mb-8">
                {current.tagline}
              </p>
            )}
            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate(current.route)}
                className="px-7 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Explorar
              </button>
              <button
                onClick={handleSignup}
                className="px-7 py-3 text-sm font-medium text-white/40 border border-white/10 rounded-lg hover:text-white/70 hover:border-white/20 transition-all"
              >
                Criar conta
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══ BOTTOM NAV ═══ */}
      <nav className="absolute bottom-0 left-0 right-0 z-30 px-6 md:px-12 pb-8 md:pb-10">
        <div className="h-px bg-white/[0.08] mb-5" />

        <div className="flex items-start gap-0 overflow-x-auto no-scrollbar">
          {slides.map((slide, idx) => {
            const isActive = idx === active;
            return (
              <button
                key={slide.id}
                onClick={() => handleNavClick(idx)}
                className="flex-1 min-w-[120px] md:min-w-0 group relative text-left px-2 md:px-3 pt-3 pb-1 transition-all duration-500"
              >
                <div className="absolute top-0 left-2 right-2 md:left-3 md:right-3 h-[2px] bg-white/[0.06] overflow-hidden">
                  {isActive && (
                    <motion.div
                      className="h-full bg-primary"
                      style={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.03 }}
                    />
                  )}
                  {idx < active && (
                    <div className="h-full bg-white/20 w-full" />
                  )}
                </div>

                <span
                  className={`block text-[10px] md:text-[11px] tracking-[0.15em] uppercase font-medium transition-all duration-500 ${
                    isActive
                      ? "text-white"
                      : "text-white/30 group-hover:text-white/50"
                  }`}
                >
                  {slide.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}