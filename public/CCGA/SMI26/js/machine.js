/* ------------------------------------------------------------------
   Three.js demos for machine.html ("From sand to sites").
   Exposes window.Demos with the same activate/deactivate API app.js
   expects. Each demo owns a WebGL context only while its chapter is
   open, so visiting every chapter never runs out of contexts.
------------------------------------------------------------------ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const C = {
  paper: 0xf4efe6, paper2: 0xece5d8, card: 0xfffdf8, ink: 0x151515, red: 0xd7261e, yel: 0xf0c02e,
  blu: 0x1d4fbd, muted: 0x6d6660, off: 0xb9b2a6, silver: 0xc9c4ba, pcb: 0x2f6b4f, green: 0x2f8f5b, dark: 0x2b2a27
};
const demos = {};
const SHARED = new Set();
const LINE = new THREE.LineBasicMaterial({ color: C.ink }); SHARED.add(LINE);
const DOT = new THREE.SphereGeometry(0.09, 12, 8); SHARED.add(DOT);

// ---------- small helpers ----------
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const bin = (v, n = 8) => v.toString(2).padStart(n, '0');
const bin8 = v => { const s = bin(v & 255); return s.slice(0, 4) + ' ' + s.slice(4); };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function setHTML(el, h) { if (el._h !== h) { el._h = h; el.innerHTML = h; } }

function mat(color, o = {}) { return new THREE.MeshLambertMaterial(Object.assign({ color }, o)); }
function box(w, h, d, color, o = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat(color, o.mat));
  if (o.edges !== false) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), o.line || LINE));
  return m;
}
function sphere(r, color, o = {}) { return new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), mat(color, o.mat)); }
function cyl(r, h, color, o = {}) {
  const g = new THREE.CylinderGeometry(r, r, h, o.seg || 28);
  const m = new THREE.Mesh(g, mat(color, o.mat));
  if (o.edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), LINE));
  return m;
}
function at(o, x, y, z) { o.position.set(x, y, z || 0); return o; }
function label(html, cls, center) {
  const d = document.createElement('div');
  d.className = 'lab3' + (cls ? ' ' + cls : '');
  d.innerHTML = html;
  const o = new CSS2DObject(d);
  if (center) o.center.set(center[0], center[1]);
  o.el = d;
  return o;
}
// remove an object and everything under it, including CSS2D label elements
function kill(o) {
  o.traverse(c => {
    if (c.isCSS2DObject && c.element.parentNode) c.element.parentNode.removeChild(c.element);
    if (c.geometry && !SHARED.has(c.geometry)) c.geometry.dispose();
    if (c.material && !SHARED.has(c.material)) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); }
  });
  if (o.parent) o.parent.remove(o);
}
function polyLine(pts, color) {
  const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p[0], p[1], p[2] || 0)));
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color: color ?? C.muted }));
}
// a wire is a tube along a polyline that can be 0 or 1; when 1, dots run along it
function wire(parent, pts, o = {}) {
  const v = pts.map(p => new THREE.Vector3(p[0], p[1], p[2] || 0));
  const path = new THREE.CurvePath();
  for (let i = 0; i < v.length - 1; i++) path.add(new THREE.LineCurve3(v[i], v[i + 1]));
  const len = path.getLength();
  const m = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, Math.ceil(len * 10)), o.r || 0.055, 8, false), mat(o.off ?? C.off));
  m.userData.passThrough = true;
  parent.add(m);
  const n = Math.max(1, Math.round(len / (o.gap || 0.7)));
  const dotMat = mat(o.dot ?? C.yel, { emissive: o.dot ?? C.yel, emissiveIntensity: 0.6 });
  const dots = [];
  for (let k = 0; k < n; k++) { const d = new THREE.Mesh(o.dotGeo || DOT, dotMat); d.visible = false; d.userData.passThrough = true; parent.add(d); dots.push(d); }
  const w = {
    mesh: m, path, len, val: -1,
    set(val) {
      val = val ? 1 : 0; if (val === w.val) return; w.val = val;
      m.material.color.set(val ? (o.on ?? C.red) : (o.off ?? C.off));
      m.material.emissive.set(val ? (o.glow ?? 0x3a0000) : 0x000000);
    },
    tick(t) {
      const show = !!w.val;
      for (let k = 0; k < n; k++) {
        const d = dots[k]; d.visible = show;
        if (show) path.getPointAt(((t * (o.speed || 1.6) / len) + k / n) % 1, d.position);
      }
    }
  };
  w.set(0);
  return w;
}
// position along a polyline, u in 0..1
function along(pts, u, out) {
  const v = pts.map(p => p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2] || 0));
  let total = 0; const seg = [];
  for (let i = 0; i < v.length - 1; i++) { const l = v[i].distanceTo(v[i + 1]); seg.push(l); total += l; }
  let d = clamp(u, 0, 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) return out.copy(v[i]).lerp(v[i + 1], seg[i] ? clamp(d / seg[i], 0, 1) : 1);
    d -= seg[i];
  }
  return out.copy(v[v.length - 1]);
}

// ---------- the stage: renderer, labels, camera, orbit, picking ----------
const live = new Set();
function makeStage(host, wrap, o = {}) {
  const w = Math.max(300, Math.floor(wrap.clientWidth || host.clientWidth));
  const h = Math.round(typeof o.h === 'function' ? o.h(w) : (o.h || Math.max(340, Math.min(500, w * 0.6))));
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(w, h);
  renderer.setClearColor(o.bg ?? C.card);
  wrap.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.setSize(w, h);
  labels.domElement.className = 'lab-layer';
  wrap.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b6, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(4, 10, 7); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(o.fov || 35, w / h, 0.1, 1000);
  camera.position.set(...(o.cam || [8, 6, 10]));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...(o.target || [0, 0, 0]));
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = !!o.zoom;
  controls.update();

  const st = { host, wrap, renderer, labels, scene, camera, controls, w, h, t: 0, vis: true, update: null, hovered: null };

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const shown = ob => { for (; ob; ob = ob.parent) if (!ob.visible) return false; return true; };
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObjects(scene.children, true)) {
      if (hit.object.isLine || hit.object.isPoints || !shown(hit.object)) continue;
      let ob = hit.object;
      while (ob && !ob.userData.onClick && !ob.userData.onHover) ob = ob.parent;
      if (ob) return ob;
      if (!hit.object.userData.passThrough) return null;
    }
    return null;
  }
  const el = renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  el.addEventListener('pointerup', e => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
    if (moved > 6) return;
    const ob = pick(e);
    if (ob && ob.userData.onClick) ob.userData.onClick(e); else if (st.onMiss) st.onMiss();
  });
  el.addEventListener('pointermove', e => {
    if (e.buttons) return;
    const ob = pick(e);
    if (ob !== st.hovered) {
      if (st.hovered && st.hovered.userData.onHover) st.hovered.userData.onHover(false);
      st.hovered = ob;
      if (ob && ob.userData.onHover) ob.userData.onHover(true, e);
    }
    el.style.cursor = ob && ob.userData.onClick ? 'pointer' : 'grab';
  });
  el.addEventListener('pointerleave', () => { if (st.hovered && st.hovered.userData.onHover) st.hovered.userData.onHover(false); st.hovered = null; });

  st.io = new IntersectionObserver(es => { st.vis = es[0].isIntersecting; });
  st.io.observe(wrap);
  st.step = dt => {
    if (!st.vis) return;
    st.t += dt;
    if (st.update) st.update(dt, st.t);
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  };
  return st;
}

function info(st, below) {
  const d = document.createElement('div');
  d.className = 'info3' + (below ? ' below' : '');
  (below ? st.host : st.wrap).appendChild(d);
  return { el: d, set(h) { setHTML(d, h); } };
}

// ---------- tiny UI helper (same shape as life.js) ----------
function ui(host, controls) {
  const bar = document.createElement('div');
  bar.className = 'demo-ui';
  const P = {};
  controls.forEach(c => {
    if (c.type === 'range') {
      const lab = document.createElement('label'), span = document.createElement('span'), inp = document.createElement('input');
      inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step || 1; inp.value = c.value;
      P[c.key] = +c.value;
      const fmt = c.fmt || (v => v);
      const show = () => { span.innerHTML = c.label + ' <b>' + fmt(P[c.key]) + '</b>'; };
      inp.addEventListener('input', () => { P[c.key] = +inp.value; show(); if (c.onChange) c.onChange(P[c.key]); });
      P['set_' + c.key] = v => { P[c.key] = v; inp.value = v; show(); };
      show(); lab.append(span, inp); bar.appendChild(lab);
    } else if (c.type === 'buttons') {
      const g = document.createElement('div'); g.className = 'group';
      if (c.label) { const s = document.createElement('span'); s.style.cssText = 'font-family:var(--mono);font-size:.78rem;margin-right:4px'; s.textContent = c.label; g.appendChild(s); }
      P[c.key] = c.value;
      const btns = c.options.map(o => {
        const b = document.createElement('button');
        b.textContent = o.label; b.classList.toggle('on', o.value === c.value);
        b.addEventListener('click', () => { P[c.key] = o.value; btns.forEach(x => x.classList.toggle('on', x === b)); if (c.onChange) c.onChange(o.value); });
        g.appendChild(b); return b;
      });
      P['set_' + c.key] = v => { P[c.key] = v; btns.forEach((x, i) => x.classList.toggle('on', c.options[i].value === v)); };
      bar.appendChild(g);
    } else if (c.type === 'button') {
      const b = document.createElement('button'); b.textContent = c.label;
      if (c.primary) { b.style.background = 'var(--ink)'; b.style.color = 'var(--paper)'; }
      b.addEventListener('click', () => c.onClick(b)); bar.appendChild(b); P['btn_' + (c.key || c.label)] = b;
    } else if (c.type === 'select') {
      const lab = document.createElement('label'); const span = document.createElement('span'); span.textContent = c.label;
      const sel = document.createElement('select'); sel.style.cssText = 'font:inherit;font-size:.82rem;padding:3px 6px;border:2px solid var(--line);border-radius:6px;background:var(--card)';
      c.options.forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.label; sel.appendChild(op); });
      sel.value = c.value; P[c.key] = c.value;
      sel.addEventListener('change', () => { P[c.key] = sel.value; if (c.onChange) c.onChange(sel.value); });
      lab.append(span, sel); bar.appendChild(lab);
    } else if (c.type === 'text') {
      const lab = document.createElement('label'); const span = document.createElement('span'); span.textContent = c.label;
      const inp = document.createElement('input'); inp.type = 'text'; inp.value = c.value; inp.maxLength = c.max || 40;
      inp.style.cssText = 'font:inherit;font-family:var(--mono);font-size:.85rem;padding:3px 6px;border:2px solid var(--line);border-radius:6px;background:var(--card);width:' + (c.width || 170) + 'px';
      inp.addEventListener('input', () => { if (c.onChange) c.onChange(inp.value); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && c.onEnter) c.onEnter(inp.value); });
      P['in_' + c.key] = inp;
      lab.append(span, inp); bar.appendChild(lab);
    } else if (c.type === 'readout') {
      const r = document.createElement('div'); r.className = 'readout'; bar.appendChild(r); P.readout = r;
    } else if (c.type === 'html') {
      const d = document.createElement('div'); d.innerHTML = c.html; d.style.cssText = c.css || ''; bar.appendChild(d); P['html_' + c.key] = d;
    }
  });
  host.appendChild(bar);
  return P;
}

/* ==================================================================
   0 · the stack
================================================================== */
const STACK = [
  ['bits', 'Bits', 'Everything a computer keeps (numbers, letters, colours, sound, this sentence) is a pattern of 1s and 0s. Two states, nothing else.'],
  ['transistor', 'Transistors', 'A switch with no moving parts, flipped by electricity instead of a finger, made of purified sand. A laptop chip has tens of billions.'],
  ['gates', 'Logic gates', 'Wire a few switches together and they compute AND, OR, NOT. Every other part of the machine is built from these.'],
  ['adder', 'Adding with gates', 'Gates in the right arrangement do arithmetic. Adding two binary numbers is XOR for the digit and AND for the carry.'],
  ['memory', 'Memory & the clock', 'Gates that feed back into themselves remember. A ticking clock tells all of them when to change, together.'],
  ['cpu', 'The CPU', 'Fetch an instruction, decode it, execute it, repeat. Billions of times a second. That is all a processor ever does.'],
  ['machine', 'The whole machine', 'CPU, memory, storage, graphics and network on one board. And why the distance between them is everything.'],
  ['os', 'Operating system', 'One program in charge of all the others: it shares out the CPU, the memory, the screen and the files.'],
  ['net', 'Networks', 'Messages chopped into packets, each finding its own way across thousands of routers, put back together at the end.'],
  ['url', 'Typing a URL', 'DNS, TCP, TLS, HTTP: the conversation your browser has with strangers before you see a single pixel.'],
  ['browser', 'The browser draws', 'HTML becomes a tree, the tree becomes boxes, the boxes become pixels. And your p5 sketch is one of the boxes.'],
];
const STACK_COL = [C.paper2, C.yel, C.card, C.red, C.paper2, C.blu, C.card, C.yel, C.paper2, C.red, C.blu];

demos.stack = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [10, 6.5, 12.5], target: [0.6, 3.1, 0], h: w => Math.max(440, Math.min(580, w * 0.72)) });
  st.controls.autoRotate = true; st.controls.autoRotateSpeed = 0.7;
  st.controls.addEventListener('start', () => { st.controls.autoRotate = false; });
  const inf = info(st);
  let sel = -1;
  const slabs = STACK.map((L, i) => {
    const g = new THREE.Group(); g.position.y = i * 0.62;
    const s = box(6, 0.26, 3.6, STACK_COL[i]); g.add(s);
    // a little hint of the layer underneath: denser marks as we go down
    const n = 11 - i;
    for (let k = 0; k < n; k++) { const m = box(0.22, 0.12, 0.22, k % 3 === 0 ? C.ink : C.card); at(m, -2.6 + k * 0.32, 0.19, -1.45); g.add(m); }
    const lab = label('<span class="n">' + String(i + 1).padStart(2, '0') + '</span> ' + L[1], 'big', [0, 0.5]);
    lab.position.set(3.15, 0, 1.8); g.add(lab);
    s.userData.onClick = () => choose(i);
    s.userData.onHover = on => { slabs[i].hover = on; };
    st.scene.add(g);
    return { g, hover: false, lab };
  });
  function choose(i) {
    sel = i; st.controls.autoRotate = false;
    slabs.forEach((s, j) => s.lab.el.classList.toggle('on', j === i));
    const L = STACK[i];
    inf.set('<b class="t">' + String(i + 1).padStart(2, '0') + ' · ' + L[1] + '</b><p>' + L[2] + '</p><a href="#' + L[0] + '">open chapter ' + (i + 1) + ' →</a>');
  }
  inf.set('<b class="t">Eleven layers, one machine.</b><p>Each layer only needs the one beneath it. A web page doesn\'t know about transistors; a transistor doesn\'t know about web pages. <b>Click a layer.</b> Drag to turn the stack.</p>');
  st.update = dt => {
    slabs.forEach((s, i) => { s.g.position.x = damp(s.g.position.x, (s.hover ? 0.5 : 0) + (sel === i ? 1.5 : 0), 10, dt); });
  };
  return st;
};

/* ==================================================================
   1 · bits
================================================================== */
demos.bits = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [-1.2, 2.4, 14.5], target: [-1.2, -0.1, 0], h: w => Math.max(320, Math.min(430, w * 0.52)) });
  const rows = [83, 77, 73];
  const names = ['R', 'G', 'B'];
  const bulbs = [];
  for (let r = 0; r < 3; r++) {
    const rl = label('<b>' + names[r] + '</b>', 'plain big'); at(rl, -7.6, 1.3 - r * 1.3, 0); st.scene.add(rl);
    for (let b = 0; b < 8; b++) {
      const x = -6.8 + b * 0.95, y = 1.3 - r * 1.3;
      const s = sphere(0.34, C.paper2); at(s, x, y, 0); st.scene.add(s);
      const base = box(0.46, 0.16, 0.46, C.ink); at(base, x, y - 0.42, 0); st.scene.add(base);
      s.userData.onClick = () => { rows[r] ^= 1 << (7 - b); };
      bulbs.push({ s, r, bit: 7 - b, on: -1 });
      if (r === 0) { const pv = label(String(1 << (7 - b)), 'plain'); at(pv, x, 2.1, 0); st.scene.add(pv); }
    }
  }
  const sw = box(2.3, 2.3, 2.3, 0xffffff); at(sw, 3.4, 0, 0); st.scene.add(sw);
  const swl = label('', 'big'); at(swl, 3.4, -1.9, 0); st.scene.add(swl);
  const inf = info(st, true);
  let counting = false, acc = 0;
  const setText = v => { for (let i = 0; i < 3; i++) rows[i] = v.charCodeAt(i) & 255 || 0; };
  const P = ui(host, [
    { type: 'text', key: 'txt', label: 'type three letters', value: 'SMI', max: 3, width: 90, onChange: setText },
    { type: 'button', label: 'all off', onClick: () => rows.fill(0) },
    { type: 'button', label: 'random colour', onClick: () => { for (let i = 0; i < 3; i++) rows[i] = Math.floor(Math.random() * 256); } },
    { type: 'button', key: 'count', label: '▶ count in binary (R)', onClick: b => { counting = !counting; b.textContent = counting ? '❚❚ stop counting' : '▶ count in binary (R)'; } }
  ]);
  const ch = v => v >= 33 && v <= 126 ? '\'' + esc(String.fromCharCode(v)) + '\'' : v === 32 ? '\'␣\' (space)' : '<span class="m">not printable</span>';
  st.update = (dt, t) => {
    if (counting) { acc += dt; while (acc > 0.22) { acc -= 0.22; rows[0] = (rows[0] + 1) & 255; } }
    bulbs.forEach(B => {
      const on = (rows[B.r] >> B.bit) & 1;
      if (on !== B.on) { B.on = on; B.s.material.color.set(on ? C.yel : C.paper2); B.s.material.emissive.set(on ? 0x7a5a00 : 0); }
    });
    sw.material.color.setRGB(rows[0] / 255, rows[1] / 255, rows[2] / 255, THREE.SRGBColorSpace);
    sw.rotation.y = t * 0.35; sw.rotation.x = 0.35;
    const hex = '#' + rows.map(v => v.toString(16).padStart(2, '0')).join('');
    setHTML(swl.el, hex);
    inf.set('<table class="bits3"><tr><th></th><th>8 switches</th><th>as a number</th><th>hex</th><th>as a letter</th></tr>' +
      rows.map((v, i) => '<tr><td><b>' + names[i] + '</b></td><td class="mono">' + bin8(v) + '</td><td class="mono">' + v + '</td><td class="mono">' + v.toString(16).toUpperCase().padStart(2, '0') + '</td><td class="mono">' + ch(v) + '</td></tr>').join('') +
      '<tr><td></td><td colspan="4">all 24 together, as a colour: <b class="mono">' + hex + '</b> · <span class="mono">fill(' + rows.join(', ') + ')</span></td></tr></table>');
  };
  return st;
};

/* ==================================================================
   2 · a transistor
================================================================== */
demos.transistor = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [3.6, 4.8, 10.6], target: [-1.3, 0.8, 0], h: w => Math.max(360, Math.min(480, w * 0.6)) });
  const S = st.scene;
  S.add(at(box(6.6, 1.8, 3.2, 0xb9b2a6), 0, -0.9, 0));
  S.add(at(box(1.6, 0.62, 3.22, C.blu), -2.2, -0.3, 0));
  S.add(at(box(1.6, 0.62, 3.22, C.blu), 2.2, -0.3, 0));
  S.add(at(box(2.6, 0.1, 3.2, C.yel), 0, 0.06, 0));
  const gate = box(2.6, 0.5, 3.2, C.red); at(gate, 0, 0.36, 0); S.add(gate);
  const chan = box(2.84, 0.14, 3.26, C.yel, { edges: false, mat: { transparent: true, opacity: 0, emissive: C.yel, emissiveIntensity: 0.9 } });
  at(chan, 0, -0.06, 0); chan.userData.passThrough = true; S.add(chan);
  S.add(at(box(0.3, 1.4, 0.3, C.silver), -2.2, 0.7, 0));
  S.add(at(box(0.3, 1.4, 0.3, C.silver), 2.2, 0.7, 0));
  const gp = box(0.3, 1.5, 0.3, C.silver); at(gp, 0, 1.36, 0); S.add(gp);
  const batt = box(0.55, 0.8, 0.55, C.ink); at(batt, -2.2, 1.8, 0); S.add(batt);
  const lamp = sphere(0.36, C.paper2); at(lamp, 2.2, 1.78, 0); S.add(lamp);
  const loop = wire(S, [[-2.2, 2.2, 0], [-2.2, 2.9, 0], [2.2, 2.9, 0], [2.2, 2.14, 0]], { on: C.blu, glow: 0x001040, dot: C.blu, speed: 1.2 });
  const L = (h, x, y, z, c) => { const l = label(h, c || ''); at(l, x, y, z); S.add(l); return l; };
  L('source', -2.2, -0.3, 1.8); L('drain', 2.2, -0.3, 1.8); L('silicon', 0, -1.4, 1.8, 'plain');
  L('oxide (glass)', 0, 0.06, 1.75, 'plain');
  const gl = L('gate', 0, 2.25, 0);
  L('battery', -2.2, 1.8, 0.5, 'plain');
  const ll = L('lamp', 2.95, 1.78, 0, 'plain');
  // electrons
  const eGeo = new THREE.SphereGeometry(0.065, 10, 8), eMat = mat(C.blu, { emissive: 0x0a1a60 });
  const E = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(eGeo, eMat); m.userData.passThrough = true; S.add(m);
    const side = i % 2 ? -1 : 1;
    m.position.set(side * rnd(1.5, 2.9), rnd(-0.55, -0.06), rnd(-1.45, 1.45));
    E.push({ m, mode: side < 0 ? 0 : 2 });
  }
  let amt = 0;
  const inf = info(st);
  const P = ui(host, [
    { type: 'range', key: 'v', label: 'voltage on the gate', min: 0, max: 1, step: 0.01, value: 0, fmt: v => v.toFixed(2) },
    { type: 'button', label: 'gate = 0', onClick: () => P.set_v(0) },
    { type: 'button', label: 'gate = 1', primary: true, onClick: () => P.set_v(1) },
    { type: 'readout' }
  ]);
  gate.userData.onClick = () => P.set_v(P.v > 0.5 ? 0 : 1);
  gp.userData.onClick = gate.userData.onClick;
  st.update = (dt, t) => {
    const want = smooth(0.38, 0.56, P.v);
    amt = damp(amt, want, 6, dt);
    chan.material.opacity = amt * 0.9;
    lamp.material.color.set(amt > 0.5 ? C.yel : C.paper2);
    lamp.material.emissive.setRGB(amt * 0.6, amt * 0.45, 0);
    gate.material.emissive.setRGB(P.v * 0.25, 0, 0);
    loop.set(amt > 0.5); loop.tick(t);
    E.forEach(e => {
      const p = e.m.position;
      if (e.mode === 1) {
        p.x += dt * (1.2 + 2 * amt); p.y = damp(p.y, -0.03, 8, dt);
        if (amt < 0.3 && p.x < 0) e.mode = 0;
        if (p.x > 1.5) e.mode = 2;
      } else {
        p.x += rnd(-1, 1) * dt * 0.8; p.y += rnd(-1, 1) * dt * 0.5; p.z += rnd(-1, 1) * dt * 0.8;
        if (e.mode === 0) {
          p.x = clamp(p.x, -2.9, -1.45);
          if (Math.random() < amt * dt * 1.6) { e.mode = 1; p.x = -1.45; }
        } else {
          p.x = clamp(p.x + dt * amt * 0.8, 1.45, 3.0);
          if (amt > 0.3 && p.x >= 2.95) { e.mode = 0; p.set(rnd(-2.9, -2.3), rnd(-0.5, -0.1), rnd(-1.4, 1.4)); }
        }
        p.y = clamp(p.y, -0.56, -0.05); p.z = clamp(p.z, -1.45, 1.45);
      }
    });
    setHTML(gl.el, 'gate <b>' + P.v.toFixed(2) + '</b>');
    setHTML(ll.el, amt > 0.5 ? '<b>on · 1</b>' : 'off · 0');
    const state = want < 0.05 ? ['OFF', 'Not enough voltage on the gate to pull electrons up under the glass. No channel, no current. The lamp reads <b>0</b>.']
      : want > 0.95 ? ['ON', 'The gate\'s charge pulls a thin layer of electrons up under the glass: a <b>channel</b> joins source to drain and current flows. The lamp reads <b>1</b>.']
        : ['IN BETWEEN', 'Around the threshold the channel is half-formed. Real circuits never sit here for long: they are designed to snap to fully off or fully on. That is why computers are <b>digital</b>.'];
    inf.set('<b class="t">' + state[0] + '</b><p>' + state[1] + '</p><p class="m">Notice: no current goes <i>into</i> the gate (the glass stops it). A tiny voltage on one wire controls a big current on another. That is what lets one transistor drive the next.</p>');
    P.readout.textContent = 'channel ' + Math.round(amt * 100) + '% · click the red gate';
  };
  return st;
};

/* ==================================================================
   3 · logic gates
================================================================== */
const GATES = {
  NOT: { f: (a) => a ? 0 : 1, n: 1, tr: 2, say: 'flips its input' },
  AND: { f: (a, b) => a & b, n: 2, tr: 6, say: '1 only if A <i>and</i> B are 1' },
  OR: { f: (a, b) => a | b, n: 2, tr: 6, say: '1 if A <i>or</i> B (or both) is 1' },
  NAND: { f: (a, b) => (a & b) ? 0 : 1, n: 2, tr: 4, say: 'NOT AND. Any other gate can be built from NANDs alone' },
  NOR: { f: (a, b) => (a | b) ? 0 : 1, n: 2, tr: 4, say: 'NOT OR. Also universal: the Apollo guidance computer was made of nothing but NOR gates' },
  XOR: { f: (a, b) => a ^ b, n: 2, tr: 12, say: '1 if A and B are <i>different</i>. The heart of addition' },
};
function gateMesh(type) {
  const s = new THREE.Shape();
  const kind = type === 'AND' || type === 'NAND' ? 'and' : type === 'NOT' ? 'not' : 'or';
  if (kind === 'and') { s.moveTo(-1, -1); s.lineTo(0, -1); s.absarc(0, 0, 1, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-1, 1); s.lineTo(-1, -1); }
  else if (kind === 'not') { s.moveTo(-1, -1); s.lineTo(0.9, 0); s.lineTo(-1, 1); s.lineTo(-1, -1); }
  else { s.moveTo(-1, -1); s.quadraticCurveTo(0.3, -1, 1.2, 0); s.quadraticCurveTo(0.3, 1, -1, 1); s.quadraticCurveTo(-0.45, 0, -1, -1); }
  const shapes = [s];
  if (type === 'XOR') { const b = new THREE.Shape(); b.moveTo(-1.42, -1); b.quadraticCurveTo(-0.87, 0, -1.42, 1); b.lineTo(-1.27, 1); b.quadraticCurveTo(-0.72, 0, -1.27, -1); b.lineTo(-1.42, -1); shapes.push(b); }
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 0.5, bevelEnabled: false, curveSegments: 28 }); geo.translate(0, 0, -0.25);
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat(C.card)); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), LINE)); g.add(m);
  let outX = kind === 'and' ? 1 : kind === 'not' ? 0.9 : 1.2;
  if (['NAND', 'NOR', 'NOT'].includes(type)) {
    const bub = cyl(0.18, 0.5, C.card, { edges: true }); bub.rotation.x = Math.PI / 2; at(bub, outX + 0.18, 0, 0); g.add(bub);
    outX += 0.36;
  }
  const l = label(type, 'plain big'); at(l, -0.15, 0, 0.3); g.add(l);
  return { g, outX };
}
demos.gates = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [0.6, 2.2, 12], target: [0, 0, 0], h: w => Math.max(320, Math.min(420, w * 0.5)) });
  const inp = [1, 0];
  let type = 'AND', G = null, wires = [], out = null;
  const sws = [0, 1].map(i => {
    const m = box(0.9, 0.9, 0.9, C.paper2); at(m, -4.6, i ? -1.4 : 1.4, 0); st.scene.add(m);
    const l = label('', 'big'); at(l, -5.9, i ? -1.4 : 1.4, 0); st.scene.add(l);
    m.userData.onClick = () => { inp[i] ^= 1; };
    return { m, l };
  });
  const bulb = sphere(0.5, C.paper2); at(bulb, 4.4, 0, 0); st.scene.add(bulb);
  const bl = label('', 'big'); at(bl, 4.4, -0.9, 0); st.scene.add(bl);
  const P = ui(host, [
    { type: 'buttons', key: 'g', label: 'gate', value: 'AND', options: Object.keys(GATES).map(k => ({ label: k, value: k })), onChange: v => build(v) },
    { type: 'html', key: 'tt', html: '' },
  ]);
  function build(t) {
    type = t;
    if (G) kill(G);
    wires.forEach(w => { kill(w.grp); }); wires = [];
    const gm = gateMesh(t); G = gm.g; st.scene.add(G);
    const mk = pts => { const grp = new THREE.Group(); st.scene.add(grp); const w = wire(grp, pts); w.grp = grp; wires.push(w); return w; };
    const one = GATES[t].n === 1;
    sws[1].m.visible = !one; sws[1].l.visible = !one;
    wires.a = mk(one ? [[-4.15, 1.4], [-2.6, 1.4], [-2.6, 0], [-0.6, 0]] : [[-4.15, 1.4], [-2.6, 1.4], [-2.6, 0.5], [-0.6, 0.5]]);
    if (!one) wires.b = mk([[-4.15, -1.4], [-2.6, -1.4], [-2.6, -0.5], [-0.6, -0.5]]);
    wires.o = mk([[gm.outX, 0], [3.9, 0]]);
  }
  build('AND');
  st.update = (dt, t) => {
    const g = GATES[type], one = g.n === 1;
    const o = one ? g.f(inp[0]) : g.f(inp[0], inp[1]);
    sws.forEach((s, i) => { s.m.material.color.set(inp[i] ? C.yel : C.paper2); setHTML(s.l.el, (i ? 'B' : 'A') + ' = <b>' + inp[i] + '</b>'); });
    wires.a.set(inp[0]); if (wires.b) wires.b.set(inp[1]); wires.o.set(o);
    wires.forEach(w => w.tick(t));
    bulb.material.color.set(o ? C.yel : C.paper2); bulb.material.emissive.set(o ? 0x7a5a00 : 0);
    setHTML(bl.el, 'out = <b>' + o + '</b>');
    const rows = one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    setHTML(P.html_tt, '<table class="tt"><tr>' + (one ? '<th>A</th>' : '<th>A</th><th>B</th>') + '<th>out</th></tr>' +
      rows.map(r => { const here = one ? r[0] === inp[0] : r[0] === inp[0] && r[1] === inp[1]; return '<tr class="' + (here ? 'here' : '') + '">' + r.map(v => '<td>' + v + '</td>').join('') + '<td><b>' + g.f(...r) + '</b></td></tr>'; }).join('') +
      '</table><span class="ttsay"><b>' + type + '</b>: ' + g.say + '.<br>In a chip: about ' + g.tr + ' transistors.</span>');
  };
  return st;
};

/* ==================================================================
   4 · a 4-bit adder, with visible ripple
================================================================== */
demos.adder = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [0, 1.4, 15.5], target: [-0.3, 0.6, 0], h: w => Math.max(360, Math.min(470, w * 0.58)) });
  const A = [1, 1, 0, 1], B = [1, 0, 1, 0]; // index 0 = least significant
  const sum = [0, 0, 0, 0], cout = [0, 0, 0, 0], pend = [null, null, null, null];
  const X = i => 3.6 - i * 2.4;
  const togg = [], fas = [], bulbs = [], W = { a: [], b: [], s: [], c: [] };
  const grp = st.scene;
  for (let i = 0; i < 4; i++) {
    const x = X(i);
    ['A', 'B'].forEach((n, k) => {
      const m = box(0.6, 0.6, 0.6, C.paper2); at(m, x + (k ? 0.45 : -0.45), 3.3, 0); grp.add(m);
      const arr = k ? B : A;
      m.userData.onClick = () => { arr[i] ^= 1; };
      const l = label(n + '<sub>' + i + '</sub>', 'plain'); at(l, x + (k ? 0.45 : -0.45), 3.95, 0); grp.add(l);
      togg.push({ m, arr, i });
    });
    const fa = box(1.6, 1.2, 0.8, C.card); at(fa, x, 0.7, 0); grp.add(fa);
    const fl = label('full<br>adder', 'plain'); at(fl, x, 0.7, 0.45); grp.add(fl);
    fas.push(fa);
    W.a.push(wire(grp, [[x - 0.45, 3.0], [x - 0.45, 1.3]], { gap: 0.6 }));
    W.b.push(wire(grp, [[x + 0.45, 3.0], [x + 0.45, 1.3]], { gap: 0.6 }));
    W.s.push(wire(grp, [[x, 0.1], [x, -1.35]], { gap: 0.6 }));
    W.c.push(wire(grp, [[x - 0.8, 0.45], [x - 1.6, 0.45]], { gap: 0.5 }));
    const b = sphere(0.42, C.paper2); at(b, x, -1.8, 0); grp.add(b); bulbs.push(b);
    const pl = label('×' + (1 << i), 'plain'); at(pl, x, -2.55, 0); grp.add(pl);
  }
  // carry in (always 0) on the right, carry out bulb on the left
  const cin = label('carry in = 0', 'plain'); at(cin, 5.6, 0.45, 0); grp.add(cin);
  const cb = sphere(0.42, C.paper2); at(cb, X(3) - 2.0, 0.45, 0); grp.add(cb);
  const cl = label('carry out<br>×16', 'plain'); at(cl, X(3) - 2.0, -0.45, 0); grp.add(cl);
  const inf = info(st, true);
  const P = ui(host, [
    { type: 'range', key: 'd', label: 'gate delay (slowed down ×10⁹)', min: 0.05, max: 1.2, step: 0.05, value: 0.45, fmt: v => v.toFixed(2) + ' s' },
    { type: 'button', label: '15 + 1 (longest ripple)', onClick: () => { A.splice(0, 4, 1, 1, 1, 1); B.splice(0, 4, 1, 0, 0, 0); } },
    { type: 'button', label: 'random', onClick: () => { for (let i = 0; i < 4; i++) { A[i] = Math.random() < 0.5 ? 1 : 0; B[i] = Math.random() < 0.5 ? 1 : 0; } } },
    { type: 'readout' }
  ]);
  const num = arr => arr.reduce((s, v, i) => s + (v << i), 0);
  st.update = (dt, t) => {
    let busy = false;
    for (let i = 0; i < 4; i++) {
      const ci = i === 0 ? 0 : cout[i - 1];
      const s = A[i] ^ B[i] ^ ci, c = (A[i] & B[i]) | (ci & (A[i] ^ B[i]));
      if (s !== sum[i] || c !== cout[i]) {
        if (!pend[i] || pend[i].s !== s || pend[i].c !== c) pend[i] = { t: P.d, s, c };
      } else pend[i] = null;
      if (pend[i]) { busy = true; pend[i].t -= dt; if (pend[i].t <= 0) { sum[i] = pend[i].s; cout[i] = pend[i].c; pend[i] = null; } }
      fas[i].material.color.set(pend[i] ? C.yel : C.card);
      W.a[i].set(A[i]); W.b[i].set(B[i]); W.s[i].set(sum[i]); W.c[i].set(cout[i]);
      bulbs[i].material.color.set(sum[i] ? C.yel : C.paper2); bulbs[i].material.emissive.set(sum[i] ? 0x7a5a00 : 0);
    }
    cb.material.color.set(cout[3] ? C.red : C.paper2);
    togg.forEach(g => g.m.material.color.set(g.arr[g.i] ? C.yel : C.paper2));
    [W.a, W.b, W.s, W.c].forEach(arr => arr.forEach(w => w.tick(t)));
    const a = num(A), b = num(B), r = num(sum) + 16 * cout[3];
    inf.set('<div class="sumline"><span class="mono">A = ' + bin(a, 4) + ' = ' + a + '</span><span class="mono">B = ' + bin(b, 4) + ' = ' + b + '</span><span class="mono">out = ' + (cout[3] ? '1 ' : '') + bin(num(sum), 4) + ' = <b>' + r + '</b></span>' +
      (busy ? '<span class="busy">carry rippling… (yellow boxes are still thinking)</span>' : (r === a + b ? '<span class="ok">settled ✓ ' + a + ' + ' + b + ' = ' + r + '</span>' : '')) + '</div>');
    P.readout.textContent = 'click the A and B cubes';
  };
  return st;
};

/* ==================================================================
   5 · memory and the clock
================================================================== */
demos.memory = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [-0.8, 0.8, 16], target: [-0.6, -0.2, 0], h: w => Math.max(420, Math.min(540, w * 0.68)) });
  const S = st.scene;
  const text = 'Hello, SMI26 :)';
  const mem = Array.from({ length: 16 }, (_, i) => i < text.length ? text.charCodeAt(i) : 0);
  const RY = r => 3.3 - r * 0.42, BX = b => 0.2 + b * 0.42;
  const cells = [], rowLab = [], flash = new Array(16).fill(0);
  for (let r = 0; r < 16; r++) {
    for (let b = 0; b < 8; b++) { const m = box(0.32, 0.32, 0.32, C.paper2); at(m, BX(b), RY(r), 0); S.add(m); cells.push({ m, r, bit: 7 - b, on: -1 }); }
    const a = label(String(r).padStart(2, '0'), 'plain'); at(a, -0.45, RY(r), 0); S.add(a);
    const c = label('', 'plain', [0, 0.5]); at(c, 3.55, RY(r), 0); S.add(c); rowLab.push(c);
  }
  const head = label('address · 8 bits each · as text', 'plain', [0, 0.5]); at(head, -0.8, 3.95, 0); S.add(head);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.6, 0.44, 0.5)), new THREE.LineBasicMaterial({ color: C.red }));
  S.add(frame);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 18), mat(C.red)); arrow.rotation.z = -Math.PI / 2; S.add(arrow);
  // data bus bulbs
  const bus = [];
  for (let b = 0; b < 8; b++) { const s = sphere(0.18, C.paper2); at(s, BX(b), -3.75, 0); S.add(s); bus.push(s); }
  const busL = label('data bus', 'plain', [1, 0.5]); at(busL, -0.2, -3.75, 0); S.add(busL);
  // clock: a scrolling square wave and a light
  const N = 500, pos = new Float32Array(N * 3);
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const waveLine = new THREE.Line(wg, new THREE.LineBasicMaterial({ color: C.red })); S.add(waveLine);
  S.add(polyLine([[-7.2, 1.6], [-2.2, 1.6]], 0xd8d0c2));
  const led = box(0.8, 0.8, 0.8, C.paper2); at(led, -4.7, 0, 0); S.add(led);
  const clockL = label('', 'big'); at(clockL, -4.7, -0.85, 0); S.add(clockL);
  const wl = label('clock signal (now →)', 'plain', [0, 0.5]); at(wl, -7.2, 3.05, 0); S.add(wl);
  const evL = label('', '', [0.5, 0.5]); at(evL, -4.7, -2.2, 0); S.add(evL);
  let phase = 0, ticks = 0, busVal = 0, last = 'waiting for the first tick…', ledFlash = 0;
  const P = ui(host, [
    { type: 'buttons', key: 'mode', label: 'on the next tick', value: 'read', options: [{ label: 'READ', value: 'read' }, { label: 'WRITE', value: 'write' }] },
    { type: 'range', key: 'addr', label: 'address', min: 0, max: 15, value: 0 },
    { type: 'range', key: 'data', label: 'data to write', min: 0, max: 255, value: 42, fmt: v => v + ' = ' + bin8(v) + (v > 32 && v < 127 ? ' \'' + String.fromCharCode(v) + '\'' : '') },
    { type: 'range', key: 'hz', label: 'clock', min: 0, max: 4, step: 0.25, value: 1, fmt: v => v ? v + ' ticks/s' : 'stopped' },
    { type: 'button', label: 'tick once', onClick: () => edge() }
  ]);
  function edge() {
    ticks++; ledFlash = 1;
    const a = P.addr;
    if (P.mode === 'write') { mem[a] = P.data; busVal = P.data; flash[a] = 1; last = 'tick ' + ticks + ': WRITE ' + P.data + ' → address ' + a; }
    else { busVal = mem[a]; flash[a] = 1; last = 'tick ' + ticks + ': READ address ' + a + ' → ' + mem[a]; }
  }
  st.update = (dt) => {
    const before = Math.floor(phase);
    phase += P.hz * dt;
    if (Math.floor(phase) > before) edge();
    const span = 4; // cycles visible
    for (let k = 0; k < N; k++) {
      const tk = phase - (N - 1 - k) / (N - 1) * span;
      const hi = (tk - Math.floor(tk)) < 0.5 ? 1 : 0;
      pos[k * 3] = -7.2 + 5 * k / (N - 1); pos[k * 3 + 1] = 1.6 + hi * 0.9; pos[k * 3 + 2] = 0;
    }
    wg.attributes.position.needsUpdate = true;
    ledFlash = Math.max(0, ledFlash - dt * 3);
    const high = P.hz > 0 && (phase - Math.floor(phase)) < 0.5;
    led.material.color.set(ledFlash > 0.2 ? C.red : high ? C.yel : C.paper2);
    setHTML(clockL.el, 'tick <b>' + ticks + '</b>');
    setHTML(evL.el, last);
    cells.forEach(c => {
      const on = (mem[c.r] >> c.bit) & 1;
      if (on !== c.on) { c.on = on; c.m.material.color.set(on ? C.ink : C.paper2); }
      const f = flash[c.r]; c.m.scale.setScalar(1 + f * 0.25);
    });
    for (let r = 0; r < 16; r++) {
      flash[r] = Math.max(0, flash[r] - dt * 2.5);
      const v = mem[r];
      setHTML(rowLab[r].el, (v > 32 && v < 127 ? esc(String.fromCharCode(v)) : v === 32 ? '␣' : '·') + ' <span class="m">' + v + '</span>');
    }
    frame.position.y = damp(frame.position.y, RY(P.addr), 14, dt); frame.position.x = BX(3.5);
    arrow.position.set(-0.95, frame.position.y, 0);
    bus.forEach((s, b) => { const on = (busVal >> (7 - b)) & 1; s.material.color.set(on ? C.yel : C.paper2); s.material.emissive.set(on ? 0x7a5a00 : 0); });
  };
  return st;
};

/* ==================================================================
   6 · a toy CPU, fetch / decode / execute
================================================================== */
const OPS = ['HALT', 'LOAD', 'ADD', 'SUB', 'STORE', 'JUMP', 'JZ', 'OUT'];
const NOARG = { HALT: 1, OUT: 1 };
const PROGRAMS = {
  count: { label: 'count by 3', src: 'LOAD 15   ; A = memory[15]\nADD 14    ; A = A + memory[14]\nSTORE 15  ; memory[15] = A\nOUT       ; show A\nJUMP 1    ; go back to address 1\n\n\n\n\n\n\n\n\n\n3         ; data: the step\n0         ; data: the running total' },
  countdown: { label: 'countdown from 5', src: 'LOAD 15   ; A = 5\nOUT       ; show A\nJZ 6      ; if A is 0, jump to 6\nSUB 14    ; A = A - 1\nJUMP 1    ; loop\n\nHALT      ; stop\n\n\n\n\n\n\n\n1         ; data: one\n5         ; data: start' },
  multiply: { label: '6 × 7 with only adding', src: 'LOAD 13   ; A = result\nADD 14    ; A = A + 6\nSTORE 13  ; result = A\nLOAD 15   ; A = counter\nSUB 12    ; A = A - 1\nSTORE 15  ; counter = A\nJZ 8      ; counter 0? done\nJUMP 0    ; else go round again\nLOAD 13   ; A = result\nOUT       ; show it\nHALT\n\n1         ; data: one\n0         ; data: result\n6         ; data: 6\n7         ; data: counter' },
};
function assemble(src) {
  const mem = new Array(16).fill(0), errs = [];
  src.split('\n').slice(0, 16).forEach((ln, i) => {
    const s = ln.split(';')[0].trim().toUpperCase();
    if (!s) return;
    const m = s.match(/^([A-Z]+)\s*(\d+)?$/);
    if (m && OPS.includes(m[1])) mem[i] = (OPS.indexOf(m[1]) << 4) | ((+m[2] || 0) & 15);
    else if (/^\d+$/.test(s)) mem[i] = (+s) & 255;
    else errs.push('line ' + i + ': "' + ln.trim() + '"');
  });
  return { mem, errs };
}
const disasm = v => { const op = v >> 4; return op < 8 ? OPS[op] + (NOARG[OPS[op]] ? '' : ' ' + (v & 15)) : '???'; };

demos.cpu = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [-0.3, 0.4, 14.2], target: [-0.6, 0.1, 0], h: w => Math.max(460, Math.min(580, w * 0.74)) });
  st.controls.minAzimuthAngle = -0.8; st.controls.maxAzimuthAngle = 0.8; st.controls.minPolarAngle = 0.9; st.controls.maxPolarAngle = 2.1;
  const SC = st.scene;
  let mem = [], S;
  const slotY = i => 3.15 - i * 0.42;
  const slots = [];
  for (let i = 0; i < 16; i++) {
    const m = box(3.0, 0.34, 0.5, C.card); at(m, -4.6, slotY(i), 0); SC.add(m);
    const l = label('', 'cell'); m.add(l); l.position.z = 0.3;
    slots.push({ m, l, flash: 0 });
  }
  const memL = label('MEMORY · code and data, same bytes', 'plain'); at(memL, -4.6, 3.75, 0); SC.add(memL);
  const pcMark = new THREE.Group(); SC.add(pcMark);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 16), mat(C.red)); cone.rotation.z = -Math.PI / 2; at(cone, -6.4, 0, 0); pcMark.add(cone);
  pcMark.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.12, 0.44, 0.6)), new THREE.LineBasicMaterial({ color: C.red })));
  pcMark.children[1].position.x = -4.6;
  SC.add(at(box(5.4, 7.0, 0.25, C.paper2), 2.6, 0, -0.35));
  const cpuL = label('CPU', 'plain big'); at(cpuL, 0.4, 3.25, 0); SC.add(cpuL);
  const R = { PC: [1.0, 2.45], IR: [3.7, 2.45], DEC: [3.7, 1.15], A: [1.0, -0.3], ALU: [3.7, -0.3], OUT: [2.6, -2.5] };
  const regs = {};
  [['PC', 1.6, 0.7, C.card], ['IR', 2.4, 0.7, C.card], ['DEC', 2.4, 0.6, C.yel], ['A', 1.6, 0.7, C.card], ['ALU', 1.9, 0.9, C.red], ['OUT', 4.4, 1.1, C.ink]].forEach(([k, w, h, c]) => {
    const m = box(w, h, 0.4, c); at(m, R[k][0], R[k][1], 0); SC.add(m);
    const l = label('', k === 'OUT' ? 'ink' : k === 'ALU' ? 'hot' : ''); l.position.z = 0.3; m.add(l);
    regs[k] = { m, l, c, flash: 0 };
  });
  // bus
  const busM = mat(0xd8d0c2);
  const bus = (pts) => { const p = new THREE.CurvePath(); for (let i = 0; i < pts.length - 1; i++) p.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i], -0.1), new THREE.Vector3(...pts[i + 1], -0.1))); SC.add(new THREE.Mesh(new THREE.TubeGeometry(p, 40, 0.07, 6), busM)); };
  bus([[-2.6, 3.3], [-2.6, -3.2]]); bus([[-3.1, 2.45], [0.2, 2.45]]); bus([[-2.6, -0.3], [0.2, -0.3]]); bus([[-2.6, -2.5], [0.4, -2.5]]);
  const busL = label('bus', 'plain'); at(busL, -2.25, -3.1, 0); SC.add(busL);
  // packet
  const pk = box(0.36, 0.36, 0.36, C.yel); pk.visible = false; SC.add(pk);
  const pkl = label('', 'on'); pkl.position.set(0, 0.42, 0); pk.add(pkl);
  const Z = 0.45;
  const V = (x, y) => new THREE.Vector3(x, y, Z);
  const fromSlot = (i, k) => [V(-4.6, slotY(i)), V(-2.6, slotY(i)), V(-2.6, R[k][1]), V(R[k][0], R[k][1])];
  const reg2 = (a, b) => [V(...R[a]), V(...R[b])];
  let queue = [], cur = null, want = 0, playing = false, phase = 'READY', note = '', count = 0;
  const inf = info(st, true);
  function q(dur, path, text, start, end) { queue.push({ dur, path, text, start, end }); }
  function flashReg(k) { regs[k].flash = 1; }
  function enqueue() {
    if (S.halted) return;
    const pc = S.pc, v = mem[pc], op = v >> 4, a = v & 15, name = op < 8 ? OPS[op] : '???';
    q(0.8, fromSlot(pc, 'IR'), () => bin8(mem[pc]), () => { phase = 'FETCH'; note = 'Copy the byte at address <b>' + pc + '</b> (the PC says so) into the instruction register, and add 1 to the PC.'; slots[pc].flash = 1; },
      () => { S.ir = mem[pc]; S.pc = (pc + 1) & 15; flashReg('IR'); flashReg('PC'); });
    q(0.55, reg2('IR', 'DEC'), () => name, () => { phase = 'DECODE'; note = 'Split the byte: <span class="mono">' + bin(op, 4) + '</span> is the opcode, which means <b>' + name + '</b>; <span class="mono">' + bin(a, 4) + '</span> is ' + (NOARG[name] ? 'ignored' : 'the address <b>' + a + '</b>') + '.'; }, () => flashReg('DEC'));
    const ex = (txt) => () => { phase = 'EXECUTE'; note = txt; };
    switch (name) {
      case 'LOAD': q(0.8, fromSlot(a, 'A'), () => String(mem[a]), ex('<b>LOAD ' + a + '</b>: copy memory[' + a + '] into A.'), () => { S.a = mem[a]; slots[a].flash = 1; flashReg('A'); }); break;
      case 'ADD': case 'SUB': {
        q(0.8, fromSlot(a, 'ALU'), () => String(mem[a]), ex('<b>' + name + ' ' + a + '</b>: send memory[' + a + '] to the ALU, which ' + (name === 'ADD' ? 'adds it to' : 'subtracts it from') + ' A (chapter 4\'s adder lives here).'), () => { slots[a].flash = 1; flashReg('ALU'); });
        q(0.55, reg2('ALU', 'A'), () => String(name === 'ADD' ? (S.a + mem[a]) & 255 : (S.a - mem[a]) & 255), null, () => { S.a = name === 'ADD' ? (S.a + mem[a]) & 255 : (S.a - mem[a]) & 255; flashReg('A'); });
        break;
      }
      case 'STORE': q(0.8, fromSlot(a, 'A').reverse(), () => String(S.a), ex('<b>STORE ' + a + '</b>: write A into memory[' + a + ']. (Nothing stops a program writing over its own code.)'), () => { mem[a] = S.a; slots[a].flash = 1; }); break;
      case 'JUMP': q(0.55, reg2('IR', 'PC'), () => String(a), ex('<b>JUMP ' + a + '</b>: put ' + a + ' in the PC, so the next fetch comes from address ' + a + '. This is how loops happen.'), () => { S.pc = a; flashReg('PC'); }); break;
      case 'JZ': {
        const it = { dur: 0.55, path: null, text: () => String(a), end: () => { if (S.a === 0) { S.pc = a; flashReg('PC'); } } };
        it.start = () => { phase = 'EXECUTE'; it.path = S.a === 0 ? reg2('IR', 'PC') : null; note = '<b>JZ ' + a + '</b>: A is ' + S.a + (S.a === 0 ? ', which is zero, so jump to ' + a + '.' : ', not zero, so carry on. This is how a program makes a decision.'); };
        queue.push(it); break;
      }
      case 'OUT': q(0.7, [V(...R.A), V(R.A[0], R.OUT[1]), V(...R.OUT)], () => String(S.a), ex('<b>OUT</b>: send A to the output.'), () => { S.out.push(S.a); if (S.out.length > 14) S.out.shift(); flashReg('OUT'); }); break;
      default: q(0.4, null, null, ex(name === 'HALT' ? '<b>HALT</b>: stop.' : 'Opcode ' + bin(op, 4) + ' isn\'t an instruction this CPU knows. It gives up.'), () => { S.halted = true; playing = false; setPlay(); });
    }
    q(0.01, null, null, null, () => { count++; });
  }
  function reset() {
    const r = assemble(ta.value);
    mem = r.mem; S = { pc: 0, ir: 0, a: 0, out: [], halted: false };
    queue = []; cur = null; want = 0; pk.visible = false; count = 0;
    phase = 'READY'; note = r.errs.length ? '<span class="err">Couldn\'t read ' + r.errs.join(', ') + '. Those became 0.</span>' : 'Program loaded at addresses 0–15. Press <b>step</b> to run one instruction, or <b>run</b>.';
  }
  const P = ui(host, [
    { type: 'button', label: 'step', primary: true, onClick: () => { if (S.halted) reset(); want = 1; } },
    { type: 'button', key: 'play', label: '▶ run', onClick: () => { if (S.halted) reset(); playing = !playing; setPlay(); } },
    { type: 'button', label: '↺ reset', onClick: () => { playing = false; setPlay(); reset(); } },
    { type: 'range', key: 'speed', label: 'speed', min: 0.5, max: 12, step: 0.5, value: 1.5, fmt: v => v + '×' },
    { type: 'select', key: 'prog', label: 'program', value: 'count', options: Object.entries(PROGRAMS).map(([k, v]) => ({ value: k, label: v.label })), onChange: v => { ta.value = PROGRAMS[v].src; playing = false; setPlay(); reset(); } },
    { type: 'html', key: 'ed', css: 'flex-basis:100%', html: '<details class="ed3"><summary>edit the program (one line per address, 0 to 15)</summary><textarea spellcheck="false" rows="16"></textarea><button>load into memory</button></details>' }
  ]);
  const ta = P.html_ed.querySelector('textarea');
  ta.value = PROGRAMS.count.src;
  P.html_ed.querySelector('button').addEventListener('click', () => { playing = false; setPlay(); reset(); });
  function setPlay() { P['btn_play'].textContent = playing ? '❚❚ pause' : '▶ run'; }
  reset();
  const tmp = new THREE.Vector3();
  st.update = (dt) => {
    if (!cur && !queue.length && (playing || want > 0) && !S.halted) { if (want > 0) want--; enqueue(); }
    if (!cur && queue.length) { cur = queue.shift(); cur.t = 0; if (cur.start) cur.start(); }
    if (cur) {
      cur.t += dt * P.speed;
      const path = cur.path;
      if (path) { pk.visible = true; along(path, ease(clamp(cur.t / cur.dur, 0, 1)), tmp); pk.position.copy(tmp); setHTML(pkl.el, cur.text ? cur.text() : ''); }
      else pk.visible = false;
      if (cur.t >= cur.dur) { if (cur.end) cur.end(); cur = null; pk.visible = false; }
    }
    slots.forEach((s, i) => {
      s.flash = Math.max(0, s.flash - dt * 2);
      s.m.material.color.set(s.flash > 0.05 ? C.yel : C.card);
      const v = mem[i];
      setHTML(s.l.el, '<span class="a">' + String(i).padStart(2, '0') + '</span> ' + bin8(v) + ' <b>' + disasm(v) + '</b> <span class="d">=' + v + '</span>');
    });
    pcMark.position.y = damp(pcMark.position.y, slotY(S.pc), 12, dt);
    Object.entries(regs).forEach(([k, r]) => { r.flash = Math.max(0, r.flash - dt * 2.5); r.m.scale.setScalar(1 + r.flash * 0.08); });
    setHTML(regs.PC.l.el, 'PC <b>' + S.pc + '</b>');
    setHTML(regs.IR.l.el, 'IR ' + bin8(S.ir));
    setHTML(regs.DEC.l.el, 'decoder: ' + (phase === 'READY' ? '·' : disasm(S.ir)));
    setHTML(regs.A.l.el, 'A <b>' + S.a + '</b>');
    setHTML(regs.ALU.l.el, 'ALU  + −');
    setHTML(regs.OUT.l.el, 'OUT ' + (S.out.length ? S.out.join(' ') : '·'));
    regs.DEC.m.material.color.set(phase === 'DECODE' ? C.red : C.yel);
    inf.set('<div class="phase3"><span class="ph ' + phase.toLowerCase() + '">' + phase + '</span> ' + note + '</div><div class="m mono">PC ' + S.pc + ' · A ' + S.a + ' · instructions run ' + count + (S.halted ? ' · <b>halted</b>' : '') + '</div>');
  };
  return st;
};

/* ==================================================================
   7a · the whole machine, a motherboard
================================================================== */
demos.machine = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [6.5, 8.5, 10], target: [0, 0.4, 0.2], h: w => Math.max(400, Math.min(520, w * 0.64)) });
  const inf = info(st);
  const board = box(9.6, 0.2, 6.6, C.pcb); at(board, 0, -0.1, 0); st.scene.add(board);
  const parts = [];
  const show = (d) => inf.set('<b class="t">' + d[0] + '</b><span class="stamp">' + d[1] + '</span><p>' + d[2] + '</p>' + (d[3] ? '<a href="#' + d[3] + '">more in that chapter →</a>' : ''));
  board.userData.onClick = () => show(['Motherboard', 'a dozen layers of copper', 'Fibreglass sandwiched with thin copper layers etched into traces: the <b>buses</b>. Every chip on top talks to every other one through these wires. The gold lines show a few of them carrying data from the CPU.', '']);
  function part(build, x, z, lift, name, d) {
    const g = new THREE.Group(); const top = build(g); g.position.set(x, 0, z); st.scene.add(g);
    const l = label(name, 'big'); l.position.set(0, top + 0.35, 0); g.add(l);
    const p = { g, lift, hover: false };
    g.userData.onClick = () => show(d);
    g.userData.onHover = on => { p.hover = on; };
    parts.push(p);
  }
  part(g => { g.add(at(box(1.7, 0.12, 1.7, C.dark), 0, 0.06, 0)); g.add(at(box(1.2, 0.14, 1.2, C.silver), 0, 0.19, 0)); return 0.26; }, -1.3, -0.6, 3.2, 'CPU',
    ['CPU', '~3–5 GHz · 8–16 cores', 'The fetch-decode-execute loop from chapter 6, a few billion times a second, on many cores side by side. Look inside one and most of the area is not arithmetic but <b>cache</b>: tiny fast memory, because waiting for RAM is the slowest thing a CPU does.', 'cpu']);
  part(g => { [-0.18, 0.18].forEach(z => { g.add(at(box(3.0, 0.85, 0.1, C.blu), 0, 0.45, z)); for (let k = 0; k < 6; k++) g.add(at(box(0.36, 0.3, 0.04, C.dark), -1.15 + k * 0.46, 0.5, z + 0.07)); }); return 0.9; }, 1.6, -0.9, 2.4, 'RAM',
    ['RAM', '8–32 GB · ~80 ns', 'Working memory: chapter 5\'s grid of cells, a few billion bytes of it. Every running program and open file lives here. It is fast, but it forgets everything when the power goes off.', 'memory']);
  part(g => { g.add(at(box(3.0, 0.4, 0.15, C.dark), 0, 0.2, 0.5)); g.add(at(box(3.6, 0.35, 1.5, C.red), 0, 0.6, 0)); [-0.85, 0.85].forEach(x => { const f = cyl(0.5, 0.06, C.ink); at(f, x, 0.8, 0); g.add(f); }); return 0.85; }, -1.0, 1.9, 1.6, 'GPU',
    ['GPU', 'thousands of small cores', 'Graphics processor: thousands of simple cores that all run the same small program on different data, typically one per pixel. When you use <code>WEBGL</code> mode or a shader in p5, your code runs here. (This page\'s 3D runs here too.)', '']);
  part(g => { g.add(at(box(0.7, 0.08, 2.4, C.dark), 0, 0.05, 0)); g.add(at(box(0.55, 0.02, 1.2, C.card), 0, 0.1, 0.3)); return 0.12; }, -3.9, -0.6, 2.0, 'SSD',
    ['SSD storage', '256 GB–2 TB · ~50 µs', 'Remembers without power: electric charge trapped in billions of flash cells. Your files, your apps, the operating system itself. About a thousand times slower than RAM, which is why programs are loaded from here into RAM before they run.', '']);
  part(g => { g.add(at(box(0.8, 0.1, 0.8, C.yel), 0, 0.05, 0)); [-0.25, 0.25].forEach(x => { g.add(at(cyl(0.035, 1.2, C.ink), x, 0.65, -0.3)); }); return 1.25; }, 3.5, 1.9, 1.2, 'Wi-Fi',
    ['Network chip', 'radio at 2.4 / 5 GHz', 'Turns bytes into radio waves (or voltage on an ethernet cable) and back. The machine\'s door to every other machine: chapters 9 to 11 happen through here.', 'net']);
  part(g => { g.add(at(box(1.8, 0.55, 1.4, C.paper2), 0, 0.28, 0)); return 0.55; }, 3.6, -2.1, 1.4, 'power',
    ['Battery & power', 'steady ~1 V for the chip', 'Everything on this board is a pattern of voltages, so the first requirement is power that never wobbles. Regulators turn the battery\'s voltage into the exact, steady levels each chip needs.', '']);
  part(g => { g.add(at(box(0.5, 0.12, 0.24, C.silver), 0, 0.06, 0)); return 0.12; }, 0.35, 0.55, 2.6, 'clock',
    ['Crystal oscillator', 'quartz, 25 MHz → ×200', 'A sliver of quartz that vibrates at a precise frequency when you put voltage on it. Circuits multiply it up to become the CPU\'s clock: the heartbeat from chapter 5.', 'memory']);
  part(g => { [-1.2, -0.6, 0].forEach(x => g.add(at(box(0.45, 0.3, 0.4, C.silver), x, 0.15, 0))); g.add(at(box(0.75, 0.3, 0.4, C.ink), 0.8, 0.15, 0)); g.add(at(cyl(0.12, 0.3, C.ink), 1.6, 0.15, 0)); return 0.3; }, -1.4, -2.95, 1.0, 'ports',
    ['Ports', 'USB · display · audio', 'The edges of the machine, where bits become keystrokes, pixels and sound, and back. A keyboard press is a few bytes arriving here; a frame on your screen is millions of bytes leaving.', '']);
  // traces
  const tGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const traces = [
    [[-1.3, 0.04, -0.6], [0.0, 0.04, -0.6], [0.0, 0.04, -0.9], [0.4, 0.04, -0.9]],
    [[-1.3, 0.04, -0.6], [-1.3, 0.04, 1.4]],
    [[-1.3, 0.04, -0.6], [-3.5, 0.04, -0.6]],
    [[-1.3, 0.04, -0.6], [-0.6, 0.04, 0.2], [2.4, 0.04, 0.2], [3.5, 0.04, 1.5]],
    [[-1.3, 0.04, -0.6], [-1.3, 0.04, -2.7]],
  ].map(p => { const w = wire(st.scene, p, { r: 0.03, off: 0xc9a54a, on: 0xc9a54a, glow: 0x332200, dotGeo: tGeo, gap: 0.5, speed: 1.4 }); w.set(1); return w; });
  const P = ui(host, [
    { type: 'range', key: 'ex', label: 'explode', min: 0, max: 1, step: 0.01, value: 0, fmt: v => Math.round(v * 100) + '%' },
    { type: 'readout' }
  ]);
  inf.set('<b class="t">Inside a laptop</b><p>Roughly. Click any part. Slide <b>explode</b> to lift them apart.</p>');
  st.update = (dt, t) => {
    parts.forEach(p => { p.g.position.y = damp(p.g.position.y, P.ex * p.lift + (p.hover ? 0.2 : 0), 8, dt); });
    const flat = P.ex < 0.04;
    traces.forEach(w => { w.mesh.visible = flat; w.set(flat); w.tick(t); });
    P.readout.textContent = 'click a part · drag to orbit';
  };
  return st;
};

/* ==================================================================
   7b · the memory hierarchy, as distances
================================================================== */
demos.latency = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [1, 4.2, 17], target: [0.4, 3.2, 0], h: w => Math.max(400, Math.min(520, w * 0.62)) });
  const L = [
    ['register', 0.3, 'inside the core, right next to the adder. One cycle.'],
    ['L1 cache', 1, 'a few dozen KB per core, on the same chip, millimetres away.'],
    ['L2 cache', 4, 'a few MB, still on the chip.'],
    ['L3 cache', 15, 'shared by all cores; tens of MB.'],
    ['RAM', 80, 'a separate chip a few centimetres away, over the memory bus.'],
    ['SSD', 5e4, 'flash storage. A random read has to find and sense the right cells.'],
    ['hard disk', 5e6, 'a spinning platter and a moving arm. Mechanical, so glacial.'],
    ['US server', 2.5e8, 'from Bangalore and back: ~28,000 km of fibre, routers, queues. Light in glass covers 200 km per millisecond, and this still takes a quarter of a second.'],
  ];
  const fmtNs = ns => ns < 1000 ? ns + ' ns' : ns < 1e6 ? (ns / 1e3) + ' µs' : (ns / 1e6) + ' ms';
  const human = s => { if (s < 90) return s.toFixed(0) + ' s'; const m = s / 60; if (m < 90) return m.toFixed(1) + ' min'; const h = m / 60; if (h < 36) return h.toFixed(1) + ' hours'; const d = h / 24; if (d < 60) return d.toFixed(1) + ' days'; const mo = d / 30.4; if (mo < 24) return mo.toFixed(0) + ' months'; return (d / 365).toFixed(0) + ' years'; };
  const cols = [C.yel, C.yel, C.yel, C.yel, C.red, C.blu, C.blu, C.ink];
  const H = ns => 0.2 + Math.log10(ns / 0.3) * 0.75;
  for (let k = 0; k <= 9; k++) {
    const y = 0.2 + k * 0.75;
    st.scene.add(polyLine([[-7.4, y, -0.7], [7.4, y, -0.7]], 0xe2dacb));
    const l = label('×' + (k < 4 ? Math.pow(10, k).toLocaleString() : '10<sup>' + k + '</sup>'), 'plain', [1, 0.5]); at(l, -7.5, y, -0.7); st.scene.add(l);
  }
  const towers = L.map((d, i) => {
    const x = -6.1 + i * 1.75, h = H(d[1]);
    const m = box(1.0, h, 1.0, cols[i]); at(m, x, h / 2, 0); st.scene.add(m);
    const bl = label(d[0], 'plain'); at(bl, x, -0.35, 0.6); st.scene.add(bl);
    const tl = label('<b>' + fmtNs(d[1]) + '</b><br>' + human(d[1] / 0.3), i === 7 ? 'hot' : '', [0.5, 1]); at(tl, x, h + 0.15, 0); st.scene.add(tl);
    m.userData.onClick = () => { fire(i); inf.set('<b class="t">' + d[0] + ': ' + fmtNs(d[1]) + '</b><p>' + d[2] + '</p><p>If one CPU cycle took a second, this would take <b>' + human(d[1] / 0.3) + '</b>.</p>'); };
    return { m, x, h };
  });
  const cpu = box(0.6, 0.6, 0.6, C.ink); at(cpu, -7.9, 0.3, 1.2); st.scene.add(cpu);
  const cl = label('the core', 'plain'); at(cl, -7.9, -0.3, 1.2); st.scene.add(cl);
  const balls = [];
  function fire(i) {
    const b = sphere(0.16, C.red, { mat: { emissive: 0x500000 } }); st.scene.add(b);
    balls.push({ b, i, t: 0, dur: 0.6 + Math.log10(L[i][1] / 0.3) * 0.5 });
  }
  const inf = info(st, true);
  inf.set('<b class="t">How far away is the data?</b><p>Heights are logarithmic: every grid line is <b>ten times</b> slower than the one below. Labels say the real time, and then how long it would feel if one CPU cycle took a second. Click a tower.</p>');
  ui(host, [{ type: 'button', label: 'ask all eight at once', primary: true, onClick: () => L.forEach((_, i) => fire(i)) }]);
  const tmp = new THREE.Vector3();
  st.update = dt => {
    for (let k = balls.length - 1; k >= 0; k--) {
      const B = balls[k]; B.t += dt; const u = B.t / B.dur, T = towers[B.i];
      const there = u < 0.5 ? u * 2 : 2 - u * 2;
      tmp.set(-7.9 + (T.x + 7.9) * there, 0.3 + (T.h + 0.2 - 0.3) * Math.sin(there * Math.PI / 2), 1.2 - 0.6 * there);
      B.b.position.copy(tmp);
      if (u >= 1) { kill(B.b); balls.splice(k, 1); }
    }
  };
  return st;
};

/* ==================================================================
   8 · the operating system shares the cores
================================================================== */
demos.os = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [0.6, 10, 12.5], target: [0.6, 0, 0.2], h: w => Math.max(400, Math.min(520, w * 0.64)) });
  const POOL = [['music', Infinity, C.blu], ['browser', 7, C.red], ['p5 sketch', Infinity, C.yel], ['download', 5, C.green], ['editor', 4, C.paper2], ['virus scan', 10, 0x77706a], ['chat', 3, 0x8ec5ff], ['photo export', 8, 0xff8a80], ['game', Infinity, 0x9a5bd6]];
  let procs = [], queue = [], cores = [], blocks = [], slice = 0, switches = 0, done = [], next = 0, T = 0;
  const laneZ = (k, n) => (k - (n - 1) / 2) * 1.7;
  const X = tau => -1.2 + (T - tau) * 0.75;
  const coreG = new THREE.Group(); st.scene.add(coreG);
  const qL = label('ready queue', 'plain'); at(qL, -5.0, 0, -3.8); st.scene.add(qL);
  function makeCores(n) {
    cores.forEach(c => { if (c.p) { endBlock(c.p); c.p.state = 'q'; queue.unshift(c.p); } });
    while (coreG.children.length) kill(coreG.children[0]);
    blocks.forEach(b => kill(b.m)); blocks = [];
    cores = [];
    for (let k = 0; k < n; k++) {
      const z = laneZ(k, n);
      const pl = box(1.3, 0.2, 1.2, C.dark); at(pl, -2.3, -0.1, z); coreG.add(pl);
      const l = label('core ' + (k + 1), 'plain big', [1, 0.5]); at(l, -3.1, 0, z); coreG.add(l);
      const strip = box(9.5, 0.04, 0.9, C.paper2, { edges: false }); at(strip, -1.2 + 4.75, -0.12, z); coreG.add(strip);
      cores.push({ z, p: null });
    }
    const tl = label('← now · · · earlier →', 'plain'); at(tl, 3.5, -0.3, laneZ(n - 1, n) + 1.0); coreG.add(tl);
  }
  function addProc(def) {
    const d = def || POOL[next % POOL.length]; next++;
    const work = d[1] === Infinity ? Infinity : d[1] * (0.7 + Math.random() * 0.6);
    const m = box(0.7, 1, 0.7, d[2]); m.position.set(-6, 0.5, 0); st.scene.add(m);
    const l = label(d[0], '', [0.5, 1]); l.position.set(0, 0.75, 0); m.add(l);
    const p = { name: d[0], left: work, total: work, color: d[2], m, l, state: 'q', core: null, block: null };
    procs.push(p); queue.push(p);
  }
  function startBlock(p, c) {
    const m = box(1, 0.3, 0.8, p.color, { edges: false }); m.position.set(-1.2, 0.05, c.z); st.scene.add(m);
    p.block = { m, start: T, end: null }; blocks.push(p.block);
  }
  function endBlock(p) { if (p.block) { p.block.end = T; p.block = null; } }
  function dispatch() { cores.forEach(c => { if (!c.p && queue.length) { const p = queue.shift(); c.p = p; p.state = 'run'; p.core = c; startBlock(p, c); switches++; } }); }
  function schedule() {
    cores.forEach(c => { if (c.p) { endBlock(c.p); c.p.state = 'q'; c.p.core = null; queue.push(c.p); c.p = null; } });
    dispatch(); slice = 0;
  }
  const P = ui(host, [
    { type: 'buttons', key: 'n', label: 'cores', value: 2, options: [1, 2, 4].map(v => ({ label: String(v), value: v })), onChange: v => { makeCores(v); dispatch(); } },
    { type: 'range', key: 'q', label: 'time slice (slowed down)', min: 0.1, max: 2, step: 0.05, value: 0.7, fmt: v => v.toFixed(2) + ' s' },
    { type: 'button', label: '+ start a program', onClick: () => addProc() },
    { type: 'readout' }
  ]);
  makeCores(2);
  for (let i = 0; i < 6; i++) addProc();
  dispatch();
  const tgt = new THREE.Vector3();
  st.update = dt => {
    T += dt; slice += dt;
    cores.forEach(c => {
      const p = c.p; if (!p) return;
      p.left -= dt;
      if (p.left <= 0) { endBlock(p); p.state = 'done'; c.p = null; done.push(p.name); p.dying = 1; }
    });
    if (slice >= P.q) schedule(); else dispatch();
    for (let i = procs.length - 1; i >= 0; i--) {
      const p = procs[i];
      if (p.state === 'done') {
        p.dying -= dt * 1.5; p.m.position.y += dt * 2; p.m.scale.setScalar(Math.max(0.01, p.dying));
        if (p.dying <= 0) { kill(p.m); procs.splice(i, 1); }
      }
    }
    queue.forEach((p, i) => { p._qi = i; });
    procs.forEach(p => {
      if (p.state === 'done') return;
      const h = p.total === Infinity ? 1 : 0.25 + 0.75 * Math.max(0, p.left) / p.total;
      p.m.scale.y = damp(p.m.scale.y, h, 8, dt);
      if (p.state === 'run') tgt.set(-2.3, p.m.scale.y / 2, p.core.z);
      else { const i = p._qi, col = Math.floor(i / 5); tgt.set(-5.0 - col * 1.2, p.m.scale.y / 2, -2.8 + (i % 5) * 1.4); }
      p.m.position.lerp(tgt, 1 - Math.exp(-9 * dt));
      setHTML(p.l.el, p.name + (p.total === Infinity ? ' <span class="m">∞</span>' : ' <span class="m">' + Math.max(0, p.left).toFixed(1) + 's</span>'));
    });
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      const x1 = X(b.end ?? T), x2 = X(b.start);
      if (x1 > 8.3) { kill(b.m); blocks.splice(i, 1); continue; }
      const x2c = Math.min(x2, 8.3);
      b.m.scale.x = Math.max(0.001, x2c - x1 - 0.03); b.m.position.x = (x1 + x2c) / 2;
    }
    P.readout.textContent = procs.filter(p => p.state !== 'done').length + ' programs · ' + P.n + ' core' + (P.n > 1 ? 's' : '') + ' · ' + switches + ' switches' + (done.length ? ' · finished: ' + done.slice(-3).join(', ') : '');
  };
  return st;
};

/* ==================================================================
   9 · packets across a network
================================================================== */
demos.net = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [0, 9, 16], target: [0, -0.3, 0], h: w => Math.max(420, Math.min(540, w * 0.66)) });
  const rnd = mulberry(26);
  const pos = [];
  while (pos.length < 16) {
    const p = new THREE.Vector3(rnd() * 10.4 - 5.2, rnd() * 2.4 - 1.2, rnd() * 5.4 - 2.7);
    if (pos.every(q => q.distanceTo(p) > 1.7)) pos.push(p);
  }
  const YOU = 16, SRV = 17;
  pos.push(new THREE.Vector3(-7.6, 0, 0.6), new THREE.Vector3(7.6, 0, -0.4));
  const edges = new Map(), adj = pos.map(() => []);
  const addE = (a, b) => { const k = Math.min(a, b) + '-' + Math.max(a, b); if (a === b || edges.has(k)) return; edges.set(k, [a, b]); adj[a].push(b); adj[b].push(a); };
  const nearest = (i, k, pool) => pool.filter(j => j !== i).sort((a, b) => pos[i].distanceTo(pos[a]) - pos[i].distanceTo(pos[b])).slice(0, k);
  const routers = [...Array(16).keys()];
  routers.forEach(i => nearest(i, 3, routers).forEach(j => addE(i, j)));
  nearest(YOU, 2, routers).forEach(j => addE(YOU, j));
  nearest(SRV, 2, routers).forEach(j => addE(SRV, j));
  // make sure it's one connected network
  for (; ;) {
    const seen = new Set([0]), stack = [0];
    while (stack.length) { const i = stack.pop(); adj[i].forEach(j => { if (!seen.has(j)) { seen.add(j); stack.push(j); } }); }
    if (seen.size === pos.length) break;
    let best = null;
    seen.forEach(a => pos.forEach((_, b) => { if (!seen.has(b)) { const d = pos[a].distanceTo(pos[b]); if (!best || d < best[2]) best = [a, b, d]; } }));
    addE(best[0], best[1]);
  }
  const dead = new Array(pos.length).fill(false);
  const nodes = pos.map((p, i) => {
    let m;
    if (i === YOU) { m = new THREE.Group(); m.add(at(box(1.1, 0.1, 0.75, C.ink), 0, 0, 0)); const scr = box(1.1, 0.72, 0.05, C.ink); scr.position.set(0, 0.36, -0.37); scr.rotation.x = -0.25; m.add(scr); }
    else if (i === SRV) { m = box(0.8, 1.7, 0.8, C.blu); }
    else { m = box(0.55, 0.28, 0.55, C.card); m.userData.onClick = () => { dead[i] = !dead[i]; m.material.color.set(dead[i] ? 0x9e978c : C.card); setHTML(m.l.el, dead[i] ? '✕' : ''); paintLinks(); }; const l = label('', 'plain'); l.position.y = 0.4; m.add(l); m.l = l; }
    m.position.copy(p); st.scene.add(m); return m;
  });
  const youL = label('you · 198.51.100.23', 'big'); at(youL, pos[YOU].x, pos[YOU].y - 0.55, pos[YOU].z); st.scene.add(youL);
  const srvL = label('server · 203.0.113.7', 'big'); at(srvL, pos[SRV].x, pos[SRV].y - 1.2, pos[SRV].z); st.scene.add(srvL);
  const E = [...edges.values()];
  const lg = new THREE.BufferGeometry();
  const lp = new Float32Array(E.length * 6), lc = new Float32Array(E.length * 6);
  E.forEach(([a, b], k) => { pos[a].toArray(lp, k * 6); pos[b].toArray(lp, k * 6 + 3); });
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  st.scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true })));
  const ok = new THREE.Color(0x6d6660), bad = new THREE.Color(0xe2dacb);
  function paintLinks() { E.forEach(([a, b], k) => { const c = dead[a] || dead[b] ? bad : ok; c.toArray(lc, k * 6); c.toArray(lc, k * 6 + 3); }); lg.attributes.color.needsUpdate = true; }
  paintLinks();
  function route() {
    const dist = pos.map(() => Infinity), prev = pos.map(() => -1), used = pos.map(() => false);
    dist[YOU] = 0;
    for (; ;) {
      let u = -1; dist.forEach((d, i) => { if (!used[i] && d < Infinity && (u < 0 || d < dist[u])) u = i; });
      if (u < 0) break; if (u === SRV) break; used[u] = true;
      adj[u].forEach(v => { if (dead[v]) return; const w = pos[u].distanceTo(pos[v]) * (1 + Math.random() * 1.4); if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } });
    }
    if (dist[SRV] === Infinity) return null;
    const path = []; for (let v = SRV; v >= 0; v = prev[v]) path.unshift(v); return path;
  }
  let chunks = [], got = [], order = [], sentAt = [], pk = [], launches = [], resent = 0, dropped = 0;
  const pGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26); SHARED.add(pGeo);
  function launch(seq) {
    sentAt[seq] = T;
    const path = route();
    if (!path) return;
    const m = new THREE.Mesh(pGeo, mat(C.yel, { emissive: 0x403000 })); m.position.copy(pos[YOU]); st.scene.add(m);
    const l = label('#' + seq, 'pk'); l.position.y = 0.3; m.add(l);
    pk.push({ seq, path, h: 0, u: 0, m, dead: 0 });
  }
  function send(text) {
    pk.forEach(p => kill(p.m)); pk = [];
    const s = (text || ' ').slice(0, 40);
    chunks = []; for (let i = 0; i < s.length; i += 4) chunks.push(s.slice(i, i + 4));
    got = chunks.map(() => null); order = []; sentAt = []; resent = 0; dropped = 0;
    launches = chunks.map((_, i) => ({ at: T + i * 0.18, seq: i }));
  }
  let T = 0;
  const inf = info(st, true);
  const P = ui(host, [
    { type: 'text', key: 'msg', label: 'message', value: 'hello from bangalore!', max: 40, width: 220, onEnter: v => send(v) },
    { type: 'button', label: 'send', primary: true, onClick: () => send(P.in_msg.value) },
    { type: 'range', key: 'loss', label: 'packet loss per hop', min: 0, max: 0.3, step: 0.01, value: 0.04, fmt: v => Math.round(v * 100) + '%' },
    { type: 'button', label: 'repair all routers', onClick: () => { dead.fill(false); nodes.forEach((m, i) => { if (m.l) { m.material.color.set(C.card); setHTML(m.l.el, ''); } }); paintLinks(); } },
    { type: 'readout' }
  ]);
  send(P.in_msg.value);
  const TIMEOUT = 3.2;
  st.update = dt => {
    T += dt;
    for (let i = launches.length - 1; i >= 0; i--) if (T >= launches[i].at) { launch(launches[i].seq); launches.splice(i, 1); }
    // retransmit anything not acknowledged in time (TCP's job)
    sentAt.forEach((s, seq) => { if (got[seq] === null && T - s > TIMEOUT && !launches.some(l => l.seq === seq)) { resent++; launch(seq); } });
    for (let i = pk.length - 1; i >= 0; i--) {
      const p = pk[i];
      if (p.dead) {
        p.dead += dt; p.m.position.y -= dt * 3 * p.dead; p.m.material.color.set(C.red);
        if (p.dead > 1) { kill(p.m); pk.splice(i, 1); }
        continue;
      }
      const a = pos[p.path[p.h]], b = pos[p.path[p.h + 1]];
      p.u += dt * 3.2 / Math.max(0.1, a.distanceTo(b));
      if (p.u >= 1) {
        p.h++; p.u = 0;
        const node = p.path[p.h];
        if (node === SRV) {
          if (got[p.seq] === null) { got[p.seq] = chunks[p.seq]; order.push(p.seq); }
          kill(p.m); pk.splice(i, 1); continue;
        }
        if (dead[node] || Math.random() < P.loss) { p.dead = 0.001; dropped++; continue; }
      }
      p.m.position.copy(pos[p.path[p.h]]).lerp(pos[p.path[p.h + 1]], p.u);
    }
    const complete = got.length && got.every(g => g !== null);
    inf.set('<div class="pkts">' + chunks.map((c, i) => '<span class="' + (got[i] !== null ? 'ok' : 'miss') + '"><i>#' + i + '</i>' + esc(got[i] !== null ? c : '····').replace(/ /g, '␣') + '</span>').join('') + '</div>' +
      '<div class="m mono">arrived in the order: ' + (order.join(' ') || '…') + ' · dropped ' + dropped + ' · re-sent ' + resent + (complete ? ' · <b class="okc">message complete ✓</b>' : '') + '</div>');
    P.readout.textContent = 'click a router to break it';
  };
  return st;
};

/* ==================================================================
   10 · what happens when you type a URL
================================================================== */
demos.url = (host, wrap) => {
  const ACT = [['your browser', -6.2, C.yel], ['DNS resolver', -3.3, C.paper2], ['root server', -0.9, C.paper2], ['.com server', 1.3, C.paper2], ['example.com<br>name server', 3.5, C.paper2], ['web server<br>203.0.113.7', 6.3, C.blu]];
  const B = 0, R = 1, RT = 2, TLD = 3, AU = 4, S = 5;
  const K = { dns: C.yel, tcp: C.ink, tls: C.green, http: C.red, self: C.blu };
  const STEPS = [
    { f: B, t: B, k: 'self', lab: 'read the URL', ms: 1, h: 'You type <code>https://www.example.com/</code> and press Enter. The browser splits it up: <b>https</b> (encrypted HTTP), host <b>www.example.com</b>, path <b>/</b>. But the internet routes by number, not by name. So first: what\'s the number?' },
    { f: B, t: R, k: 'dns', lab: 'www.example.com?', ms: 4, h: '<b>DNS</b>, the internet\'s phone book. Your laptop asks a <b>resolver</b> (run by your ISP, or a public one like 1.1.1.1). One tiny UDP packet.', raw: 'QUERY  www.example.com  type A  (port 53)' },
    { f: R, t: RT, k: 'dns', lab: '…?', ms: 20, h: 'The resolver doesn\'t have it cached, so it starts at the top: a <b>root server</b>. There are 13 root addresses, answered by over a thousand machines worldwide.' },
    { f: RT, t: R, k: 'dns', lab: 'ask .com', ms: 20, h: 'The root doesn\'t know every name. It only knows who runs each ending: ".com is over there."' },
    { f: R, t: TLD, k: 'dns', lab: 'example.com?', ms: 20, h: 'Ask the <b>.com</b> servers.' },
    { f: TLD, t: R, k: 'dns', lab: 'ask its name server', ms: 20, h: '".com" doesn\'t know either, but knows which name server example.com\'s owner registered.' },
    { f: R, t: AU, k: 'dns', lab: 'www.example.com?', ms: 30, h: 'Ask the <b>authoritative</b> name server: the one the owner of example.com controls.' },
    { f: AU, t: R, k: 'dns', lab: '203.0.113.7', ms: 30, h: 'An answer. It comes with a <b>TTL</b> (time to live): "you may remember this for an hour". Next time, every step above is skipped.', raw: 'www.example.com.  3600  IN  A  203.0.113.7' },
    { f: R, t: B, k: 'dns', lab: '203.0.113.7', ms: 4, h: 'The browser has a number. Now it can talk to the actual server.' },
    { f: B, t: S, k: 'tcp', lab: 'SYN', ms: 40, h: '<b>TCP handshake.</b> TCP is the layer that turns a lossy scatter of packets (chapter 9) into a reliable stream: numbered, acknowledged, re-sent. It starts with "shall we talk?"' },
    { f: S, t: B, k: 'tcp', lab: 'SYN-ACK', ms: 40, h: '"Yes, let\'s." Each side tells the other the number it will start counting packets from.' },
    { f: B, t: S, k: 'tls', lab: 'ACK + ClientHello', ms: 40, h: '<b>TLS</b>, the S in https. Along with the final ACK, the browser sends a hello: the encryption methods it knows, and half of a key exchange.' },
    { f: S, t: B, k: 'tls', lab: 'ServerHello + certificate', ms: 40, h: 'The server sends the other half of the key exchange, and a <b>certificate</b>: proof it really is example.com, signed by an authority your browser already trusts. Both sides now compute the same secret key without ever sending it. From here on, everything is encrypted. 🔒' },
    { f: B, t: S, k: 'http', lab: 'GET /', ms: 40, h: 'Finally, <b>HTTP</b>: the actual request. It is just text (encrypted on the wire).', raw: 'GET / HTTP/1.1\nHost: www.example.com\nUser-Agent: Mozilla/5.0 (Macintosh…)\nAccept: text/html' },
    { f: S, t: B, k: 'http', lab: '200 OK · index.html', ms: 60, h: 'The server finds (or generates) the page and sends it back. Also just text: a status line, some headers, a blank line, then HTML.', raw: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\n\n<!doctype html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n  <script src="p5.min.js"></script>\n  <script src="sketch.js"></script>\n</head>\n<body><main></main></body>\n</html>' },
    { f: B, t: B, k: 'self', lab: 'parse HTML', ms: 4, h: 'The browser reads the HTML top to bottom, building a tree (chapter 11). It finds three more files it needs.' },
    { f: B, t: S, k: 'http', lab: 'GET style.css, p5.min.js, sketch.js', ms: 40, h: 'Three more requests, sent at once over the same encrypted connection. (Real pages often need 50 to 100 files. Many come from other servers, each starting its own DNS → TCP → TLS dance.)' },
    { f: S, t: B, k: 'http', lab: '200 · 200 · 200', ms: 80, h: 'CSS, JavaScript. The JavaScript is source code: your browser will compile it to machine code (chapter 6) in milliseconds.' },
    { f: B, t: B, k: 'self', lab: 'layout + paint', ms: 16, h: 'Style, layout, paint: the tree becomes boxes, the boxes become pixels, the pixels go to the GPU. <b>First paint.</b>' },
    { f: B, t: B, k: 'self', lab: 'setup() · draw() · draw() …', ms: 16, h: 'Your sketch runs: <code>setup()</code> once, then <code>draw()</code> about 60 times a second, each time handing the GPU a new frame. Everything you just watched happened in under half a second.' },
  ];
  const DZ = 0.8, LEN = STEPS.length * DZ + 1.5;
  const st = makeStage(host, wrap, { cam: [0, 11, 10], target: [0, 0, -5.5], h: w => Math.max(440, Math.min(580, w * 0.72)) });
  ACT.forEach(([n, x, c]) => {
    const m = box(1.1, 1.0, 0.8, c); at(m, x, 0.5, 0.7); st.scene.add(m);
    const l = label(n, 'big'); at(l, x, 1.35, 0.7); st.scene.add(l);
    st.scene.add(polyLine([[x, 0.02, 0.3], [x, 0.02, -LEN]], 0xcfc6b6));
  });
  const G = new THREE.Group(); st.scene.add(G);
  let k = 0, playing = false, acc = 0, ms = 0, anims = [];
  const inf = info(st, true);
  function fire(i) {
    const s = STEPS[i], z = -(i + 1) * DZ, x1 = ACT[s.f][1], x2 = ACT[s.t][1], col = K[s.k];
    ms += s.ms;
    if (s.f === s.t) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 32), mat(col)); m.rotation.x = Math.PI / 2; at(m, x1, 0.05, z); G.add(m);
      const l = label(s.lab, 'step', [0, 0.5]); at(l, x1 + 0.5, 0.05, z); G.add(l);
      anims.push({ t: 0, dur: 0.4, m, self: true });
    } else {
      const lift = 0.5 + Math.abs(x2 - x1) * 0.12;
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x1, 0.08, z), new THREE.Vector3((x1 + x2) / 2, lift * 2, z), new THREE.Vector3(x2, 0.08, z));
      const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)); g.setDrawRange(0, 0);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col })); G.add(line);
      const head = sphere(0.13, col); G.add(head);
      const l = label(s.lab, 'step', [0.5, 1]); at(l, (x1 + x2) / 2, lift + 0.15, z); G.add(l);
      anims.push({ t: 0, dur: 0.75, curve, g, head });
    }
    inf.set('<div class="stepinfo"><span class="ph ' + s.k + '">' + (i + 1) + ' / ' + STEPS.length + ' · ' + s.k.toUpperCase().replace('SELF', 'BROWSER') + '</span> ' + s.h + (s.raw ? '<pre>' + esc(s.raw) + '</pre>' : '') + '</div><div class="m mono">time so far ≈ <b>' + ms + ' ms</b> (simulated, a typical first visit)</div>');
  }
  function reset() { while (G.children.length) kill(G.children[0]); anims = []; k = 0; ms = 0; inf.set('<div class="stepinfo">Press <b>next</b> to step through it, or <b>play</b>. Each arc is one message; time runs away from you, so the arcs pile up into a picture of the whole conversation.</div>'); }
  const P = ui(host, [
    { type: 'button', label: 'next →', primary: true, onClick: () => { if (k < STEPS.length) fire(k++); } },
    { type: 'button', key: 'play', label: '▶ play', onClick: b => { if (k >= STEPS.length) reset(); playing = !playing; b.textContent = playing ? '❚❚ pause' : '▶ play'; } },
    { type: 'button', label: '↺ reset', onClick: () => { playing = false; P.btn_play.textContent = '▶ play'; reset(); } },
    { type: 'html', key: 'key', html: '<span class="key3"><i style="background:#f0c02e"></i>DNS <i style="background:#151515"></i>TCP <i style="background:#2f8f5b"></i>TLS <i style="background:#d7261e"></i>HTTP <i style="background:#1d4fbd"></i>browser</span>' }
  ]);
  reset();
  st.update = dt => {
    if (playing) { acc += dt; if (acc > 1.5) { acc = 0; if (k < STEPS.length) fire(k++); else { playing = false; P.btn_play.textContent = '▶ play'; } } }
    anims = anims.filter(a => {
      a.t += dt; const u = clamp(a.t / a.dur, 0, 1);
      if (a.self) a.m.scale.setScalar(0.3 + 0.7 * ease(u));
      else { a.g.setDrawRange(0, Math.floor(ease(u) * 49)); a.curve.getPoint(ease(u), a.head.position); if (u >= 1) a.head.visible = false; }
      return u < 1;
    });
  };
  return st;
};

/* ==================================================================
   11a · a tiny page as a DOM tree, as boxes, exploded
================================================================== */
const PAGE = { tag: 'body', r: [0, 0, 12, 8], bg: '#f4efe6', kids: [
  { tag: 'header', r: [0, 0, 12, 1.4], bg: '#151515', kids: [
    { tag: 'h1', r: [0.35, 0.3, 5.6, 0.8], bg: '#151515', fg: '#f0c02e', text: 'Hello, web', size: 38, weight: 700 },
    { tag: 'nav', r: [6.8, 0.3, 4.85, 0.8], bg: '#2a2926', kids: [
      { tag: 'a', r: [7.0, 0.45, 2.1, 0.5], bg: '#2a2926', fg: '#8ec5ff', text: 'home', size: 22 },
      { tag: 'a', r: [9.35, 0.45, 2.1, 0.5], bg: '#2a2926', fg: '#8ec5ff', text: 'work', size: 22 }] }] },
  { tag: 'main', r: [0, 1.6, 12, 5.4], bg: '#ece5d8', kids: [
    { tag: 'article', r: [0.3, 1.8, 7.8, 5.0], bg: '#fffdf8', kids: [
      { tag: 'h2', r: [0.6, 2.0, 7.2, 0.7], bg: '#fffdf8', text: 'Bits all the way down', size: 28, weight: 700 },
      { tag: 'p', r: [0.6, 2.8, 7.2, 1.5], bg: '#fffdf8', text: 'Every pixel on this page is three bytes. Every byte is eight switches. Every switch is a transistor.', size: 20 },
      { tag: 'canvas', r: [0.6, 4.45, 3.6, 2.15], art: true }] },
    { tag: 'aside', r: [8.4, 1.8, 3.3, 5.0], bg: '#f0c02e', kids: [
      { tag: 'p', r: [8.6, 2.0, 2.9, 1.6], bg: '#f0c02e', text: 'Made with p5.js and a lot of loops.', size: 20 },
      { tag: 'button', r: [8.7, 3.95, 2.7, 0.8], bg: '#d7261e', fg: '#ffffff', text: 'click me', size: 22, weight: 700 }] }] },
  { tag: 'footer', r: [0, 7.2, 12, 0.8], bg: '#1d4fbd', fg: '#ffffff', text: 'made in Bangalore', size: 20 }] };
function serialize(n, ind = '') {
  if (!n.kids) return ind + '<' + n.tag + '>' + (n.art ? '' : n.text || '') + '</' + n.tag + '>';
  return ind + '<' + n.tag + '>\n' + n.kids.map(k => serialize(k, ind + '  ')).join('\n') + '\n' + ind + '</' + n.tag + '>';
}
function nodeTexture(n) {
  const s = 80, w = Math.round(n.r[2] * s), h = Math.round(n.r[3] * s);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  if (n.art) {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    const r = mulberry(5);
    for (let i = 0; i < 14; i++) { g.fillStyle = ['#d7261e', '#f0c02e', '#1d4fbd', '#151515', '#fffdf8'][Math.floor(r() * 5)]; const x = r() * w, y = r() * h; g.fillRect(x, y, r() * w * 0.5, r() * h * 0.5); }
    g.strokeStyle = '#151515'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
  } else {
    g.fillStyle = n.bg; g.fillRect(0, 0, w, h);
    if (n.text) {
      g.fillStyle = n.fg || '#151515'; g.font = (n.weight || 400) + ' ' + n.size + 'px "Space Grotesk", sans-serif'; g.textBaseline = 'top';
      const words = n.text.split(' '); let line = '', y = 10;
      words.forEach(wd => { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > w - 24 && line) { g.fillText(line, 12, y); line = wd; y += n.size * 1.25; } else line = t; });
      g.fillText(line, 12, y);
    } else {
      g.fillStyle = 'rgba(109,102,96,.9)'; g.font = '15px "JetBrains Mono", monospace'; g.textBaseline = 'top'; g.fillText('<' + n.tag + '>', 6, 4);
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
demos.dom = (host, wrap) => {
  const st = makeStage(host, wrap, { cam: [0, 0, 15.5], target: [0, 0, 0], h: w => Math.max(400, Math.min(520, w * 0.64)) });
  const inf = info(st);
  const all = [];
  let leaf = 0;
  (function walk(n, depth, parent) {
    const geo = new THREE.PlaneGeometry(n.r[2], n.r[3]);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: nodeTexture(n), side: THREE.DoubleSide }));
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), LINE));
    const tl = label('&lt;' + n.tag + '&gt;', 'plain'); m.add(tl);
    st.scene.add(m);
    const node = { n, m, tl, depth, parent, kids: [], page: new THREE.Vector3(n.r[0] + n.r[2] / 2 - 6, -(n.r[1] + n.r[3] / 2) + 4, 0) };
    if (parent) parent.kids.push(node);
    all.push(node);
    m.userData.onClick = () => select(node);
    m.userData.onHover = on => { node.hover = on; };
    (n.kids || []).forEach(k => walk(k, depth + 1, node));
    if (!n.kids) node.tx = leaf++;
    else node.tx = node.kids.reduce((s, k) => s + k.tx, 0) / node.kids.length;
  })(PAGE, 0, null);
  const mid = (leaf - 1) / 2;
  all.forEach(a => { a.tree = new THREE.Vector3((a.tx - mid) * 1.45, 3.4 - a.depth * 1.75, 0); });
  // tree edges
  const links = all.filter(a => a.parent);
  const lp = new Float32Array(links.length * 6);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const lm = new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0 });
  st.scene.add(new THREE.LineSegments(lg, lm));
  let sel = null, camGoal = null;
  st.controls.addEventListener('start', () => { camGoal = null; });
  function select(a) {
    sel = a;
    const html = serialize(a.n);
    const px = a.n.r.map(v => Math.round(v * 80));
    inf.set('<b class="t">&lt;' + a.n.tag + '&gt;</b><span class="stamp">depth ' + a.depth + '</span>' + (a.parent ? '<span class="stamp">inside &lt;' + a.parent.n.tag + '&gt;</span>' : '') +
      '<pre>' + esc(html.split('\n').slice(0, 9).join('\n')) + (html.split('\n').length > 9 ? '\n  …' : '') + '</pre><p class="m mono">its box: x ' + px[0] + ' y ' + px[1] + ' · ' + px[2] + ' × ' + px[3] + ' px</p>');
  }
  const VIEWS = { page: { cam: [0, 0, 15.5] }, layers: { cam: [11, 5.5, 11.5] }, tree: { cam: [0, 0, 16] } };
  const P = ui(host, [
    { type: 'buttons', key: 'v', label: 'view', value: 'page', options: [{ label: 'the page', value: 'page' }, { label: 'boxes, exploded', value: 'layers' }, { label: 'the DOM tree', value: 'tree' }], onChange: v => { camGoal = VIEWS[v].cam; } },
    { type: 'range', key: 'gap', label: 'layer gap', min: 0.3, max: 2, step: 0.05, value: 1.1, fmt: v => v.toFixed(2) },
    { type: 'readout' }
  ]);
  inf.set('<b class="t">One page, three ways to see it</b><p>What you see, what the browser builds (boxes inside boxes), and the tree of elements the HTML describes. Same nodes in all three. Click any box.</p>');
  const tmp = new THREE.Vector3(), cgoal = new THREE.Vector3();
  let treeAmt = 0;
  st.update = dt => {
    const v = P.v, k = 1 - Math.exp(-5 * dt);
    treeAmt = damp(treeAmt, v === 'tree' ? 1 : 0, 5, dt);
    all.forEach(a => {
      if (v === 'tree') tmp.copy(a.tree);
      else { tmp.copy(a.page); tmp.z = a.depth * (v === 'layers' ? P.gap : 0.015); }
      if (a.hover || a === sel) tmp.z += v === 'page' ? 0.01 : 0.35;
      a.m.position.lerp(tmp, k);
      const sx = v === 'tree' ? 1.3 / a.n.r[2] : 1, sy = v === 'tree' ? 0.62 / a.n.r[3] : 1;
      a.m.scale.x = damp(a.m.scale.x, sx, 5, dt); a.m.scale.y = damp(a.m.scale.y, sy, 5, dt);
      a.tl.visible = treeAmt > 0.5;
      a.m.material.color.set(a === sel ? 0xffc9c0 : 0xffffff);
    });
    links.forEach((a, i) => { a.parent.m.position.toArray(lp, i * 6); a.m.position.toArray(lp, i * 6 + 3); lp[i * 6 + 1] -= 0.31 * a.parent.m.scale.y * a.parent.n.r[3]; lp[i * 6 + 4] += 0.31 * a.m.scale.y * a.n.r[3]; });
    lg.attributes.position.needsUpdate = true; lm.opacity = treeAmt;
    if (camGoal) { cgoal.set(...camGoal); st.camera.position.lerp(cgoal, 1 - Math.exp(-3 * dt)); st.controls.target.lerp(tmp.set(0, 0, 0), 1 - Math.exp(-3 * dt)); if (st.camera.position.distanceTo(cgoal) < 0.02) camGoal = null; }
    P.readout.textContent = all.length + ' elements · drag to orbit';
  };
  return st;
};

/* ==================================================================
   11b · this very page, exploded (after Firefox's old 3D view, "Tilt")
================================================================== */
demos.tilt = (host, wrap) => {
  const sec = host.closest('section') || document.body;
  const sr = sec.getBoundingClientRect();
  const s = 12 / Math.max(300, sr.width);
  const items = [];
  const colorFor = el => {
    const t = el.tagName.toLowerCase();
    if (el.classList.contains('demo')) return C.red;
    if (el.classList.contains('callout')) return C.card;
    if (/^h[1-6]$/.test(t)) return C.yel;
    if (t === 'pre' || t === 'code' || t === 'kbd') return C.ink;
    if (t === 'a' || t === 'button') return C.blu;
    if (t === 'p' || t === 'li' || t === 'td' || t === 'th') return 0xffffff;
    return C.paper2;
  };
  (function walk(el, depth) {
    if (items.length > 450 || depth > 9) return;
    [...el.children].forEach(c => {
      if (c === host || c.tagName === 'SCRIPT' || c.tagName === 'STYLE') return;
      const r = c.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      items.push({ el: c, depth, x: (r.left - sr.left + r.width / 2) * s - 6, z: (r.top - sr.top + r.height / 2) * s, w: r.width * s, d: r.height * s });
      if (!c.classList.contains('demo')) walk(c, depth + 1);
    });
  })(sec, 1);
  const Hd = sr.height * s;
  const dist = Math.max(14, Hd * 0.95 + 6);
  const st = makeStage(host, wrap, { cam: [dist * 0.3, dist * 0.72, Hd / 2 + dist * 0.62], target: [0, 0, Hd / 2], h: w => Math.max(420, Math.min(560, w * 0.7)) });
  st.scene.add(at(box(12, 0.06, Hd, C.paper, { edges: true }), 0, 0, Hd / 2));
  const inf = info(st);
  const hov = label('', 'on'); hov.visible = false; st.scene.add(hov);
  const ms = items.map(it => {
    const m = box(it.w, 0.06, it.d, colorFor(it.el), { mat: { transparent: true, opacity: 0.88 } });
    m.position.set(it.x, 0, it.z); st.scene.add(m);
    const name = it.el.tagName.toLowerCase() + (it.el.className && typeof it.el.className === 'string' ? '.' + it.el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    m.userData.onHover = on => { hov.visible = on; if (on) { setHTML(hov.el, '&lt;' + esc(name) + '&gt;'); hov.position.copy(m.position); hov.position.y += 0.25; } };
    m.userData.onClick = () => {
      const txt = (it.el.textContent || '').replace(/\s+/g, ' ').trim();
      inf.set('<b class="t">&lt;' + esc(name) + '&gt;</b><span class="stamp">depth ' + it.depth + '</span><p>' + esc(txt.slice(0, 160)) + (txt.length > 160 ? '…' : '') + '</p>');
    };
    return { m, it };
  });
  const P = ui(host, [
    { type: 'range', key: 'gap', label: 'nesting height', min: 0, max: 1.6, step: 0.02, value: 0.7, fmt: v => v.toFixed(2) },
    { type: 'readout' }
  ]);
  inf.set('<b class="t">This chapter, exploded</b><p>Every box below is a real element on this page, read from the browser a moment ago. Height is how deeply it is nested. Hover to name it, click to read it.</p>');
  st.update = dt => {
    ms.forEach(({ m, it }) => { m.position.y = damp(m.position.y, it.depth * P.gap, 6, dt); });
    P.readout.textContent = items.length + ' elements in this chapter';
  };
  return st;
};

// ---------- mounting / lifecycle ----------
function mount(host) {
  const name = host.dataset.demo;
  host.innerHTML = '';
  if (!demos[name]) { host.textContent = 'missing demo: ' + name; return; }
  const head = document.createElement('div'); head.className = 'demo-head';
  head.innerHTML = (host.dataset.title || name) + '<span class="tag">three.js · drag to turn</span>';
  const wrap = document.createElement('div'); wrap.className = 'demo-canvas';
  host.append(head, wrap);
  let st;
  try { st = demos[name](host, wrap); }
  catch (e) { console.error(e); wrap.innerHTML = '<p style="padding:20px">This demo needs WebGL, which this browser isn\'t giving us. (' + esc(e.message) + ')</p>'; return; }
  if (host.dataset.foot) { const f = document.createElement('div'); f.className = 'demo-foot'; f.innerHTML = '<p>' + host.dataset.foot + '</p>'; host.appendChild(f); }
  host._st = st; host._w = host.clientWidth;
  live.add(st);
}
function destroy(host) {
  const st = host._st; if (!st) return;
  live.delete(st); st.io.disconnect(); st.controls.dispose();
  st.scene.traverse(o => {
    if (o.geometry && !SHARED.has(o.geometry)) o.geometry.dispose();
    if (o.material && !SHARED.has(o.material)) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
  st.renderer.dispose(); st.renderer.forceContextLoss();
  host._st = null; host.innerHTML = '';
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  live.forEach(st => st.step(dt));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
let rt;
window.addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => document.querySelectorAll('section.chapter.active .demo[data-demo]').forEach(h => {
    if (h._st && Math.abs(h.clientWidth - h._w) > 40 && h.clientWidth > 0) { destroy(h); mount(h); }
  }), 300);
});

window.Demos = {
  activate(section) { section.querySelectorAll('.demo[data-demo]').forEach(h => { if (!h._st) mount(h); }); },
  deactivate(section) { section.querySelectorAll('.demo[data-demo]').forEach(destroy); }
};
window.Sketches = window.Sketches || { activate() { }, deactivate() { } };
// app.js routes chapters and calls Demos, so it must only run once Demos exists
import('./app.js');
