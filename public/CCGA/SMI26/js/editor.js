/* ------------------------------------------------------------------
   Embedded p5.js editor.
   A <div class="sketch"> holds code in <script type="text/plain" class="code">.
   Optional presets: <script type="text/plain" data-preset="Name">.
   data-mode="js" (default) runs the code as a p5 sketch.
   data-mode="glsl" treats the code as a fragment shader and wraps it
   in a full-screen p5 WEBGL sketch with u_resolution / u_time / u_mouse.
------------------------------------------------------------------ */
(function () {
  const P5_URL = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.10/p5.js';
  const registry = new Map();
  let nextId = 1;

  const VERT = [
    'attribute vec3 aPosition;',
    'void main() {',
    '  vec4 p = vec4(aPosition, 1.0);',
    '  p.xy = p.xy * 2.0 - 1.0;',
    '  gl_Position = p;',
    '}'
  ].join('\n');

  function bridge(id, offset) {
    // One line, no newlines (so line-number offsets stay stable).
    return "(function(){var post=function(t,m){try{parent.postMessage({sketch:" + id + ",type:t,msg:String(m)},'*')}catch(e){}};" +
      "window.addEventListener('error',function(e){var l=e.lineno?e.lineno-" + offset + ":0;post('error',(e.message||'Error')+(l>0?' (line '+l+')':''))});" +
      "var fmt=function(a){return Array.prototype.slice.call(a).map(function(v){if(v&&typeof v==='object'){try{return JSON.stringify(v)}catch(e){return String(v)}}return String(v)}).join(' ')};" +
      "var L=console.log.bind(console),E=console.error.bind(console),W=console.warn.bind(console);" +
      "console.log=function(){L.apply(null,arguments);post('log',fmt(arguments))};" +
      "console.error=function(){E.apply(null,arguments);post('error',fmt(arguments))};" +
      "console.warn=function(){W.apply(null,arguments);post('warn',fmt(arguments))};" +
      "})();";
  }

  function glslWrapper(frag) {
    return [
      'const VERT = `' + VERT + '`;',
      'const FRAG = `' + frag.replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`;',
      'let sh;',
      'function setup() {',
      '  createCanvas(400, 320, WEBGL);',
      '  pixelDensity(1);',
      '  noStroke();',
      '  sh = createShader(VERT, FRAG);',
      '}',
      'function draw() {',
      '  shader(sh);',
      '  sh.setUniform("u_resolution", [width, height]);',
      '  sh.setUniform("u_time", millis() / 1000);',
      '  sh.setUniform("u_mouse", [mouseX, height - mouseY]);',
      '  rect(0, 0, width, height);',
      '}'
    ].join('\n');
  }

  function buildSrcdoc(id, userCode, mode) {
    const code = mode === 'glsl' ? glslWrapper(userCode) : userCode;
    const safe = code.replace(/<\/script/gi, '<\\/script');
    const headTemplate = (b) =>
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<style>html,body{margin:0;background:#fff;overflow:hidden}body{display:flex;justify-content:center;align-items:flex-start}canvas{display:block}</style>' +
      '<script src="' + P5_URL + '"><\/script>\n' +
      '<script>' + b + '<\/script>\n' +
      '</head><body>\n<script>\n';
    const offset = (headTemplate('').match(/\n/g) || []).length;
    const head = headTemplate(bridge(id, offset));
    return head + safe + '\n<\/script></body></html>';
  }

  class Sketch {
    constructor(host) {
      this.host = host;
      this.id = nextId++;
      registry.set(this.id, this);
      this.mode = host.dataset.mode || 'js';
      this.height = parseInt(host.dataset.height || '320', 10);
      this.width = parseInt(host.dataset.width || '400', 10);
      this.autorun = host.dataset.autorun !== 'false';
      this.title = host.dataset.title || (this.mode === 'glsl' ? 'Fragment shader' : 'Sketch');
      const codeEl = host.querySelector('script.code');
      this.original = codeEl ? dedent(codeEl.textContent) : '';
      this.presets = Array.from(host.querySelectorAll('script[data-preset]')).map(s => ({
        name: s.dataset.preset, code: dedent(s.textContent)
      }));
      if (!this.original && this.presets.length) this.original = this.presets[0].code;
      this.build();
    }

    build() {
      const h = this.host;
      h.innerHTML = '';
      h.style.setProperty('--h', this.height + 'px');
      h.style.setProperty('--w', this.width + 'px');

      const bar = el('div', 'sk-bar');
      const title = el('div', 'sk-title');
      title.innerHTML = escapeHtml(this.title) + '<span class="mode">' + (this.mode === 'glsl' ? 'GLSL · fragment shader' : 'JavaScript · p5.js') + '</span>';
      bar.appendChild(title);

      if (this.presets.length) {
        const presets = el('div', 'presets');
        this.presetButtons = this.presets.map((p, i) => {
          const b = el('button', i === 0 ? 'on' : '');
          b.textContent = p.name;
          b.addEventListener('click', () => this.loadPreset(i));
          presets.appendChild(b);
          return b;
        });
        bar.appendChild(presets);
      }

      const run = el('button', 'run'); run.textContent = '▶ Run'; run.title = 'Run (Cmd/Ctrl + Enter)';
      const stop = el('button', ''); stop.textContent = '■ Stop';
      const reset = el('button', ''); reset.textContent = 'Reset';
      const copy = el('button', ''); copy.textContent = 'Copy';
      run.addEventListener('click', () => this.run());
      stop.addEventListener('click', () => this.stop());
      reset.addEventListener('click', () => { this.setCode(this.original); this.run(); });
      copy.addEventListener('click', () => {
        navigator.clipboard && navigator.clipboard.writeText(this.getCode()).then(() => {
          copy.textContent = 'Copied ✓'; setTimeout(() => copy.textContent = 'Copy', 1200);
        });
      });
      bar.append(run, stop, reset, copy);

      const body = el('div', 'sk-body');
      const edWrap = el('div', 'sk-editor');
      const ta = document.createElement('textarea');
      ta.value = this.original;
      edWrap.appendChild(ta);
      const prev = el('div', 'sk-preview');
      this.iframe = document.createElement('iframe');
      this.iframe.setAttribute('sandbox', 'allow-scripts');
      this.iframe.setAttribute('title', this.title + ' preview');
      this.console = el('div', 'sk-console');
      this.console.innerHTML = '<div class="hint">console · edit the code, then ▶ Run (or Cmd/Ctrl+Enter)</div>';
      prev.append(this.iframe, this.console);
      body.append(edWrap, prev);
      h.append(bar, body);

      const self = this;
      this.cm = CodeMirror.fromTextArea(ta, {
        mode: this.mode === 'glsl' ? 'x-shader/x-fragment' : 'javascript',
        lineNumbers: true,
        lineWrapping: false,
        indentUnit: 2,
        tabSize: 2,
        viewportMargin: 20,
        extraKeys: {
          'Cmd-Enter': () => self.run(),
          'Ctrl-Enter': () => self.run(),
          'Tab': (cm) => cm.execCommand('indentMore'),
          'Shift-Tab': (cm) => cm.execCommand('indentLess')
        }
      });
    }

    loadPreset(i) {
      this.setCode(this.presets[i].code);
      this.presetButtons.forEach((b, j) => b.classList.toggle('on', i === j));
      this.run();
    }
    getCode() { return this.cm.getValue(); }
    setCode(c) { this.cm.setValue(c); }

    run() {
      this.console.innerHTML = '';
      this.iframe.srcdoc = buildSrcdoc(this.id, this.getCode(), this.mode);
      this.running = true;
    }
    stop() {
      this.iframe.removeAttribute('srcdoc');
      this.iframe.src = 'about:blank';
      this.running = false;
      this.log('hint', 'stopped');
    }
    log(type, msg) {
      const d = el('div', type);
      d.textContent = msg;
      this.console.appendChild(d);
      while (this.console.children.length > 60) this.console.removeChild(this.console.firstChild);
      this.console.scrollTop = this.console.scrollHeight;
    }
    activate() { if (this.autorun && !this.running) this.run(); this.cm.refresh(); }
    deactivate() { if (this.running) { this.iframe.removeAttribute('srcdoc'); this.iframe.src = 'about:blank'; this.running = false; } }
  }

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || typeof d.sketch !== 'number') return;
    const s = registry.get(d.sketch);
    if (s) s.log(d.type, d.msg);
  });

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function dedent(text) {
    const lines = text.replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
    const indents = lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length);
    const min = indents.length ? Math.min(...indents) : 0;
    return lines.map(l => l.slice(min)).join('\n');
  }

  window.Sketches = {
    mount(root) {
      root.querySelectorAll('.sketch').forEach(h => { if (!h._sketch) h._sketch = new Sketch(h); });
    },
    activate(section) {
      this.mount(section);
      section.querySelectorAll('.sketch').forEach(h => h._sketch.activate());
    },
    deactivate(section) {
      section.querySelectorAll('.sketch').forEach(h => h._sketch && h._sketch.deactivate());
    }
  };
})();
