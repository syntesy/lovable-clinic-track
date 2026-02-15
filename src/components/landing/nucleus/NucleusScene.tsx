import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import NucleusSphere from "./NucleusSphere";
import ParticleHalo from "./ParticleHalo";
import CometLight from "./CometLight";
import {
  BLOOM_INTENSITY,
  BLOOM_THRESHOLD,
  BLOOM_RADIUS,
  NUCLEUS_SCALE,
  SCROLL_POSITIONS,
  HALO_COUNT,
  AMBIENT_COUNT,
  HALO_COUNT_MOBILE,
  AMBIENT_COUNT_MOBILE,
} from "./constants";
import { useIsMobile } from "@/hooks/use-mobile";

// Interpolate scroll positions with smooth damping
function interpolateScroll(progress: number) {
  const positions = SCROLL_POSITIONS;
  let i = 0;
  while (i < positions.length - 1 && positions[i + 1].scroll <= progress) i++;
  if (i >= positions.length - 1) {
    const last = positions[positions.length - 1];
    return { x: last.x, y: last.y, scale: last.scale };
  }
  const a = positions[i];
  const b = positions[i + 1];
  const t = (progress - a.scroll) / (b.scroll - a.scroll);
  const ease = t * t * (3 - 2 * t); // smoothstep
  return {
    x: a.x + (b.x - a.x) * ease,
    y: a.y + (b.y - a.y) * ease,
    scale: a.scale + (b.scale - a.scale) * ease,
  };
}

// Inner component that reads scrollProgress and animates the group
function NucleusGroup({ scrollProgress, isMobile }: { scrollProgress: number; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRef = useRef({ x: 0, y: -0.35, scale: NUCLEUS_SCALE });

  const haloCount = isMobile ? HALO_COUNT_MOBILE : HALO_COUNT;
  const ambientCount = isMobile ? AMBIENT_COUNT_MOBILE : AMBIENT_COUNT;

  useFrame((_, delta) => {
    const target = interpolateScroll(scrollProgress);
    const t = targetRef.current;

    // Damped lerp
    const lerpSpeed = Math.min(delta * 2.5, 1);
    t.x += (target.x - t.x) * lerpSpeed;
    t.y += (target.y - t.y) * lerpSpeed;
    t.scale += (target.scale - t.scale) * lerpSpeed;

    if (groupRef.current) {
      groupRef.current.position.x = t.x;
      groupRef.current.position.y = t.y;
      const s = t.scale;
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.35, 0]} scale={NUCLEUS_SCALE}>
      <NucleusSphere />
      <ParticleHalo haloCount={haloCount} ambientCount={ambientCount} />
      <CometLight />
    </group>
  );
}

interface NucleusSceneProps {
  scrollProgress: number;
}

export default function NucleusScene({ scrollProgress }: NucleusSceneProps) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 2)}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 2, 5]} intensity={0.5} color="#ffe0c0" />

          <NucleusGroup scrollProgress={scrollProgress} isMobile={isMobile} />

          <EffectComposer>
            <Bloom
              intensity={isMobile ? BLOOM_INTENSITY * 0.6 : BLOOM_INTENSITY}
              luminanceThreshold={BLOOM_THRESHOLD}
              luminanceSmoothing={0.9}
              mipmapBlur
              radius={BLOOM_RADIUS}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
