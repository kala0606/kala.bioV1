/* ------------------------------------------------------------------
   Cellular automata demos for life.html (p5 instance mode).
   Exposes window.Demos with the same activate/deactivate API app.js expects.
------------------------------------------------------------------ */
(function () {
  const PAPER = '#f4efe6', INK = '#151515', RED = '#d7261e', YEL = '#f0c02e', BLU = '#1d4fbd', MUTED = '#6d6660';
  const demos = {};

  // ---------- tiny UI helper (same shape as demos.js) ----------
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
        params['__set_' + c.key] = (v) => { params[c.key] = v; btns.forEach((x, i) => x.classList.toggle('on', c.options[i].value === v)); };
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

  // ---------- the engine ----------
  class Life {
    constructor(cols, rows) { this.cols = cols; this.rows = rows; this.cells = new Uint8Array(cols * rows); this.next = new Uint8Array(cols * rows); this.age = new Uint16Array(cols * rows); this.gen = 0; this.wrap = true; this.B = new Set([3]); this.S = new Set([2, 3]); }
    idx(x, y) { return x + y * this.cols; }
    get(x, y) {
      if (this.wrap) { x = (x + this.cols) % this.cols; y = (y + this.rows) % this.rows; }
      else if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return 0;
      return this.cells[x + y * this.cols];
    }
    neighbours(x, y) {
      let n = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (i || j) n += this.get(x + i, y + j); }
      return n;
    }
    fate(x, y) { // 'born' | 'survive' | 'die' | 'dead'
      const n = this.neighbours(x, y), alive = this.cells[this.idx(x, y)];
      if (alive) return this.S.has(n) ? 'survive' : 'die';
      return this.B.has(n) ? 'born' : 'dead';
    }
    step() {
      const { cols, rows, cells, next, age } = this;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const n = this.neighbours(x, y), i = x + y * cols;
        next[i] = cells[i] ? (this.S.has(n) ? 1 : 0) : (this.B.has(n) ? 1 : 0);
      }
      for (let i = 0; i < cells.length; i++) { if (next[i]) age[i] = cells[i] ? age[i] + 1 : 1; else if (cells[i]) age[i] = 0; }
      this.cells.set(next); this.gen++;
    }
    clear() { this.cells.fill(0); this.age.fill(0); this.gen = 0; }
    random(density) { for (let i = 0; i < this.cells.length; i++) this.cells[i] = Math.random() < density ? 1 : 0; this.age.fill(0); this.gen = 0; }
    population() { let n = 0; for (let i = 0; i < this.cells.length; i++) n += this.cells[i]; return n; }
    place(rle, ox, oy) { // put a pattern with its top-left at (ox, oy)
      const pts = parseRLE(rle);
      pts.forEach(([x, y]) => { const X = ox + x, Y = oy + y; if (X >= 0 && Y >= 0 && X < this.cols && Y < this.rows) this.cells[X + Y * this.cols] = 1; });
    }
    placeCentered(rle) { const pts = parseRLE(rle); const w = Math.max(...pts.map(p => p[0])) + 1, h = Math.max(...pts.map(p => p[1])) + 1; this.place(rle, Math.floor((this.cols - w) / 2), Math.floor((this.rows - h) / 2)); }
  }

  // RLE: digits = run length, b = dead, o = alive, $ = next row, ! = end
  function parseRLE(rle) {
    const pts = []; let x = 0, y = 0, run = '';
    for (const ch of rle.replace(/\s+/g, '')) {
      if (ch >= '0' && ch <= '9') { run += ch; continue; }
      const n = run ? parseInt(run, 10) : 1; run = '';
      if (ch === 'b') x += n;
      else if (ch === 'o') { for (let k = 0; k < n; k++) pts.push([x++, y]); }
      else if (ch === '$') { y += n; x = 0; }
      else if (ch === '!') break;
    }
    return pts;
  }

  const PATTERNS = {
    block: { name: 'Block (still life)', rle: '2o$2o!' },
    beehive: { name: 'Beehive (still life)', rle: 'b2o$o2bo$b2o!' },
    loaf: { name: 'Loaf (still life)', rle: 'b2o$o2bo$bobo$2bo!' },
    blinker: { name: 'Blinker (period 2)', rle: '3o!' },
    toad: { name: 'Toad (period 2)', rle: 'b3o$3o!' },
    beacon: { name: 'Beacon (period 2)', rle: '2o$2o$2b2o$2b2o!' },
    pulsar: { name: 'Pulsar (period 3)', rle: '2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!' },
    penta: { name: 'Pentadecathlon (period 15)', rle: '2bo4bo$2ob4ob2o$2bo4bo!' },
    glider: { name: 'Glider (spaceship)', rle: 'bo$2bo$3o!' },
    lwss: { name: 'Lightweight spaceship', rle: 'bo2bo$o$o3bo$4o!' },
    gun: { name: 'Gosper glider gun', rle: '24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!' },
    rpent: { name: 'R-pentomino (methuselah)', rle: 'b2o$2o$bo!' },
    diehard: { name: 'Diehard (dies after 130)', rle: '6bo$2o$bo3b3o!' },
    acorn: { name: 'Acorn (5206 generations)', rle: 'bo$3bo$2o2b3o!' }
  };

  const RULESETS = {
    life: { name: 'Life  B3/S23', B: [3], S: [2, 3] },
    highlife: { name: 'HighLife  B36/S23', B: [3, 6], S: [2, 3] },
    seeds: { name: 'Seeds  B2/S', B: [2], S: [] },
    daynight: { name: 'Day & Night  B3678/S34678', B: [3, 6, 7, 8], S: [3, 4, 6, 7, 8] },
    maze: { name: 'Maze  B3/S12345', B: [3], S: [1, 2, 3, 4, 5] },
    diamoeba: { name: 'Diamoeba  B35678/S5678', B: [3, 5, 6, 7, 8], S: [5, 6, 7, 8] },
    coral: { name: 'Coral  B3/S45678', B: [3], S: [4, 5, 6, 7, 8] },
    anneal: { name: 'Anneal  B4678/S35678', B: [4, 6, 7, 8], S: [3, 5, 6, 7, 8] }
  };

  // draw a Life grid into p at (ox, oy) with cell size cs
  function drawGrid(p, life, ox, oy, cs, opts) {
    opts = opts || {};
    const { cols, rows, cells, age } = life;
    p.noStroke();
    if (opts.trail) {
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = x + y * cols;
        if (cells[i]) { const a = Math.min(age[i], 30) / 30; p.fill(p.lerpColor(p.color(RED), p.color(INK), a)); p.rect(ox + x * cs, oy + y * cs, cs, cs); }
      }
    } else {
      p.fill(opts.color || INK);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (cells[x + y * cols]) p.rect(ox + x * cs, oy + y * cs, cs, cs);
    }
    if (opts.lines && cs >= 6) {
      p.stroke(opts.lineColor || '#e6e0d4'); p.strokeWeight(1);
      for (let x = 0; x <= cols; x++) p.line(ox + x * cs, oy, ox + x * cs, oy + rows * cs);
      for (let y = 0; y <= rows; y++) p.line(ox, oy + y * cs, ox + cols * cs, oy + y * cs);
    }
  }

  // ================= 1D: Wolfram elementary CA =================
  demos.wolfram = function (host) {
    const w = W(host, 720), cs = 4, cols = Math.floor(w / cs), rows = 80, h = rows * cs + 84;
    let rule = 30, cells, history = [], dirty = true;
    const bits = () => Array.from({ length: 8 }, (_, i) => (rule >> (7 - i)) & 1); // index 0 = pattern 111
    const params = ui(host, [
      { type: 'buttons', key: 'preset', label: 'rule', value: 30, options: [30, 90, 110, 184, 54, 73, 150].map(v => ({ label: String(v), value: v })), onChange: v => { rule = v; dirty = true; } },
      { type: 'button', label: 'random rule', onClick: () => { rule = Math.floor(Math.random() * 256); params.__set_preset(-1); dirty = true; } },
      { type: 'buttons', key: 'start', label: 'start from', value: 'one', options: [{ label: 'one cell', value: 'one' }, { label: 'random row', value: 'rand' }], onChange: () => { dirty = true; } },
      { type: 'readout' }
    ]);
    return (p) => {
      const boxW = Math.min(80, Math.floor((w - 20) / 8)), boxX0 = Math.floor((w - boxW * 8) / 2);
      const run = () => {
        cells = new Uint8Array(cols);
        if (params.start === 'one') cells[Math.floor(cols / 2)] = 1; else for (let i = 0; i < cols; i++) cells[i] = Math.random() < 0.5 ? 1 : 0;
        history = [cells.slice()];
        for (let r = 1; r < rows; r++) {
          const nxt = new Uint8Array(cols);
          for (let i = 0; i < cols; i++) {
            const l = cells[(i - 1 + cols) % cols], c = cells[i], rr = cells[(i + 1) % cols];
            const pattern = (l << 2) | (c << 1) | rr;    // 0..7
            nxt[i] = (rule >> pattern) & 1;              // look the answer up in the rule's bits
          }
          cells = nxt; history.push(cells.slice());
        }
        dirty = false;
      };
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); p.noLoop(); run(); p.redraw(); };
      p.draw = () => {
        if (dirty) run();
        p.background(255);
        // the rule table: 8 neighbourhoods, each with its output below
        const b = bits();
        for (let k = 0; k < 8; k++) {
          const pattern = 7 - k, x0 = boxX0 + k * boxW, cw = Math.min(16, Math.floor(boxW / 4.5));
          for (let j = 0; j < 3; j++) {
            const on = (pattern >> (2 - j)) & 1;
            p.stroke(INK); p.strokeWeight(1); p.fill(on ? INK : 255); p.rect(x0 + (boxW - cw * 3) / 2 + j * cw, 10, cw, cw);
          }
          p.fill(b[k] ? RED : 255); p.stroke(RED); p.strokeWeight(2); p.rect(x0 + (boxW - cw) / 2, 10 + cw + 8, cw, cw);
          p.noStroke(); p.fill(MUTED); p.textSize(10); p.textAlign(p.CENTER, p.TOP); p.text(b[k], x0 + boxW / 2, 10 + cw * 2 + 12);
        }
        p.fill(INK); p.textSize(11); p.textAlign(p.LEFT, p.TOP); p.text('rule ' + rule + ' = ' + b.join('') + ' in binary. click an output cell to flip it.', 8, 70);
        // the rows
        p.noStroke(); p.fill(INK);
        const oy = 84;
        for (let r = 0; r < history.length; r++) { const row = history[r]; for (let i = 0; i < cols; i++) if (row[i]) p.rect(i * cs, oy + r * cs, cs, cs); }
        params.__readout.textContent = 'each row is the next generation of the row above · ' + cols + ' cells · ' + rows + ' generations';
      };
      p.mousePressed = () => {
        if (p.mouseY < 10 || p.mouseY > 70 || p.mouseX < boxX0 || p.mouseX > boxX0 + boxW * 8) return;
        const k = Math.floor((p.mouseX - boxX0) / boxW);
        rule ^= 1 << (7 - k); params.__set_preset(-1); dirty = true; p.redraw();
      };
      host._redraw = () => { dirty = true; p.redraw(); };
    };
  };
  // patch: ui onChange handlers above set dirty but the sketch is noLoop; wire redraw
  const wolframOrig = demos.wolfram;
  demos.wolfram = function (host) {
    const f = wolframOrig(host);
    host.querySelectorAll('.demo-ui button').forEach(b => b.addEventListener('click', () => host._redraw && host._redraw()));
    return f;
  };

  // ================= neighbour inspector =================
  demos.inspector = function (host) {
    const w = W(host, 720), cols = 16, rows = 10, cs = Math.floor(Math.min(w / cols, 44)), gw = cs * cols, h = rows * cs + 70;
    const life = new Life(cols, rows); life.wrap = false;
    const seed = () => { life.clear(); life.place(PATTERNS.glider.rle, 1, 1); life.place(PATTERNS.blinker.rle, 11, 2); life.place(PATTERNS.block.rle, 6, 6); life.place(PATTERNS.toad.rle, 11, 7); life.cells[life.idx(3, 7)] = 1; life.cells[life.idx(4, 8)] = 1; life.cells[life.idx(7, 2)] = 1; };
    seed();
    const params = ui(host, [
      { type: 'button', label: '▶ step one generation', primary: true, onClick: () => { life.step(); } },
      { type: 'buttons', key: 'fate', label: 'show', value: 'fate', options: [{ label: 'what happens next', value: 'fate' }, { label: 'just the cells', value: 'plain' }] },
      { type: 'button', label: 'reset', onClick: seed },
      { type: 'button', label: 'clear', onClick: () => life.clear() }
    ]);
    return (p) => {
      const ox = Math.floor((w - gw) / 2);
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      p.draw = () => {
        p.background(255);
        // cells, coloured by fate
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const alive = life.cells[life.idx(x, y)], f = life.fate(x, y);
          p.stroke('#ddd6c8'); p.strokeWeight(1);
          if (params.fate === 'fate') {
            if (f === 'survive') p.fill(INK); else if (f === 'die') p.fill(RED); else if (f === 'born') p.fill(BLU); else p.fill(255);
          } else p.fill(alive ? INK : 255);
          p.rect(ox + x * cs, y * cs, cs, cs);
          if (params.fate === 'fate' && f === 'born') { p.noFill(); p.stroke(BLU); p.strokeWeight(2); p.rect(ox + x * cs + 3, y * cs + 3, cs - 6, cs - 6); }
        }
        // hover: 3x3 neighbourhood
        const mx = Math.floor((p.mouseX - ox) / cs), my = Math.floor(p.mouseY / cs);
        let msg = 'hover a cell to count its neighbours · click to toggle it';
        if (mx >= 0 && mx < cols && my >= 0 && my < rows) {
          p.noFill(); p.stroke(YEL); p.strokeWeight(4); p.rect(ox + (mx - 1) * cs, (my - 1) * cs, cs * 3, cs * 3);
          p.stroke(INK); p.strokeWeight(3); p.rect(ox + mx * cs, my * cs, cs, cs);
          const n = life.neighbours(mx, my), alive = life.cells[life.idx(mx, my)], f = life.fate(mx, my);
          const why = { survive: 'alive with ' + n + ' → survives (2 or 3)', die: 'alive with ' + n + ' → dies (' + (n < 2 ? 'loneliness, fewer than 2' : 'overcrowding, more than 3') + ')', born: 'dead with ' + n + ' → born (exactly 3)', dead: 'dead with ' + n + ' → stays dead' };
          msg = 'cell (' + mx + ', ' + my + ') is ' + (alive ? 'ALIVE' : 'dead') + ' · ' + n + ' live neighbours · ' + why[f];
        }
        p.noStroke(); p.fill(INK); p.textSize(12); p.textAlign(p.LEFT, p.TOP); p.text(msg, 8, rows * cs + 10);
        if (params.fate === 'fate') {
          p.textSize(11); p.fill(MUTED);
          p.text('■ black: survives   ', 8, rows * cs + 32); p.fill(RED); p.text('■ red: about to die', 150, rows * cs + 32); p.fill(BLU); p.text('□ blue: about to be born', 300, rows * cs + 32);
        }
        p.fill(MUTED); p.textSize(11); p.textAlign(p.RIGHT, p.TOP); p.text('generation ' + life.gen, w - 8, rows * cs + 10);
      };
      p.mousePressed = () => {
        const mx = Math.floor((p.mouseX - ox) / cs), my = Math.floor(p.mouseY / cs);
        if (mx >= 0 && mx < cols && my >= 0 && my < rows) { const i = life.idx(mx, my); life.cells[i] = life.cells[i] ? 0 : 1; }
      };
    };
  };

  // ================= the playable Life =================
  demos.play = function (host, preset) {
    const w = W(host, 760), cs = 8, cols = Math.floor(w / cs), rows = 60, gh = rows * cs, h = gh + 60;
    const life = new Life(cols, rows);
    let playing = true, acc = 0, popHist = [];
    const load = (key) => { life.clear(); popHist = []; if (key === 'random') life.random(0.3); else if (key === 'empty') { } else life.placeCentered(PATTERNS[key].rle); };
    load(preset || 'rpent');
    const params = ui(host, [
      { type: 'button', key: 'play', label: '❚❚ pause', primary: true, onClick: (b) => { playing = !playing; b.textContent = playing ? '❚❚ pause' : '▶ play'; } },
      { type: 'button', label: 'step', onClick: () => { life.step(); } },
      { type: 'range', key: 'speed', label: 'generations / second', min: 1, max: 60, step: 1, value: 15 },
      { type: 'select', key: 'pattern', label: 'pattern', value: preset || 'rpent', options: [{ label: 'random soup', value: 'random' }, { label: 'empty (draw your own)', value: 'empty' }].concat(Object.keys(PATTERNS).map(k => ({ label: PATTERNS[k].name, value: k }))), onChange: load },
      { type: 'button', label: '↻ restart', onClick: () => load(params.pattern) },
      { type: 'buttons', key: 'wrap', label: 'edges', value: 'wrap', options: [{ label: 'wrap around', value: 'wrap' }, { label: 'dead wall', value: 'wall' }], onChange: v => { life.wrap = v === 'wrap'; } },
      { type: 'buttons', key: 'trail', label: 'colour', value: 'age', options: [{ label: 'by age', value: 'age' }, { label: 'plain', value: 'plain' }] },
      { type: 'readout' }
    ]);
    return (p) => {
      let drawing = 0;
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      p.draw = () => {
        p.background(255);
        if (playing) { acc += params.speed / 60; while (acc >= 1) { life.step(); acc -= 1; popHist.push(life.population()); if (popHist.length > w - 20) popHist.shift(); } }
        drawGrid(p, life, 0, 0, cs, { trail: params.trail === 'age', lines: false });
        p.stroke('#eee'); p.strokeWeight(1); p.noFill(); p.rect(0.5, 0.5, cols * cs - 1, gh - 1);
        // population graph
        const gy = gh + 12, gH = 36;
        p.stroke('#ddd6c8'); p.line(10, gy + gH, w - 10, gy + gH);
        if (popHist.length > 1) {
          const mx = Math.max(...popHist, 1);
          p.stroke(BLU); p.strokeWeight(1.5); p.noFill(); p.beginShape();
          popHist.forEach((v, i) => p.vertex(10 + i, gy + gH - v / mx * gH)); p.endShape();
        }
        p.noStroke(); p.fill(INK); p.textSize(11); p.textAlign(p.LEFT, p.TOP); p.text('population', 12, gy);
        params.__readout.textContent = 'generation ' + life.gen + ' · population ' + life.population() + ' · ' + cols + '×' + rows + ' cells · draw with the mouse';
      };
      const paint = () => {
        const x = Math.floor(p.mouseX / cs), y = Math.floor(p.mouseY / cs);
        if (x >= 0 && x < cols && y >= 0 && y < rows) life.cells[life.idx(x, y)] = drawing;
      };
      p.mousePressed = () => { const x = Math.floor(p.mouseX / cs), y = Math.floor(p.mouseY / cs); if (x >= 0 && x < cols && y >= 0 && y < rows) { drawing = life.cells[life.idx(x, y)] ? 0 : 1; paint(); } };
      p.mouseDragged = () => { if (p.mouseY < gh) paint(); };
    };
  };

  // ================= the zoo: nine small panels =================
  demos.zoo = function (host) {
    const w = W(host, 720), n = 3, panel = Math.floor((w - 20) / n), cs = Math.max(3, Math.floor((panel - 8) / 26)), side = 26, h = (panel + 18) * n + 10;
    const list = ['block', 'beehive', 'blinker', 'toad', 'pulsar', 'penta', 'glider', 'lwss', 'rpent'];
    const worlds = list.map(k => { const L = new Life(side, side); L.wrap = true; L.placeCentered(PATTERNS[k].rle); return L; });
    let acc = 0;
    const params = ui(host, [
      { type: 'range', key: 'speed', label: 'generations / second', min: 1, max: 20, step: 1, value: 6 },
      { type: 'button', label: '↻ restart all', onClick: () => worlds.forEach((L, i) => { L.clear(); L.placeCentered(PATTERNS[list[i]].rle); }) }
    ]);
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      p.draw = () => {
        p.background(255);
        acc += params.speed / 60; let steps = 0; while (acc >= 1) { steps++; acc -= 1; }
        worlds.forEach((L, i) => {
          for (let s = 0; s < steps; s++) L.step();
          const px = 10 + (i % n) * panel, py = 10 + Math.floor(i / n) * (panel + 18);
          const gpx = px + Math.floor((panel - side * cs) / 2);
          p.noFill(); p.stroke('#ddd6c8'); p.strokeWeight(1); p.rect(gpx, py, side * cs, side * cs);
          drawGrid(p, L, gpx, py, cs, { color: i < 2 ? INK : i < 6 ? BLU : RED });
          p.noStroke(); p.fill(INK); p.textSize(11); p.textAlign(p.CENTER, p.TOP); p.text(PATTERNS[list[i]].name, px + panel / 2, py + side * cs + 4);
        });
      };
    };
  };

  // ================= other rules =================
  demos.rules = function (host) {
    const w = W(host, 760), cs = 6, cols = Math.floor(w / cs), rows = 70, gh = rows * cs, h = gh + 10;
    const life = new Life(cols, rows);
    let playing = true, acc = 0;
    const applyRule = (key) => { const r = RULESETS[key]; life.B = new Set(r.B); life.S = new Set(r.S); syncChecks(); };
    const reseed = () => { life.clear(); if (params.seed === 'soup') life.random(0.35); else if (params.seed === 'dot') { life.placeCentered('o!'); } else { for (let y = Math.floor(rows / 2) - 3; y < Math.floor(rows / 2) + 3; y++) for (let x = Math.floor(cols / 2) - 3; x < Math.floor(cols / 2) + 3; x++) life.cells[life.idx(x, y)] = Math.random() < 0.5 ? 1 : 0; } };
    const checksHtml = (label, id) => '<div style="display:flex;gap:4px;align-items:center;font-family:var(--mono);font-size:.78rem"><b style="width:18px">' + label + '</b>' + Array.from({ length: 9 }, (_, i) => '<label style="display:flex;flex-direction:row;align-items:center;gap:2px;min-width:0"><input type="checkbox" data-' + id + '="' + i + '" style="accent-color:var(--red)">' + i + '</label>').join('') + '</div>';
    const params = ui(host, [
      { type: 'select', key: 'preset', label: 'rule', value: 'life', options: Object.keys(RULESETS).map(k => ({ label: RULESETS[k].name, value: k })), onChange: (k) => { applyRule(k); reseed(); } },
      { type: 'html', key: 'checks', html: checksHtml('B', 'b') + checksHtml('S', 's'), css: 'display:flex;flex-direction:column;gap:3px' },
      { type: 'buttons', key: 'seed', label: 'seed', value: 'soup', options: [{ label: 'random soup', value: 'soup' }, { label: 'small blob', value: 'blob' }, { label: 'single cell', value: 'dot' }], onChange: reseed },
      { type: 'button', label: '↻ reseed', onClick: reseed },
      { type: 'button', key: 'play', label: '❚❚ pause', onClick: (b) => { playing = !playing; b.textContent = playing ? '❚❚ pause' : '▶ play'; } },
      { type: 'range', key: 'speed', label: 'gen / s', min: 1, max: 30, step: 1, value: 12 },
      { type: 'readout' }
    ]);
    const box = params.__html_checks;
    function syncChecks() { box.querySelectorAll('input[data-b]').forEach(c => c.checked = life.B.has(+c.dataset.b)); box.querySelectorAll('input[data-s]').forEach(c => c.checked = life.S.has(+c.dataset.s)); }
    box.addEventListener('change', () => {
      life.B = new Set(Array.from(box.querySelectorAll('input[data-b]:checked')).map(c => +c.dataset.b));
      life.S = new Set(Array.from(box.querySelectorAll('input[data-s]:checked')).map(c => +c.dataset.s));
    });
    applyRule('life'); reseed();
    return (p) => {
      p.setup = () => { p.createCanvas(w, h); p.textFont('JetBrains Mono'); };
      p.draw = () => {
        p.background(255);
        if (playing) { acc += params.speed / 60; while (acc >= 1) { life.step(); acc -= 1; } }
        drawGrid(p, life, 0, 0, cs, { trail: true });
        const B = Array.from(life.B).sort().join(''), S = Array.from(life.S).sort().join('');
        params.__readout.textContent = 'B' + B + '/S' + S + ' · generation ' + life.gen + ' · population ' + life.population();
      };
      p.mouseDragged = () => { const x = Math.floor(p.mouseX / cs), y = Math.floor(p.mouseY / cs); if (x >= 0 && x < cols && y >= 0 && y < rows) life.cells[life.idx(x, y)] = 1; };
      p.mousePressed = p.mouseDragged;
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
  window.LifeEngine = { Life, parseRLE, PATTERNS, RULESETS };
})();
