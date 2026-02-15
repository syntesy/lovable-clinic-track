import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NUCLEUS_SEGMENTS, FRESNEL_POWER, FRESNEL_INTENSITY, NUCLEUS_COLOR_CORE, NUCLEUS_COLOR_EDGE, NUCLEUS_COLOR_GLOW } from "./constants";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;

  // simplex noise helpers
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Organic deformation
    float displacement = snoise(normal * 2.0 + uTime * 0.15) * 0.06
                        + snoise(normal * 4.0 + uTime * 0.1) * 0.03;

    vec3 newPos = position + normal * displacement;
    vPosition = (modelViewMatrix * vec4(newPos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uFresnelPower;
  uniform float uFresnelIntensity;
  uniform vec3 uColorCore;
  uniform vec3 uColorEdge;
  uniform vec3 uColorGlow;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), uFresnelPower);

    // Internal granular texture (noise-based)
    float grain = fract(sin(dot(vUv * 40.0 + uTime * 0.05, vec2(12.9898, 78.233))) * 43758.5453);
    float grainPattern = smoothstep(0.3, 0.7, grain) * 0.15;

    // Core color with subtle variation
    vec3 coreColor = mix(uColorCore, uColorCore * 0.8, grainPattern);

    // Edge glow
    vec3 edgeColor = mix(uColorEdge, uColorGlow, fresnel * 0.5);

    // Final color: dense core + bright fresnel edge
    vec3 finalColor = mix(coreColor, edgeColor, fresnel * uFresnelIntensity);

    // Add internal luminosity
    finalColor += uColorGlow * grainPattern * 0.3;

    // Alpha: solid core, glowing edge
    float alpha = mix(0.92, 1.0, fresnel * 0.5);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function NucleusSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFresnelPower: { value: FRESNEL_POWER },
    uFresnelIntensity: { value: FRESNEL_INTENSITY },
    uColorCore: { value: new THREE.Color(NUCLEUS_COLOR_CORE) },
    uColorEdge: { value: new THREE.Color(NUCLEUS_COLOR_EDGE) },
    uColorGlow: { value: new THREE.Color(NUCLEUS_COLOR_GLOW) },
  }), []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.03;
      meshRef.current.rotation.x += delta * 0.01;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Main nucleus sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, NUCLEUS_SEGMENTS, NUCLEUS_SEGMENTS]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow shell (additive) */}
      <mesh ref={glowRef} scale={1.12}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color={NUCLEUS_COLOR_GLOW}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Secondary glow halo */}
      <mesh scale={1.25}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={NUCLEUS_COLOR_EDGE}
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
