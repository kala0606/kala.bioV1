"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* ---- time of day → 0 (deep night) .. 1 (midday) ---- */
function dayFactor() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  // peak at 13:00, trough at 01:00
  return 0.5 - 0.5 * Math.cos(((h - 1) / 24) * Math.PI * 2);
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uDay;
  uniform float uScroll;
  uniform vec2  uRes;

  // hash / value noise / fbm
  vec2 hash2(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(dot(hash2(i+vec2(0.0,0.0)), f-vec2(0.0,0.0)),
                   dot(hash2(i+vec2(1.0,0.0)), f-vec2(1.0,0.0)), u.x),
               mix(dot(hash2(i+vec2(0.0,1.0)), f-vec2(0.0,1.0)),
                   dot(hash2(i+vec2(1.0,1.0)), f-vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;

    float t = uTime * 0.04;

    // domain warp
    vec2 q = vec2(fbm(p*1.4 + t), fbm(p*1.4 + vec2(5.2,1.3) - t));
    vec2 r = vec2(fbm(p*1.4 + 2.0*q + vec2(1.7,9.2) + 0.15*t),
                  fbm(p*1.4 + 2.0*q + vec2(8.3,2.8) - 0.12*t));
    float f = fbm(p*1.4 + 3.0*r);

    // palette — warm ink -> saffron, cooled toward indigo at night
    vec3 ink     = vec3(0.039, 0.035, 0.031);
    vec3 saffron = vec3(0.894, 0.627, 0.298);
    vec3 indigo  = vec3(0.105, 0.105, 0.196);

    vec3 glow = mix(indigo, saffron, smoothstep(0.0, 1.0, uDay));
    float density = smoothstep(0.15, 0.85, f);

    vec3 col = ink;
    col = mix(col, glow * 0.55, density * (0.35 + 0.25*uDay));
    col += saffron * pow(density, 3.0) * (0.12 + 0.1*uDay);

    // vignette + scroll drift darkening
    float vig = smoothstep(1.25, 0.2, length(p));
    col *= 0.55 + 0.45*vig;
    col *= 1.0 - 0.12*uScroll;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Field() {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();
  const target = useRef(dayFactor());

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDay: { value: dayFactor() },
      uScroll: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useFrame((state) => {
    if (!ref.current) return;
    const u = ref.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uRes.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    // re-sample time-of-day occasionally, ease toward it
    if (Math.floor(state.clock.elapsedTime) % 30 === 0)
      target.current = dayFactor();
    u.uDay.value += (target.current - u.uDay.value) * 0.02;
    u.uScroll.value =
      typeof window !== "undefined"
        ? Math.min(
            1,
            window.scrollY / (document.body.scrollHeight - window.innerHeight || 1)
          )
        : 0;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function Background() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Field />
      </Canvas>
    </div>
  );
}
