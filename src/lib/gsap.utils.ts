// =============================================================================
// GSAP Utilities — animações reutilizáveis
//
// Uso:
//   import { fadeIn, staggerIn, scrollReveal, glowPulse } from "@/lib/gsap.utils";
//
// Copie este arquivo para qualquer projeto após: npm install gsap @gsap/react
// =============================================================================

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Target = string | Element | Element[] | NodeListOf<Element>;

// ── Fade In ───────────────────────────────────────────────────────────────────
// Uso: fadeIn(".hero-title")
// Uso: fadeIn(ref.current, { delay: 0.3, y: 40 })

export function fadeIn(
  target: Target,
  options: { delay?: number; duration?: number; y?: number; x?: number } = {}
) {
  const { delay = 0, duration = 0.6, y = 24, x = 0 } = options;

  return gsap.fromTo(
    target,
    { opacity: 0, y, x },
    { opacity: 1, y: 0, x: 0, duration, delay, ease: "power2.out" }
  );
}

// ── Stagger In ────────────────────────────────────────────────────────────────
// Anima uma lista de elementos um após o outro
// Uso: staggerIn(".feature-card")

export function staggerIn(
  target: Target,
  options: { delay?: number; duration?: number; stagger?: number; y?: number } = {}
) {
  const { delay = 0, duration = 0.5, stagger = 0.1, y = 32 } = options;

  return gsap.fromTo(
    target,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      stagger,
      ease: "power2.out",
    }
  );
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────────
// Elemento aparece quando entra na viewport
// Uso: scrollReveal(".section-block")

export function scrollReveal(
  target: Target,
  options: { y?: number; duration?: number; start?: string; stagger?: number } = {}
) {
  const { y = 40, duration = 0.7, start = "top 85%", stagger = 0.12 } = options;

  return gsap.fromTo(
    target,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease: "power3.out",
      scrollTrigger: {
        trigger: typeof target === "string" ? target : (target as Element),
        start,
        once: true,
      },
    }
  );
}

// ── Scale In ──────────────────────────────────────────────────────────────────
// Entrada com escala — bom pra badges, números, ícones
// Uso: scaleIn(".stat-number")

export function scaleIn(
  target: Target,
  options: { delay?: number; duration?: number; from?: number } = {}
) {
  const { delay = 0, duration = 0.5, from = 0.7 } = options;

  return gsap.fromTo(
    target,
    { opacity: 0, scale: from },
    { opacity: 1, scale: 1, duration, delay, ease: "back.out(1.4)" }
  );
}

// ── Glow Pulse ────────────────────────────────────────────────────────────────
// Pulsa o box-shadow infinitamente — bom pra CTAs e destaques
// Uso: glowPulse(".cta-button", "#C8F135")

export function glowPulse(target: Target, color = "#C8F135") {
  return gsap.to(target, {
    boxShadow: `0 0 32px 6px ${color}44`,
    duration: 1.4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

// ── Horizontal Scroll ─────────────────────────────────────────────────────────
// Scroll horizontal de uma seção (carrossel cinematográfico)
// Uso: horizontalScroll(".cards-wrapper", ".card")

export function horizontalScroll(wrapper: string, items: string) {
  const panels = gsap.utils.toArray<Element>(items);

  return gsap.to(panels, {
    xPercent: -100 * (panels.length - 1),
    ease: "none",
    scrollTrigger: {
      trigger: wrapper,
      pin: true,
      scrub: 1,
      snap: 1 / (panels.length - 1),
      end: () => `+=${(panels[0] as HTMLElement).offsetWidth * panels.length}`,
    },
  });
}

// ── Counter Up ────────────────────────────────────────────────────────────────
// Anima um número de 0 até o valor final — bom pra métricas
// Uso: counterUp(".metric-number", 73)

export function counterUp(
  target: string,
  endValue: number,
  options: { duration?: number; prefix?: string; suffix?: string } = {}
) {
  const { duration = 1.5, prefix = "", suffix = "" } = options;
  const el = document.querySelector(target);
  if (!el) return;

  return gsap.to({ val: 0 }, {
    val: endValue,
    duration,
    ease: "power1.out",
    onUpdate: function () {
      el.textContent = `${prefix}${Math.round(this.targets()[0].val)}${suffix}`;
    },
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      once: true,
    },
  });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
// Usar no cleanup do useEffect para evitar memory leaks
// Uso: return () => killScrollTriggers()

export function killScrollTriggers() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
}
