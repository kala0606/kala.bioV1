/* ------------------------------------------------------------------
   In-page interactive demos (p5 instance mode).
   <div class="demo" data-demo="name" data-title="..."></div>
   Each demo is created lazily when its chapter opens, and paused when
   the chapter closes.
------------------------------------------------------------------ */
(function () {
  const PAPER = '#f4efe6', INK = '#151515', RED = '#d7261e', YEL = '#f0c02e', BLU = '#1d4fbd', MUTED = '#6d6660';
  const demos = {};

  // ---------- tiny UI helper ----------
  function ui(host, controls) {
    const bar = document.createElement('div');
    bar.className = 'demo-ui';
    const params = {};
    const bindings = [];
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
        bindings.push({ key: c.key, set: v => { inp.value = v; params[c.key] = v; update(); } });
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
        const b = document.createElement('button'); b.textContent = c.label; b.addEventListener('click', c.onClick); bar.appendChild(b);
      } else if (c.type === 'readout') {
        const r = document.createElement('div'); r.className = 'readout'; bar.appendChild(r); params.__readout = r;
      }
    });
    host.appendChild(bar);
    return params;
  }

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function W(host, max) { return Math.max(300, Math.min(max || 720, host.clientWidth - 4)); }

  // ================= coords: the canvas is a grid =================
  demos.coords = function (host) {
    const w = W(host, 640), h = 260;
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      p.draw = () => {
        p.background(255);
        p.stroke(230); p.strokeWeight(1);
        for (let x = 0; x <= w; x += 40) p.line(x, 0, x, h);
        for (let y = 0; y <= h; y += 40) p.line(0, y, w, y);
        p.noStroke(); p.fill(MUTED); p.textSize(11); p.textAlign(p.LEFT, p.TOP);
        p.text('(0, 0)  ← x grows this way', 6, 6);
        p.textAlign(p.RIGHT, p.BOTTOM); p.text('(' + w + ', ' + h + ')', w - 6, h - 6);
        p.textAlign(p.LEFT, p.TOP); p.text('y grows down ↓', 6, 24);
        if (p.mouseX >= 0 && p.mouseX <= w && p.mouseY >= 0 && p.mouseY <= h) {
          p.stroke(RED); p.strokeWeight(1.5);
          p.line(p.mouseX, 0, p.mouseX, h); p.line(0, p.mouseY, w, p.mouseY);
          p.noStroke(); p.fill(RED); p.circle(p.mouseX, p.mouseY, 10);
          p.fill(INK); p.textSize(14); p.textAlign(p.LEFT, p.BOTTOM);
          const tx = p.mouseX > w - 140 ? p.mouseX - 130 : p.mouseX + 12;
          p.text('circle(' + Math.round(p.mouseX) + ', ' + Math.round(p.mouseY) + ', 10)', tx, p.mouseY - 8);
        } else {
          p.fill(INK); p.textSize(14); p.textAlign(p.CENTER, p.CENTER); p.text('move your mouse over me', w / 2, h / 2);
        }
      };
    };
  };

  // ================= memory: variables are labelled boxes =================
  demos.memory = function (host) {
    const w = W(host, 720), h = 300;
    let x = 60, speed = 3, bouncing = false, bounces = 0;
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      const box = (bx, by, name, val, type, bytes, hot) => {
        p.stroke(INK); p.strokeWeight(2); p.fill(hot ? YEL : '#fffdf8');
        p.rect(bx, by, 250, 46, 4);
        p.noStroke(); p.fill(INK); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
        p.text(name, bx + 10, by + 6);
        p.textSize(15); p.text(String(val), bx + 10, by + 22);
        p.fill(MUTED); p.textSize(10); p.textAlign(p.RIGHT, p.TOP);
        p.text(type + ' · ' + bytes, bx + 240, by + 8);
      };
      p.draw = () => {
        p.background(255);
        const arenaW = w - 290;
        // the "program"
        x += speed;
        bouncing = false;
        if (x > arenaW - 20 || x < 20) { speed = -speed; bouncing = true; bounces++; }
        p.stroke(INK); p.strokeWeight(2); p.noFill(); p.rect(1, 1, arenaW - 2, h - 2);
        p.noStroke(); p.fill(bouncing ? RED : BLU); p.circle(x, h / 2, 40);
        p.fill(MUTED); p.textSize(11); p.textAlign(p.LEFT, p.TOP); p.text('x += speed;  if (x > edge) speed = -speed;', 10, 10);
        // the "memory"
        const mx = arenaW + 20;
        p.fill(MUTED); p.textSize(11); p.textAlign(p.LEFT, p.TOP); p.text('MEMORY (what the computer keeps)', mx, 10);
        box(mx, 30, 'let x', x.toFixed(1), 'number', '8 bytes', true);
        box(mx, 84, 'let speed', speed, 'number', '8 bytes', bouncing);
        box(mx, 138, 'let bouncing', bouncing, 'boolean', '1 bit (really 1 byte)', bouncing);
        box(mx, 192, 'const name', '"ball"', 'string', '4 chars ≈ 8 bytes', false);
        box(mx, 246, 'let bounces', bounces, 'number', '8 bytes', bouncing);
      };
    };
  };

  // ================= vector vs raster =================
  demos.vectorraster = function (host) {
    const w = W(host, 720), h = 300, half = Math.floor(w / 2);
    const params = ui(host, [
      { type: 'range', key: 'zoom', label: 'zoom', min: 1, max: 12, step: 0.1, value: 1, fmt: v => v.toFixed(1) + '×' },
      { type: 'readout' }
    ]);
    const GW = 64, GH = 48;
    return (p) => {
      let g;
      const drawPicture = (ctx, s) => { // s = scale factor of the drawing
        ctx.push();
        ctx.strokeWeight(2 * s); ctx.stroke(INK);
        ctx.fill(RED); ctx.circle(0, 0, 60 * s);
        ctx.fill(BLU); ctx.rect(-70 * s, -45 * s, 30 * s, 30 * s);
        ctx.stroke(BLU); ctx.line(-80 * s, 50 * s, 80 * s, -50 * s);
        ctx.fill(YEL); ctx.noStroke(); ctx.triangle(40 * s, 20 * s, 80 * s, 20 * s, 60 * s, 55 * s);
        ctx.pop();
      };
      p.setup = () => {
        p.createCanvas(w, h);
        g = p.createGraphics(GW, GH);
        g.background(255);
        g.push(); g.translate(GW / 2, GH / 2); drawPicture(g, GW / 200); g.pop();
        g.loadPixels();
        p.noSmooth();
        p.textFont('JetBrains Mono');
      };
      p.draw = () => {
        p.background(255);
        const z = params.zoom;
        // left: vector
        p.push();
        drawClipped(p, 0, 0, half, h, () => { p.translate(half / 2, h / 2); p.scale(z); drawPicture(p, 1); });
        p.pop();
        // right: raster
        drawClipped(p, half, 0, w - half, h, () => {
          p.translate(half + (w - half) / 2, h / 2); p.scale(z);
          p.image(g, -100, -75, 200, 150);
        });
        p.stroke(INK); p.strokeWeight(3); p.line(half, 0, half, h);
        p.noStroke(); p.fill(INK); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
        p.text('VECTOR · 4 instructions', 8, 8); p.text('RASTER · ' + GW + '×' + GH + ' pixels', half + 8, 8);
        params.__readout.textContent = 'vector ≈ 120 bytes of text, any size  ·  raster = ' + GW + '×' + GH + '×4 = ' + (GW * GH * 4).toLocaleString() + ' bytes (a 4K photo: 33,177,600 bytes)';
      };
      function drawClipped(ctx, x, y, cw, ch, fn) {
        ctx.drawingContext.save(); ctx.drawingContext.beginPath(); ctx.drawingContext.rect(x, y, cw, ch); ctx.drawingContext.clip();
        ctx.push(); fn(); ctx.pop();
        ctx.drawingContext.restore();
      }
    };
  };

  // ================= pixels grid: zoom into RGBA =================
  demos.pixelgrid = function (host) {
    const w = W(host, 720), h = 300;
    const GW = 12, GH = 8, cell = Math.min(Math.floor((w - 250) / GW), Math.floor(h / GH));
    return (p) => {
      let g, hover = null;
      p.setup = () => {
        p.createCanvas(w, h); p.textFont('JetBrains Mono');
        g = p.createGraphics(GW, GH); g.pixelDensity(1);
        g.background(240); g.noStroke(); g.fill(RED); g.circle(GW / 2, GH / 2, GH * 0.9);
        g.fill(BLU); g.rect(0, 0, 3, 3); g.fill(YEL); g.rect(GW - 3, GH - 2, 3, 2);
        g.loadPixels();
      };
      p.draw = () => {
        p.background(255);
        hover = null;
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
          const i = (x + y * GW) * 4;
          const r = g.pixels[i], gg = g.pixels[i + 1], b = g.pixels[i + 2];
          p.stroke(200); p.strokeWeight(1); p.fill(r, gg, b);
          p.rect(x * cell, y * cell, cell, cell);
          if (p.mouseX >= x * cell && p.mouseX < (x + 1) * cell && p.mouseY >= y * cell && p.mouseY < (y + 1) * cell) hover = { x, y, i, r, g: gg, b };
        }
        const px = GW * cell + 16;
        p.noStroke(); p.fill(INK); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
        p.text('a ' + GW + '×' + GH + ' image is\n' + (GW * GH) + ' pixels ×\n4 numbers (R,G,B,A)\n= ' + (GW * GH * 4) + ' numbers\nin one long list.', px, 8);
        if (hover) {
          p.stroke(INK); p.strokeWeight(3); p.noFill(); p.rect(hover.x * cell, hover.y * cell, cell, cell);
          p.noStroke(); p.fill(INK); p.textSize(12);
          p.text('pixel (' + hover.x + ', ' + hover.y + ')\nindex = (x + y*width)*4\n      = (' + hover.x + ' + ' + hover.y + '*' + GW + ')*4\n      = ' + hover.i, px, 110);
          p.fill(RED); p.text('pixels[' + hover.i + '] = ' + hover.r + '   R', px, 190);
          p.fill('#1b8a3a'); p.text('pixels[' + (hover.i + 1) + '] = ' + hover.g + '   G', px, 208);
          p.fill(BLU); p.text('pixels[' + (hover.i + 2) + '] = ' + hover.b + '   B', px, 226);
          p.fill(MUTED); p.text('pixels[' + (hover.i + 3) + '] = 255   A', px, 244);
        } else { p.fill(MUTED); p.text('hover a pixel →', px, 110); }
      };
    };
  };

  // ================= random vs noise =================
  demos.noisevsrandom = function (host) {
    const w = W(host, 720), h = 260, half = Math.floor(w / 2);
    const params = ui(host, [
      { type: 'range', key: 'step', label: 'noise step (how fast t moves)', min: 0.002, max: 0.2, step: 0.002, value: 0.02, fmt: v => v.toFixed(3) }
    ]);
    return (p) => {
      const R = [], N = []; let t = 0;
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      p.draw = () => {
        p.background(255);
        R.push(p.random()); N.push(p.noise(t)); t += params.step;
        const n = half - 20;
        while (R.length > n) R.shift(); while (N.length > n) N.shift();
        const graph = (arr, x0, col, label, code) => {
          p.stroke(230); p.line(x0 + 10, 40, x0 + 10, h - 20); p.line(x0 + 10, h - 20, x0 + n, h - 20);
          p.noFill(); p.stroke(col); p.strokeWeight(2); p.beginShape();
          arr.forEach((v, i) => p.vertex(x0 + 10 + i, p.map(v, 0, 1, h - 20, 40)));
          p.endShape();
          const last = arr[arr.length - 1];
          p.noStroke(); p.fill(col); p.circle(x0 + 10 + arr.length - 1, p.map(last, 0, 1, h - 20, 40), 8);
          p.fill(INK); p.textSize(13); p.textAlign(p.LEFT, p.TOP); p.text(label, x0 + 10, 8);
          p.fill(MUTED); p.textSize(11); p.text(code, x0 + 10, 24);
          p.strokeWeight(1);
        };
        graph(R, 0, RED, 'random()', 'a new unrelated number every frame');
        graph(N, half, BLU, 'noise(t)', 'a number that remembers its neighbour');
        p.stroke(INK); p.strokeWeight(3); p.line(half, 0, half, h);
      };
    };
  };

  // ================= noise anatomy (1D) =================
  demos.noiseanatomy = function (host) {
    const w = W(host, 720), h = 300;
    let seedVals = [], seedGrads = [];
    const reseed = () => { seedVals = []; seedGrads = []; for (let i = 0; i < 40; i++) { seedVals.push(Math.random()); seedGrads.push(Math.random() * 2 - 1); } };
    reseed();
    const params = ui(host, [
      { type: 'buttons', key: 'kind', label: 'lattice holds', value: 'value', options: [{ label: 'random heights (value noise)', value: 'value' }, { label: 'random slopes (Perlin)', value: 'grad' }] },
      { type: 'buttons', key: 'interp', label: 'blend', value: 'smooth', options: [{ label: 'linear', value: 'linear' }, { label: 'smooth fade curve', value: 'smooth' }] },
      { type: 'range', key: 'spacing', label: 'lattice spacing', min: 30, max: 220, step: 1, value: 110, fmt: v => v + 'px' },
      { type: 'button', label: 'reseed', onClick: reseed }
    ]);
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      const valueAt = (x) => {
        const s = params.spacing, i = Math.floor(x / s), t0 = (x - i * s) / s;
        const t = params.interp === 'smooth' ? fade(t0) : t0;
        if (params.kind === 'value') return lerp(seedVals[i], seedVals[i + 1], t);
        // gradient noise: each lattice point has a slope; value = influence of each neighbour's slope
        const g0 = seedGrads[i], g1 = seedGrads[i + 1];
        const d0 = t0, d1 = t0 - 1;
        return 0.5 + lerp(g0 * d0, g1 * d1, t) * 0.9;
      };
      p.draw = () => {
        p.background(255);
        const base = h - 40, amp = h - 90, s = params.spacing;
        p.stroke(235); for (let x = 0; x < w; x += s) p.line(x, 30, x, base + 10);
        p.stroke(220); p.line(0, base, w, base);
        // curve
        p.noFill(); p.stroke(params.kind === 'value' ? RED : BLU); p.strokeWeight(2.5); p.beginShape();
        for (let x = 0; x < w; x++) p.vertex(x, base - valueAt(x) * amp);
        p.endShape();
        // lattice points
        for (let i = 0; i * s <= w; i++) {
          const x = i * s, y = base - valueAt(x) * amp;
          p.noStroke(); p.fill(INK); p.circle(x, y, 9);
          if (params.kind === 'grad') { // slope arrow
            const g = seedGrads[i]; const L = Math.min(s * 0.45, 50);
            p.stroke(YEL); p.strokeWeight(3); p.line(x - L, y + g * L * 0.9 * amp / s, x + L, y - g * L * 0.9 * amp / s);
          }
        }
        // mouse probe
        if (p.mouseX >= 0 && p.mouseX < w && p.mouseY > 0 && p.mouseY < h) {
          const x = p.mouseX, i = Math.floor(x / s), t0 = (x - i * s) / s, t = params.interp === 'smooth' ? fade(t0) : t0;
          p.stroke(MUTED); p.strokeWeight(1); p.line(x, 30, x, base);
          p.noStroke(); p.fill(INK); p.circle(x, base - valueAt(x) * amp, 7);
          p.textSize(11); p.textAlign(p.LEFT, p.TOP); p.fill(INK);
          p.text('between lattice point ' + i + ' and ' + (i + 1) + '\nt = ' + t0.toFixed(2) + (params.interp === 'smooth' ? '  →  fade(t) = ' + t.toFixed(2) : '') + '\nnoise = ' + valueAt(x).toFixed(3), 10, 8);
        } else {
          p.noStroke(); p.fill(MUTED); p.textSize(11); p.textAlign(p.LEFT, p.TOP);
          p.text(params.kind === 'value' ? 'each lattice point has a random height; in between we blend' : 'each lattice point has a random SLOPE (yellow); in between, the slopes are blended. bumps stop landing exactly on the grid.', 10, 8);
        }
      };
    };
  };

  // ================= octaves =================
  demos.octaves = function (host) {
    const w = W(host, 720), h = 320;
    const params = ui(host, [
      { type: 'range', key: 'oct', label: 'octaves', min: 1, max: 8, step: 1, value: 4 },
      { type: 'range', key: 'fall', label: 'falloff (amp × per octave)', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) },
      { type: 'range', key: 'scale', label: 'base frequency', min: 0.002, max: 0.03, step: 0.001, value: 0.008, fmt: v => v.toFixed(3) },
      { type: 'range', key: 'speed', label: 'drift', min: 0, max: 2, step: 0.1, value: 0.5, fmt: v => v.toFixed(1) }
    ]);
    return (p) => {
      let off = 0;
      p.setup = () => { p.createCanvas(w, h); p.noiseDetail(1); p.textFont('JetBrains Mono'); };
      p.draw = () => {
        p.background(255);
        off += params.speed;
        const layers = params.oct, top = 30, laneH = (h - 110) / Math.max(layers, 1);
        let freq = params.scale, amp = 1, maxAmp = 0;
        const sum = new Float32Array(w);
        for (let o = 0; o < layers; o++) {
          const y0 = top + o * laneH + laneH / 2;
          p.stroke(o === 0 ? BLU : '#9a948b'); p.strokeWeight(1.2); p.noFill(); p.beginShape();
          for (let x = 0; x < w; x++) {
            const n = (p.noise((x + off) * freq + o * 100) - 0.5) * amp;
            sum[x] += n; p.vertex(x, y0 - n * laneH * 0.9);
          }
          p.endShape();
          p.noStroke(); p.fill(MUTED); p.textSize(10); p.textAlign(p.LEFT, p.CENTER);
          p.text('octave ' + (o + 1) + '  freq ×' + Math.pow(2, o) + '  amp ' + amp.toFixed(2), 6, y0 - laneH / 2 + 8);
          maxAmp += amp; freq *= 2; amp *= params.fall;
        }
        const yS = h - 40;
        p.stroke(220); p.line(0, yS, w, yS);
        p.stroke(RED); p.strokeWeight(2.5); p.noFill(); p.beginShape();
        for (let x = 0; x < w; x++) p.vertex(x, yS - (sum[x] / maxAmp) * 70);
        p.endShape();
        p.noStroke(); p.fill(RED); p.textSize(11); p.textAlign(p.LEFT, p.TOP); p.text('SUM  = noiseDetail(' + layers + ', ' + params.fall + ')', 6, h - 100);
      };
    };
  };

  // ================= 2D noise / terrain / contours =================
  demos.noise2d = function (host) {
    const w = W(host, 720), h = 320;
    const GW = 160, GH = Math.round(GW * h / w);
    const params = ui(host, [
      { type: 'buttons', key: 'view', value: 'gray', options: [{ label: 'grey', value: 'gray' }, { label: 'terrain', value: 'terrain' }, { label: 'contours', value: 'contour' }, { label: 'threshold', value: 'thresh' }] },
      { type: 'range', key: 'scale', label: 'scale (zoom)', min: 0.005, max: 0.12, step: 0.001, value: 0.03, fmt: v => v.toFixed(3) },
      { type: 'range', key: 'oct', label: 'octaves', min: 1, max: 6, step: 1, value: 4 },
      { type: 'range', key: 'fall', label: 'falloff', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) },
      { type: 'range', key: 'speed', label: 'time (3rd dimension)', min: 0, max: 0.03, step: 0.001, value: 0.005, fmt: v => v.toFixed(3) },
      { type: 'range', key: 'sea', label: 'sea level / threshold', min: 0.2, max: 0.8, step: 0.01, value: 0.5, fmt: v => v.toFixed(2) }
    ]);
    return (p) => {
      let g, z = 0;
      const field = new Float32Array(GW * GH);
      p.setup = () => { p.createCanvas(w, h); g = p.createGraphics(GW, GH); g.pixelDensity(1); p.noSmooth(); };
      const terrainColor = (n, sea) => {
        if (n < sea - 0.08) return [22, 60, 140];
        if (n < sea) return [40, 110, 200];
        if (n < sea + 0.03) return [236, 214, 150];
        if (n < sea + 0.15) return [90, 160, 70];
        if (n < sea + 0.26) return [40, 110, 50];
        if (n < sea + 0.34) return [120, 110, 100];
        return [245, 245, 245];
      };
      p.draw = () => {
        z += params.speed;
        p.noiseDetail(params.oct, params.fall);
        const s = params.scale * (w / GW);
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) field[x + y * GW] = p.noise(x * s, y * s, z);
        g.loadPixels();
        const v = params.view, sea = params.sea;
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
          const n = field[x + y * GW]; const i = (x + y * GW) * 4;
          let r, gg, b;
          if (v === 'gray') { r = gg = b = n * 255; }
          else if (v === 'terrain') { [r, gg, b] = terrainColor(n, sea); }
          else if (v === 'thresh') { const on = n > sea; r = on ? 215 : 244; gg = on ? 38 : 239; b = on ? 30 : 230; }
          else {
            const L = 10, band = Math.floor(n * L);
            const nb = x + 1 < GW ? Math.floor(field[x + 1 + y * GW] * L) : band;
            const nd = y + 1 < GH ? Math.floor(field[x + (y + 1) * GW] * L) : band;
            const edge = band !== nb || band !== nd;
            r = edge ? 21 : 244; gg = edge ? 21 : 239; b = edge ? 21 : 230;
          }
          g.pixels[i] = r; g.pixels[i + 1] = gg; g.pixels[i + 2] = b; g.pixels[i + 3] = 255;
        }
        g.updatePixels();
        p.image(g, 0, 0, w, h);
      };
    };
  };

  // ================= flow field =================
  demos.flowfield = function (host) {
    const w = W(host, 720), h = 380;
    let clearFlag = true;
    const params = ui(host, [
      { type: 'range', key: 'scale', label: 'noise scale', min: 0.002, max: 0.03, step: 0.001, value: 0.008, fmt: v => v.toFixed(3) },
      { type: 'range', key: 'turn', label: 'angle range', min: 1, max: 12, step: 0.5, value: 4, fmt: v => v + 'π' },
      { type: 'range', key: 'count', label: 'particles', min: 100, max: 4000, step: 100, value: 1500 },
      { type: 'range', key: 'speed', label: 'field drift', min: 0, max: 0.01, step: 0.0005, value: 0.002, fmt: v => v.toFixed(4) },
      { type: 'buttons', key: 'show', value: 'trails', options: [{ label: 'trails', value: 'trails' }, { label: 'arrows', value: 'arrows' }] },
      { type: 'button', label: 'clear', onClick: () => { clearFlag = true; } }
    ]);
    return (p) => {
      const parts = []; let z = 0;
      const cell = 20;
      let cols;
      const mk = () => ({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, px: 0, py: 0 });
      p.setup = () => { p.createCanvas(w, h); p.background(255); p.noiseDetail(3, 0.5); cols = [p.color(RED + '22'), p.color(BLU + '22'), p.color(INK + '22')]; };
      p.draw = () => {
        z += params.speed;
        while (parts.length < params.count) parts.push(mk());
        while (parts.length > params.count) parts.pop();
        if (params.show === 'arrows') {
          p.background(255);
          p.stroke(INK); p.strokeWeight(1);
          for (let y = cell / 2; y < h; y += cell) for (let x = cell / 2; x < w; x += cell) {
            const a = p.noise(x * params.scale, y * params.scale, z) * Math.PI * params.turn;
            p.push(); p.translate(x, y); p.rotate(a); p.line(-6, 0, 7, 0); p.line(7, 0, 4, -2); p.line(7, 0, 4, 2); p.pop();
          }
          return;
        }
        if (clearFlag) { p.background(255); clearFlag = false; }
        p.noStroke(); p.fill(255, 255, 255, 4); p.rect(0, 0, w, h); // slow fade
        p.strokeWeight(1);
        const pressed = p.mouseIsPressed && p.mouseX > 0 && p.mouseX < w && p.mouseY > 0 && p.mouseY < h;
        for (let i = 0; i < parts.length; i++) {
          const q = parts[i];
          const a = p.noise(q.x * params.scale, q.y * params.scale, z) * Math.PI * params.turn;
          q.vx += Math.cos(a) * 0.35; q.vy += Math.sin(a) * 0.35;
          if (pressed) { const dx = q.x - p.mouseX, dy = q.y - p.mouseY, d2 = dx * dx + dy * dy; if (d2 < 90 * 90) { const d = Math.sqrt(d2) + 0.01; q.vx += dx / d * 3; q.vy += dy / d * 3; } }
          const sp = Math.hypot(q.vx, q.vy); if (sp > 2.2) { q.vx = q.vx / sp * 2.2; q.vy = q.vy / sp * 2.2; }
          q.px = q.x; q.py = q.y; q.x += q.vx; q.y += q.vy;
          let wrapped = false;
          if (q.x < 0) { q.x = w; wrapped = true; } if (q.x > w) { q.x = 0; wrapped = true; }
          if (q.y < 0) { q.y = h; wrapped = true; } if (q.y > h) { q.y = 0; wrapped = true; }
          if (!wrapped) {
            p.stroke(cols[i % 3]); p.line(q.px, q.py, q.x, q.y);
          }
        }
        p.noStroke(); p.fill(MUTED); p.textSize(10); p.textFont('JetBrains Mono'); p.text('press the mouse to push', 8, h - 8);
      };
    };
  };

  // ================= noise blob =================
  demos.noiseblob = function (host) {
    const w = W(host, 720), h = 340;
    const params = ui(host, [
      { type: 'range', key: 'amount', label: 'wobble amount', min: 0, max: 120, step: 1, value: 40, fmt: v => v + 'px' },
      { type: 'range', key: 'detail', label: 'detail (frequency)', min: 0.2, max: 6, step: 0.1, value: 1.2, fmt: v => v.toFixed(1) },
      { type: 'range', key: 'speed', label: 'speed', min: 0, max: 0.05, step: 0.001, value: 0.01, fmt: v => v.toFixed(3) },
      { type: 'range', key: 'rings', label: 'rings', min: 1, max: 12, step: 1, value: 5 }
    ]);
    return (p) => {
      let t = 0;
      p.setup = () => { p.createCanvas(w, h); };
      p.draw = () => {
        p.background(255); t += params.speed;
        p.translate(w / 2, h / 2);
        const R = Math.min(w, h) * 0.32;
        for (let k = params.rings; k >= 1; k--) {
          const r = R * k / params.rings;
          p.stroke(INK); p.strokeWeight(1.5);
          p.fill(k % 3 === 0 ? RED : k % 3 === 1 ? YEL : BLU);
          p.beginShape();
          for (let a = 0; a < p.TWO_PI; a += 0.05) {
            const nx = Math.cos(a) * params.detail + 10, ny = Math.sin(a) * params.detail + 10;
            const n = p.noise(nx, ny, t + k * 0.3);
            const rr = r + p.map(n, 0, 1, -params.amount, params.amount) * (k / params.rings);
            p.vertex(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          p.endShape(p.CLOSE);
        }
      };
    };
  };

  // ================= CPU vs GPU race =================
  demos.cpugpu = function (host) {
    const w = W(host, 720), h = 240;
    const PW = Math.min(240, Math.floor((w - 40) / 2)), PH = Math.round(PW * 2 / 3);
    let go = 0, cpuDone = 0, gpuDone = false, cpuFrames = 0;
    const params = ui(host, [
      { type: 'range', key: 'ppf', label: 'CPU pixels per frame (1 worker)', min: 10, max: 4000, step: 10, value: 400 },
      { type: 'button', label: '▶ race', onClick: () => { go = 1; cpuDone = 0; gpuDone = false; cpuFrames = 0; } },
      { type: 'readout' }
    ]);
    return (p) => {
      let cpuG, gpuG;
      const colorAt = (x, y) => [x / PW * 255, y / PH * 255, 140];
      const x0 = Math.floor((w - PW * 2 - 40) / 2), x1 = x0 + PW + 40, y0 = 50;
      p.setup = () => {
        p.createCanvas(w, h); p.textFont('JetBrains Mono');
        cpuG = p.createGraphics(PW, PH); cpuG.pixelDensity(1); cpuG.background(235);
        gpuG = p.createGraphics(PW, PH); gpuG.pixelDensity(1); gpuG.background(235);
      };
      p.draw = () => {
        p.background(255);
        if (go === 1) { cpuG.background(235); gpuG.background(235); go = 2; }
        if (go === 2) {
          // GPU side: every pixel gets its own worker, all done in one frame
          if (!gpuDone) { gpuG.loadPixels(); for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const i = (x + y * PW) * 4, c = colorAt(x, y); gpuG.pixels[i] = c[0]; gpuG.pixels[i + 1] = c[1]; gpuG.pixels[i + 2] = c[2]; gpuG.pixels[i + 3] = 255; } gpuG.updatePixels(); gpuDone = true; }
          // CPU side: one worker, N pixels per frame
          if (cpuDone < PW * PH) {
            cpuG.loadPixels();
            const end = Math.min(PW * PH, cpuDone + params.ppf);
            for (let k = cpuDone; k < end; k++) { const x = k % PW, y = Math.floor(k / PW), i = k * 4, c = colorAt(x, y); cpuG.pixels[i] = c[0]; cpuG.pixels[i + 1] = c[1]; cpuG.pixels[i + 2] = c[2]; cpuG.pixels[i + 3] = 255; }
            cpuG.updatePixels(); cpuDone = end; cpuFrames++;
          }
        }
        p.image(cpuG, x0, y0); p.image(gpuG, x1, y0);
        p.noFill(); p.stroke(INK); p.strokeWeight(2); p.rect(x0, y0, PW, PH); p.rect(x1, y0, PW, PH);
        // the worker
        if (go === 2 && cpuDone < PW * PH) { const x = cpuDone % PW, y = Math.floor(cpuDone / PW); p.noStroke(); p.fill(RED); p.circle(x0 + x, y0 + y, 8); }
        p.noStroke(); p.fill(INK); p.textSize(13); p.textAlign(p.LEFT, p.TOP);
        p.text('CPU · one worker, one pixel at a time', x0, 14); p.text('GPU · ' + (PW * PH).toLocaleString() + ' tiny workers, all at once', x1, 14);
        p.fill(MUTED); p.textSize(11);
        p.text('draw loop + pixels[]', x0, 32); p.text('fragment shader', x1, 32);
        p.textAlign(p.LEFT, p.TOP); p.fill(INK);
        p.text(cpuDone.toLocaleString() + ' / ' + (PW * PH).toLocaleString() + ' px  ·  ' + cpuFrames + ' frames', x0, y0 + PH + 8);
        p.text(gpuDone ? (PW * PH).toLocaleString() + ' / ' + (PW * PH).toLocaleString() + ' px  ·  1 frame' : 'press ▶ race', x1, y0 + PH + 8);
        params.__readout.textContent = '(the CPU is deliberately slowed down here; the real point is parallelism)';
      };
    };
  };

  // ---------- mounting / lifecycle ----------
  function mount(host) {
    const name = host.dataset.demo;
    if (!demos[name]) { host.textContent = 'missing demo: ' + name; return; }
    const head = document.createElement('div'); head.className = 'demo-head';
    head.innerHTML = (host.dataset.title || name) + '<span class="tag">interactive · p5.js</span>';
    const canvasWrap = document.createElement('div'); canvasWrap.className = 'demo-canvas';
    host.append(head, canvasWrap);
    const factory = demos[name](host);            // may append a .demo-ui bar
    if (host.dataset.foot) { const f = document.createElement('div'); f.className = 'demo-foot'; f.innerHTML = '<p>' + host.dataset.foot + '</p>'; host.appendChild(f); }
    host._p5 = new p5(factory, canvasWrap);
    host._w = host.clientWidth;
  }
  function remount(h) { if (h._p5) h._p5.remove(); h._p5 = null; h.innerHTML = ''; mount(h); }
  function needsRemount(h) { return h._p5 && Math.abs(h.clientWidth - h._w) > 40 && h.clientWidth > 0; }

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => document.querySelectorAll('section.chapter.active .demo[data-demo]').forEach(h => { if (needsRemount(h)) remount(h); }), 300);
  });

  window.Demos = {
    activate(section) {
      section.querySelectorAll('.demo[data-demo]').forEach(h => { if (!h._p5) mount(h); else if (needsRemount(h)) remount(h); else h._p5.loop(); });
    },
    deactivate(section) {
      section.querySelectorAll('.demo[data-demo]').forEach(h => { if (h._p5) h._p5.noLoop(); });
    }
  };
})();
