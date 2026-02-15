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

      const R = effectiveR;

      // Helper: draw organic (wobbly) circle path
      const drawOrganicCircle = (x: number, y: number, r: number, wobbleAmt: number, segments: number, seed: number) => {
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          const wobble = 1 + Math.sin(a * 3 + seed + time * 0.15) * wobbleAmt
                           + Math.sin(a * 5 + seed * 2.3 + time * 0.1) * wobbleAmt * 0.5
                           + Math.sin(a * 7 + seed * 0.7 + time * 0.08) * wobbleAmt * 0.3;
          const px = x + Math.cos(a) * r * wobble;
          const py = y + Math.sin(a) * r * wobble;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      };

      // === CYTOPLASM GLOW (faint halo around the cell) ===
      const cytoGlow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.8);
      cytoGlow.addColorStop(0, "rgba(220, 170, 140, 0.08)");
      cytoGlow.addColorStop(0.5, "rgba(200, 150, 120, 0.03)");
      cytoGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = cytoGlow;
      ctx.fill();

      // === NUCLEAR ENVELOPE (double membrane, organic shape) ===
      ctx.save();

      // Outer membrane — semi-transparent, organic shape
      drawOrganicCircle(cx, cy, R * 1.02, 0.025, 80, 1.0);
      ctx.strokeStyle = `rgba(180, 120, 90, ${0.35 + Math.sin(time * 0.3) * 0.08})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner membrane — slightly smaller
      drawOrganicCircle(cx, cy, R * 0.97, 0.02, 80, 2.5);
      ctx.strokeStyle = `rgba(170, 115, 85, ${0.25 + Math.sin(time * 0.25 + 1) * 0.06})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // === NUCLEOPLASM (translucent interior fill) ===
      ctx.save();
      drawOrganicCircle(cx, cy, R, 0.025, 80, 1.0);
      ctx.clip();

      // Base nucleoplasm — translucent warm tone
      const nucleoplasmGrad = ctx.createRadialGradient(
        cx - R * 0.15, cy - R * 0.1, R * 0.05,
        cx, cy, R
      );
      nucleoplasmGrad.addColorStop(0, "rgba(235, 190, 160, 0.55)");
      nucleoplasmGrad.addColorStop(0.3, "rgba(220, 170, 140, 0.45)");
      nucleoplasmGrad.addColorStop(0.6, "rgba(200, 145, 115, 0.35)");
      nucleoplasmGrad.addColorStop(0.85, "rgba(185, 130, 100, 0.30)");
      nucleoplasmGrad.addColorStop(1, "rgba(170, 115, 85, 0.25)");
      ctx.fillStyle = nucleoplasmGrad;
      ctx.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);

      // === CHROMATIN NETWORK (fibrous, web-like structures) ===
      ctx.globalAlpha = 0.3;
      // Draw chromatin fibers — curved lines inside the nucleus
      for (let i = 0; i < 18; i++) {
        const startAngle = (i / 18) * Math.PI * 2 + time * 0.005;
        const startR = R * (0.15 + Math.random() * 0.5);
        const sx = cx + Math.cos(startAngle) * startR;
        const sy = cy + Math.sin(startAngle) * startR;

        const endAngle = startAngle + 0.8 + Math.sin(i * 2.7) * 1.5;
        const endR = R * (0.2 + Math.sin(i * 1.3 + time * 0.02) * 0.35);
        const ex = cx + Math.cos(endAngle) * endR;
        const ey = cy + Math.sin(endAngle) * endR;

        const cpAngle = (startAngle + endAngle) / 2 + Math.sin(i * 0.9) * 0.5;
        const cpR = R * (0.3 + Math.sin(i * 1.7 + time * 0.03) * 0.25);
        const cpx = cx + Math.cos(cpAngle) * cpR;
        const cpy = cy + Math.sin(cpAngle) * cpR;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        const fiberAlpha = 0.12 + Math.sin(time * 0.2 + i * 1.1) * 0.06;
        ctx.strokeStyle = `rgba(160, 85, 65, ${fiberAlpha})`;
        ctx.lineWidth = 1 + Math.sin(i * 0.8) * 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // === HETEROCHROMATIN CLUSTERS (dark dense patches) ===
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + i * 0.4 + time * 0.008;
        const dist = R * (0.25 + Math.sin(i * 2.1 + time * 0.015) * 0.25);
        const hx = cx + Math.cos(angle) * dist;
        const hy = cy + Math.sin(angle) * dist;
        const hr = R * (0.06 + Math.sin(i * 1.5) * 0.04);

        const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        hGrad.addColorStop(0, `rgba(140, 70, 50, ${0.35 + Math.sin(time * 0.3 + i) * 0.1})`);
        hGrad.addColorStop(0.6, `rgba(150, 80, 60, ${0.15 + Math.sin(time * 0.2 + i * 2) * 0.05})`);
        hGrad.addColorStop(1, "transparent");

        drawOrganicCircle(hx, hy, hr, 0.15, 20, i * 3.7);
        ctx.fillStyle = hGrad;
        ctx.fill();
      }

      // === NUCLEOLUS (dense, darker organelle inside the nucleus) ===
      const nuclX = cx + Math.sin(time * 0.05) * R * 0.08;
      const nuclY = cy + Math.cos(time * 0.04 + 0.5) * R * 0.06;
      const nuclR = R * 0.18;

      // Nucleolus body
      drawOrganicCircle(nuclX, nuclY, nuclR, 0.08, 40, 5.5);
      const nuclGrad = ctx.createRadialGradient(
        nuclX - nuclR * 0.15, nuclY - nuclR * 0.15, 0,
        nuclX, nuclY, nuclR
      );
      nuclGrad.addColorStop(0, "rgba(180, 100, 70, 0.70)");
      nuclGrad.addColorStop(0.4, "rgba(160, 85, 60, 0.55)");
      nuclGrad.addColorStop(0.75, "rgba(145, 75, 55, 0.40)");
      nuclGrad.addColorStop(1, "rgba(130, 65, 50, 0.20)");
      ctx.fillStyle = nuclGrad;
      ctx.fill();

      // Nucleolus membrane
      drawOrganicCircle(nuclX, nuclY, nuclR, 0.08, 40, 5.5);
      ctx.strokeStyle = `rgba(150, 80, 55, ${0.4 + Math.sin(time * 0.3) * 0.1})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Nucleolus highlight
      const nuclHL = ctx.createRadialGradient(
        nuclX - nuclR * 0.3, nuclY - nuclR * 0.3, 0,
        nuclX - nuclR * 0.2, nuclY - nuclR * 0.2, nuclR * 0.4
      );
      nuclHL.addColorStop(0, "rgba(240, 210, 180, 0.35)");
      nuclHL.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(nuclX - nuclR * 0.2, nuclY - nuclR * 0.25, nuclR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = nuclHL;
      ctx.fill();

      // === NUCLEAR PORES (small dots on the membrane) ===
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + time * 0.01;
        const wobble = 1 + Math.sin(a * 3 + 1.0 + time * 0.15) * 0.025;
        const px = cx + Math.cos(a) * R * wobble;
        const py = cy + Math.sin(a) * R * wobble;
        const poreR = 1.5 + Math.sin(i * 2.3 + time * 0.2) * 0.5;
        ctx.beginPath();
        ctx.arc(px, py, poreR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140, 90, 65, ${0.4 + Math.sin(time * 0.4 + i) * 0.15})`;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // === SPECULAR HIGHLIGHT (top-left, subtle) ===
      const specX = cx - R * 0.28;
      const specY = cy - R * 0.32;
      const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, R * 0.5);
      specGrad.addColorStop(0, "rgba(255, 240, 225, 0.30)");
      specGrad.addColorStop(0.3, "rgba(245, 220, 200, 0.12)");
      specGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(specX, specY, R * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();

      ctx.restore(); // release clip

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
