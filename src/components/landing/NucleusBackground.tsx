import { useRef, useEffect } from "react";

interface Props {
  nucleusX: number; // 0-1 proportion of screen
  nucleusY: number; // 0-1 proportion of screen
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  orbitR: number;
  orbitSpeed: number;
  orbitPhase: number;
  // Trail positions
  trail: { x: number; y: number }[];
  isSpark: boolean;
}

const PARTICLE_COUNT_DESKTOP = 900;
const PARTICLE_COUNT_MOBILE = 400;
const NUCLEUS_RADIUS_RATIO = 0.38; // ratio of min(w,h) — fills ~half screen

function createParticles(count: number, w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  const cx = w * 0.5;
  const cy = h * 0.5;
  const nR = Math.min(w, h) * NUCLEUS_RADIUS_RATIO;

  for (let i = 0; i < count; i++) {
    const isSpark = Math.random() < 0.04;
    const orbitR = nR * (0.3 + Math.random() * 2.5);
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: cx + Math.cos(angle) * orbitR,
      y: cy + Math.sin(angle) * orbitR,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: isSpark ? 1.5 + Math.random() * 2 : 0.4 + Math.random() * 1.2,
      alpha: 0,
      baseAlpha: isSpark ? 0.6 + Math.random() * 0.4 : 0.15 + Math.random() * 0.45,
      orbitR,
      orbitSpeed: (0.08 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1),
      orbitPhase: angle,
      trail: [],
      isSpark,
    });
  }
  return particles;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function NucleusBackground({ nucleusX, nucleusY }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const currentCenter = useRef({ x: 0.5, y: 0.78 });
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!initializedRef.current) {
        const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
        particlesRef.current = createParticles(count, w, h);
        currentCenter.current = { x: nucleusX, y: nucleusY };
        initializedRef.current = true;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = performance.now();
    let paused = false;

    const onVisibility = () => { paused = document.hidden; };
    document.addEventListener("visibilitychange", onVisibility);

    const animate = (now: number) => {
      if (paused) { rafRef.current = requestAnimationFrame(animate); return; }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeRef.current += dt;
      const time = timeRef.current;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Smooth follow
      currentCenter.current.x += (nucleusX - currentCenter.current.x) * 0.06;
      currentCenter.current.y += (nucleusY - currentCenter.current.y) * 0.06;

      const cx = currentCenter.current.x * w;
      const cy = currentCenter.current.y * h;
      const nR = Math.min(w, h) * NUCLEUS_RADIUS_RATIO;

      ctx.clearRect(0, 0, w, h);

      // === NUCLEUS CORE — multiple radial gradients ===

      // Outer glow — very soft, large
      const outerGlow = ctx.createRadialGradient(cx, cy, nR * 0.3, cx, cy, nR * 3.5);
      outerGlow.addColorStop(0, "rgba(180, 60, 80, 0.08)");
      outerGlow.addColorStop(0.3, "rgba(120, 200, 230, 0.04)");
      outerGlow.addColorStop(0.6, "rgba(100, 180, 220, 0.02)");
      outerGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, nR * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Mid glow — warm
      const midGlow = ctx.createRadialGradient(cx, cy, nR * 0.1, cx, cy, nR * 1.8);
      midGlow.addColorStop(0, "rgba(200, 50, 70, 0.18)");
      midGlow.addColorStop(0.4, "rgba(180, 50, 80, 0.10)");
      midGlow.addColorStop(0.7, "rgba(120, 200, 230, 0.06)");
      midGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, nR * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = midGlow;
      ctx.fill();

      // Inner core — dense, bright
      const coreGrad = ctx.createRadialGradient(cx - nR * 0.1, cy - nR * 0.1, 0, cx, cy, nR);
      coreGrad.addColorStop(0, "rgba(220, 60, 70, 0.50)");
      coreGrad.addColorStop(0.3, "rgba(190, 45, 65, 0.35)");
      coreGrad.addColorStop(0.6, "rgba(150, 40, 60, 0.18)");
      coreGrad.addColorStop(0.85, "rgba(120, 200, 230, 0.08)");
      coreGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, nR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Bright edge highlight — top-left arc
      ctx.save();
      ctx.globalAlpha = 0.25;
      const highlightGrad = ctx.createRadialGradient(
        cx - nR * 0.4, cy - nR * 0.4, 0,
        cx - nR * 0.3, cy - nR * 0.3, nR * 0.6
      );
      highlightGrad.addColorStop(0, "rgba(200, 240, 255, 0.5)");
      highlightGrad.addColorStop(0.5, "rgba(150, 220, 240, 0.15)");
      highlightGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx - nR * 0.3, cy - nR * 0.35, nR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = highlightGrad;
      ctx.fill();
      ctx.restore();

      // Inner "dust" — small points inside the core
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + time * 0.02 + i * 0.7;
        const dist = nR * (0.15 + Math.sin(time * 0.3 + i * 1.2) * 0.25);
        const dx = cx + Math.cos(angle) * dist;
        const dy = cy + Math.sin(angle) * dist;
        const dustR = 0.8 + Math.sin(time + i) * 0.4;
        ctx.beginPath();
        ctx.arc(dx, dy, dustR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 180, 200, ${0.3 + Math.sin(time * 0.5 + i) * 0.15})`;
        ctx.fill();
      }
      ctx.restore();

      // === PARTICLES ===
      const particles = particlesRef.current;
      particles.forEach((p) => {
        // Update orbit
        p.orbitPhase += p.orbitSpeed * dt;
        const targetX = cx + Math.cos(p.orbitPhase) * p.orbitR;
        const targetY = cy + Math.sin(p.orbitPhase) * p.orbitR;

        p.x += (targetX - p.x) * 0.02 + p.vx;
        p.y += (targetY - p.y) * 0.02 + p.vy;

        // Gentle dispersion
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Flicker
        p.alpha = p.baseAlpha * (0.6 + Math.sin(time * 1.5 + p.orbitPhase * 3) * 0.4);

        // Trail
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 3) p.trail.pop();

        // Draw trail
        if (p.trail.length > 1) {
          for (let t = 1; t < p.trail.length; t++) {
            const trailAlpha = p.alpha * (1 - t / p.trail.length) * 0.3;
            ctx.beginPath();
            ctx.arc(p.trail[t].x, p.trail[t].y, p.radius * (1 - t * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = p.isSpark
              ? `rgba(200, 240, 255, ${trailAlpha})`
              : `rgba(180, 80, 100, ${trailAlpha})`;
            ctx.fill();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.isSpark) {
          ctx.fillStyle = `rgba(220, 245, 255, ${p.alpha})`;
          // Spark glow
          ctx.shadowColor = "rgba(180, 230, 255, 0.5)";
          ctx.shadowBlur = 6;
        } else {
          const distFromCenter = Math.hypot(p.x - cx, p.y - cy) / nR;
          if (distFromCenter < 1.2) {
            ctx.fillStyle = `rgba(220, 100, 120, ${p.alpha})`;
          } else {
            ctx.fillStyle = `rgba(140, 210, 235, ${p.alpha * 0.7})`;
          }
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [nucleusX, nucleusY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
