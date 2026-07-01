"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneKey } from "@/lib/projects";

const COUNT = 9000;

/** distinct point formation per project — the bespoke signature of each piece */
function formation(scene: SceneKey): Float32Array {
  const a = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const t = i / COUNT;
    let x = 0,
      y = 0,
      z = 0;
    switch (scene) {
      case "karma": {
        // karmic chain — a coiled torus, consequence following cause
        const u = t * Math.PI * 2 * 12;
        const v = t * Math.PI * 2;
        const R = 1.4,
          r = 0.5;
        x = (R + r * Math.cos(u)) * Math.cos(v);
        y = (R + r * Math.cos(u)) * Math.sin(v);
        z = r * Math.sin(u);
        break;
      }
      case "yoni": {
        // rhodonea rose — blooming radial petals
        const k = 5;
        const th = t * Math.PI * 2 * k;
        const rad = Math.cos(k * th) * 1.6;
        x = rad * Math.cos(th);
        y = rad * Math.sin(th);
        z = (Math.random() - 0.5) * 0.25;
        break;
      }
      case "timelines": {
        // rows of hours, columns of minutes
        const cols = 60,
          rows = 24;
        const c = i % cols;
        const rrow = Math.floor((i / cols) % rows);
        x = (c / cols - 0.5) * 3.4;
        y = (rrow / rows - 0.5) * 2.2;
        z = Math.sin(c * 0.4 + rrow) * 0.15;
        break;
      }
      case "silent-night": {
        // concentric pulse rings
        const ring = Math.floor(t * 16);
        const th = (i % 600) / 600 * Math.PI * 2;
        const rad = 0.2 + ring * 0.11;
        x = rad * Math.cos(th);
        y = rad * Math.sin(th);
        z = (Math.random() - 0.5) * 0.1;
        break;
      }
      case "more-than-human": {
        // lissajous — phrases within a raag
        const th = t * Math.PI * 2 * 3;
        x = Math.sin(3 * th + Math.PI / 2) * 1.6;
        y = Math.sin(2 * th) * 1.3;
        z = Math.sin(5 * th) * 0.4;
        break;
      }
      case "pushpak":
      default: {
        // distributed flock on a sphere shell
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        const rad = 1.3 + Math.random() * 0.2;
        x = rad * Math.sin(phi) * Math.cos(theta);
        y = rad * Math.sin(phi) * Math.sin(theta);
        z = rad * Math.cos(phi);
        break;
      }
    }
    a[i * 3] = x;
    a[i * 3 + 1] = y;
    a[i * 3 + 2] = z;
  }
  return a;
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aRnd;
  varying float vR;
  // curl-ish drift
  void main(){
    vR = aRnd;
    vec3 p = position;
    float d = uTime * 0.3 + aRnd * 6.2831;
    p.x += sin(d + p.y * 1.5) * 0.04;
    p.y += cos(d + p.z * 1.5) * 0.04;
    p.z += sin(d + p.x * 1.5) * 0.04;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 / -mv.z) * (0.6 + 0.4 * aRnd);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  varying float vR;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float dd = dot(c, c);
    if (dd > 0.25) discard;
    float alpha = smoothstep(0.25, 0.0, dd);
    // ~70% ink, ~30% Mondrian accent
    vec3 col = mix(uColor, uColor2, step(0.7, vR));
    gl_FragColor = vec4(col, alpha * 0.85);
  }
`;

function Points({ scene, hue }: { scene: SceneKey; hue: number }) {
  const ref = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const { positions, randoms } = useMemo(() => {
    const positions = formation(scene);
    const randoms = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) randoms[i] = Math.random();
    return { positions, randoms };
  }, [scene]);

  const uniforms = useMemo(() => {
    // pen-plot look on paper: mostly black ink, with a true Mondrian colour pop.
    // snap each project's hue to the nearest De Stijl primary.
    const ink = new THREE.Color(0.067, 0.067, 0.063);
    const RED = new THREE.Color("#db261f");
    const YELLOW = new THREE.Color("#f4c20d");
    const BLUE = new THREE.Color("#2454c7");
    const accent =
      hue >= 300 || hue < 20 ? RED : hue < 90 ? YELLOW : BLUE;
    return {
      uTime: { value: 0 },
      uSize: { value: 16 },
      uColor: { value: ink },
      uColor2: { value: accent },
    };
  }, [hue]);

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.08;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.18;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRnd" args={[randoms, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export default function ProjectScene({
  scene,
  hue,
}: {
  scene: SceneKey;
  hue: number;
}) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Points scene={scene} hue={hue} />
    </Canvas>
  );
}
