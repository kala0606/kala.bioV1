/**
 * Agent Movement — vectors auto-generated from Voronoi sites
 * Inspired by Generative Landscapes Example 11.3
 * https://generative-landscapes.com/agent-movement-using-user-drawn-vectors-example-11-3/
 *
 * Voronoi sites are generated inside the boundary; each cell gets a random flow direction.
 * Agents follow the field with inertia.
 */

let vectors = [];       // { anchor: p5.Vector, direction: p5.Vector } — one per Voronoi site
let boundary = [];
let agents = [];
let showVoronoi = false;
let showVectors = false;
let centerFillPct = 0;   // 0–100: how far in the innermost rect goes
let innerRectsCount = 0; // 0 = no inner rects, 1+ = that many nested rects to spawn from
let inertiaFactor = 40;
let stepSize = 3;
let maxSteps = 800;
let voronoiDiagram = null;
let numSites = 100;
let margin = 60;
let pathStrokeWeight = 1;

// Live animation
let liveMode = false;
let trailBuffer = null;    // off-screen graphics for persistent trails
let trailFade = 2;         // low fade — long trails that slowly clear (avoids saturation)
let liveStepsPerFrame = 2; // how many simulation steps per draw frame
let liveTrails = [];       // accumulated completed paths for SVG export

// Birds
let birds = [];
let numBirds = 6;
let showBirds = false;

// Mouse adjustment of vectors
const VECTOR_HIT_RADIUS = 45;  // pixels — click near a vector anchor to drag its direction
let draggingVectorIndex = -1;

// Letter mode: one rect per letter; segments spawn from rect boundary and follow that letter's field
let letterMode = false;
let letterText = 'HELLO';
let letterHeight = 180;        // pixels — height of each letter rect
let showLetterOutline = false;   // draw letter rects + strokes in faint color
let letterRects = [];          // [{ x, y, w, h, letter, segments }] from getLetterRects()

// Single layer: { paths: [[{x,y},...], ...], color: [r,g,b] }
const LAYER_COLOR = [255, 255, 255];   // white stroke
let layers = [];
const MIN_PATH_POINTS = 12;   // skip very short paths (agents that exit at edge immediately)

// Color layer mode
let colorMode = false;
let numColorLayers = 3;
const COLOR_PALETTE = [
  [220,  80,  60],   // rust
  [ 60, 150, 210],   // steel blue
  [ 70, 200, 140],   // seafoam
  [220, 180,  50],   // amber
];
const COLOR_NAMES = ['rust', 'blue', 'seafoam', 'amber'];

// Per-color live animation state (used when colorMode + liveMode)
let colorAgentGroups = [];   // [ [agent, ...], ... ]  one array per color layer
let colorLiveTrails  = [];   // [ [{x,y}[],  ...], ... ] completed paths per layer
let colorVectorSets  = [];   // [ [{anchor,direction}, ...], ... ] field per layer

// Agent count: more edge divisions + higher keep ratio = more agents
let edgeSegments = 120;
let keepRatio = 0.55;

// Param panel: sliders + debounced re-run
let paramSliders = {};
let paramDirty = false;
let paramLastChange = 0;
const PARAM_DEBOUNCE_MS = 400;

function refreshSwatches(n) {
  if (!paramSliders.swatchHolder) return;
  const el = paramSliders.swatchHolder.elt;
  el.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const [r, g, b] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    const d = document.createElement('div');
    d.style.cssText = `width:12px;height:12px;border-radius:2px;background:rgb(${r},${g},${b});flex-shrink:0;`;
    el.appendChild(d);
  }
}

// web embed: randomise the field / spawn / motion params within tasteful bands
function rerollParams() {
  numSites        = round(random(60, 160));
  margin          = round(random(40, 90));
  edgeSegments    = round(random(80, 260) / 10) * 10;
  keepRatio       = random(0.40, 0.80);
  centerFillPct   = round(random(0, 30) / 5) * 5;
  innerRectsCount = round(random(0, 3));
  inertiaFactor   = round(random(25, 70));
  stepSize        = round(random(2, 5) * 2) / 2;
  maxSteps        = round(random(500, 1200) / 50) * 50;
  syncParamSliders();
}

function syncParamSliders() {
  const s = paramSliders;
  if (!s) return;
  if (s.numSites)        s.numSites.value(numSites);
  if (s.margin)          s.margin.value(margin);
  if (s.edgeSegments)    s.edgeSegments.value(edgeSegments);
  if (s.keepRatio)       s.keepRatio.value(round(keepRatio * 100));
  if (s.centerFillPct)   s.centerFillPct.value(centerFillPct);
  if (s.innerRectsCount) s.innerRectsCount.value(innerRectsCount);
  if (s.inertiaFactor)   s.inertiaFactor.value(inertiaFactor);
  if (s.stepSize)        s.stepSize.value(stepSize);
  if (s.maxSteps)        s.maxSteps.value(maxSteps);
}

// re-randomise and rebuild the whole field (used on load + by the refresh button)
function reroll() {
  rerollParams();
  initBoundary();
  generateVoronoiVectors();
  startLiveMode();         // animate the new field
}
window.__reroll = reroll;

function setup() {
  createCanvas(windowWidth, windowHeight);
  trailBuffer = createGraphics(windowWidth, windowHeight);
  trailBuffer.background(10, 12, 18);
  buildParamPanel();
  rerollParams();          // randomise on every load
  initBoundary();
  generateVoronoiVectors();
  startLiveMode();         // animate on load
  textFont('monospace');
}

function buildParamPanel() {
  const panel = select('#param-panel');
  if (!panel) return;

  const group = (title) => {
    const h = createElement('h3', title);
    h.parent(panel);
  };
  const row = (label, slider, valueSpan) => {
    const r = createDiv('').addClass('param-row');
    r.parent(panel);
    createElement('label', label).parent(r);
    if (slider) slider.parent(r);
    if (valueSpan) valueSpan.parent(r).addClass('param-value');
    return r;
  };

  group('Field');
  paramSliders.numSites = createSlider(5, 200, numSites, 1);
  paramSliders.numSitesValue = createSpan(String(numSites));
  row('Sites', paramSliders.numSites, paramSliders.numSitesValue);
  paramSliders.margin = createSlider(20, 150, margin, 5);
  paramSliders.marginValue = createSpan(String(margin));
  row('Margin', paramSliders.margin, paramSliders.marginValue);

  group('Spawn');
  paramSliders.edgeSegments = createSlider(30, 400, edgeSegments, 10);
  paramSliders.edgeSegmentsValue = createSpan(String(edgeSegments));
  row('Edge segs', paramSliders.edgeSegments, paramSliders.edgeSegmentsValue);
  paramSliders.keepRatio = createSlider(1, 99, round(keepRatio * 100), 1);
  paramSliders.keepRatioValue = createSpan((keepRatio * 100).toFixed(0) + '%');
  row('Keep %', paramSliders.keepRatio, paramSliders.keepRatioValue);
  paramSliders.centerFillPct = createSlider(0, 100, centerFillPct, 5);
  paramSliders.centerFillPctValue = createSpan(centerFillPct + '%');
  row('Center fill', paramSliders.centerFillPct, paramSliders.centerFillPctValue);
  paramSliders.innerRectsCount = createSlider(0, 8, innerRectsCount, 1);
  paramSliders.innerRectsCountValue = createSpan(String(innerRectsCount));
  row('Center rects', paramSliders.innerRectsCount, paramSliders.innerRectsCountValue);

  group('Motion');
  paramSliders.inertiaFactor = createSlider(1, 100, inertiaFactor, 1);
  paramSliders.inertiaFactorValue = createSpan(String(inertiaFactor));
  row('Inertia', paramSliders.inertiaFactor, paramSliders.inertiaFactorValue);
  paramSliders.stepSize = createSlider(0.5, 15, stepSize, 0.5);
  paramSliders.stepSizeValue = createSpan(String(stepSize));
  row('Step size', paramSliders.stepSize, paramSliders.stepSizeValue);
  paramSliders.maxSteps = createSlider(200, 2000, maxSteps, 50);
  paramSliders.maxStepsValue = createSpan(String(maxSteps));
  row('Max steps', paramSliders.maxSteps, paramSliders.maxStepsValue);

  group('Letters');
  const letterModeRow = createDiv('').addClass('param-row');
  letterModeRow.parent(panel);
  paramSliders.letterMode = createCheckbox('Letter mode', letterMode);
  paramSliders.letterMode.parent(letterModeRow);
  paramSliders.letterMode.changed(() => { paramDirty = true; paramLastChange = millis(); });
  const letterTextRow = createDiv('').addClass('param-row');
  letterTextRow.parent(panel);
  createElement('label', 'Text').parent(letterTextRow);
  paramSliders.letterText = createInput(letterText, 'text');
  paramSliders.letterText.attribute('placeholder', 'e.g. HELLO');
  paramSliders.letterText.parent(letterTextRow);
  paramSliders.letterText.style('width', '90px');
  paramSliders.letterHeight = createSlider(60, 400, letterHeight, 10);
  paramSliders.letterHeightValue = createSpan(String(letterHeight));
  row('Letter height', paramSliders.letterHeight, paramSliders.letterHeightValue);
  const letterOutlineRow = createDiv('').addClass('param-row');
  letterOutlineRow.parent(panel);
  paramSliders.showLetterOutline = createCheckbox('Show outline', showLetterOutline);
  paramSliders.showLetterOutline.parent(letterOutlineRow);

  group('Birds');
  paramSliders.numBirds = createSlider(0, 20, numBirds, 1);
  paramSliders.numBirdsValue = createSpan(String(numBirds));
  row('Count', paramSliders.numBirds, paramSliders.numBirdsValue);
  const birdRow = createDiv('').addClass('param-row');
  birdRow.parent(panel);
  paramSliders.showBirds = createCheckbox('Show birds', showBirds);
  paramSliders.showBirds.parent(birdRow);
  paramSliders.showBirds.changed(() => { paramDirty = true; paramLastChange = millis(); });

  group('Display');
  const voronoiRow = createDiv('').addClass('param-row');
  voronoiRow.parent(panel);
  paramSliders.showVoronoi = createCheckbox('Show Voronoi', showVoronoi);
  paramSliders.showVoronoi.parent(voronoiRow);
  const vectorsRow = createDiv('').addClass('param-row');
  vectorsRow.parent(panel);
  paramSliders.showVectors = createCheckbox('Show field', showVectors);
  paramSliders.showVectors.parent(vectorsRow);
  paramSliders.pathStrokeWeight = createSlider(0.5, 4, pathStrokeWeight, 0.25);
  paramSliders.pathStrokeWeightValue = createSpan(String(pathStrokeWeight));
  row('Line weight', paramSliders.pathStrokeWeight, paramSliders.pathStrokeWeightValue);

  group('Color Layers');
  const colorModeRow = createDiv('').addClass('param-row');
  colorModeRow.parent(panel);
  paramSliders.colorMode = createCheckbox('Color mode', colorMode);
  paramSliders.colorMode.parent(colorModeRow);
  paramSliders.colorMode.changed(() => { paramDirty = true; paramLastChange = millis(); });
  paramSliders.numColorLayers = createSlider(2, 4, numColorLayers, 1);
  paramSliders.numColorLayersValue = createSpan(String(numColorLayers));
  row('Layers', paramSliders.numColorLayers, paramSliders.numColorLayersValue);
  const swatchRow = createDiv('').addClass('param-row');
  swatchRow.parent(panel);
  createElement('label', 'Colors').parent(swatchRow);
  const swatchHolder = createDiv('');
  swatchHolder.parent(swatchRow);
  swatchHolder.style('display', 'flex');
  swatchHolder.style('gap', '4px');
  swatchHolder.style('align-items', 'center');
  paramSliders.swatchHolder = swatchHolder;
  refreshSwatches(numColorLayers);

  group('Animation');
  paramSliders.liveStepsPerFrame = createSlider(1, 10, liveStepsPerFrame, 1);
  paramSliders.liveStepsPerFrameValue = createSpan(String(liveStepsPerFrame));
  row('Steps/frame', paramSliders.liveStepsPerFrame, paramSliders.liveStepsPerFrameValue);
  paramSliders.trailFade = createSlider(0, 40, trailFade, 1);
  paramSliders.trailFadeValue = createSpan(String(trailFade));
  row('Trail fade', paramSliders.trailFade, paramSliders.trailFadeValue);

  const animRow = createDiv('').addClass('param-row run-row');
  animRow.parent(panel);
  const animBtn = createButton('Animate');
  animBtn.parent(animRow);
  animBtn.mousePressed(() => {
    readParamSliders();
    initBoundary();
    generateVoronoiVectors();
    startLiveMode();
  });

  const stopRow = createDiv('').addClass('param-row run-row');
  stopRow.parent(panel);
  const stopBtn = createButton('Stop');
  stopBtn.parent(stopRow);
  stopBtn.mousePressed(() => {
    liveMode = false;
  });

  const runRow = createDiv('').addClass('param-row run-row');
  runRow.parent(panel);
  const runBtn = createButton('Run');
  runBtn.parent(runRow);
  runBtn.mousePressed(() => {
    readParamSliders();
    liveMode = false;
    initBoundary();
    generateVoronoiVectors();
    runSimulation();
  });

  const colorExportRow = createDiv('').addClass('param-row run-row');
  colorExportRow.parent(panel);
  const colorExportBtn = createButton('Export Color ZIP');
  colorExportBtn.parent(colorExportRow);
  colorExportBtn.mousePressed(() => {
    readParamSliders();
    if (colorMode) exportColorZip(); else exportLayersToSVG();
  });

  const onParamInput = () => {
    paramDirty = true;
    paramLastChange = millis();
  };
  [
    paramSliders.numSites, paramSliders.margin, paramSliders.edgeSegments,
    paramSliders.keepRatio, paramSliders.centerFillPct, paramSliders.innerRectsCount,
    paramSliders.inertiaFactor, paramSliders.stepSize, paramSliders.maxSteps,
    paramSliders.pathStrokeWeight, paramSliders.letterHeight,
    paramSliders.numBirds, paramSliders.liveStepsPerFrame, paramSliders.trailFade,
    paramSliders.numColorLayers
  ].forEach(s => s && s.input && s.input(onParamInput));
  if (paramSliders.letterText) paramSliders.letterText.input(onParamInput);
}

function readParamSliders() {
  if (!paramSliders.numSites) return;
  numSites = paramSliders.numSites.value();
  margin = paramSliders.margin.value();
  edgeSegments = paramSliders.edgeSegments.value();
  keepRatio = paramSliders.keepRatio.value() / 100;
  centerFillPct = paramSliders.centerFillPct.value();
  innerRectsCount = paramSliders.innerRectsCount.value();
  inertiaFactor = paramSliders.inertiaFactor.value();
  stepSize = paramSliders.stepSize.value();
  maxSteps = paramSliders.maxSteps.value();
  showVoronoi = paramSliders.showVoronoi.checked();
  showVectors = paramSliders.showVectors.checked();
  pathStrokeWeight = paramSliders.pathStrokeWeight.value();
  if (paramSliders.letterMode) letterMode = paramSliders.letterMode.checked();
  if (paramSliders.letterText) letterText = (paramSliders.letterText.value() || 'A').toUpperCase();
  if (paramSliders.letterHeight) letterHeight = paramSliders.letterHeight.value();
  if (paramSliders.showLetterOutline) showLetterOutline = paramSliders.showLetterOutline.checked();
  if (paramSliders.numBirds) numBirds = paramSliders.numBirds.value();
  if (paramSliders.showBirds) showBirds = paramSliders.showBirds.checked();
  if (paramSliders.liveStepsPerFrame) liveStepsPerFrame = paramSliders.liveStepsPerFrame.value();
  if (paramSliders.trailFade) trailFade = paramSliders.trailFade.value();
  if (paramSliders.colorMode) colorMode = paramSliders.colorMode.checked();
  if (paramSliders.numColorLayers) numColorLayers = paramSliders.numColorLayers.value();
}

function updateParamDisplays() {
  if (!paramSliders.numSitesValue) return;
  paramSliders.numSitesValue.html(String(numSites));
  paramSliders.marginValue.html(String(margin));
  paramSliders.edgeSegmentsValue.html(String(edgeSegments));
  paramSliders.keepRatioValue.html((keepRatio * 100).toFixed(0) + '%');
  if (paramSliders.centerFillPctValue) paramSliders.centerFillPctValue.html(centerFillPct + '%');
  if (paramSliders.innerRectsCountValue) paramSliders.innerRectsCountValue.html(String(innerRectsCount));
  paramSliders.inertiaFactorValue.html(String(inertiaFactor));
  paramSliders.stepSizeValue.html(stepSize % 1 === 0 ? String(stepSize) : stepSize.toFixed(1));
  paramSliders.maxStepsValue.html(String(maxSteps));
  paramSliders.pathStrokeWeightValue.html(pathStrokeWeight % 1 === 0 ? String(pathStrokeWeight) : pathStrokeWeight.toFixed(2));
  if (paramSliders.letterHeightValue) paramSliders.letterHeightValue.html(String(letterHeight));
  if (paramSliders.numBirdsValue) paramSliders.numBirdsValue.html(String(numBirds));
  if (paramSliders.liveStepsPerFrameValue) paramSliders.liveStepsPerFrameValue.html(String(liveStepsPerFrame));
  if (paramSliders.trailFadeValue) paramSliders.trailFadeValue.html(String(trailFade));
  if (paramSliders.numColorLayersValue) {
    paramSliders.numColorLayersValue.html(String(numColorLayers));
    refreshSwatches(numColorLayers);
  }
}

function initBoundary() {
  boundary = [
    createVector(margin, margin),
    createVector(width - margin, margin),
    createVector(width - margin, height - margin),
    createVector(margin, height - margin)
  ];
}

/** Tangent from closest segment in a single rect's segments. */
function getTangentInRect(px, py, segments) {
  let best = null;
  let bestDist = Infinity;
  for (const seg of segments) {
    const hit = closestPointOnSegment(px, py, seg.x1, seg.y1, seg.x2, seg.y2, seg.tx, seg.ty);
    if (hit && hit.dist < bestDist) {
      bestDist = hit.dist;
      best = { tx: hit.tx, ty: hit.ty };
    }
  }
  return best;
}

function insideRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function generateVoronoiVectors() {
  const xmin = margin;
  const ymin = margin;
  const xmax = width - margin;
  const ymax = height - margin;

  if (letterMode && typeof getLetterRects === 'function' && letterText) {
    letterRects = getLetterRects(letterText, letterHeight, width, height);
  } else {
    letterRects = [];
  }

  let sites = [];
  let siteRectIndices = [];

  if (letterMode && letterRects.length > 0 && letterText) {
    // Sites only inside letter rects (with small padding so they're inside)
    const pad = 4;
    const sitesPerRect = max(1, floor(numSites / letterRects.length));
    for (let r = 0; r < letterRects.length; r++) {
      const rect = letterRects[r];
      for (let i = 0; i < sitesPerRect; i++) {
        const rw = max(1, rect.w - 2 * pad);
        const rh = max(1, rect.h - 2 * pad);
        sites.push([
          rect.x + pad + random(rw),
          rect.y + pad + random(rh)
        ]);
        siteRectIndices.push(r);
      }
    }
    // Voronoi bounds: union of all letter rects with margin
    const L = Math.max(xmin, min(...letterRects.map(r => r.x)) - 20);
    const R = Math.min(xmax, max(...letterRects.map(r => r.x + r.w)) + 20);
    const T = Math.max(ymin, min(...letterRects.map(r => r.y)) - 20);
    const B = Math.min(ymax, max(...letterRects.map(r => r.y + r.h)) + 20);
    if (typeof d3 !== 'undefined' && d3.Delaunay && sites.length > 0) {
      const delaunay = d3.Delaunay.from(sites);
      voronoiDiagram = delaunay.voronoi([L, T, R, B]);
    }
    vectors = sites.map(([x, y], i) => {
      const rect = letterRects[siteRectIndices[i]];
      const hit = getTangentInRect(x, y, rect.segments);
      const dir = hit
        ? createVector(hit.tx, hit.ty)
        : createVector(cos(random(TWO_PI)), sin(random(TWO_PI)));
      dir.normalize();
      return { anchor: createVector(x, y), direction: dir };
    });
  } else {
    // Original: random sites in full boundary
    const pad = 30;
    for (let i = 0; i < numSites; i++) {
      sites.push([
        random(xmin + pad, xmax - pad),
        random(ymin + pad, ymax - pad)
      ]);
    }
    if (typeof d3 !== 'undefined' && d3.Delaunay) {
      const delaunay = d3.Delaunay.from(sites);
      voronoiDiagram = delaunay.voronoi([xmin, ymin, xmax, ymax]);
    }
    vectors = sites.map(([x, y]) => {
      const angle = random(TWO_PI);
      const dir = createVector(cos(angle), sin(angle));
      return { anchor: createVector(x, y), direction: dir };
    });
  }
}

function draw() {
  readParamSliders();
  updateParamDisplays();
  if (paramDirty && millis() - paramLastChange > PARAM_DEBOUNCE_MS) {
    paramDirty = false;
    if (liveMode) {
      // In live mode, just regenerate field and respawn — don't stop animation
      initBoundary();
      generateVoronoiVectors();
      spawnAgents();
      trailBuffer.background(10, 12, 18);
    } else {
      initBoundary();
      generateVoronoiVectors();
      runSimulation();
    }
  }

  if (liveMode) {
    // Fade trails
    if (trailFade > 0) {
      trailBuffer.noStroke();
      trailBuffer.fill(10, 12, 18, trailFade);
      trailBuffer.rect(0, 0, width, height);
    }
    // Step agents and draw new segments onto trail buffer
    for (let s = 0; s < liveStepsPerFrame; s++) {
      updateLiveAgents();
    }
    // Render trail buffer to canvas
    background(10, 12, 18);
    image(trailBuffer, 0, 0);
  } else {
    background(10, 12, 18);
    drawAgents();
  }

  if (letterMode && showLetterOutline && letterRects.length > 0) {
    drawLetterRectsAndStrokes();
  }

  if (showVoronoi && voronoiDiagram) {
    drawVoronoiEdges();
  }

  if (showVectors) drawVectors();
  if (!liveMode) drawBirds();
  drawUI();
}

function drawVoronoiEdges() {
  if (!voronoiDiagram) return;
  stroke(50, 55, 75);
  strokeWeight(1);
  noFill();
  const polygons = voronoiDiagram.cellPolygons();
  for (const poly of polygons) {
    beginShape();
    for (let i = 0; i < poly.length; i++) {
      vertex(poly[i][0], poly[i][1]);
    }
    endShape(CLOSE);
  }
}

function drawBoundary() {
  noFill();
  stroke(80, 90, 120);
  strokeWeight(1.5);
  beginShape();
  for (const p of boundary) vertex(p.x, p.y);
  endShape(CLOSE);
}

function drawLetterRectsAndStrokes() {
  noFill();
  for (const letterRect of letterRects) {
    stroke(60, 80, 120, 100);
    strokeWeight(1);
    // rect(letterRect.x, letterRect.y, letterRect.w, letterRect.h);
    stroke(255);
    strokeWeight(1.5);
    for (const seg of letterRect.segments) {
      line(seg.x1, seg.y1, seg.x2, seg.y2);
    }
  }
}

function drawVectors() {
  for (let i = 0; i < vectors.length; i++) {
    const v = vectors[i];
    const end = p5.Vector.add(v.anchor, v.direction.copy().mult(36));
    const isDragging = i === draggingVectorIndex;
    stroke(isDragging ? 200 : 120, isDragging ? 220 : 180, 255);
    strokeWeight(isDragging ? 2.5 : 2);
    line(v.anchor.x, v.anchor.y, end.x, end.y);
    noStroke();
    fill(isDragging ? 200 : 120, isDragging ? 220 : 180, 255);
    circle(v.anchor.x, v.anchor.y, isDragging ? 8 : 6);
  }
}

/** Index of vector whose anchor is within VECTOR_HIT_RADIUS of (x,y), or -1. */
function getVectorIndexAt(x, y) {
  let best = -1;
  let bestD = VECTOR_HIT_RADIUS;
  for (let i = 0; i < vectors.length; i++) {
    const d = dist(x, y, vectors[i].anchor.x, vectors[i].anchor.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  // Don't start dragging if click is in param panel area
  if (mouseX > width - 250) return;
  draggingVectorIndex = getVectorIndexAt(mouseX, mouseY);
}

function mouseDragged() {
  if (draggingVectorIndex < 0) return;
  const v = vectors[draggingVectorIndex];
  const dx = mouseX - v.anchor.x;
  const dy = mouseY - v.anchor.y;
  const len = Math.hypot(dx, dy);
  if (len > 0.001) {
    v.direction.set(dx / len, dy / len);
  }
}

function mouseReleased() {
  if (draggingVectorIndex >= 0) {
    runSimulation();
    draggingVectorIndex = -1;
  }
}

function drawAgents() {
  for (const layer of layers) {
    const [r, g, b] = layer.color;
    stroke(r, g, b);
    strokeWeight(pathStrokeWeight);
    noFill();
    for (const path of layer.paths) {
      if (path.length < MIN_PATH_POINTS) continue;
      beginShape();
      for (const p of path) vertex(p.x, p.y);
      endShape();
    }
  }
}

/** Start live animation mode: spawn agents and let them move each frame. */
function startLiveMode() {
  liveMode = true;
  trailBuffer.background(10, 12, 18);
  layers = [];
  liveTrails = [];

  if (colorMode) {
    colorAgentGroups = [];
    colorLiveTrails  = [];
    colorVectorSets  = [];
    for (let i = 0; i < numColorLayers; i++) {
      generateVoronoiVectors();
      // deep-copy vectors so each group has its own independent field
      colorVectorSets.push(vectors.map(v => ({
        anchor:    v.anchor.copy(),
        direction: v.direction.copy()
      })));
      colorLiveTrails.push([]);
      spawnAgents();
      colorAgentGroups.push(agents.slice());
    }
    agents = [];
  } else {
    spawnAgents();
  }
}

/** One step of color live simulation: each group uses its own field and color. */
function updateColorLiveAgents() {
  trailBuffer.strokeWeight(pathStrokeWeight);
  for (let gi = 0; gi < colorAgentGroups.length; gi++) {
    const agentGroup = colorAgentGroups[gi];
    const vecs = colorVectorSets[gi];
    const [r, g, b] = COLOR_PALETTE[gi % COLOR_PALETTE.length];
    trailBuffer.stroke(r, g, b, 180);
    for (const a of agentGroup) {
      if (!a.active) continue;
      const prevX = a.pos.x, prevY = a.pos.y;
      let closest = null, dMin = Infinity;
      for (const v of vecs) {
        const d = p5.Vector.dist(a.pos, v.anchor);
        if (d < dMin) { dMin = d; closest = v; }
      }
      if (closest) {
        const blended = p5.Vector.add(a.heading.copy().mult(inertiaFactor), closest.direction.copy());
        blended.normalize();
        a.heading = blended;
      }
      a.pos.add(a.heading.copy().mult(stepSize));
      a.steps++;
      let dead = a.steps >= maxSteps;
      if (!dead) dead = a.boundRect ? !insideRect(a.pos, a.boundRect) : !insideBoundary(a.pos);
      if (dead) {
        a.active = false;
        if (a.path && a.path.length >= 2) colorLiveTrails[gi].push(a.path.map(p => ({ x: p.x, y: p.y })));
      } else {
        a.path.push(a.pos.copy());
        trailBuffer.line(prevX, prevY, a.pos.x, a.pos.y);
      }
    }
    respawnDeadAgents(agentGroup, vecs);
  }
}

/** One step of live simulation: move agents, draw segments, respawn dead ones. */
function updateLiveAgents() {
  if (colorMode && colorAgentGroups.length > 0) {
    updateColorLiveAgents();
    return;
  }
  const [r, g, b] = LAYER_COLOR;
  trailBuffer.stroke(r, g, b, 180);
  trailBuffer.strokeWeight(pathStrokeWeight);

  for (const a of agents) {
    if (!a.active) continue;

    const prevX = a.pos.x;
    const prevY = a.pos.y;

    // Find closest vector
    let closest = null;
    let dMin = Infinity;
    for (const v of vectors) {
      const d = p5.Vector.dist(a.pos, v.anchor);
      if (d < dMin) { dMin = d; closest = v; }
    }

    if (closest) {
      const blended = p5.Vector.add(
        a.heading.copy().mult(inertiaFactor),
        closest.direction.copy()
      );
      blended.normalize();
      a.heading = blended;
    }

    a.pos.add(a.heading.copy().mult(stepSize));
    a.steps++;

    // Boundary / max-step check
    let dead = a.steps >= maxSteps;
    if (!dead) {
      if (a.boundRect) {
        dead = !insideRect(a.pos, a.boundRect);
      } else {
        dead = !insideBoundary(a.pos);
      }
    }

    if (dead) {
      a.active = false;
      // Save completed path for SVG export
      if (a.path && a.path.length >= 2) {
        liveTrails.push(a.path.map(p => ({ x: p.x, y: p.y })));
      }
    } else {
      a.path.push(a.pos.copy());
      // Draw segment from previous to current position
      trailBuffer.line(prevX, prevY, a.pos.x, a.pos.y);
    }
  }

  // Respawn dead agents from boundary
  respawnDeadAgents();
}

/** Respawn inactive agents at new random boundary positions.
 *  agentArr and vecSet default to the global agents/vectors for mono mode. */
function respawnDeadAgents(agentArr, vecSet) {
  if (!agentArr) agentArr = agents;
  if (!vecSet)   vecSet   = vectors;
  for (const a of agentArr) {
    if (a.active) continue;

    let pt, boundRect = undefined;

    if (letterMode && letterRects.length > 0) {
      const rect = letterRects[floor(random(letterRects.length))];
      const { x, y, w, h } = rect;
      const t = random();
      const which = floor(random(4));
      if (which === 0) pt = createVector(x + t * w, y);
      else if (which === 1) pt = createVector(x + w, y + t * h);
      else if (which === 2) pt = createVector(x + (1 - t) * w, y + h);
      else pt = createVector(x, y + (1 - t) * h);
      boundRect = rect;
    } else {
      const perim = boundary.length;
      const side = floor(random(perim));
      const bA = boundary[side];
      const bB = boundary[(side + 1) % perim];
      pt = p5.Vector.lerp(bA, bB, random());
    }

    let closest = null;
    let dMin = Infinity;
    for (const v of vecSet) {
      const d = p5.Vector.dist(pt, v.anchor);
      if (d < dMin) { dMin = d; closest = v; }
    }

    a.pos = pt.copy();
    a.heading = closest ? closest.direction.copy() : createVector(random(-1, 1), random(-1, 1)).normalize();
    a.path = [pt.copy()];
    a.active = true;
    a.steps = 0;
    a.boundRect = boundRect;
  }
}

function updateAgents() {
  for (const a of agents) {
    if (!a.active) continue;
    if (a.boundRect) {
      if (!insideRect(a.pos, a.boundRect)) {
        a.active = false;
        continue;
      }
    } else if (!insideBoundary(a.pos)) {
      a.active = false;
      continue;
    }

    let closest = null;
    let dMin = Infinity;
    for (const v of vectors) {
      const d = p5.Vector.dist(a.pos, v.anchor);
      if (d < dMin) {
        dMin = d;
        closest = v;
      }
    }

    if (closest) {
      const blended = p5.Vector.add(
        a.heading.copy().mult(inertiaFactor),
        closest.direction.copy()
      );
      blended.normalize();
      a.heading = blended;
    }

    a.pos.add(a.heading.copy().mult(stepSize));
    a.path.push(a.pos.copy());
    a.steps++;
    if (a.steps >= maxSteps) a.active = false;
  }
}

function insideBoundary(p) {
  let inside = false;
  const n = boundary.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = boundary[i].x, yi = boundary[i].y;
    const xj = boundary[j].x, yj = boundary[j].y;
    if (((yi > p.y) !== (yj > p.y)) &&
        (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/** Run the full simulation to completion (blocking), return paths as array of point arrays. */
function runFullSimulation() {
  spawnAgents();
  if (agents.length === 0) return [];
  while (agents.some(a => a.active)) {
    updateAgents();
  }
  return agents.map(a => a.path.map(p => ({ x: p.x, y: p.y })));
}

/** Run N sims with fresh fields, each stored as a distinct color layer. */
function runColorSimulation() {
  layers = [];
  for (let i = 0; i < numColorLayers; i++) {
    generateVoronoiVectors();
    const paths = runFullSimulation();
    layers.push({ paths, color: COLOR_PALETTE[i % COLOR_PALETTE.length] });
  }
}

/** Run the sim once, store result in a single layer (white stroke). */
function runSimulation() {
  if (colorMode) {
    runColorSimulation();
  } else {
    const paths = runFullSimulation();
    layers = [{ paths, color: LAYER_COLOR }];
  }
  generateBirds();
}

function spawnAgents() {
  agents = [];
  if (vectors.length === 0) return;

  const pointsOnEdge = [];
  const keep = constrain(keepRatio, 0.01, 0.99);

  if (letterMode && letterRects.length > 0) {
    // Spawn on the boundary of each letter rect; lines flow inward following that letter's field
    const ptsPerEdge = max(4, floor(edgeSegments / 10));
    for (const rect of letterRects) {
      const { x, y, w, h } = rect;
      for (let i = 0; i < ptsPerEdge; i++) {
        const t = (i + 0.5) / ptsPerEdge;
        if (random() > keep) continue;
        // All four edges: top, right, bottom, left
        const which = floor(random(4));
        let pt;
        if (which === 0) pt = createVector(x + t * w, y);
        else if (which === 1) pt = createVector(x + w, y + t * h);
        else if (which === 2) pt = createVector(x + (1 - t) * w, y + h);
        else pt = createVector(x, y + (1 - t) * h);
        pointsOnEdge.push({ pt, boundRect: rect });
      }
    }
  } else {
    const segs = max(10, Math.floor(edgeSegments));
    for (let i = 0; i < boundary.length; i++) {
      const a = boundary[i];
      const b = boundary[(i + 1) % boundary.length];
      for (let t = 0; t < 1; t += 1 / segs) {
        const pt = p5.Vector.lerp(a, b, t);
        if (random() < keep) pointsOnEdge.push({ pt, boundRect: null });
      }
    }
    const maxInset = (min(width, height) / 2 - margin) * (centerFillPct / 100);
    for (let layer = 1; layer <= innerRectsCount; layer++) {
      const innerMargin = margin + maxInset * (layer / innerRectsCount);
      if (innerMargin <= margin + 10 || innerMargin >= width / 2 - 10 || innerMargin >= height / 2 - 10) continue;
      const innerBoundary = [
        createVector(innerMargin, innerMargin),
        createVector(width - innerMargin, innerMargin),
        createVector(width - innerMargin, height - innerMargin),
        createVector(innerMargin, height - innerMargin)
      ];
      for (let i = 0; i < innerBoundary.length; i++) {
        const a = innerBoundary[i];
        const b = innerBoundary[(i + 1) % innerBoundary.length];
        for (let t = 0; t < 1; t += 1 / segs) {
          const pt = p5.Vector.lerp(a, b, t);
          if (random() < keep) pointsOnEdge.push({ pt, boundRect: null });
        }
      }
    }
  }

  for (const { pt, boundRect } of pointsOnEdge) {
    const closest = vectors.reduce((best, v) => {
      const d = p5.Vector.dist(pt, v.anchor);
      return d < best.d ? { v, d } : best;
    }, { v: null, d: Infinity });

    if (closest.v) {
      agents.push({
        pos: pt.copy(),
        heading: closest.v.direction.copy(),
        path: [pt.copy()],
        active: true,
        steps: 0,
        boundRect: boundRect || undefined
      });
    }
  }
}

function drawUI() {
  return; // web embed: hide the bottom help/status text
  fill(200, 200, 210);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  const totalPaths = layers.length ? layers[0].paths.length : 0;
  const lines = [
    'Letter mode: flow follows typed text   Drag vectors to tweak   G: new field   R: re-run   V: Voronoi   E: export',
    `Paths: ${totalPaths}   Edge segs: ${edgeSegments}   Keep: ${(keepRatio * 100).toFixed(0)}%   Sites: ${vectors.length}`
  ];
  text(lines.join('   ·   '), 14, height - 28);
}

function keyPressed() {
  if (key === 'g' || key === 'G') {
    generateVoronoiVectors();
    runSimulation();
  }
  if (key === 'r' || key === 'R') {
    runSimulation();
  }
  if (key === 'v' || key === 'V') {
    showVoronoi = !showVoronoi;
    if (paramSliders.showVoronoi) paramSliders.showVoronoi.checked(showVoronoi);
  }
  if (key === 'e' || key === 'E') {
    if (colorMode) exportColorZip(); else exportLayersToSVG();
  }
  if (key === '+' || key === '=') {
    edgeSegments = min(400, edgeSegments + 30);
    keepRatio = min(0.95, keepRatio + 0.05);
    if (paramSliders.edgeSegments) paramSliders.edgeSegments.value(edgeSegments);
    if (paramSliders.keepRatio) paramSliders.keepRatio.value(round(keepRatio * 100));
  }
  if (key === '-') {
    edgeSegments = max(30, edgeSegments - 30);
    keepRatio = max(0.1, keepRatio - 0.05);
    if (paramSliders.edgeSegments) paramSliders.edgeSegments.value(edgeSegments);
    if (paramSliders.keepRatio) paramSliders.keepRatio.value(round(keepRatio * 100));
  }
  if (keyCode === UP_ARROW) {
    inertiaFactor = min(100, inertiaFactor + 5);
    if (paramSliders.inertiaFactor) paramSliders.inertiaFactor.value(inertiaFactor);
  }
  if (keyCode === DOWN_ARROW) {
    inertiaFactor = max(1, inertiaFactor - 5);
    if (paramSliders.inertiaFactor) paramSliders.inertiaFactor.value(inertiaFactor);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  trailBuffer = createGraphics(windowWidth, windowHeight);
  trailBuffer.background(10, 12, 18);
  initBoundary();
  generateVoronoiVectors();
  if (liveMode) {
    spawnAgents();
  } else {
    runSimulation();
  }
}

/** Pick perch positions along rendered paths and generate owl data. */
function generateBirds() {
  birds = [];
  if (!showBirds || layers.length === 0) return;

  const eligible = [];
  for (const layer of layers) {
    for (const path of layer.paths) {
      if (path.length >= MIN_PATH_POINTS * 2) eligible.push(path);
    }
  }
  if (eligible.length === 0) return;

  const count = min(numBirds, eligible.length);
  const usedPaths = [];

  for (let b = 0; b < count; b++) {
    let path;
    let attempts = 0;
    do {
      path = eligible[floor(random(eligible.length))];
      attempts++;
    } while (usedPaths.includes(path) && attempts < 30);
    usedPaths.push(path);

    const lo = floor(path.length * 0.2);
    const hi = floor(path.length * 0.8);
    const idx = floor(random(lo, hi));

    const pos = path[idx];
    const prev = path[max(0, idx - 3)];
    const next = path[min(path.length - 1, idx + 3)];
    const angle = atan2(next.y - prev.y, next.x - prev.x);

    const size = random(22, 44);

    const shape = {
      plump:      random(0.82, 1.35),
      headSize:   random(0.88, 1.18),
      eyeSize:    random(0.88, 1.25),
      hasTufts:   random() > 0.42,
      tuftLen:    random(0.4, 1.0),
      irisLook:   random(-0.35, 0.35),
      featherRows: floor(random(2, 6)),
      browTilt:   random(-0.2, 0.2),
    };

    birds.push({ x: pos.x, y: pos.y, angle, size, shape });
  }
}

/** Draw a single owl — front-facing, big eyes, perched on branch. */
function drawBird(bird) {
  push();
  translate(bird.x, bird.y);
  rotate(bird.angle);

  const s  = bird.size;
  const c  = LAYER_COLOR;
  const sw = max(0.8, s * 0.038);
  const sh = bird.shape;

  // key dimensions
  const bodyW  = s * (0.32 + sh.plump * 0.06);
  const bodyH  = s * 0.58;
  const bodyCy = -s * 0.32;

  const faceR  = s * 0.32 * sh.headSize;
  const faceCy = bodyCy - bodyH * 0.42;

  const eyeR      = s * 0.12 * sh.eyeSize;
  const eyeSpaceX = faceR * 0.46;
  const eyeY      = faceCy + faceR * 0.04;

  noFill();
  stroke(c[0], c[1], c[2]);

  // ── body: plump egg ──
  strokeWeight(sw);
  beginShape();
  vertex(0, -s * 0.02);
  bezierVertex(
     bodyW * 1.2,  -s * 0.06,
     bodyW * 1.25, bodyCy - bodyH * 0.38,
     0,            bodyCy - bodyH * 0.52
  );
  bezierVertex(
    -bodyW * 1.25, bodyCy - bodyH * 0.38,
    -bodyW * 1.2,  -s * 0.06,
     0,            -s * 0.02
  );
  endShape();

  // ── facial disc ──
  strokeWeight(sw);
  ellipse(0, faceCy, faceR * 2, faceR * 1.88);

  // inner disc arcs (feathered rings around face)
  strokeWeight(sw * 0.3);
  arc(0, faceCy, faceR * 1.55, faceR * 1.45, PI * 0.55, PI * 1.05);
  arc(0, faceCy, faceR * 1.55, faceR * 1.45, PI * 1.95, PI * 2.45);

  // ── eyes — outer rings ──
  strokeWeight(sw * 0.9);
  ellipse(-eyeSpaceX, eyeY, eyeR * 2.2, eyeR * 2.2);
  ellipse( eyeSpaceX, eyeY, eyeR * 2.2, eyeR * 2.2);

  // irises
  const irisR = eyeR * 0.62;
  const lookX = sh.irisLook * eyeR * 0.28;
  strokeWeight(sw * 0.6);
  ellipse(-eyeSpaceX + lookX, eyeY, irisR * 2, irisR * 2);
  ellipse( eyeSpaceX + lookX, eyeY, irisR * 2, irisR * 2);

  // pupils (filled)
  fill(c[0], c[1], c[2]);
  noStroke();
  const pupilR = eyeR * 0.34;
  circle(-eyeSpaceX + lookX, eyeY, pupilR * 2);
  circle( eyeSpaceX + lookX, eyeY, pupilR * 2);

  // highlight dots (background-colored, gives life)
  fill(10, 12, 18);
  const hiR = max(0.8, eyeR * 0.14);
  circle(-eyeSpaceX + lookX + eyeR * 0.12, eyeY - eyeR * 0.14, hiR);
  circle( eyeSpaceX + lookX + eyeR * 0.12, eyeY - eyeR * 0.14, hiR);

  // ── brow lines ──
  noFill();
  stroke(c[0], c[1], c[2]);
  strokeWeight(sw * 0.7);
  const browY = eyeY - eyeR * 1.25;
  arc(-eyeSpaceX, browY + sh.browTilt * s * 0.1,
      eyeR * 1.7, eyeR * 0.55, PI * 1.08, PI * 1.92);
  arc( eyeSpaceX, browY - sh.browTilt * s * 0.1,
      eyeR * 1.7, eyeR * 0.55, PI * 1.08, PI * 1.92);

  // ── beak: small downward curve ──
  strokeWeight(sw * 0.65);
  const beakTop = eyeY + eyeR * 0.85;
  const beakBot = beakTop + s * 0.08;
  bezier(
    -s * 0.04, beakTop,
    -s * 0.012, beakBot,
     s * 0.012, beakBot,
     s * 0.04, beakTop
  );

  // ── ear tufts ──
  if (sh.hasTufts) {
    strokeWeight(sw * 0.85);
    const tb = faceCy - faceR * 0.88;
    const th = s * (0.14 + sh.tuftLen * 0.16);
    // left tuft — two wispy curves
    bezier(-faceR * 0.42, tb, -faceR * 0.62, tb - th * 0.45,
           -faceR * 0.68, tb - th * 0.8, -faceR * 0.48, tb - th);
    strokeWeight(sw * 0.55);
    bezier(-faceR * 0.28, tb, -faceR * 0.46, tb - th * 0.5,
           -faceR * 0.52, tb - th * 0.75, -faceR * 0.38, tb - th * 0.92);
    // right tuft
    strokeWeight(sw * 0.85);
    bezier( faceR * 0.42, tb,  faceR * 0.62, tb - th * 0.45,
            faceR * 0.68, tb - th * 0.8,  faceR * 0.48, tb - th);
    strokeWeight(sw * 0.55);
    bezier( faceR * 0.28, tb,  faceR * 0.46, tb - th * 0.5,
            faceR * 0.52, tb - th * 0.75,  faceR * 0.38, tb - th * 0.92);
  }

  // ── wing folds ──
  strokeWeight(sw * 0.55);
  bezier(-bodyW * 0.22, bodyCy - bodyH * 0.22,
         -bodyW * 0.95, bodyCy - bodyH * 0.02,
         -bodyW * 0.88, bodyCy + bodyH * 0.32,
         -bodyW * 0.18, bodyCy + bodyH * 0.42);
  bezier( bodyW * 0.22, bodyCy - bodyH * 0.22,
          bodyW * 0.95, bodyCy - bodyH * 0.02,
          bodyW * 0.88, bodyCy + bodyH * 0.32,
          bodyW * 0.18, bodyCy + bodyH * 0.42);

  // ── chest feather chevrons ──
  strokeWeight(sw * 0.32);
  for (let i = 0; i < sh.featherRows; i++) {
    const fy = bodyCy + bodyH * (-0.02 + i * 0.13);
    const fw = bodyW * (0.50 - i * 0.045);
    bezier(-fw, fy, -fw * 0.3, fy + s * 0.032,
            fw * 0.3, fy + s * 0.032, fw, fy);
  }

  // ── talons ──
  strokeWeight(sw * 0.4);
  bezier( s * 0.05, -s * 0.02,  s * 0.06, -s * 0.005,  s * 0.04, s * 0.002,  s * 0.02, 0);
  bezier( s * 0.035,-s * 0.018, s * 0.055, s * 0.002,  s * 0.05, s * 0.008,  s * 0.03, 0.004);
  bezier(-s * 0.05, -s * 0.02, -s * 0.06, -s * 0.005, -s * 0.04, s * 0.002, -s * 0.02, 0);
  bezier(-s * 0.035,-s * 0.018,-s * 0.055, s * 0.002, -s * 0.05, s * 0.008, -s * 0.03, 0.004);

  pop();
}

/** Draw all birds. */
function drawBirds() {
  if (!showBirds) return;
  for (const bird of birds) {
    drawBird(bird);
  }
}

/** Collect all paths for a given color layer index. */
function getPathsForLayer(li) {
  // Live color mode: completed trails + in-flight agent paths
  if (colorMode && colorLiveTrails.length > 0) {
    const out = [];
    if (li < colorLiveTrails.length)  for (const p of colorLiveTrails[li])  out.push(p);
    if (li < colorAgentGroups.length) for (const a of colorAgentGroups[li]) {
      if (a.path && a.path.length >= 2) out.push(a.path.map(p => ({ x: p.x, y: p.y })));
    }
    return out;
  }
  // Static color mode: from layers array
  return li < layers.length ? layers[li].paths : [];
}

/** Build a single-layer SVG string. */
function buildLayerSVG(li, paths) {
  const w = width, h = height;
  const [r, g, b] = COLOR_PALETTE[li % COLOR_PALETTE.length];
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0a0a0a"/>
  <g id="layer-${li}" stroke="rgb(${r},${g},${b})" stroke-width="${pathStrokeWeight}" fill="none">
`;
  for (const path of paths) {
    if (path.length < 2) continue;
    const d = path.map((p, j) => (j === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
    svg += `    <path d="${d}"/>\n`;
  }
  svg += '  </g>\n</svg>';
  return svg;
}

/** Download a ZIP containing one SVG per color layer. */
async function exportColorZip() {
  const count = colorMode ? numColorLayers : layers.length;
  if (count === 0) return;
  const zip = new JSZip();
  for (let li = 0; li < count; li++) {
    const paths = getPathsForLayer(li);
    const name  = COLOR_NAMES[li % COLOR_NAMES.length];
    zip.file(`layer-${li + 1}-${name}.svg`, buildLayerSVG(li, paths));
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daddylandscape-colors.zip';
  a.click();
  URL.revokeObjectURL(url);
}

/** Export mono (white) SVG — all paths in a single group. */
function exportLayersToSVG() {
  const w = width, h = height;
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0a0a0a"/>
`;
  const allPaths = [];
  for (const layer of layers) for (const path of layer.paths) allPaths.push(path);
  for (const path of liveTrails) allPaths.push(path);
  if (liveMode) for (const a of agents) {
    if (a.path && a.path.length >= 2) allPaths.push(a.path.map(p => ({ x: p.x, y: p.y })));
  }
  const [r, g, b] = LAYER_COLOR;
  svg += `  <g id="trails" stroke="rgb(${r},${g},${b})" stroke-width="${pathStrokeWeight}" fill="none">\n`;
  for (const path of allPaths) {
    if (path.length < 2) continue;
    const d = path.map((p, j) => (j === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
    svg += `    <path d="${d}"/>\n`;
  }
  svg += '  </g>\n</svg>';
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daddylandscape-layers.svg';
  a.click();
  URL.revokeObjectURL(url);
}
