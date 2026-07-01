/**
 * Simple polyline letter strokes for flow-field alignment.
 * Each letter in a 1×1 box (x,y in [0,1], y=0 bottom, y=1 top).
 * Segment format: [x1, y1, x2, y2] — tangent is (x2-x1, y2-y1) normalized.
 */
const LETTER_STROKES = {
  ' ': [],
  'A': [[0.5,1,0.05,0], [0.5,1,0.95,0], [0.2,0.45,0.8,0.45]],
  'B': [[0.05,0,0.05,1], [0.05,1,0.75,1], [0.75,1,0.85,0.6], [0.05,0.6,0.8,0.6], [0.85,0.6,0.85,0.1], [0.05,0,0.75,0], [0.75,0,0.85,0.1]],
  'C': [[0.9,0.85,0.2,0.85], [0.2,0.85,0.05,0.5], [0.05,0.5,0.2,0.15], [0.2,0.15,0.9,0.15]],
  'D': [[0.05,0,0.05,1], [0.05,1,0.6,1], [0.6,1,0.95,0.5], [0.95,0.5,0.6,0], [0.6,0,0.05,0]],
  'E': [[0.05,0,0.05,1], [0.05,1,0.95,1], [0.05,0.5,0.85,0.5], [0.05,0,0.95,0]],
  'F': [[0.05,0,0.05,1], [0.05,1,0.95,1], [0.05,0.5,0.85,0.5]],
  'G': [[0.9,0.7,0.5,0.7], [0.5,0.7,0.1,0.5], [0.1,0.5,0.05,0.2], [0.05,0.2,0.5,0], [0.5,0,0.95,0.2], [0.95,0.2,0.95,0.5], [0.95,0.5,0.5,0.5]],
  'H': [[0.05,0,0.05,1], [0.95,0,0.95,1], [0.05,0.5,0.95,0.5]],
  'I': [[0.4,0,0.4,1], [0.2,1,0.6,1], [0.2,0,0.6,0]],
  'J': [[0.7,0.85,0.7,0.2], [0.7,0.2,0.4,0], [0.4,0,0.1,0.15], [0.1,0.15,0.05,0.4]],
  'K': [[0.05,0,0.05,1], [0.05,0.5,0.9,1], [0.05,0.5,0.9,0]],
  'L': [[0.05,0,0.05,1], [0.05,0,0.95,0]],
  'M': [[0.05,0,0.05,1], [0.05,1,0.5,0.5], [0.5,0.5,0.95,1], [0.95,1,0.95,0]],
  'N': [[0.05,0,0.05,1], [0.05,1,0.95,0], [0.95,0,0.95,1]],
  'O': [[0.1,0.5,0.05,0.2], [0.05,0.2,0.3,0], [0.3,0,0.7,0], [0.7,0,0.95,0.2], [0.95,0.2,0.95,0.8], [0.95,0.8,0.7,1], [0.7,1,0.3,1], [0.3,1,0.05,0.8], [0.05,0.8,0.1,0.5]],
  'P': [[0.05,0,0.05,1], [0.05,1,0.7,1], [0.7,1,0.95,0.6], [0.95,0.6,0.7,0.5], [0.05,0.5,0.7,0.5]],
  'Q': [[0.3,0,0.7,0], [0.7,0,0.95,0.2], [0.95,0.2,0.95,0.8], [0.95,0.8,0.7,1], [0.7,1,0.3,1], [0.3,1,0.05,0.8], [0.05,0.8,0.05,0.2], [0.05,0.2,0.3,0], [0.6,0.3,0.95,0]],
  'R': [[0.05,0,0.05,1], [0.05,1,0.7,1], [0.7,1,0.95,0.6], [0.95,0.6,0.7,0.5], [0.05,0.5,0.7,0.5], [0.7,0.5,0.95,0]],
  'S': [[0.9,0.85,0.2,0.85], [0.2,0.85,0.05,0.5], [0.05,0.5,0.9,0.15], [0.9,0.15,0.2,0.15]],
  'T': [[0.05,1,0.95,1], [0.5,1,0.5,0]],
  'U': [[0.05,1,0.05,0.2], [0.05,0.2,0.3,0], [0.3,0,0.7,0], [0.7,0,0.95,0.2], [0.95,0.2,0.95,1]],
  'V': [[0.05,1,0.5,0], [0.5,0,0.95,1]],
  'W': [[0.05,1,0.25,0], [0.25,0,0.5,0.6], [0.5,0.6,0.75,0], [0.75,0,0.95,1]],
  'X': [[0.05,1,0.95,0], [0.95,1,0.05,0]],
  'Y': [[0.05,1,0.5,0.5], [0.95,1,0.5,0.5], [0.5,0.5,0.5,0]],
  'Z': [[0.05,1,0.95,1], [0.95,1,0.05,0], [0.05,0,0.95,0]],
  '0': [[0.3,0,0.7,0], [0.7,0,0.95,0.3], [0.95,0.3,0.95,0.7], [0.95,0.7,0.7,1], [0.7,1,0.3,1], [0.3,1,0.05,0.7], [0.05,0.7,0.05,0.3], [0.05,0.3,0.3,0]],
  '1': [[0.5,0,0.5,1], [0.2,0.3,0.5,0]],
  '2': [[0.1,0.8,0.5,1], [0.5,1,0.9,0.8], [0.9,0.8,0.9,0.5], [0.9,0.5,0.1,0], [0.1,0,0.95,0]],
  '3': [[0.1,0.85,0.8,0.85], [0.8,0.85,0.95,0.5], [0.95,0.5,0.7,0.15], [0.7,0.15,0.1,0.15]],
  '4': [[0.8,0,0.8,1], [0.8,1,0.1,0.35], [0.1,0.35,0.95,0.35]],
  '5': [[0.9,1,0.15,1], [0.15,1,0.15,0.5], [0.15,0.5,0.9,0.5], [0.9,0.5,0.9,0], [0.9,0,0.1,0]],
  '6': [[0.7,0.9,0.2,0.9], [0.2,0.9,0.05,0.5], [0.05,0.5,0.3,0.1], [0.3,0.1,0.7,0.1], [0.7,0.1,0.95,0.5], [0.95,0.5,0.7,0.9]],
  '7': [[0.05,1,0.95,1], [0.95,1,0.4,0]],
  '8': [[0.5,0.5,0.1,0.2], [0.1,0.2,0.3,0], [0.3,0,0.7,0], [0.7,0,0.9,0.2], [0.9,0.2,0.5,0.5], [0.5,0.5,0.9,0.8], [0.9,0.8,0.7,1], [0.7,1,0.3,1], [0.3,1,0.1,0.8], [0.1,0.8,0.5,0.5]],
  '9': [[0.9,0.5,0.9,0.9], [0.9,0.9,0.5,1], [0.5,1,0.1,0.9], [0.1,0.9,0.05,0.5], [0.05,0.5,0.5,0], [0.5,0,0.9,0.5]]
};

// Letter width in units (I, 1, space are narrower)
const LETTER_WIDTH = {};
'ABCDEFGHJKLMNOPQRSTUVWXYZ023456789'.split('').forEach(c => { LETTER_WIDTH[c] = 1; });
'I1'.split('').forEach(c => { LETTER_WIDTH[c] = 0.5; });
LETTER_WIDTH[' '] = 0.4;
LETTER_WIDTH['Q'] = 1;

/**
 * Get all segments for a string in text space: x in [0, totalWidth], y in [0, 1].
 * Returns array of { x1, y1, x2, y2, tx, ty } (tx,ty = normalized tangent).
 */
function getLetterSegmentsForText(text, options = {}) {
  const scale = options.scale != null ? options.scale : 1;
  const flipY = options.flipY !== false;
  const segments = [];
  let cursorX = 0;
  const chars = (String(text || 'A').toUpperCase()).split('');
  for (const ch of chars) {
    const strokes = LETTER_STROKES[ch];
    const w = LETTER_WIDTH[ch] != null ? LETTER_WIDTH[ch] : 1;
    if (strokes && strokes.length) {
      for (const seg of strokes) {
        const [x1, y1, x2, y2] = seg;
        let sx1 = cursorX + x1 * w;
        let sy1 = flipY ? 1 - y1 : y1;
        let sx2 = cursorX + x2 * w;
        let sy2 = flipY ? 1 - y2 : y2;
        let dx = sx2 - sx1;
        let dy = sy2 - sy1;
        const len = Math.hypot(dx, dy) || 1;
        const tx = dx / len;
        const ty = dy / len;
        segments.push({
          x1: sx1 * scale, y1: sy1 * scale,
          x2: sx2 * scale, y2: sy2 * scale,
          tx, ty
        });
      }
    }
    cursorX += w;
  }
  return { segments, totalWidth: cursorX * scale };
}

/**
 * Closest point on segment (x1,y1)-(x2,y2) to (px,py), and segment tangent.
 * Returns { x, y, tx, ty, dist, t } or null if segment degenerate.
 */
function closestPointOnSegment(px, py, x1, y1, x2, y2, tx, ty) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) return null;
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const dist = Math.hypot(px - cx, py - cy);
  return { x: cx, y: cy, tx, ty, dist, t };
}

/**
 * Get one rect per letter with segments in canvas coords.
 * Returns array of { x, y, w, h, letter, segments }.
 * segments: [{ x1, y1, x2, y2, tx, ty }] in canvas space.
 */
function getLetterRects(text, letterHeight, canvasWidth, canvasHeight) {
  const chars = (String(text || 'A').toUpperCase()).split('');
  let totalWidth = 0;
  for (const ch of chars) {
    const w = LETTER_WIDTH[ch] != null ? LETTER_WIDTH[ch] : 1;
    totalWidth += w * letterHeight;
  }
  const left = (canvasWidth - totalWidth) / 2;
  const top = (canvasHeight - letterHeight) / 2;
  const rects = [];
  let cursorX = 0;
  for (const ch of chars) {
    const wUnit = LETTER_WIDTH[ch] != null ? LETTER_WIDTH[ch] : 1;
    const w = wUnit * letterHeight;
    const rect = {
      x: left + cursorX,
      y: top,
      w,
      h: letterHeight,
      letter: ch
    };
    const strokes = LETTER_STROKES[ch];
    const segments = [];
    if (strokes && strokes.length) {
      for (const seg of strokes) {
        const [x1, y1, x2, y2] = seg;
        const sx1 = rect.x + x1 * w;
        const sy1 = rect.y + (1 - y1) * letterHeight;
        const sx2 = rect.x + x2 * w;
        const sy2 = rect.y + (1 - y2) * letterHeight;
        let dx = sx2 - sx1;
        let dy = sy2 - sy1;
        const len = Math.hypot(dx, dy) || 1;
        segments.push({
          x1: sx1, y1: sy1, x2: sx2, y2: sy2,
          tx: dx / len, ty: dy / len
        });
      }
    }
    rect.segments = segments;
    rects.push(rect);
    cursorX += w;
  }
  return rects;
}
