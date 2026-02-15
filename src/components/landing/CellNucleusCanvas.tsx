import { useRef, useEffect, useCallback } from "react";

interface Props {
  className?: string;
  /** 0-1 scroll progress that drives sphere position */
  scrollProgress?: number;
}

export default function CellNucleusCanvas({ className = "", scrollProgress = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrame = useRef(0);
  const mouse = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(scrollProgress);

  // Keep scroll in sync without re-running effect
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouse.current = { x: -1000, y: -1000 };
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    // Corona particles
    const PARTICLE_COUNT = 500;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 1.2,
      size: 0.4 + Math.random() * 2.2,
      opacity: 0.2 + Math.random() * 0.7,
      life: Math.random(),
      maxLife: 0.5 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.25,
      layer: Math.random(), // 0=close, 1=far
    }));

    let time = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.006;

      const sp = scrollRef.current;
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const mouseActive = mx > 0 && my > 0;

      // ═══ Scroll-driven sphere position & size ═══
      // Phase 0 (0-0.15): Hero — sphere at bottom center, large
      // Phase 1 (0.15-0.4): Sphere rises and shrinks to right side
      // Phase 2 (0.4-0.7): Sphere small, floating right
      // Phase 3 (0.7-1.0): Sphere fades and drifts off

      const baseR = Math.min(w, h) * 0.38;

      let sphereX: number, sphereY: number, sphereR: number, sphereAlpha: number;

      if (sp < 0.15) {
        // Hero state
        const t = sp / 0.15;
        sphereX = w / 2;
        sphereY = lerp(h * 0.88, h * 0.75, easeOut(t));
        sphereR = lerp(baseR, baseR * 0.9, t);
        sphereAlpha = 1;
      } else if (sp < 0.4) {
        // Transition: rise and move right, shrink
        const t = easeOut((sp - 0.15) / 0.25);
        sphereX = lerp(w / 2, w * 0.78, t);
        sphereY = lerp(h * 0.75, h * 0.45, t);
        sphereR = lerp(baseR * 0.9, baseR * 0.45, t);
        sphereAlpha = 1;
      } else if (sp < 0.7) {
        // Floating right, gentle movement
        const t = (sp - 0.4) / 0.3;
        sphereX = w * 0.78 + Math.sin(time * 0.5) * 15;
        sphereY = lerp(h * 0.45, h * 0.55, t) + Math.cos(time * 0.4) * 10;
        sphereR = lerp(baseR * 0.45, baseR * 0.35, t);
        sphereAlpha = 1;
      } else {
        // Fade out
        const t = easeOut((sp - 0.7) / 0.3);
        sphereX = lerp(w * 0.78, w * 0.9, t);
        sphereY = lerp(h * 0.55, h * 0.4, t);
        sphereR = lerp(baseR * 0.35, baseR * 0.2, t);
        sphereAlpha = Math.max(0, 1 - t * 1.5);
      }

      // Mouse subtle influence
      if (mouseActive) {
        sphereX += (mx - w / 2) * 0.012;
        sphereY += (my - h / 2) * 0.008;
      }

      if (sphereAlpha <= 0) {
        animFrame.current = requestAnimationFrame(draw);
        return;
      }

      // ═══ Atmospheric glow ═══
      const outerGlow = ctx.createRadialGradient(sphereX, sphereY, sphereR * 0.3, sphereX, sphereY, sphereR * 3.5);
      outerGlow.addColorStop(0, `hsla(13, 74%, 55%, ${0.07 * sphereAlpha})`);
      outerGlow.addColorStop(0.4, `hsla(20, 80%, 60%, ${0.03 * sphereAlpha})`);
      outerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, w, h);

      // ═══ Corona particles ═══
      for (const p of particles) {
        p.life += p.speed * 0.003;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.angle = Math.random() * Math.PI * 2;
          p.speed = 0.15 + Math.random() * 1.2;
          p.size = 0.4 + Math.random() * 2.2;
          p.opacity = 0.2 + Math.random() * 0.7;
          p.drift = (Math.random() - 0.5) * 0.25;
        }

        const progress = p.life / p.maxLife;
        const dist = sphereR * (0.88 + progress * 0.7);
        const fadeIn = Math.min(progress * 4, 1);
        const fadeOut = 1 - Math.pow(progress, 1.8);
        const alpha = p.opacity * fadeIn * fadeOut * sphereAlpha;

        if (alpha < 0.01) continue;

        const wobble = Math.sin(time * 2.5 + p.angle * 4) * 6 * (1 + p.layer * 0.5);
        const px = sphereX + Math.cos(p.angle + p.drift * progress) * (dist + wobble);
        const py = sphereY + Math.sin(p.angle + p.drift * progress) * (dist + wobble);

        if (py > h + 20 || px < -20 || px > w + 20 || py < -20) continue;

        // Glow halo
        const glowR = p.size * (3 + p.layer * 2);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        glow.addColorStop(0, `hsla(25, 90%, 80%, ${alpha * 0.4})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2);

        // Core
        ctx.beginPath();
        ctx.arc(px, py, p.size * (0.4 + fadeIn * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(30, 95%, 92%, ${alpha})`;
        ctx.fill();
      }

      // ═══ Main sphere ═══
      const grad = ctx.createRadialGradient(
        sphereX - sphereR * 0.15,
        sphereY - sphereR * 0.2,
        sphereR * 0.05,
        sphereX,
        sphereY,
        sphereR
      );
      grad.addColorStop(0, `hsla(20, 85%, 78%, ${0.95 * sphereAlpha})`);
      grad.addColorStop(0.25, `hsla(13, 74%, 65%, ${0.85 * sphereAlpha})`);
      grad.addColorStop(0.55, `hsla(13, 74%, 55%, ${0.75 * sphereAlpha})`);
      grad.addColorStop(0.8, `hsla(10, 70%, 45%, ${0.6 * sphereAlpha})`);
      grad.addColorStop(1, `hsla(8, 65%, 35%, ${0.25 * sphereAlpha})`);

      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner light reflection
      const reflect = ctx.createRadialGradient(
        sphereX - sphereR * 0.25, sphereY - sphereR * 0.3, 0,
        sphereX - sphereR * 0.1, sphereY - sphereR * 0.15, sphereR * 0.6
      );
      reflect.addColorStop(0, `hsla(30, 100%, 95%, ${0.4 * sphereAlpha})`);
      reflect.addColorStop(0.5, `hsla(25, 90%, 85%, ${0.1 * sphereAlpha})`);
      reflect.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fillStyle = reflect;
      ctx.fill();

      // Rim glow
      const rim = ctx.createRadialGradient(sphereX, sphereY, sphereR * 0.82, sphereX, sphereY, sphereR * 1.12);
      rim.addColorStop(0, "transparent");
      rim.addColorStop(0.5, `hsla(25, 90%, 75%, ${(0.18 + Math.sin(time * 1.5) * 0.05) * sphereAlpha})`);
      rim.addColorStop(0.8, `hsla(30, 95%, 85%, ${(0.12 + Math.sin(time) * 0.04) * sphereAlpha})`);
      rim.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR * 1.12, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // Surface swirls
      for (let i = 0; i < 4; i++) {
        const swAngle = time * 0.25 + (i * Math.PI * 2) / 4;
        const swX = sphereX + Math.cos(swAngle) * sphereR * 0.25;
        const swY = sphereY + Math.sin(swAngle) * sphereR * 0.25;
        const swG = ctx.createRadialGradient(swX, swY, 0, swX, swY, sphereR * 0.35);
        swG.addColorStop(0, `hsla(15, 80%, 70%, ${(0.05 + Math.sin(time + i) * 0.02) * sphereAlpha})`);
        swG.addColorStop(1, "transparent");
        ctx.save();
        ctx.beginPath();
        ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = swG;
        ctx.fillRect(swX - sphereR, swY - sphereR, sphereR * 2, sphereR * 2);
        ctx.restore();
      }

      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
