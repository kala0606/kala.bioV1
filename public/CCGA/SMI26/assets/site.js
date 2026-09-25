/* CCGA · SMI26 — shared engine
   1. Hash-seeded header drawings (every page begins with a token hash)
   2. Editable p5.js playgrounds (CodeMirror → sandboxed iframe)
   3. Small live demos with sliders
*/
(function () {
  'use strict';

  // ---------- hashing / seeded random (the same idea Art Blocks uses) ----------
  function randomHash() {
    let h = '0x';
    for (let i = 0; i < 64; i++) h += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    return h;
  }
  // cyrb53 — turns any string into a 53-bit integer
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  // mulberry32 — a tiny deterministic PRNG
  function prng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  window.CCGA = { randomHash, cyrb53, prng };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // ---------- header drawings ----------
  const headerArt = {
    // 10,000 short lines, evenly covering the wall (after LeWitt #86)
    lines(ctx, w, h, R) {
      ctx.strokeStyle = css('--ink'); ctx.lineWidth = 0.6; ctx.globalAlpha = 0.85;
      const n = Math.floor(w * h / 60), len = 22;
      for (let i = 0; i < n; i++) {
        const x = R() * w, y = R() * h, a = R() * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
      }
    },
    // sunflower phyllotaxis, the angle nudged by the hash
    phyllo(ctx, w, h, R) {
      const cx = w * 0.5, cy = h * 0.52, ang = (137.5 + (R() - 0.5) * 0.9) * Math.PI / 180;
      const c = Math.min(w, h) / 34;
      ctx.fillStyle = css('--pen');
      for (let i = 0; i < 900; i++) {
        const r = c * Math.sqrt(i), t = i * ang;
        const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
        if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue;
        ctx.beginPath(); ctx.arc(x, y, 1.2 + Math.sqrt(i) * 0.09, 0, 7); ctx.fill();
      }
    },
    // Schotter: order decays into disorder, left to right (after Nees)
    schotter(ctx, w, h, R) {
      const s = 26, rows = Math.floor((h - 40) / s), cols = Math.floor((w - 40) / s);
      const ox = (w - cols * s) / 2, oy = (h - rows * s) / 2;
      ctx.strokeStyle = css('--ink'); ctx.lineWidth = 1;
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const k = c / cols;
        const jx = (R() - 0.5) * k * 18, jy = (R() - 0.5) * k * 18, a = (R() - 0.5) * k * 1.6;
        ctx.save(); ctx.translate(ox + c * s + s / 2 + jx, oy + r * s + s / 2 + jy); ctx.rotate(a);
        ctx.strokeRect(-s / 2 + 1, -s / 2 + 1, s - 2, s - 2); ctx.restore();
      }
    },
    // Game of Life, run 40 generations from a random soup
    life(ctx, w, h, R) {
      const s = 8, cols = Math.ceil(w / s), rows = Math.ceil(h / s);
      let g = new Uint8Array(cols * rows);
      for (let i = 0; i < g.length; i++) g[i] = R() < 0.32 ? 1 : 0;
      for (let gen = 0; gen < 40; gen++) {
        const n = new Uint8Array(cols * rows);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          let c = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            c += g[((y + dy + rows) % rows) * cols + (x + dx + cols) % cols];
          }
          const a = g[y * cols + x];
          n[y * cols + x] = (a && (c === 2 || c === 3)) || (!a && c === 3) ? 1 : 0;
        }
        g = n;
      }
      ctx.fillStyle = css('--ink');
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (g[y * cols + x]) ctx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
    },
    // a squiggle: one noisy line, hue walking the spectrum (after Snowfro)
    squiggle(ctx, w, h, R) {
      const n = 160, amp = h * 0.28, pts = [];
      let y = h / 2, v = 0;
      for (let i = 0; i < n; i++) {
        v += (R() - 0.5) * 6; v *= 0.86; y += v; y = Math.max(h * 0.15, Math.min(h * 0.85, y));
        pts.push([40 + (i / (n - 1)) * (w - 80), y]);
      }
      ctx.lineCap = 'round'; ctx.lineWidth = Math.max(6, h / 22);
      const hue0 = R() * 360;
      for (let i = 1; i < n; i++) {
        ctx.strokeStyle = `hsl(${(hue0 + i * 3) % 360} 85% 55%)`;
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      }
    },
    // flocking trails, drawn all at once (a still of KARMA's idea)
    flock(ctx, w, h, R) {
      const N = 60, steps = 140, b = [];
      for (let i = 0; i < N; i++) b.push({ x: R() * w, y: R() * h, vx: (R() - 0.5) * 3, vy: (R() - 0.5) * 3 });
      ctx.lineWidth = 0.8; ctx.globalAlpha = 0.55;
      const trails = b.map(p => [[p.x, p.y]]);
      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < N; i++) {
          const p = b[i]; let ax = 0, ay = 0, cx = 0, cy = 0, n = 0, sx = 0, sy = 0;
          for (let j = 0; j < N; j++) {
            if (i === j) continue; const q = b[j], dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
            if (d2 < 60 * 60) { ax += q.vx; ay += q.vy; cx += q.x; cy += q.y; n++; if (d2 < 22 * 22) { sx -= dx; sy -= dy; } }
          }
          if (n) { ax = ax / n - p.vx; ay = ay / n - p.vy; cx = cx / n - p.x; cy = cy / n - p.y; }
          p.vx += ax * 0.05 + cx * 0.003 + sx * 0.02; p.vy += ay * 0.05 + cy * 0.003 + sy * 0.02;
          const sp = Math.hypot(p.vx, p.vy) || 1, m = 2.4; p.vx = p.vx / sp * m; p.vy = p.vy / sp * m;
          p.x = (p.x + p.vx + w) % w; p.y = (p.y + p.vy + h) % h;
          const t = trails[i], last = t[t.length - 1];
          if (Math.abs(last[0] - p.x) > w / 2 || Math.abs(last[1] - p.y) > h / 2) t.push(null);
          t.push([p.x, p.y]);
        }
      }
      trails.forEach((t, i) => {
        ctx.strokeStyle = i % 5 === 0 ? css('--pen') : css('--ink');
        ctx.beginPath(); let pen = false;
        for (const p of t) { if (!p) { pen = false; continue; } if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
      });
    },
    // nested squares, 1% disorder (after Molnár)
    desordres(ctx, w, h, R) {
      const s = 44, cols = Math.floor((w - 40) / s), rows = Math.floor((h - 30) / s);
      const ox = (w - cols * s) / 2, oy = (h - rows * s) / 2;
      ctx.strokeStyle = css('--ink'); ctx.lineWidth = 0.9;
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const cx = ox + c * s + s / 2, cy = oy + r * s + s / 2, d = R() < 0.12 ? 3.5 : 0.6;
        for (let k = 1; k <= 6; k++) {
          const half = (s / 2 - 2) * k / 6;
          ctx.beginPath();
          const pt = (x, y) => [cx + x * half + (R() - .5) * d, cy + y * half + (R() - .5) * d];
          const p = [pt(-1, -1), pt(1, -1), pt(1, 1), pt(-1, 1)];
          ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); ctx.stroke();
        }
      }
    }
  };

  function drawHeader(plot) {
    const canvas = plot.querySelector('canvas');
    const kind = plot.dataset.art || 'lines';
    const hash = plot.dataset.hash || (plot.dataset.hash = randomHash());
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = plot.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    (headerArt[kind] || headerArt.lines)(ctx, w, h, prng(cyrb53(hash)));
    const hs = plot.querySelector('.hash');
    if (hs) hs.innerHTML = 'hash <b>' + hash.slice(0, 10) + '…' + hash.slice(-6) + '</b>';
    const full = plot.querySelector('.hash-full'); if (full) full.textContent = hash;
  }
  function initHeaders() {
    document.querySelectorAll('.plot').forEach(plot => {
      drawHeader(plot);
      const btn = plot.querySelector('button.rehash');
      if (btn) btn.addEventListener('click', () => { plot.dataset.hash = randomHash(); drawHeader(plot); });
      let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => drawHeader(plot), 120); });
    });
  }

  // ---------- playgrounds ----------
  const P5 = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/p5.min.js';
  let pgCount = 0;

  function sandboxHtml(code, seed, hash, id) {
    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<style>html,body{margin:0;height:100%;background:#fff;overflow:hidden}body{display:flex;align-items:center;justify-content:center}' +
      'canvas{display:block;max-width:100%!important;max-height:100%!important;width:auto!important;height:auto!important}main{display:contents}</style>' +
      '<script src="' + P5 + '"><\/script>' +
      '<script>const SEED=' + seed + ';const HASH="' + hash + '";const ID=' + id + ';' +
      'window.addEventListener("error",function(e){parent.postMessage({type:"pgerror",id:ID,msg:String(e.message)+(e.lineno?" (line "+(e.lineno-1)+")":"")},"*")});' +
      'window.addEventListener("load",function(){parent.postMessage({type:"pgok",id:ID},"*")});<\/script>' +
      '</head><body><script>\n' + code.replace(/<\/script/gi, '<\\/script') + '\n<\/script></body></html>';
  }

  function buildPlayground(el) {
    const id = pgCount++;
    const srcEl = el.querySelector('script.src, textarea.src');
    const original = (srcEl ? srcEl.textContent : '').replace(/^\n/, '').replace(/\n\s*$/, '');
    const title = el.dataset.title || 'Sketch';
    const after = el.dataset.after || '';
    let hash = randomHash();
    let seed = cyrb53(hash) % 2147483647;

    el.innerHTML =
      '<div class="pg">' +
      '<div class="pg-head"><span class="title"></span><span class="after"></span>' +
      '<div class="pg-tools"><span class="seed" title="Every run is seeded from this hash, like a token on Art Blocks">seed <b></b></span>' +
      '<button type="button" class="rehash">new hash</button><button type="button" class="reset">reset code</button>' +
      '<button type="button" class="run">run ▶</button></div></div>' +
      '<div class="pg-editor"></div><div class="pg-view"><iframe title="' + title + ' — output" sandbox="allow-scripts"></iframe></div>' +
      '<div class="pg-foot"><span class="msg">edit the code, then run · ' + (navigator.platform.includes('Mac') ? '⌘' : 'ctrl') + '+enter also runs</span></div></div>';

    el.querySelector('.title').textContent = title;
    el.querySelector('.after').textContent = after;
    const seedEl = el.querySelector('.seed b');
    const iframe = el.querySelector('iframe');
    const foot = el.querySelector('.pg-foot .msg');
    const editorHost = el.querySelector('.pg-editor');

    let getCode, setCode;
    if (window.CodeMirror) {
      const cm = CodeMirror(editorHost, {
        value: original, mode: 'javascript', lineNumbers: true, lineWrapping: true,
        indentUnit: 2, tabSize: 2, viewportMargin: Infinity,
        extraKeys: { 'Cmd-Enter': run, 'Ctrl-Enter': run, Tab: cm => cm.execCommand('indentMore'), 'Shift-Tab': cm => cm.execCommand('indentLess') }
      });
      getCode = () => cm.getValue(); setCode = v => cm.setValue(v);
    } else {
      const ta = document.createElement('textarea'); ta.className = 'fallback'; ta.value = original; ta.spellcheck = false;
      ta.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
      editorHost.appendChild(ta);
      getCode = () => ta.value; setCode = v => { ta.value = v; };
    }

    function run() {
      foot.innerHTML = 'running…';
      seedEl.textContent = String(seed);
      iframe.srcdoc = sandboxHtml(getCode(), seed, hash, id);
    }
    el.querySelector('.run').addEventListener('click', run);
    el.querySelector('.reset').addEventListener('click', () => { setCode(original); run(); });
    el.querySelector('.rehash').addEventListener('click', () => { hash = randomHash(); seed = cyrb53(hash) % 2147483647; run(); });
    window.addEventListener('message', e => {
      if (!e.data || e.data.id !== id) return;
      if (e.data.type === 'pgerror') foot.innerHTML = '<span class="err">' + escapeHtml(e.data.msg) + '</span>';
      else if (e.data.type === 'pgok') foot.innerHTML = 'ok · seed ' + seed + ' · change a number and run again';
    });

    // run only when scrolled near, so a page of sketches stays light
    const io = new IntersectionObserver(entries => {
      if (entries.some(en => en.isIntersecting)) { run(); io.disconnect(); }
    }, { rootMargin: '300px' });
    io.observe(el);
  }
  function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  // ---------- small vanilla demos (sliders) ----------
  function initDemos() {
    document.querySelectorAll('.demo[data-demo]').forEach(d => {
      const fn = demos[d.dataset.demo]; if (fn) fn(d);
    });
  }
  const demos = {
    phyllotaxis(root) {
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
      const angle = root.querySelector('input[name=angle]'), out = root.querySelector('output');
      let n = 0, raf;
      function frame() {
        const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2, c = 7;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        const a = parseFloat(angle.value) * Math.PI / 180;
        ctx.fillStyle = css('--pen');
        for (let i = 0; i < n; i++) {
          const r = c * Math.sqrt(i), t = i * a;
          ctx.beginPath(); ctx.arc(cx + r * Math.cos(t), cy + r * Math.sin(t), 2 + Math.sqrt(i) * .12, 0, 7); ctx.fill();
        }
        out.textContent = parseFloat(angle.value).toFixed(2) + '°';
        if (n < 700) { n += reduceMotion ? 700 : 4; raf = requestAnimationFrame(frame); }
      }
      angle.addEventListener('input', () => { cancelAnimationFrame(raf); n = 700; frame(); });
      root.querySelectorAll('button[data-set]').forEach(b => b.addEventListener('click', () => { angle.value = b.dataset.set; cancelAnimationFrame(raf); n = 0; frame(); }));
      frame();
    },
    rule30(root) {
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
      const ruleIn = root.querySelector('input[name=rule]'), out = root.querySelector('output');
      function draw() {
        const rule = parseInt(ruleIn.value, 10); out.textContent = rule;
        const s = 4, cols = Math.floor(cv.width / s), rows = Math.floor(cv.height / s);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        let row = new Uint8Array(cols); row[Math.floor(cols / 2)] = 1;
        ctx.fillStyle = css('--ink');
        for (let y = 0; y < rows; y++) {
          const next = new Uint8Array(cols);
          for (let x = 0; x < cols; x++) {
            if (row[x]) ctx.fillRect(x * s, y * s, s, s);
            const l = row[(x - 1 + cols) % cols], c = row[x], r = row[(x + 1) % cols];
            next[x] = (rule >> ((l << 2) | (c << 1) | r)) & 1;
          }
          row = next;
        }
      }
      ruleIn.addEventListener('input', draw);
      root.querySelectorAll('button[data-set]').forEach(b => b.addEventListener('click', () => { ruleIn.value = b.dataset.set; draw(); }));
      draw();
    },
    reaction(root) {
      // Gray–Scott reaction–diffusion, small grid
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
      const W = 140, H = 90; cv.width = W; cv.height = H;
      const fIn = root.querySelector('input[name=f]'), kIn = root.querySelector('input[name=k]');
      const fo = root.querySelector('output[name=fo]'), ko = root.querySelector('output[name=ko]');
      let A, B, A2, B2, raf, running = true;
      const img = ctx.createImageData(W, H);
      function reset() {
        A = new Float32Array(W * H).fill(1); B = new Float32Array(W * H); A2 = new Float32Array(W * H); B2 = new Float32Array(W * H);
        for (let k = 0; k < 8; k++) { const x0 = 10 + Math.floor(Math.random() * (W - 20)), y0 = 10 + Math.floor(Math.random() * (H - 20)); for (let y = -3; y < 3; y++) for (let x = -3; x < 3; x++) B[(y0 + y) * W + x0 + x] = 1; }
      }
      function step() {
        const f = parseFloat(fIn.value), k = parseFloat(kIn.value), dA = 1, dB = .5;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x, l = y * W + (x + W - 1) % W, r = y * W + (x + 1) % W, u = ((y + H - 1) % H) * W + x, d = ((y + 1) % H) * W + x;
          const a = A[i], b = B[i];
          const la = A[l] + A[r] + A[u] + A[d] - 4 * a, lb = B[l] + B[r] + B[u] + B[d] - 4 * b;
          const abb = a * b * b;
          A2[i] = a + (dA * la * .2 - abb + f * (1 - a)); B2[i] = b + (dB * lb * .2 + abb - (k + f) * b);
        }
        [A, A2] = [A2, A]; [B, B2] = [B2, B];
      }
      const pen = css('--pen'); const m = pen.match(/#([0-9a-f]{6})/i); const pr = m ? parseInt(m[1].slice(0, 2), 16) : 35, pg = m ? parseInt(m[1].slice(2, 4), 16) : 56, pb = m ? parseInt(m[1].slice(4, 6), 16) : 200;
      function paint() {
        for (let i = 0; i < W * H; i++) { const v = Math.max(0, Math.min(1, (A[i] - B[i]))); const t = 1 - v; img.data[i * 4] = 255 + (pr - 255) * t; img.data[i * 4 + 1] = 255 + (pg - 255) * t; img.data[i * 4 + 2] = 255 + (pb - 255) * t; img.data[i * 4 + 3] = 255; }
        ctx.putImageData(img, 0, 0);
      }
      function loop() { if (running) { for (let i = 0; i < 12; i++) step(); paint(); } raf = requestAnimationFrame(loop); }
      fo.textContent = fIn.value; ko.textContent = kIn.value;
      fIn.addEventListener('input', () => fo.textContent = fIn.value); kIn.addEventListener('input', () => ko.textContent = kIn.value);
      root.querySelector('button.reset').addEventListener('click', reset);
      root.querySelectorAll('button[data-f]').forEach(b => b.addEventListener('click', () => { fIn.value = b.dataset.f; kIn.value = b.dataset.k; fo.textContent = fIn.value; ko.textContent = kIn.value; reset(); }));
      reset(); paint();
      if (reduceMotion) { for (let i = 0; i < 1500; i++) step(); paint(); } else loop();
      document.addEventListener('visibilitychange', () => running = !document.hidden);
    },
    life(root) {
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
      const s = 10, cols = Math.floor(cv.width / s), rows = Math.floor(cv.height / s);
      let g = new Uint8Array(cols * rows), playing = false, timer;
      const out = root.querySelector('output'); let gen = 0;
      function soup() { for (let i = 0; i < g.length; i++) g[i] = Math.random() < .3 ? 1 : 0; gen = 0; draw(); }
      function clear() { g.fill(0); gen = 0; draw(); }
      function draw() {
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.strokeStyle = css('--rule'); ctx.lineWidth = .5;
        for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * s, 0); ctx.lineTo(x * s, rows * s); ctx.stroke(); }
        for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * s); ctx.lineTo(cols * s, y * s); ctx.stroke(); }
        ctx.fillStyle = css('--ink');
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (g[y * cols + x]) ctx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
        out.textContent = 'gen ' + gen;
      }
      function step() {
        const n = new Uint8Array(cols * rows);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          let c = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; c += g[((y + dy + rows) % rows) * cols + (x + dx + cols) % cols]; }
          const a = g[y * cols + x]; n[y * cols + x] = (a && (c === 2 || c === 3)) || (!a && c === 3) ? 1 : 0;
        }
        g = n; gen++; draw();
      }
      cv.addEventListener('pointerdown', e => {
        const r = cv.getBoundingClientRect(), sx = cv.width / r.width, sy = cv.height / r.height;
        const x = Math.floor((e.clientX - r.left) * sx / s), y = Math.floor((e.clientY - r.top) * sy / s);
        if (x >= 0 && x < cols && y >= 0 && y < rows) { g[y * cols + x] ^= 1; draw(); }
      });
      const play = root.querySelector('button.play');
      play.addEventListener('click', () => { playing = !playing; play.textContent = playing ? 'pause' : 'play'; clearInterval(timer); if (playing) timer = setInterval(step, 120); });
      root.querySelector('button.step').addEventListener('click', step);
      root.querySelector('button.soup').addEventListener('click', soup);
      root.querySelector('button.clear').addEventListener('click', clear);
      // seed a glider + a blinker so there is something to see
      clear(); [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].forEach(([x, y]) => g[(y + 2) * cols + x + 2] = 1);
      [[0, 0], [1, 0], [2, 0]].forEach(([x, y]) => g[(y + 10) * cols + x + 20] = 1); draw();
    }
  };

  // ---------- boot ----------
  function boot() {
    initHeaders();
    document.querySelectorAll('.playground').forEach(buildPlayground);
    initDemos();
    // mark current chapter in nav
    const here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.chapters a').forEach(a => { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
