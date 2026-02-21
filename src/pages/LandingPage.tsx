import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logoReghen from "@/assets/logo-reghen.png";

import slideBg01 from "@/assets/slide-bg-01-new.png";
import slideBg02 from "@/assets/slide-bg-02.jpg";
import slideBg03 from "@/assets/slide-bg-03.jpg";
import slideBg04 from "@/assets/slide-bg-04.jpg";
import slideBg05 from "@/assets/slide-bg-05.jpg";
import slideBg06 from "@/assets/slide-bg-06.jpg";

const slides = [
  {
    id: "problema",
    number: "01",
    label: "Problema",
    route: "/problema",
    bg: slideBg01,
    headline: "O cenário atual da Medicina Regenerativa",
    subtitle: "Fragmentação, variabilidade e ausência de padronização comprometem a prática clínica.",
    cta: "Explorar cenário",
  },
  {
    id: "estrutura-clinica",
    number: "02",
    label: "Estrutura Clínica",
    route: "/estrutura-clinica",
    bg: slideBg02,
    headline: "Fluxo clínico estruturado do início ao follow-up",
    subtitle: "O REGHEN organiza cada etapa da prática clínica com método e rastreabilidade.",
    cta: "Ver estrutura",
  },
  {
    id: "score",
    number: "03",
    label: "SCORE",
    route: "/score",
    bg: slideBg03,
    headline: "Critérios objetivos baseados em ciência",
    subtitle: "Proteja sua prática com decisões fundamentadas em parâmetros técnicos e biológicos.",
    cta: "Conhecer o SCORE",
  },
  {
    id: "follow-up",
    number: "04",
    label: "Follow-up",
    route: "/follow-up",
    bg: slideBg04,
    headline: "A evolução clínica precisa ser acompanhada",
    subtitle: "Sem acompanhamento longitudinal, não há como consolidar desfechos nem gerar evidência prática.",
    cta: "Ver Follow-up",
  },
  {
    id: "resultados",
    number: "05",
    label: "Resultados",
    route: "/resultados",
    bg: slideBg04,
    headline: "Acompanhe e potencialize seus desfechos",
    subtitle: "Mensuração contínua de resultados clínicos com métricas reais e follow-up estruturado.",
    cta: "Ver resultados",
  },
  {
    id: "evidencia",
    number: "06",
    label: "Evidência",
    route: "/evidencia",
    bg: slideBg05,
    headline: "Ciência atualizada integrada à prática",
    subtitle: "Curadoria de evidências com classificação de nível e aplicabilidade clínica direta.",
    cta: "Explorar evidência",
  },
  {
    id: "seguranca",
    number: "07",
    label: "SEGURANÇA",
    route: "/seguranca",
    bg: slideBg06,
    headline: "Rastreabilidade, auditoria e segurança jurídica",
    subtitle: "Cada registro é versionado, auditável e protegido com integridade criptográfica.",
    cta: "Ver segurança",
  },
  {
    id: "academy",
    number: "08",
    label: "Academy",
    route: "/academy-info",
    bg: slideBg05,
    headline: "Formação integrada à prática clínica",
    subtitle: "Aprender sem aplicar gera informação. Aprender com estrutura gera evolução clínica.",
    cta: "Ver Academy",
  },
];

export default function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
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

  // Auto-advance slides with progress
  useEffect(() => {
    setProgress(0);
    const startTime = Date.now();
    const duration = 6000;
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setActiveIndex((p) => (p + 1) % slides.length);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setActiveIndex((p) => Math.min(p + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setActiveIndex((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const current = slides[activeIndex];

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: "#080b14" }}>
      {/* ═══ BACKGROUND IMAGES (all preloaded, instant switch) ═══ */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className="absolute inset-0 z-0 transition-opacity duration-200"
          style={{ opacity: index === activeIndex ? 1 : 0 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${slide.bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/20 to-transparent" />
        </div>
      ))}

      {/* ═══ HEADER ═══ */}
      <header className="absolute top-0 left-0 right-0 z-30 px-8 md:px-12 h-20 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex-shrink-0">
          <img src={logoReghen} alt="REGHEN" className="h-[84px] w-auto opacity-80 hover:opacity-100 transition-opacity" />
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

      {/* ═══ SLIDE NUMBERS — current left, next right ═══ */}
      <div className="absolute left-8 md:left-12 bottom-24 md:bottom-28 z-20">
        <AnimatePresence mode="wait">
          <motion.span
            key={current.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-[14px] md:text-[16px] font-medium text-white/40 tracking-widest select-none"
          >
            {current.number}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="absolute right-8 md:right-12 bottom-24 md:bottom-28 z-20">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-[14px] md:text-[16px] font-medium text-white/25 tracking-widest select-none"
          >
            {slides[(activeIndex + 1) % slides.length].number}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ═══ CENTER CONTENT ═══ */}
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 md:px-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center max-w-3xl"
          >
            <span className="inline-block text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-primary/70 font-medium mb-4">
              {current.label}
            </span>

            <h1
              className="text-3xl md:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-5"
              style={{ fontWeight: 400 }}
            >
              {current.headline}
            </h1>

            <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              {current.subtitle}
            </p>

            <button
              onClick={() => navigate(current.route)}
              className="px-8 py-3 text-sm font-medium text-white/70 border border-white/15 rounded-lg hover:text-white hover:border-white/30 hover:bg-white/[0.04] transition-all"
            >
              {current.cta}
            </button>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══ BOTTOM DOCK (slider nav — no route change) ═══ */}
      <nav className="absolute bottom-0 left-0 right-0 z-30 px-6 md:px-12 pb-8 md:pb-10">
        <div className="h-px bg-white/[0.08] mb-5" />

        <div className="flex items-start gap-0 overflow-x-auto no-scrollbar">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={slide.id}
                onClick={() => { setActiveIndex(index); setProgress(0); }}
                className="flex-1 min-w-[120px] md:min-w-0 group relative text-left px-2 md:px-3 pt-3 pb-1 transition-all duration-500"
              >
                <div className="absolute top-0 left-2 right-2 md:left-3 md:right-3 h-[2px] overflow-hidden bg-white/[0.06]">
                  {isActive && (
                    <div
                      className="h-full bg-primary origin-left"
                      style={{ transform: `scaleX(${progress})`, transition: 'none' }}
                    />
                  )}
                </div>

                <span
                  className={`block text-[10px] md:text-[11px] tracking-[0.15em] uppercase font-medium transition-all duration-500 ${
                    isActive ? "text-white" : "text-white/30 group-hover:text-white/50"
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
