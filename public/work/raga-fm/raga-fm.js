// ============================================================================
// raga.fm — Art Blocks Engine Flex edition
// Single-file, deterministic generative work.
// AB Dependency Registry: p5@1.9.0, Tone.js
// External Flex Asset (IPFS dir): Hindi font + instrument samples
// ============================================================================

// ---------- PRNG (sfc32-style, from Art Blocks recommended template) -------
class Random {
  constructor() {
    const hex = tokenData.hash.slice(2);
    this._state = [
      parseInt(hex.slice(0, 8), 16),
      parseInt(hex.slice(8, 16), 16),
      parseInt(hex.slice(16, 24), 16),
      parseInt(hex.slice(24, 32), 16),
    ];
  }
  _next() {
    let [a, b, c, d] = this._state;
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    this._state = [a, b, c, d];
    return (t >>> 0) / 4294967296;
  }
  dec() { return this._next(); }
  num(a, b) { return a + this._next() * (b - a); }
  int(a, b) { return Math.floor(a + this._next() * (b - a + 1)); }
  bool(p) { return this._next() < p; }
  choice(arr) { return arr[Math.floor(this._next() * arr.length)]; }
  weighted(opts, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = this._next() * total;
    for (let i = 0; i < opts.length; i++) {
      r -= weights[i];
      if (r < 0) return opts[i];
    }
    return opts[opts.length - 1];
  }
}

// ---------- Embedded raga data (extracted from ragadata.json) --------------
// Each entry: { name, aroha, avroha, pakad, vadi, samvadi, mood, time, palette }
// Palette: { primary, secondary, accent, background, text }
const RAGAS = [
  // ---- 04:00-06:00 AM ----
  { name: "Bhairav", aroha: "S r G M P d N S'", avroha: "S' N d P M G r S", pakad: "M d P, G M r S", vadi: "d", samvadi: "r", mood: "Spiritual Awakening", time: "04:00-06:00 AM", palette: { primary:"#283618", secondary:"#606C38", accent:"#B6AD90", background:"#333D29", text:"#FEFAE0" } },
  { name: "Ahir Bhairav", aroha: "S r G M P D n S'", avroha: "S' n D P M G r S", pakad: "G M r S, D n S r", vadi: "M", samvadi: "S", mood: "Spiritual Awakening", time: "04:00-06:00 AM", palette: { primary:"#283618", secondary:"#606C38", accent:"#B6AD90", background:"#333D29", text:"#FEFAE0" } },
  { name: "Ramkali", aroha: "S r G M P d N S'", avroha: "S' N d P M G r S", pakad: "d P M G r S, P d N S'", vadi: "P", samvadi: "S", mood: "Spiritual Awakening", time: "04:00-06:00 AM", palette: { primary:"#283618", secondary:"#606C38", accent:"#B6AD90", background:"#333D29", text:"#FEFAE0" } },
  { name: "Lalit", aroha: "N r G M' d N S'", avroha: "S' N d M' G r S", pakad: "d M' G r S, N r G M'", vadi: "M'", samvadi: "S", mood: "Gentle Start", time: "04:00-06:00 AM", palette: { primary:"#1E3A8A", secondary:"#3B82F6", accent:"#FFC8DD", background:"#CDDBDB", text:"#001427" } },
  { name: "Bhatiyaar", aroha: "r G P D S'", avroha: "S' N D P M G r S", pakad: "D P G M D r S", vadi: "G", samvadi: "D", mood: "Gentle Start", time: "04:00-06:00 AM", palette: { primary:"#1E3A8A", secondary:"#3B82F6", accent:"#FFC8DD", background:"#CDDBDB", text:"#001427" } },

  // ---- 06:00-10:00 AM ----
  { name: "Todi", aroha: "S r g M' d N S'", avroha: "S' N d M' g r S", pakad: "d N S' r' N d M' g r S", vadi: "d", samvadi: "r", mood: "Devotional & Uplifting", time: "06:00-10:00 AM", palette: { primary:"#8D0801", secondary:"#BF0603", accent:"#F4D58D", background:"#001427", text:"#FFF8DC" } },
  { name: "Bilawal", aroha: "S R G M P D N S'", avroha: "S' N D P M G R S", pakad: "G R S N D P, G M R S", vadi: "D", samvadi: "G", mood: "Devotional & Uplifting", time: "06:00-10:00 AM", palette: { primary:"#8D0801", secondary:"#BF0603", accent:"#F4D58D", background:"#001427", text:"#FFF8DC" } },
  { name: "Deshkar", aroha: "S R G P D S'", avroha: "S' D P G R S", pakad: "G P D S', D P G R S", vadi: "D", samvadi: "R", mood: "Devotional & Uplifting", time: "06:00-10:00 AM", palette: { primary:"#8D0801", secondary:"#BF0603", accent:"#F4D58D", background:"#001427", text:"#FFF8DC" } },
  { name: "Bhupali", aroha: "S R G P D S'", avroha: "S' D P G R S", pakad: "S R G R S D, S R G", vadi: "G", samvadi: "D", mood: "Energetic & Positive", time: "06:00-10:00 AM", palette: { primary:"#FF9F1C", secondary:"#FFBF69", accent:"#2EC4B6", background:"#CBF3F0", text:"#252422" } },
  { name: "Kalingada", aroha: "S r G M P d N S'", avroha: "S' N d P M G r S", pakad: "G M P d N S', G M r S", vadi: "P", samvadi: "S", mood: "Energetic & Positive", time: "06:00-10:00 AM", palette: { primary:"#FF9F1C", secondary:"#FFBF69", accent:"#2EC4B6", background:"#CBF3F0", text:"#252422" } },
  { name: "Jaunpuri", aroha: "S R M P d N S'", avroha: "S' n d P M G r S", pakad: "S n d P, M G r S", vadi: "d", samvadi: "G", mood: "Focused & Productive", time: "06:00-10:00 AM", palette: { primary:"#003566", secondary:"#001D3D", accent:"#FFC300", background:"#000814", text:"#F8F8FF" } },
  { name: "Asavari", aroha: "S R M P d S'", avroha: "S' n d P M g R S", pakad: "R M P n d P, d M P g R S", vadi: "d", samvadi: "G", mood: "Focused & Productive", time: "06:00-10:00 AM", palette: { primary:"#003566", secondary:"#001D3D", accent:"#FFC300", background:"#000814", text:"#F8F8FF" } },
  { name: "Gunkali", aroha: "S r M P d S'", avroha: "S' d P M r S", pakad: "S r M P, d P M r S", vadi: "d", samvadi: "r", mood: "Refreshing & Calm", time: "06:00-10:00 AM", palette: { primary:"#2D5A27", secondary:"#4A7C59", accent:"#598392", background:"#EFF6E0", text:"#01161E" } },
  { name: "Alhaiya Bilawal", aroha: "S G M P D N S'", avroha: "S' N D P M G R S", pakad: "G M R S, P D N S'", vadi: "D", samvadi: "G", mood: "Refreshing & Calm", time: "06:00-10:00 AM", palette: { primary:"#2D5A27", secondary:"#4A7C59", accent:"#598392", background:"#EFF6E0", text:"#01161E" } },

  // ---- 10:00 AM - 02:00 PM ----
  { name: "Komal Rishabh Asavari", aroha: "S r M P d S'", avroha: "S' n d P M g r S", pakad: "S r M P, d P M g r S", vadi: "d", samvadi: "r", mood: "Reflective & Calm", time: "10:00 AM - 02:00 PM", palette: { primary:"#355070", secondary:"#6D597A", accent:"#B56576", background:"#E56B6F", text:"#EAAC8B" } },
  { name: "Kafi", aroha: "S R g M P D n S'", avroha: "S' n D P M g R S", pakad: "S R g M P, g R S n D", vadi: "M", samvadi: "S", mood: "Reflective & Calm", time: "10:00 AM - 02:00 PM", palette: { primary:"#355070", secondary:"#6D597A", accent:"#B56576", background:"#E56B6F", text:"#EAAC8B" } },
  { name: "Vrindavani Sarang", aroha: "S R M P N S'", avroha: "S' n P M R S", pakad: "N. S R M R S, M P N S'", vadi: "R", samvadi: "P", mood: "Gentle & Soothing", time: "10:00 AM - 02:00 PM", palette: { primary:"#124559", secondary:"#598392", accent:"#EFF6E0", background:"#AEC3B0", text:"#01161E" } },
  { name: "Gaud Sarang", aroha: "S G R M G P M D P N S'", avroha: "S' N D P M' P G R S", pakad: "S G R M G, P R S", vadi: "G", samvadi: "D", mood: "Gentle & Soothing", time: "10:00 AM - 02:00 PM", palette: { primary:"#124559", secondary:"#598392", accent:"#EFF6E0", background:"#AEC3B0", text:"#01161E" } },
  { name: "Shudh Sarang", aroha: "S R M P N S'", avroha: "S' N P M R S", pakad: "N. S R M P, P M R S", vadi: "R", samvadi: "P", mood: "Relaxed & Unwind", time: "10:00 AM - 02:00 PM", palette: { primary:"#FFBF69", secondary:"#FF9F1C", accent:"#CBF3F0", background:"#FFFFFF", text:"#252422" } },
  { name: "Brindavani Sarang", aroha: "N. S R M P N S'", avroha: "S' n P M R S N.", pakad: "n. S R M R P M R S", vadi: "R", samvadi: "P", mood: "Relaxed & Unwind", time: "10:00 AM - 02:00 PM", palette: { primary:"#FFBF69", secondary:"#FF9F1C", accent:"#CBF3F0", background:"#FFFFFF", text:"#252422" } },
  { name: "Multani", aroha: "N. S g M' P N S'", avroha: "S' N d P M' g R S", pakad: "g M' P, N d P, M' g R S", vadi: "P", samvadi: "S", mood: "Contemplative", time: "10:00 AM - 02:00 PM", palette: { primary:"#403D39", secondary:"#252422", accent:"#EB5E28", background:"#CCC5B9", text:"#FFFCF2" } },
  { name: "Madhuvanti", aroha: "N. S G M' P N S'", avroha: "S' N D P M' G S", pakad: "N. S G M', P N D P M' G S", vadi: "P", samvadi: "S", mood: "Contemplative", time: "10:00 AM - 02:00 PM", palette: { primary:"#403D39", secondary:"#252422", accent:"#EB5E28", background:"#CCC5B9", text:"#FFFCF2" } },

  // ---- 02:00 PM - 06:00 PM ----
  { name: "Poorvi", aroha: "S r G M' d N S'", avroha: "S' N d M' G r S", pakad: "M' d N S', M' G r S", vadi: "G", samvadi: "N", mood: "Deep Reflection", time: "02:00 PM - 06:00 PM", palette: { primary:"#355070", secondary:"#6D597A", accent:"#E56B6F", background:"#B56576", text:"#EAAC8B" } },
  { name: "Puriya Dhanashree", aroha: "N. r G M' N D P, M' G M' r S", avroha: "S' N D P M' G M' r S N.", pakad: "M' G r S N., M' N D P", vadi: "G", samvadi: "N", mood: "Deep Reflection", time: "02:00 PM - 06:00 PM", palette: { primary:"#355070", secondary:"#6D597A", accent:"#E56B6F", background:"#B56576", text:"#EAAC8B" } },
  { name: "Shree", aroha: "S r M' P N S'", avroha: "S' N d P M' G r S", pakad: "M' P N S', N d P M' G r S", vadi: "r", samvadi: "P", mood: "Relaxed & Pleasant", time: "02:00 PM - 06:00 PM", palette: { primary:"#4A5D23", secondary:"#6B7C32", accent:"#7F4F24", background:"#B6AD90", text:"#582F0E" } },
  { name: "Marwa", aroha: "N. r G M' D N S'", avroha: "S' N D M' G r S N.", pakad: "G M' D N S', r G M' D M' G r S", vadi: "r", samvadi: "D", mood: "Winding Down", time: "02:00 PM - 06:00 PM", palette: { primary:"#414833", secondary:"#656D4A", accent:"#936639", background:"#333D29", text:"#B6AD90" } },
  { name: "Puriya", aroha: "N. r G M' d N S'", avroha: "S' N d M' G r S N.", pakad: "r G M', d M' G r S N.", vadi: "G", samvadi: "N", mood: "Winding Down", time: "02:00 PM - 06:00 PM", palette: { primary:"#414833", secondary:"#656D4A", accent:"#936639", background:"#333D29", text:"#B6AD90" } },
  { name: "Sohini", aroha: "S G M' D N S'", avroha: "S' N D M' G S", pakad: "G M' D N S', M' G S", vadi: "G", samvadi: "N", mood: "Winding Down", time: "02:00 PM - 06:00 PM", palette: { primary:"#414833", secondary:"#656D4A", accent:"#936639", background:"#333D29", text:"#B6AD90" } },
  { name: "Yaman", aroha: "N. R G M' D N S'", avroha: "S' N D P M' G R S N.", pakad: "N. R G M' D N S', P M' G R S", vadi: "G", samvadi: "N", mood: "Anticipation", time: "02:00 PM - 06:00 PM", palette: { primary:"#1E40AF", secondary:"#F4D58D", accent:"#BF0603", background:"#708D81", text:"#001427" } },

  // ---- 06:00 PM - 10:00 PM ----
  { name: "Yaman Kalyan", aroha: "N. R G M' D N S'", avroha: "S' N D P M' G R S N.", pakad: "N. R G M' D N S', P M' G R S", vadi: "G", samvadi: "N", mood: "Romantic & Peaceful", time: "06:00 PM - 10:00 PM", palette: { primary:"#6B21A8", secondary:"#8B5CF6", accent:"#FFAFCC", background:"#CDB4DB", text:"#F3E8FF" } },
  { name: "Bhimpalasi", aroha: "N. S g M P n S'", avroha: "S' n P M g R S", pakad: "g M P n S', P M g R S", vadi: "M", samvadi: "S", mood: "Romantic & Peaceful", time: "06:00 PM - 10:00 PM", palette: { primary:"#6B21A8", secondary:"#8B5CF6", accent:"#FFAFCC", background:"#CDB4DB", text:"#F3E8FF" } },
  { name: "Poorvi Dhanashree", aroha: "N. r G M' N D P, M' G M' r S", avroha: "S' N D P M' G M' r S N.", pakad: "M' G r S N., M' N D P", vadi: "G", samvadi: "N", mood: "Romantic & Peaceful", time: "06:00 PM - 10:00 PM", palette: { primary:"#6B21A8", secondary:"#8B5CF6", accent:"#FFAFCC", background:"#CDB4DB", text:"#F3E8FF" } },
  { name: "Kedar", aroha: "S M G P M N S'", avroha: "S' N D P M' P D P M G R S", pakad: "S M G P M, M N S'", vadi: "M", samvadi: "S", mood: "Devotional & Contemplative", time: "06:00 PM - 10:00 PM", palette: { primary:"#252422", secondary:"#403D39", accent:"#EB5E28", background:"#CCC5B9", text:"#FFFCF2" } },
  { name: "Khamaj", aroha: "S G M P D N S'", avroha: "S' n D P M G R S", pakad: "G M P D n D P, M G R S", vadi: "G", samvadi: "N", mood: "Devotional & Contemplative", time: "06:00 PM - 10:00 PM", palette: { primary:"#252422", secondary:"#403D39", accent:"#EB5E28", background:"#CCC5B9", text:"#FFFCF2" } },
  { name: "Bageshree", aroha: "N. D. S g M D n S'", avroha: "S' n D M g R S", pakad: "D. n. S g M, M D n D M g R S", vadi: "M", samvadi: "S", mood: "Festive & Celebratory", time: "06:00 PM - 10:00 PM", palette: { primary:"#BA181B", secondary:"#A4161A", accent:"#E5383B", background:"#660708", text:"#F5F3F4" } },
  { name: "Bihag", aroha: "N. S G M P N S'", avroha: "S' N D P M G R S", pakad: "N. S G M P, G M G R S", vadi: "G", samvadi: "N", mood: "Festive & Celebratory", time: "06:00 PM - 10:00 PM", palette: { primary:"#BA181B", secondary:"#A4161A", accent:"#E5383B", background:"#660708", text:"#F5F3F4" } },
  { name: "Desh", aroha: "S R M P N S'", avroha: "S' n D P M G R S", pakad: "R M P N S', M P G R S", vadi: "R", samvadi: "P", mood: "Festive & Celebratory", time: "06:00 PM - 10:00 PM", palette: { primary:"#BA181B", secondary:"#A4161A", accent:"#E5383B", background:"#660708", text:"#F5F3F4" } },
  { name: "Hamsadhwani", aroha: "S R G P N S'", avroha: "S' N P G R S", pakad: "S R G P, G N P G R S", vadi: "R", samvadi: "D", mood: "Calm & Serene", time: "06:00 PM - 10:00 PM", palette: { primary:"#0369A1", secondary:"#0891B2", accent:"#F15BB5", background:"#FEE440", text:"#9B5DE5" } },
  { name: "Tilak Kamod", aroha: "S R G P S', R P S N.", avroha: "S' P M G S R N. S", pakad: "R S N. S P, M G R S", vadi: "P", samvadi: "S", mood: "Calm & Serene", time: "06:00 PM - 10:00 PM", palette: { primary:"#0369A1", secondary:"#0891B2", accent:"#F15BB5", background:"#FEE440", text:"#9B5DE5" } },

  // ---- 10:00 PM - 04:00 AM ----
  { name: "Darbari Kanhra", aroha: "N. S R g M P d n S'", avroha: "S' d n P M P g R S", pakad: "g M P, d n P, M P g R S", vadi: "R", samvadi: "P", mood: "Deep Relaxation", time: "10:00 PM - 04:00 AM", palette: { primary:"#001D3D", secondary:"#003566", accent:"#FFD60A", background:"#000814", text:"#F8F8FF" } },
  { name: "Malkauns", aroha: "N. S g M d N S'", avroha: "S' N d M g S", pakad: "g M d N S', N d M g S", vadi: "M", samvadi: "S", mood: "Deep Relaxation", time: "10:00 PM - 04:00 AM", palette: { primary:"#001D3D", secondary:"#003566", accent:"#FFD60A", background:"#000814", text:"#F8F8FF" } },
  { name: "Shahana Kanhra", aroha: "N. S R g M P n S'", avroha: "S' n d P M g R S", pakad: "P n S' R', g M P g R S", vadi: "P", samvadi: "S", mood: "Deep Relaxation", time: "10:00 PM - 04:00 AM", palette: { primary:"#001D3D", secondary:"#003566", accent:"#FFD60A", background:"#000814", text:"#F8F8FF" } },
  { name: "Bhairavi", aroha: "S r g M P d n S'", avroha: "S' n d P M g r S", pakad: "g M P d n, d P M g r S", vadi: "M", samvadi: "S", mood: "Soothing & Sleep Prep", time: "10:00 PM - 04:00 AM", palette: { primary:"#006466", secondary:"#065A60", accent:"#1B3A4B", background:"#144552", text:"#F8F8FF" } },
  { name: "Sindhura", aroha: "S R M P D n S'", avroha: "S' n D P M R S", pakad: "R M P D n S', R S n D P", vadi: "R", samvadi: "P", mood: "Soothing & Sleep Prep", time: "10:00 PM - 04:00 AM", palette: { primary:"#006466", secondary:"#065A60", accent:"#1B3A4B", background:"#144552", text:"#F8F8FF" } },
  { name: "Adana", aroha: "S R M P n S'", avroha: "S' D n P G M R S", pakad: "S M P n S', D n P M R S", vadi: "S", samvadi: "P", mood: "Meditative", time: "10:00 PM - 04:00 AM", palette: { primary:"#001427", secondary:"#212F45", accent:"#4D194D", background:"#0B525B", text:"#F5F3F4" } },
  { name: "Chandrakauns", aroha: "N. S g M D N S'", avroha: "S' N D M g S N.", pakad: "N. S g M D N, D M g S", vadi: "M", samvadi: "S", mood: "Meditative", time: "10:00 PM - 04:00 AM", palette: { primary:"#001427", secondary:"#212F45", accent:"#4D194D", background:"#0B525B", text:"#F5F3F4" } },
];

// ---------- Sargam → MIDI (port of website's parseSargamToMidi) -------------
const SARGAM_MAP = {
  'S': 0, 'r': 1, 'R': 2, 'g': 3, 'G': 4, 'M': 5, "M'": 6,
  'P': 7, 'd': 8, 'D': 9, 'n': 10, 'N': 11
};

function parseSargamToMidi(sargamString, isAvroha = false) {
  if (!sargamString) return [];
  const notes = sargamString.replace(/,/g, '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  if (notes.length === 0) return [];

  let octave = 4;
  if (notes[0].includes("'")) octave = 5;
  else if (notes[0].includes('.')) octave = 3;

  let lastPitchClass = -1;
  for (const raw of notes) {
    let n = raw, pc = SARGAM_MAP[n];
    if (pc === undefined) {
      n = raw.replace(/[.']/g, '');
      pc = SARGAM_MAP[n];
    }
    if (pc === undefined) continue;
    if (lastPitchClass !== -1) {
      if (isAvroha) { if (pc > lastPitchClass && !raw.includes("'")) octave--; }
      else          { if (pc < lastPitchClass && !raw.includes('.')) octave++; }
    }
    if (raw.includes("'")) octave = 5;
    if (raw.includes('.')) octave = 3;
    out.push(pc + 12 * (octave + 1));
    lastPitchClass = pc;
  }
  return out;
}

// ---------- Shaders (inline; ported from background.vert / background.frag) -
const VERT_SHADER = `
precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
varying vec2 vTexCoord;
void main() {
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

const FRAG_SHADER = `
precision highp float;
varying vec2 vTexCoord;
uniform vec2  iResolution;
uniform float iTime;
uniform float u_amplitude;
uniform vec3  u_color_background;
uniform vec3  u_color_primary;
uniform vec3  u_color_secondary;
uniform vec3  u_color_accent;
// flow controls (set once from token traits)
uniform float u_flow_mode;   // 0=vortex 1=wave 2=drift 3=radial 4=scatter
uniform float u_flow_speed;  // tempo-derived multiplier
uniform float u_flow_scale;  // density-derived UV scale

vec4 colormap(float x) {
  vec3 c0 = u_color_background;
  vec3 c1 = u_color_secondary;
  vec3 c2 = u_color_primary;
  vec3 c3 = u_color_accent;
  x = clamp(x, 0.0, 1.0);
  float boost = u_amplitude * 0.6;
  if (x < 0.25) {
    return vec4(mix(mix(c0,c1,x/0.25), c1, boost*0.3), 1.0);
  } else if (x < 0.5) {
    vec3 b = mix(c1, c2, (x-0.25)/0.25);
    return vec4(mix(b, c1*(1.0+boost), min(1.0,boost*0.4)), 1.0);
  } else if (x < 0.75) {
    vec3 b = mix(c2, c3, (x-0.5)/0.25);
    return vec4(mix(b, mix(b,c1,0.2), boost*0.25), 1.0);
  } else {
    vec3 b = mix(c3, c2, (x-0.75)/0.25);
    return vec4(mix(b, c1, boost*0.5), 1.0);
  }
}

float rand(vec2 n){ return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453); }
float noise(vec2 p){
  vec2 ip=floor(p), u=fract(p);
  u=u*u*(3.0-2.0*u);
  float res=mix(mix(rand(ip),rand(ip+vec2(1,0)),u.x),
                mix(rand(ip+vec2(0,1)),rand(ip+vec2(1,1)),u.x),u.y);
  return res*res;
}
mat2 rotMat(float t){ float a=t*0.3,c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
mat2 dynMat(float t){
  float a=t*2.0+sin(t*0.2)*0.5, c=cos(a), s=sin(a), sc=1.0+sin(t*0.15)*0.1;
  return mat2(c*sc,-s*sc,s*sc,c*sc);
}
float fbm(vec2 p){
  float f=0.0;
  p = rotMat(iTime*0.1)*p;
  mat2 m = dynMat(iTime*0.2);
  f += 0.500*noise(p+iTime);     p=m*p*2.02;
  f += 0.031*noise(p);           p=m*p*2.01;
  f += 0.250*noise(p);           p=m*p*2.03;
  f += 0.125*noise(p);           p=m*p*2.01;
  f += 0.063*noise(p);           p=m*p*2.04;
  f += 0.016*noise(p+sin(iTime));
  return f/0.985;
}
float pattern(vec2 p){ return fbm(p+fbm(p+fbm(p))); }
float getEdges(vec2 uv, float sc){
  float o=1.0/min(iResolution.x,iResolution.y)*2.0;
  float c=pattern(uv*sc), l=pattern((uv+vec2(-o,0))*sc),
        r=pattern((uv+vec2(o,0))*sc), u=pattern((uv+vec2(0,-o))*sc),
        d=pattern((uv+vec2(0,o))*sc);
  return pow(smoothstep(0.05,0.25,length(vec2(r-l,d-u))),2.0);
}

void main(){
  vec2 uv = vTexCoord;
  vec2 c  = uv - 0.5;
  c.x *= iResolution.x / iResolution.y;

  float t  = iTime * u_flow_speed;
  float sc = 3.0 * u_flow_scale;

  // ---- Flow mode: transforms the UV field before sampling the pattern ----
  if (u_flow_mode < 0.5) {
    // 0 Vortex — slow spiral rotation (original behaviour)
    c = rotMat(t * 0.05) * c;

  } else if (u_flow_mode < 1.5) {
    // 1 Wave curtain — sinusoidal domain warp, horizontal banding
    c.y += sin(c.x * 3.5 * u_flow_scale + t * 0.55) * 0.20;
    c.x += sin(c.y * 2.5 * u_flow_scale + t * 0.40) * 0.13;

  } else if (u_flow_mode < 2.5) {
    // 2 Slow drift — organic translation, minimal rotation; suits slow tempos
    c += vec2(sin(t*0.07 + c.y*1.4)*0.22, cos(t*0.055 + c.x*1.1)*0.17);
    c  = rotMat(t * 0.012) * c;

  } else if (u_flow_mode < 3.5) {
    // 3 Radial pulse — rings expand outward from centre
    float r = length(c);
    float a = atan(c.y, c.x) + t * 0.035;
    float rr = r + sin(r * 9.0 * u_flow_scale - t * 0.85) * 0.065;
    c = vec2(cos(a) * rr, sin(a) * rr);

  } else {
    // 4 Scatter — spatially-varying rotation rate; twist is a smooth sine
    // product so there are no hard seams (unlike a step/checkerboard approach).
    float twist = sin(c.x * 2.3 + t * 0.041) * sin(c.y * 2.3 + t * 0.033);
    c = rotMat(t * 0.045 + twist * 0.42) * c;
    c += vec2(sin(t*0.09 + c.y * 1.2)*0.045, cos(t*0.07 + c.x * 1.1)*0.045);
  }

  uv = c + 0.5;
  float shade = pattern(uv * sc);
  vec3  bg    = colormap(shade).rgb;
  float edges = getEdges(uv, sc);
  gl_FragColor = vec4(mix(bg, vec3(1.0), edges * 0.85), 1.0);
}
`;

// ---------- MIDI pitch class -> sargam syllable -----------------------------
// Rendered with the viewer's system Devanagari font (Noto Sans Devanagari,
// Mangal, Kohinoor Devanagari, Devanagari Sangam MN) - no CDN, no IPFS dep.
// Stored as \uXXXX escapes so the script is pure-ASCII end to end. Raw
// Devanagari bytes get mangled to MacRoman mojibake by the on-chain script
// storage/serving pipeline; ASCII escapes are immune. The JS engine
// reconstructs the real codepoints at runtime.
const UNICODE_SYLLABLES = {
  0:"\u0938\u093e",           // Sa
  1:"\u0930\u0947\u0952",     // re (komal)
  2:"\u0930\u0947",           // Re
  3:"\u0917\u0952",           // ga (komal)
  4:"\u0917",                 // Ga
  5:"\u092e",                 // Ma
  6:"\u092e\u0951",           // Ma (teevra)
  7:"\u092a",                 // Pa
  8:"\u0927\u0952",           // dha (komal)
  9:"\u0927",                 // Dha
  10:"\u0928\u093f\u0952",    // ni (komal)
  11:"\u0928\u093f",          // Ni
};
// ----- Embedded Devanagari font (Noto Sans Devanagari subset, SIL OFL 1.1) ---
// Only the 12 sargam glyphs (~1.7 KB woff2, base64 below). The glyphs travel
// with the artwork so they render identically in every renderer, including Art
// Blocks' headless thumbnail machine, which ships NO Devanagari system font
// (that is why thumbnails showed tofu boxes). Loaded via the FontFace API under
// the unique family "RagaDeva". Font (c) Google, SIL Open Font License 1.1.
const SARGAM_FONT_DATA_URL = "data:font/woff2;base64,d09GMgABAAAAAAaAAA0AAAAADWQAAAYuAAIBiQAAAAAAAAAAAAAAAAAAAAAAAAAAGkAbgngcg0AGYAB0CoooiAcBNgIkA0wLKAAEIAWEAgcgGzoLAB6FcbMTTVTRxBUV7jYeSjxEY/3ezOneV8MtQnSPLiGSCc0sFrH8Q0d0fXjc9n/uNhA3I+GJNQuxkDcVM4YRgR0vEl534K+ItC8xuG+/lk7m5hzTKtoojfoJmUhoe3s6qEooP9MojUfyJuopiFaWuTFoo5fm5zYEig2ALSgSBIWg83UxWATHCs2BAxpBQBdBoXEI6AmmR+/ak1MCp8st44RRbtglBqj/SxCoCxfH9cDm4u3xPZADJhryGstMcwbMALLuVuQIXrhFPhwHFLPLijEXBtebIbUse1mwI+fGm5pGOBLzqd6Cl9GESxSH9D7VxV+dpewQLOgGB5cxfDMJDoB2hnZi7eS2MnvwuJ/F4ODiTcOOEDVkUmBzLCVja+X1K0tOnCjxVIIJoiQgKuvX0bCFl9GES/AQRsBf/NqH77QCeY1u0UAJRh/eXsRDdzI5D6AkmRyTzx9JLwADnng+ysL3AET/eZIIpy1vt/tDw5negK+GgNuUknGwBYdwAfdgxldESQpa7KilqDGMBuEGCAcEBIKwxGkOcCuyGdJRswwbHhZkmnHQzCYkOE0dttxYBGTiBNwRoZaV0Ju10ImNi5RtNUGRHg9JozjxIF0WQ+cpZXvTrdmDHLRYCYdJKVkGCeRDqgIcHN4ozhIiBbJPQjEShqIY4AEW17T3aL5IrhVFKWoY/2uH1q7UgAByOnvBElKQoAHG0Qi4MRo2Y4fGFEVRl8CiKdoSVRKLWIpqBaPxhwR54ef0/Vvveddb3vTCTZd+uwBioR+zvVVgHOIZEL9BG/QDiGeT90ARKf1hzq79ZJTc1lLR5FdYMYzbwnjIHkx9k5WwxBp1n81HzrALTvmWXeQW3r/+urSeMu5jFzy5QUwHOY6wxBYsuXX8RhrZ92qwmHHpJ4MubFlGWUK9hjEu7yAxzX0JxuvRe89yC/1K9rALYHy913g0iGYJJxEholkILrUmVl0CuZKCHozPuRiOk4svXDlixCw9cJeOmc0pR04gyhaeD7h4ExK2yM+hLfsMxlcl118bSKxCZNH+4EmuPm7XrZxnjtkXTtagsHrhXX/ClBe8+3adr+IaBmB1LbK4DTvOKq+UNX+u8mdTHXbhgDemsH8lGSQx4y5pv8q/0L9StBexr9UpxaPwQaLS+ZzcOeO5Lvjef4HdLsV4qopXLlYoO6rdFAe9Xa5NF5PFNr50DK/avOplpizF2Kqu4lSXsU3jhUwhKV9MT4tP0oSfO3nAXRvBd/j6NhYxTePusyzSl7l06FXJqjBNrt8WXYL4G3q3SesUeFrndlExplJHHc8zJrynipu4b0p19q80NDZfzRdF8fx3N5JqBFW67wb8Q/BU/3p3r0eOjut0XY4O+7yVn00Tm8Vz7372LiasXZ2X0T++dUaqXHHRRT4hYmaNWrGp93txn9g6GlFYW5/LL+vrhMdA1v7BxduO++t08okRO3K93Lb0PRdPGHRqmJ3upq60W/3ZE21T01nB0S1jzbujf8amfvfVOtQ+F++LuJDTJrbh0u2l6K3PPPWGiqLeTYujFhSHdA61poXtCfX0PN0jkv1uwekPPAom1rQa9uhnT9UUFoltx9rrckujde5Bx7rbjB95FkyqbGs+qJ8/VesildV2rt2Q/4d8sbG0bfCafuO0qILSkubRrsH86sgod+7aHbe2yPisbpV+6qvsPdMicyvLmr7pNpYYCvmczKui2rCFJQByvmEEARnzT/64t7XeNu6bjKa/AN7NTNwJMN//2eN/z/77XapWKmijAAEfNct6Cu1f7zLO/ouOY1mhLmig/av8r88wyGuEDILcCnkG4hGQbwFqNfxPDxpwb0NdjYAx08gMkCIguvFBt1XtdWtaAl4DJYBQ2xFAsfEggJbljQBGVHgHSCijavNS4TEsVZ9+Ew3q0KbdMJ5ASyCAteQotITM02dYn7WAunGfTi2ayuLJRgxr12fQEJ5aTvqw/iOdY4QK1aaDarkRjTSa9OkRqlfqdlr16TVsSKhmLcYx6GXQxmDX2AD9VIxnmiZLoy4v0qINqPtYuUBDuwypE0uUnyuKlWfMg+cJQmBkbJiIL5llWq4LdZzlGN6qkbckkbaIqG4iAAA=";
const SARGAM_FONT_STACK =
  '"RagaDeva", "Noto Sans Devanagari", "Kohinoor Devanagari", ' +
  '"Devanagari Sangam MN", "Mangal", system-ui, sans-serif';
let sargamFontReady = false;
function injectSargamFont() {
  // Safety net: never block the overlay forever if FontFace is unavailable.
  setTimeout(function () { sargamFontReady = true; }, 1500);
  try {
    const ff = new FontFace("RagaDeva", "url(" + SARGAM_FONT_DATA_URL + ") format('woff2')");
    ff.load().then(function (face) {
      document.fonts.add(face);
      sargamFontReady = true;
      if (textCanvas) textCanvas.textFont(SARGAM_FONT_STACK);
    }).catch(function () { sargamFontReady = true; });
  } catch (_) { sargamFontReady = true; }
}

const KOMAL_PCS  = new Set([1, 3, 8, 10]); // komal (flat) notes
const TEEVRA_PCS = new Set([6]);            // teevra Ma (augmented 4th)

// ============================================================================
// Engine Flex: external asset manifest & loader
// ============================================================================
// Positional convention. The user uploads files to IPFS in this order via
// addProjectExternalAssetDependency(projectId, cid, 0 /* IPFS */):
//
// All assets live in a single IPFS directory (deps[0]).
// Paths are relative to that root; same paths work locally because
// serve.py serves from artblocks/ and the local dep has data:"".
// Contents of the IPFS directory to upload:
//   tone.js                           Tone.js v15 minified
//   samples/jRhodes3d-mono/*.flac     8 Rhodes samples
//   samples/Strings1/*.flac           6 Strings samples
//   samples/Cello/*.wav               4 Cello samples
//   samples/TABLA/*.wav               4 Tabla samples
//   samples/drums/*.wav               3 Drum samples
// (No Hindi font — using system Unicode Devanagari instead.)
const ASSET_MANIFEST = {
  tone: "tone.js",
  rhodes: {
    keys:  ["F1","A2","D3","G3","D4","F4","B4","E5"],
    files: [
      "samples/jRhodes3d-mono/A_029__F1_1.flac",
      "samples/jRhodes3d-mono/A_045__A2_1.flac",
      "samples/jRhodes3d-mono/A_050__D3_1.flac",
      "samples/jRhodes3d-mono/A_055__G3_1.flac",
      "samples/jRhodes3d-mono/A_062__D4_1.flac",
      "samples/jRhodes3d-mono/A_065__F4_1.flac",
      "samples/jRhodes3d-mono/A_071__B4_1.flac",
      "samples/jRhodes3d-mono/A_076__E5_1.flac",
    ],
  },
  strings: {
    keys:  ["G3","B3","D4","F#4","A4","C5"],
    files: [
      "samples/Strings1/g3_Pick1.flac",
      "samples/Strings1/b3_Pick1.flac",
      "samples/Strings1/d4_Pick1.flac",
      "samples/Strings1/fs4_Pick1.flac",
      "samples/Strings1/a4_Pick1.flac",
      "samples/Strings1/c5_Pick1.flac",
    ],
  },
  cello: {
    keys:  ["A1","A2","A3","C4"],
    files: [
      "samples/Cello/A1_mp_g.wav",   // capital C — matches disk
      "samples/Cello/A2_mp_g.wav",
      "samples/Cello/A3_mp_g.wav",
      "samples/Cello/C4_mp_g.wav",
    ],
  },
  tabla: {
    keys:  ["Na","Te","Ge","Dha"],
    files: [
      "samples/TABLA/Tabla_Hit_High_1.wav",
      "samples/TABLA/Tabla_Slap_1.wav",
      "samples/TABLA/Tabla_Low_1.wav",
      "samples/TABLA/Tabla_Mid_1.wav",
    ],
  },
  drums: {
    keys:  ["kick","snare","hat"],
    files: [
      "samples/drums/Ghosthack-Kick_01.wav",
      "samples/drums/Ghosthack-Snare_01.wav",
      "samples/drums/Ghosthack-Closed_Hihat_01.wav",
    ],
  },
};

let toneReady = false;        // window.Tone is loaded
let toneEngineReady = false;  // samplers loaded, engine swapped in
let toneSamplers = {};        // rhodes, strings, cello, tabla, drums
let toneFx = {};              // reverb, delay, filter

async function loadExternalAssets() {
  let deps = (window.tokenData && tokenData.externalAssetDependencies) || [];
  if (deps.length === 0) {
    // AB generator may not inject flex deps in all environments (admin preview,
    // generator indexer lag, etc.). Fall back to the production CID directly so
    // the full audio engine always loads regardless of AB infrastructure state.
    deps = [{ dependencyType: 0, cid: "bafybeihvs3kjjnqnom3wohbb3y52zj7kvggutjku5lbuk6yy2sj6f6i25i", data: "" }];
  }

  const root = deps[0];

  // Phase 1: Tone.js — fetch from IPFS dir (tries multiple gateways).
  try { await loadToneLibrary(root); }
  catch (e) { console.warn("raga.fm: Tone.js load failed", e); }

  // Phase 2: samples (only meaningful once Tone is ready)
  if (toneReady) {
    try { await loadSampleBanks(root); }
    catch (e) { console.warn("raga.fm: sample load failed", e); }
  }
}

async function loadToneLibrary(root) {
  const urls = resolveDirUrls(root, ASSET_MANIFEST.tone);
  if (!urls.length) return;
  for (const url of urls) {
    try {
      // 45 s — Tone.js is ~2 MB; a cold gateway can be slow to start streaming.
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) continue;
      const src = await res.text();
      const el  = document.createElement("script");
      el.textContent = src;
      document.head.appendChild(el);
      toneReady = !!(window.Tone && window.Tone.Sampler);
      if (toneReady && root.cid) {
        const cidIdx = url.indexOf(root.cid);
        if (cidIdx !== -1) workingIpfsGateway = url.slice(0, cidIdx);
      }
      return;
    } catch (e) { console.warn("raga.fm: gateway failed", url, e.message); }
  }
  throw new Error("raga.fm: All IPFS gateways failed for Tone.js");
}

// Fetch one audio file from IPFS, returning a blob: URL.
// Blob URLs are same-origin, so Tone.js loads them with zero CORS restrictions
// and makes no further network requests.  We fetch sequentially across gateway
// fallbacks rather than blasting all files in parallel, which avoids the 429
// rate-limit that Pinata's public gateway enforces on burst traffic.
async function fetchAudioBlob(root, filePath) {
  const ext  = filePath.split('.').pop().toLowerCase();
  const mime = { wav:'audio/wav', flac:'audio/flac', mp3:'audio/mpeg', ogg:'audio/ogg' }[ext] || 'audio/wav';
  const urls = resolveDirUrls(root, filePath);
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const buf  = await res.arrayBuffer();
      return URL.createObjectURL(new Blob([buf], { type: mime }));
    } catch (_) {}
  }
  console.warn("raga.fm: could not fetch sample", filePath);
  return null;
}

async function loadSampleBanks(root) {
  const type = Number(root.dependencyType || 0);

  // For local dev (type 2) files are same-origin — pass the path directly,
  // no pre-fetching needed.  For IPFS (type 0/1) we pre-fetch every file and
  // convert it to a blob URL so Tone.js never makes cross-origin audio requests.
  const resolveForSection = async (section) => {
    const acc = {};
    for (let i = 0; i < section.keys.length; i++) {
      const key      = section.keys[i];
      const filePath = section.files[i];
      if (type === 2) {
        acc[key] = (root.data || "") + filePath;
      } else {
        const blobUrl = await fetchAudioBlob(root, filePath);
        if (blobUrl) acc[key] = blobUrl;
      }
    }
    return acc;
  };

  // Load the five instrument banks. Each file is fetched one at a time to stay
  // under gateway rate limits; total time is ~1-2 s on a fast connection.
  const [rhodesUrls, stringsUrls, celloUrls, tablaUrls, drumUrls] = await Promise.all([
    resolveForSection(ASSET_MANIFEST.rhodes),
    resolveForSection(ASSET_MANIFEST.strings),
    resolveForSection(ASSET_MANIFEST.cello),
    resolveForSection(ASSET_MANIFEST.tabla),
    resolveForSection(ASSET_MANIFEST.drums),
  ]);

  if (Object.keys(rhodesUrls).length === 0) {
    console.warn("raga.fm: no samples loaded — check CID/gateway");
    return;
  }

  await buildToneEngine({ rhodesUrls, stringsUrls, celloUrls, tablaUrls, drumUrls });
}

// ----------- Tone.js audio engine (used when samples + Tone are loaded) ----
const TABLA_PATTERNS = {
  TeenTaal: ["Dha","Te","Ge","Te","Na","Te","Na","Te","Dha","Te","Ge","Te","Na","Te","Na","Te"],
  Keherwa:  ["Dha","Ge","Na","Te","Dha","Ge","Na","Te"],
};
let chosenTablaPattern = null;

async function buildToneEngine({ rhodesUrls, stringsUrls, celloUrls, tablaUrls, drumUrls }) {
  const T = window.Tone;

  // FX chain. Reverb's impulse response is async — wait for `.ready`.
  toneFx.reverb = new T.Reverb({ decay: 4.5, wet: 0.4 }).toDestination();
  await toneFx.reverb.ready;
  toneFx.delay  = new T.FeedbackDelay({ delayTime: "8n", feedback: 0.35, wet: 0.25 }).connect(toneFx.reverb);
  toneFx.filter = new T.Filter({ frequency: 2400, type: "lowpass", Q: 0.7 }).connect(toneFx.delay);

  // Every instrument routes via a small helper that splits to (a) the FX bus
  // and (b) a direct dry send. Without the dry send, if any node in the FX
  // chain takes a moment to come online, the instrument is silent.
  const connectInstrument = (sampler, dryGainDb = 0) => {
    const dry = new T.Gain(T.dbToGain(dryGainDb)).toDestination();
    sampler.connect(toneFx.filter);
    sampler.connect(dry);
  };

  // -- Rhodes melody --
  toneSamplers.rhodes = new T.Sampler({ urls: rhodesUrls, release: 4, volume: -5 });
  connectInstrument(toneSamplers.rhodes, -3);

  // -- Strings (pizzicato — used for periodic strums, NOT drone) --
  if (Object.keys(stringsUrls).length > 0) {
    toneSamplers.strings = new T.Sampler({ urls: stringsUrls, release: 4, volume: 0 });
    connectInstrument(toneSamplers.strings, -6);
  }

  // -- Cello (sustained chord pad / drone) --
  if (Object.keys(celloUrls).length > 0) {
    toneSamplers.cello = new T.Sampler({ urls: celloUrls, release: 8, volume: -10 });
    connectInstrument(toneSamplers.cello, -8);
  }

  // -- Tabla (percussion) --
  if (Object.keys(tablaUrls).length > 0) {
    toneSamplers.tabla = new T.Players(tablaUrls, { volume: -5 }).toDestination();
  }

  // -- Drum kit (kept low so it sits under the tabla, not over it) --
  if (Object.keys(drumUrls).length > 0) {
    toneSamplers.drums = new T.Players(drumUrls, { volume: -12 }).toDestination();
  }

  // Choose a tabla pattern. At high tempos TeenTaal (16 beats) gets muddy —
  // bias toward the shorter Keherwa (8 beats) above 110 BPM.
  const teenTaalProb = tempoBpm <= 110 ? 0.65 : Math.max(0.15, 0.65 - (tempoBpm - 110) * 0.012);
  chosenTablaPattern = R.bool(teenTaalProb) ? "TeenTaal" : "Keherwa";

  // Wait for all samples to decode.
  await T.loaded();
  toneEngineReady = true;
  window.__ragaReady = true; // web embed: samples decoded → activate the play button
  // If the user has already gestured and audio is running, kick off the
  // sample-based drone now (otherwise the synth drone will have been used
  // and the cello pad would never start).
  if (audioStarted && audioCtx) {
    try { await T.start(); } catch (_) {}
    startToneDrone();
  }
}

function startToneDrone() {
  // Sustained tanpura-style pad on cello (Strings1 samples are pizzicato —
  // they decay too fast to act as a drone). triggerAttack with no release
  // sustains until the sample naturally ends; cello samples are long enough
  // that we re-trigger periodically via the scheduler to keep it alive.
  if (!toneSamplers.cello) return;
  const now = window.Tone.now();
  // S + P (root + fifth), two octaves apart.
  toneSamplers.cello.triggerAttack("C2", now);
  toneSamplers.cello.triggerAttack("G2", now + 0.08);
  toneSamplers.cello.triggerAttack("C3", now + 0.16);
  toneDroneNextRetrigger = now + 6; // see retriggerToneDrone()
}
let toneDroneNextRetrigger = 0;

function retriggerToneDrone() {
  if (!toneEngineReady || !toneSamplers.cello) return;
  const now = window.Tone.now();
  if (now < toneDroneNextRetrigger) return;
  toneSamplers.cello.triggerAttack("C2", now);
  toneSamplers.cello.triggerAttack("G2", now + 0.05);
  toneSamplers.cello.triggerAttack("C3", now + 0.1);
  toneDroneNextRetrigger = now + 6;
}

// Resolve a file URL from the directory-root dep + a relative path.
//   dependencyType 0 = IPFS  → gateway + cid + "/" + filePath
//   dependencyType 1 = ARWEAVE → gateway + cid + "/" + filePath
//   dependencyType 2 = LOCAL PREVIEW → dep.data (base prefix) + filePath
// Returns an ordered list of URLs to try for a given file in the IPFS dir.
// The preferred gateway is tried first; public fallbacks follow so a rate-
// limited or down gateway doesn't break the whole piece.
// Gateway priority: Pinata's public gateway first (always serves Pinata-pinned
// content regardless of DHT propagation), then public fallbacks.
// cloudflare-ipfs.com was shut down in 2024 — never use it.
const IPFS_FALLBACK_GATES = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];
function resolveDirUrls(rootDep, filePath) {
  if (!rootDep || !filePath) return [];
  const type = Number(rootDep.dependencyType);
  if (type === 2) {
    // Local dev: single relative URL from server root.
    return [(rootDep.data || "") + filePath];
  }
  if (!rootDep.cid) return [];
  if (type === 0) {
    const preferred = (tokenData.preferredIPFSGateway || "").replace(/\/?$/, "/");
    const gates = preferred
      ? [preferred, ...IPFS_FALLBACK_GATES.filter(g => g !== preferred)]
      : IPFS_FALLBACK_GATES;
    return gates.map(g => g + rootDep.cid + "/" + filePath);
  }
  if (type === 1) {
    const gw = (tokenData.preferredArweaveGateway || "https://arweave.net/").replace(/\/?$/, "/");
    return [gw + rootDep.cid + "/" + filePath];
  }
  return [];
}
// Convenience: try each URL in order, return first successful response.
// Each attempt is capped at 8 s so a dead/hanging gateway never stalls the chain.
async function fetchWithFallback(urls, responseType = "arrayBuffer") {
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      return responseType === "text" ? res.text() : res.arrayBuffer();
    } catch (_) {}
  }
  throw new Error("All IPFS gateways failed for: " + (urls[0] || "?"));
}
// Legacy single-URL helper kept for non-IPFS callers.
function resolveDir(rootDep, filePath) {
  const urls = resolveDirUrls(rootDep, filePath);
  return urls[0] || null;
}

// ============================================================================
// State
// ============================================================================
let R;                      // PRNG
let chosenRaga;             // selected raga entry
let aaroh = [], avroh = []; // MIDI note arrays
let allNotes = [];          // dedup union for melody pool
let melodyPool = [];        // 3-octave sorted pool for melody stepping
let pitchClasses = [];      // unique pitch classes for the grid
let hasBeats = false;       // beats trait
let tempoBpm = 80;
let densityLabel = "Sparse";

let bgShader;
let textCanvas;             // 2D overlay for Hindi sargam grid
let grid = [];              // 2D array of cells
let noteCells = {};         // pitchClass -> [cells]
let gridCols, cellSize;

let shaderTime = 0;
let currentAmplitude = 0;
let smoothedAmplitude = 0;

// Visual flow — chosen per token, tempo-scaled
let flowMode  = 0;   // 0=vortex 1=wave 2=drift 3=radial 4=scatter
let flowSpeed = 1.0; // derived from tempoBpm
let flowScale = 1.0; // derived from densityLabel

// IPFS gateway confirmed working by loadToneLibrary — reused in loadSampleBanks.
let workingIpfsGateway = "";

// Audio
let audioCtx = null;
let audioStarted = false;
let masterGain, filterNode, delayNode, delayFeedback, delayWet, reverbGain;
let analyser, analyserBuf;
let nextNoteTime = 0;
let scheduleAheadTime = 0.12;
let beatIndex = 0;
let melodyIndex = 0;
let beatStepsPerBar = 16;

// ============================================================================
// Composition / section state — drives the long-form arc.
// ============================================================================
// Each section is a few bars long, at the same fixed tempo, but varies
// which layers are active and how dense the rhythm is. The result feels
// like a real Hindustani performance unfolding: a slow alap with just
// melody and drone, tabla joining sparsely (jor), the full ensemble in
// vilambit/madhya, then drut + jhala for the climax, with rests and solo
// passages in between. Tihai phrases cap most rhythmic sections, landing
// on the sam of whatever comes next.
const SECTION_TEMPLATES = {
  // alap: free-rhythm intro — just melody + drone, no percussion.
  alap:        { barRange: [4, 8],  rhythm: "silent",  melody: "slow",    layers: { strings: false, celloChord: false, tabla: false, drums: false }, canTihai: false },
  // jor: tabla joins, sparse accent hits, no kit yet.
  jor:         { barRange: [4, 8],  rhythm: "accent",  melody: "regular", layers: { strings: true,  celloChord: false, tabla: true,  drums: false }, canTihai: false },
  // vilambit: full ensemble, regular tempo.
  vilambit:    { barRange: [6, 12], rhythm: "regular", melody: "regular", layers: { strings: true,  celloChord: true,  tabla: true,  drums: true  }, canTihai: true  },
  // madhya: full ensemble, more intense.
  madhya:      { barRange: [6, 10], rhythm: "regular", melody: "regular", layers: { strings: true,  celloChord: true,  tabla: true,  drums: true  }, canTihai: true  },
  // drut: pattern doubled in feel, denser melody.
  drut:        { barRange: [4, 8],  rhythm: "double",  melody: "dense",   layers: { strings: false, celloChord: true,  tabla: true,  drums: true  }, canTihai: true  },
  // jhala: rapid pulse, mostly tabla + melody, almost trance-like.
  jhala:       { barRange: [3, 6],  rhythm: "jhala",   melody: "jhala",   layers: { strings: false, celloChord: false, tabla: true,  drums: false }, canTihai: true  },
  // tabla solo
  tabla_solo:  { barRange: [3, 6],  rhythm: "regular", melody: "silent",  layers: { strings: false, celloChord: false, tabla: true,  drums: false }, canTihai: true  },
  // melody solo — alap-like but mid-arc
  melody_solo: { barRange: [3, 6],  rhythm: "silent",  melody: "regular", layers: { strings: false, celloChord: false, tabla: false, drums: false }, canTihai: false },
  // rest: full silence except drone
  rest:        { barRange: [1, 2],  rhythm: "silent",  melody: "silent",  layers: { strings: false, celloChord: false, tabla: false, drums: false }, canTihai: false },
};

// Markov-style transitions for ragas WITH beats.
const TRANSITIONS_WITH_BEATS = {
  alap:        [["jor", 0.6], ["melody_solo", 0.25], ["vilambit", 0.15]],
  jor:         [["vilambit", 0.55], ["madhya", 0.25], ["tabla_solo", 0.2]],
  vilambit:    [["madhya", 0.35], ["drut", 0.15], ["rest", 0.1], ["melody_solo", 0.15], ["tabla_solo", 0.1], ["alap", 0.15]],
  madhya:      [["drut", 0.3], ["vilambit", 0.2], ["rest", 0.1], ["jhala", 0.1], ["tabla_solo", 0.15], ["melody_solo", 0.15]],
  drut:        [["jhala", 0.4], ["madhya", 0.2], ["rest", 0.2], ["tabla_solo", 0.2]],
  jhala:       [["rest", 0.45], ["madhya", 0.3], ["vilambit", 0.25]],
  tabla_solo:  [["vilambit", 0.4], ["madhya", 0.3], ["drut", 0.3]],
  melody_solo: [["vilambit", 0.35], ["alap", 0.25], ["jor", 0.4]],
  rest:        [["madhya", 0.35], ["vilambit", 0.3], ["jor", 0.2], ["alap", 0.15]],
};

// For ragas without beats, walk through only the non-percussive sections.
const TRANSITIONS_NO_BEATS = {
  alap:        [["melody_solo", 0.5], ["rest", 0.2], ["alap", 0.3]],
  melody_solo: [["alap", 0.4], ["rest", 0.3], ["melody_solo", 0.3]],
  rest:        [["alap", 0.5], ["melody_solo", 0.5]],
};

// Tihai phrase: 5 steps × 3 reps = 15 steps, with 1 silent step at the end of
// the bar. The downbeat ("Dha") of the next section's first bar feels like
// it resolves the phrase — the classic tihai/sam landing.
const TIHAI_PHRASE = ["Dha", "Te", "Dha", "Te", "Dha"];

let comp = {
  sectionName: null,
  section: null,
  bar: 0,
  barsTotal: 0,
  inTihai: false,
  count: 0, // total sections elapsed (for diagnostics)
};

// Visual color cache (parsed once)
let cBg = [0,0,0], cPri = [0,0,0], cSec = [0,0,0], cAcc = [0,0,0];

// ============================================================================
// p5 lifecycle
// ============================================================================
function setup() {
  R = new Random();

  // -- choose raga deterministically --
  chosenRaga = R.choice(RAGAS);
  aaroh = parseSargamToMidi(chosenRaga.aroha, false);
  avroh = parseSargamToMidi(chosenRaga.avroha, true);
  allNotes = [...new Set([...aaroh, ...avroh])].sort((a,b)=>a-b);
  pitchClasses = [...new Set(allNotes.map(n => n % 12))];

  // Build a 3-octave melody pool: one octave below + native + one octave above.
  // Walking this sorted array stepwise gives natural melodic motion spanning ~3
  // octaves (roughly C2–C7) while staying strictly inside the raga's scale.
  {
    const lo = allNotes.map(n => n - 12).filter(n => n >= 36);  // ≥ C2
    const hi = allNotes.map(n => n + 12).filter(n => n <= 96);  // ≤ C7
    melodyPool = [...new Set([...lo, ...allNotes, ...hi])].sort((a,b) => a-b);
    // Start index in the middle so the melody can immediately move both ways.
    melodyIndex = Math.floor(melodyPool.length / 2);
  }

  // -- beats / tempo / density traits --
  hasBeats = R.bool(0.55);
  tempoBpm = hasBeats ? R.int(72, 150) : R.int(50, 76);
  const density = R.weighted(["Sparse","Flowing","Dense"], [0.35, 0.45, 0.2]);
  densityLabel = density;

  // -- flow mode (visual trait) --
  const FLOW_NAMES = ["Vortex", "Wave", "Drift", "Radial", "Scatter"];
  flowMode  = R.int(0, 4);
  flowSpeed = tempoBpm / 90.0;                  // 90 BPM = 1.0×
  flowScale = densityLabel === "Sparse"  ? 0.72
            : densityLabel === "Dense"   ? 1.38
            :                             1.00;

  // -- expose to Art Blocks --
  window.$features = {
    Raga:           chosenRaga.name,
    Mood:           chosenRaga.mood,
    "Time of Day":  chosenRaga.time,
    Beats:          hasBeats ? "Yes" : "No",
    Tempo:          tempoBpm,          // plain number, matches features JSON schema
    Density:        density,
    "Visual Flow":  FLOW_NAMES[flowMode],
  };

  // -- generate palette from mood (with small per-token variation) --
  const palette = generateMoodPalette(chosenRaga.mood, R);
  cBg  = palette.bg;
  cPri = palette.pri;
  cSec = palette.sec;
  cAcc = palette.acc;

  pixelDensity(1);
  createCanvas(windowWidth, windowHeight, WEBGL);
  bgShader = createShader(VERT_SHADER, FRAG_SHADER);

  // 2D overlay for the Hindi sargam grid (drawn over the shader each frame).
  // The sargam glyphs are stored as \uXXXX escapes (see UNICODE_SYLLABLES), so
  // the script is pure-ASCII and survives on-chain storage without mojibake.
  // Rendering uses whatever Devanagari font the viewer's OS provides — no CDN,
  // no IPFS, no CSP exposure.
  textCanvas = createGraphics(windowWidth, windowHeight);
  textCanvas.textAlign(CENTER, CENTER);
  textCanvas.textFont(SARGAM_FONT_STACK);
  injectSargamFont();   // load the embedded Devanagari subset (FontFace API)

  buildGrid();

  // Engine Flex: load Tone.js + samples from the IPFS directory.
  loadExternalAssets();

  // Audio needs a user gesture; wait for one.
  const start = () => { if (!audioStarted) startAudio(); };
  window.addEventListener('click', start, { once: true });
  window.addEventListener('touchstart', start, { once: true });
  window.addEventListener('keydown', start, { once: true });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (textCanvas) {
    textCanvas.resizeCanvas(windowWidth, windowHeight);
    buildGrid();
  }
}

// Build the cell grid that holds the Hindi syllables — ported from
// the website's createGrid() in visuals.js but seeded by the PRNG so
// the layout stays deterministic per token.
function buildGrid() {
  grid = [];
  noteCells = {};
  if (pitchClasses.length === 0) return;

  const visualNotes = pitchClasses.map(pc => 60 + pc);
  const textScale = 0.78;
  const gridW = width * textScale;
  const gridH = height * textScale;
  const xOff0 = (width - gridW) / 2;
  const yOff0 = (height - gridH) / 2;

  gridCols = width > 768 ? 12 : 6;
  cellSize = gridW / gridCols;
  const rows = Math.floor(gridH / cellSize);
  const finalH = rows * cellSize;
  const yOff = yOff0 + (gridH - finalH) / 2;

  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < gridCols; x++) {
      const midi = visualNotes[R.int(0, visualNotes.length - 1)];
      const cell = {
        x: xOff0 + x * cellSize + cellSize / 2,
        y: yOff + y * cellSize + cellSize / 2,
        midi,
        // small per-cell phase so the breathing isn't synchronized
        phase: R.num(0, 1000),
        lit: 0,
      };
      row.push(cell);
      const pc = midi % 12;
      if (!noteCells[pc]) noteCells[pc] = [];
      noteCells[pc].push(cell);
    }
    grid.push(row);
  }
}

function drawGrid() {
  if (!textCanvas || grid.length === 0) return;
  const tc = textCanvas;
  tc.clear();
  tc.textAlign(CENTER, CENTER);
  tc.noStroke();

  // Wait for the embedded Devanagari font before drawing any glyphs, so the
  // headless thumbnail renderer never captures a pre-load (tofu) frame.
  if (!sargamFontReady) return;

  const accentRgb = cAcc; // already 0..1
  const accentCss = `rgb(${Math.round(accentRgb[0]*255)},${Math.round(accentRgb[1]*255)},${Math.round(accentRgb[2]*255)})`;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];

      // Fade litness
      if (cell.lit > 0) cell.lit = Math.max(0, cell.lit - 0.045);

      const pc = cell.midi % 12;
      const syl = UNICODE_SYLLABLES[pc] || "";

      // Cell size pulses (noise-driven), brighter when lit. Slightly smaller
      // than the website version so characters don't crowd at dense settings.
      const breath = noise(cell.x / 100, cell.y / 100, (shaderTime + cell.phase) / 100);
      const base = cellSize * (0.32 + 0.38 * breath);
      const size = base + base * 0.55 * cell.lit;

      // Glow when lit
      if (cell.lit > 0.01) {
        tc.drawingContext.shadowBlur = 20 * cell.lit;
        tc.drawingContext.shadowColor = accentCss;
      } else {
        tc.drawingContext.shadowBlur = 0;
      }

      const alpha = Math.round(110 + 145 * cell.lit);
      tc.fill(255, alpha);
      tc.textSize(size);

      // Draw with a local Y-flip so glyphs appear upright after the WEBGL
      // image() call that flips the entire textCanvas vertically.
      tc.push();
      tc.translate(cell.x, cell.y);
      tc.scale(1, -1);
      tc.text(syl, 0, 0);

      // Komal/teevra diacritic dots are embedded in UNICODE_SYLLABLES strings.
      tc.pop();

      tc.drawingContext.shadowBlur = 0;
    }
  }
}

function lightUpPitch(pc) {
  const cells = noteCells[pc];
  if (!cells) return;
  for (const c of cells) c.lit = 1;
}

function draw() {
  // Pull amplitude from analyser if running
  if (analyser) {
    analyser.getByteTimeDomainData(analyserBuf);
    let sum = 0;
    for (let i = 0; i < analyserBuf.length; i++) {
      const v = (analyserBuf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / analyserBuf.length);
    currentAmplitude = Math.min(1, rms * 3);
  } else {
    // Soft idle pulse before audio starts so the piece still breathes
    currentAmplitude = 0.05 + 0.05 * Math.sin(millis() * 0.0008);
  }
  smoothedAmplitude += (currentAmplitude - smoothedAmplitude) * 0.15;
  shaderTime += (0.008 + smoothedAmplitude * 0.012) * flowSpeed;

  shader(bgShader);
  bgShader.setUniform('iResolution',        [width, height]);
  bgShader.setUniform('iTime',              shaderTime);
  bgShader.setUniform('u_amplitude',        smoothedAmplitude);
  bgShader.setUniform('u_color_background', cBg);
  bgShader.setUniform('u_color_primary',    cPri);
  bgShader.setUniform('u_color_secondary',  cSec);
  bgShader.setUniform('u_color_accent',     cAcc);
  bgShader.setUniform('u_flow_mode',        flowMode);
  bgShader.setUniform('u_flow_speed',       flowSpeed);
  bgShader.setUniform('u_flow_scale',       flowScale);

  noStroke();
  rect(-width / 2, -height / 2, width, height);

  // Hindi sargam overlay (drawn to a 2D buffer, then composited over WebGL).
  drawGrid();
  // In WEBGL mode the 2D image draws flipped on Y, so we flip it back.
  image(textCanvas, -width / 2, height / 2, width, -height);

  // Audio scheduler tick
  if (audioCtx) scheduler();
}

// ============================================================================
// Audio (Web Audio API)
// ============================================================================
function startAudio() {
  audioStarted = true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.5;

  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 2200;
  filterNode.Q.value = 0.7;

  // Simple feedback delay
  delayNode = audioCtx.createDelay(2.0);
  delayNode.delayTime.value = (60 / tempoBpm) * 0.5; // 8th-note delay
  delayFeedback = audioCtx.createGain();
  delayFeedback.gain.value = 0.35;
  delayWet = audioCtx.createGain();
  delayWet.gain.value = 0.32;
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(delayWet);

  // Convolver-based reverb (procedurally generated IR — no external file)
  const reverb = audioCtx.createConvolver();
  reverb.buffer = makeImpulseResponse(audioCtx, 3.2, 2.6);
  reverbGain = audioCtx.createGain();
  reverbGain.gain.value = 0.45;

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  analyserBuf = new Uint8Array(analyser.fftSize);

  // Routing: voices -> filter -> [dry + delayWet + reverb] -> masterGain -> destination
  filterNode.connect(masterGain);
  filterNode.connect(delayNode);
  delayWet.connect(masterGain);
  filterNode.connect(reverb);
  reverb.connect(reverbGain);
  reverbGain.connect(masterGain);
  masterGain.connect(analyser);
  masterGain.connect(audioCtx.destination);

  // Tanpura-style drone — but only if the Tone sample-based drone isn't
  // already running (Tone.js drone uses the strings sampler).
  if (!toneEngineReady) {
    startDrone();
  } else if (window.Tone) {
    // Resume Tone's audio context now that we have a user gesture, and
    // (re-)kick off the Tone drone in case it was queued while suspended.
    window.Tone.start();
    startToneDrone();
  }

  nextNoteTime = audioCtx.currentTime + 0.1;
}

function makeImpulseResponse(ctx, duration, decay) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * duration);
  const ir = ctx.createBuffer(2, length, rate);
  // Use a small local LCG so we don't need Math.random (deterministic noise is fine)
  let s = 0x9e3779b1;
  const lcg = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s / 0xffffffff) * 2 - 1; };
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = lcg() * Math.pow(1 - i / length, decay);
    }
  }
  return ir;
}

function startDrone() {
  // Sustained tanpura pad: root + fifth in two octaves, very low.
  const roots = [midiToFreq(48), midiToFreq(48 + 7), midiToFreq(60)];
  roots.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = i === 2 ? 'triangle' : 'sine';
    osc.frequency.value = f;
    g.gain.value = 0.0;
    osc.connect(g);
    g.connect(filterNode);
    osc.start();
    // gentle fade-in
    const t0 = audioCtx.currentTime;
    g.gain.linearRampToValueAtTime(0.08 - i * 0.015, t0 + 4);
    // subtle slow LFO on amplitude for life
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.07 + i * 0.03;
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
  });
}

// Smooth noise from overlapping sines at irrational frequencies — no repeat.
// Returns a value in roughly [-1, 1].
function smoothNoise(t) {
  return Math.sin(t * 0.113) * 0.50 +
         Math.sin(t * 0.237) * 0.30 +
         Math.sin(t * 0.057) * 0.20;
}

// Scheduler: walks ahead in time and schedules upcoming notes/hits.
function scheduler() {
  // No-beat pieces: drift tempo organically via smooth noise (±10 BPM).
  // Beat pieces: fixed tempo for rhythmic clarity.
  let liveBpm = tempoBpm;
  if (!hasBeats && audioCtx) {
    const drift = smoothNoise(audioCtx.currentTime * 0.08) * 10;
    liveBpm = Math.max(40, Math.min(88, tempoBpm + drift));
  }
  const stepDur = (60 / liveBpm) / 4; // 16th-note grid
  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    scheduleStep(beatIndex, nextNoteTime, stepDur);
    nextNoteTime += stepDur;
    beatIndex = (beatIndex + 1) % beatStepsPerBar;
  }
}

function scheduleStep(step, time, stepDur) {
  const stepInBeat = step % 4;
  const isDownbeat = stepInBeat === 0;

  // Advance the composition at the start of every bar.
  if (step === 0) advanceComposition();

  const sec = comp.section || SECTION_TEMPLATES.alap;

  // ---- Melody ----
  if (sec.melody !== "silent" && shouldFireMelody(step, sec.melody)) {
    if (melodyPool.length > 0) {
      // Ascend through the pool on aaroh bars, descend on avroh bars —
      // mirrors the traditional ascending / descending raga movement.
      const ascending = (comp.bar % 4) < 2;
      const stepSize  = ascending ? R.int(1, 3) : -R.int(1, 3);
      melodyIndex = melodyIndex + stepSize;

      // Bounce at extremes so the melody doesn't get stranded at one end.
      if (melodyIndex <= 0)                    melodyIndex = R.int(2, 5);
      if (melodyIndex >= melodyPool.length - 1) melodyIndex = melodyPool.length - 1 - R.int(2, 5);

      // Occasional register leap — mirrors a gamak or murkhi ornament.
      // Probability scales with section energy.
      const leapProb = sec.melody === "jhala" ? 0.14
                     : sec.melody === "dense"  ? 0.10
                     :                           0.06;
      if (R.bool(leapProb)) {
        // Jump to a random note in a different third of the pool.
        const third = Math.floor(melodyPool.length / 3);
        const reg   = R.int(0, 2); // 0=low, 1=mid, 2=high
        melodyIndex = third * reg + R.int(0, third - 1);
      }

      melodyIndex = Math.max(0, Math.min(melodyPool.length - 1, melodyIndex));
      const midi = melodyPool[melodyIndex];
      const dur  = stepDur * (sec.melody === "jhala" ? 0.9 : (isDownbeat ? 3.5 : 2.0));
      triggerMelody(time, midi, dur);
      const delayMs = Math.max(0, (time - audioCtx.currentTime) * 1000);
      const pc = ((midi % 12) + 12) % 12;
      setTimeout(() => lightUpPitch(pc), delayMs);
    }
  }

  // ---- Drone: keep the cello pad alive across the whole arc ----
  if (step === 0) retriggerToneDrone();

  // ---- Strings: short pizz strums on bar boundaries when layer active ----
  if (step === 0 && sec.layers.strings && toneEngineReady && toneSamplers.strings) {
    if (R.bool(0.55)) {
      const tt = audioCtxTimeToToneTime(time);
      const root = (aaroh[0] || 60);
      const notes = [root, root + 7].map(midiToNoteName);
      try { toneSamplers.strings.triggerAttackRelease(notes, "4n", tt, 0.7); } catch (_) {}
    }
  }

  // ---- Cello chord change once per section's first bar ----
  if (step === 0 && comp.bar === 0 && sec.layers.celloChord) {
    if (R.bool(0.7)) {
      const root = (aaroh[0] || 60);
      triggerChord(time, root);
    }
  }

  // ---- Percussion (only if token has Beats: Yes) ----
  if (!hasBeats) return;

  // Tihai overrides the normal tabla pattern in the section's last bar.
  if (comp.inTihai && sec.layers.tabla) {
    if (step < 15) {
      const hit = TIHAI_PHRASE[step % TIHAI_PHRASE.length];
      if (hit) triggerTabla(time, hit);
    }
    // Drum kit stays out of the way during tihai so the cadence is clear.
    return;
  }

  // ---- Tabla pattern (varies by rhythm mode) ----
  if (sec.layers.tabla) {
    const pat = chosenTablaPattern && TABLA_PATTERNS[chosenTablaPattern];
    if (pat) {
      let hit = null;
      switch (sec.rhythm) {
        case "silent":
          break;
        case "accent":
          // Only on downbeats — sparse accent hits
          if (isDownbeat) hit = pat[step % pat.length];
          break;
        case "regular":
          hit = pat[step % pat.length];
          break;
        case "double":
          // Pattern compressed: plays at 2x density. For Keherwa (len 8),
          // that means cycling twice as fast through the same hits.
          hit = pat[(step * 2) % pat.length];
          break;
        case "jhala":
          // Constant "Dha" pulse with "Tin" accents on the downbeat for drive.
          hit = isDownbeat ? "Dha" : "Te";
          break;
      }
      if (hit) triggerTabla(time, hit);
    }

    // ---- Tabla ornaments: sub-16th fast accents independent of drum grid ----
    // Probability and pattern shape vary by section — jhala is near-continuous,
    // tabla_solo uses layakari bursts, other sections get occasional grace notes.
    if (!comp.inTihai) {
      let ornProb;
      if      (sec.rhythm === "jhala")             ornProb = 0.90;
      else if (comp.sectionName === "tabla_solo")  ornProb = 0.42;
      else if (sec.rhythm === "double")            ornProb = 0.28;
      else if (sec.rhythm === "regular")           ornProb = 0.14;
      else                                         ornProb = 0.06; // accent / sparse

      // Scale ornaments down at high tempos — above 110 BPM they get muddy fast.
      const tempoScale = Math.min(1.0, 105 / Math.max(80, tempoBpm));
      if (R.bool(ornProb * tempoScale)) {
        // Each entry is [fractionOfStep, hitName].
        // Fractions <1 schedule the hit before the next downbeat within this step.
        let pattern;
        if (sec.rhythm === "jhala") {
          // Continuous 32nd-note alternation — real jhala has Dha on the beat
          // and Te/Na filling the gaps at 32nd resolution.
          pattern = R.choice([
            [[0.50, "Te"]],
            [[0.50, "Dha"]],
            [[0.50, "Te"],  [0.75, "Na"]],
            [[0.33, "Te"],  [0.67, "Dha"]],
          ]);
        } else if (comp.sectionName === "tabla_solo") {
          // Kaida / layakari style — more elaborate fills with mixed tones.
          pattern = R.choice([
            [[0.25, "Te"],  [0.50, "Na"],  [0.75, "Te"]],
            [[0.33, "Na"],  [0.67, "Te"]],
            [[0.50, "Na"],  [0.75, "Te"]],
            [[0.25, "Te"],  [0.50, "Ge"],  [0.75, "Na"]],
            [[0.20, "Te"],  [0.40, "Na"],  [0.60, "Te"], [0.80, "Na"]],
          ]);
        } else {
          // Regular / double: occasional grace notes and short fills.
          pattern = R.choice([
            [[0.75, "Te"]],
            [[0.50, "Te"]],
            [[0.33, "Na"],  [0.67, "Te"]],
            [[0.25, "Te"],  [0.50, "Na"], [0.75, "Te"]],
            [[0.50, "Na"]],
          ]);
        }
        for (const [frac, hitName] of pattern) {
          triggerTabla(time + stepDur * frac, hitName);
        }
      }
    }
  }

  // ---- Western drum kit underneath ----
  if (sec.layers.drums) {
    if (sec.rhythm === "regular" || sec.rhythm === "double") {
      if (step % 16 === 0 || step % 16 === 8) triggerKick(time);
      if (step % 16 === 4 || step % 16 === 12) triggerSnare(time);
      if (stepInBeat === 2) triggerHat(time, false);
      if (stepInBeat === 0 && R.bool(0.15)) triggerHat(time, true);
    }
  }
}

// ----------------------------------------------------------------------------
// Composition controller — runs at the start of every bar.
// ----------------------------------------------------------------------------
function advanceComposition() {
  // First call: kick off with alap (the traditional opening).
  if (!comp.section) {
    setSection("alap");
    return;
  }
  comp.bar++;
  // Light up tihai in the section's last bar (if allowed).
  comp.inTihai = comp.section.canTihai
    && hasBeats
    && comp.bar === comp.barsTotal - 1;

  // Time to move on?
  if (comp.bar >= comp.barsTotal) {
    const next = pickNextSection(comp.sectionName);
    setSection(next);
  }
}

function setSection(name) {
  const tmpl = SECTION_TEMPLATES[name];
  if (!tmpl) return;
  comp.sectionName = name;
  comp.section = tmpl;
  comp.bar = 0;
  comp.barsTotal = R.int(tmpl.barRange[0], tmpl.barRange[1]);
  comp.inTihai = false;
  comp.count++;
}

function pickNextSection(currentName) {
  const table = hasBeats ? TRANSITIONS_WITH_BEATS : TRANSITIONS_NO_BEATS;
  const candidates = table[currentName] || table.vilambit || table.alap;
  return R.weighted(candidates.map(c => c[0]), candidates.map(c => c[1]));
}

// shouldFireMelody — density-aware gate per section's melody mode.
function shouldFireMelody(step, mode) {
  const stepInBeat = step % 4;
  const isDownbeat = stepInBeat === 0;
  if (mode === "silent") return false;
  if (mode === "slow")   return isDownbeat && R.bool(0.55);
  if (mode === "jhala")  return R.bool(0.88);
  if (mode === "dense")  return isDownbeat ? R.bool(0.95) : R.bool(0.45);
  // "regular" — density trait drives this.
  let p;
  if (densityLabel === "Sparse")     p = isDownbeat ? 0.55 : 0.12;
  else if (densityLabel === "Dense") p = isDownbeat ? 0.95 : 0.45;
  else                               p = isDownbeat ? 0.80 : 0.25;
  return R.bool(p);
}

// ============================================================================
// Voice dispatchers — Tone engine when ready, synth fallback otherwise.
// ============================================================================
function triggerMelody(time, midi, duration) {
  if (toneEngineReady && toneSamplers.rhodes) {
    const note = midiToNoteName(midi);
    const tt = audioCtxTimeToToneTime(time);
    try {
      toneSamplers.rhodes.triggerAttackRelease(note, Math.max(0.05, duration), tt, 0.8);
    } catch (_) { /* note out of range */ }
    return;
  }
  playPluck(time, midiToFreq(midi), duration);
}

function triggerChord(time, rootMidi) {
  if (!(toneEngineReady && toneSamplers.cello)) return;
  // Stack a triad from the raga's aaroh: root, third-ish, fifth-ish.
  const tt = audioCtxTimeToToneTime(time);
  const tones = [rootMidi, rootMidi + 7, rootMidi + 12].map(midiToNoteName);
  try { toneSamplers.cello.triggerAttackRelease(tones, "2n", tt, 0.6); } catch (_) {}
}

function triggerTabla(time, hit) {
  if (!toneEngineReady || !toneSamplers.tabla) return;
  if (!toneSamplers.tabla.has(hit)) return;
  const tt = audioCtxTimeToToneTime(time);
  try { toneSamplers.tabla.player(hit).start(tt); } catch (_) {}
}

function triggerKick(time) {
  if (toneEngineReady && toneSamplers.drums && toneSamplers.drums.has("kick")) {
    const tt = audioCtxTimeToToneTime(time);
    try { toneSamplers.drums.player("kick").start(tt); return; } catch (_) {}
  }
  playKick(time);
}
function triggerSnare(time) {
  if (toneEngineReady && toneSamplers.drums && toneSamplers.drums.has("snare")) {
    const tt = audioCtxTimeToToneTime(time);
    try { toneSamplers.drums.player("snare").start(tt); return; } catch (_) {}
  }
  playSnare(time);
}
function triggerHat(time, accent) {
  if (toneEngineReady && toneSamplers.drums && toneSamplers.drums.has("hat")) {
    const tt = audioCtxTimeToToneTime(time);
    try { toneSamplers.drums.player("hat").start(tt); return; } catch (_) {}
  }
  playHat(time, accent);
}

// Tone runs on its own AudioContext. We schedule against our `audioCtx.currentTime`,
// so convert the absolute audioCtx-time into the equivalent Tone-time. Both
// contexts share the system clock once Tone.start() has been called, so the
// delta from `now` is what matters.
function audioCtxTimeToToneTime(time) {
  if (!window.Tone) return undefined;
  const delta = time - audioCtx.currentTime;
  return window.Tone.now() + Math.max(0, delta);
}

function midiToNoteName(midi) {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const oct = Math.floor(midi / 12) - 1;
  return names[((midi % 12) + 12) % 12] + oct;
}

// ---------- Voices --------------------------------------------------------
function playPluck(time, freq, duration) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc1.type = 'triangle';
  osc2.type = 'sine';
  osc1.frequency.value = freq;
  osc2.frequency.value = freq * 2;
  // gentle detune on osc2 for chorusing
  osc2.detune.value = 6;
  const peak = 0.22;
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(peak, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  const mix = audioCtx.createGain();
  mix.gain.value = 0.5;
  osc1.connect(g);
  osc2.connect(mix); mix.connect(g);
  g.connect(filterNode);
  osc1.start(time); osc2.start(time);
  osc1.stop(time + duration + 0.05);
  osc2.stop(time + duration + 0.05);
}

function playKick(time) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.18);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.linearRampToValueAtTime(0.55, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.35);
}

function playSnare(time) {
  const dur = 0.18;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let s = 0xdeadbeef;
  for (let i = 0; i < data.length; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    data[i] = ((s / 0xffffffff) * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const g = audioCtx.createGain();
  g.gain.value = 0.28;
  noise.connect(bp); bp.connect(g); g.connect(masterGain);
  noise.start(time);
}

function playHat(time, accent) {
  const dur = 0.05;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let s = 0xb16b00b5;
  for (let i = 0; i < data.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    data[i] = ((s / 0xffffffff) * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const g = audioCtx.createGain();
  g.gain.value = accent ? 0.18 : 0.09;
  noise.connect(hp); hp.connect(g); g.connect(masterGain);
  noise.start(time);
}

// ============================================================================
// Helpers
// ============================================================================
function midiToFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

// hslToRgb01 — h 0..360, s 0..1, l 0..1 → [r,g,b] 0..1
function hslToRgb01(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r=c; g=x; b=0; }
  else if (h < 120) { r=x; g=c; b=0; }
  else if (h < 180) { r=0; g=c; b=x; }
  else if (h < 240) { r=0; g=x; b=c; }
  else if (h < 300) { r=x; g=0; b=c; }
  else              { r=c; g=0; b=x; }
  return [r + m, g + m, b + m];
}

// Map mood string → generated palette with small per-token PRNG variation.
// Returns { bg, pri, sec, acc } each as [r,g,b] 0..1.
function generateMoodPalette(mood, rng) {
  // [baseHue, hueSplay, bgL, secL, priL, accL, sat]
  const MOOD_TABLE = {
    "Spiritual Awakening":    [270, 25, 0.07, 0.15, 0.38, 0.62, 0.72],
    "Gentle Start":           [210, 20, 0.08, 0.18, 0.36, 0.58, 0.55],
    "Devotional & Uplifting": [ 20, 20, 0.07, 0.18, 0.42, 0.65, 0.80],
    "Energetic & Positive":   [ 42, 18, 0.08, 0.20, 0.45, 0.68, 0.85],
    "Focused & Productive":   [220, 15, 0.05, 0.12, 0.30, 0.55, 0.60],
    "Refreshing & Calm":      [145, 22, 0.07, 0.16, 0.36, 0.60, 0.65],
    "Reflective & Calm":      [320, 25, 0.08, 0.18, 0.38, 0.58, 0.60],
    "Gentle & Soothing":      [170, 20, 0.07, 0.17, 0.37, 0.60, 0.58],
    "Relaxed & Unwind":       [ 48, 22, 0.09, 0.20, 0.46, 0.68, 0.72],
    "Contemplative":          [ 25, 20, 0.06, 0.14, 0.34, 0.58, 0.65],
    "Deep Reflection":        [280, 28, 0.06, 0.14, 0.36, 0.60, 0.70],
    "Mystical":               [240, 22, 0.05, 0.13, 0.32, 0.58, 0.75],
    "Romantic Longing":       [300, 22, 0.07, 0.17, 0.40, 0.65, 0.72],
    "Romantic & Joyful":      [340, 20, 0.08, 0.18, 0.42, 0.65, 0.68],
    "Peaceful Evening":       [250, 20, 0.07, 0.16, 0.36, 0.60, 0.65],
    "Introspective":          [ 90, 22, 0.07, 0.16, 0.36, 0.58, 0.60],
    "Winding Down":           [200, 22, 0.06, 0.14, 0.34, 0.56, 0.62],
    "Romantic":               [330, 20, 0.07, 0.17, 0.40, 0.64, 0.70],
    "Devotional":             [ 35, 20, 0.07, 0.17, 0.40, 0.63, 0.78],
    "Evening Calm":           [245, 20, 0.07, 0.16, 0.35, 0.58, 0.62],
    "Night Meditation":       [265, 22, 0.05, 0.12, 0.30, 0.55, 0.72],
    "Morning Calm":           [195, 18, 0.08, 0.18, 0.38, 0.60, 0.55],
  };
  // Fallback: derive a hue from the mood string's char codes
  let params = MOOD_TABLE[mood];
  if (!params) {
    const hue = (mood.split('').reduce((s, c) => s + c.charCodeAt(0), 0) * 37) % 360;
    params = [hue, 20, 0.07, 0.16, 0.38, 0.60, 0.65];
  }
  const [baseHue, splay, bgL, secL, priL, accL, sat] = params;
  const v = () => rng.num(-0.04, 0.04); // small per-mint variation
  const hv = () => rng.num(-splay * 0.5, splay * 0.5);

  const bg  = hslToRgb01(baseHue + hv(),          sat * 0.55, bgL  + v());
  const sec = hslToRgb01(baseHue + hv() + splay,  sat * 0.75, secL + v());
  const pri = hslToRgb01(baseHue + hv(),           sat,        priL + v());
  const acc = hslToRgb01(baseHue + hv() + 150,     sat,        accL + v()); // ~complementary
  return { bg, pri, sec, acc };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  return [
    ((bigint >> 16) & 255) / 255,
    ((bigint >> 8)  & 255) / 255,
    ( bigint        & 255) / 255,
  ];
}
