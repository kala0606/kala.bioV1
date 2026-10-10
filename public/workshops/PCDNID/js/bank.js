// The instrument bank for the PCD NID workshop pages: raga.fm's own tanpura
// loop, koto (twelve notes a minor third apart, pitched to the nearest), and
// tabla strokes. Plain Web Audio, no library. About 1 MB in all.
//
//   await Bank.load('samples/')      // fetch + decode, can start before any tap
//   Bank.wake()                      // on the first tap: create/resume the context
//   Bank.tanpura.start(saMidi) / .stop()
//   Bank.koto(midi, when, dur, vol)  // a plucked note, released at when+dur
//   Bank.tabla('dha', when, vol)
//   Bank.master                      // the gain everything passes through
//   Bank.now()                       // the audio clock
(function (global) {
  'use strict';
  const KOTO = { 50: 'd3', 53: 'f3', 56: 'gs3', 59: 'b3', 62: 'd4', 65: 'f4', 68: 'gs4', 71: 'b4', 74: 'd5', 77: 'f5', 80: 'gs5', 83: 'b5' };
  const TABLA = ['dha', 'dhin', 'tin', 'na', 'tak', 'kat', 'ga', 'tun'];
  const TANPURA = { file: 'tanpura/tanpura-cs2.mp3', saMidi: 61, loopStart: 0.6, loopEnd: 14.8 };
  const buf = {};
  let ac = null, master = null, loaded = false, loading = null;

  function ctx() {
    if (!ac) {
      ac = new (global.AudioContext || global.webkitAudioContext)({ latencyHint: 'interactive' });
      master = ac.createGain(); master.gain.value = 0.9;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
      master.connect(comp).connect(ac.destination);
    }
    return ac;
  }
  async function fetchDecode(url) {
    const r = await fetch(url); const a = await r.arrayBuffer();
    return await new Promise((res, rej) => ctx().decodeAudioData(a, res, rej));
  }
  function load(base, onProgress) {
    if (loading) return loading;
    base = base || '';
    const jobs = [];
    for (const m in KOTO) jobs.push(['k' + m, base + 'koto/' + KOTO[m] + '.mp3']);
    for (const b of TABLA) jobs.push(['t' + b, base + 'tabla/' + b + '.mp3']);
    jobs.push(['tanpura', base + TANPURA.file]);
    let done = 0;
    loading = Promise.all(jobs.map(([key, url]) => fetchDecode(url).then(b => { buf[key] = b; done++; if (onProgress) onProgress(done, jobs.length); }).catch(e => { console.warn('bank: could not load', url, e); done++; if (onProgress) onProgress(done, jobs.length); })))
      .then(() => { loaded = true; return true; });
    return loading;
  }
  function wake() { const c = ctx(); if (c.state !== 'running') c.resume(); return c; }
  function now() { return ctx().currentTime; }

  // koto: nearest sample, pitched by playback rate; a short attack, a release at the end
  function koto(midi, when, dur, vol) {
    if (!buf['k50']) return null;
    const c = ctx(); when = when == null ? c.currentTime : when; dur = dur || 1; vol = vol == null ? 0.8 : vol;
    let best = 62, bd = 99;
    for (const m in KOTO) { const d = Math.abs(midi - m); if (d < bd && buf['k' + m]) { bd = d; best = +m; } }
    const s = c.createBufferSource(); s.buffer = buf['k' + best];
    s.playbackRate.value = Math.pow(2, (midi - best) / 12);
    const g = c.createGain();
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + 0.008);
    g.gain.setValueAtTime(vol, when + Math.max(0.02, dur - 0.12)); g.gain.linearRampToValueAtTime(0, when + dur);
    s.connect(g).connect(master); s.start(when); s.stop(when + dur + 0.05);
    return { stop(t) { const tt = t == null ? c.currentTime : t; g.gain.cancelScheduledValues(tt); g.gain.setValueAtTime(g.gain.value, tt); g.gain.linearRampToValueAtTime(0, tt + 0.15); try { s.stop(tt + 0.2); } catch (e) {} } };
  }
  function tabla(bol, when, vol) {
    const b = buf['t' + bol]; if (!b) return;
    const c = ctx(); when = when == null ? c.currentTime : when;
    const s = c.createBufferSource(); s.buffer = b; const g = c.createGain(); g.gain.value = vol == null ? 0.9 : vol;
    s.connect(g).connect(master); s.start(when);
  }
  // the tanpura: raga.fm's loop, re-pitched to Sa, two passes crossfading so the seam is never heard
  const tanpura = {
    nodes: null, gain: null, timer: null,
    start(saMidi, vol) {
      if (this.nodes || !buf.tanpura) return;
      const c = ctx(); this.gain = c.createGain(); this.gain.gain.value = 0; this.gain.connect(master);
      this.gain.gain.linearRampToValueAtTime(vol == null ? 0.5 : vol, c.currentTime + 0.3);
      const rate = Math.pow(2, (saMidi - TANPURA.saMidi) / 12);
      const s = c.createBufferSource(); s.buffer = buf.tanpura; s.loop = true; s.loopStart = TANPURA.loopStart; s.loopEnd = TANPURA.loopEnd; s.playbackRate.value = rate;
      s.connect(this.gain); s.start(c.currentTime, TANPURA.loopStart);
      this.nodes = [s];
    },
    stop() {
      if (!this.nodes) return;
      const c = ctx(), g = this.gain, ns = this.nodes; this.nodes = null;
      g.gain.setTargetAtTime(0, c.currentTime, 0.25);
      setTimeout(() => ns.forEach(n => { try { n.stop(); } catch (e) {} }), 1200);
    },
    get running() { return !!this.nodes; },
  };
  global.Bank = { load, wake, now, koto, tabla, tanpura, get ctx() { return ctx(); }, get master() { return master || (ctx(), master); }, get loaded() { return loaded; } };
})(window);
