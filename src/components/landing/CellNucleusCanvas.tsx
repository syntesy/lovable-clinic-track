import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  opacity: number;
  baseOpacity: number;
  hue: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  type: "organelle" | "membrane" | "filament";
}

interface Props {
  className?: string;
  particleCount?: number;
  /** HSL hue for the primary color (default: 13 = REGHEN orange) */
  primaryHue?: number;
}

export default function CellNucleusCanvas({
  className = "",
  particleCount = 80,
  primaryHue = 13,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const animFrame = useRef(0);
  const particles = useRef<Particle[]>([]);
  const dims = useRef({ w: 0, h: 0 });

  const initParticles = useCallback(
    (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const arr: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const type: Particle["type"] =
          i < particleCount * 0.15
            ? "organelle"
            : i < particleCount * 0.6
            ? "membrane"
            : "filament";

        const orbitRadius =
          type === "organelle"
            ? Math.random() * 60 + 20
            : type === "membrane"
            ? Math.random() * 180 + 80
            : Math.random() * 320 + 120;

        const baseRadius =
          type === "organelle"
            ? Math.random() * 4 + 3
            : type === "membrane"
            ? Math.random() * 2.5 + 1
            : Math.random() * 1.2 + 0.4;

        const baseOpacity =
          type === "organelle"
            ? 0.6 + Math.random() * 0.3
            : type === "membrane"
            ? 0.3 + Math.random() * 0.25
            : 0.1 + Math.random() * 0.15;

        const angle = Math.random() * Math.PI * 2;

        arr.push({
          x: cx + Math.cos(angle) * orbitRadius,
          y: cy + Math.sin(angle) * orbitRadius,
          vx: 0,
          vy: 0,
          radius: baseRadius,
          baseRadius,
          opacity: baseOpacity,
          baseOpacity,
          hue: primaryHue + (Math.random() * 30 - 15),
          orbitRadius,
          orbitSpeed: (0.0003 + Math.random() * 0.0008) * (Math.random() > 0.5 ? 1 : -1),
          orbitAngle: angle,
          type,
        });
      }
      particles.current = arr;
    },
    [particleCount, primaryHue]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      dims.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.current.length === 0) {
        initParticles(rect.width, rect.height);
      }
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

    let time = 0;

    const draw = () => {
      const { w, h } = dims.current;
      ctx.clearRect(0, 0, w, h);
      time++;

      const cx = w / 2;
      const cy = h / 2;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Draw nucleus glow
      const nucleusGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      nucleusGrad.addColorStop(0, `hsla(${primaryHue}, 74%, 55%, 0.08)`);
      nucleusGrad.addColorStop(0.5, `hsla(${primaryHue}, 74%, 55%, 0.03)`);
      nucleusGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nucleusGrad;
      ctx.fillRect(0, 0, w, h);

      // Mouse attraction glow
      if (mx > 0 && my > 0) {
        const mouseGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
        mouseGrad.addColorStop(0, `hsla(${primaryHue}, 74%, 55%, 0.06)`);
        mouseGrad.addColorStop(1, "transparent");
        ctx.fillStyle = mouseGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Update and draw particles
      const pts = particles.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        // Orbital movement
        p.orbitAngle += p.orbitSpeed;
        const targetX = cx + Math.cos(p.orbitAngle) * p.orbitRadius;
        const targetY = cy + Math.sin(p.orbitAngle) * p.orbitRadius;

        // Mouse influence
        const dxM = mx - p.x;
        const dyM = my - p.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        const mouseInfluence = distM < 250 ? (1 - distM / 250) * 0.8 : 0;

        // Lerp to target + mouse attraction
        p.x += (targetX - p.x) * 0.02 + dxM * mouseInfluence * 0.008;
        p.y += (targetY - p.y) * 0.02 + dyM * mouseInfluence * 0.008;

        // Pulse radius near mouse
        p.radius = p.baseRadius + (mouseInfluence * p.baseRadius * 0.8);
        p.opacity = p.baseOpacity + mouseInfluence * 0.3;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const sat = p.type === "organelle" ? "74%" : p.type === "membrane" ? "50%" : "30%";
        const lit = p.type === "organelle" ? "55%" : p.type === "membrane" ? "60%" : "65%";
        ctx.fillStyle = `hsla(${p.hue}, ${sat}, ${lit}, ${p.opacity})`;
        ctx.fill();

        // Glow for organelles
        if (p.type === "organelle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 74%, 55%, ${p.opacity * 0.1})`;
          ctx.fill();
        }
      }

      // Draw connections (membrane-like filaments)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = pts[i].type === "filament" || pts[j].type === "filament" ? 100 : 70;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `hsla(${primaryHue}, 50%, 60%, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      // Pulsating nucleus ring
      const pulseR = 50 + Math.sin(time * 0.015) * 10;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${primaryHue}, 74%, 55%, ${0.06 + Math.sin(time * 0.02) * 0.03})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Outer membrane ring
      const outerR = 180 + Math.sin(time * 0.008) * 15;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${primaryHue}, 40%, 55%, 0.04)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [initParticles, primaryHue]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "auto" }}
      aria-hidden="true"
    />
  );
}
