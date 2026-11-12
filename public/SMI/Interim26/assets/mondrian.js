/* Computationally Yours · recursive Mondrian
   A small generative system, used as the handbook's mark.

   Any element with [data-mondrian] gets a composition:
     data-seed    any string; same seed, same composition
     data-depth   how many times the rectangle is divided (1–7)
     data-colors  how many cells take a primary (default 3)
     data-gap     rule thickness in px (default 2)
     data-motion  "grow" (rules slide in on view, then drift), "still"

   The rule: a rectangle is split across its longer side at a ratio drawn
   from a short list of proportions; each half is split again until the
   depth runs out (some branches stop early). A few leaves are painted
   red, yellow or blue. Everything else is paper and black rules. */

(function () {
  var SVGNS = "http://www.w3.org/2000/svg";
  var RATIOS = [0.25, 0.33, 0.38, 0.5, 0.62, 0.67, 0.75];
  var PRIMARIES = ["var(--m-red)", "var(--m-yellow)", "var(--m-blue)"];
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hash(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function rng(seed) {
    var a = hash(String(seed));
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, list) { return list[Math.floor(r() * list.length)]; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // Build the tree once, against the element's aspect ratio.
  function build(r, depth, w, h, level, nodes, leaves) {
    var node = { level: level };
    nodes.push(node);
    var stopEarly = level >= 2 && r() < 0.22;
    if (depth === 0 || stopEarly) {
      node.leaf = true;
      node.area = w * h;
      node.fill = r() < 0.18 ? "var(--paper-2)" : "var(--paper)";
      leaves.push(node);
      return node;
    }
    node.vertical = w / h > 1.15 ? true : w / h < 0.87 ? false : r() < 0.5;
    node.target = pick(r, RATIOS);
    node.ratio = node.target;
    node.p = 1;
    node.delay = level * 220 + r() * 160;
    var aw = node.vertical ? w * node.target : w;
    var ah = node.vertical ? h : h * node.target;
    var bw = node.vertical ? w - aw : w;
    var bh = node.vertical ? h : h - ah;
    node.a = build(r, depth - 1, aw, ah, level + 1, nodes, leaves);
    node.b = build(r, depth - 1, bw, bh, level + 1, nodes, leaves);
    return node;
  }

  function layout(node, x, y, w, h, out) {
    if (node.leaf) { out.push([node, x, y, w, h]); return; }
    var k = node.ratio * node.p;
    if (node.vertical) {
      layout(node.a, x, y, w * k, h, out);
      layout(node.b, x + w * k, y, w * (1 - k), h, out);
    } else {
      layout(node.a, x, y, w, h * k, out);
      layout(node.b, x, y + h * k, w, h * (1 - k), out);
    }
  }

  function Mondrian(el) {
    this.el = el;
    this.seed = el.dataset.seed || "elsewhere";
    this.depth = Math.max(1, Math.min(7, parseInt(el.dataset.depth || "4", 10)));
    this.colors = parseInt(el.dataset.colors || "3", 10);
    this.gap = parseFloat(el.dataset.gap || "2");
    this.motion = reduce ? "still" : (el.dataset.motion || "grow");
    this.svg = document.createElementNS(SVGNS, "svg");
    this.svg.setAttribute("aria-hidden", "true");
    this.svg.setAttribute("focusable", "false");
    this.bg = document.createElementNS(SVGNS, "rect");
    this.bg.setAttribute("fill", "var(--rule-ink)");
    this.svg.appendChild(this.bg);
    el.appendChild(this.svg);
    this.measure();
    this.make();
    this.draw();
    var self = this;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { self.measure(); self.draw(); }).observe(el);
    }
    if (this.motion === "grow") this.watch();
  }

  Mondrian.prototype.measure = function () {
    var b = this.el.getBoundingClientRect();
    this.W = Math.max(1, b.width);
    this.H = Math.max(1, b.height);
    this.svg.setAttribute("viewBox", "0 0 " + this.W + " " + this.H);
    this.svg.setAttribute("width", this.W);
    this.svg.setAttribute("height", this.H);
    this.bg.setAttribute("width", this.W);
    this.bg.setAttribute("height", this.H);
  };

  Mondrian.prototype.make = function () {
    var r = rng(this.seed);
    this.nodes = []; this.leaves = [];
    this.root = build(r, this.depth, this.W, this.H, 0, this.nodes, this.leaves);
    this.splits = this.nodes.filter(function (n) { return !n.leaf; });
    // Paint a few leaves with primaries. Colour goes to the smaller half of
    // the cells, so it reads as accent, not field (shallow pieces use all).
    var pool = this.leaves.slice().sort(function (a, b) { return a.area - b.area; });
    if (pool.length > 4) pool = pool.slice(0, Math.ceil(pool.length / 2));
    for (var i = 0; i < Math.min(this.colors, pool.length - 1); i++) {
      var j = Math.floor(r() * pool.length);
      pool[j].fill = PRIMARIES[i % 3];
      pool.splice(j, 1);
    }
    this.cells = [];
    for (var k = 0; k < this.leaves.length; k++) {
      var c = document.createElementNS(SVGNS, "rect");
      c.setAttribute("fill", this.leaves[k].fill);
      this.leaves[k].el = c;
      this.svg.appendChild(c);
    }
    this.r = r;
  };

  Mondrian.prototype.draw = function () {
    var g = this.gap, out = [];
    layout(this.root, g / 2, g / 2, this.W - g, this.H - g, out);
    for (var i = 0; i < out.length; i++) {
      var o = out[i], c = o[0].el;
      var w = Math.max(0, o[3] - g), h = Math.max(0, o[4] - g);
      c.setAttribute("x", (o[1] + g / 2).toFixed(2));
      c.setAttribute("y", (o[2] + g / 2).toFixed(2));
      c.setAttribute("width", w.toFixed(2));
      c.setAttribute("height", h.toFixed(2));
    }
  };

  // Rules slide in level by level the first time the piece is seen,
  // then one split at a time drifts to a new proportion.
  Mondrian.prototype.watch = function () {
    var self = this;
    this.splits.forEach(function (n) { n.p = 0; });
    this.draw();
    var started = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        self.visible = e.isIntersecting;
        if (e.isIntersecting && !started) { started = true; self.grow(); }
      });
    }, { threshold: 0.2 });
    io.observe(this.el);
  };

  Mondrian.prototype.grow = function () {
    var self = this, t0 = performance.now(), dur = 900;
    var last = Math.max.apply(null, this.splits.map(function (n) { return n.delay; })) + dur;
    function frame(now) {
      var t = now - t0;
      self.splits.forEach(function (n) { n.p = ease(Math.min(1, Math.max(0, (t - n.delay) / dur))); });
      self.draw();
      if (t < last) requestAnimationFrame(frame);
      else self.breathe();
    }
    requestAnimationFrame(frame);
  };

  Mondrian.prototype.breathe = function () {
    var self = this;
    if (!this.splits.length) return;
    function next() {
      setTimeout(function () {
        if (!self.visible || document.hidden) return next();
        var n = self.splits[Math.floor(Math.random() * self.splits.length)];
        var from = n.ratio, to = pick(Math.random, RATIOS);
        if (to === from) return next();
        var t0 = performance.now(), dur = 2600;
        (function frame(now) {
          var t = Math.min(1, (now - t0) / dur);
          n.ratio = from + (to - from) * ease(t);
          self.draw();
          if (t < 1) requestAnimationFrame(frame); else next();
        })(t0);
      }, 3800 + Math.random() * 3600);
    }
    next();
  };

  function init() {
    document.querySelectorAll("[data-mondrian]").forEach(function (el) {
      if (!el.__mondrian) el.__mondrian = new Mondrian(el);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
