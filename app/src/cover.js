// cover.js — VICE FRAME's painting engine.
//
// One entry point, renderCover(), produces every cover the app ever shows: the
// live preview in the editor, the PNG a user downloads, and the stills that ship
// in screenshots/. All three come out of the same paint routine, so the
// composition a user frames on screen is the composition they export.
//
// A cover is layered back to front:
//   1. a painted Vice City dusk — gradient sky, early stars, a banded sun, a hot
//      horizon, tower silhouettes and two palms leaning in from the edges;
//   2. the photo panels of the chosen layout, each one clipped, cover-fitted,
//      colour-graded and framed in white;
//   3. the poster lettering — eyebrow, title, subtitle — shrunk until it fits;
//   4. a vignette plus fixed-seed grain, so repaints never shimmer.
//
// Layout geometry is kept as fractions of the canvas rather than pixels, which
// is why one arrangement renders unchanged at post, portrait, story and wide.

/** Builds one panel rectangle out of canvas fractions; tilt is in degrees. */
const rect = (x, y, w, h, tilt = 0) => ({ x, y, w, h, tilt });

/** The four arrangements a cover can use. */
export const LAYOUTS = {
  boxart: {
    label: 'Box Art',
    panels: [
      rect(0.015, 0.015, 0.63, 0.60),
      rect(0.665, 0.015, 0.32, 0.29),
      rect(0.665, 0.325, 0.32, 0.29),
      rect(0.015, 0.635, 0.475, 0.35),
      rect(0.51, 0.635, 0.475, 0.35),
    ],
  },
  triptych: {
    label: 'Triptych',
    panels: [
      rect(0.03, 0.06, 0.30, 0.86, -2.2),
      rect(0.35, 0.03, 0.30, 0.90),
      rect(0.67, 0.06, 0.30, 0.86, 2.2),
    ],
  },
  hero: {
    label: 'Hero',
    panels: [rect(0, 0, 1, 1)],
  },
  strip: {
    label: 'Photo Strip',
    panels: [
      rect(0.015, 0.015, 0.97, 0.55),
      rect(0.015, 0.585, 0.31, 0.40),
      rect(0.345, 0.585, 0.31, 0.40),
      rect(0.675, 0.585, 0.31, 0.40),
    ],
  },
};

/** Named output sizes; the keys are what the size menu and the shot URLs use. */
export const EXPORT_SIZES = {
  post: { label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  story: { label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

const INK = '#12041f';        // title outline and the subtitle pill
const GOLD = '#ffd166';       // eyebrow lettering
const PINK = '#ff2e88';       // selection dashes; the grade's hot pole
const SHADOW_TREE = 'rgba(12, 4, 28, 0.95)';
const TITLE_STACK = '"Arial Black", "Franklin Gothic Heavy", Impact, sans-serif';
const DEG = Math.PI / 180;

/** Layout lookup; anything unrecognised falls back to Box Art. */
function layoutOf(key) {
  return LAYOUTS[key] ?? LAYOUTS.boxart;
}

/** mulberry32, a compact seeded generator. Fixed seeds mean the stars and the
 *  grain land in the same places on every repaint, so the backdrop holds still
 *  while a user drags a photo around inside it. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ backdrop

const SKY_STOPS = [
  [0, '#1b0f3a'],
  [0.34, '#5b1a6e'],
  [0.58, '#c92a6d'],
  [0.78, '#ff7a3c'],
  [1, '#ffb347'],
];

/** Layer 1, part 1: the dusk gradient itself, top-of-night to horizon amber. */
function paintSky(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of SKY_STOPS) grad.addColorStop(at, colour);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Pinprick stars, confined to the dark upper third where the sky is still night. */
function paintStars(ctx, w, h) {
  const rand = mulberry32(0xc0ffee);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 52; i += 1) {
    ctx.globalAlpha = 0.08 + rand() * 0.30;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h * 0.30, 0.6 + rand() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The retro sun: a hot disc sliced by five widening gaps, travel-poster style. */
function paintSun(ctx, w, h) {
  const radius = w * 0.30;
  const cx = w / 2;
  const cy = h * 0.60;
  const heat = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  heat.addColorStop(0, '#ffe259');
  heat.addColorStop(1, '#ff7518');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = heat;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  // The gaps are cut at a slightly softer alpha than full ink: at 0.85 they
  // read as hard barcode stripes where the disc shows between panels, while
  // 0.78 keeps the screen-print feel without the mechanical edge.
  ctx.fillStyle = 'rgba(27, 15, 58, 0.78)';
  for (let i = 0; i < 5; i += 1) {
    const gapY = cy + radius * (0.10 + i * 0.165);
    ctx.fillRect(cx - radius, gapY, radius * 2, radius * (0.020 + i * 0.011));
  }
  ctx.restore();
}

/** A bloom of heat haze sitting on the horizon line behind the towers. */
function paintHorizon(ctx, w, h) {
  const bloom = ctx.createRadialGradient(w / 2, h * 0.86, 0, w / 2, h * 0.86, w * 0.55);
  bloom.addColorStop(0, 'rgba(255, 150, 60, 0.35)');
  bloom.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);
}

/** Tower footprints as [left edge, height] pairs, both in canvas fractions. */
const TOWERS = [
  [0.04, 0.16], [0.10, 0.24], [0.16, 0.13], [0.23, 0.28], [0.31, 0.18],
  [0.38, 0.22], [0.46, 0.12], [0.55, 0.26], [0.62, 0.15], [0.70, 0.21],
  [0.77, 0.13], [0.85, 0.25], [0.92, 0.17],
];

function paintSkyline(ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(16, 6, 34, 0.9)';
  for (const [fx, fh] of TOWERS) ctx.fillRect(fx * w, h - fh * h, w * 0.055, fh * h);
  ctx.fillRect(0, h * 0.985, w, h * 0.015); // the promenade the towers stand on
  ctx.restore();
}

/** One palm tree: a trunk curving up to a crown, then seven drooping fronds.
 *  `lean` (+1 / -1) mirrors the tree so the pair at the canvas edges bow inward. */
function paintPalm(ctx, baseX, baseY, size, lean) {
  const crownX = baseX + lean * size * 0.30;
  const crownY = baseY - size * 0.92;
  ctx.save();
  ctx.strokeStyle = SHADOW_TREE;
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * size * 0.10, baseY - size * 0.55, crownX, crownY);
  ctx.stroke();
  ctx.lineWidth = size * 0.028;
  for (let i = 0; i < 7; i += 1) {
    const sweep = Math.PI * (1 - i / 6); // walks the fan from one side to the other
    const reach = size * (0.34 + ((6 - i) % 3) * 0.07);
    const endX = crownX + Math.cos(sweep) * reach;
    const endY = crownY - Math.sin(sweep) * reach * 0.34 + size * 0.13;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + Math.cos(sweep) * reach * 0.5, crownY - size * 0.16, endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

/** The whole backdrop, in the order its pieces overlap. */
function paintBackdrop(ctx, w, h) {
  paintSky(ctx, w, h);
  paintStars(ctx, w, h);
  paintSun(ctx, w, h);
  paintHorizon(ctx, w, h);
  paintSkyline(ctx, w, h);
  paintPalm(ctx, w * 0.055, h * 0.99, h * 0.34, 1);
  paintPalm(ctx, w * 0.955, h * 0.99, h * 0.40, -1);
}

// -------------------------------------------------------------------- panels

/** Runs `draw` inside a panel's own coordinate frame — origin at its top-left
 *  corner, tilt applied, units in panel pixels — then puts the context back. */
function inFrame(ctx, panel, w, h, draw) {
  const pw = panel.w * w;
  const ph = panel.h * h;
  ctx.save();
  ctx.translate(panel.x * w + pw / 2, panel.y * h + ph / 2);
  ctx.rotate(panel.tilt * DEG);
  ctx.translate(-pw / 2, -ph / 2);
  draw(pw, ph);
  ctx.restore();
}

/** The neon half of the grade: a purple-to-pink overlay wash plus a warm
 *  soft-light pass. The saturation/contrast lift itself rides on ctx.filter
 *  in paintPhoto, because filters apply to the drawImage call, not to fills. */
function gradeWash(ctx, pw, ph, grade) {
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

/** Cover-fits a slot's photograph into its panel: scale until the panel is
 *  covered, centre the result, nudge by the slot's pan (a quarter panel of
 *  travel at full deflection), then grade it. */
function paintPhoto(ctx, slot, pw, ph) {
  const img = slot.image;
  const grade = slot.grade ?? 0.65;
  const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * (slot.zoom ?? 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const ox = (pw - dw) / 2 + (slot.panX ?? 0) * pw * 0.25;
  const oy = (ph - dh) / 2 + (slot.panY ?? 0) * ph * 0.25;
  ctx.filter = `saturate(${1 + 0.55 * grade}) contrast(${1 + 0.16 * grade}) brightness(${1 + 0.04 * grade})`;
  ctx.drawImage(img, ox, oy, dw, dh);
  ctx.filter = 'none';
  gradeWash(ctx, pw, ph, grade);
}

/** An unfilled panel: dusk gradient, its number, and a plain invitation. */
function paintEmpty(ctx, pw, ph, number) {
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

/** One panel, complete: clipped content in the first frame pass, then the white
 *  border in a second pass so its drop shadow falls outside the clip. */
function paintPanel(ctx, panel, slot, number, w, h) {
  inFrame(ctx, panel, w, h, (pw, ph) => {
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (slot?.image) paintPhoto(ctx, slot, pw, ph);
    else paintEmpty(ctx, pw, ph, number);
  });
  inFrame(ctx, panel, w, h, (pw, ph) => {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = w * 0.012;
    ctx.shadowOffsetY = w * 0.004;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, w * 0.011);
    ctx.strokeRect(0, 0, pw, ph);
  });
}

/** The editor's dashed marker around the panel under edit. renderCover draws it
 *  only when a selection index is supplied, and exports / cover scenes never
 *  supply one, so the marker cannot leak into finished artwork. */
function outlineActive(ctx, panel, w, h) {
  inFrame(ctx, panel, w, h, (pw, ph) => {
    const inset = w * 0.014;
    ctx.strokeStyle = PINK;
    ctx.lineWidth = Math.max(3, w * 0.008);
    ctx.setLineDash([w * 0.018, w * 0.012]);
    ctx.lineDashOffset = w * 0.006;
    ctx.strokeRect(inset, inset, pw - inset * 2, ph - inset * 2);
    ctx.setLineDash([]);
  });
}

// ----------------------------------------------------------------- lettering

/** letterSpacing is still not universal; engines that reject it just get
 *  untracked text, so the assignment is wrapped rather than feature-tested. */
function track(ctx, px) {
  try { ctx.letterSpacing = `${px}px`; } catch { /* no tracking on this engine */ }
}

/** Steps a font size down until the text measures within `limit`, leaving the
 *  winning font on the context. `fontFor` builds the font string for a size. */
function shrinkToFit(ctx, text, limit, fromSize, step, fontFor) {
  let size = fromSize;
  ctx.font = fontFor(size);
  while (size > 9 && ctx.measureText(text).width > limit) {
    size -= step;
    ctx.font = fontFor(size);
  }
  return size;
}

/** The small gold line above the title. Returns the y the next line starts from. */
function paintEyebrow(ctx, w, h, text, y) {
  const fontFor = (s) => `700 ${s}px system-ui, sans-serif`;
  const size = shrinkToFit(ctx, text, w * 0.88, h * 0.030, 1, fontFor);
  track(ctx, size * 0.40);
  ctx.font = fontFor(size);
  ctx.fillStyle = GOLD;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = size * 0.3;
  ctx.fillText(text, w / 2, y + size);
  track(ctx, 0);
  return y + size * 1.7;
}

/** The title itself: heavy italic capitals, inked outline, pale sheen fill, and
 *  the genre's slight forward lean. Returns the y below the title. */
function paintTitle(ctx, w, h, text, y) {
  const fontFor = (s) => `italic 900 ${s}px ${TITLE_STACK}`;
  const size = shrinkToFit(ctx, text, w * 0.92, h * 0.115, 3, fontFor);
  ctx.save();
  ctx.translate(w / 2, y + size * 0.92);
  ctx.rotate(-0.018);
  ctx.font = fontFor(size);
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.06;
  ctx.lineWidth = size * 0.20;
  ctx.strokeStyle = INK;
  ctx.strokeText(text, 0, 0);
  ctx.shadowColor = 'transparent';
  const sheen = ctx.createLinearGradient(0, -size, 0, size * 0.25);
  sheen.addColorStop(0, '#ffffff');
  sheen.addColorStop(0.75, '#ffe9f4');
  sheen.addColorStop(1, '#ffb3d9');
  ctx.fillStyle = sheen;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return y + size * 1.25;
}

/** The subtitle, set in white on a translucent ink pill. */
function paintSubtitle(ctx, w, h, text, y) {
  const size = h * 0.026;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  track(ctx, size * 0.34);
  const pillW = ctx.measureText(text).width + size * 2.4;
  const pillH = size * 2;
  const pillY = y + size * 0.4;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(10, 2, 24, 0.82)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - pillW / 2, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, pillY + pillH * 0.68);
  track(ctx, 0);
}

/** Lettering as a whole: whichever of the three lines are non-empty, stacked
 *  from 5.5% of the height downward; an empty line takes no space at all. */
function paintLettering(ctx, w, h, state) {
  const eyebrow = (state.eyebrow ?? '').trim().toUpperCase();
  const title = (state.title ?? '').trim().toUpperCase();
  const subtitle = (state.subtitle ?? '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  let y = h * 0.055;
  if (eyebrow) y = paintEyebrow(ctx, w, h, eyebrow, y);
  if (title) y = paintTitle(ctx, w, h, title, y);
  if (subtitle) paintSubtitle(ctx, w, h, subtitle, y);
  ctx.restore();
}

// -------------------------------------------------------------------- finish

/** Last layer: a vignette to seat the corners, then a fixed scatter of grain
 *  specks for the feel of a printed poster rather than a screen. */
function paintFinish(ctx, w, h) {
  const shade = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78,
  );
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(8, 0, 20, 0.38)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  const rand = mulberry32(0xbada55);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  // Finer and denser than a first pass suggested: 1.5px specks read as dust
  // on the exported PNGs, while 1.2px specks at this count sit closer to the
  // tooth of printed poster stock.
  for (let i = 0; i < 340; i += 1) {
    ctx.globalAlpha = rand() * 0.05;
    ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the API

/**
 * Paints one complete cover onto `canvas` at the canvas's own pixel size.
 * `state` is { template, slots, title, eyebrow, subtitle }; a slot is
 * { image, panX, panY, zoom, grade } and may be null for an unfilled panel.
 * `selected` is an editor-only panel index to outline; omit it (or pass -1)
 * for finished artwork.
 */
export function renderCover(canvas, state, selected = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const { panels } = layoutOf(state.template);
  paintBackdrop(ctx, w, h);
  panels.forEach((panel, i) => paintPanel(ctx, panel, state.slots[i] ?? null, i + 1, w, h));
  if (panels[selected]) outlineActive(ctx, panels[selected], w, h);
  paintLettering(ctx, w, h, state);
  paintFinish(ctx, w, h);
}

/** The layout's panel rectangles in canvas pixels — the editor's hit-test map. */
export function panelBoxes(templateKey, w, h) {
  return layoutOf(templateKey).panels.map((p) => ({
    x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h, tilt: p.tilt,
  }));
}
