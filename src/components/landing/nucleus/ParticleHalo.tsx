import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HALO_COLOR, AMBIENT_COLOR } from "./constants";

interface ParticleHaloProps {
  haloCount: number;
  ambientCount: number;
}

export default function ParticleHalo({ haloCount, ambientCount }: ParticleHaloProps) {
  const haloRef = useRef<THREE.Points>(null);
  const ambientRef = useRef<THREE.Points>(null);

  // Halo particles: distributed in a torus/ring around the sphere
  const haloData = useMemo(() => {
    const positions = new Float32Array(haloCount * 3);
    const sizes = new Float32Array(haloCount);
    const speeds = new Float32Array(haloCount);
    const offsets = new Float32Array(haloCount);

    for (let i = 0; i < haloCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.1 + Math.random() * 0.8; // ring from 1.1 to 1.9
      const elevation = (Math.random() - 0.5) * 0.6; // flatten into disk

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = elevation;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Some larger sparkle particles
      sizes[i] = Math.random() > 0.92 ? 3.0 + Math.random() * 4.0 : 0.5 + Math.random() * 1.5;
      speeds[i] = 0.1 + Math.random() * 0.3;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, speeds, offsets };
  }, [haloCount]);

  // Ambient particles: scattered far behind, very faint
  const ambientData = useMemo(() => {
    const positions = new Float32Array(ambientCount * 3);
    const sizes = new Float32Array(ambientCount);

    for (let i = 0; i < ambientCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = -1 - Math.random() * 3; // behind sphere

      sizes[i] = 0.3 + Math.random() * 1.0;
    }

    return { positions, sizes };
  }, [ambientCount]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate halo particles orbitally
    if (haloRef.current) {
      const geo = haloRef.current.geometry;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < haloCount; i++) {
        const ox = haloData.positions[i * 3];
        const oy = haloData.positions[i * 3 + 1];
        const oz = haloData.positions[i * 3 + 2];

        const speed = haloData.speeds[i];
        const offset = haloData.offsets[i];
        const angle = t * speed + offset;

        // Orbital rotation around Y
        const r = Math.sqrt(ox * ox + oz * oz);
        arr[i * 3] = Math.cos(angle) * r;
        arr[i * 3 + 1] = oy + Math.sin(t * 0.5 + offset) * 0.05; // gentle breathing
        arr[i * 3 + 2] = Math.sin(angle) * r;
      }

      posAttr.needsUpdate = true;
    }

    // Ambient: gentle drift
    if (ambientRef.current) {
      const geo = ambientRef.current.geometry;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < ambientCount; i++) {
        arr[i * 3 + 1] = ambientData.positions[i * 3 + 1] + Math.sin(t * 0.2 + i) * 0.03;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Halo ring particles */}
      <points ref={haloRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[haloData.positions.slice(), 3]}
            count={haloCount}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[haloData.sizes, 1]}
            count={haloCount}
          />
        </bufferGeometry>
        <pointsMaterial
          color={HALO_COLOR}
          size={0.02}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Ambient dust particles */}
      <points ref={ambientRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[ambientData.positions.slice(), 3]}
            count={ambientCount}
          />
        </bufferGeometry>
        <pointsMaterial
          color={AMBIENT_COLOR}
          size={0.01}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  );
}
