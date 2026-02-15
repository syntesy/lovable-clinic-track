import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";

extend({ ShaderMaterial: THREE.ShaderMaterial });

interface Props {
  className?: string;
  scrollProgress?: number;
}

/* ═══════════════════════════════════════════════════════
   Simplex noise — shared between all shaders
   ═══════════════════════════════════════════════════════ */
const noiseGLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
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
    vec4 s0 = floor(b0)*2.0+1.0;
    vec4 s1 = floor(b1)*2.0+1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m*m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000*snoise(p); p *= 2.01;
    f += 0.2500*snoise(p); p *= 2.02;
    f += 0.1250*snoise(p); p *= 2.03;
    f += 0.0625*snoise(p);
    return f;
  }
`;

/* ═══════════════════════════════════════════════════════
   INNER NUCLEUS — warm, lobulated, opaque core
   ═══════════════════════════════════════════════════════ */
const nucleusVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    // Smooth rounded lobulation — gentle bumps like cell morula
    float lobe = snoise(position * 1.6 + uTime * 0.05) * 0.14
               + snoise(position * 3.0 + uTime * 0.03) * 0.06;
    vec3 pos = position + normal * lobe;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const nucleusFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  ${noiseGLSL}

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.2);

    vec3 nc = vPosition * 2.0 + vec3(uTime * 0.035, uTime * 0.025, uTime * 0.02);
    float lobules = fbm(nc) * 0.5 + 0.5;
    float detail = fbm(nc * 2.5 + vec3(1.7, 3.2, 0.8)) * 0.5 + 0.5;

    // Colors: coral-pink outer lobes, orange-amber center
    vec3 deepCoral  = vec3(0.68, 0.22, 0.18);
    vec3 coral      = vec3(0.85, 0.38, 0.30);
    vec3 orange     = vec3(0.95, 0.58, 0.30);
    vec3 amber      = vec3(1.0, 0.70, 0.25);

    vec3 col = mix(deepCoral, coral, lobules);
    col = mix(col, orange, detail * 0.5);

    // Amber center glow
    float centerDist = length(vPosition.xy);
    float center = smoothstep(0.6, 0.0, centerDist);
    col = mix(col, amber, center * 0.7);

    // Soft lobe shadows
    float lobeEdge = 1.0 - smoothstep(0.3, 0.6, lobules);
    col = mix(col, deepCoral * 0.5, lobeEdge * 0.3);

    // Specular
    float spec = pow(max(dot(vNormal, normalize(vec3(-0.2, 0.45, 1.0))), 0.0), 36.0);
    col += vec3(1.0, 0.97, 0.93) * spec * 0.55;

    // Rim
    col = mix(col, deepCoral * 0.4, fresnel * 0.5);

    col += amber * length(uMouse) * 0.01;

    float alpha = uAlpha * (0.97 - fresnel * 0.03);
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   OUTER MEMBRANE — translucent, glass-like, refractive look
   ═══════════════════════════════════════════════════════ */
const membraneVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    // Subtle membrane wobble
    float wobble = snoise(position * 3.0 + uTime * 0.05) * 0.02;
    vec3 pos = position + normal * wobble;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const membraneFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  ${noiseGLSL}

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);

    // Crystal clear membrane — almost invisible center, visible edges
    vec3 clearGlass = vec3(0.72, 0.80, 0.90);
    vec3 edgeHighlight = vec3(0.85, 0.90, 0.96);

    float iri = snoise(vPosition * 5.0 + uTime * 0.03) * 0.5 + 0.5;
    vec3 col = mix(clearGlass, edgeHighlight, iri * 0.25);

    // Sharp specular spots — like water droplets on glass
    float spec1 = pow(max(dot(vNormal, normalize(vec3(-0.3, 0.5, 0.8))), 0.0), 64.0);
    float spec2 = pow(max(dot(vNormal, normalize(vec3(0.5, -0.2, 0.85))), 0.0), 48.0);
    float spec3 = pow(max(dot(vNormal, normalize(vec3(-0.6, -0.4, 0.6))), 0.0), 40.0);
    col += vec3(1.0) * spec1 * 0.8;
    col += vec3(1.0, 0.98, 0.95) * spec2 * 0.45;
    col += vec3(0.95, 0.93, 1.0) * spec3 * 0.3;

    // Warm orange light leak (bottom-right)
    float warmLight = pow(max(dot(vNormal, normalize(vec3(0.7, -0.5, -0.2))), 0.0), 2.5);
    col += vec3(1.0, 0.6, 0.2) * warmLight * 0.2;

    // Very transparent — only edges and spec spots visible
    float edgeAlpha = fresnel * 0.35;
    float baseAlpha = 0.02 + iri * 0.01;
    float specAlpha = (spec1 + spec2 + spec3) * 0.18;
    float alpha = uAlpha * (baseAlpha + edgeAlpha + specAlpha);

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   ATMOSPHERIC GLOW — outer halo
   ═══════════════════════════════════════════════════════ */
const glowVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  uniform float uAlpha;
  uniform float uTime;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.50 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
    float pulse = 1.0 + sin(uTime * 0.4) * 0.02;
    // Warm orange-coral glow, no green/yellow
    vec3 glowColor = mix(
      vec3(0.50, 0.58, 0.75),
      vec3(0.95, 0.50, 0.22),
      intensity * 0.4
    ) * intensity * pulse;
    float alpha = intensity * uAlpha * 0.15;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   React Three Fiber scene
   ═══════════════════════════════════════════════════════ */
function CellScene({ scrollProgress }: { scrollProgress: number }) {
  const nucleusRef = useRef<THREE.Mesh>(null);
  const membraneRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport, size } = useThree();

  const sharedUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAlpha: { value: 1 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }), []);

  const glowUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAlpha: { value: 1 },
  }), []);

  const membraneUniforms = useMemo(() => ({
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
    const t = sharedUniforms.uTime.value + delta;
    sharedUniforms.uTime.value = t;
    glowUniforms.uTime.value = t;
    membraneUniforms.uTime.value = t;

    const sp = scrollProgress;
    let targetX: number, targetY: number, targetScale: number, targetAlpha: number;

    if (sp < 0.15) {
      const ease = 1 - Math.pow(1 - sp / 0.15, 3);
      targetX = 0;
      targetY = -2.8 + ease * 0.15;
      targetScale = 1.0;
      targetAlpha = 1;
    } else if (sp < 0.4) {
      const ease = 1 - Math.pow(1 - (sp - 0.15) / 0.25, 3);
      targetX = ease * 2.8;
      targetY = -2.05 + ease * 2.4;
      targetScale = 1.0 - ease * 0.5;
      targetAlpha = 1;
    } else if (sp < 0.7) {
      const tt = (sp - 0.4) / 0.3;
      targetX = 2.8 + Math.sin(t * 0.3) * 0.04;
      targetY = 0.35 + tt * 0.3 + Math.cos(t * 0.25) * 0.03;
      targetScale = 0.5 - tt * 0.1;
      targetAlpha = 1;
    } else {
      const ease = 1 - Math.pow(1 - (sp - 0.7) / 0.3, 3);
      targetX = 2.8 + ease * 0.8;
      targetY = 0.65 - ease * 0.3;
      targetScale = 0.4 - ease * 0.15;
      targetAlpha = Math.max(0, 1 - ease * 1.5);
    }

    targetX += mouseRef.current.x * 0.06;
    targetY += mouseRef.current.y * 0.04;

    sharedUniforms.uAlpha.value += (targetAlpha - sharedUniforms.uAlpha.value) * 0.06;
    sharedUniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
    glowUniforms.uAlpha.value = sharedUniforms.uAlpha.value;
    membraneUniforms.uAlpha.value = sharedUniforms.uAlpha.value;

    if (groupRef.current) {
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.035;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.035;
      const s = groupRef.current.scale.x;
      const ns = s + (targetScale - s) * 0.035;
      groupRef.current.scale.set(ns, ns, ns);
      groupRef.current.rotation.y += delta * 0.04;
      groupRef.current.rotation.x += delta * 0.015;
    }
  });

  const R = 2.2; // outer membrane radius
  const nucleusR = R * 0.48; // inner nucleus ~ 48% of cell

  const nucleusMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: nucleusVertex,
    fragmentShader: nucleusFragment,
    uniforms: sharedUniforms,
    transparent: true,
    depthWrite: true,
  }), []);

  const membraneMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: membraneVertex,
    fragmentShader: membraneFragment,
    uniforms: membraneUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  const glowMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: glowUniforms,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  return (
    <group ref={groupRef}>
      {/* Atmospheric glow — outermost */}
      <mesh ref={glowRef} material={glowMat} visible={true}>
        <sphereGeometry args={[R * 1.3, 48, 48]} />
      </mesh>

      {/* Outer membrane — translucent shell */}
      <mesh ref={membraneRef} material={membraneMat} renderOrder={2}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>

      {/* Inner nucleus — opaque warm core */}
      <mesh ref={nucleusRef} material={nucleusMat} renderOrder={1}>
        <sphereGeometry args={[nucleusR, 48, 48]} />
      </mesh>
    </group>
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
        <CellScene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
