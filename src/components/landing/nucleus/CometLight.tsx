import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function CometLight() {
  const spriteRef = useRef<THREE.Sprite>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (spriteRef.current) {
      spriteRef.current.position.x = 3.5 + Math.sin(t * 0.15) * 0.3;
      spriteRef.current.position.y = 2.5 + Math.cos(t * 0.1) * 0.2;
      spriteRef.current.material.opacity = 0.04 + Math.sin(t * 0.2) * 0.015;
    }
  });

  return (
    <sprite ref={spriteRef} position={[3.5, 2.5, -3]} scale={[5, 2.5, 1]}>
      <spriteMaterial
        color="#f5d8b8"
        transparent
        opacity={0.04}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}
