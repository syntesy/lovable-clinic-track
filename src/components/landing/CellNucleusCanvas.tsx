import { useRef, useEffect } from "react";

interface Props {
  className?: string;
}

export default function CellNucleusCanvas({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrame = useRef(0);
  const mouse = useRef({ x: -1000, y: -1000 });

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
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // Corona particles
    const PARTICLE_COUNT = 600;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 1.5;
      const life = Math.random();
      return {
        angle,
        dist: 0,
        speed,
        size: 0.5 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.7,
        life,
        maxLife: 0.6 + Math.random() * 0.4,
        drift: (Math.random() - 0.5) * 0.3,
      };
    });

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.008;

      // Sphere position: bottom-center, partially off-screen
      const sphereX = w / 2;
      const sphereY = h * 0.92;
      const sphereR = Math.min(w, h) * 0.38;

      // Mouse influence on sphere position
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const mouseActive = mx > 0 && my > 0;
      const offsetX = mouseActive ? (mx - w / 2) * 0.015 : 0;
      const offsetY = mouseActive ? (my - h / 2) * 0.01 : 0;
      const sx = sphereX + offsetX;
      const sy = sphereY + offsetY;

      // === Outer atmospheric glow ===
      const outerGlow = ctx.createRadialGradient(sx, sy, sphereR * 0.5, sx, sy, sphereR * 3);
      outerGlow.addColorStop(0, "hsla(13, 74%, 55%, 0.06)");
      outerGlow.addColorStop(0.3, "hsla(20, 80%, 60%, 0.03)");
      outerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, w, h);

      // === Corona particles ===
      for (const p of particles) {
        p.life += p.speed * 0.004;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.angle = Math.random() * Math.PI * 2;
          p.speed = 0.2 + Math.random() * 1.5;
          p.size = 0.5 + Math.random() * 2.5;
          p.opacity = 0.3 + Math.random() * 0.7;
          p.drift = (Math.random() - 0.5) * 0.3;
        }

        const progress = p.life / p.maxLife;
        const dist = sphereR * (0.85 + progress * 0.8);
        const fadeIn = Math.min(progress * 5, 1);
        const fadeOut = 1 - Math.pow(progress, 2);
        const alpha = p.opacity * fadeIn * fadeOut;

        const wobble = Math.sin(time * 3 + p.angle * 5) * 8;
        const px = sx + Math.cos(p.angle + p.drift * progress) * (dist + wobble);
        const py = sy + Math.sin(p.angle + p.drift * progress) * (dist + wobble);

        // Skip if off screen
        if (py > h + 10 || px < -10 || px > w + 10 || py < -10) continue;

        // Glow
        const glowR = p.size * 4;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        glow.addColorStop(0, `hsla(25, 90%, 80%, ${alpha * 0.5})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2);

        // Core dot
        ctx.beginPath();
        ctx.arc(px, py, p.size * (0.5 + fadeIn * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(30, 95%, 90%, ${alpha})`;
        ctx.fill();
      }

      // === Main sphere ===
      // Sphere body gradient
      const sphereGrad = ctx.createRadialGradient(
        sx - sphereR * 0.15,
        sy - sphereR * 0.2,
        sphereR * 0.05,
        sx,
        sy,
        sphereR
      );
      sphereGrad.addColorStop(0, "hsla(20, 85%, 78%, 0.95)");
      sphereGrad.addColorStop(0.3, "hsla(13, 74%, 65%, 0.85)");
      sphereGrad.addColorStop(0.6, "hsla(13, 74%, 55%, 0.75)");
      sphereGrad.addColorStop(0.85, "hsla(10, 70%, 45%, 0.6)");
      sphereGrad.addColorStop(1, "hsla(8, 65%, 35%, 0.3)");

      ctx.beginPath();
      ctx.arc(sx, sy, sphereR, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Inner light reflection
      const reflectGrad = ctx.createRadialGradient(
        sx - sphereR * 0.25,
        sy - sphereR * 0.3,
        0,
        sx - sphereR * 0.1,
        sy - sphereR * 0.15,
        sphereR * 0.6
      );
      reflectGrad.addColorStop(0, "hsla(30, 100%, 95%, 0.4)");
      reflectGrad.addColorStop(0.5, "hsla(25, 90%, 85%, 0.1)");
      reflectGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(sx, sy, sphereR, 0, Math.PI * 2);
      ctx.fillStyle = reflectGrad;
      ctx.fill();

      // Rim light / corona glow at the edge
      const rimGrad = ctx.createRadialGradient(sx, sy, sphereR * 0.8, sx, sy, sphereR * 1.15);
      rimGrad.addColorStop(0, "transparent");
      rimGrad.addColorStop(0.5, `hsla(25, 90%, 75%, ${0.15 + Math.sin(time * 2) * 0.05})`);
      rimGrad.addColorStop(0.8, `hsla(30, 95%, 85%, ${0.1 + Math.sin(time * 1.5) * 0.03})`);
      rimGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(sx, sy, sphereR * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // Surface texture - subtle swirls
      for (let i = 0; i < 5; i++) {
        const swAngle = time * 0.3 + (i * Math.PI * 2) / 5;
        const swR = sphereR * (0.3 + i * 0.1);
        const swX = sx + Math.cos(swAngle) * swR * 0.3;
        const swY = sy + Math.sin(swAngle) * swR * 0.3;
        const swGrad = ctx.createRadialGradient(swX, swY, 0, swX, swY, sphereR * 0.3);
        swGrad.addColorStop(0, `hsla(15, 80%, 70%, ${0.06 + Math.sin(time + i) * 0.02})`);
        swGrad.addColorStop(1, "transparent");
        ctx.fillStyle = swGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, sphereR, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "auto" }}
      aria-hidden="true"
    />
  );
}
