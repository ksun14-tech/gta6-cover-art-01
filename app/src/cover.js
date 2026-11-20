// The cover renderer: every pixel of a VICE FRAME cover is drawn here, so the preview, the PNG
// export and the screenshots all show the same art. A cover is a Vice City sunset backdrop, a
// collage of photo panels in the genre's white-bordered, slightly tilted grid, a colour grade
// over each photo, and the title lettered across the top in heavy outlined capitals.
//
// Geometry is relative (fractions of the canvas), so one template serves every export size.

/** Panel layouts: each panel is {x, y, w, h, tilt} in fractions of the canvas, tilt in degrees. */
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

export const SIZES = {
  post: { label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  story: { label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

const TITLE_FONT = '"Arial Black", "Franklin Gothic Heavy", Impact, sans-serif';

/** The sunset sky, sun disc, skyline and palms that sit behind (and between) the panels. */
function drawBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1b0f3a');
  sky.addColorStop(0.34, '#5b1a6e');
  sky.addColorStop(0.58, '#c92a6d');
  sky.addColorStop(0.78, '#ff7a3c');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // The low sun, banded like a retro poster.
  const sunR = w * 0.30;
  const sunX = w * 0.5;
  const sunY = h * 0.60;
  const sun = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sun.addColorStop(0, '#ffe259');
  sun.addColorStop(1, '#ff7518');
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = 'rgba(27, 15, 58, 0.85)';
  for (let i = 0; i < 5; i += 1) {
    const bandY = sunY + sunR * (0.08 + i * 0.17);
    ctx.fillRect(sunX - sunR, bandY, sunR * 2, sunR * (0.018 + i * 0.012));
  }
  ctx.restore();

  // A distant skyline along the foot.
  ctx.fillStyle = 'rgba(16, 6, 34, 0.9)';
  const base = h;
  const buildings = [0.04, 0.10, 0.16, 0.23, 0.31, 0.38, 0.46, 0.55, 0.62, 0.70, 0.77, 0.85, 0.92];
  const heights = [0.16, 0.24, 0.13, 0.28, 0.18, 0.22, 0.12, 0.26, 0.15, 0.21, 0.13, 0.25, 0.17];
  buildings.forEach((bx, i) => {
    const bw = w * 0.055;
    const bh = h * heights[i];
    ctx.fillRect(w * bx, base - bh, bw, bh);
  });
  ctx.fillRect(0, base - h * 0.015, w, h * 0.015);

  drawPalm(ctx, w * 0.055, h * 0.99, h * 0.34, 1);
  drawPalm(ctx, w * 0.955, h * 0.99, h * 0.40, -1);
}

/** A stylised palm: a curved trunk and a crown of fronds, in silhouette. */
function drawPalm(ctx, x, y, size, lean) {
  ctx.save();
  ctx.strokeStyle = 'rgba(12, 4, 28, 0.95)';
  ctx.fillStyle = 'rgba(12, 4, 28, 0.95)';
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.045;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * size * 0.10, y - size * 0.55, x + lean * size * 0.30, y - size * 0.92);
  ctx.stroke();
  const topX = x + lean * size * 0.30;
  const topY = y - size * 0.92;
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (0.08 + i * 0.14) * (lean > 0 ? 1 : 1);
    const spread = size * (0.34 + (i % 3) * 0.07);
    const endX = topX + Math.cos(angle) * spread * (i < 3.5 ? -1 : 1) * (lean > 0 ? 1 : -1) * -1;
    const endY = topY - Math.sin(angle) * spread * 0.42 + size * 0.10;
    ctx.lineWidth = size * 0.028;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + (endX - topX) * 0.5, topY - size * 0.16, endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

/** The neon grade over one photo: filter boost plus a duotone wash, scaled by `grade` (0..1). */
function applyGrade(ctx, x, y, w, h, grade) {
  if (grade <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, `rgba(64, 0, 128, ${0.55 * grade})`);
  wash.addColorStop(0.5, 'rgba(128, 128, 128, 0)');
  wash.addColorStop(1, `rgba(255, 46, 136, ${0.55 * grade})`);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255, 140, 40, ${0.6 * grade})`;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Draws one photo into a panel rect with cover-fit, the panel's pan/zoom, and its grade. */
function drawPanelPhoto(ctx, panel, slot, w, h) {
  const px = panel.x * w;
  const py = panel.y * h;
  const pw = panel.w * w;
  const ph = panel.h * h;
  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  ctx.rotate((panel.tilt * Math.PI) / 180);
  ctx.translate(-pw / 2, -ph / 2);
  ctx.beginPath();
  ctx.rect(0, 0, pw, ph);
  ctx.clip();
  if (slot && slot.image) {
    const img = slot.image;
    const zoom = slot.zoom ?? 1;
    const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (pw - dw) / 2 + (slot.panX ?? 0) * pw * 0.25;
    const dy = (ph - dh) / 2 + (slot.panY ?? 0) * ph * 0.25;
    const grade = slot.grade ?? 0.65;
    ctx.filter = `saturate(${1 + 0.55 * grade}) contrast(${1 + 0.16 * grade}) brightness(${1 + 0.04 * grade})`;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    applyGrade(ctx, 0, 0, pw, ph, grade);
  } else {
    const empty = ctx.createLinearGradient(0, 0, pw, ph);
    empty.addColorStop(0, '#3a1658');
    empty.addColorStop(1, '#8f2060');
    ctx.fillStyle = empty;
    ctx.fillRect(0, 0, pw, ph);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = `600 ${Math.round(ph * 0.055)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', pw / 2, ph / 2);
  }
  ctx.restore();

  // The genre's white frame, with a soft shadow onto whatever is beneath.
  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  ctx.rotate((panel.tilt * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = w * 0.012;
  ctx.shadowOffsetY = w * 0.004;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, w * 0.011);
  ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
  ctx.restore();
}

/** The title block: an optional eyebrow line, the heavy title, and a pill subtitle. */
function drawTitle(ctx, w, h, state) {
  const title = (state.title ?? '').trim().toUpperCase();
  const eyebrow = (state.eyebrow ?? '').trim().toUpperCase();
  const subtitle = (state.subtitle ?? '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';

  let cursorY = h * 0.055;
  if (eyebrow) {
    let size = h * 0.030;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${size * 0.40}px`; } catch { /* older engines */ }
    while (ctx.measureText(eyebrow).width > w * 0.88 && size > 9) {
      size -= 1;
      ctx.font = `700 ${size}px system-ui, sans-serif`;
      try { ctx.letterSpacing = `${size * 0.40}px`; } catch { /* older engines */ }
    }
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.3;
    ctx.fillText(eyebrow, w / 2, cursorY + size);
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
    cursorY += size * 1.7;
  }

  if (title) {
    let size = h * 0.115;
    const fit = () => {
      ctx.font = `italic 900 ${size}px ${TITLE_FONT}`;
      return ctx.measureText(title).width;
    };
    while (fit() > w * 0.92 && size > 14) size -= 3;
    ctx.save();
    ctx.translate(w / 2, cursorY + size * 0.92);
    ctx.rotate(-0.018);
    ctx.font = `italic 900 ${size}px ${TITLE_FONT}`;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.06;
    ctx.lineWidth = size * 0.20;
    ctx.strokeStyle = '#12041f';
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
    try { ctx.letterSpacing = `${size * 0.34}px`; } catch { /* older engines */ }
    const textWidth = ctx.measureText(subtitle).width;
    const pillW = textWidth + size * 2.4;
    const pillH = size * 2.0;
    const pillX = w / 2 - pillW / 2;
    const pillY = cursorY + size * 0.4;
    ctx.fillStyle = 'rgba(10, 2, 24, 0.82)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'transparent';
    ctx.fillText(subtitle, w / 2, pillY + pillH * 0.68);
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
  }
  ctx.restore();
}

/** A whisper of grain and a vignette over the whole cover, for the printed-poster feel. */
function drawFinish(ctx, w, h) {
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(8, 0, 20, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws the whole cover onto a canvas at its own pixel size.
 * state: {template, slots: [{image, panX, panY, zoom, grade}], title, eyebrow, subtitle}
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const template = TEMPLATES[state.template] ?? TEMPLATES.boxart;
  drawBackdrop(ctx, w, h);
  template.panels.forEach((panel, index) => {
    drawPanelPhoto(ctx, panel, state.slots[index] ?? null, w, h);
  });
  drawTitle(ctx, w, h, state);
  drawFinish(ctx, w, h);
}

/** The panel rectangles of a template, in canvas pixels (for hit-testing in the editor). */
export function panelRects(templateName, w, h) {
  const template = TEMPLATES[templateName] ?? TEMPLATES.boxart;
  return template.panels.map((panel) => ({
    x: panel.x * w,
    y: panel.y * h,
    w: panel.w * w,
    h: panel.h * h,
    tilt: panel.tilt,
  }));
}
