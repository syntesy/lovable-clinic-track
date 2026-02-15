import { useRef, useEffect } from "react";

interface Props {
  nucleusX: number; // 0-1 proportion of screen
  nucleusY: number; // 0-1 proportion of screen
  scrollProgress?: number; // 0-1 overall scroll
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
  baseOrbitR: number;
  orbitSpeed: number;
  orbitPhase: number;
  trail: { x: number; y: number }[];
  isSpark: boolean;
}

const PARTICLE_COUNT_DESKTOP = 900;
const PARTICLE_COUNT_MOBILE = 400;
const NUCLEUS_RADIUS_RATIO = 0.38;

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
      baseOrbitR: orbitR,
      orbitSpeed: (0.08 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1),
      orbitPhase: angle,
      trail: [],
      isSpark,
    });
  }
  return particles;
}

// Per-section behavior profiles
function getSectionBehavior(sp: number) {
  // Section 0: Hero — full size, calm
  if (sp < 0.15) return { scaleMul: 1.0, breathSpeed: 0.3, breathAmp: 0.03, driftAmpX: 0.008, driftAmpY: 0.012, driftFreqX: 0.15, driftFreqY: 0.1, orbitMul: 1.0, dustSpeed: 0.02, glowPulse: 0.08 };
  // Section 1: Como funciona — slightly smaller (some text)
  if (sp < 0.35) return { scaleMul: 0.82, breathSpeed: 0.5, breathAmp: 0.05, driftAmpX: 0.015, driftAmpY: 0.008, driftFreqX: 0.25, driftFreqY: 0.18, orbitMul: 1.15, dustSpeed: 0.04, glowPulse: 0.12 };
  // Section 2: Métricas — smaller (lots of cards/text)
  if (sp < 0.55) return { scaleMul: 0.6, breathSpeed: 0.8, breathAmp: 0.04, driftAmpX: 0.006, driftAmpY: 0.006, driftFreqX: 0.35, driftFreqY: 0.4, orbitMul: 0.85, dustSpeed: 0.06, glowPulse: 0.18 };
  // Section 3: SCORE — medium (split layout)
  if (sp < 0.8) return { scaleMul: 0.7, breathSpeed: 0.4, breathAmp: 0.06, driftAmpX: 0.02, driftAmpY: 0.005, driftFreqX: 0.12, driftFreqY: 0.08, orbitMul: 1.1, dustSpeed: 0.03, glowPulse: 0.10 };
  // Section 4: CTA — compact
  return { scaleMul: 0.65, breathSpeed: 0.25, breathAmp: 0.035, driftAmpX: 0.01, driftAmpY: 0.01, driftFreqX: 0.1, driftFreqY: 0.12, orbitMul: 1.0, dustSpeed: 0.025, glowPulse: 0.06 };
}

export default function NucleusBackground({ nucleusX, nucleusY, scrollProgress = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const currentCenter = useRef({ x: 0.5, y: 0.78 });
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const initializedRef = useRef(false);
  // Store latest props in refs for the animation loop
  const propsRef = useRef({ nucleusX, nucleusY, scrollProgress });
  propsRef.current = { nucleusX, nucleusY, scrollProgress };

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
        currentCenter.current = { x: propsRef.current.nucleusX, y: propsRef.current.nucleusY };
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

      const { nucleusX: nx, nucleusY: ny, scrollProgress: sp } = propsRef.current;
      const behavior = getSectionBehavior(sp);

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Organic drift — unique sine waves that vary by section
      const driftX = Math.sin(time * behavior.driftFreqX) * behavior.driftAmpX
                    + Math.sin(time * behavior.driftFreqX * 1.7 + 2.1) * behavior.driftAmpX * 0.4;
      const driftY = Math.cos(time * behavior.driftFreqY + 0.5) * behavior.driftAmpY
                    + Math.cos(time * behavior.driftFreqY * 2.3 + 1.3) * behavior.driftAmpY * 0.3;

      const targetX = nx + driftX;
      const targetY = ny + driftY;

      // Framerate-independent smooth follow (exponential decay)
      const followFactor = 1 - Math.pow(0.04, dt); // ~0.04^dt gives smooth ~96% retention per second
      currentCenter.current.x += (targetX - currentCenter.current.x) * followFactor;
      currentCenter.current.y += (targetY - currentCenter.current.y) * followFactor;

      const cx = currentCenter.current.x * w;
      const cy = currentCenter.current.y * h;
      const nR = Math.min(w, h) * NUCLEUS_RADIUS_RATIO;

      // Smooth scale transition between sections
      const currentScaleRef = currentCenter.current as any;
      if (currentScaleRef._scale === undefined) currentScaleRef._scale = 1;
      currentScaleRef._scale += (behavior.scaleMul - currentScaleRef._scale) * followFactor * 0.5;
      const sectionScale = currentScaleRef._scale;

      // Breathing scale per section
      const breathScale = 1 + Math.sin(time * behavior.breathSpeed) * behavior.breathAmp;
      const effectiveR = nR * breathScale * sectionScale;

      ctx.clearRect(0, 0, w, h);

      // === NUCLEUS CORE (REGHEN orange palette: #A06F4C → rgb(160,111,76)) ===

      // Outer glow — warm orange
      const glowAlpha = 0.08 + Math.sin(time * behavior.breathSpeed * 0.7) * behavior.glowPulse;
      const outerGlow = ctx.createRadialGradient(cx, cy, effectiveR * 0.3, cx, cy, effectiveR * 3.5);
      outerGlow.addColorStop(0, `rgba(180, 120, 70, ${glowAlpha})`);
      outerGlow.addColorStop(0.3, "rgba(160, 111, 76, 0.04)");
      outerGlow.addColorStop(0.6, "rgba(140, 100, 65, 0.02)");
      outerGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Mid glow — warm amber
      const midGlow = ctx.createRadialGradient(cx, cy, effectiveR * 0.1, cx, cy, effectiveR * 1.8);
      midGlow.addColorStop(0, "rgba(190, 125, 65, 0.20)");
      midGlow.addColorStop(0.4, "rgba(170, 110, 70, 0.12)");
      midGlow.addColorStop(0.7, "rgba(160, 111, 76, 0.05)");
      midGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = midGlow;
      ctx.fill();

      // Inner core — REGHEN orange center
      const coreGrad = ctx.createRadialGradient(cx - effectiveR * 0.1, cy - effectiveR * 0.1, 0, cx, cy, effectiveR);
      coreGrad.addColorStop(0, "rgba(200, 140, 80, 0.55)");
      coreGrad.addColorStop(0.25, "rgba(180, 120, 70, 0.40)");
      coreGrad.addColorStop(0.5, "rgba(160, 111, 76, 0.25)");
      coreGrad.addColorStop(0.75, "rgba(140, 95, 60, 0.12)");
      coreGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Highlight — rotates slightly per section
      ctx.save();
      ctx.globalAlpha = 0.25;
      const hlAngle = -0.8 + sp * 0.6; // highlight shifts as you scroll
      const hlX = cx + Math.cos(hlAngle) * effectiveR * 0.4;
      const hlY = cy + Math.sin(hlAngle) * effectiveR * 0.4;
      const highlightGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, effectiveR * 0.6);
      highlightGrad.addColorStop(0, "rgba(200, 240, 255, 0.5)");
      highlightGrad.addColorStop(0.5, "rgba(150, 220, 240, 0.15)");
      highlightGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(hlX, hlY, effectiveR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = highlightGrad;
      ctx.fill();
      ctx.restore();

      // Inner dust — speed varies by section
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + time * behavior.dustSpeed + i * 0.7;
        const dist = effectiveR * (0.15 + Math.sin(time * 0.3 + i * 1.2) * 0.25);
        const dx = cx + Math.cos(angle) * dist;
        const dy = cy + Math.sin(angle) * dist;
        const dustR = 0.8 + Math.sin(time + i) * 0.4;
        ctx.beginPath();
        ctx.arc(dx, dy, dustR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 170, 120, ${0.3 + Math.sin(time * 0.5 + i) * 0.15})`;
        ctx.fill();
      }
      ctx.restore();

      // === PARTICLES ===
      const particles = particlesRef.current;
      const orbitMul = behavior.orbitMul;

      particles.forEach((p) => {
        // Adjust orbit radius by section behavior
        p.orbitR += (p.baseOrbitR * orbitMul - p.orbitR) * 0.01;

        p.orbitPhase += p.orbitSpeed * dt;
        const targetPX = cx + Math.cos(p.orbitPhase) * p.orbitR;
        const targetPY = cy + Math.sin(p.orbitPhase) * p.orbitR;

        p.x += (targetPX - p.x) * 0.02 + p.vx;
        p.y += (targetPY - p.y) * 0.02 + p.vy;

        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.alpha = p.baseAlpha * (0.6 + Math.sin(time * 1.5 + p.orbitPhase * 3) * 0.4);

        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 3) p.trail.pop();

        // Draw trail
        if (p.trail.length > 1) {
          for (let t = 1; t < p.trail.length; t++) {
            const trailAlpha = p.alpha * (1 - t / p.trail.length) * 0.3;
            ctx.beginPath();
            ctx.arc(p.trail[t].x, p.trail[t].y, p.radius * (1 - t * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = p.isSpark
              ? `rgba(240, 220, 180, ${trailAlpha})`
              : `rgba(180, 130, 80, ${trailAlpha})`;
            ctx.fill();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.isSpark) {
          ctx.fillStyle = `rgba(255, 230, 180, ${p.alpha})`;
          ctx.shadowColor = "rgba(200, 160, 100, 0.5)";
          ctx.shadowBlur = 6;
        } else {
          const distFromCenter = Math.hypot(p.x - cx, p.y - cy) / effectiveR;
          if (distFromCenter < 1.2) {
            ctx.fillStyle = `rgba(200, 140, 80, ${p.alpha})`;
          } else {
            ctx.fillStyle = `rgba(160, 111, 76, ${p.alpha * 0.7})`;
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
  }, []); // stable effect — reads props via ref

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
