// Four interactive diagrams for the PCD NID workshop page: a Markov walk, a
// Wave Function Collapse, a recursion, a quantum walk. All in Bhupali, all
// played on raga.fm's tanpura, koto and tabla through js/bank.js.
(() => {
'use strict';
const PC = { S:0, r:1, R:2, g:3, G:4, M:5, "M'":6, P:7, d:8, D:9, n:10, N:11 };
const NAME = ['S','r','R','g','G','M',"M'",'P','d','D','n','N'];
const INK = '#151515', PAPER = '#f4efe6', RED = '#d7261e', YELLOW = '#f2c230', BLUE = '#1d4fbd', DIM = '#8a847b', WELL = '#e6dfd0';
const SA = 60;   // C4 on the koto; the tanpura is re-pitched to it
const pcOf = s => ((s % 12) + 12) % 12;
const label = s => { const o = Math.floor(s / 12); return NAME[pcOf(s)] + (o > 0 ? "'" : o < 0 ? '.' : ''); };
function parse(str) {
  return str.replace(/,/g, ' ').trim().split(/\s+/).filter(Boolean).map(tok => {
    let t = tok, tivra = false; if (t.startsWith("M'")) { tivra = true; t = 'M' + t.slice(2); }
    const up = (t.match(/'/g) || []).length, down = (t.match(/\./g) || []).length;
    return (tivra ? 6 : PC[t.replace(/['.]/g, '')]) + 12 * (up - down);
  });
}
// Bhupali, as raga.fm's data has it (Bor p.44)
const RAGA = (() => {
  const aroha = parse("S R G P D S'"), avroha = parse("S' D P G R S"), pakad = ["S R G R S D. S R G", "G R S D. S R G", "P G D P G R S"].map(parse);
  const pcs = [0, 2, 4, 7, 9];
  const w = { up: {}, down: {} };
  const add = (seq, weight) => { for (let i = 0; i + 1 < seq.length; i++) { const a = seq[i], b = seq[i + 1]; if (a === b) continue; const dir = b > a ? 'up' : 'down'; (w[dir][a] = w[dir][a] || {})[b] = (w[dir][a][b] || 0) + weight; } };
  add(aroha, 1); add(avroha, 1); for (const p of pakad) add(p, 3);
  const states = []; for (let s = -5; s <= 16; s++) if (pcs.includes(pcOf(s))) states.push(s);
  return { name: 'Bhupali', aroha, avroha, pakad, pcs, w, states, vadi: 4, samvadi: 9 };
})();
const tanpuraOn = () => { Bank.wake(); if (!Bank.tanpura.running) Bank.tanpura.start(SA, 0.45); };
const note = (st, when, dur, vol) => Bank.koto(SA + st, when, dur, vol == null ? 0.8 : vol);
function weightedPick(keys, ws) { let r = Math.random() * ws.reduce((a, b) => a + b, 0); for (let i = 0; i < keys.length; i++) { r -= ws[i]; if (r < 0) return keys[i]; } return keys[keys.length - 1]; }

// canvas helpers: crisp at any pixel ratio, sized by its CSS box
function canvas(id) {
  const c = document.getElementById(id); if (!c) return { c: null }; const g = c.getContext('2d');
  c.style.height = c.getAttribute('height') + 'px';   // the attribute is the CSS height; the bitmap follows the box
  const fit = () => { const r = c.getBoundingClientRect(); c.width = Math.round(r.width * devicePixelRatio); c.height = Math.round(r.height * devicePixelRatio); g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  fit(); window.addEventListener('resize', fit);
  return { c, g, get W() { return c.width / devicePixelRatio; }, get H() { return c.height / devicePixelRatio; } };
}
function text(g, s, x, y, opt = {}) { g.fillStyle = opt.color || INK; g.font = (opt.weight || 400) + ' ' + (opt.size || 12) + 'px "JetBrains Mono", monospace'; g.textAlign = opt.align || 'left'; g.textBaseline = opt.base || 'middle'; g.fillText(s, x, y); }
function btn(id, fn) { const b = document.getElementById(id); if (b) b.addEventListener('click', fn); return b; }
function ladderY(st, top, bottom, lo = -5, hi = 16) { return bottom - (st - lo) / (hi - lo) * (bottom - top); }

// ============================================================ 1 · Markov
(() => {
  const cv = canvas('d-markov'); if (!cv.c) return;
  let temperature = 0.5, playing = false, timer = null, pos = 0, dir = 'up', last = null, path = [];
  const row = (st, d) => RAGA.w[d][st] || {};
  function step() {
    let d = dir, o = row(pos, d);
    if (!Object.keys(o).length) { d = d === 'up' ? 'down' : 'up'; o = row(pos, d); dir = d; }
    const keys = Object.keys(o).map(Number);
    const ws = keys.map(k => { let x = o[k]; if (pcOf(k) === RAGA.vadi) x *= 1.6; if (pcOf(k) === RAGA.samvadi) x *= 1.3; return Math.pow(x, 1 / temperature); });
    const pick = keys.length ? weightedPick(keys, ws) : 0;
    last = { from: pos, to: pick, dir: d, keys, ws };
    pos = pick; if (Math.random() < 0.22) dir = dir === 'up' ? 'down' : 'up';
    path.push(pick); if (path.length > 24) path.shift();
    note(pick, Bank.now(), 0.55, 0.8);
  }
  function tick() { if (!playing) return; step(); draw(); timer = setTimeout(tick, 600); }
  function draw() {
    const g = cv.g, W = cv.W, H = cv.H; g.clearRect(0, 0, W, H);
    const pcs = RAGA.pcs, n = pcs.length, cell = Math.min(30, (W * 0.5 - 60) / (n + 1));
    [['up', 0, 'climbing'], ['down', W * 0.26, 'descending']].forEach(([d, ox, lab]) => {
      const gx = ox + 30, gy = 30;
      text(g, lab, gx, 10, { color: DIM, size: 11 });
      pcs.forEach((p, j) => { text(g, NAME[p], gx + j * cell + cell / 2, gy - 8, { color: DIM, size: 11, align: 'center' }); text(g, NAME[p], gx - 10, gy + j * cell + cell / 2, { color: DIM, size: 11, align: 'right' }); });
      pcs.forEach((from, i) => {
        // the row for this pitch class, summed over octaves
        const r = {}; for (const s in RAGA.w[d]) if (pcOf(+s) === from) for (const t in RAGA.w[d][s]) r[pcOf(+t)] = (r[pcOf(+t)] || 0) + RAGA.w[d][s][t];
        const tot = Object.values(r).reduce((a, b) => a + b, 0) || 1;
        pcs.forEach((to, j) => {
          const w = (r[to] || 0) / tot;
          g.fillStyle = w ? `rgba(29,79,189,${(0.12 + Math.sqrt(w) * 0.85).toFixed(2)})` : WELL;
          g.fillRect(gx + j * cell + 1, gy + i * cell + 1, cell - 2, cell - 2);
          if (last && last.dir === d && pcOf(last.from) === from) { g.strokeStyle = YELLOW; g.lineWidth = 2; g.strokeRect(gx + 0.5, gy + i * cell + 0.5, n * cell - 1, cell - 1); if (pcOf(last.to) === to) { g.strokeStyle = RED; g.strokeRect(gx + j * cell + 1.5, gy + i * cell + 1.5, cell - 3, cell - 3); } }
        });
      });
    });
    // the line so far, on the ladder
    const L = W * 0.55, R = W - 16, T = 24, B = H - 22;
    for (const st of RAGA.states) { const y = ladderY(st, T, B); g.strokeStyle = pcOf(st) === RAGA.vadi ? YELLOW : WELL; g.lineWidth = 1; g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke(); text(g, label(st), L - 6, y, { color: DIM, size: 10, align: 'right' }); }
    const dx = (R - L) / 24;
    path.forEach((st, i) => { const x = L + (i + 0.5) * dx, y = ladderY(st, T, B); g.fillStyle = i === path.length - 1 ? RED : BLUE; g.beginPath(); g.arc(x, y, i === path.length - 1 ? 5 : 3.5, 0, Math.PI * 2); g.fill(); if (i) { const px = L + (i - 0.5) * dx, py = ladderY(path[i - 1], T, B); g.strokeStyle = BLUE; g.lineWidth = 1.2; g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); } });
    text(g, `temperature ${temperature.toFixed(2)}  ·  from the lit row, a column is drawn; the red cell is the note sounding`, 30, H - 10, { color: DIM, size: 11 });
  }
  btn('d-markov-play', e => { Bank.wake(); playing = !playing; e.target.textContent = playing ? 'stop' : 'play the walk'; if (playing) { tanpuraOn(); tick(); } else clearTimeout(timer); });
  const t = document.getElementById('d-markov-temp'); t.addEventListener('input', () => { temperature = +t.value; document.getElementById('d-markov-temp-out').textContent = temperature.toFixed(2); draw(); });
  draw();
})();

// ============================================================ 2 · WFC
(() => {
  const cv = canvas('d-wfc'); if (!cv.c) return;
  const N = 16, S = RAGA.states.filter(s => s >= -3 && s <= 14), P = S.length;
  const adj = {}, prior = {};
  for (const a of S) { adj[a] = {}; prior[a] = (1 / (1 + Math.abs(a - 5) / 6)) * (pcOf(a) === RAGA.vadi ? 1.6 : 1) * (pcOf(a) === RAGA.samvadi ? 1.3 : 1);
    for (const b of S) { const d = b - a; if (d === 0) { adj[a][b] = 0.15; continue; } if (Math.abs(d) > 9) continue; const r = RAGA.w[d > 0 ? 'up' : 'down'][a]; const w = r && r[b]; if (w) adj[a][b] = w / (1 + Math.abs(d) / 12); } }
  let endOn = 'home', doms = null, fixed = null, trace = [], step = 0, anim = null, playing = false, playBeat = -1;
  const H = dom => { let s = 0; for (const m in dom) s += dom[m]; let h = 0; for (const m in dom) { const p = dom[m] / s; if (p > 0) h -= p * Math.log2(p); } return h; };
  const size = dom => Object.keys(dom).length;
  function propagate(d, from) {
    const q = []; if (from > 0) q.push([from - 1, from]); if (from < N - 1) q.push([from + 1, from]);
    while (q.length) { const [i, j] = q.shift(); let removed = false;
      for (const v in d[i]) { let ok = false; for (const u in d[j]) { if (j > i ? adj[+v][+u] : adj[+u][+v]) { ok = true; break; } } if (!ok) { delete d[i][v]; removed = true; } }
      if (removed) { if (!size(d[i])) return false; if (i > 0 && i - 1 !== j) q.push([i - 1, i]); if (i < N - 1 && i + 1 !== j) q.push([i + 1, i]); } }
    return true;
  }
  function attempt() {
    const d = []; for (let i = 0; i < N; i++) { const x = {}; for (const m of S) x[m] = prior[m]; d.push(x); }
    const f = new Array(N).fill(null), tr = [];
    const restrict = (dom, pc) => { for (const m in dom) if (pcOf(+m) !== pc || +m < -3 || +m > 9) delete dom[m]; };
    restrict(d[0], 0); if (!size(d[0]) || !propagate(d, 0)) return null;
    if (endOn !== 'free') { restrict(d[N - 1], endOn === 'home' ? 0 : RAGA.vadi); if (!size(d[N - 1]) || !propagate(d, N - 1)) return null; }
    tr.push({ slot: -1, ent: d.map(H), sizes: d.map(size), fixed: f.slice() });
    for (let k = 0; k < N; k++) {
      let best = -1, bh = Infinity; for (let i = 0; i < N; i++) { if (f[i] != null) continue; const h = H(d[i]) + Math.random() * 1e-3; if (h < bh) { bh = h; best = i; } }
      const keys = Object.keys(d[best]).map(Number);
      const ws = keys.map(m => { let w = d[best][m]; if (best > 0 && f[best - 1] != null) w *= adj[f[best - 1]][m] || 0; if (best < N - 1 && f[best + 1] != null) w *= adj[m][f[best + 1]] || 0; if (best > 1 && f[best - 2] === m) w *= 0.3; if (best < N - 2 && f[best + 2] === m) w *= 0.3; return w; });
      if (!(ws.reduce((a, b) => a + b, 0) > 0)) return null;
      const pick = weightedPick(keys, ws); f[best] = pick; d[best] = { [pick]: 1 };
      if (!propagate(d, best)) return null;
      tr.push({ slot: best, ent: d.map(H), sizes: d.map(size), fixed: f.slice() });
    }
    return tr;
  }
  function collapse() {
    clearInterval(anim); let tr = null, tries = 0; while (!tr && tries++ < 60) tr = attempt();
    if (!tr) return; trace = tr; step = 0; fixed = null;
    anim = setInterval(() => { step++; if (step >= trace.length) { step = trace.length - 1; fixed = trace[step].fixed; clearInterval(anim); document.getElementById('d-wfc-play').disabled = false; } draw(); }, 320);
    draw();
  }
  function play() {
    if (!fixed || playing) return; Bank.wake(); tanpuraOn(); playing = true;
    const bpm = 92, beat = 60 / bpm, t0 = Bank.now() + 0.15;
    const THEKA = 'dha dhin dhin dha dha dhin dhin dha dha tin tin na na dhin dhin dha'.split(' ');
    for (let i = 0; i < N; i++) { Bank.tabla(THEKA[i], t0 + i * beat, i === 0 ? 1 : 0.6); note(fixed[i], t0 + i * beat, beat * 0.95, 0.85); }
    Bank.tabla('dha', t0 + N * beat, 1); note(fixed[N - 1], t0 + N * beat, beat * 2, 0.9);   // sam
    let i = 0; const tick = () => { playBeat = i; draw(); i++; if (i <= N) setTimeout(tick, beat * 1000); else { playing = false; playBeat = -1; draw(); } }; setTimeout(tick, 150);
  }
  function draw() {
    const g = cv.g, W = cv.W, Hh = cv.H; g.clearRect(0, 0, W, Hh);
    const gx = 34, gy = 26, cw = (W - gx - 10) / N, ch = (Hh - gy - 40) / P;
    const t = trace.length ? trace[step] : null;
    for (let i = 0; i < N; i++) {
      const x = gx + i * cw;
      text(g, String(i + 1), x + cw / 2, gy - 12, { color: i === 0 ? RED : DIM, size: 10, align: 'center' });
      if (t) {
        const e = t.ent[i], hh = (e / Math.log2(P)) * P * ch;
        g.fillStyle = t.fixed[i] != null ? 'rgba(242,194,48,0.25)' : 'rgba(29,79,189,0.14)'; g.fillRect(x + 2, gy + P * ch - hh, cw - 4, hh);
        if (t.fixed[i] != null) { const yi = S.indexOf(t.fixed[i]); g.fillStyle = (playBeat === i || (playBeat === N && i === N - 1)) ? RED : YELLOW; g.fillRect(x + 2, gy + (P - 1 - yi) * ch + 1, cw - 4, ch - 2); text(g, label(t.fixed[i]), x + cw / 2, gy + (P - 1 - yi) * ch + ch / 2, { size: 10, align: 'center', color: INK }); }
        else text(g, t.sizes[i] + '', x + cw / 2, gy + P * ch + 10, { color: DIM, size: 10, align: 'center' });
        if (t.slot === i) { g.strokeStyle = RED; g.lineWidth = 1.5; g.strokeRect(x + 1, gy, cw - 2, P * ch); }
      } else { g.fillStyle = 'rgba(29,79,189,0.14)'; g.fillRect(x + 2, gy, cw - 4, P * ch); }
    }
    for (let r = 0; r < P; r++) text(g, label(S[P - 1 - r]), gx - 6, gy + r * ch + ch / 2, { color: DIM, size: 10, align: 'right' });
    text(g, t ? (step === 0 ? `the facts written in: slot 1 is Sa${endOn !== 'free' ? ', slot 16 is ' + (endOn === 'home' ? 'Sa' : 'the vadi') : ''}; the narrowing has already travelled` : step < trace.length - 1 ? `step ${step} of ${trace.length - 1}: the slot with the least entropy is decided (red), and its neighbours narrow` : `done. play it: sixteen beats of teentaal, and the sam is where it was always going`) : 'every slot is every note the raga allows. press collapse.', gx, Hh - 12, { color: DIM, size: 11 });
  }
  btn('d-wfc-collapse', () => { document.getElementById('d-wfc-play').disabled = true; collapse(); });
  btn('d-wfc-play', play);
  document.getElementById('d-wfc-end').addEventListener('change', e => { endOn = e.target.value; });
  draw();
})();

// ============================================================ 3 · Recursion
(() => {
  const cv = canvas('d-rec'); if (!cv.c) return;
  const ladder = RAGA.states;
  const shift = ph => ph.map(s => { const i = ladder.indexOf(s); return i >= 0 && i + 1 < ladder.length ? ladder[i + 1] : s; });
  const mirror = ph => ph.slice().reverse();
  const grow = ph => { const last = ph[ph.length - 1], i = ladder.indexOf(last); return ph.concat([ladder[Math.min(ladder.length - 1, i + (ph.length % 2 ? 1 : -1))]]); };
  const RULES = [['shift up', shift], ['mirror', mirror], ['grow', grow]];
  let levels = [[{ ph: RAGA.pakad[0].slice(0, 3), rule: 'the motif' }]], playing = false, lit = null;
  function growTree() { if (levels.length >= 4) return; const next = []; for (const n of levels[levels.length - 1]) for (const [name, f] of RULES) next.push({ ph: f(n.ph), rule: name, parent: n }); levels.push(next); draw(); }
  function reset() { levels = [levels[0]]; lit = null; draw(); }
  function play() {
    if (playing) return; Bank.wake(); tanpuraOn(); playing = true;
    let t = Bank.now() + 0.1; const seq = [];
    levels.forEach((lv, li) => lv.forEach(n => { seq.push({ n, at: t }); n.ph.forEach((s, i) => { note(s, t + i * 0.3, 0.28, 0.8); }); t += n.ph.length * 0.3 + (li === 0 ? 0.7 : 0.45); }));
    const start = performance.now(), t0 = Bank.now();
    (function watch() { const now = Bank.now(); let cur = null; for (const s of seq) if (s.at <= now + 0.02) cur = s.n; lit = cur; draw(); if (now < t) requestAnimationFrame(watch); else { playing = false; lit = null; draw(); } })();
  }
  function draw() {
    const g = cv.g, W = cv.W, H = cv.H; g.clearRect(0, 0, W, H);
    const rows = levels.length, rowH = (H - 30) / Math.max(3, rows);
    const pos = new Map();
    levels.forEach((lv, li) => {
      const y = 20 + li * rowH + rowH / 2, w = Math.min(120, (W - 20) / lv.length), noteW = Math.min(14, (w - 10) / 7);
      lv.forEach((n, i) => {
        const x = 10 + (i + 0.5) * ((W - 20) / lv.length); pos.set(n, { x, y });
        if (n.parent && pos.get(n.parent)) { const p = pos.get(n.parent); g.strokeStyle = WELL; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y + 16); g.lineTo(x, y - 16); g.stroke(); }
        const bw = n.ph.length * noteW + 8, x0 = x - bw / 2;
        g.fillStyle = lit === n ? YELLOW : li === 0 ? INK : WELL; g.fillRect(x0, y - 14, bw, 28);
        n.ph.forEach((s, k) => { const yy = y + 8 - (s + 5) / 21 * 18; g.fillStyle = lit === n ? INK : li === 0 ? PAPER : BLUE; g.beginPath(); g.arc(x0 + 4 + (k + 0.5) * noteW, yy, 2.6, 0, Math.PI * 2); g.fill(); });
        if (lv.length <= 9) text(g, n.rule + (li === 0 ? ': ' + n.ph.map(label).join(' ') : ''), x, y + 24, { color: DIM, size: 10, align: 'center' });
      });
    });
    text(g, `${rows - 1} level${rows === 2 ? '' : 's'} of the same three rules on a three-note motif · ${levels[levels.length - 1].length} phrases`, 10, H - 8, { color: DIM, size: 11 });
  }
  btn('d-rec-grow', growTree); btn('d-rec-play', play); btn('d-rec-reset', reset);
  draw();
})();

// ============================================================ 4 · Quantum walk
(() => {
  const cv = canvas('d-q'); if (!cv.c) return;
  const S = RAGA.states.filter(s => s >= -5 && s <= 16), P = S.length;
  const pUp = S.map(s => { const u = Object.values(RAGA.w.up[s] || {}).reduce((a, b) => a + b, 0), d = Object.values(RAGA.w.down[s] || {}).reduce((a, b) => a + b, 0); const p = (u + d) ? u / (u + d) : 0.5; return Math.max(0.08, Math.min(0.92, 0.5 + 0.6 * (p - 0.5))); });
  let re, im, cl, coherence = 3, auto = null, steps = 0, measuredQ = null, measuredC = null;
  function reset() { re = new Float64Array(2 * P); im = new Float64Array(2 * P); cl = new Array(P).fill(0); const x0 = S.indexOf(0); re[2 * x0] = Math.SQRT1_2; im[2 * x0 + 1] = Math.SQRT1_2; cl[x0] = 1; steps = 0; measuredQ = measuredC = null; }
  function step() {
    for (let x = 0; x < P; x++) { const a = Math.sqrt(pUp[x]), b = Math.sqrt(1 - pUp[x]); const ur = re[2*x], ui = im[2*x], dr = re[2*x+1], di = im[2*x+1]; re[2*x] = a*ur + b*dr; im[2*x] = a*ui + b*di; re[2*x+1] = b*ur - a*dr; im[2*x+1] = b*ui - a*di; }
    const nr = new Float64Array(2 * P), ni = new Float64Array(2 * P), q = new Array(P).fill(0);
    for (let x = 0; x < P; x++) {
      if (x + 1 < P) { nr[2*(x+1)] += re[2*x]; ni[2*(x+1)] += im[2*x]; } else { nr[2*x+1] += re[2*x]; ni[2*x+1] += im[2*x]; }
      if (x - 1 >= 0) { nr[2*(x-1)+1] += re[2*x+1]; ni[2*(x-1)+1] += im[2*x+1]; } else { nr[2*x] += re[2*x+1]; ni[2*x] += im[2*x+1]; }
      q[x + 1 < P ? x + 1 : x] += cl[x] * pUp[x]; q[x - 1 >= 0 ? x - 1 : x] += cl[x] * (1 - pUp[x]);
    }
    re = nr; im = ni; cl = q; steps++; measuredQ = measuredC = null;
  }
  const probs = () => S.map((_, x) => re[2*x]**2 + im[2*x]**2 + re[2*x+1]**2 + im[2*x+1]**2);
  const phase = x => { const k = (re[2*x]**2 + im[2*x]**2) >= (re[2*x+1]**2 + im[2*x+1]**2) ? 0 : 1; return Math.atan2(im[2*x+k], re[2*x+k]); };
  function measure() {
    const p = probs(); let r = Math.random(), x = P - 1; for (let i = 0; i < P; i++) { r -= p[i]; if (r <= 0) { x = i; break; } }
    const norm = Math.sqrt(p[x]) || 1; const nr = new Float64Array(2 * P), ni = new Float64Array(2 * P); nr[2*x] = re[2*x] / norm; ni[2*x] = im[2*x] / norm; nr[2*x+1] = re[2*x+1] / norm; ni[2*x+1] = im[2*x+1] / norm; re = nr; im = ni;
    let rc = Math.random(), xc = P - 1; for (let i = 0; i < P; i++) { rc -= cl[i]; if (rc <= 0) { xc = i; break; } } cl = new Array(P).fill(0); cl[xc] = 1;
    measuredQ = x; measuredC = xc; steps = 0;
    note(S[x], Bank.now(), 0.6, 0.85);
  }
  function draw() {
    const g = cv.g, W = cv.W, H = cv.H; g.clearRect(0, 0, W, H);
    const p = probs(), gx = 40, top = 26, bottom = H - 46, bw = (W - gx - 16) / P;
    const mx = Math.max(...p, ...cl, 0.05);
    for (let x = 0; x < P; x++) {
      const X = gx + x * bw;
      const hq = p[x] / mx * (bottom - top), hc = cl[x] / mx * (bottom - top);
      g.fillStyle = `hsla(${(((phase(x) / Math.PI) * 180 + 360) % 360).toFixed(0)},70%,45%,0.9)`; g.fillRect(X + 2, bottom - hq, bw * 0.55 - 3, hq);
      g.fillStyle = 'rgba(21,21,21,0.25)'; g.fillRect(X + bw * 0.55, bottom - hc, bw * 0.45 - 2, hc);
      text(g, label(S[x]), X + bw / 2, bottom + 12, { color: pcOf(S[x]) === RAGA.vadi ? RED : DIM, size: 10, align: 'center' });
      if (measuredQ === x) { g.strokeStyle = RED; g.lineWidth = 2; g.strokeRect(X + 1, top - 4, bw * 0.55 - 1, bottom - top + 4); }
      if (measuredC === x) { g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(X + bw * 0.55 - 1, top - 4, bw * 0.45, bottom - top + 4); }
    }
    text(g, 'quantum: colour is phase', gx, 10, { color: BLUE, size: 11 }); text(g, 'classical: the same coin, tossed and forgotten', gx + 190, 10, { color: DIM, size: 11 });
    const sd = a => { const m = a.reduce((s, v, i) => s + v * i, 0); return Math.sqrt(a.reduce((s, v, i) => s + v * (i - m) ** 2, 0)); };
    text(g, `${steps} step${steps === 1 ? '' : 's'} since the last measurement · spread: quantum ${sd(p).toFixed(2)} rungs, classical ${sd(cl).toFixed(2)}` + (measuredQ != null ? ` · measured: ${label(S[measuredQ])} (classical would have drawn ${label(S[measuredC])})` : ''), gx, H - 10, { color: DIM, size: 11 });
  }
  btn('d-q-step', () => { step(); draw(); });
  btn('d-q-measure', () => { Bank.wake(); tanpuraOn(); measure(); draw(); });
  btn('d-q-auto', e => { Bank.wake(); if (auto) { clearInterval(auto); auto = null; e.target.textContent = 'let it play'; return; } tanpuraOn(); e.target.textContent = 'stop'; let k = 0; auto = setInterval(() => { if (k < coherence) { step(); k++; } else { measure(); k = 0; } draw(); }, 180); });
  btn('d-q-reset', () => { reset(); draw(); });
  const c = document.getElementById('d-q-coh'); c.addEventListener('input', () => { coherence = +c.value; document.getElementById('d-q-coh-out').textContent = coherence + (coherence === 1 ? ' (the classical walk)' : coherence % 2 ? ' (odd: always moves)' : ' (even: may stay)'); });
  reset(); draw();
})();

// load the bank once the page is up; nothing sounds before a click
Bank.load('samples/');
})();
