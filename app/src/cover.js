// cover.js — the single source of truth for what a VICE FRAME cover looks like.
//
// The editor preview, the exported PNG and the entry screenshots are all painted by drawCover()
// below, so what you see while editing is byte-for-byte the composition you download. A cover is
// three layers, back to front:
//
//   1. a Vice City sunset backdrop (gradient sky, banded sun, skyline, palm silhouettes),
//   2. a collage of photo panels in the genre's white-bordered grid, each with its own
//      neon "Vice grade", and
//   3. the lettering: a small eyebrow line, the heavy outlined title, a pill subtitle.
//
// All geometry is stored as fractions of the canvas, so one template definition renders at
// every export size without distortion.

/** Panel layouts. Each panel is {x, y, w, h, tilt} in canvas fractions; tilt is in degrees. */
export const TEMPLATES = {
  boxart: {
    label: 'Box Art',
    panels: [
      { x: 0.015, y: 0.015, w: 0.63, h: 0.60, tilt: 0 },
      { x: 0.665, y: 0.015, w: 0.32, h: 0.29, tilt: 0 },
      { x: 0.665, y: 0.325, w: 0.32, h: 0.29, tilt: 0 },
      { x: 0.015, y: 0.635, w: 0.475, h: 0.35, tilt: 0 },
      { x: 0.51, y: 0.635, w: 0.475, h: 0.35, tilt: 0 },
    ],
  },
  triptych: {
    label: 'Triptych',
    panels: [
      { x: 0.03, y: 0.06, w: 0.30, h: 0.86, tilt: -2.2 },
      { x: 0.35, y: 0.03, w: 0.30, h: 0.90, tilt: 0 },
      { x: 0.67, y: 0.06, w: 0.30, h: 0.86, tilt: 2.2 },
    ],
  },
  hero: {
    label: 'Hero',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0, tilt: 0 }],
  },
  strip: {
    label: 'Photo Strip',
    panels: [
      { x: 0.015, y: 0.015, w: 0.97, h: 0.55, tilt: 0 },
      { x: 0.015, y: 0.585, w: 0.31, h: 0.40, tilt: 0 },
      { x: 0.345, y: 0.585, w: 0.31, h: 0.40, tilt: 0 },
      { x: 0.675, y: 0.585, w: 0.31, h: 0.40, tilt: 0 },
    ],
  },
};

/** The export sizes people actually post, keyed by the name the editor shows in its picker. */
export const SIZES = {
  post: { label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  story: { label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

/** The cover's fixed colours, in one place so the grade and the lettering stay in tune. */
const INK = '#12041f'; // title outline and subtitle pill
const GOLD = '#ffd166'; // eyebrow line
const SILHOUETTE = 'rgba(12, 4, 28, 0.95)'; // palms and skyline

const TITLE_STACK = '"Arial Black", "Franklin Gothic Heavy", Impact, sans-serif';
const DEG = Math.PI / 180;

/** Looks up a template by name, falling back to Box Art for anything unknown. */
function templateOf(name) {
  return TEMPLATES[name] ?? TEMPLATES.boxart;
}

// --------------------------------------------------------------------------- backdrop

/** The sunset sky with its banded sun, a few early stars, the skyline and two palms. */
function paintBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0.0, '#1b0f3a');
  sky.addColorStop(0.34, '#5b1a6e');
  sky.addColorStop(0.58, '#c92a6d');
  sky.addColorStop(0.78, '#ff7a3c');
  sky.addColorStop(1.0, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  paintStars(ctx, w, h);
  paintSun(ctx, w, h);
  paintSkyline(ctx, w, h);
  paintPalm(ctx, w * 0.055, h * 0.99, h * 0.34, 1);
  paintPalm(ctx, w * 0.955, h * 0.99, h * 0.40, -1);
}

/** A sparse field of faint stars in the dark upper sky, placed by a seeded walk so the
 *  picture is identical on every redraw (no twinkle-flicker while dragging a photo). */
function paintStars(ctx, w, h) {
  let seed = 20260526;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i += 1) {
    const x = next() * w;
    const y = next() * h * 0.30;
    const r = 0.7 + next() * 1.3;
    ctx.globalAlpha = 0.10 + next() * 0.30;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The low sun, sliced by dark bands the way retro travel posters print it. */
function paintSun(ctx, w, h) {
  const radius = w * 0.30;
  const cx = w * 0.5;
  const cy = h * 0.60;
  const glow = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  glow.addColorStop(0, '#ffe259');
  glow.addColorStop(1, '#ff7518');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = glow;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.fillStyle = 'rgba(27, 15, 58, 0.85)';
  for (let band = 0; band < 5; band += 1) {
    const bandY = cy + radius * (0.08 + band * 0.17);
    ctx.fillRect(cx - radius, bandY, radius * 2, radius * (0.018 + band * 0.012));
  }
  ctx.restore();
}

/** A row of tower silhouettes along the foot of the cover, heights varied for a skyline feel. */
function paintSkyline(ctx, w, h) {
  const towers = [
    [0.04, 0.16], [0.10, 0.24], [0.16, 0.13], [0.23, 0.28], [0.31, 0.18],
    [0.38, 0.22], [0.46, 0.12], [0.55, 0.26], [0.62, 0.15], [0.70, 0.21],
    [0.77, 0.13], [0.85, 0.25], [0.92, 0.17],
  ];
  ctx.save();
  ctx.fillStyle = 'rgba(16, 6, 34, 0.9)';
  for (const [fx, fh] of towers) ctx.fillRect(w * fx, h - h * fh, w * 0.055, h * fh);
  ctx.fillRect(0, h - h * 0.015, w, h * 0.015); // the promenade strip they stand on
  ctx.restore();
}

/** One palm tree: a curved trunk leaning `lean` ways, crowned by a fan of drooping fronds. */
function paintPalm(ctx, baseX, baseY, size, lean) {
  ctx.save();
  ctx.strokeStyle = SILHOUETTE;
  ctx.lineCap = 'round';

  const crownX = baseX + lean * size * 0.30;
  const crownY = baseY - size * 0.92;
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * size * 0.10, baseY - size * 0.55, crownX, crownY);
  ctx.stroke();

  // Seven fronds fanned from straight-left to straight-right, each drooping at its tip.
  ctx.lineWidth = size * 0.028;
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (i / 6); // 0 = pointing right, π = pointing left
    const reach = size * (0.34 + (i % 3) * 0.07);
    const tipX = crownX + Math.cos(angle) * reach;
    const tipY = crownY - Math.sin(angle) * reach * 0.34 + size * 0.13;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + Math.cos(angle) * reach * 0.5, crownY - size * 0.16, tipX, tipY);
    ctx.stroke();
  }
  ctx.restore();
}

// --------------------------------------------------------------------------- panels

/** The neon grade laid over one photo: a filter lift plus a purple-to-pink duotone wash.
 *  `grade` runs 0 (the photo untouched) to 1 (full Vice City neon). */
function layGrade(ctx, width, height, grade) {
  if (grade <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, `rgba(64, 0, 128, ${0.55 * grade})`);
  wash.addColorStop(0.5, 'rgba(128, 128, 128, 0)');
  wash.addColorStop(1, `rgba(255, 46, 136, ${0.55 * grade})`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255, 140, 40, ${0.6 * grade})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Runs `draw` with the context moved and rotated into a panel's own coordinate frame,
 *  so panel contents can be painted in plain 0..pw / 0..ph coordinates. */
function inPanelFrame(ctx, panel, w, h, draw) {
  const pw = panel.w * w;
  const ph = panel.h * h;
  ctx.save();
  ctx.translate(panel.x * w + pw / 2, panel.y * h + ph / 2);
  ctx.rotate(panel.tilt * DEG);
  ctx.translate(-pw / 2, -ph / 2);
  draw(pw, ph);
  ctx.restore();
}

/** Paints one panel: its photo (cover-fit, panned, zoomed, graded) or an invitation to
 *  add one, then the white frame that defines the genre's collage look. */
function paintPanel(ctx, panel, slot, panelNumber, w, h) {
  inPanelFrame(ctx, panel, w, h, (pw, ph) => {
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (slot?.image) paintPhoto(ctx, slot, pw, ph);
    else paintEmptyPanel(ctx, pw, ph, panelNumber);
  });

  inPanelFrame(ctx, panel, w, h, (pw, ph) => {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = w * 0.012;
    ctx.shadowOffsetY = w * 0.004;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, w * 0.011);
    ctx.strokeRect(0, 0, pw, ph);
  });
}

/** Draws a slot's photo so it covers the panel, honouring the slot's pan, zoom and grade. */
function paintPhoto(ctx, slot, pw, ph) {
  const img = slot.image;
  const grade = slot.grade ?? 0.65;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * (slot.zoom ?? 1);
  const drawnW = img.naturalWidth * scale;
  const drawnH = img.naturalHeight * scale;
  const offsetX = (pw - drawnW) / 2 + (slot.panX ?? 0) * pw * 0.25;
  const offsetY = (ph - drawnH) / 2 + (slot.panY ?? 0) * ph * 0.25;
  ctx.filter = `saturate(${1 + 0.55 * grade}) contrast(${1 + 0.16 * grade}) brightness(${1 + 0.04 * grade})`;
  ctx.drawImage(img, offsetX, offsetY, drawnW, drawnH);
  ctx.filter = 'none';
  layGrade(ctx, pw, ph, grade);
}

/** An unfilled panel: a dusk gradient with its number and a two-line invitation. */
function paintEmptyPanel(ctx, pw, ph, panelNumber) {
  const dusk = ctx.createLinearGradient(0, 0, pw, ph);
  dusk.addColorStop(0, '#3a1658');
  dusk.addColorStop(1, '#8f2060');
  ctx.fillStyle = dusk;
  ctx.fillRect(0, 0, pw, ph);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round(ph * 0.062)}px system-ui, sans-serif`;
  ctx.fillText(`PANEL ${panelNumber}`, pw / 2, ph / 2 - ph * 0.02);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.font = `500 ${Math.round(ph * 0.042)}px system-ui, sans-serif`;
  ctx.fillText('add a photo or a sample', pw / 2, ph / 2 + ph * 0.055);
}

/** A dashed neon outline over the panel the editor is currently working on. Editor-only:
 *  the export path calls drawCover() without a selection, so this never reaches a PNG. */
function paintSelection(ctx, panel, w, h) {
  inPanelFrame(ctx, panel, w, h, (pw, ph) => {
    ctx.strokeStyle = '#ff2e88';
    ctx.lineWidth = Math.max(3, w * 0.008);
    ctx.setLineDash([w * 0.018, w * 0.012]);
    ctx.lineDashOffset = w * 0.006;
    const inset = w * 0.014;
    ctx.strokeRect(inset, inset, pw - inset * 2, ph - inset * 2);
    ctx.setLineDash([]);
  });
}

// --------------------------------------------------------------------------- lettering

/** Sets letterSpacing where the engine supports it; older engines simply go without. */
function setTracking(ctx, px) {
  try { ctx.letterSpacing = `${px}px`; } catch { /* property unsupported: no tracking */ }
}

/** Shrinks `size` until `text` fits `maxWidth` in the context's current font, and returns
 *  the size that fits. Used by the eyebrow and the title so long words never spill. */
function fitFontSize(ctx, text, maxWidth, size, step, fontFor) {
  while (size > 9) {
    ctx.font = fontFor(size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= step;
  }
  ctx.font = fontFor(size);
  return size;
}

/** The lettering block at the top of the cover: eyebrow, title, subtitle pill. Any of the
 *  three may be left blank, in which case it (and its share of the space) simply vanishes. */
function paintLettering(ctx, w, h, state) {
  const eyebrow = (state.eyebrow ?? '').trim().toUpperCase();
  const title = (state.title ?? '').trim().toUpperCase();
  const subtitle = (state.subtitle ?? '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  let cursorY = h * 0.055;

  if (eyebrow) {
    const fontFor = (s) => `700 ${s}px system-ui, sans-serif`;
    let size = h * 0.030;
    setTracking(ctx, size * 0.40);
    size = fitFontSize(ctx, eyebrow, w * 0.88, size, 1, fontFor);
    setTracking(ctx, size * 0.40);
    ctx.fillStyle = GOLD;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = size * 0.3;
    ctx.fillText(eyebrow, w / 2, cursorY + size);
    setTracking(ctx, 0);
    cursorY += size * 1.7;
  }

  if (title) {
    const fontFor = (s) => `italic 900 ${s}px ${TITLE_STACK}`;
    const size = fitFontSize(ctx, title, w * 0.92, h * 0.115, 3, fontFor);
    ctx.save();
    ctx.translate(w / 2, cursorY + size * 0.92);
    ctx.rotate(-0.018); // the genre's slight forward lean
    ctx.font = fontFor(size);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.06;
    ctx.lineWidth = size * 0.20;
    ctx.strokeStyle = INK;
    ctx.strokeText(title, 0, 0);
    ctx.shadowColor = 'transparent';
    const fill = ctx.createLinearGradient(0, -size, 0, size * 0.25);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.75, '#ffe9f4');
    fill.addColorStop(1, '#ffb3d9');
    ctx.fillStyle = fill;
    ctx.fillText(title, 0, 0);
    ctx.restore();
    cursorY += size * 1.25;
  }

  if (subtitle) {
    const size = h * 0.026;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    setTracking(ctx, size * 0.34);
    const pillW = ctx.measureText(subtitle).width + size * 2.4;
    const pillH = size * 2.0;
    const pillY = cursorY + size * 0.4;
    ctx.fillStyle = 'rgba(10, 2, 24, 0.82)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - pillW / 2, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'transparent';
    ctx.fillText(subtitle, w / 2, pillY + pillH * 0.68);
    setTracking(ctx, 0);
  }
  ctx.restore();
}

// --------------------------------------------------------------------------- finish + entry points

/** The last pass over the whole cover: a soft vignette and a breath of print grain. */
function paintFinish(ctx, w, h) {
  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(8, 0, 20, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Deterministic grain (same seeded walk as the stars) so redraws never shimmer.
  let seed = 19860526;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 260; i += 1) {
    ctx.globalAlpha = next() * 0.05;
    ctx.fillRect(next() * w, next() * h, 1.4, 1.4);
  }
  ctx.restore();
}

/**
 * Paints the whole cover onto `canvas` at the canvas's own pixel size.
 * state: { template, slots: [{image, panX, panY, zoom, grade}], title, eyebrow, subtitle }.
 * `selectedIndex` (editor only) outlines that panel; leave it -1 for exports and screenshots.
 */
export function drawCover(canvas, state, selectedIndex = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const { panels } = templateOf(state.template);
  paintBackdrop(ctx, w, h);
  panels.forEach((panel, index) => paintPanel(ctx, panel, state.slots[index] ?? null, index + 1, w, h));
  if (selectedIndex >= 0 && panels[selectedIndex]) paintSelection(ctx, panels[selectedIndex], w, h);
  paintLettering(ctx, w, h, state);
  paintFinish(ctx, w, h);
}

/** A template's panel rectangles in canvas pixels — the editor's hit-testing map. */
export function panelRects(templateName, w, h) {
  return templateOf(templateName).panels.map((panel) => ({
    x: panel.x * w,
    y: panel.y * h,
    w: panel.w * w,
    h: panel.h * h,
    tilt: panel.tilt,
  }));
}
