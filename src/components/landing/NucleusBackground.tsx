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

const PARTICLE_COUNT_DESKTOP = 2400;
const PARTICLE_COUNT_MOBILE = 800;
const NUCLEUS_RADIUS_RATIO = 0.38;

function createParticles(count: number, w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  const cx = w * 0.5;
  const cy = h * 0.5;
  const nR = Math.min(w, h) * NUCLEUS_RADIUS_RATIO;

  for (let i = 0; i < count; i++) {
    const isSpark = Math.random() < 0.08;
    // 85% of particles inside the sphere, 15% outside
    const inside = Math.random() < 0.85;
    const orbitR = inside
      ? nR * (0.05 + Math.random() * 0.85) // inside sphere
      : nR * (1.0 + Math.random() * 1.2);  // outside halo
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: cx + Math.cos(angle) * orbitR,
      y: cy + Math.sin(angle) * orbitR,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      radius: isSpark ? 1.2 + Math.random() * 2.5 : 0.3 + Math.random() * 1.0,
      alpha: 0,
      baseAlpha: isSpark ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.5,
      orbitR,
      baseOrbitR: orbitR,
      orbitSpeed: (0.05 + Math.random() * 0.15) * (Math.random() > 0.5 ? 1 : -1),
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

      // === OUTER GLOW (soft halo beyond sphere) ===
      const outerGlow = ctx.createRadialGradient(cx, cy, effectiveR * 0.8, cx, cy, effectiveR * 2.0);
      outerGlow.addColorStop(0, "rgba(230, 170, 140, 0.15)");
      outerGlow.addColorStop(0.4, "rgba(220, 155, 120, 0.06)");
      outerGlow.addColorStop(0.7, "rgba(200, 140, 110, 0.02)");
      outerGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR * 2.0, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // === SOLID SPHERE BODY — opaque, peach/coral fill ===
      // Base solid fill
      const bodyGrad = ctx.createRadialGradient(
        cx - effectiveR * 0.2, cy - effectiveR * 0.25, effectiveR * 0.1,
        cx + effectiveR * 0.05, cy + effectiveR * 0.1, effectiveR
      );
      bodyGrad.addColorStop(0, "rgba(245, 200, 170, 0.95)");  // bright top-left
      bodyGrad.addColorStop(0.25, "rgba(235, 175, 145, 0.92)");
      bodyGrad.addColorStop(0.5, "rgba(220, 155, 125, 0.88)");
      bodyGrad.addColorStop(0.75, "rgba(200, 135, 110, 0.85)");
      bodyGrad.addColorStop(0.95, "rgba(190, 120, 100, 0.80)");
      bodyGrad.addColorStop(1, "rgba(180, 110, 90, 0.70)");
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // === 3D SHADING — darker bottom-right for depth ===
      const shadowGrad = ctx.createRadialGradient(
        cx + effectiveR * 0.3, cy + effectiveR * 0.35, 0,
        cx, cy, effectiveR
      );
      shadowGrad.addColorStop(0, "rgba(140, 70, 55, 0.35)");
      shadowGrad.addColorStop(0.5, "rgba(160, 90, 70, 0.15)");
      shadowGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();

      // === TOP-LEFT HIGHLIGHT (specular) ===
      ctx.save();
      const specX = cx - effectiveR * 0.3;
      const specY = cy - effectiveR * 0.35;
      const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, effectiveR * 0.6);
      specGrad.addColorStop(0, "rgba(255, 240, 230, 0.50)");
      specGrad.addColorStop(0.3, "rgba(250, 220, 200, 0.25)");
      specGrad.addColorStop(0.6, "rgba(240, 200, 180, 0.08)");
      specGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(specX, specY, effectiveR * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();
      ctx.restore();

      // === MEMBRANE EDGE — thick, bright rim ===
      // Inner edge brightening
      const rimGrad = ctx.createRadialGradient(cx, cy, effectiveR * 0.82, cx, cy, effectiveR * 1.03);
      rimGrad.addColorStop(0, "transparent");
      rimGrad.addColorStop(0.4, "rgba(240, 190, 160, 0.15)");
      rimGrad.addColorStop(0.7, "rgba(235, 180, 155, 0.40)");
      rimGrad.addColorStop(0.88, "rgba(230, 175, 150, 0.55)");
      rimGrad.addColorStop(0.96, "rgba(225, 170, 145, 0.35)");
      rimGrad.addColorStop(1, "rgba(220, 160, 135, 0.08)");
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR * 1.03, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // Crisp membrane stroke
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(230, 185, 155, ${0.45 + Math.sin(time * behavior.breathSpeed * 0.5) * 0.1})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Subtle outer rim glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveR * 1.01, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(240, 200, 170, 0.15)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // === HIGHLIGHT ARC — rotating per section ===
      ctx.save();
      ctx.globalAlpha = 0.4;
      const hlAngle = -0.8 + sp * 0.6;
      const hlX = cx + Math.cos(hlAngle) * effectiveR * 0.3;
      const hlY = cy + Math.sin(hlAngle) * effectiveR * 0.3;
      const highlightGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, effectiveR * 0.45);
      highlightGrad.addColorStop(0, "rgba(255, 245, 235, 0.5)");
      highlightGrad.addColorStop(0.35, "rgba(250, 225, 200, 0.2)");
      highlightGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(hlX, hlY, effectiveR * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = highlightGrad;
      ctx.fill();
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
            const trailAlpha = p.alpha * (1 - t / p.trail.length) * 0.25;
            ctx.beginPath();
            ctx.arc(p.trail[t].x, p.trail[t].y, p.radius * (1 - t * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = p.isSpark
              ? `rgba(255, 240, 220, ${trailAlpha})`
              : `rgba(180, 90, 70, ${trailAlpha})`;
            ctx.fill();
          }
        }

        const distFromCenter = Math.hypot(p.x - cx, p.y - cy) / effectiveR;
        const isInside = distFromCenter < 1.0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.isSpark) {
          // Bright sparkles — white/gold
          ctx.fillStyle = `rgba(255, 245, 225, ${p.alpha})`;
          ctx.shadowColor = "rgba(255, 220, 180, 0.6)";
          ctx.shadowBlur = 8;
        } else if (isInside) {
          // Inside particles — deep coral/crimson (like the reference dense core)
          const depth = 1 - distFromCenter;
          const r = Math.round(160 + depth * 40);
          const g = Math.round(60 + depth * 30);
          const b = Math.round(50 + depth * 20);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.9})`;
          ctx.shadowBlur = 0;
        } else {
          // Outside particles — warm golden
          ctx.fillStyle = `rgba(230, 190, 150, ${p.alpha * 0.6})`;
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
