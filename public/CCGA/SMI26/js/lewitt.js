/* ------------------------------------------------------------------
   Instructions as art: Sol LeWitt and inventing your own algorithms.
   Demos for lewitt.html (p5 instance mode, drawing on drawingContext).
   Exposes window.Demos with the same activate/deactivate API app.js expects.
------------------------------------------------------------------ */
(function () {
  const PAPER = '#f4efe6', INK = '#151515', RED = '#d7261e', YEL = '#f0c02e', BLU = '#1d4fbd', MUTED = '#6d6660';
  const WALL = '#fbf9f4', LEAD = '#2e2c29', RULE = '#d8d0c2';
  const FOUR = [YEL, RED, BLU, INK];
  const TAU = Math.PI * 2;
  const MONO = '"JetBrains Mono", ui-monospace, monospace', SANS = '"Space Grotesk", system-ui, sans-serif';
  const demos = {};

  // ---------- tiny UI helper (same shape as demos.js / life.js) ----------
  function ui(host, controls) {
    const bar = document.createElement('div');
    bar.className = 'demo-ui';
    const params = {};
    controls.forEach(c => {
      if (c.type === 'range') {
        const lab = document.createElement('label');
        const span = document.createElement('span');
        const inp = document.createElement('input');
        inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step || 1; inp.value = c.value;
        params[c.key] = parseFloat(c.value);
        const fmt = c.fmt || (v => v);
        const update = () => { span.innerHTML = c.label + ' <b>' + fmt(params[c.key]) + '</b>'; };
        inp.addEventListener('input', () => { params[c.key] = parseFloat(inp.value); update(); if (c.onChange) c.onChange(params[c.key]); });
        update();
        lab.append(span, inp); bar.appendChild(lab);
      } else if (c.type === 'buttons') {
        const g = document.createElement('div'); g.className = 'group';
        if (c.label) { const s = document.createElement('span'); s.style.cssText = 'font-family:var(--mono);font-size:.78rem;margin-right:4px'; s.textContent = c.label; g.appendChild(s); }
        params[c.key] = c.value;
        const btns = c.options.map(o => {
          const b = document.createElement('button');
          b.textContent = o.label; b.classList.toggle('on', o.value === c.value);
          b.addEventListener('click', () => { params[c.key] = o.value; btns.forEach(x => x.classList.toggle('on', x === b)); if (c.onChange) c.onChange(o.value); });
          g.appendChild(b); return b;
        });
        bar.appendChild(g);
      } else if (c.type === 'button') {
        const b = document.createElement('button'); b.textContent = c.label; if (c.primary) { b.style.background = 'var(--ink)'; b.style.color = 'var(--paper)'; }
        b.addEventListener('click', () => c.onClick(b)); bar.appendChild(b); params['__btn_' + (c.key || c.label)] = b;
      } else if (c.type === 'select') {
        const lab = document.createElement('label'); const span = document.createElement('span'); span.textContent = c.label;
        const sel = document.createElement('select'); sel.style.cssText = 'font:inherit;font-size:.82rem;padding:3px 6px;border:2px solid var(--line);border-radius:6px;background:var(--card)';
        c.options.forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.label; sel.appendChild(op); });
        sel.value = c.value; params[c.key] = c.value;
        sel.addEventListener('change', () => { params[c.key] = sel.value; if (c.onChange) c.onChange(sel.value); });
        lab.append(span, sel); bar.appendChild(lab);
      } else if (c.type === 'text') {
        const lab = document.createElement('label'); const span = document.createElement('span'); span.textContent = c.label;
        const inp = document.createElement('input'); inp.type = 'text'; inp.value = c.value; inp.maxLength = c.max || 32;
        inp.style.cssText = 'font:inherit;font-size:.85rem;padding:3px 6px;border:2px solid var(--line);border-radius:6px;background:var(--card);width:170px';
        params[c.key] = c.value;
        inp.addEventListener('input', () => { params[c.key] = inp.value; if (c.onChange) c.onChange(inp.value); });
        lab.append(span, inp); bar.appendChild(lab);
      } else if (c.type === 'readout') {
        const r = document.createElement('div'); r.className = 'readout'; bar.appendChild(r); params.__readout = r;
      } else if (c.type === 'html') {
        const d = document.createElement('div'); d.innerHTML = c.html; d.style.cssText = c.css || ''; bar.appendChild(d); params['__html_' + c.key] = d;
      }
    });
    host.appendChild(bar);
    return params;
  }
  function W(host, max) { return Math.max(300, Math.min(max || 720, host.clientWidth - 4)); }
  // put an element between the demo title bar and the canvas
  function above(host, el) { host.insertBefore(el, host.querySelector('.demo-canvas')); return el; }

  // ---------- seeded randomness: same seed, same drafter ----------
  function mulberry(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const newSeed = () => (Math.random() * 1e9) >>> 0;
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

  // ---------- the pen ----------
  // A hand-drawn straight line: a slow wobble and a slight bow, strongest mid-line.
  function handLine(A, B, hand, R) {
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    if (!hand) return [A, B];
    const nx = -dy / len, ny = dx / len, n = Math.max(2, Math.ceil(len / 10));
    const f1 = 0.5 + R() * 1.5, f2 = 2 + R() * 3, p1 = R() * TAU, p2 = R() * TAU;
    const k = Math.min(1, len / 120), a1 = hand * (0.4 + R() * 0.8) * k, a2 = hand * 0.25 * R() * k;
    const bow = (R() - 0.5) * hand * Math.min(3, len / 80);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, env = Math.sin(Math.PI * t);
      const o = (a1 * Math.sin(f1 * TAU * t + p1) + a2 * Math.sin(f2 * TAU * t + p2)) * (0.35 + 0.65 * env) + bow * env;
      pts.push([A[0] + dx * t + nx * o, A[1] + dy * t + ny * o]);
    }
    return pts;
  }
  // The shape of a "not straight" line: a few sines added together.
  function waveShape(R) { return [0, 1, 2].map(i => ({ f: (0.6 + R() * 1.6) * (i + 1), p: R() * TAU, w: [1, 0.5, 0.25][i] * (0.6 + R() * 0.4) })); }
  function wavyLine(A, B, hand, R, amp, shape) {
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, n = Math.max(8, Math.ceil(len / 5));
    amp = amp || Math.min(22, 5 + len * 0.06);
    shape = shape || waveShape(R);
    const cycles = 0.6 + len / 260, jit = hand ? hand * 0.3 : 0, jp = R() * TAU;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, env = Math.pow(Math.sin(Math.PI * t), 0.5);
      let o = 0; for (const s of shape) o += s.w * Math.sin(s.f * cycles * TAU * t + s.p);
      o = o * amp * env / 1.4 + jit * Math.sin(9 * t + jp);
      pts.push([A[0] + dx * t + nx * o, A[1] + dy * t + ny * o]);
    }
    return pts;
  }
  function handCircle(C, r, hand, R) {
    const n = Math.max(18, Math.ceil(r * TAU / 7)), start = R() * TAU, f = 2 + Math.floor(R() * 3), p = R() * TAU;
    const a = hand ? hand * (0.3 + R() * 0.6) * Math.min(1, r / 60) : 0, over = hand ? 0.02 + R() * 0.03 : 0;
    const pts = [];
    for (let i = 0; i <= n * (1 + over); i++) {
      const ang = start + i / n * TAU, rr = r + a * Math.sin(f * ang + p);
      pts.push([C[0] + rr * Math.cos(ang), C[1] + rr * Math.sin(ang)]);
    }
    return pts;
  }
  function strokePath(g, pts, col, w, dash) {
    g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []);
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  }
  function label(g, txt, x, y, opts) {
    opts = opts || {};
    g.fillStyle = opts.color || INK; g.font = (opts.bold ? '600 ' : '') + (opts.size || 11) + 'px ' + (opts.sans ? SANS : MONO);
    g.textAlign = opts.align || 'left'; g.textBaseline = 'alphabetic'; g.fillText(txt, x, y);
  }
  function wrapText(g, str, x, y, maxW, lh) {
    const words = str.split(' '); let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = test;
    }
    if (line) g.fillText(line, x, y);
    return y;
  }

  // ---------- spaces ("regions") ----------
  function rectRegion(x, y, w, h) {
    return {
      x, y, w, h, cx: x + w / 2, cy: y + h / 2, diag: Math.hypot(w, h), round: false,
      corners: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
      mids: [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]],
      inside: R => [x + R() * w, y + R() * h],
      edge: R => { let t = R() * 2 * (w + h); if (t < w) return [x + t, y]; t -= w; if (t < h) return [x + w, y + t]; t -= h; if (t < w) return [x + w - t, y + h]; t -= w; return [x, y + h - t]; },
      lattice: n => { const a = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) a.push([x + (i + 0.5) * w / n, y + (j + 0.5) * h / n]); return a; },
      path: g => g.rect(x, y, w, h)
    };
  }
  function circleRegion(cx, cy, r) {
    const at = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    return {
      cx, cy, r, diag: 2 * r, round: true, x: cx - r, y: cy - r, w: 2 * r, h: 2 * r,
      corners: [-3, -1, 1, 3].map(k => at(k * Math.PI / 4)),
      mids: [-2, 0, 2, 4].map(k => at(k * Math.PI / 4)),
      inside: R => { const a = R() * TAU, d = r * Math.sqrt(R()); return [cx + d * Math.cos(a), cy + d * Math.sin(a)]; },
      edge: R => at(R() * TAU),
      lattice: n => { const a = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const p = [cx - r + (i + 0.5) * 2 * r / n, cy - r + (j + 0.5) * 2 * r / n]; if (Math.hypot(p[0] - cx, p[1] - cy) < r) a.push(p); } return a; },
      path: g => g.arc(cx, cy, r, 0, TAU)
    };
  }
  // three readings of "evenly distributed"
  function scatter(reg, n, mode, R) {
    if (mode === 'random') return Array.from({ length: n }, () => reg.inside(R));
    if (mode === 'jitter') {
      const cols = Math.max(1, Math.round(Math.sqrt(n * reg.w / reg.h))), rows = Math.ceil(n / cols), cw = reg.w / cols, ch = reg.h / rows;
      const cells = []; for (let i = 0; i < cols * rows; i++) cells.push(i);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      return cells.slice(0, n).map(c => [reg.x + (c % cols + R()) * cw, reg.y + (Math.floor(c / cols) + R()) * ch]);
    }
    // best candidate (Mitchell): try 12 random spots, keep the one farthest from everyone so far
    const pts = [reg.inside(R)];
    while (pts.length < n) {
      let best = null, bd = -1;
      for (let k = 0; k < 12; k++) {
        const c = reg.inside(R); let d = Infinity;
        for (const q of pts) d = Math.min(d, (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2);
        if (d > bd) { bd = d; best = c; }
      }
      pts.push(best);
    }
    return pts;
  }

  // ---------- geometry for judging drawings ----------
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function pathLen(s) { let L = 0; for (let i = 1; i < s.length; i++) L += dist(s[i - 1], s[i]); return L; }
  function straightness(s) { const L = pathLen(s); return L ? dist(s[0], s[s.length - 1]) / L : 1; }
  const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  // segments ab and cd cross (meeting exactly at a point counts; collinear overlap is left to touches())
  function segX(a, b, c, d) {
    const d1 = orient(c, d, a), d2 = orient(c, d, b);
    if (d1 === 0 && d2 === 0) return false;
    return d1 * d2 <= 0 && orient(a, b, c) * orient(a, b, d) <= 0;
  }
  function ptSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function crosses(s1, s2) {
    for (let i = 1; i < s1.length; i++) for (let j = 1; j < s2.length; j++) if (segX(s1[i - 1], s1[i], s2[j - 1], s2[j])) return true;
    return false;
  }
  function nearPath(p, s, tol) { for (let j = 1; j < s.length; j++) if (ptSeg(p, s[j - 1], s[j]) < tol) return true; return false; }
  function touches(s1, s2, tol) {
    if (crosses(s1, s2)) return true;
    return nearPath(s1[0], s2, tol) || nearPath(s1[s1.length - 1], s2, tol) || nearPath(s2[0], s1, tol) || nearPath(s2[s2.length - 1], s1, tol);
  }
  function clipLine(c, d, x, y, w, h) {
    let t0 = -1e9, t1 = 1e9;
    [[c[0], d[0], x, x + w], [c[1], d[1], y, y + h]].forEach(([p, v, lo, hi]) => {
      if (Math.abs(v) < 1e-9) return;
      const a = (lo - p) / v, b = (hi - p) / v; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b));
    });
    return [[c[0] + d[0] * t0, c[1] + d[1] * t0], [c[0] + d[0] * t1, c[1] + d[1] * t1]];
  }

  // ======================================================================
  // 1. Same instruction, six drafters
  // ======================================================================
  demos.drafters = function (host) {
    const w = W(host, 880), cols = w >= 600 ? 3 : 2, rows = 6 / cols, pad = 10, lab = 18;
    const pw = (w - pad * (cols + 1)) / cols, ph = Math.round(pw * 0.66), h = rows * (ph + lab) + pad * (rows + 1);
    const hands = [0.6, 2.2, 1.0, 3.0, 0, 1.5], names = ['careful', 'loose', 'steady', 'tired', 'a machine', 'in a hurry'];
    let seeds = Array.from({ length: 6 }, newSeed), dirty = true;
    const params = ui(host, [
      { type: 'range', key: 'n', label: 'points', min: 6, max: 60, value: 50, onChange: () => dirty = true },
      { type: 'buttons', key: 'mode', label: '"evenly" means', value: 'random', options: [{ label: 'nothing, pure random', value: 'random' }, { label: 'a jittered grid', value: 'jitter' }, { label: 'keep apart', value: 'apart' }], onChange: () => dirty = true },
      { type: 'button', label: '↻ six new drafters', onClick: () => { seeds = seeds.map(newSeed); dirty = true; } },
      { type: 'readout' }
    ]);
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); };
      p.draw = () => {
        if (!dirty) return; dirty = false;
        const g = p.drawingContext, n = params.n;
        g.save(); g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 6; i++) {
          const R = mulberry(seeds[i]), x = pad + (i % cols) * (pw + pad), y = pad + Math.floor(i / cols) * (ph + lab + pad);
          g.fillStyle = WALL; g.fillRect(x, y, pw, ph);
          g.setLineDash([]); g.strokeStyle = RULE; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
          const pts = scatter(rectRegion(x + 8, y + 8, pw - 16, ph - 16), n, params.mode, R);
          g.globalAlpha = 0.35;
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) strokePath(g, handLine(pts[a], pts[b], hands[i], R), LEAD, 0.5);
          g.globalAlpha = 1; g.fillStyle = RED;
          pts.forEach(q => { g.beginPath(); g.arc(q[0], q[1], 1.6, 0, TAU); g.fill(); });
          label(g, 'drafter ' + 'ABCDEF'[i] + ' · ' + names[i], x, y + ph + 13, { color: '#3a3630' });
        }
        g.restore();
        params.__readout.textContent = n + ' points → ' + (n * (n - 1) / 2) + ' lines in every drawing';
      };
    };
  };

  // ======================================================================
  // 2. Be the drafter: you draw, the instruction judges
  // ======================================================================
  const TASKS = {
    ten: 'Ten lines, not straight, not touching.',
    five: 'Five straight lines. Every line crosses every other line.',
    vert: 'Vertical lines, not touching, evenly covering the wall.'
  };
  function judge(task, S, w, h) {
    const out = [], n = S.length, pairs = (f) => { let k = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (f(S[i], S[j])) k++; return k; };
    const ok = (c, t) => out.push({ ok: c, t });
    if (task === 'ten') {
      ok(n === 10, 'exactly ten lines (you have ' + n + ')');
      const str = S.filter(s => straightness(s) > 0.95).length;
      ok(n > 0 && str === 0, 'none of them straight' + (str ? ' (' + str + ' look straight: chord ÷ length over 0.95)' : ''));
      const t = pairs((a, b) => touches(a, b, 3));
      ok(n > 1 && t === 0, 'no two lines touch' + (t ? ' (' + t + ' pairs touch)' : ''));
    } else if (task === 'five') {
      ok(n === 5, 'exactly five lines (you have ' + n + ')');
      const bent = S.filter(s => straightness(s) < 0.97).length;
      ok(n > 0 && bent === 0, 'every line straight' + (bent ? ' (' + bent + ' too bent: chord ÷ length under 0.97)' : ''));
      const need = n * (n - 1) / 2, c = pairs(crosses);
      ok(n > 1 && c === need, 'every pair crosses (' + c + ' of ' + need + ' pairs do)');
    } else {
      ok(n >= 8, 'enough lines. The instruction gives no number, so this judge decided: at least 8 (you have ' + n + ')');
      const off = S.filter(s => { const a = s[0], b = s[s.length - 1]; return Math.abs(b[1] - a[1]) < 1 || Math.abs(b[0] - a[0]) / Math.abs(b[1] - a[1]) > 0.18; }).length;
      ok(n > 0 && off === 0, 'every line vertical, within 10°' + (off ? ' (' + off + ' are not)' : ''));
      const t = pairs((a, b) => touches(a, b, 3));
      ok(n > 1 && t === 0, 'no two lines touch' + (t ? ' (' + t + ' pairs touch)' : ''));
      const xs = S.map(s => s.reduce((m, q) => m + q[0], 0) / s.length).sort((a, b) => a - b);
      const gaps = xs.slice(1).map((x, i) => x - xs[i]), mean = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
      const cv = gaps.length ? Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length) / mean : 1;
      ok(n > 2 && cv < 0.3, 'evenly spaced (gaps vary by ' + Math.round(cv * 100) + '%, the judge allows 30%)');
      const span = n ? (xs[n - 1] - xs[0]) / w : 0, tall = S.filter(s => Math.abs(s[s.length - 1][1] - s[0][1]) > h * 0.6).length;
      ok(span > 0.75 && tall === n, 'covering the wall: spread over 75% of its width, each line over 60% of its height');
    }
    return out;
  }
  function machineDraws(task, w, h, R) {
    const m = 14, hand = 0.8;
    if (task === 'vert') {
      const n = 18;
      return Array.from({ length: n }, (_, i) => { const x = m + (i + 0.5) * (w - 2 * m) / n; return handLine([x, m], [x, h - m], hand, R); });
    }
    if (task === 'five') {
      let L = [];
      for (let tries = 0; tries < 300; tries++) {
        const base = R() * Math.PI; L = [];
        for (let i = 0; i < 5; i++) {
          const a = base + i * Math.PI / 5 + (R() - 0.5) * 0.3, c = [w / 2 + (R() - 0.5) * w * 0.3, h / 2 + (R() - 0.5) * h * 0.3];
          const seg = clipLine(c, [Math.cos(a), Math.sin(a)], m, m, w - 2 * m, h - 2 * m);
          L.push(handLine(seg[0], seg[1], hand * 0.5, R));
        }
        let all = true;
        for (let i = 0; i < 5 && all; i++) for (let j = i + 1; j < 5; j++) if (!crosses(L[i], L[j])) { all = false; break; }
        if (all) return L;
      }
      return L;
    }
    // ten: throw a not-straight line, keep it only if it touches nothing
    for (let round = 0; round < 20; round++) {
      const lines = []; let tries = 0;
      while (lines.length < 10 && tries < 2500) {
        tries++;
        const A = [m + R() * (w - 2 * m), m + R() * (h - 2 * m)], a = R() * TAU, len = (0.25 + R() * 0.35) * h;
        const B = [A[0] + Math.cos(a) * len, A[1] + Math.sin(a) * len];
        const s = wavyLine(A, B, hand, R, Math.max(9, len * 0.13));
        if (s.some(q => q[0] < m || q[0] > w - m || q[1] < m || q[1] > h - m)) continue;
        if (straightness(s) > 0.94) continue;
        if (lines.some(l => touches(l, s, 7))) continue;
        lines.push(s);
      }
      if (lines.length === 10) return lines;
    }
    return [];
  }
  demos.drafter = function (host) {
    const w = W(host, 760), h = Math.round(w * 0.56);
    let task = 'ten', mine = [], cur = null, view = 'mine', machine = [], dirty = true;
    const taskEl = above(host, document.createElement('div')); taskEl.className = 'task';
    const verdict = above(host, document.createElement('div')); verdict.className = 'verdict';
    const setTask = (t) => { task = t; mine = []; view = 'mine'; params.__btn_turn.textContent = '▶ machine’s turn'; dirty = true; };
    const params = ui(host, [
      { type: 'select', key: 'task', label: 'instruction', value: 'ten', options: Object.keys(TASKS).map(k => ({ label: TASKS[k], value: k })), onChange: setTask },
      { type: 'button', label: '↶ undo', onClick: () => { if (view === 'mine') { mine.pop(); dirty = true; } } },
      { type: 'button', label: 'clear', onClick: () => { if (view === 'mine') { mine = []; dirty = true; } } },
      { type: 'button', key: 'turn', label: '▶ machine’s turn', primary: true, onClick: (b) => {
        if (view === 'mine') { machine = machineDraws(task, w, h, mulberry(newSeed())); view = 'machine'; b.textContent = '◀ back to my drawing'; }
        else { view = 'mine'; b.textContent = '▶ machine’s turn'; }
        dirty = true;
      } }
    ]);
    const inside = (p) => p.mouseX >= 0 && p.mouseX <= w && p.mouseY >= 0 && p.mouseY <= h;
    return (p) => {
      p.setup = () => { const c = p.createCanvas(w, h); c.elt.style.touchAction = 'none'; c.elt.style.cursor = 'crosshair'; };
      p.draw = () => {
        if (!dirty) return; dirty = false;
        const g = p.drawingContext, S = view === 'mine' ? mine : machine;
        g.save(); g.fillStyle = WALL; g.fillRect(0, 0, w, h);
        g.lineCap = 'round'; g.lineJoin = 'round';
        S.forEach(s => strokePath(g, s, view === 'mine' ? LEAD : BLU, 1.6));
        if (cur) strokePath(g, cur, RED, 1.6);
        if (!S.length && !cur && view === 'mine') label(g, 'draw here: press, drag, release. one stroke = one line', w / 2, h / 2, { align: 'center', color: MUTED, size: 12 });
        g.restore();
        taskEl.innerHTML = '<span>the instruction</span>' + TASKS[task];
        const res = judge(task, S, w, h), pass = res.every(r => r.ok);
        verdict.innerHTML = '<b>' + (view === 'mine' ? 'Your drawing' : 'The machine’s drawing') + (pass ? ' follows the instruction.' : ' does not follow the instruction yet.') + '</b>' +
          '<ul class="checks">' + res.map(r => '<li class="' + (r.ok ? 'ok' : 'no') + '">' + (r.ok ? '✓ ' : '✗ ') + r.t + '</li>').join('') + '</ul>';
      };
      p.mousePressed = () => { if (view !== 'mine' || !inside(p)) return; cur = [[p.mouseX, p.mouseY]]; dirty = true; return false; };
      p.mouseDragged = () => {
        if (!cur) return;
        const q = [Math.max(0, Math.min(w, p.mouseX)), Math.max(0, Math.min(h, p.mouseY))];
        if (dist(q, cur[cur.length - 1]) >= 4) { cur.push(q); dirty = true; }
        return false;
      };
      p.mouseReleased = () => { if (!cur) return; if (cur.length > 2 && pathLen(cur) > 12) mine.push(cur); cur = null; dirty = true; };
    };
  };

  // ======================================================================
  // 3. All combinations
  // ======================================================================
  const VOCAB = [
    { name: 'vertical', col: YEL }, { name: 'horizontal', col: INK }, { name: 'diagonal /', col: RED }, { name: 'diagonal \\', col: BLU },
    { name: 'arcs from a corner', col: RED }, { name: 'arcs from a side', col: BLU }, { name: 'not straight', col: INK }, { name: 'broken', col: YEL }
  ];
  function drawItem(g, i, x, y, s, R, colour, hand) {
    const sp = s / 11, col = colour ? VOCAB[i].col : LEAD, lw = colour ? 1.1 : 0.75;
    g.save(); g.beginPath(); g.rect(x, y, s, s); g.clip();
    const L = (A, B) => strokePath(g, handLine(A, B, hand, R), col, lw);
    if (i === 0) for (let t = sp / 2; t < s; t += sp) L([x + t, y - 2], [x + t, y + s + 2]);
    if (i === 1) for (let t = sp / 2; t < s; t += sp) L([x - 2, y + t], [x + s + 2, y + t]);
    if (i === 2) for (let c = -s; c < s; c += sp * 1.41) L([x + c, y + s], [x + c + s, y]);
    if (i === 3) for (let c = -s; c < s; c += sp * 1.41) L([x + c, y], [x + c + s, y + s]);
    if (i === 4) for (let r = sp; r < s * 1.45; r += sp) strokePath(g, handCircle([x, y], r, hand, R), col, lw);
    if (i === 5) for (let r = sp; r < s * 1.15; r += sp) strokePath(g, handCircle([x, y + s / 2], r, hand, R), col, lw);
    if (i === 6) { const sh = waveShape(R); for (let t = sp / 2; t < s; t += sp) strokePath(g, wavyLine([x - 4, y + t], [x + s + 4, y + t], hand, R, sp * 0.4, sh), col, lw); }
    if (i === 7) for (let t = sp; t < s; t += sp) strokePath(g, handLine([x - 2, y + t], [x + s + 2, y + t], hand, R), col, lw, [sp * 0.9, sp * 0.55]);
    g.restore();
  }
  const popcount = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
  const choose = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
  demos.combos = function (host) {
    const w = W(host, 900), pad = 10, lab = 16;
    let sel = [0, 1, 2, 3], dirty = true, seed = newSeed(), h = 300;
    const chipsHtml = VOCAB.map((v, i) => '<button data-i="' + i + '">' + (i + 1) + ' · ' + v.name + '</button>').join('');
    const params = ui(host, [
      { type: 'html', key: 'chips', html: chipsHtml, css: 'display:flex;flex-wrap:wrap;gap:4px;width:100%' },
      { type: 'buttons', key: 'mode', label: 'draw', value: 'all', options: [{ label: 'every combination', value: 'all' }, { label: 'one at a time', value: '1' }, { label: 'pairs', value: '2' }, { label: 'threes', value: '3' }], onChange: () => dirty = true },
      { type: 'buttons', key: 'colour', label: 'in', value: 'lead', options: [{ label: 'pencil', value: 'lead' }, { label: 'colour', value: 'colour' }], onChange: () => dirty = true },
      { type: 'button', label: '↻ redraw', onClick: () => { seed = newSeed(); dirty = true; } },
      { type: 'readout' }
    ]);
    const chips = params.__html_chips;
    chips.classList.add('group');
    const sync = () => chips.querySelectorAll('button').forEach(b => b.classList.toggle('on', sel.includes(+b.dataset.i)));
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const i = +b.dataset.i;
      if (sel.includes(i)) { if (sel.length > 1) sel = sel.filter(x => x !== i); } else sel = sel.concat(i).sort((a, b) => a - b);
      sync(); dirty = true;
    });
    sync();
    chips.querySelectorAll('button').forEach(b => { b.style.fontSize = '.76rem'; b.style.padding = '3px 9px'; });
    function layout() {
      const n = sel.length, k = params.mode === 'all' ? 0 : +params.mode;
      const masks = []; for (let m = 1; m < (1 << n); m++) if (!k || popcount(m) === k) masks.push(m);
      const lex = (a, b) => { for (let i = 0; i < n; i++) { const x = a & (1 << i), y = b & (1 << i); if (x !== y) return x ? -1 : 1; } return 0; };
      masks.sort((a, b) => popcount(a) - popcount(b) || lex(a, b));   // 1, 2, 3 … then 1+2, 1+3 …
      const c = masks.length;
      const s = Math.max(44, Math.min(140, Math.floor(Math.sqrt(w * 900 / Math.max(1, c)))));
      const cols = Math.max(1, Math.min(c, Math.floor((w - pad) / (s + pad)))), rows = Math.ceil(c / cols);
      return { masks, s, cols, rows, n, k, hh: Math.max(80, rows * (s + lab + pad) + pad) };
    }
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); };
      p.draw = () => {
        if (!dirty) return; dirty = false;
        const L = layout();
        if (L.hh !== h) { h = L.hh; p.resizeCanvas(w, h); }
        const g = p.drawingContext, R = mulberry(seed), colour = params.colour === 'colour';
        g.save(); g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
        const ox = (w - (L.cols * (L.s + pad) - pad)) / 2;
        if (!L.masks.length) label(g, 'pick more kinds of line: you cannot make threes from ' + L.n, w / 2, 44, { align: 'center', color: MUTED, size: 12 });
        L.masks.forEach((m, idx) => {
          const x = ox + (idx % L.cols) * (L.s + pad), y = pad + Math.floor(idx / L.cols) * (L.s + lab + pad);
          g.fillStyle = WALL; g.fillRect(x, y, L.s, L.s);
          g.globalCompositeOperation = colour ? 'multiply' : 'source-over';
          const items = sel.filter((_, j) => m & (1 << j));
          items.forEach(i => drawItem(g, i, x, y, L.s, R, colour, 0.5));
          g.globalCompositeOperation = 'source-over';
          g.setLineDash([]); g.strokeStyle = RULE; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, L.s - 1, L.s - 1);
          label(g, items.map(i => i + 1).join(' + '), x, y + L.s + 12, { color: '#3a3630', size: 10 });
        });
        g.restore();
        const c = L.masks.length;
        params.__readout.textContent = L.n + ' kinds of line, ' + (L.k ? 'groups of ' + L.k + ': C(' + L.n + ',' + L.k + ') = ' : 'every combination: 2^' + L.n + ' − 1 = ') + c + ' drawings';
      };
    };
  };

  // ======================================================================
  // 4. The invention machine
  // ======================================================================
  const CARDS = [
    { key: 'space', label: 'the space', options: [['wall', 'the whole wall'], ['grid2', 'a 2×2 grid'], ['grid3', 'a 3×3 grid'], ['grid4', 'a 4×4 grid'], ['bands', 'four vertical bands'], ['circle', 'a circle']] },
    { key: 'element', label: 'the mark', options: [['straight', 'straight lines'], ['notstraight', 'not straight lines'], ['broken', 'broken lines'], ['arcs', 'arcs']] },
    { key: 'origin', label: 'starting from', options: [['random', 'random points'], ['edges', 'points on the edge'], ['corners', 'the corners'], ['mids', 'the middles of the sides'], ['center', 'the centre'], ['lattice', 'a 5×5 grid of points']] },
    { key: 'dest', label: 'going', options: [['random', 'to random points'], ['edges', 'to the edge'], ['center', 'to the centre'], ['directions', 'in four directions'], ['all', 'every point to every other'], ['nearest', 'to the nearest point']] },
    { key: 'qty', label: 'how many', options: [['5', '5'], ['10', '10'], ['25', '25'], ['50', '50'], ['100', '100'], ['250', '250']] },
    { key: 'colour', label: 'drawn with', options: [['graphite', 'hard graphite'], ['crayon', 'black crayon'], ['four', 'four colours at random'], ['bytag', 'a colour per direction or corner']] },
    { key: 'variation', label: 'across the parts', options: [['same', 'the same rule in each'], ['grows', 'more in each part'], ['mirror', 'mirrored copies'], ['combos', 'all combinations']] }
  ];
  const DIRS = [[0, 1], [1, 0], [Math.SQRT1_2, -Math.SQRT1_2], [Math.SQRT1_2, Math.SQRT1_2]];
  const DIR_NAMES = ['vertical', 'horizontal', 'diagonal right', 'diagonal left'];
  const SUB4 = (() => { const a = []; for (let m = 1; m < 16; m++) a.push(m); a.sort((x, y) => popcount(x) - popcount(y) || x - y); return a.map(m => [0, 1, 2, 3].filter(i => m & (1 << i))); })();
  const ALLCAP = 30;
  const NUMW = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 16: 'sixteen', 25: 'twenty-five', 30: 'thirty', 50: 'fifty', 100: 'one hundred', 250: 'two hundred and fifty' };
  const nw = n => NUMW[n] || String(n);
  const optLabel = (key, v) => CARDS.find(c => c.key === key).options.find(o => o[0] === v)[1];
  const multiPart = P => P.space !== 'wall' && P.space !== 'circle';
  const fixedOrigin = o => o === 'corners' || o === 'mids' || o === 'center' || o === 'lattice';

  function resolve(c) {
    const P = Object.assign({}, c), notes = [];
    P.qty = +P.qty;
    if (!multiPart(P) && P.variation !== 'same') { notes.push('There is only one part, so “' + optLabel('variation', P.variation) + '” has nothing to vary across. Ignored.'); P.variation = 'same'; }
    if (P.dest === 'directions' && P.element === 'arcs') { P.dest = 'random'; notes.push('An arc has no direction, so the drafter sent the arcs to random points instead.'); }
    if (P.dest === 'directions' && (P.origin === 'corners' || P.origin === 'mids' || P.origin === 'center')) { notes.push('A line in a fixed direction through a fixed point is always the same line, so ' + nw(P.qty) + ' of them would be a handful of lines drawn over and over. The drafter moved them to random points.'); P.origin = 'random'; }
    if (P.origin === 'center' && (P.dest === 'center' || P.dest === 'all' || P.dest === 'nearest')) { P.dest = 'random'; notes.push('There is only one centre, so there is nothing to connect it to. The lines go to random points instead.'); }
    if ((P.dest === 'all' || P.dest === 'nearest') && fixedOrigin(P.origin)) {
      notes.push('The points are fixed, so “how many” has nothing to count. Ignored.');
      if (P.variation === 'grows') { notes.push('For the same reason the parts cannot grow, so every part follows the same instruction.'); P.variation = 'same'; }
    }
    if (P.dest === 'all' && !fixedOrigin(P.origin) && P.qty > ALLCAP) notes.push('Connecting ' + P.qty + ' points to each other means ' + (P.qty * (P.qty - 1) / 2).toLocaleString() + ' lines in every part. The drafter stopped at ' + ALLCAP + ' points.');
    if (P.variation === 'combos') P.comboSet = P.dest === 'directions' ? 'dirs' : (P.origin === 'corners' || P.origin === 'mids') ? 'origins' : 'colours';
    if (P.comboSet === 'colours' && P.colour !== 'four') { notes.push('With no directions or corners to combine, the parts combine the four colours.'); P.colour = 'four'; }
    P.tagKind = P.dest === 'directions' ? 'dirs' : (P.origin === 'corners' || P.origin === 'mids') ? 'origins' : null;
    if (P.colour === 'bytag' && !P.tagKind) { P.colour = 'four'; notes.push('There are no directions or corners to give colours to, so each line gets one of the four at random.'); }
    return { P, notes };
  }

  function regionsFor(P, w, h) {
    const m = 14, X = m, Y = m, Wd = w - 2 * m, Hd = h - 2 * m;
    if (P.space === 'wall') return [rectRegion(X, Y, Wd, Hd)];
    if (P.space === 'circle') return [circleRegion(w / 2, h / 2, Hd * 0.48)];
    if (P.space === 'bands') return [0, 1, 2, 3].map(i => rectRegion(X + i * Wd / 4, Y, Wd / 4, Hd));
    const n = +P.space.slice(4), out = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out.push(rectRegion(X + i * Wd / n, Y + j * Hd / n, Wd / n, Hd / n));
    return out;
  }

  function elementsFor(P, reg, k, n, R) {
    const qty = P.variation === 'grows' ? Math.max(1, Math.round(P.qty * (k + 1) / n)) : P.qty;
    const sub = P.variation === 'combos' ? SUB4[k] : null;
    const base = P.origin === 'corners' ? reg.corners : P.origin === 'mids' ? reg.mids : P.origin === 'center' ? [[reg.cx, reg.cy]] : P.origin === 'lattice' ? reg.lattice(5) : null;
    let fixed = base && base.map((q, i) => ({ p: q, tag: i }));
    if (fixed && sub && P.comboSet === 'origins') fixed = sub.map(i => fixed[i]);
    const dirs = sub && P.comboSet === 'dirs' ? sub : [0, 1, 2, 3];
    const cols = sub && P.comboSet === 'colours' ? sub : [0, 1, 2, 3];
    const pick = a => a[Math.floor(R() * a.length)];
    const freePt = () => P.origin === 'edges' ? reg.edge(R) : reg.inside(R);
    const out = [];
    if (P.dest === 'all' || P.dest === 'nearest') {
      const N = P.dest === 'all' ? Math.min(qty, ALLCAP) : qty;
      const pts = fixed || Array.from({ length: N }, () => ({ p: freePt(), tag: 0 }));
      for (let a = 0; a < pts.length; a++) {
        if (P.dest === 'all') { for (let b = a + 1; b < pts.length; b++) out.push({ A: pts[a].p, B: pts[b].p, tag: pts[a].tag }); }
        else {
          let best = -1, bd = Infinity;
          for (let b = 0; b < pts.length; b++) if (b !== a) { const d = dist(pts[a].p, pts[b].p); if (d < bd) { bd = d; best = b; } }
          if (best >= 0) out.push({ A: pts[a].p, B: pts[best].p, tag: pts[a].tag });
        }
      }
    } else {
      for (let i = 0; i < qty; i++) {
        const o = fixed ? fixed[i % fixed.length] : { p: freePt(), tag: 0 };
        let B, tag = o.tag, through = false;
        if (P.dest === 'random') B = reg.inside(R);
        else if (P.dest === 'edges') B = reg.edge(R);
        else if (P.dest === 'center') B = [reg.cx, reg.cy];
        else { const d = pick(dirs); tag = d; B = [o.p[0] + DIRS[d][0], o.p[1] + DIRS[d][1]]; through = true; }
        out.push({ A: o.p, B, tag, through });
      }
    }
    out.forEach(e => { e.col = P.colour === 'bytag' ? FOUR[e.tag % 4] : P.colour === 'four' ? FOUR[pick(cols)] : null; });
    return out;
  }

  function execute(g, P, w, h, seed, hand) {
    const regs = regionsFor(P, w, h), n = regs.length;
    const lw = { graphite: 0.6, crayon: 1.7, four: 1.1, bytag: 1.1 }[P.colour], base = P.colour === 'crayon' ? INK : LEAD;
    g.save(); g.fillStyle = WALL; g.fillRect(0, 0, w, h);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // the grid, drawn lightly in pencil first, as LeWitt's drafters did
    g.setLineDash([]); g.strokeStyle = '#cfc7b8'; g.lineWidth = 0.75;
    regs.forEach(r => { g.beginPath(); r.path(g); g.stroke(); });
    g.globalCompositeOperation = (P.colour === 'four' || P.colour === 'bytag') ? 'multiply' : 'source-over';
    g.globalAlpha = P.colour === 'graphite' ? 0.85 : 0.92;
    regs.forEach((reg, k) => {
      if (P.variation === 'combos' && k >= 15) return;
      const R = mulberry(P.variation === 'mirror' ? seed : seed + k * 7919);
      g.save(); g.beginPath(); reg.path(g); g.clip();
      if (P.variation === 'mirror') {
        const n1 = P.space === 'bands' ? 4 : +P.space.slice(4), col = k % n1, row = Math.floor(k / n1);
        g.translate(reg.cx, reg.cy); g.scale(col % 2 ? -1 : 1, row % 2 ? -1 : 1); g.translate(-reg.cx, -reg.cy);
      }
      // in a mirrored series every part is generated from the first part's coordinates
      const src = P.variation === 'mirror' ? regs[0] : reg;
      if (P.variation === 'mirror' && k > 0) { g.translate(reg.x - src.x, reg.y - src.y); }
      for (const e of elementsFor(P, src, k, n, R)) {
        const col = e.col || base;
        if (P.element === 'arcs') { const r = dist(e.A, e.B); if (r > 1) strokePath(g, handCircle(e.A, r, hand, R), col, lw); continue; }
        let A = e.A, B = e.B;
        if (e.through) { const d = src.diag, v = [B[0] - A[0], B[1] - A[1]]; A = [e.A[0] - v[0] * d, e.A[1] - v[1] * d]; B = [e.A[0] + v[0] * d, e.A[1] + v[1] * d]; }
        const pts = P.element === 'notstraight' ? wavyLine(A, B, hand, R) : handLine(A, B, hand, R);
        strokePath(g, pts, col, lw, P.element === 'broken' ? [6 + R() * 10, 4 + R() * 6] : null);
      }
      g.restore();
    });
    g.restore();
  }

  function sentence(P) {
    const multi = multiPart(P), round = P.space === 'circle';
    const where = P.space === 'bands' ? 'band' : 'part';
    const here = multi ? 'the ' + where : round ? 'the circle' : 'the wall';
    const gn = P.space.startsWith('grid') ? +P.space.slice(4) : 0;
    const comboO = P.comboSet === 'origins', comboD = P.comboSet === 'dirs';
    let s = P.space === 'wall' ? 'On a wall, ' : round ? 'Inside a circle drawn in the middle of a wall, '
      : P.space === 'bands' ? 'On a wall divided into four vertical bands, in each band, '
      : 'On a wall divided by a ' + gn + '×' + gn + ' grid into ' + nw(gn * gn) + ' equal parts, in each part, ';
    const colour = {
      graphite: 'using a hard graphite pencil',
      crayon: 'using black crayon',
      four: P.comboSet === 'colours' ? 'using coloured pencils' : 'using yellow, red, blue and black pencil, a colour chosen at random for each line',
      bytag: P.tagKind === 'dirs' ? 'using one colour for each direction (vertical yellow, horizontal red, diagonal right blue, diagonal left black)'
        : 'using one colour for each ' + (P.origin === 'corners' ? 'corner' : 'side') + ' (yellow, red, blue, black, clockwise from the ' + (P.origin === 'corners' ? 'top left' : 'top') + ')'
    }[P.colour];
    s += colour + ', ';
    const el = { straight: ['straight lines', 'a straight line'], notstraight: ['not straight lines', 'a not straight line'], broken: ['broken lines', 'a broken line'], arcs: ['arcs', 'an arc'] }[P.element];
    const set = {
      corners: comboO ? 'its corners' : round ? 'four points on the circle, at the diagonals' : 'the four corners of ' + here,
      mids: comboO ? 'the middles of its sides' : round ? 'the top, right, bottom and left of the circle' : 'the midpoints of the four sides of ' + here,
      center: 'the centre of ' + here,
      lattice: round ? 'the points of a 5×5 grid that fall inside the circle' : 'the twenty-five points of a 5×5 grid laid over ' + here
    };
    const one = {
      random: 'a random point', edges: 'a random point on the edge of ' + here,
      corners: comboO ? 'one of its corners' : round ? 'one of four points on the circle, at the diagonals' : 'one of the four corners',
      mids: comboO ? 'the middle of one of its sides' : round ? 'the top, right, bottom or left of the circle' : 'the midpoint of one of the sides',
      center: 'the centre of ' + here, lattice: 'a point of a 5×5 grid'
    };
    const q = nw(P.qty), N = P.dest === 'all' ? Math.min(P.qty, ALLCAP) : P.qty;
    let act;
    if (P.dest === 'all' || P.dest === 'nearest') {
      const pts = P.origin === 'random' ? 'place ' + nw(N) + ' points at random' : P.origin === 'edges' ? 'place ' + nw(N) + ' points at random on the edge of ' + here : 'take ' + set[P.origin];
      if (P.element === 'arcs') act = pts + (P.dest === 'all' ? ', and for every pair of points draw an arc centred on one and passing through the other' : ', and around each point draw an arc that passes through its nearest neighbour');
      else act = pts + (P.dest === 'all' ? ', and connect every point to every other point with ' + el[0] : ', and connect each point to its nearest neighbour with ' + el[1]);
    } else if (P.element === 'arcs') {
      const rad = { random: 'reaching out to a random point', edges: 'reaching a random point on the edge of ' + here, center: 'passing through the centre of ' + here }[P.dest];
      act = 'draw ' + q + ' arcs, each centred on ' + one[P.origin] + ' and ' + rad;
    } else if (P.dest === 'directions') {
      const pts = P.origin === 'random' ? 'random points' : P.origin === 'edges' ? 'random points on the edge of ' + here : set[P.origin];
      act = 'draw ' + q + ' ' + el[0] + ' from edge to edge through ' + pts + ', each in ' + (comboD ? 'one of the ' + where + '’s directions' : 'one of four directions: vertical, horizontal, diagonal right or diagonal left');
    } else {
      const to = { random: 'a random point', edges: 'a random point on the edge of ' + here, center: 'the centre of ' + here }[P.dest];
      act = fixedOrigin(P.origin) ? 'draw ' + q + ' ' + el[0] + ' from ' + set[P.origin] + ', each to ' + to : 'draw ' + q + ' ' + el[0] + ', each from ' + one[P.origin] + ' to ' + to;
    }
    s += act + '.';
    const n = gn ? gn * gn : 4, ws = where + 's';
    if (multi) {
      if (P.variation === 'same') s += ' Every ' + where + ' follows the same instruction, so every ' + where + ' is different.';
      if (P.variation === 'grows') {
        const noun = (P.dest === 'all' || P.dest === 'nearest') ? 'points' : P.element === 'arcs' ? 'arcs' : 'lines';
        s += ' The number of ' + noun + ' grows from ' + Math.max(1, Math.round(P.qty / n)) + ' in the first ' + where + ' to ' + (P.dest === 'all' ? Math.min(P.qty, ALLCAP) : P.qty) + ' in the last, reading left to right, top to bottom.';
      }
      if (P.variation === 'mirror') s += ' Draw the first ' + where + ' only, then copy it into every other ' + where + ', mirrored so that neighbouring ' + ws + ' reflect each other.';
      if (P.variation === 'combos') {
        const setName = P.comboSet === 'dirs' ? 'the four directions (vertical, horizontal, diagonal right, diagonal left)' : P.comboSet === 'colours' ? 'the four colours (yellow, red, blue, black)' : P.origin === 'corners' ? 'the four corners' : 'the four sides';
        s += ' The ' + ws + ' take every combination of ' + setName + ', one each, in order: each alone, then in pairs, in threes, then all four.';
        if (n < 15) s += ' There are fifteen combinations and only ' + nw(n) + ' ' + ws + ', so the series stops early.';
        if (n === 16) s += ' The sixteenth part is left blank.';
      }
    }
    return s;
  }

  demos.machine = function (host) {
    const w = W(host, 900), h = Math.round(w * 0.6);
    const state = { space: 'grid3', element: 'straight', origin: 'corners', dest: 'random', qty: '25', colour: 'graphite', variation: 'same' };
    const locks = new Set();
    let seed = newSeed(), hand = 0.9, dirty = true, current = null;

    // the certificate (LeWitt sold the instruction, not the drawing)
    const cert = document.createElement('div'); cert.className = 'cert';
    cert.innerHTML = '<div class="cert-head"><b></b><span>certificate · the instruction is the work</span></div><p class="cert-text"></p><div class="cert-notes"></div><div class="cert-foot"></div>';
    host.appendChild(cert);

    // the cards
    const cards = document.createElement('div'); cards.className = 'cards';
    CARDS.forEach(c => {
      const d = document.createElement('div'); d.className = 'card'; d.dataset.key = c.key;
      d.innerHTML = '<div class="card-top"><span>' + c.label + '</span><button class="lock" title="lock this card">○</button></div><select>' + c.options.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('') + '</select>';
      const sel = d.querySelector('select'); sel.value = state[c.key];
      sel.addEventListener('change', () => { state[c.key] = sel.value; dirty = true; });
      d.querySelector('.lock').addEventListener('click', () => {
        if (locks.has(c.key)) locks.delete(c.key); else locks.add(c.key);
        d.classList.toggle('locked', locks.has(c.key)); d.querySelector('.lock').textContent = locks.has(c.key) ? '●' : '○';
      });
      cards.appendChild(d);
    });
    host.appendChild(cards);
    const syncCards = () => cards.querySelectorAll('.card').forEach(d => { d.querySelector('select').value = state[d.dataset.key]; });

    const deal = () => {
      CARDS.forEach(c => { if (!locks.has(c.key)) state[c.key] = c.options[Math.floor(Math.random() * c.options.length)][0]; });
      syncCards(); seed = newSeed(); dirty = true;
    };
    let pp = null;
    const params = ui(host, [
      { type: 'button', label: '⟳ deal new cards', primary: true, onClick: deal },
      { type: 'button', label: '↻ same instruction, new drafter', onClick: () => { seed = newSeed(); dirty = true; } },
      { type: 'buttons', key: 'hand', label: 'hand', value: 0.9, options: [{ label: 'machine', value: 0 }, { label: 'steady', value: 0.9 }, { label: 'loose', value: 2.4 }], onChange: (v) => { hand = v; dirty = true; } },
      { type: 'button', key: 'copy', label: 'copy instruction', onClick: (b) => { if (current && navigator.clipboard) navigator.clipboard.writeText(current.title + '\n' + current.text).then(() => { b.textContent = 'copied ✓'; setTimeout(() => b.textContent = 'copy instruction', 1200); }); } },
      { type: 'button', label: 'save PNG', onClick: () => { if (pp && current) pp.saveCanvas(current.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase(), 'png'); } }
    ]);
    const hint = document.createElement('div'); hint.className = 'demo-foot';
    hint.innerHTML = '<p>Lock (●) the cards you like, deal the rest. Locked cards are your decisions; dealt cards are chance. Red notes are where the instruction did not make sense and the drafter had to decide for you: that is where you need better words.</p>';
    host.appendChild(hint);

    return (p) => {
      pp = p;
      p.setup = () => { p.createCanvas(w, h); };
      p.draw = () => {
        if (!dirty) return; dirty = false;
        const { P, notes } = resolve(state);
        execute(p.drawingContext, P, w, h, seed, hand);
        const text = sentence(P), num = hashStr(text) % 900 + 100;
        current = { title: 'Wall Drawing #SMI-' + num, text };
        cert.querySelector('.cert-head b').textContent = current.title;
        cert.querySelector('.cert-text').textContent = text;
        cert.querySelector('.cert-notes').innerHTML = notes.map(n => '<p>✎ ' + n + '</p>').join('');
        cert.querySelector('.cert-foot').textContent = 'drawn by drafter #' + (seed % 10000) + ' · hand: ' + (hand === 0 ? 'machine' : hand < 2 ? 'steady' : 'loose') + ' · ' + text.split(/\s+/).length + ' words';
      };
    };
  };

  // ======================================================================
  // 5. Where rules come from: six sources
  // ======================================================================
  const SOURCES = [
    { name: 'Permutation', text: 'Every combination of four directions, one per square, in order.' },
    { name: 'Accumulation', text: 'Each line starts where the last one ended, turns left or right by a coin toss, and is a little longer.' },
    { name: 'Recursion', text: 'Cut the rectangle in two across its long side. Do the same to each part, until a coin says stop.' },
    { name: 'Constraint', text: 'Start each line on one already drawn, mostly at a right angle. It grows until it hits another line, never crossing.' },
    { name: 'Translation', text: 'Walk the letters of a name: each letter turns you by its code number, then you step forward.' },
    { name: 'Chance', text: 'Roll a die for each square: 1 vertical, 2 horizontal, 3 and 4 diagonals, 5 an arc, 6 nothing.' }
  ];
  function source(i, g, x, y, s, R, name) {
    const L = (A, B, c, wd) => strokePath(g, handLine(A, B, 0.4, R), c || LEAD, wd || 0.8);
    if (i === 0) {
      const c = s / 4, sp = c / 6;
      for (let k = 0; k < 16; k++) {
        const cx = x + (k % 4) * c, cy = y + Math.floor(k / 4) * c;
        g.save(); g.beginPath(); g.rect(cx + 2, cy + 2, c - 4, c - 4); g.clip();
        if (k > 0) {
          const sub = SUB4[k - 1];
          if (sub.includes(0)) for (let t = sp / 2; t < c; t += sp) L([cx + t, cy], [cx + t, cy + c]);
          if (sub.includes(1)) for (let t = sp / 2; t < c; t += sp) L([cx, cy + t], [cx + c, cy + t]);
          if (sub.includes(2)) for (let t = -c; t < c; t += sp * 1.4) L([cx + t, cy + c], [cx + t + c, cy]);
          if (sub.includes(3)) for (let t = -c; t < c; t += sp * 1.4) L([cx + t, cy], [cx + t + c, cy + c]);
        }
        g.restore();
      }
    } else if (i === 1) {
      let px = x + s / 2, py = y + s / 2, a = Math.floor(R() * 4), len = 2;
      const m = 4, pts = [[px, py]];
      for (let k = 0; k < 160; k++) {
        a = (a + (R() < 0.5 ? 1 : 3)) % 4;
        const v = [[1, 0], [0, 1], [-1, 0], [0, -1]][a];
        let nx = px + v[0] * len, ny = py + v[1] * len;
        if (nx < x + m || nx > x + s - m || ny < y + m || ny > y + s - m) { a = (a + 2) % 4; nx = px - v[0] * len; ny = py - v[1] * len; }
        nx = Math.max(x + m, Math.min(x + s - m, nx)); ny = Math.max(y + m, Math.min(y + s - m, ny));
        px = nx; py = ny; pts.push([px, py]); len += s * 0.0028;
      }
      strokePath(g, pts, LEAD, 0.9);
    } else if (i === 2) {
      const cut = (cx, cy, cw, ch, d) => {
        if (d > 6 || cw < 10 || ch < 10 || (d > 1 && R() < 0.22)) {
          const r = R(); if (r < 0.42) { g.fillStyle = FOUR[Math.floor(R() * 4)]; g.fillRect(cx, cy, cw, ch); }
          g.setLineDash([]); g.strokeStyle = INK; g.lineWidth = 1.6; g.strokeRect(cx, cy, cw, ch); return;
        }
        const t = 0.3 + R() * 0.4;
        if (cw >= ch) { cut(cx, cy, cw * t, ch, d + 1); cut(cx + cw * t, cy, cw * (1 - t), ch, d + 1); }
        else { cut(cx, cy, cw, ch * t, d + 1); cut(cx, cy + ch * t, cw, ch * (1 - t), d + 1); }
      };
      cut(x + 4, y + 4, s - 8, s - 8, 0);
    } else if (i === 3) {
      // every new line starts on an old one, at a right angle, and grows until it hits something
      const x0 = x + 4, y0 = y + 4, x1 = x + s - 4, y1 = y + s - 4;
      const segs = [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]];
      const cr = (a, b) => a[0] * b[1] - a[1] * b[0];
      for (let k = 0; k < 70; k++) {
        const [a, b] = segs[Math.floor(R() * segs.length)], u = 0.1 + R() * 0.8;
        const o = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], e = [b[0] - a[0], b[1] - a[1]], el = Math.hypot(e[0], e[1]);
        if (el < 6) continue;
        const sg = R() < 0.5 ? 1 : -1, tw = R() < 0.25 ? (R() - 0.5) * 1.4 : 0, c0 = Math.cos(tw), s0 = Math.sin(tw);
        const n0 = [-e[1] / el * sg, e[0] / el * sg], d = [n0[0] * c0 - n0[1] * s0, n0[0] * s0 + n0[1] * c0];
        let best = Infinity;
        for (const [p, q] of segs) {
          const f = [q[0] - p[0], q[1] - p[1]], den = cr(d, f);
          if (Math.abs(den) < 1e-9) continue;
          const wv = [p[0] - o[0], p[1] - o[1]], t = cr(wv, f) / den, v = cr(wv, d) / den;
          if (t > 1e-6 && v >= 0 && v <= 1 && t < best) best = t;
        }
        if (!isFinite(best) || best < 3) continue;
        segs.push([o, [o[0] + d[0] * best, o[1] + d[1] * best]]);
      }
      segs.forEach((sg, k) => L(sg[0], sg[1], k < 4 ? INK : LEAD, k < 4 ? 1.4 : 0.9));
    } else if (i === 4) {
      const word = (name || ' ').toUpperCase();
      let px = 0, py = 0, a = 0; const pts = [[0, 0]];
      for (let r = 0; r < 24; r++) for (const ch of word) {
        const c = ch.charCodeAt(0); a += c * 0.1; const step = 1 + (c % 5) * 0.5;
        px += Math.cos(a) * step; py += Math.sin(a) * step; pts.push([px, py]);
      }
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach(q => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
      const sc = (s - 16) / Math.max(x1 - x0, y1 - y0, 1e-6), ox = x + (s - (x1 - x0) * sc) / 2, oy = y + (s - (y1 - y0) * sc) / 2;
      strokePath(g, pts.map(q => [ox + (q[0] - x0) * sc, oy + (q[1] - y0) * sc]), BLU, 0.9);
    } else if (i === 5) {
      const n = 10, c = (s - 8) / n;
      for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        const cx = x + 4 + k * c, cy = y + 4 + j * c, d = 1 + Math.floor(R() * 6);
        g.save(); g.beginPath(); g.rect(cx, cy, c, c); g.clip();
        for (let t = 1; t <= 3; t++) {
          const o = t * c / 4;
          if (d === 1) L([cx + o, cy], [cx + o, cy + c]);
          if (d === 2) L([cx, cy + o], [cx + c, cy + o]);
          if (d === 3) L([cx + o * 2 - c, cy + c], [cx + o * 2, cy]);
          if (d === 4) L([cx + o * 2 - c, cy], [cx + o * 2, cy + c]);
          if (d === 5) strokePath(g, handCircle([cx, cy], o * 1.3, 0.3, R), RED, 0.8);
        }
        g.restore();
      }
    }
  }
  demos.sources = function (host) {
    const w = W(host, 900), cols = w >= 640 ? 3 : 2, pad = 12, cap = 80;
    const s = Math.floor((w - pad * (cols + 1)) / cols), rows = Math.ceil(6 / cols), h = rows * (s + cap) + pad * (rows + 1);
    let seeds = SOURCES.map(newSeed), dirty = true;
    const params = ui(host, [
      { type: 'text', key: 'name', label: 'name for “translation”', value: 'SOL LEWITT', max: 24, onChange: () => dirty = true },
      { type: 'button', label: '↻ run all six again', onClick: () => { seeds = seeds.map(newSeed); dirty = true; } },
      { type: 'readout' }
    ]);
    params.__readout.textContent = 'click a panel to run just that rule again';
    const at = (i) => [pad + (i % cols) * (s + pad), pad + Math.floor(i / cols) * (s + cap + pad)];
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); };
      p.draw = () => {
        if (!dirty) return; dirty = false;
        const g = p.drawingContext;
        g.save(); g.fillStyle = PAPER; g.fillRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
        SOURCES.forEach((src, i) => {
          const [x, y] = at(i);
          g.fillStyle = WALL; g.fillRect(x, y, s, s);
          g.save(); source(i, g, x, y, s, mulberry(seeds[i]), params.name); g.restore();
          label(g, (i + 1) + '. ' + src.name, x, y + s + 16, { bold: true, sans: true, size: 13 });
          g.fillStyle = '#3a3630'; g.font = '10.5px ' + MONO; g.textAlign = 'left';
          wrapText(g, src.text, x, y + s + 31, s, 13.5);
        });
        g.restore();
      };
      p.mousePressed = () => {
        for (let i = 0; i < 6; i++) { const [x, y] = at(i); if (p.mouseX >= x && p.mouseX <= x + s && p.mouseY >= y && p.mouseY <= y + s) { seeds[i] = newSeed(); dirty = true; } }
      };
    };
  };

  // ---------- mounting / lifecycle (same as life.js) ----------
  function mount(host) {
    const name = host.dataset.demo;
    if (!demos[name]) { host.textContent = 'missing demo: ' + name; return; }
    const head = document.createElement('div'); head.className = 'demo-head';
    head.innerHTML = (host.dataset.title || name) + '<span class="tag">interactive · p5.js</span>';
    const canvasWrap = document.createElement('div'); canvasWrap.className = 'demo-canvas';
    host.append(head, canvasWrap);
    const factory = demos[name](host, host.dataset.preset);
    if (host.dataset.foot) { const f = document.createElement('div'); f.className = 'demo-foot'; f.innerHTML = '<p>' + host.dataset.foot + '</p>'; host.appendChild(f); }
    host._p5 = new p5(factory, canvasWrap);
    host._w = host.clientWidth;
  }
  function remount(h) { if (h._p5) h._p5.remove(); h._p5 = null; h.innerHTML = ''; mount(h); }
  function needsRemount(h) { return h._p5 && Math.abs(h.clientWidth - h._w) > 40 && h.clientWidth > 0; }
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => document.querySelectorAll('section.chapter.active .demo[data-demo]').forEach(h => { if (needsRemount(h)) remount(h); }), 300); });

  window.Demos = {
    activate(section) { section.querySelectorAll('.demo[data-demo]').forEach(h => { if (!h._p5) mount(h); else if (needsRemount(h)) remount(h); else h._p5.loop(); }); },
    deactivate(section) { section.querySelectorAll('.demo[data-demo]').forEach(h => { if (h._p5) h._p5.noLoop(); }); }
  };

  // ======================================================================
  // Ambiguity finder (plain HTML, no canvas)
  // ======================================================================
  const Q = {
    count: 'How many is that? A fixed number, a range like random(3, 8), or the drafter’s choice?',
    random: 'Random how? Uniform, clustered, biased to one side? Does every drafter get a different result (a new seed)?',
    even: 'Even how? A grid, a jittered grid, or points pushed apart from each other?',
    notstraight: 'How not straight? Wavy (sines), wandering (noise), zigzag, one curve? How far may it stray?',
    about: 'How close is “about”? Give the tolerance, in pixels or as a fraction.',
    any: 'Any at all, or chosen by a rule? Who chooses: you, random(), or the viewer?',
    until: 'Until exactly when? What condition will the code test to know it should stop?',
    fill: 'When is it full? A count, a percentage covered, or no room left for the next mark?',
    touch: 'At what distance do two lines touch: 0 px, 1 px, the width of the line? Does crossing count?',
    cross: 'Must it cross, may it cross, or must it not? Crossing what: everything, or only its neighbours?',
    size: 'Compared to what? Give a size in pixels, or a fraction of the space.',
    near: 'How near? A distance, or a fraction of the space?',
    edge: 'Which edge: all four, or one? Exactly on it, or near it?',
    centre: 'The centre of what: the wall, the part, the shape?',
    line: 'How thick, what colour, what tool? Must it stay inside the space? Where does it start and end?',
    curve: 'Which curve? A circle’s arc, a bezier, noise? Through which points, how much of the circle?',
    grid: 'How many rows and columns? Is the grid drawn, or only used to place things?',
    each: 'Is each one decided on its own, or does it depend on the others (or on the one before)?',
    between: 'Between which two things, measured how?',
    direction: 'Which directions are allowed? Four? Eight? Any angle?',
    colour: 'Which colours exactly? Chosen how: in order, at random, by a rule?',
    dense: 'Dense compared to what? How many marks per area?',
    repeat: 'How many times? What changes each time?',
    nearest: 'Nearest by straight-line distance? What if two are equally near?',
    point: 'Is the point drawn, or only used to place other things?',
    shape: 'Which shape? Made from which points, which size?',
    differ: 'Different in what way? Which property changes, and by how much?',
    inside: 'Strictly inside, or may it touch the boundary?',
    taste: 'Not an instruction: a drafter cannot follow a feeling. What would they actually do with their hand?',
    organic: 'What does that mean in steps? Noise? Growth? Branching? Wobble?',
    number: 'A fixed number. Is it a constant, or a parameter you will want to change later?'
  };
  const TERMS = [
    ['each other', 'skip'], ['one another', 'skip'],
    ['not straight', 'notstraight'], ['at random', 'random'], ['randomly', 'random'], ['random', 'random'],
    ['evenly', 'even'], ['even', 'even'], ['equally', 'even'], ['uniformly', 'even'],
    ['some', 'count'], ['many', 'count'], ['few', 'count'], ['several', 'count'], ['a lot of', 'count'], ['lots of', 'count'], ['a number of', 'count'],
    ['about', 'about'], ['approximately', 'about'], ['roughly', 'about'], ['around', 'about'], ['almost', 'about'],
    ['any', 'any'], ['whatever', 'any'], ['until', 'until'], ['fill', 'fill'], ['fills', 'fill'], ['cover', 'fill'], ['covering', 'fill'],
    ['touch', 'touch'], ['touching', 'touch'], ['touches', 'touch'], ['meet', 'touch'], ['cross', 'cross'], ['crossing', 'cross'], ['crosses', 'cross'], ['overlap', 'cross'], ['overlapping', 'cross'],
    ['large', 'size'], ['big', 'size'], ['small', 'size'], ['long', 'size'], ['short', 'size'], ['thick', 'size'], ['thin', 'size'], ['wide', 'size'], ['narrow', 'size'],
    ['near', 'near'], ['close', 'near'], ['far', 'near'], ['towards', 'near'], ['toward', 'near'],
    ['edge', 'edge'], ['edges', 'edge'], ['side', 'edge'], ['sides', 'edge'], ['border', 'edge'],
    ['centre', 'centre'], ['center', 'centre'], ['middle', 'centre'],
    ['line', 'line'], ['lines', 'line'], ['curve', 'curve'], ['curves', 'curve'], ['curved', 'curve'], ['arc', 'curve'], ['arcs', 'curve'], ['circle', 'curve'], ['circles', 'curve'],
    ['grid', 'grid'], ['each', 'each'], ['every', 'each'], ['between', 'between'], ['direction', 'direction'], ['directions', 'direction'],
    ['colour', 'colour'], ['color', 'colour'], ['colours', 'colour'], ['colors', 'colour'], ['coloured', 'colour'], ['colored', 'colour'],
    ['dense', 'dense'], ['densely', 'dense'], ['sparse', 'dense'], ['sparsely', 'dense'],
    ['repeat', 'repeat'], ['repeated', 'repeat'], ['again', 'repeat'], ['nearest', 'nearest'], ['closest', 'nearest'],
    ['point', 'point'], ['points', 'point'], ['dot', 'point'], ['dots', 'point'], ['shape', 'shape'], ['shapes', 'shape'],
    ['different', 'differ'], ['differently', 'differ'], ['similar', 'differ'], ['vary', 'differ'], ['varying', 'differ'],
    ['inside', 'inside'], ['within', 'inside'], ['outside', 'inside'],
    ['beautiful', 'taste'], ['nice', 'taste'], ['interesting', 'taste'], ['pleasing', 'taste'], ['balanced', 'taste'], ['harmonious', 'taste'],
    ['organic', 'organic'], ['natural', 'organic'], ['naturally', 'organic'], ['flowing', 'organic']
  ];
  const NUMWORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty', 'thirty', 'forty', 'fifty', 'hundred', 'thousand'];
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function initAmbig(box) {
    const ta = box.querySelector('textarea'), out = box.querySelector('.ambig-text'), list = box.querySelector('.ambig-q'), stats = box.querySelector('.ambig-stats');
    const KEY = 'smi26-lewitt-draft';
    try { const d = localStorage.getItem(KEY); if (d) ta.value = d; } catch (e) { }
    const terms = TERMS.slice().sort((a, b) => b[0].length - a[0].length);
    const re = new RegExp('\\b(' + terms.map(t => t[0].replace(/ /g, '\\s+')).join('|') + '|' + NUMWORDS.join('|') + '|\\d+(?:\\.\\d+)?)\\b', 'gi');
    const lookup = {}; terms.forEach(t => lookup[t[0]] = t[1]);
    function run() {
      const text = ta.value;
      try { localStorage.setItem(KEY, text); } catch (e) { }
      const order = [], seen = {};
      let html = '', last = 0, m, marks = 0;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        const word = m[0].toLowerCase().replace(/\s+/g, ' ');
        const kind = lookup[word] || 'number';
        if (kind === 'skip') continue;   // the lastIndex has moved on; the words stay plain text
        if (!(kind in seen)) { seen[kind] = order.length + 1; order.push({ kind, word: m[0] }); }
        html += esc(text.slice(last, m.index)) + '<mark class="amb">' + esc(m[0]) + '<sup>' + seen[kind] + '</sup></mark>';
        last = m.index + m[0].length; marks++;
      }
      html += esc(text.slice(last));
      out.innerHTML = html.replace(/\n/g, '<br>') || '<span class="small">write an instruction above</span>';
      list.innerHTML = order.map(o => '<li><b>' + esc(o.word.toLowerCase()) + '</b> · ' + Q[o.kind] + '</li>').join('');
      const words = (text.match(/\S+/g) || []).length;
      stats.textContent = words + ' words · ' + marks + ' places where a drafter must decide · ' + order.length + ' different kinds of decision';
    }
    ta.addEventListener('input', run);
    run();
  }
  document.querySelectorAll('.ambig').forEach(initAmbig);
})();
