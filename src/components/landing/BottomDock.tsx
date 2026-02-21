import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Gauge, LineChart, SlidersHorizontal, BookOpen, ShieldCheck } from "lucide-react";

const dockItems = [
  { id: "problema", label: "Problema", icon: LayoutGrid },
  { id: "estrutura-clinica", label: "Estrutura Clínica", icon: SlidersHorizontal },
  { id: "score", label: "SCORE", icon: Gauge },
  { id: "follow-up", label: "Follow-up", icon: LineChart },
  { id: "resultados", label: "Resultados", icon: LineChart },
  { id: "evidencia", label: "Evidência", icon: BookOpen },
  { id: "seguranca", label: "Segurança", icon: ShieldCheck },
  { id: "academy", label: "Academy", icon: BookOpen },
];

const SCROLL_OFFSET = 100;

export default function BottomDock() {
  const [activeId, setActiveId] = useState<string>("");

  // Scrollspy via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visibleSections = new Map<string, number>();

    dockItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.set(item.id, entry.intersectionRatio);
            } else {
              visibleSections.delete(item.id);
            }

            // Pick the section with highest ratio
            let best = "";
            let bestRatio = 0;
            visibleSections.forEach((ratio, id) => {
              if (ratio > bestRatio) {
                bestRatio = ratio;
                best = id;
              }
            });
            if (best) setActiveId(best);
          });
        },
        { threshold: [0, 0.2, 0.4, 0.6], rootMargin: "-80px 0px -30% 0px" }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 pointer-events-none"
    >
      <nav
        className="pointer-events-auto flex items-center gap-1 px-3 py-2.5 rounded-2xl border border-white/[0.08] bg-[#080b14]/80 backdrop-blur-2xl shadow-[0_-4px_40px_-10px_rgba(0,0,0,0.6)]"
        style={{ maxWidth: "1000px" }}
      >
        {/* Desktop: show all labels */}
        <div className="hidden sm:flex items-center gap-1">
          {dockItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-500 ${
                  isActive
                    ? "text-primary bg-primary/[0.08] shadow-[0_0_20px_-5px] shadow-primary/30"
                    : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                <item.icon className={`w-4 h-4 transition-colors duration-500 ${isActive ? "text-primary" : "text-white/35"}`} strokeWidth={1.5} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="dock-active"
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile: scrollable row */}
        <div className="flex sm:hidden items-center gap-1 overflow-x-auto no-scrollbar">
          {dockItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-500 ${
                  isActive
                    ? "text-primary bg-primary/[0.08]"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-white/35"}`} strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}
