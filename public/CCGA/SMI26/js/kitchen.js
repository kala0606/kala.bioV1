/* ------------------------------------------------------------------
   Who Cooks the Sketch? · demos for kitchen.html
   Exposes window.Demos with the same activate/deactivate API app.js expects.
   Also wires the "which level do I need?" checker (plain DOM, no p5).
------------------------------------------------------------------ */
(function () {
  const C = {
    paper: '#f4efe6', paper2: '#ece5d8', card: '#fffdf8', ink: '#151515', muted: '#6d6660',
    red: '#d7261e', yellow: '#f0c02e', blue: '#1d4fbd'
  };
  const SANS = 'Space Grotesk';
  const MONO = 'JetBrains Mono';

  // small seeded generator, so a seed always gives the same dish
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Mondrian recipe: split the biggest rectangles, then colour some of them
  function recipe(seed) {
    const R = mulberry32(seed), list = [{ x: 0, y: 0, w: 1, h: 1 }];
    const cuts = 9 + Math.floor(R() * 7);
    for (let i = 0; i < cuts; i++) {
      list.sort((a, b) => b.w * b.h - a.w * a.h);
      const r = list.splice(Math.floor(R() * Math.min(3, list.length)), 1)[0], t = 0.3 + R() * 0.4;
      const vertical = r.w * 1.5 > r.h ? R() < 0.75 : R() < 0.25;
      if (vertical) list.push({ x: r.x, y: r.y, w: r.w * t, h: r.h }, { x: r.x + r.w * t, y: r.y, w: r.w * (1 - t), h: r.h });
      else list.push({ x: r.x, y: r.y, w: r.w, h: r.h * t }, { x: r.x, y: r.y + r.h * t, w: r.w, h: r.h * (1 - t) });
    }
    const pal = [C.card, C.card, C.card, C.paper2, C.red, C.yellow, C.blue];
    list.forEach(r => { r.c = pal[Math.floor(R() * pal.length)]; r.o = R(); });
    return list.sort((a, b) => a.o - b.o);
  }

  function ui(host) {
    const bar = document.createElement('div'); bar.className = 'demo-ui';
    host.appendChild(bar);
    return bar;
  }
  function button(bar, label, onClick) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.addEventListener('click', onClick); bar.appendChild(b); return b;
  }

  const demos = {};

  // ---------- chapter 4: a dish cooked one rectangle at a time ----------
  demos.dish = (host) => {
    const bar = ui(host);
    const readout = document.createElement('span'); readout.className = 'readout';
    let seed = 0x5a126e26, rects = [], shown = 0;
    const cook = (s) => { seed = s >>> 0; rects = recipe(seed); shown = 0; };
    button(bar, 'Cook same seed', () => cook(seed));
    button(bar, 'New seed', () => cook(Math.floor(Math.random() * 4294967296)));
    bar.appendChild(readout);
    cook(seed);

    return (p) => {
      let W, H;
      p.setup = () => {
        W = Math.min(host.clientWidth || 600, 720); H = Math.round(W * 2 / 3);
        p.createCanvas(W, H); p.frameRate(30);
      };
      p.draw = () => {
        if (shown < rects.length && p.frameCount % 4 === 0) shown++;
        const lw = Math.max(3, W / 110);
        p.background(C.paper);
        p.stroke(C.ink); p.strokeWeight(lw);
        for (let i = 0; i < shown; i++) {
          const r = rects[i];
          p.fill(r.c); p.rect(r.x * W, r.y * H, r.w * W, r.h * H);
        }
        p.noFill(); p.strokeWeight(lw * 2); p.rect(0, 0, W, H);
        readout.textContent = 'seed 0x' + seed.toString(16).padStart(8, '0') + ' · ' + shown + ' / ' + rects.length + ' rectangles · cooked by this device';
      };
    };
  };

  // ---------- chapter 5: the restaurant at level 1, 2 and 3 ----------
  const LEVELS = {
    1: {
      address: 'file:///Users/you/sketch.html',
      kitchen: ['Kitchen: closed', 'not needed at level 1'],
      steps: [
        [0.00, 0.32, 'You open sketch.html from your own disk. No server is involved.'],
        [0.32, 0.40, 'p5 arrives from the CDN bakery.'],
        [0.40, 1.01, 'Your browser cooks the sketch, frame after frame.']
      ]
    },
    2: {
      address: 'http://localhost:8000',
      kitchen: ['Takeaway counter', 'hands out files as they are'],
      steps: [
        [0.00, 0.20, 'The browser sends an order ticket: GET /sketch.html'],
        [0.20, 0.42, 'The counter takes the files off the shelf and hands them over. No cooking.'],
        [0.42, 1.01, 'Your browser cooks the sketch. The counter is idle again.']
      ]
    },
    3: {
      address: 'https://class-gallery.example',
      kitchen: ['Kitchen', 'runs code for every order'],
      steps: [
        [0.00, 0.18, 'The browser sends an order: "save my drawing, show me the gallery"'],
        [0.18, 0.45, 'The kitchen cooks: it checks the secret key and fetches from the pantry.'],
        [0.45, 0.62, 'A freshly cooked plate comes back, different for every visitor.'],
        [0.62, 1.01, 'Your browser still cooks the drawing itself.']
      ]
    }
  };

  demos.levels = (host) => {
    const bar = ui(host);
    const group = document.createElement('div'); group.className = 'group';
    bar.appendChild(group);
    const readout = document.createElement('span'); readout.className = 'readout';
    readout.style.marginLeft = '0';
    readout.style.flexBasis = '100%';
    bar.appendChild(readout);
    let level = 1, start = 0, caption = '';
    const btns = [1, 2, 3].map(n => button(group, 'Level ' + n, () => { level = n; start = performance.now(); btns.forEach((b, i) => b.classList.toggle('on', i + 1 === n)); }));
    btns[0].classList.add('on');

    return (p) => {
      const DW = 760, DH = 380, CYCLE = 5200;
      let s = 1;
      p.setup = () => {
        s = Math.min(1, (host.clientWidth || DW) / DW);
        p.createCanvas(DW * s, DH * s);
        start = performance.now();
      };

      const seg = (t, a, b) => (t < a || t > b) ? null : (t - a) / (b - a);
      const ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      const along = (x0, y0, x1, y1, k) => [p.lerp(x0, x1, ease(k)), p.lerp(y0, y1, ease(k))];

      function box(x, y, w, h, fill, alpha) {
        p.push();
        p.drawingContext.globalAlpha = alpha == null ? 1 : alpha;
        p.stroke(C.ink); p.strokeWeight(3); p.fill(fill); p.rect(x, y, w, h);
        p.pop();
      }
      function label(str, x, y, opts) {
        opts = opts || {};
        p.push();
        p.drawingContext.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
        p.noStroke(); p.fill(opts.color || C.ink);
        p.textFont(opts.mono ? MONO : SANS);
        p.textStyle(opts.bold ? p.BOLD : p.NORMAL);
        p.textSize(opts.size || 14); p.textAlign(p.LEFT, p.BASELINE);
        p.text(str, x, y);
        p.pop();
      }
      function tray(x, y) { p.push(); p.stroke(C.ink); p.strokeWeight(2); p.fill(C.yellow); p.rect(x - 14, y - 10, 28, 20, 2); p.line(x - 8, y - 3, x + 8, y - 3); p.line(x - 8, y + 3, x + 4, y + 3); p.pop(); }
      function loaf(x, y) { p.push(); p.stroke(C.ink); p.strokeWeight(2); p.fill('#e3c28c'); p.ellipse(x, y, 30, 16); p.line(x - 6, y - 5, x - 2, y + 4); p.line(x + 2, y - 5, x + 6, y + 4); p.pop(); }
      function ticket(x, y) { p.push(); p.stroke(C.ink); p.strokeWeight(2); p.fill(C.red); p.rect(x - 9, y - 12, 18, 24, 2); p.stroke(C.card); p.line(x - 4, y - 5, x + 4, y - 5); p.line(x - 4, y + 1, x + 4, y + 1); p.pop(); }
      function plate(x, y) { p.push(); p.stroke(C.ink); p.strokeWeight(2); p.fill(C.card); p.ellipse(x, y, 34, 20); p.noStroke(); p.fill(C.red); p.ellipse(x - 4, y, 10, 7); p.fill(C.blue); p.ellipse(x + 6, y - 1, 8, 6); p.pop(); }

      // the plate area on the table, where the sketch gets cooked
      const PLATE = { x: 52, y: 238, w: 206, h: 92 };
      let dish = recipe(1), dishCycle = -1;

      p.draw = () => {
        const L = LEVELS[level];
        const elapsed = performance.now() - start;
        const cycle = Math.floor(elapsed / CYCLE);
        const t = (elapsed % CYCLE) / CYCLE;
        if (cycle !== dishCycle) { dishCycle = cycle; dish = recipe(level * 1000 + cycle); }

        p.push();
        p.scale(s);
        p.background(C.paper2);

        // lanes between table and kitchen
        p.push();
        p.drawingContext.setLineDash([6, 6]);
        p.stroke(level === 1 ? '#c9c0b0' : C.muted); p.strokeWeight(2);
        p.line(282, 205, 478, 205); p.line(282, 300, 478, 300);
        p.pop();
        if (level > 1) {
          label('request', 330, 194, { mono: true, size: 11, color: C.muted });
          label('response', 330, 324, { mono: true, size: 11, color: C.muted });
        }

        // your disk (only matters at level 1)
        const diskOn = level === 1;
        box(30, 30, 190, 72, C.card, diskOn ? 1 : 0.35);
        label('Your disk', 46, 58, { bold: true, size: 17, alpha: diskOn ? 1 : 0.35 });
        label('a drawer at home · file://', 46, 82, { size: 12.5, color: C.muted, alpha: diskOn ? 1 : 0.35 });

        // CDN bakery
        box(290, 30, 190, 72, C.yellow);
        label('Bakery depot', 306, 58, { bold: true, size: 17 });
        label('CDN · p5.min.js', 306, 82, { size: 12.5, mono: true });

        // table
        box(30, 160, 250, 190, C.card);
        label('Your table', 46, 188, { bold: true, size: 18 });
        label('the browser', 150, 188, { size: 12.5, color: C.muted });
        label(L.address, 46, 222, { mono: true, size: 10.5, color: C.blue });
        p.push(); p.stroke(C.ink); p.strokeWeight(2); p.fill(C.paper); p.rect(PLATE.x, PLATE.y, PLATE.w, PLATE.h); p.pop();

        // kitchen
        const kOn = level > 1;
        box(480, 160, 250, 190, C.card, kOn ? 1 : 0.35);
        label(L.kitchen[0], 496, 188, { bold: true, size: 18, alpha: kOn ? 1 : 0.4 });
        label(L.kitchen[1], 496, 210, { size: 12.5, color: C.muted, alpha: kOn ? 1 : 0.4 });
        if (level === 2) {
          // a shelf of ready-packed files
          p.push(); p.stroke(C.ink); p.strokeWeight(2); p.line(500, 262, 710, 262); p.pop();
          [520, 556, 592, 628, 664].forEach((x, i) => { if (!(i === 0 && t > 0.2 && t < 0.42)) tray(x, 250); });
          label('the shelf: your folder', 500, 284, { size: 12, color: C.muted });
        }
        if (level === 3) {
          box(500, 270, 210, 60, C.blue);
          label('Pantry · database', 514, 297, { bold: true, size: 14, color: '#fff' });
          label('gallery, likes, accounts', 514, 318, { size: 11.5, color: '#fff' });
          label('secret key stays here', 580, 243, { mono: true, size: 10.5, color: C.red });
          const fire = seg(t, 0.18, 0.45);
          // stove
          p.push(); p.stroke(C.ink); p.strokeWeight(2); p.fill(C.paper2); p.rect(500, 226, 70, 26); p.pop();
          if (fire !== null) {
            p.push(); p.noStroke(); p.fill(C.red);
            for (let i = 0; i < 3; i++) {
              const fx = 512 + i * 22, fh = 12 + 8 * Math.abs(Math.sin(p.frameCount * 0.3 + i * 1.7));
              p.triangle(fx - 7, 226, fx + 7, 226, fx, 226 - fh);
            }
            p.pop();
          }
        }
        if (level === 1) label('closed', 640, 300, { bold: true, size: 22, color: C.muted, alpha: 0.5 });

        // moving things
        let k;
        if (level === 1) {
          if ((k = seg(t, 0.04, 0.30)) !== null) tray(...along(125, 102, 150, 228, k));
        } else {
          if ((k = seg(t, 0.03, 0.18)) !== null) ticket(...along(282, 205, 478, 205, k));
        }
        if (level === 2 && (k = seg(t, 0.22, 0.40)) !== null) tray(...along(478, 300, 282, 300, k));
        if (level === 3) {
          if ((k = seg(t, 0.20, 0.30)) !== null) ticket(...along(600, 222, 600, 286, k));
          if ((k = seg(t, 0.30, 0.40)) !== null) plate(...along(600, 286, 600, 222, k));
          if ((k = seg(t, 0.45, 0.60)) !== null) plate(...along(478, 300, 282, 300, k));
        }
        if ((k = seg(t, 0.10, 0.36)) !== null) loaf(...along(385, 102, 230, 228, k));

        // cooking at the table: the dish appears rectangle by rectangle
        const cookFrom = level === 3 ? 0.62 : (level === 2 ? 0.42 : 0.40);
        const prog = t < cookFrom ? 0 : Math.min(1, (t - cookFrom) / (0.92 - cookFrom));
        const n = Math.floor(prog * dish.length);
        p.push(); p.stroke(C.ink); p.strokeWeight(1.5);
        for (let i = 0; i < n; i++) {
          const r = dish[i];
          p.fill(r.c); p.rect(PLATE.x + r.x * PLATE.w, PLATE.y + r.y * PLATE.h, r.w * PLATE.w, r.h * PLATE.h);
        }
        p.pop();
        if (n === 0) label('waiting for ingredients…', PLATE.x + 12, PLATE.y + 52, { size: 12, color: C.muted });

        p.pop();

        // caption under the canvas
        const step = L.steps.find(st => t >= st[0] && t < st[1]);
        const next = 'Level ' + level + ' · ' + (step ? step[2] : '');
        if (next !== caption) { caption = next; readout.textContent = caption; }
      };
    };
  };

  // ---------- mounting / lifecycle (same pattern as life.js) ----------
  function mount(host) {
    const name = host.dataset.demo;
    if (!demos[name]) { host.textContent = 'missing demo: ' + name; return; }
    const head = document.createElement('div'); head.className = 'demo-head';
    head.innerHTML = (host.dataset.title || name) + '<span class="tag">interactive · p5.js</span>';
    const canvasWrap = document.createElement('div'); canvasWrap.className = 'demo-canvas';
    host.append(head, canvasWrap);
    const factory = demos[name](host);
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

  // ---------- chapter 6: which level do I need? ----------
  const VERDICTS = {
    1: ['No server', 'Double-click the HTML and it runs.'],
    2: ['Static server', 'Run python3 -m http.server in the folder, or put it on GitHub Pages.'],
    3: ['Backend', "Part of this must run on a machine you control, not in the visitor's browser."]
  };
  const boxes = Array.from(document.querySelectorAll('#checks input'));
  const verdict = document.getElementById('verdict');
  function judge() {
    let top = 1, why = [];
    boxes.forEach(b => {
      if (!b.checked) return;
      const lv = +b.dataset.lv;
      if (lv > top) { top = lv; why = []; }
      if (lv === top && lv > 1) why.push(b.dataset.why);
    });
    verdict.className = 'verdict l' + top;
    document.getElementById('v-n').textContent = 'Level ' + top;
    document.getElementById('v-h').textContent = VERDICTS[top][0];
    document.getElementById('v-p').textContent = VERDICTS[top][1];
    const ul = document.getElementById('v-why');
    ul.innerHTML = '';
    why.forEach(w => { const li = document.createElement('li'); li.textContent = 'because it ' + w; ul.appendChild(li); });
  }
  if (verdict) { boxes.forEach(b => b.addEventListener('change', judge)); judge(); }
})();
