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
  phase: number;
  colorIdx: number;
  opacity: number;
  targetOpacity: number;
  dividing: boolean;
  divisionProgress: number;
  divisionAngle: number;
  wobblePhase: number;
  wobbleSpeed: number;
  group: number;
}

// Biological cell colors: crimson/rose nucleus + cyan-blue membrane
const NUCLEUS_COLORS = [
  { core: "#c42040", mid: "#982038", outer: "#701830", glow: "rgba(180, 40, 60, 0.15)" },
  { core: "#b83050", mid: "#902840", outer: "#682030", glow: "rgba(160, 48, 64, 0.12)" },
  { core: "#d03848", mid: "#a82838", outer: "#801828", glow: "rgba(190, 50, 60, 0.13)" },
  { core: "#a82848", mid: "#882038", outer: "#601828", glow: "rgba(150, 40, 56, 0.10)" },
];

const MEMBRANE_COLOR = {
  edge: "rgba(120, 210, 235, 0.22)",
  fill: "rgba(100, 200, 230, 0.06)",
  specular: "rgba(200, 245, 255, 0.35)",
  reticle: "rgba(140, 220, 240, 0.08)",
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawSingleCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colorIdx: number,
  opacity: number,
  time: number,
  wobblePhase: number
) {
  if (opacity <= 0.01 || radius < 2) return;

  const nuc = NUCLEUS_COLORS[colorIdx % NUCLEUS_COLORS.length];
  ctx.save();
  ctx.globalAlpha = opacity;

  const membraneR = radius * 1.25;
  const nucleusR = radius * 0.55;
  const segments = 72;

  // === OUTER GLOW — soft cyan halo ===
  const glowGrad = ctx.createRadialGradient(x, y, membraneR * 0.6, x, y, membraneR * 2.0);
  glowGrad.addColorStop(0, "rgba(100, 200, 230, 0.08)");
  glowGrad.addColorStop(0.5, "rgba(80, 180, 220, 0.03)");
  glowGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x, y, membraneR * 2.0, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // === MEMBRANE — translucent cyan shell with wobble ===
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobble = 1
      + Math.sin(angle * 3 + time * 0.6 + wobblePhase) * 0.025
      + Math.sin(angle * 5 + time * 0.4 + wobblePhase * 1.5) * 0.012
      + Math.sin(angle * 7 + time * 0.2 + wobblePhase * 0.7) * 0.008;
    const r = membraneR * wobble;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Membrane fill — very subtle cyan
  const membraneFillGrad = ctx.createRadialGradient(x, y, nucleusR, x, y, membraneR);
  membraneFillGrad.addColorStop(0, "rgba(100, 200, 230, 0.02)");
  membraneFillGrad.addColorStop(0.5, MEMBRANE_COLOR.fill);
  membraneFillGrad.addColorStop(0.85, "rgba(120, 215, 240, 0.10)");
  membraneFillGrad.addColorStop(1, "rgba(100, 200, 230, 0.04)");
  ctx.fillStyle = membraneFillGrad;
  ctx.fill();

  // Membrane edge stroke — cyan ring
  ctx.strokeStyle = MEMBRANE_COLOR.edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // === RETICULATED TEXTURE on membrane ===
  ctx.globalAlpha = opacity * 0.15;
  const reticleCount = 18;
  for (let i = 0; i < reticleCount; i++) {
    const angle1 = (i / reticleCount) * Math.PI * 2;
    const angle2 = ((i + 0.5) / reticleCount) * Math.PI * 2;
    const r1 = membraneR * (0.7 + Math.sin(angle1 * 3 + time * 0.3 + wobblePhase) * 0.15);
    const r2 = membraneR * (0.75 + Math.cos(angle2 * 2 + time * 0.2 + wobblePhase) * 0.12);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle1) * r1, y + Math.sin(angle1) * r1);
    ctx.lineTo(x + Math.cos(angle2) * r2, y + Math.sin(angle2) * r2);
    ctx.strokeStyle = "rgba(140, 220, 240, 0.3)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.globalAlpha = opacity;

  // === SPECULAR HIGHLIGHTS on membrane ===
  // Top-left main highlight
  const specX = x - membraneR * 0.35;
  const specY = y - membraneR * 0.4;
  const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, membraneR * 0.4);
  specGrad.addColorStop(0, MEMBRANE_COLOR.specular);
  specGrad.addColorStop(0.6, "rgba(200, 245, 255, 0.08)");
  specGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(specX, specY, membraneR * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();

  // Secondary bottom-right highlight
  const spec2X = x + membraneR * 0.25;
  const spec2Y = y + membraneR * 0.3;
  const spec2Grad = ctx.createRadialGradient(spec2X, spec2Y, 0, spec2X, spec2Y, membraneR * 0.25);
  spec2Grad.addColorStop(0, "rgba(200, 240, 255, 0.18)");
  spec2Grad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(spec2X, spec2Y, membraneR * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = spec2Grad;
  ctx.fill();

  // === INNER NUCLEUS — crimson/rose lobulated core ===
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const lobe = 1
      + Math.sin(angle * 4 + time * 0.25 + wobblePhase) * 0.10
      + Math.sin(angle * 2.5 + time * 0.5 + wobblePhase * 0.7) * 0.07
      + Math.sin(angle * 6 + time * 0.12 + wobblePhase * 2.1) * 0.04
      + Math.sin(angle * 8 + time * 0.08 + wobblePhase * 3.0) * 0.025;
    const r = nucleusR * lobe;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Nucleus gradient — deep crimson center to dark rose edge
  const nucGrad = ctx.createRadialGradient(
    x - nucleusR * 0.15, y - nucleusR * 0.1, nucleusR * 0.05,
    x, y, nucleusR * 1.1
  );
  nucGrad.addColorStop(0, nuc.core);
  nucGrad.addColorStop(0.35, nuc.mid);
  nucGrad.addColorStop(0.7, nuc.outer);
  nucGrad.addColorStop(1, "rgba(60, 15, 25, 0.7)");
  ctx.fillStyle = nucGrad;
  ctx.fill();

  // Nucleus lobule texture — darker veins
  ctx.globalAlpha = opacity * 0.3;
  for (let j = 0; j < 5; j++) {
    const cAngle = (j / 5) * Math.PI * 2 + wobblePhase + time * 0.05;
    const cR = nucleusR * (0.3 + Math.sin(cAngle * 2 + time * 0.1) * 0.15);
    const cx = x + Math.cos(cAngle) * cR * 0.5;
    const cy = y + Math.sin(cAngle) * cR * 0.5;
    const veinGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucleusR * 0.3);
    veinGrad.addColorStop(0, "rgba(50, 10, 20, 0.4)");
    veinGrad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(cx, cy, nucleusR * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = veinGrad;
    ctx.fill();
  }
  ctx.globalAlpha = opacity;

  // Nucleus specular — subtle pink highlight
  const nucSpecGrad = ctx.createRadialGradient(
    x - nucleusR * 0.25, y - nucleusR * 0.3, 0,
    x - nucleusR * 0.15, y - nucleusR * 0.2, nucleusR * 0.35
  );
  nucSpecGrad.addColorStop(0, "rgba(255, 180, 200, 0.35)");
  nucSpecGrad.addColorStop(0.5, "rgba(255, 150, 180, 0.1)");
  nucSpecGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(x - nucleusR * 0.2, y - nucleusR * 0.25, nucleusR * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = nucSpecGrad;
  ctx.fill();

  ctx.restore();
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
  if (opacity <= 0.01 || radius < 2) return;

  ctx.save();

  if (dividing && divisionProgress > 0.1) {
    const sep = radius * divisionProgress * 0.9;
    const lobeR = radius * (0.7 + divisionProgress * 0.2);
    const dx = Math.cos(divisionAngle) * sep;
    const dy = Math.sin(divisionAngle) * sep;

    // Bridge between dividing cells
    if (divisionProgress < 0.85) {
      const bridgeAlpha = (1 - divisionProgress / 0.85) * opacity;
      ctx.globalAlpha = bridgeAlpha * 0.25;
      const bridgeW = radius * (1 - divisionProgress) * 0.5;
      ctx.beginPath();
      ctx.ellipse(x, y, sep + lobeR * 0.3, bridgeW, divisionAngle, 0, Math.PI * 2);
      const bridgeGrad = ctx.createRadialGradient(x, y, 0, x, y, sep + lobeR * 0.3);
      bridgeGrad.addColorStop(0, "rgba(120, 210, 235, 0.15)");
      bridgeGrad.addColorStop(1, "transparent");
      ctx.fillStyle = bridgeGrad;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const sign of [-1, 1]) {
      drawSingleCell(ctx, x + dx * sign, y + dy * sign, lobeR, colorIdx, opacity, time, wobblePhase + sign * 2);
    }
  } else {
    drawSingleCell(ctx, x, y, radius, colorIdx, opacity, time, wobblePhase);
  }

  ctx.restore();
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
    x: cx, y: cy,
    targetX: cx, targetY: cy,
    radius: baseRadius,
    targetRadius: baseRadius,
    phase: Math.random() * Math.PI * 2,
    colorIdx: Math.floor(Math.random() * NUCLEUS_COLORS.length),
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
    const baseR = Math.min(w, h) * 0.045;
    const cells: Cell[] = [];
    const centerX = w * 0.5;
    const centerY = h * 0.45;

    // Main cluster
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const dist = baseR * (1.8 + Math.random() * 2.2);
      const r = baseR * (0.7 + Math.random() * 0.7);
      cells.push(createCell(w, h, 0, r, centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist));
    }

    // Satellite cells — smaller
    for (let i = 0; i < 3; i++) {
      const r = baseR * (0.35 + Math.random() * 0.35);
      cells.push(createCell(w, h, 1, r, w * (0.15 + Math.random() * 0.7), h * (0.2 + Math.random() * 0.6)));
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
      const baseR = Math.min(w, h) * 0.045;

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

      cells.forEach((cell, i) => {
        const angle = (i / cells.length) * Math.PI * 2 + cell.phase;
        const dist = baseR * (2 + i * 0.8) * spreadFactor;
        cell.targetX = clusterCenterX + Math.cos(angle + time * 0.08) * dist;
        cell.targetY = clusterCenterY + Math.sin(angle + time * 0.06) * dist;
        cell.targetX = Math.max(cell.radius * 2, Math.min(w - cell.radius * 2, cell.targetX));
        cell.targetY = Math.max(cell.radius * 2, Math.min(h - cell.radius * 2, cell.targetY));

        cell.x = lerp(cell.x, cell.targetX, 0.015);
        cell.y = lerp(cell.y, cell.targetY, 0.015);
        cell.x += Math.sin(time * cell.wobbleSpeed + cell.wobblePhase) * 0.3;
        cell.y += Math.cos(time * cell.wobbleSpeed * 0.8 + cell.wobblePhase) * 0.25;

        const breathe = 1 + Math.sin(time * 0.6 + cell.phase) * 0.04;
        cell.radius = lerp(cell.radius, cell.targetRadius * breathe, 0.05);

        cell.targetOpacity = sp > 0.92 ? Math.max(0, 1 - (sp - 0.92) / 0.08) : 1;
        cell.opacity = lerp(cell.opacity, cell.targetOpacity, 0.05);

        // Division
        if (sp > 0.2 && sp < 0.5 && !cell.dividing && i < 3 && cell.divisionProgress === 0) {
          const trigger = 0.2 + i * 0.08;
          if (sp > trigger && sp < trigger + 0.15) {
            cell.dividing = true;
            cell.divisionAngle = Math.random() * Math.PI * 2;
          }
        }
        if (cell.dividing) {
          cell.divisionProgress = Math.min(1, cell.divisionProgress + dt * 0.15);
          if (cell.divisionProgress >= 1) {
            cell.dividing = false;
            cell.divisionProgress = 0;
          }
        }
        if (sp < 0.15 && cell.divisionProgress > 0 && !cell.dividing) {
          cell.divisionProgress = Math.max(0, cell.divisionProgress - dt * 0.3);
        }
      });

      // Draw back to front
      const sorted = [...cells].sort((a, b) => a.radius - b.radius);
      sorted.forEach((cell) => {
        drawCell(ctx, cell.x, cell.y, cell.radius, cell.colorIdx, cell.opacity, time, cell.wobblePhase, cell.dividing, cell.divisionProgress, cell.divisionAngle);
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
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
