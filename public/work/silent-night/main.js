import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm";
import * as Tone from "tone";

// ─── web embed params (added for ujjwalagarwal.com) ───
const QS = new URLSearchParams(location.search);
const HIDE_UI = QS.get("ui") === "0";
const LITE = QS.get("lite") === "1"; // cheap mode for preset thumbnails (no bloom, dpr 1)
const SOUND = QS.get("sound") === "1"; // show a minimal "enable sound" (mic) button
const START_PRESET = QS.get("preset");
if (HIDE_UI) {
  const _s = document.createElement("style");
  _s.textContent = "#ui,.lil-gui{display:none!important}";
  document.documentElement.appendChild(_s);
}

const app = document.getElementById("app");
const infoEl = document.getElementById("info");
const playBtn = document.getElementById("playBtn");
const micBtn = document.getElementById("micBtn");
const fileInput = document.getElementById("fileInput");
const randomiserBtn = document.getElementById("randomiserBtn");
const saveBtn = document.getElementById("saveBtn");
const presetInput = document.getElementById("presetInput");

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
renderer.setPixelRatio(LITE ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.autoClear = false;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 30);
camera.position.set(0, 0, 4.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.enableZoom = false; // let wheel/scroll chain past the embed to the page
if (LITE) controls.enabled = false; // preset thumbnails are non-interactive

// ─── Render targets ───
const pxr = LITE ? 1 : Math.min(window.devicePixelRatio, 2);
let W = Math.floor(window.innerWidth * pxr);
let H = Math.floor(window.innerHeight * pxr);

function makeRT(w, h, opts) {
  return new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    ...opts,
  });
}

let sceneRT = makeRT(W, H);
let bloomRT0 = makeRT(Math.floor(W / 2), Math.floor(H / 2));
let bloomRT1 = makeRT(Math.floor(W / 2), Math.floor(H / 2));
let bloomRT2 = makeRT(Math.floor(W / 4), Math.floor(H / 4));
let bloomRT3 = makeRT(Math.floor(W / 4), Math.floor(H / 4));

// ─── Fullscreen quad helper ───
const fsQuadGeo = new THREE.PlaneGeometry(2, 2);
const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function fsPass(mat, target) {
  const mesh = new THREE.Mesh(fsQuadGeo, mat);
  const sc = new THREE.Scene();
  sc.add(mesh);
  renderer.setRenderTarget(target || null);
  renderer.render(sc, fsCamera);
  mesh.geometry = undefined;
  sc.remove(mesh);
}

// ─── Blur shader ───
const blurMat = new THREE.ShaderMaterial({
  uniforms: {
    tInput: { value: null },
    uDirection: { value: new THREE.Vector2(1, 0) },
    uResolution: { value: new THREE.Vector2(W, H) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
  fragmentShader: `
    precision highp float;
    uniform sampler2D tInput;
    uniform vec2 uDirection;
    uniform vec2 uResolution;
    varying vec2 vUv;
    void main(){
      vec2 px = uDirection / uResolution;
      vec4 s = vec4(0.0);
      s += texture2D(tInput, vUv - 4.0*px) * 0.0162;
      s += texture2D(tInput, vUv - 3.0*px) * 0.0540;
      s += texture2D(tInput, vUv - 2.0*px) * 0.1218;
      s += texture2D(tInput, vUv - 1.0*px) * 0.1950;
      s += texture2D(tInput, vUv)           * 0.2261;
      s += texture2D(tInput, vUv + 1.0*px) * 0.1950;
      s += texture2D(tInput, vUv + 2.0*px) * 0.1218;
      s += texture2D(tInput, vUv + 3.0*px) * 0.0540;
      s += texture2D(tInput, vUv + 4.0*px) * 0.0162;
      gl_FragColor = s;
    }
  `,
  depthWrite: false,
  depthTest: false,
});

// ─── Composite post-process shader ───
const postParams = {
  bloomStrength: 1.6,
  bloomStrength2: 0.8,
  grainAmount: 0.42,
  grainSize: 1.8,
  glowIntensity: 1.3,
  vignetteStrength: 0.35,
  exposure: 1.15,
  contrast: 1.12,
};

const compositeMat = new THREE.ShaderMaterial({
  uniforms: {
    tScene: { value: null },
    tBloom1: { value: null },
    tBloom2: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(W, H) },
    uBloomStrength: { value: postParams.bloomStrength },
    uBloomStrength2: { value: postParams.bloomStrength2 },
    uGrainAmount: { value: postParams.grainAmount },
    uGrainSize: { value: postParams.grainSize },
    uGlowIntensity: { value: postParams.glowIntensity },
    uVignetteStrength: { value: postParams.vignetteStrength },
    uExposure: { value: postParams.exposure },
    uContrast: { value: postParams.contrast },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
  fragmentShader: `
    precision highp float;
    uniform sampler2D tScene;
    uniform sampler2D tBloom1;
    uniform sampler2D tBloom2;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uBloomStrength;
    uniform float uBloomStrength2;
    uniform float uGrainAmount;
    uniform float uGrainSize;
    uniform float uGlowIntensity;
    uniform float uVignetteStrength;
    uniform float uExposure;
    uniform float uContrast;
    varying vec2 vUv;

    float hash12(vec2 p){
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float grain(vec2 uv, float t){
      vec2 g = floor(uv * uResolution / uGrainSize);
      return hash12(g + vec2(t * 7.43, t * -3.17));
    }

    void main(){
      vec4 scene = texture2D(tScene, vUv);
      vec4 bloom1 = texture2D(tBloom1, vUv);
      vec4 bloom2 = texture2D(tBloom2, vUv);

      vec3 col = scene.rgb;
      col += bloom1.rgb * uBloomStrength;
      col += bloom2.rgb * uBloomStrength2;

      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += col * lum * uGlowIntensity * 0.5;

      col *= uExposure;
      col = (col - 0.5) * uContrast + 0.5;

      float n = grain(vUv, uTime);
      float grainMask = mix(1.0, n, uGrainAmount);
      col *= grainMask;

      float n2 = grain(vUv + vec2(0.37, 0.71), uTime * 1.3);
      col += (n2 - 0.5) * uGrainAmount * 0.15;

      vec2 vc = vUv - 0.5;
      float vignette = 1.0 - dot(vc, vc) * uVignetteStrength * 2.0;
      col *= vignette;

      col = clamp(col, 0.0, 1.0);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  depthWrite: false,
  depthTest: false,
});

// ─── Particles: grid in XZ plane, Y = Perlin height (ref-style wave) ───
const PARTICLE_COUNT = 165000;
const GRID_W = 412;
const GRID_H = 401;
const PLANE_SIZE = 8;
const positions = new Float32Array(PARTICLE_COUNT * 3);
const seeds = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const i3 = i * 3;
  const gx = i % GRID_W;
  const gz = Math.floor(i / GRID_W) % GRID_H;
  const u = (gx / (GRID_W - 1)) * 2.0 - 1.0;
  const v = (gz / (GRID_H - 1)) * 2.0 - 1.0;
  positions[i3] = u * PLANE_SIZE * 0.5;
  positions[i3 + 1] = 0;
  positions[i3 + 2] = v * PLANE_SIZE * 0.5;
  seeds[i] = Math.random() * 1000;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

const uniforms = {
  uTime: { value: 0 },
  uLow: { value: 0 },
  uMid: { value: 0 },
  uHigh: { value: 0 },
  uAmplitude: { value: 0 },   // 0–1 from FFT: wave height + glow (set in animate())
  uSoundAccum: { value: 0 }, // cumulative → mapped for 3D noise Z (set in animate())
  uFlowX: { value: 0 },      // horizontal offset so waves move left (set in animate())
  uBaseSize: { value: 1.05 },
  uPixelRatio: { value: pxr },
  uRidgeScale: { value: 0.86 },
  uRidgeThreshold: { value: 0.09 },
  uGrainAmount: { value: 0.78 },
  uBrightness: { value: 0.95 },
  uWarpScale: { value: 0.05 },
  uWarpStrength: { value: 0.35 },
  uHeightScale: { value: 0.08 },
  uHeightAmp: { value: 1.2 },
  uTintColor: { value: new THREE.Vector3(1, 1, 1) },
  uTintShadow: { value: new THREE.Vector3(0, 0, 0) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    precision highp float;

    uniform float uTime, uLow, uMid, uHigh, uAmplitude, uSoundAccum, uFlowX;
    uniform float uBaseSize, uPixelRatio, uRidgeScale, uRidgeThreshold;
    uniform float uWarpScale, uWarpStrength, uHeightScale, uHeightAmp;

    attribute float aSeed;

    varying float vMask;
    varying float vSpark;
    varying float vTone;
    varying float vStreak;

    float hash11(float p){
      p=fract(p*0.1031); p*=p+33.33; p*=p+p; return fract(p);
    }
    float hash21(vec2 p){
      vec3 p3=fract(vec3(p.xyx)*0.1031);
      p3+=dot(p3,p3.yzx+33.33);
      return fract((p3.x+p3.y)*p3.z);
    }
    float hash31(vec3 p){
      vec3 q = fract(p * 0.1031);
      q += dot(q, q.yzx + 33.33);
      return fract((q.x + q.y) * q.z);
    }
    float noise3(vec3 p){
      vec3 i = floor(p), f = fract(p), u = f*f*(3.0-2.0*f);
      float n000 = hash31(i);
      float n100 = hash31(i + vec3(1,0,0));
      float n010 = hash31(i + vec3(0,1,0));
      float n110 = hash31(i + vec3(1,1,0));
      float n001 = hash31(i + vec3(0,0,1));
      float n101 = hash31(i + vec3(1,0,1));
      float n011 = hash31(i + vec3(0,1,1));
      float n111 = hash31(i + vec3(1,1,1));
      return mix(
        mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
        mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
        u.z
      );
    }
    float fbm3(vec3 p){
      float v = 0.0, amp = 0.5;
      for(int i = 0; i < 5; i++){
        v += amp * noise3(p);
        p = p * 2.03 + vec3(11.7, 8.4, 3.17);
        amp *= 0.52;
      }
      return v;
    }

    void main(){
      vec3 pos = position;
      float t = uTime * 0.2;
      vec2 domain = pos.xz;
      domain.x -= uFlowX;
      float noiseZ = uSoundAccum;

      vec3 warpP = vec3(domain * uWarpScale + vec2(aSeed * 0.01, 0.0), noiseZ);
      float warp = uWarpStrength * uAmplitude;
      float ox = (noise3(warpP) - 0.5) * 2.0 * warp;
      float oz = (noise3(vec3(domain * uWarpScale + vec2(5.2, 10.3) + aSeed * 0.01, noiseZ)) - 0.5) * 2.0 * warp;
      vec2 warpedXZ = domain + vec2(ox, oz);

      vec3 heightP = vec3(warpedXZ * uHeightScale + vec2(0.0, t), noiseZ);
      float heightNoise = fbm3(heightP);
      float waveHeight = uHeightAmp * (1.0 + uAmplitude * 0.6);
      pos.y = waveHeight * (heightNoise - 0.5);

      float elev = (heightNoise - 0.5) * 2.0;
      vec3 ridgeP = vec3(warpedXZ * uRidgeScale + vec2(0.0, t * 0.4), noiseZ);
      float ridges = abs(fbm3(ridgeP) - 0.52);
      float vein = smoothstep(uRidgeThreshold, 0.0, ridges);

      float mask = clamp(vein * 0.9 + elev * 0.3, 0.0, 1.0);
      float sparkle = hash11(aSeed + floor(uTime * 12.0));
      float sparkMask = smoothstep(0.7 - uHigh * 0.2, 1.0, sparkle);

      float base = uBaseSize * (1.0 + uAmplitude * 0.8);
      float ps = base * (0.5 + mask * 0.8 + sparkMask * uHigh * 0.5);
      ps *= uPixelRatio;

      vMask = mask;
      vSpark = sparkMask;
      vStreak = 0.0;
      vTone = clamp(mask * 0.9 + sparkMask * 0.5 + uHigh * 0.15, 0.0, 1.0);

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = max(ps, 0.2);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform float uTime, uHigh, uAmplitude, uGrainAmount, uBrightness;
    uniform vec3 uTintColor;
    uniform vec3 uTintShadow;
    varying float vMask, vSpark, vTone, vStreak;

    float hash21(vec2 p){
      vec3 p3=fract(vec3(p.xyx)*0.1031);
      p3+=dot(p3,p3.yzx+33.33);
      return fract((p3.x+p3.y)*p3.z);
    }

    void main(){
      vec2 uv = gl_PointCoord*2.0-1.0;
      float r2 = dot(uv,uv);
      if(r2 > 1.0) discard;

      float falloff = exp(-r2*3.8);
      float core = exp(-r2*10.5);

      float grain = hash21(gl_FragCoord.xy*0.47+vec2(uTime*9.0,uTime*-7.0));
      float dither = smoothstep(0.25-uHigh*0.1, 1.0, grain);

      float alpha = falloff*(0.22+vMask*1.05+vSpark*0.75+core*0.7+vStreak*0.55);
      alpha *= mix(1.0-uGrainAmount, 1.0, dither);
      alpha *= (0.62 + uAmplitude * 0.9);
      alpha = clamp(alpha, 0.0, 1.0);

      float tone = clamp(vTone+core*0.5, 0.0, 1.0);
      vec3 color = mix(uTintShadow, uTintColor, tone) * uBrightness;

      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// ─── Spatial audio: grid position helper (no click selection) ───
function gridToWorld(gx, gz) {
  const u = (gx / (GRID_W - 1)) * 2 - 1;
  const v = (gz / (GRID_H - 1)) * 2 - 1;
  return new THREE.Vector3(u * PLANE_SIZE * 0.5, 0, v * PLANE_SIZE * 0.5);
}
function hash11(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Parameters (only those used by shaders + audio) ───
const params = {
  background: "#000000",
  baseSize: 1.05,
  brightness: 0.95,
  grainAmount: 0.78,
  ridgeScale: 0.86,
  ridgeThreshold: 0.09,
  warpScale: 0.05,
  warpStrength: 0.35,
  heightScale: 0.08,
  heightAmp: 1.2,
  tintTeal: "#ffffff",
  tintBlue: "#000000",
  fftSmoothing: 0.84,
  lowEndHz: 170,
  midEndHz: 2300,
  highEndHz: 11000,
  lowGain: 1.2,
  midGain: 1.0,
  highGain: 1.0,
  energyLowMix: 0.42,
  energyMidMix: 0.35,
  energyHighMix: 0.23,
  fftResponse: 0.18,
  soundAccumAdd: 0.06,
  flowSpeed: 1.0,
  noiseZScale: 0.012,
  spatialAudioEnabled: true,
  spatialNoiseType: "brown",
  spatialFilterLowHz: 80,
  spatialFilterHighHz: 4000,
  spatialGain: 0.35,
  spatialSpread: 1,
  spatialSineFundamentalHz: 110,
  spatialSineGain: 0.2,
  spatialSinePhase: 0,
  spatialSinePhaseSpread: 1,
  spatialSineDetuneSpread: 0,
};

function clamp(v, a, b) {
  return Math.min(Math.max(v, a), b);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToVec3(hex) {
  if (hex == null || typeof hex !== "string") return new THREE.Vector3(0, 0, 0);
  const h = hex.replace(/^#/, "").trim();
  if (h.length !== 6) return new THREE.Vector3(0, 0, 0);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return new THREE.Vector3(
    (isNaN(r) ? 0 : r) / 255,
    (isNaN(g) ? 0 : g) / 255,
    (isNaN(b) ? 0 : b) / 255
  );
}

function applyVisualUniforms() {
  uniforms.uBaseSize.value = params.baseSize;
  uniforms.uBrightness.value = params.brightness;
  uniforms.uGrainAmount.value = params.grainAmount;
  uniforms.uRidgeScale.value = params.ridgeScale;
  uniforms.uRidgeThreshold.value = params.ridgeThreshold;
  uniforms.uWarpScale.value = params.warpScale;
  uniforms.uWarpStrength.value = params.warpStrength;
  uniforms.uHeightScale.value = params.heightScale;
  uniforms.uHeightAmp.value = params.heightAmp;
  uniforms.uTintColor.value.copy(hexToVec3(params.tintTeal));
  uniforms.uTintShadow.value.copy(hexToVec3(params.tintBlue));
  renderer.setClearColor(new THREE.Color(params.background), 1);
}

function applyPostUniforms() {
  compositeMat.uniforms.uBloomStrength.value = postParams.bloomStrength;
  compositeMat.uniforms.uBloomStrength2.value = postParams.bloomStrength2;
  compositeMat.uniforms.uGrainAmount.value = postParams.grainAmount;
  compositeMat.uniforms.uGrainSize.value = postParams.grainSize;
  compositeMat.uniforms.uGlowIntensity.value = postParams.glowIntensity;
  compositeMat.uniforms.uVignetteStrength.value = postParams.vignetteStrength;
  compositeMat.uniforms.uExposure.value = postParams.exposure;
  compositeMat.uniforms.uContrast.value = postParams.contrast;
}

function randomInRange(min, max, step = 0.01) {
  if (step > 0) {
    const steps = Math.round((max - min) / step);
    return min + Math.floor(Math.random() * (steps + 1)) * step;
  }
  return min + Math.random() * (max - min);
}

function randomBlackWhite() {
  return Math.random() < 0.5 ? "#000000" : "#ffffff";
}

function randomisePreset() {
  params.background = randomBlackWhite();
  params.baseSize = randomInRange(0.3, 3, 0.01);
  params.brightness = randomInRange(0.2, 1.6, 0.01);
  params.grainAmount = randomInRange(0, 1, 0.01);
  params.ridgeScale = randomInRange(0.2, 1.6, 0.01);
  params.ridgeThreshold = randomInRange(0.01, 0.3, 0.005);
  params.warpScale = randomInRange(0.01, 0.2, 0.005);
  params.warpStrength = randomInRange(0, 1.2, 0.01);
  params.heightScale = randomInRange(0.02, 0.2, 0.005);
  params.heightAmp = randomInRange(0, 1.2, 0.01);
  params.tintTeal = randomBlackWhite();
  params.tintBlue = randomBlackWhite();
  params.fftSmoothing = randomInRange(0, 0.98, 0.01);
  params.lowEndHz = Math.round(randomInRange(60, 500, 1));
  params.midEndHz = Math.round(randomInRange(400, 5000, 1));
  params.highEndHz = Math.round(randomInRange(2000, 18000, 1));
  params.lowGain = randomInRange(0, 2.8, 0.01);
  params.midGain = randomInRange(0, 2.8, 0.01);
  params.highGain = randomInRange(0, 2.8, 0.01);
  params.energyLowMix = randomInRange(0.2, 0.6, 0.01);
  params.energyMidMix = randomInRange(0.2, 0.5, 0.01);
  params.energyHighMix = randomInRange(0.2, 0.5, 0.01);
  params.fftResponse = randomInRange(0.01, 0.8, 0.005);
  params.soundAccumAdd = randomInRange(0, 0.5, 0.01);
  params.flowSpeed = randomInRange(0, 2, 0.05);
  params.noiseZScale = randomInRange(0.001, 0.05, 0.001);

  postParams.bloomStrength = randomInRange(0, 4, 0.01);
  postParams.bloomStrength2 = randomInRange(0, 3, 0.01);
  postParams.grainAmount = randomInRange(0, 1, 0.01);
  postParams.grainSize = randomInRange(0.5, 5, 0.1);
  postParams.glowIntensity = randomInRange(0, 3, 0.01);
  postParams.vignetteStrength = randomInRange(0, 1, 0.01);
  postParams.exposure = randomInRange(0.5, 2.5, 0.01);
  postParams.contrast = randomInRange(0.5, 2, 0.01);

  // Spatial noise sound (re-randomise and reinit so new type/filters apply)
  params.spatialNoiseType = ["white", "pink", "brown"][Math.floor(Math.random() * 3)];
  params.spatialFilterLowHz = Math.round(randomInRange(40, 400, 1));
  params.spatialFilterHighHz = Math.round(randomInRange(800, 8000, 10));
  params.spatialGain = randomInRange(0.15, 0.6, 0.01);
  params.spatialSpread = randomInRange(0.5, 1.5, 0.01);
  params.spatialSineFundamentalHz = Math.round(randomInRange(55, 330, 1));
  params.spatialSineGain = randomInRange(0.05, 0.45, 0.01);
  params.spatialSinePhase = randomInRange(0, 1, 0.01);
  params.spatialSinePhaseSpread = randomInRange(0.2, 1.5, 0.05);
  params.spatialSineDetuneSpread = Math.round(randomInRange(0, 50, 1));

  if (spatialSynths && audioContext) {
    spatialSynths.voices.forEach((v) => {
      try { v.noise.stop(); v.noise.dispose(); } catch (_) {}
      try { v.filter.dispose(); v.vol.dispose(); v.panner.dispose(); } catch (_) {}
    });
    spatialSynths.sineVoices.forEach((v) => {
      try { v.osc.stop(); v.osc.dispose(); } catch (_) {}
      try { v.vol.dispose(); v.panner.dispose(); } catch (_) {}
    });
    spatialSynths = null;
    initSpatialSynths();
  }

  applyVisualUniforms();
  applyPostUniforms();
  updateGuiDisplay();
  if (infoEl) infoEl.textContent = "Preset randomised.";
}

function savePreset() {
  const cameraState = {
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
  };
  const preset = { params: { ...params }, postParams: { ...postParams }, camera: cameraState };
  const json = JSON.stringify(preset, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const name = "noise-shader-preset-" + new Date().toISOString().slice(0, 19).replace(/:/g, "-") + ".json";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  if (infoEl) infoEl.textContent = "Preset saved.";
}

function loadPresetFromObject(preset) {
  if (preset.params) Object.assign(params, preset.params);
  if (preset.postParams) Object.assign(postParams, preset.postParams);
  if (preset.camera) {
    const { position, target } = preset.camera;
    if (position) camera.position.set(position.x, position.y, position.z);
    if (target) controls.target.set(target.x, target.y, target.z);
  }
  applyVisualUniforms();
  applyPostUniforms();
  updateGuiDisplay();
  if (infoEl) infoEl.textContent = "Preset loaded.";
}

function getCurrentPreset() {
  const cameraState = {
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
  };
  return { params: { ...params }, postParams: { ...postParams }, camera: cameraState };
}

const PRESETS_DIR = "presets/";
let presetManifest = null;

async function loadPresetManifest() {
  if (presetManifest !== null) return presetManifest;
  try {
    const res = await fetch(PRESETS_DIR + "manifest.json");
    if (res.ok) presetManifest = await res.json();
  } catch (_) {}
  return presetManifest;
}

function getPresetFilename(index) {
  if (presetManifest && presetManifest[String(index)]) return presetManifest[String(index)];
  return `${index}.json`;
}

async function loadPresetByKey(index) {
  await loadPresetManifest();
  const filename = getPresetFilename(index);
  try {
    const res = await fetch(PRESETS_DIR + filename);
    if (!res.ok) throw new Error(res.status === 404 ? "Not found" : res.statusText);
    const preset = await res.json();
    loadPresetFromObject(preset);
    if (infoEl) infoEl.textContent = `Loaded preset ${index} (${filename}).`;
    return true;
  } catch (err) {
    if (presetSlots[index]) {
      loadPresetFromObject(presetSlots[index]);
      if (infoEl) infoEl.textContent = `Loaded slot ${index} (memory).`;
      return true;
    }
    if (infoEl) infoEl.textContent = `Preset ${index} not found (${filename}). Shift+${index} to save to slot.`;
    return false;
  }
}

const presetSlots = Array(10).fill(null);

function onPresetKeydown(e) {
  if (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
  const key = e.key;
  if (key < "0" || key > "9") return;
  const index = parseInt(key, 10);
  if (e.shiftKey) {
    presetSlots[index] = getCurrentPreset();
    if (infoEl) infoEl.textContent = `Saved to slot ${index}.`;
  } else {
    loadPresetByKey(index);
  }
}

window.addEventListener("keydown", onPresetKeydown);

let gui = null;
function updateGuiDisplay() {
  if (gui && gui.controllersRecursive) gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
}

// ─── GUI ───
function setupGui() {
  gui = new GUI({ title: "Grain + Glow Shader", width: 350 });

  const post = gui.addFolder("Post-Process");
  post.add(postParams, "bloomStrength", 0, 4, 0.01).name("Bloom 1").onChange(applyPostUniforms);
  post.add(postParams, "bloomStrength2", 0, 3, 0.01).name("Bloom 2 (wide)").onChange(applyPostUniforms);
  post.add(postParams, "grainAmount", 0, 1, 0.01).name("Film Grain").onChange(applyPostUniforms);
  post.add(postParams, "grainSize", 0.5, 5, 0.1).name("Grain Size").onChange(applyPostUniforms);
  post.add(postParams, "glowIntensity", 0, 3, 0.01).name("Glow Intensity").onChange(applyPostUniforms);
  post.add(postParams, "vignetteStrength", 0, 1, 0.01).name("Vignette").onChange(applyPostUniforms);
  post.add(postParams, "exposure", 0.5, 2.5, 0.01).name("Exposure").onChange(applyPostUniforms);
  post.add(postParams, "contrast", 0.5, 2, 0.01).name("Contrast").onChange(applyPostUniforms);
  post.open();

  const visual = gui.addFolder("Particle");
  visual.addColor(params, "background").name("Background").onChange(applyVisualUniforms);
  visual.add(params, "baseSize", 0.3, 3, 0.01).name("Base Size").onChange(applyVisualUniforms);
  visual.add(params, "brightness", 0.2, 1.6, 0.01).name("Brightness").onChange(applyVisualUniforms);
  visual.add(params, "grainAmount", 0, 1, 0.01).name("Grain").onChange(applyVisualUniforms);
  visual.add(params, "ridgeScale", 0.2, 1.6, 0.01).name("Ridge Scale").onChange(applyVisualUniforms);
  visual.add(params, "ridgeThreshold", 0.01, 0.3, 0.005).name("Ridge Thresh").onChange(applyVisualUniforms);
  visual.add(params, "warpScale", 0.01, 0.2, 0.005).name("Warp Scale").onChange(applyVisualUniforms);
  visual.add(params, "warpStrength", 0, 1.2, 0.01).name("Warp Strength").onChange(applyVisualUniforms);
  visual.add(params, "heightScale", 0.02, 0.2, 0.005).name("Height Scale").onChange(applyVisualUniforms);
  visual.add(params, "heightAmp", 0, 1.2, 0.01).name("Height Amp").onChange(applyVisualUniforms);
  visual.addColor(params, "tintTeal").name("Tint (bright)").onChange(applyVisualUniforms);
  visual.addColor(params, "tintBlue").name("Tint (shadow)").onChange(applyVisualUniforms);

  const audio = gui.addFolder("Audio");
  audio.add(params, "fftSmoothing", 0, 0.98, 0.001).name("FFT Smooth");
  audio.add(params, "lowEndHz", 60, 500, 1).name("Low Hz");
  audio.add(params, "midEndHz", 400, 5000, 1).name("Mid Hz");
  audio.add(params, "highEndHz", 2000, 18000, 1).name("High Hz");
  audio.add(params, "lowGain", 0, 2.8, 0.01).name("Low Gain");
  audio.add(params, "midGain", 0, 2.8, 0.01).name("Mid Gain");
  audio.add(params, "highGain", 0, 2.8, 0.01).name("High Gain");
  audio.add(params, "fftResponse", 0.01, 0.8, 0.005).name("FFT Response");
  audio.add(params, "soundAccumAdd", 0, 0.5, 0.01).name("Accum Add");
  audio.add(params, "flowSpeed", 0, 2, 0.05).name("Flow (left) Speed");
  audio.add(params, "noiseZScale", 0.001, 0.05, 0.001).name("Noise Z Scale");

  const spatial = gui.addFolder("Spatial Noise");
  spatial.add(params, "spatialAudioEnabled").name("Spatial audio on");
  spatial.add(params, "spatialNoiseType", ["white", "pink", "brown"]).name("Noise type");
  spatial.add(params, "spatialFilterLowHz", 40, 800, 10).name("Filter low Hz");
  spatial.add(params, "spatialFilterHighHz", 400, 10000, 50).name("Filter high Hz");
  spatial.add(params, "spatialGain", 0.05, 0.8, 0.01).name("Gain");
  spatial.add(params, "spatialSpread", 0.3, 2, 0.05).name("Spread");
  spatial.add(params, "spatialSineFundamentalHz", 40, 440, 5).name("Sine fund Hz");
  spatial.add(params, "spatialSineGain", 0, 0.6, 0.01).name("Sine gain");
  spatial.add(params, "spatialSinePhase", 0, 1, 0.01).name("Sine phase");
  spatial.add(params, "spatialSinePhaseSpread", 0, 2, 0.05).name("Sine phase spread");
  spatial.add(params, "spatialSineDetuneSpread", 0, 100, 1).name("Sine detune");

  applyVisualUniforms();
  applyPostUniforms();
}

setupGui();

// ─── Audio ───
let audioContext = null;
let analyser = null;
let dataArray = null;
let audioElement = null;
let mediaElementSource = null;
let micStream = null;
let micSource = null;
let currentObjectUrl = null;
let isPlaying = false;

const fft = { low: 0, mid: 0, high: 0, energy: 0 };
let soundAccum = 0;
let flowX = 0;
let animationTime = 0;

function ensureAudioGraph() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (typeof Tone.setContext === "function") Tone.setContext(audioContext);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = params.fftSmoothing;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  const silent = audioContext.createGain();
  silent.gain.value = 0;
  analyser.connect(silent);
  silent.connect(audioContext.destination);
  initSpatialSynths();
}

// ─── Tone.js spatial: noise + sine layers, param-driven, 3D panned ───
const MAX_SPATIAL_VOICES = 32;
const MAX_SINE_VOICES = 16;
let spatialSynths = null;

function initSpatialSynths() {
  if (spatialSynths) return;
  const voices = [];
  const type = params.spatialNoiseType || "brown";
  const low = params.spatialFilterLowHz || 80;
  const high = params.spatialFilterHighHz || 4000;
  const N = MAX_SPATIAL_VOICES;
  for (let i = 0; i < N; i++) {
    const noise = new Tone.Noise(type);
    const band = low + (high - low) * (i / (N - 1 || 1));
    const filter = new Tone.Filter({ frequency: band, type: "bandpass", Q: 2 });
    const vol = new Tone.Volume(-24);
    const panner = new Tone.Panner3D(0, 0, 0).toDestination();
    noise.connect(filter);
    filter.connect(vol);
    vol.connect(panner);
    const gx = Math.floor((i % 8) * (GRID_W / 8));
    const gz = Math.floor(Math.floor(i / 8) * (GRID_H / 4));
    voices.push({ noise, filter, vol, panner, gx, gz, seed: i * 1.618 });
  }
  const sineVoices = [];
  const fund = params.spatialSineFundamentalHz || 110;
  const phaseOffDeg = (params.spatialSinePhase ?? 0) * 360;
  const phaseSpread = params.spatialSinePhaseSpread ?? 1;
  const detuneSpread = params.spatialSineDetuneSpread ?? 0;
  for (let i = 0; i < MAX_SINE_VOICES; i++) {
    const phaseDeg = (i / MAX_SINE_VOICES) * 360 * phaseSpread + phaseOffDeg + hash11(i * 2.917) * 360;
    const detune = detuneSpread ? (hash11(i * 7.13) - 0.5) * 2 * detuneSpread : 0;
    const osc = new Tone.Oscillator({
      frequency: fund * (1 + Math.floor(i / 4)),
      type: "sine",
      phase: phaseDeg,
      detune,
    });
    const vol = new Tone.Volume(-24);
    const panner = new Tone.Panner3D(0, 0, 0).toDestination();
    osc.connect(vol);
    vol.connect(panner);
    const gx = Math.floor((i % 4) * (GRID_W / 4));
    const gz = Math.floor(Math.floor(i / 4) * (GRID_H / 4));
    sineVoices.push({ osc, vol, panner, gx, gz, seed: i * 3.14159 });
  }
  spatialSynths = { voices, sineVoices, inited: true };
  spatialSynths.voices.forEach((v) => v.noise.start());
  spatialSynths.sineVoices.forEach((v) => v.osc.start());
}

function updateSpatialSynths(camera) {
  if (!spatialSynths || !params.spatialAudioEnabled) return;
  const { brightness, heightAmp, warpScale, warpStrength, heightScale, ridgeScale, spatialGain, spatialSpread } = params;
  const low = params.spatialFilterLowHz || 80;
  const high = params.spatialFilterHighHz || 4000;
  const N = spatialSynths.voices.length;

  const ctx = Tone.getContext();
  const listener = (ctx.rawContext && ctx.rawContext.listener) || ctx.listener;
  if (listener && listener.positionX) {
    listener.positionX.value = camera.position.x;
    listener.positionY.value = camera.position.y;
    listener.positionZ.value = camera.position.z;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    listener.forwardX.value = dir.x;
    listener.forwardY.value = dir.y;
    listener.forwardZ.value = dir.z;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    listener.upX.value = up.x;
    listener.upY.value = up.y;
    listener.upZ.value = up.z;
  }

  const baseGainDb = 20 * Math.log10(0.01 + spatialGain * brightness);
  spatialSynths.voices.forEach((v, i) => {
    const band = low + (high - low) * (i / (N - 1 || 1));
    v.filter.frequency.value = band * (0.85 + heightScale * 0.3);
    const pos = gridToWorld(v.gx, v.gz);
    const spread = spatialSpread * (0.9 + warpScale * 2);
    const warpX = (hash11(v.seed + warpScale * 10) - 0.5) * warpStrength * 2;
    const warpZ = (hash11(v.seed + 17 + warpStrength) - 0.5) * warpStrength * 2;
    v.panner.positionX.value = pos.x * spread + warpX;
    v.panner.positionY.value = pos.y + (hash11(v.seed + ridgeScale) - 0.5) * heightAmp * 0.3;
    v.panner.positionZ.value = pos.z * spread + warpZ;
    const voiceGain = 0.6 + 0.4 * hash11(v.seed + heightAmp + warpScale);
    v.vol.volume.value = baseGainDb + (voiceGain - 1) * 8;
  });

  const fund = params.spatialSineFundamentalHz || 110;
  const sineGain = params.spatialSineGain ?? 0.2;
  const sineBaseGainDb = 20 * Math.log10(0.01 + sineGain * brightness);
  spatialSynths.sineVoices.forEach((v, i) => {
    const pos = gridToWorld(v.gx, v.gz);
    const spread = spatialSpread * (0.9 + warpScale * 2);
    const warpX = (hash11(v.seed + warpScale * 10) - 0.5) * warpStrength * 2;
    const warpZ = (hash11(v.seed + 17 + warpStrength) - 0.5) * warpStrength * 2;
    v.panner.positionX.value = pos.x * spread + warpX;
    v.panner.positionY.value = pos.y + (hash11(v.seed + ridgeScale) - 0.5) * heightAmp * 0.3;
    v.panner.positionZ.value = pos.z * spread + warpZ;
    v.osc.frequency.value = fund * (1 + Math.floor(i / 4)) * (0.92 + heightScale * 0.16);
    const voiceGain = 0.5 + 0.5 * hash11(v.seed + heightAmp + warpScale);
    v.vol.volume.value = sineBaseGainDb + (voiceGain - 1) * 6;
  });
}

function freqBinForHz(hz) {
  if (!analyser || !audioContext) return 0;
  return Math.floor((hz / (audioContext.sampleRate * 0.5)) * analyser.frequencyBinCount);
}

function bandAverage(fromHz, toHz) {
  if (!dataArray || !dataArray.length) return 0;
  const from = clamp(freqBinForHz(fromHz), 0, dataArray.length - 1);
  const to = clamp(freqBinForHz(toHz), 0, dataArray.length - 1);
  if (to <= from) return 0;
  let sum = 0;
  for (let i = from; i <= to; i++) sum += dataArray[i];
  return sum / (to - from + 1) / 255;
}

function detachMic() {
  if (micSource) { micSource.disconnect(); micSource = null; }
  if (micStream) { for (const t of micStream.getTracks()) t.stop(); micStream = null; }
}

function attachElementAudio(src) {
  ensureAudioGraph();
  detachMic();
  if (mediaElementSource) { mediaElementSource.disconnect(); mediaElementSource = null; }
  if (audioElement) { audioElement.pause(); audioElement.src = ""; audioElement.load(); }
  audioElement = new Audio();
  audioElement.src = src;
  audioElement.loop = true;
  audioElement.crossOrigin = "anonymous";
  audioElement.preload = "auto";
  mediaElementSource = audioContext.createMediaElementSource(audioElement);
  mediaElementSource.connect(analyser);
  mediaElementSource.connect(audioContext.destination);
}

async function resumeAudio() {
  ensureAudioGraph();
  if (audioContext.state !== "running") await audioContext.resume();
}

async function togglePlay() {
  try {
    await resumeAudio();
    if (!audioElement) { infoEl.textContent = "Load audio first or use mic."; return; }
    if (isPlaying) { audioElement.pause(); isPlaying = false; infoEl.textContent = "Paused."; return; }
    await audioElement.play();
    isPlaying = true;
    infoEl.textContent = "Playing.";
  } catch (err) {
    infoEl.textContent = "Playback blocked. Click again.";
    console.error(err);
  }
}

async function startMic() {
  try {
    await resumeAudio();
    detachMic();
    if (audioElement) { audioElement.pause(); isPlaying = false; }
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(analyser);
    infoEl.textContent = "Mic active.";
  } catch (err) {
    infoEl.textContent = "Mic denied.";
    console.error(err);
  }
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  attachElementAudio(currentObjectUrl);
  infoEl.textContent = `Loaded: ${file.name}`;
});
playBtn.addEventListener("click", togglePlay);
micBtn.addEventListener("click", startMic);
randomiserBtn.addEventListener("click", async () => {
  await resumeAudio();
  randomisePreset();
});
saveBtn.addEventListener("click", savePreset);
presetInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const preset = JSON.parse(reader.result);
      loadPresetFromObject(preset);
    } catch (err) {
      if (infoEl) infoEl.textContent = "Invalid preset file.";
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// ─── Bloom passes ───
function doBlur(src, dst0, dst1, w, h) {
  blurMat.uniforms.uResolution.value.set(w, h);

  blurMat.uniforms.tInput.value = src.texture;
  blurMat.uniforms.uDirection.value.set(1, 0);
  fsPass(blurMat, dst0);

  blurMat.uniforms.tInput.value = dst0.texture;
  blurMat.uniforms.uDirection.value.set(0, 1);
  fsPass(blurMat, dst1);
}

// ─── Resize ───
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  W = Math.floor(w * pxr);
  H = Math.floor(h * pxr);

  sceneRT.setSize(W, H);
  bloomRT0.setSize(Math.floor(W / 2), Math.floor(H / 2));
  bloomRT1.setSize(Math.floor(W / 2), Math.floor(H / 2));
  bloomRT2.setSize(Math.floor(W / 4), Math.floor(H / 4));
  bloomRT3.setSize(Math.floor(W / 4), Math.floor(H / 4));

  compositeMat.uniforms.uResolution.value.set(W, H);
  uniforms.uPixelRatio.value = pxr;
}
window.addEventListener("resize", onResize);

// ─── Animate ───
const clock = new THREE.Clock();
let lastTime = 0;

function animate() {
  const elapsed = clock.getElapsedTime();
  const dt = Math.min(Math.max(elapsed - lastTime, 0.0001), 0.033);
  lastTime = elapsed;

  if (analyser) analyser.smoothingTimeConstant = params.fftSmoothing;

  const lowEnd = Math.min(params.lowEndHz, params.midEndHz - 50);
  const midEnd = Math.max(params.midEndHz, lowEnd + 50);
  const highEnd = Math.max(params.highEndHz, midEnd + 200);

  const hasSound = analyser && dataArray && (isPlaying || micSource);
  if (hasSound) {
    analyser.getByteFrequencyData(dataArray);
    const low = bandAverage(20, lowEnd) * params.lowGain;
    const mid = bandAverage(lowEnd, midEnd) * params.midGain;
    const high = bandAverage(midEnd, highEnd) * params.highGain;
    const energy = clamp(low * params.energyLowMix + mid * params.energyMidMix + high * params.energyHighMix, 0, 1);
    const r = clamp(params.fftResponse, 0.01, 0.99);
    fft.low = lerp(fft.low, low, r);
    fft.mid = lerp(fft.mid, mid, r);
    fft.high = lerp(fft.high, high, r);
    fft.energy = lerp(fft.energy, energy, r + 0.03);
    soundAccum += dt * (1.0 + fft.energy * params.soundAccumAdd);
    flowX += dt * params.flowSpeed * (5* clamp(fft.energy, 0, 1));
    animationTime += dt;
  } else {
    // no audio: keep the field gently alive with a synthetic signal so the
    // piece animates on its own (web embed) — real audio overrides this.
    const e = 0.16 + 0.08 * Math.sin(elapsed * 0.55) + 0.04 * Math.sin(elapsed * 1.7);
    fft.low = lerp(fft.low, e * 0.9, 0.05);
    fft.mid = lerp(fft.mid, e * 0.6, 0.05);
    fft.high = lerp(fft.high, e * 0.45, 0.05);
    fft.energy = lerp(fft.energy, e, 0.05);
    soundAccum += dt * (1.0 + fft.energy * params.soundAccumAdd);
    flowX += dt * params.flowSpeed * (5 * clamp(fft.energy, 0, 1));
    animationTime += dt;
  }

  uniforms.uTime.value = animationTime;
  uniforms.uLow.value = clamp(fft.low, 0, 1.5);
  uniforms.uMid.value = clamp(fft.mid, 0, 1.5);
  uniforms.uHigh.value = clamp(fft.high, 0, 1.5);
  uniforms.uAmplitude.value = clamp(fft.energy, 0, 1);
  uniforms.uSoundAccum.value = Math.sqrt(Math.max(0, soundAccum)) * params.noiseZScale;
  uniforms.uFlowX.value = flowX;

  controls.update();

  if (audioContext) updateSpatialSynths(camera);

  if (LITE) {
    // cheap path for thumbnails: straight render, no bloom/post
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    return;
  }

  // Pass 1: render scene to RT
  renderer.setRenderTarget(sceneRT);
  renderer.clear();
  renderer.render(scene, camera);

  // Pass 2: bloom — half-res blur
  doBlur(sceneRT, bloomRT0, bloomRT1, Math.floor(W / 2), Math.floor(H / 2));

  // Pass 3: bloom — quarter-res blur (wider glow)
  doBlur(bloomRT1, bloomRT2, bloomRT3, Math.floor(W / 4), Math.floor(H / 4));

  // Pass 4: composite to screen
  compositeMat.uniforms.tScene.value = sceneRT.texture;
  compositeMat.uniforms.tBloom1.value = bloomRT1.texture;
  compositeMat.uniforms.tBloom2.value = bloomRT3.texture;
  compositeMat.uniforms.uTime.value = animationTime;

  renderer.setRenderTarget(null);
  renderer.clear();
  fsPass(compositeMat, null);

  requestAnimationFrame(animate);
}

applyVisualUniforms();
applyPostUniforms();
animate();

// web embed: auto-load a preset if requested via ?preset=
if (START_PRESET !== null) {
  const _i =
    START_PRESET === "rand"
      ? Math.floor(Math.random() * 10)
      : parseInt(START_PRESET, 10) || 0;
  loadPresetByKey(_i);
}

// web embed: a single "enable sound" (mic) button for the hero
if (SOUND) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "◢ Enable sound";
  Object.assign(btn.style, {
    position: "fixed",
    left: "50%",
    bottom: "28px",
    transform: "translateX(-50%)",
    zIndex: "20",
    padding: "11px 20px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.45)",
    background: "rgba(20,20,20,0.4)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "#f4f4f4",
    font: '600 12px/1 "Helvetica Neue", Helvetica, Arial, sans-serif',
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "opacity 0.5s ease",
  });
  btn.addEventListener("click", async () => {
    btn.textContent = "Listening…";
    await startMic();
    btn.style.opacity = "0";
    setTimeout(() => btn.remove(), 600);
  });
  document.body.appendChild(btn);
}
