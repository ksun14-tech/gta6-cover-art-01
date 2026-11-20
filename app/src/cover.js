// cover.js — everything a VICE FRAME cover looks like lives in this one module.
//
// The editor preview, the exported PNG and the entry screenshots are all produced by
// drawCover() at the bottom of this file, so the composition a user tunes on screen is
// exactly the composition they download. A cover is painted in four passes:
//
//   backdrop  — gradient dusk sky, seeded stars, the banded retro sun, skyline, palms
//   panels    — the white-bordered photo collage defined by the chosen template
//   lettering — eyebrow line, heavy outlined title, subtitle pill, all auto-fitted
//   finish    — vignette plus a whisper of deterministic print grain
//
// Coordinates inside a template are fractions of the canvas, never pixels, which is
// what lets one layout serve the square post, the portrait, the story and the wide
// export without any of them distorting.

/** The four panel layouts. A panel is {x, y, w, h, tilt}: position and size as canvas
 *  fractions, tilt in degrees (the Triptych leans its outer panels for energy). */
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
    panels: [{ x: 0, y: 0, w: 1, h: 1, tilt: 0 }],
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

/** Export sizes, keyed by the short name the editor and the shot URLs both use. */
export const SIZES = {
  post: { label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  story: { label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

const INK = '#12041f'; // title outline, subtitle pill
const GOLD = '#ffd166'; // eyebrow text
const NEON = '#ff2e88'; // selection outline, grade's pink pole
const DUSK = 'rgba(12, 4, 28, 0.95)'; // silhouette colour for palms and towers

const TITLE_FONTS = '"Arial Black", "Franklin Gothic Heavy", Impact, sans-serif';
const RADIANS = Math.PI / 180;

/** Template lookup with the Box Art layout as the universal fallback. */
function layout(name) {
  return TEMPLATES[name] ?? TEMPLATES.boxart;
}

/** A tiny deterministic PRNG (linear congruential). Stars and grain draw from fixed
 *  seeds so a cover repaints identically on every redraw — nothing flickers while
 *  the user drags a photo around. */
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

// ------------------------------------------------------------- the backdrop

/** Pass 1: the Vice City sunset the panels float over. */
function drawBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b0f3a');
  sky.addColorStop(0.34, '#5b1a6e');
  sky.addColorStop(0.58, '#c92a6d');
  sky.addColorStop(0.78, '#ff7a3c');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  drawStars(ctx, w, h);
  drawSun(ctx, w, h);
  drawHorizonGlow(ctx, w, h);
  drawSkyline(ctx, w, h);
  drawPalm(ctx, w * 0.055, h * 0.99, h * 0.34, 1);
  drawPalm(ctx, w * 0.955, h * 0.99, h * 0.40, -1);
}

/** Faint early stars, only in the dark band at the top of the sky. */
function drawStars(ctx, w, h) {
  const next = seededRandom(20260526);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i += 1) {
    ctx.globalAlpha = 0.10 + next() * 0.30;
    ctx.beginPath();
    ctx.arc(next() * w, next() * h * 0.30, 0.7 + next() * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The low sun, cut into horizontal bands like a screen-printed travel poster. */
function drawSun(ctx, w, h) {
  const r = w * 0.30;
  const cx = w / 2;
  const cy = h * 0.60;
  const heat = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  heat.addColorStop(0, '#ffe259');
  heat.addColorStop(1, '#ff7518');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = heat;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(27, 15, 58, 0.85)';
  for (let band = 0; band < 5; band += 1) {
    ctx.fillRect(cx - r, cy + r * (0.08 + band * 0.17), r * 2, r * (0.018 + band * 0.012));
  }
  ctx.restore();
}

/** A soft bloom of light where the sun meets the skyline, so the horizon feels hot. */
function drawHorizonGlow(ctx, w, h) {
  const glow = ctx.createRadialGradient(w / 2, h * 0.86, 0, w / 2, h * 0.86, w * 0.55);
  glow.addColorStop(0, 'rgba(255, 150, 60, 0.35)');
  glow.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

/** Tower silhouettes along the bottom edge, standing on a thin promenade line. */
function drawSkyline(ctx, w, h) {
  const towers = [
    [0.04, 0.16], [0.10, 0.24], [0.16, 0.13], [0.23, 0.28], [0.31, 0.18],
    [0.38, 0.22], [0.46, 0.12], [0.55, 0.26], [0.62, 0.15], [0.70, 0.21],
    [0.77, 0.13], [0.85, 0.25], [0.92, 0.17],
  ];
  ctx.save();
  ctx.fillStyle = 'rgba(16, 6, 34, 0.9)';
  for (const [fx, fh] of towers) ctx.fillRect(w * fx, h * (1 - fh), w * 0.055, h * fh);
  ctx.fillRect(0, h * 0.985, w, h * 0.015);
  ctx.restore();
}

/** A single palm: curved trunk plus seven fronds fanned from its crown. `lean` is
 *  +1 or -1 and flips the whole tree so the pair at the edges lean inward. */
function drawPalm(ctx, baseX, baseY, size, lean) {
  const crownX = baseX + lean * size * 0.30;
  const crownY = baseY - size * 0.92;
  ctx.save();
  ctx.strokeStyle = DUSK;
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * size * 0.10, baseY - size * 0.55, crownX, crownY);
  ctx.stroke();
  ctx.lineWidth = size * 0.028;
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (i / 6); // sweeps from pointing right round to pointing left
    const reach = size * (0.34 + (i % 3) * 0.07);
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(angle) * reach * 0.5,
      crownY - size * 0.16,
      crownX + Math.cos(angle) * reach,
      crownY - Math.sin(angle) * reach * 0.34 + size * 0.13,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------- the panels

/** Executes `paint` inside a panel's local frame: origin at the panel's top-left,
 *  axes unrotated, units in panel pixels. Restores the context afterwards. */
function withPanelTransform(ctx, panel, w, h, paint) {
  const pw = panel.w * w;
  const ph = panel.h * h;
  ctx.save();
  ctx.translate(panel.x * w + pw / 2, panel.y * h + ph / 2);
  ctx.rotate(panel.tilt * RADIANS);
  ctx.translate(-pw / 2, -ph / 2);
  paint(pw, ph);
  ctx.restore();
}

/** The "Vice grade": a CSS-filter lift followed by a purple-to-pink overlay wash and
 *  a warm soft-light pass. grade 0 leaves the photo alone; 1 is full neon. */
function applyGrade(ctx, pw, ph, grade) {
  if (grade <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, 0, 0, ph);
  wash.addColorStop(0, `rgba(64, 0, 128, ${0.55 * grade})`);
  wash.addColorStop(0.5, 'rgba(128, 128, 128, 0)');
  wash.addColorStop(1, `rgba(255, 46, 136, ${0.55 * grade})`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, pw, ph);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255, 140, 40, ${0.6 * grade})`;
  ctx.fillRect(0, 0, pw, ph);
  ctx.restore();
}

/** Cover-fits a slot's photo into its panel: scale to fill, centre, then shift by
 *  the slot's pan (a quarter-panel of travel at full deflection) and grade it. */
function drawPhoto(ctx, slot, pw, ph) {
  const img = slot.image;
  const grade = slot.grade ?? 0.65;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * (slot.zoom ?? 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (pw - dw) / 2 + (slot.panX ?? 0) * pw * 0.25;
  const dy = (ph - dh) / 2 + (slot.panY ?? 0) * ph * 0.25;
  ctx.filter = `saturate(${1 + 0.55 * grade}) contrast(${1 + 0.16 * grade}) brightness(${1 + 0.04 * grade})`;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  applyGrade(ctx, pw, ph, grade);
}

/** What an empty panel shows: a dusk gradient, its number, and a plain invitation. */
function drawPlaceholder(ctx, pw, ph, number) {
  const dusk = ctx.createLinearGradient(0, 0, pw, ph);
  dusk.addColorStop(0, '#3a1658');
  dusk.addColorStop(1, '#8f2060');
  ctx.fillStyle = dusk;
  ctx.fillRect(0, 0, pw, ph);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `700 ${Math.round(ph * 0.062)}px system-ui, sans-serif`;
  ctx.fillText(`PANEL ${number}`, pw / 2, ph / 2 - ph * 0.02);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.font = `500 ${Math.round(ph * 0.042)}px system-ui, sans-serif`;
  ctx.fillText('add a photo or a sample', pw / 2, ph / 2 + ph * 0.055);
}

/** Pass 2, one panel: clipped content first (photo or placeholder), then the white
 *  frame with its drop shadow — the frame is the genre's signature, so it is stroked
 *  in a second transform pass to keep the shadow outside the clip. */
function drawPanel(ctx, panel, slot, number, w, h) {
  withPanelTransform(ctx, panel, w, h, (pw, ph) => {
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (slot?.image) drawPhoto(ctx, slot, pw, ph);
    else drawPlaceholder(ctx, pw, ph, number);
  });
  withPanelTransform(ctx, panel, w, h, (pw, ph) => {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = w * 0.012;
    ctx.shadowOffsetY = w * 0.004;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, w * 0.011);
    ctx.strokeRect(0, 0, pw, ph);
  });
}

/** The editor's dashed neon outline around the panel being edited. drawCover only
 *  paints it when a selection index is passed, which exports and cover shots never
 *  do — so it can never leak into a finished cover. */
function drawSelection(ctx, panel, w, h) {
  withPanelTransform(ctx, panel, w, h, (pw, ph) => {
    const inset = w * 0.014;
    ctx.strokeStyle = NEON;
    ctx.lineWidth = Math.max(3, w * 0.008);
    ctx.setLineDash([w * 0.018, w * 0.012]);
    ctx.lineDashOffset = w * 0.006;
    ctx.strokeRect(inset, inset, pw - inset * 2, ph - inset * 2);
    ctx.setLineDash([]);
  });
}

// ------------------------------------------------------------- the lettering

/** letterSpacing is not universal; where assigning it throws, tracking is skipped. */
function setTracking(ctx, px) {
  try { ctx.letterSpacing = `${px}px`; } catch { /* engine without letterSpacing */ }
}

/** Walks a font size down until `text` fits `maxWidth`, leaving the fitting font set
 *  on the context. Returns the size that fit. */
function fitText(ctx, text, maxWidth, startSize, step, fontAt) {
  let size = startSize;
  ctx.font = fontAt(size);
  while (size > 9 && ctx.measureText(text).width > maxWidth) {
    size -= step;
    ctx.font = fontAt(size);
  }
  return size;
}

/** Pass 3: the lettering block. Each of eyebrow/title/subtitle is optional; an empty
 *  one takes no space. The block starts at 5.5% of the height and flows downward. */
function drawLettering(ctx, w, h, state) {
  const eyebrow = (state.eyebrow ?? '').trim().toUpperCase();
  const title = (state.title ?? '').trim().toUpperCase();
  const subtitle = (state.subtitle ?? '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  let y = h * 0.055;

  if (eyebrow) {
    const fontAt = (s) => `700 ${s}px system-ui, sans-serif`;
    setTracking(ctx, h * 0.030 * 0.40);
    const size = fitText(ctx, eyebrow, w * 0.88, h * 0.030, 1, fontAt);
    setTracking(ctx, size * 0.40);
    ctx.fillStyle = GOLD;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = size * 0.3;
    ctx.fillText(eyebrow, w / 2, y + size);
    setTracking(ctx, 0);
    y += size * 1.7;
  }

  if (title) {
    const fontAt = (s) => `italic 900 ${s}px ${TITLE_FONTS}`;
    const size = fitText(ctx, title, w * 0.92, h * 0.115, 3, fontAt);
    ctx.save();
    ctx.translate(w / 2, y + size * 0.92);
    ctx.rotate(-0.018); // a slight forward lean, as the genre's titles have
    ctx.font = fontAt(size);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.06;
    ctx.lineWidth = size * 0.20;
    ctx.strokeStyle = INK;
    ctx.strokeText(title, 0, 0);
    ctx.shadowColor = 'transparent';
    const sheen = ctx.createLinearGradient(0, -size, 0, size * 0.25);
    sheen.addColorStop(0, '#ffffff');
    sheen.addColorStop(0.75, '#ffe9f4');
    sheen.addColorStop(1, '#ffb3d9');
    ctx.fillStyle = sheen;
    ctx.fillText(title, 0, 0);
    ctx.restore();
    y += size * 1.25;
  }

  if (subtitle) {
    const size = h * 0.026;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    setTracking(ctx, size * 0.34);
    const pillW = ctx.measureText(subtitle).width + size * 2.4;
    const pillH = size * 2;
    const pillY = y + size * 0.4;
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

// ------------------------------------------------------------- finish + API

/** Pass 4: vignette to seat the edges, then seeded grain for a printed feel. */
function drawFinish(ctx, w, h) {
  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(8, 0, 20, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  const next = seededRandom(19860526);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 260; i += 1) {
    ctx.globalAlpha = next() * 0.05;
    ctx.fillRect(next() * w, next() * h, 1.4, 1.4);
  }
  ctx.restore();
}

/**
 * Paints a complete cover onto `canvas` at the canvas's own resolution.
 * state = { template, slots, title, eyebrow, subtitle }, where a slot is
 * { image, panX, panY, zoom, grade } and any slot may be null (a placeholder panel).
 * Pass selectedIndex >= 0 (editor only) to outline that panel; exports omit it.
 */
export function drawCover(canvas, state, selectedIndex = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const { panels } = layout(state.template);
  drawBackdrop(ctx, w, h);
  panels.forEach((panel, i) => drawPanel(ctx, panel, state.slots[i] ?? null, i + 1, w, h));
  if (panels[selectedIndex]) drawSelection(ctx, panels[selectedIndex], w, h);
  drawLettering(ctx, w, h, state);
  drawFinish(ctx, w, h);
}

/** Panel rectangles in canvas pixels for a template — the editor's hit-test map. */
export function panelRects(templateName, w, h) {
  return layout(templateName).panels.map((p) => ({
    x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h, tilt: p.tilt,
  }));
}
