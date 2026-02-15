import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";

// Extend shaderMaterial for R3F JSX
extend({ ShaderMaterial: THREE.ShaderMaterial });

interface Props {
  className?: string;
  scrollProgress?: number;
}

/* ═══════════════════════════════════════════════
   GLSL Plasma Sphere — fluid, organic, premium
   ═══════════════════════════════════════════════ */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  uniform vec2 uMouse;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Simplex-like noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
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
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * snoise(p); p *= 2.01;
    f += 0.2500 * snoise(p); p *= 2.02;
    f += 0.1250 * snoise(p); p *= 2.03;
    f += 0.0625 * snoise(p);
    return f;
  }
  
  void main() {
    // Fresnel for edge glow
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
    
    // Flowing plasma noise
    vec3 noiseCoord = vPosition * 1.8 + vec3(uTime * 0.08, uTime * 0.05, uTime * 0.03);
    float n1 = fbm(noiseCoord);
    float n2 = fbm(noiseCoord + vec3(3.7, 1.2, 2.8) + vec3(uTime * 0.02));
    float n3 = fbm(noiseCoord * 0.5 + vec3(uTime * 0.015, -uTime * 0.01, 0.0));
    
    // Warm organic palette
    vec3 deepCore   = vec3(0.28, 0.12, 0.08);  // deep brown-red
    vec3 midTone    = vec3(0.65, 0.30, 0.15);   // warm amber
    vec3 highlight  = vec3(0.92, 0.55, 0.30);   // golden orange
    vec3 hotSpot    = vec3(1.0, 0.78, 0.55);     // bright warm
    vec3 rimColor   = vec3(0.95, 0.45, 0.20);   // orange rim
    
    // Mix colors based on noise
    float plasma = n1 * 0.5 + 0.5;
    float veins = smoothstep(0.3, 0.7, n2 * 0.5 + 0.5);
    float flow = smoothstep(0.2, 0.8, n3 * 0.5 + 0.5);
    
    vec3 baseColor = mix(deepCore, midTone, plasma);
    baseColor = mix(baseColor, highlight, veins * 0.5);
    baseColor = mix(baseColor, hotSpot, flow * 0.25 * (1.0 - fresnel));
    
    // Subtle mouse influence on internal flow
    float mouseInfluence = length(uMouse) * 0.15;
    baseColor += hotSpot * mouseInfluence * flow * 0.1;
    
    // Inner light — brighter toward center
    float centerGlow = 1.0 - length(vUv - 0.5) * 1.6;
    centerGlow = max(centerGlow, 0.0);
    baseColor += highlight * centerGlow * 0.15;
    
    // Rim/edge glow
    baseColor = mix(baseColor, rimColor, fresnel * 0.6);
    
    // Soft alpha with fresnel edge fade
    float alpha = uAlpha * (0.92 - fresnel * 0.15);
    alpha = max(alpha, fresnel * 0.4 * uAlpha); // keep rim visible
    
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

// Glow shader for atmospheric halo
const glowVertexShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = /* glsl */ `
  uniform float uAlpha;
  uniform float uTime;
  varying vec3 vNormal;
  
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    float pulse = 1.0 + sin(uTime * 0.5) * 0.08;
    vec3 glowColor = vec3(0.85, 0.35, 0.15) * intensity * pulse;
    float alpha = intensity * uAlpha * 0.5;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

function PlasmaSphere({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport, size } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAlpha: { value: 1 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }), []);

  const glowUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAlpha: { value: 1 },
  }), []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / size.width - 0.5) * 2,
        y: -(e.clientY / size.height - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [size]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    glowUniforms.uTime.value += delta;

    const sp = scrollProgress;
    const vw = viewport.width;
    const vh = viewport.height;

    let targetX: number, targetY: number, targetScale: number, targetAlpha: number;

    if (sp < 0.15) {
      const t = sp / 0.15;
      const ease = 1 - Math.pow(1 - t, 3);
      targetX = 0;
      targetY = -(vh * 0.18) + ease * (vh * 0.08);
      targetScale = 1.0 - ease * 0.08;
      targetAlpha = 1;
    } else if (sp < 0.4) {
      const t = 1 - Math.pow(1 - (sp - 0.15) / 0.25, 3);
      targetX = t * (vw * 0.28);
      targetY = -(vh * 0.10) + t * (vh * 0.18);
      targetScale = 1.0 - 0.08 - t * 0.45;
      targetAlpha = 1;
    } else if (sp < 0.7) {
      const t = (sp - 0.4) / 0.3;
      targetX = vw * 0.28 + Math.sin(uniforms.uTime.value * 0.3) * 0.08;
      targetY = vh * 0.08 + t * (vh * 0.05) + Math.cos(uniforms.uTime.value * 0.25) * 0.05;
      targetScale = 0.47 - t * 0.1;
      targetAlpha = 1;
    } else {
      const t = 1 - Math.pow(1 - (sp - 0.7) / 0.3, 3);
      targetX = vw * 0.28 + t * (vw * 0.1);
      targetY = vh * 0.13 - t * (vh * 0.06);
      targetScale = 0.37 - t * 0.15;
      targetAlpha = Math.max(0, 1 - t * 1.5);
    }

    // Mouse influence
    targetX += mouseRef.current.x * 0.06;
    targetY += mouseRef.current.y * 0.04;

    uniforms.uAlpha.value = targetAlpha;
    uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
    glowUniforms.uAlpha.value = targetAlpha;

    if (meshRef.current) {
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.04;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.04;
      const s = meshRef.current.scale.x;
      const ns = s + (targetScale - s) * 0.04;
      meshRef.current.scale.set(ns, ns, ns);
      meshRef.current.rotation.y += delta * 0.08;
      meshRef.current.rotation.x += delta * 0.03;
    }

    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current!.position);
      glowRef.current.scale.copy(meshRef.current!.scale);
    }
  });

  const baseRadius = Math.min(viewport.width, viewport.height) * 0.45;

  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: glowUniforms,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const sphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  }), []);

  return (
    <>
      {/* Atmospheric glow layer */}
      <mesh ref={glowRef} material={glowMaterial}>
        <sphereGeometry args={[baseRadius * 1.25, 48, 48]} />
      </mesh>

      {/* Main plasma sphere */}
      <mesh ref={meshRef} material={sphereMaterial}>
        <sphereGeometry args={[baseRadius, 64, 64]} />
      </mesh>
    </>
  );
}

export default function CellNucleusCanvas({ className = "", scrollProgress = 0 }: Props) {
  return (
    <div
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <PlasmaSphere scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
