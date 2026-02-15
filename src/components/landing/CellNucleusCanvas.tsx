import { useRef, useEffect, useCallback } from "react";

interface Props {
  className?: string;
  scrollProgress?: number;
}

interface Cell {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  targetRadius: number;
  vx: number;
  vy: number;
  phase: number;
  hue: number;
  opacity: number;
  targetOpacity: number;
  // Division state
  dividing: boolean;
  divisionProgress: number;
  divisionAngle: number;
  // Wobble
  wobblePhase: number;
  wobbleSpeed: number;
  // Parent group (for merge/split behavior)
  group: number;
}

// Colors from the site palette (dark premium with warm orange primary)
const CELL_COLORS = [
  { core: "#e05d38", mid: "#c94e2e", outer: "#a04228", glow: "rgba(224, 93, 56, 0.12)" },
  { core: "#e8734f", mid: "#d4603a", outer: "#b55030", glow: "rgba(232, 115, 79, 0.10)" },
  { core: "#d44a2a", mid: "#bb3e22", outer: "#943018", glow: "rgba(212, 74, 42, 0.08)" },
  { core: "#f08060", mid: "#e06848", outer: "#c05838", glow: "rgba(240, 128, 96, 0.10)" },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colorIdx: number,
  opacity: number,
  time: number,
  wobblePhase: number,
  dividing: boolean,
  divisionProgress: number,
  divisionAngle: number
) {
  if (opacity <= 0.01 || radius < 1) return;

  const colors = CELL_COLORS[colorIdx % CELL_COLORS.length];
  ctx.save();
  ctx.globalAlpha = opacity;

  if (dividing && divisionProgress > 0.1) {
    // Draw dividing cell as two merging/separating lobes
    const sep = radius * divisionProgress * 0.8;
    const lobeR = radius * (0.75 + divisionProgress * 0.15);
    const dx = Math.cos(divisionAngle) * sep;
    const dy = Math.sin(divisionAngle) * sep;

    for (const sign of [-1, 1]) {
      const lx = x + dx * sign;
      const ly = y + dy * sign;
      drawSingleCell(ctx, lx, ly, lobeR, colors, time, wobblePhase + sign);
    }

    // Connection bridge between the two lobes
    if (divisionProgress < 0.85) {
      const bridgeAlpha = 1 - divisionProgress / 0.85;
      ctx.globalAlpha = opacity * bridgeAlpha * 0.6;
      const bridgeW = radius * (1 - divisionProgress) * 0.7;
      
      ctx.beginPath();
      ctx.ellipse(x, y, sep + lobeR * 0.3, bridgeW, divisionAngle, 0, Math.PI * 2);
      const bridgeGrad = ctx.createRadialGradient(x, y, 0, x, y, sep + lobeR * 0.3);
      bridgeGrad.addColorStop(0, colors.mid);
      bridgeGrad.addColorStop(1, "transparent");
      ctx.fillStyle = bridgeGrad;
      ctx.fill();
    }
  } else {
    drawSingleCell(ctx, x, y, radius, colors, time, wobblePhase);
  }

  ctx.restore();
}

function drawSingleCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colors: typeof CELL_COLORS[0],
  time: number,
  wobblePhase: number
) {
  // Outer glow
  const glowGrad = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2.2);
  glowGrad.addColorStop(0, colors.glow);
  glowGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // Outer membrane — subtle transparent ring
  ctx.beginPath();
  const membraneR = radius * 1.15;
  // Wobble the membrane slightly
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobble = 1 + Math.sin(angle * 3 + time * 0.8 + wobblePhase) * 0.03
                     + Math.sin(angle * 5 + time * 0.5 + wobblePhase * 1.3) * 0.015;
    const r = membraneR * wobble;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner body — organic shape with slight lobulation
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const lobe = 1 + Math.sin(angle * 4 + time * 0.3 + wobblePhase) * 0.06
                   + Math.sin(angle * 2.5 + time * 0.6 + wobblePhase * 0.7) * 0.04
                   + Math.sin(angle * 6 + time * 0.15 + wobblePhase * 2.1) * 0.025;
    const r = radius * lobe;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Main body gradient
  const bodyGrad = ctx.createRadialGradient(
    x - radius * 0.15, y - radius * 0.15, radius * 0.05,
    x, y, radius
  );
  bodyGrad.addColorStop(0, colors.core);
  bodyGrad.addColorStop(0.45, colors.mid);
  bodyGrad.addColorStop(0.8, colors.outer);
  bodyGrad.addColorStop(1, `rgba(${hexToRgb(colors.outer)}, 0.3)`);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Inner nucleus highlight — bright center
  const nucleusGrad = ctx.createRadialGradient(
    x - radius * 0.1, y - radius * 0.12, 0,
    x, y, radius * 0.45
  );
  nucleusGrad.addColorStop(0, "rgba(255, 200, 140, 0.6)");
  nucleusGrad.addColorStop(0.5, "rgba(240, 150, 80, 0.25)");
  nucleusGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = nucleusGrad;
  ctx.fill();

  // Specular highlight — top-left
  const specGrad = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.35, 0,
    x - radius * 0.2, y - radius * 0.25, radius * 0.4
  );
  specGrad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
  specGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x - radius * 0.25, y - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function createCell(
  canvasW: number,
  canvasH: number,
  group: number,
  baseRadius: number,
  x?: number,
  y?: number
): Cell {
  const cx = x ?? Math.random() * canvasW;
  const cy = y ?? Math.random() * canvasH;
  return {
    x: cx,
    y: cy,
    targetX: cx,
    targetY: cy,
    radius: baseRadius,
    targetRadius: baseRadius,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    phase: Math.random() * Math.PI * 2,
    hue: Math.floor(Math.random() * CELL_COLORS.length),
    opacity: 0,
    targetOpacity: 1,
    dividing: false,
    divisionProgress: 0,
    divisionAngle: Math.random() * Math.PI * 2,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.3 + Math.random() * 0.4,
    group,
  };
}

export default function CellNucleusCanvas({ className = "", scrollProgress = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Cell[]>([]);
  const timeRef = useRef(0);
  const scrollRef = useRef(scrollProgress);
  const rafRef = useRef<number>(0);
  const initializedRef = useRef(false);

  scrollRef.current = scrollProgress;

  const initCells = useCallback((w: number, h: number) => {
    const baseR = Math.min(w, h) * 0.04;
    const cells: Cell[] = [];

    // Create initial cluster of cells near center
    const centerX = w * 0.5;
    const centerY = h * 0.45;
    const count = 7;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = baseR * (1.5 + Math.random() * 2.5);
      const r = baseR * (0.6 + Math.random() * 0.8);
      cells.push(
        createCell(w, h, 0, r, centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist)
      );
    }

    // A few smaller satellite cells
    for (let i = 0; i < 4; i++) {
      const r = baseR * (0.3 + Math.random() * 0.4);
      cells.push(
        createCell(w, h, 1, r,
          w * (0.15 + Math.random() * 0.7),
          h * (0.2 + Math.random() * 0.6)
        )
      );
    }

    cellsRef.current = cells;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!initializedRef.current) {
        initCells(w, h);
        initializedRef.current = true;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeRef.current += dt;
      const time = timeRef.current;
      const sp = scrollRef.current;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const cells = cellsRef.current;
      const baseR = Math.min(w, h) * 0.04;

      // Scroll-driven behavior:
      // sp 0-0.15: cells clustered center (hero)
      // sp 0.15-0.4: cells spread apart, some divide
      // sp 0.4-0.7: cells scattered, floating freely
      // sp 0.7-1.0: cells converge to right side

      const clusterCenterX = sp < 0.4
        ? lerp(w * 0.5, w * 0.65, sp / 0.4)
        : sp < 0.7
        ? w * 0.65 + Math.sin(time * 0.2) * w * 0.02
        : lerp(w * 0.65, w * 0.75, (sp - 0.7) / 0.3);

      const clusterCenterY = sp < 0.4
        ? lerp(h * 0.45, h * 0.4, sp / 0.4)
        : h * 0.4 + Math.sin(time * 0.15) * h * 0.02;

      const spreadFactor = sp < 0.15
        ? 0.6
        : sp < 0.4
        ? lerp(0.6, 1.8, (sp - 0.15) / 0.25)
        : sp < 0.7
        ? 1.8 + Math.sin(time * 0.1) * 0.1
        : lerp(1.8, 0.8, (sp - 0.7) / 0.3);

      // Update cells
      cells.forEach((cell, i) => {
        // Target position based on scroll
        const angle = (i / cells.length) * Math.PI * 2 + cell.phase;
        const dist = baseR * (2 + i * 0.8) * spreadFactor;
        cell.targetX = clusterCenterX + Math.cos(angle + time * 0.08) * dist;
        cell.targetY = clusterCenterY + Math.sin(angle + time * 0.06) * dist;

        // Keep within bounds
        cell.targetX = Math.max(cell.radius * 2, Math.min(w - cell.radius * 2, cell.targetX));
        cell.targetY = Math.max(cell.radius * 2, Math.min(h - cell.radius * 2, cell.targetY));

        // Smooth movement
        cell.x = lerp(cell.x, cell.targetX, 0.015);
        cell.y = lerp(cell.y, cell.targetY, 0.015);

        // Organic drift
        cell.x += Math.sin(time * cell.wobbleSpeed + cell.wobblePhase) * 0.3;
        cell.y += Math.cos(time * cell.wobbleSpeed * 0.8 + cell.wobblePhase) * 0.25;

        // Breathing radius
        const breathe = 1 + Math.sin(time * 0.6 + cell.phase) * 0.04;
        cell.radius = lerp(cell.radius, cell.targetRadius * breathe, 0.05);

        // Opacity
        cell.targetOpacity = sp > 0.92 ? Math.max(0, 1 - (sp - 0.92) / 0.08) : 1;
        cell.opacity = lerp(cell.opacity, cell.targetOpacity, 0.05);

        // Division trigger based on scroll
        if (sp > 0.2 && sp < 0.5 && !cell.dividing && i < 3 && cell.divisionProgress === 0) {
          const divisionTrigger = 0.2 + (i * 0.08);
          if (sp > divisionTrigger && sp < divisionTrigger + 0.15) {
            cell.dividing = true;
            cell.divisionAngle = Math.random() * Math.PI * 2;
          }
        }

        // Division animation
        if (cell.dividing) {
          cell.divisionProgress = Math.min(1, cell.divisionProgress + dt * 0.15);
          if (cell.divisionProgress >= 1) {
            cell.dividing = false;
            cell.divisionProgress = 0;
          }
        }

        // Reverse: merge when scrolling back
        if (sp < 0.15 && cell.divisionProgress > 0 && !cell.dividing) {
          cell.divisionProgress = Math.max(0, cell.divisionProgress - dt * 0.3);
        }
      });

      // Draw cells (back to front by size)
      const sortedCells = [...cells].sort((a, b) => a.radius - b.radius);
      sortedCells.forEach((cell) => {
        drawCell(
          ctx,
          cell.x,
          cell.y,
          cell.radius,
          cell.hue,
          cell.opacity,
          time,
          cell.wobblePhase,
          cell.dividing,
          cell.divisionProgress,
          cell.divisionAngle
        );
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initCells]);

  return (
    <div
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
