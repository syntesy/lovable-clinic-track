import { useRef, useEffect } from "react";

interface Props {
  className?: string;
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

    // Soft corona particles — fewer, smaller, subtler
    const PARTICLE_COUNT = 220;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      speed: 0.08 + Math.random() * 0.5,
      size: 0.3 + Math.random() * 1.2,
      opacity: 0.08 + Math.random() * 0.35,
      life: Math.random(),
      maxLife: 0.6 + Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 0.12,
      layer: Math.random(),
    }));

    let time = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.004;

      const sp = scrollRef.current;
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const mouseActive = mx > 0 && my > 0;

      // Scroll-driven position
      const baseR = Math.min(w, h) * 0.32;
      let sphereX: number, sphereY: number, sphereR: number, sphereAlpha: number;

      if (sp < 0.15) {
        const t = sp / 0.15;
        sphereX = w / 2;
        sphereY = lerp(h * 0.85, h * 0.72, easeOut(t));
        sphereR = lerp(baseR, baseR * 0.92, t);
        sphereAlpha = 1;
      } else if (sp < 0.4) {
        const t = easeOut((sp - 0.15) / 0.25);
        sphereX = lerp(w / 2, w * 0.76, t);
        sphereY = lerp(h * 0.72, h * 0.45, t);
        sphereR = lerp(baseR * 0.92, baseR * 0.42, t);
        sphereAlpha = 1;
      } else if (sp < 0.7) {
        const t = (sp - 0.4) / 0.3;
        sphereX = w * 0.76 + Math.sin(time * 0.3) * 8;
        sphereY = lerp(h * 0.45, h * 0.52, t) + Math.cos(time * 0.25) * 6;
        sphereR = lerp(baseR * 0.42, baseR * 0.32, t);
        sphereAlpha = 1;
      } else {
        const t = easeOut((sp - 0.7) / 0.3);
        sphereX = lerp(w * 0.76, w * 0.88, t);
        sphereY = lerp(h * 0.52, h * 0.4, t);
        sphereR = lerp(baseR * 0.32, baseR * 0.18, t);
        sphereAlpha = Math.max(0, 1 - t * 1.5);
      }

      if (mouseActive) {
        sphereX += (mx - w / 2) * 0.008;
        sphereY += (my - h / 2) * 0.005;
      }

      if (sphereAlpha <= 0) {
        animFrame.current = requestAnimationFrame(draw);
        return;
      }

      // ═══ Soft atmospheric glow ═══
      const outerGlow = ctx.createRadialGradient(sphereX, sphereY, sphereR * 0.5, sphereX, sphereY, sphereR * 3);
      outerGlow.addColorStop(0, `hsla(15, 60%, 55%, ${0.04 * sphereAlpha})`);
      outerGlow.addColorStop(0.5, `hsla(20, 50%, 50%, ${0.015 * sphereAlpha})`);
      outerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, w, h);

      // ═══ Soft corona particles ═══
      for (const p of particles) {
        p.life += p.speed * 0.002;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.angle = Math.random() * Math.PI * 2;
          p.speed = 0.08 + Math.random() * 0.5;
          p.size = 0.3 + Math.random() * 1.2;
          p.opacity = 0.08 + Math.random() * 0.35;
          p.drift = (Math.random() - 0.5) * 0.12;
        }

        const progress = p.life / p.maxLife;
        const dist = sphereR * (0.92 + progress * 0.5);
        const fadeIn = Math.min(progress * 5, 1);
        const fadeOut = 1 - Math.pow(progress, 2.5);
        const alpha = p.opacity * fadeIn * fadeOut * sphereAlpha;

        if (alpha < 0.008) continue;

        const wobble = Math.sin(time * 1.5 + p.angle * 3) * 3 * (1 + p.layer * 0.3);
        const px = sphereX + Math.cos(p.angle + p.drift * progress) * (dist + wobble);
        const py = sphereY + Math.sin(p.angle + p.drift * progress) * (dist + wobble);

        if (py > h + 10 || px < -10 || px > w + 10 || py < -10) continue;

        // Tiny soft glow
        const glowR = p.size * (2.5 + p.layer);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        glow.addColorStop(0, `hsla(25, 70%, 82%, ${alpha * 0.25})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2);

        // Tiny core dot
        ctx.beginPath();
        ctx.arc(px, py, p.size * (0.3 + fadeIn * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(28, 80%, 90%, ${alpha * 0.7})`;
        ctx.fill();
      }

      // ═══ Main sphere — smooth multi-layer gradient ═══
      const grad = ctx.createRadialGradient(
        sphereX - sphereR * 0.1,
        sphereY - sphereR * 0.12,
        sphereR * 0.02,
        sphereX,
        sphereY,
        sphereR
      );
      grad.addColorStop(0, `hsla(22, 75%, 80%, ${0.92 * sphereAlpha})`);
      grad.addColorStop(0.2, `hsla(16, 68%, 68%, ${0.85 * sphereAlpha})`);
      grad.addColorStop(0.45, `hsla(13, 65%, 58%, ${0.78 * sphereAlpha})`);
      grad.addColorStop(0.7, `hsla(10, 60%, 48%, ${0.6 * sphereAlpha})`);
      grad.addColorStop(0.9, `hsla(8, 55%, 38%, ${0.35 * sphereAlpha})`);
      grad.addColorStop(1, `hsla(6, 50%, 28%, ${0.12 * sphereAlpha})`);

      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle inner highlight — top-left
      const hl = ctx.createRadialGradient(
        sphereX - sphereR * 0.2, sphereY - sphereR * 0.25, 0,
        sphereX - sphereR * 0.08, sphereY - sphereR * 0.1, sphereR * 0.55
      );
      hl.addColorStop(0, `hsla(30, 90%, 95%, ${0.3 * sphereAlpha})`);
      hl.addColorStop(0.4, `hsla(25, 80%, 88%, ${0.08 * sphereAlpha})`);
      hl.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2);
      ctx.fillStyle = hl;
      ctx.fill();

      // Very soft rim light
      const rim = ctx.createRadialGradient(sphereX, sphereY, sphereR * 0.85, sphereX, sphereY, sphereR * 1.06);
      rim.addColorStop(0, "transparent");
      rim.addColorStop(0.6, `hsla(20, 65%, 72%, ${(0.1 + Math.sin(time * 0.8) * 0.02) * sphereAlpha})`);
      rim.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereR * 1.06, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // Internal organic movement — very subtle
      for (let i = 0; i < 3; i++) {
        const swAngle = time * 0.15 + (i * Math.PI * 2) / 3;
        const swDist = sphereR * (0.15 + Math.sin(time * 0.3 + i * 1.5) * 0.08);
        const swX = sphereX + Math.cos(swAngle) * swDist;
        const swY = sphereY + Math.sin(swAngle) * swDist;
        const swG = ctx.createRadialGradient(swX, swY, 0, swX, swY, sphereR * 0.3);
        swG.addColorStop(0, `hsla(18, 60%, 68%, ${(0.03 + Math.sin(time * 0.5 + i) * 0.01) * sphereAlpha})`);
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
