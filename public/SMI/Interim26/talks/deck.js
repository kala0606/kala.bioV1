/* Computationally Yours · talks · deck engine
   Clicks or arrow keys move forward; right-click or left arrow move back.
   Transitions borrow the fluid from ujjwalagarwal.com's homepage: the slide
   melts into a red/yellow/blue field and back out to paper. */
(function () {
  var deck = document.querySelector(".deck");
  var slides = [].slice.call(deck.querySelectorAll(".slide"));
  var i = 0, busy = false, started = false;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- chrome ----------
  var chrome = document.createElement("div");
  chrome.className = "chrome";
  chrome.innerHTML = '<span><span class="mark"><i></i><i></i><i></i></span>' + (deck.dataset.title || "") + '</span><span><span class="num"></span><span class="clock"></span></span><i class="prog"></i>';
  deck.appendChild(chrome);
  var numEl = chrome.querySelector(".num"), progEl = chrome.querySelector(".prog"), clockEl = chrome.querySelector(".clock");

  // ---------- fluid (homepage shader, after CODEPRESSED HeaderShader) ----------
  var cv = document.createElement("canvas"); cv.id = "fluid"; deck.appendChild(cv);
  var gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: false }), prog, U = {};
  var FS = "precision highp float;uniform float u_time;uniform vec2 u_resolution;uniform float u_amount;uniform vec2 u_mouse;varying vec2 vUv;" +
    "vec2 random2(vec2 st){vec2 p=vec2(dot(st,vec2(127.1,311.7)),dot(st,vec2(269.5,183.3)));vec2 t=vec2(fract(sin(p.x)*43758.5453),fract(sin(p.y)*43758.5453));return t*t*4.0;}" +
    "float noise(vec2 st){vec2 i=floor(st);vec2 f=fract(st);vec2 u=f*f*(3.0-2.0*f);return mix(mix(dot(random2(i),f),dot(random2(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(random2(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(random2(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);}" +
    "vec2 ripple(vec2 uv,vec2 c,float time){vec2 d=uv-c;float l=length(d);float n=noise(vec2(l*3.0,time*2.5));float w=(n*2.0-1.0)*0.15*exp(-l*1.2);return normalize(d+0.001)*w;}" +
    "vec3 colormap(float x,float s){float t=s*0.3;vec3 blue=vec3(0.14,0.33,0.78);vec3 paper=vec3(0.949,0.933,0.886);" +
    "if(x<0.2*s)return vec3(0.86,0.15,0.12);else if(x<0.35*s)return vec3(0.957,0.761,0.05);else if(x<0.5*s)return blue;else if(x<t)return mix(blue,paper,(x-0.5*s)/max(t-0.5*s,0.001));else return paper;}" +
    "float fbm1(vec2 st){float v=0.0;float a=0.5;vec2 sh=vec2(100.0);mat2 r=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5));v+=a*noise(st);st=r*st*2.0+sh;a*=0.4;v+=a*noise(st);st=r*st*2.0+sh;a*=0.4;v+=a*noise(st);st=r*st*2.0+sh;a*=0.4;v+=a*noise(st);return v;}" +
    "void main(){float aspect=u_resolution.x/u_resolution.y;vec2 uv=vUv*vec2(aspect,1.0);vec2 c=vec2(u_mouse.x*aspect,u_mouse.y);float time=u_time*2.0;vec2 a=uv+ripple(uv,c,time);" +
    "vec2 ss=(a-0.5*vec2(aspect,1.0))/min(aspect,1.0);float wt=u_time/10.0;float ny=u_time*0.4;vec2 ty=vec2(0.0,ny);float ang=noise(vec2(wt*0.15,ny*0.5))*6.28318;mat2 rot=mat2(cos(ang),sin(ang),-sin(ang),cos(ang));ss=rot*ss;float sc=1.2*noise(vec2(wt*0.2,1.5+ny));ss*=sc;ss.x-=wt/5.0;" +
    "vec2 st=ss+ty;vec2 q=vec2(fbm1(st*0.1),fbm1(st+vec2(5.2,1.3)));vec2 r=vec2(fbm1(st*0.1+4.0*q+vec2(1.7-wt/2.0,9.2)),fbm1(st+4.0*q+vec2(8.3-wt/2.0,2.8)));" +
    "vec2 s=vec2(fbm1(st+5.0*r+vec2(21.7-wt/2.0,90.2)),fbm1(st*0.05+5.0*r+vec2(80.3-wt/2.0,20.8)))*0.25;float pat=fbm1(st*0.05+4.0*s);" +
    "vec3 col=vec3(pat)*2.0;col.r-=dot(q,r)*15.0;float p2=fbm1(r*0.15+vec2(wt*0.1,ny*0.2));col=mix(col,vec3(p2,dot(q,r)*15.0,-0.1),0.5);col-=q.y*1.5;col=mix(col,vec3(0.2),(clamp(q.x,-1.0,0.0))*3.0);col=-col+(abs(col)*2.0);" +
    "float lum=dot(col,vec3(0.333));float shade=clamp(lum/2.0,0.0,1.0);if(shade!=shade)shade=0.5;gl_FragColor=vec4(colormap(shade,u_amount),1.0);}";
  var VS = "attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}";
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
  if (gl) {
    var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    if (v && f) {
      prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); gl.useProgram(prog);
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      var pl = gl.getAttribLocation(prog, "position"); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
      ["u_time", "u_resolution", "u_amount", "u_mouse"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    } else gl = null;
  }
  var PEAK = parseFloat(new URLSearchParams(location.search).get("peak")) || 0.78, COVER = parseFloat(new URLSearchParams(location.search).get("cover")) || 0.5;
  var t0 = performance.now() - (60000 + Math.random() * 120000), amount = 0, mouse = [0.5, 0.5], coverMode = false, raf = 0;
  function size() {
    var d = Math.min(window.devicePixelRatio || 1, 1.5), w = deck.clientWidth, h = deck.clientHeight;
    cv.width = Math.round(w * d * 0.6); cv.height = Math.round(h * d * 0.6); // render a little soft, as on the homepage
    if (gl) gl.viewport(0, 0, cv.width, cv.height);
  }
  function paint() {
    if (!gl) return;
    gl.uniform1f(U.u_time, (performance.now() - t0) / 1000 * 0.06 * 10);
    gl.uniform2f(U.u_resolution, cv.width, cv.height);
    gl.uniform1f(U.u_amount, amount);
    gl.uniform2f(U.u_mouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function loop() { paint(); if (coverMode || busy) raf = requestAnimationFrame(loop); else raf = 0; }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  window.addEventListener("resize", function () { size(); paint(); });
  size();

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function tween(ms, fn, done) {
    var s = performance.now();
    (function step(now) { var t = Math.min(1, (now - s) / ms); fn(ease(t)); if (t < 1) requestAnimationFrame(step); else done && done(); })(s);
  }

  // ---------- slides ----------
  function steps(s) { return [].slice.call(s.querySelectorAll(".step")); }
  function setCover() {
    coverMode = !!(gl && slides[i].classList.contains("cover"));
    cv.classList.toggle("cover", coverMode);
    document.body.classList.toggle("oncover", slides[i].classList.contains("cover"));
    if (coverMode) { amount = COVER; cv.style.opacity = 1; kick(); }
    else if (!busy) { cv.style.opacity = 0; }
  }
  function show(n, fromEnd) {
    slides.forEach(function (s, k) { s.classList.toggle("on", k === n); });
    i = n;
    steps(slides[i]).forEach(function (st) { st.classList.toggle("shown", !!fromEnd); });
    numEl.textContent = String(i + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    progEl.style.width = ((i + 1) / slides.length * 100) + "%";
    try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {}
    var demo = slides[i].dataset.demo;
    if (demo && window.deckDemos && window.deckDemos[demo]) window.deckDemos[demo](slides[i]);
    setCover();
  }
  function go(n, fromEnd) {
    if (n < 0 || n >= slides.length || n === i || busy) return;
    if (reduce || !gl) { show(n, fromEnd); return; }
    busy = true; mouse = [0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6];
    var wasCover = coverMode; cv.classList.remove("cover"); coverMode = false; kick();
    var startAmt = wasCover ? COVER : 0;
    var from = wasCover ? COVER : 0.3;
    tween(560, function (t) { amount = from + (PEAK - from) * t; cv.style.opacity = wasCover ? 1 : Math.min(1, t * 2.6); }, function () {
      show(n, fromEnd); coverMode = false; cv.classList.remove("cover");
      var target = slides[n].classList.contains("cover") ? COVER : 0;
      tween(820, function (t) {
        if (target) { amount = PEAK + (target - PEAK) * t; cv.style.opacity = 1; }
        else { amount = PEAK - (PEAK - 0.18) * t; var o = (t - 0.15) / 0.85; cv.style.opacity = o <= 0 ? 1 : Math.max(0, 1 - o * o * (3 - 2 * o)); }
      }, function () { busy = false; setCover(); });
    });
  }
  function next() {
    var hidden = steps(slides[i]).filter(function (s) { return !s.classList.contains("shown"); });
    if (hidden.length) { hidden[0].classList.add("shown"); return; }
    go(i + 1, false);
  }
  function prev() {
    var shown = steps(slides[i]).filter(function (s) { return s.classList.contains("shown"); });
    if (shown.length) { shown[shown.length - 1].classList.remove("shown"); return; }
    go(i - 1, true);
  }

  // ---------- start, fullscreen, input ----------
  var start = document.createElement("div"); start.id = "start";
  start.innerHTML = "<div><b>" + (deck.dataset.title || "Talk") + "</b>Click to start, full screen<small>Click or → next · right-click or ← back · F full screen · B blank · T clock</small></div>";
  document.body.appendChild(start);
  var blank = document.createElement("div"); blank.id = "blank"; document.body.appendChild(blank);
  var t1 = 0;
  function fs() {
    var d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(function () {});
  }
  function begin() { if (started) return; started = true; start.remove(); fs(); t1 = Date.now(); }
  start.addEventListener("click", function (e) { e.stopPropagation(); begin(); });

  document.addEventListener("click", function (e) {
    if (!started || e.target.closest("a, button, input, select")) return;
    if (document.body.classList.contains("blanked")) { document.body.classList.remove("blanked"); return; }
    next();
  });
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); if (started) prev(); });
  var lastWheel = 0;
  document.addEventListener("wheel", function (e) {
    if (!started) return; var now = Date.now(); if (now - lastWheel < 650 || Math.abs(e.deltaY) < 8) return;
    lastWheel = now; e.deltaY > 0 ? next() : prev();
  }, { passive: true });
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if (!started && (k === "Enter" || k === " " || k === "ArrowRight" || k === "PageDown")) { begin(); return; }
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n"].indexOf(k) > -1) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p"].indexOf(k) > -1) { e.preventDefault(); prev(); }
    else if (k === "Home") go(0); else if (k === "End") go(slides.length - 1);
    else if (k === "f" || k === "F") { document.fullscreenElement ? document.exitFullscreen() : fs(); }
    else if (k === "b" || k === "B" || k === "." || k === "w") document.body.classList.toggle("blanked");
    else if (k === "t" || k === "T") document.body.classList.toggle("showclock");
  });
  var tx = null;
  document.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (tx == null || !started) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
  }, { passive: true });
  var idleT; document.addEventListener("mousemove", function () { document.body.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add("idle"); }, 2200); });
  setInterval(function () { if (!t1) return; var s = Math.floor((Date.now() - t1) / 1000); clockEl.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }, 1000);

  var h = parseInt(location.hash.slice(1), 10);
  show(h > 0 && h <= slides.length ? h - 1 : 0, false);
})();
