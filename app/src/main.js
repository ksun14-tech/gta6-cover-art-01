// main.js — the VICE FRAME editor: a control rail, a canvas, and the state between them.
//
// Nothing here leaves the machine. Photos are decoded into memory from object URLs or
// from the bundled samples and drawn straight onto the canvas; there is no upload, no
// analytics, no network call of any kind.
//
// Editor state is a list of slots, one per panel of the active layout:
//   slot = { image, panX, panY, zoom, grade }
// pan runs -1..1 (a quarter-panel of travel at the extremes), zoom 1..2.6, grade 0..1.
// `state.selected` is the panel being edited; the rail's sliders always describe it,
// and the canvas outlines it — except while a cover screenshot scene is captured.

import { TEMPLATES, SIZES, drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

/** Built-in photos for the sample tray, in display order. */
const SAMPLES = [
  { id: 'neon', label: 'Neon Portrait', url: 'samples/neon.jpg' },
  { id: 'car', label: 'Sunset Car', url: 'samples/car.jpg' },
  { id: 'boulevard', label: 'Boulevard', url: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'The Pier', url: 'samples/pier.jpg' },
];

const DEFAULT_GRADE = 0.65;
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.6;

const canvas = document.getElementById('cover');
const ui = {
  template: document.getElementById('template'),
  size: document.getElementById('size'),
  title: document.getElementById('title'),
  eyebrow: document.getElementById('eyebrow'),
  subtitle: document.getElementById('subtitle'),
  photoFile: document.getElementById('photo-file'),
  photoButton: document.getElementById('photo-button'),
  samples: document.getElementById('samples'),
  fillAll: document.getElementById('fill-all'),
  zoom: document.getElementById('zoom'),
  grade: document.getElementById('grade'),
  gradeAll: document.getElementById('grade-all'),
  panelLabel: document.getElementById('panel-label'),
  exportButton: document.getElementById('export'),
  status: document.getElementById('status'),
};

const state = {
  template: 'boxart',
  slots: [],
  selected: 0,
  title: 'VICE CITY HEAT',
  eyebrow: 'GRAND THEFT AUTO VI · FAN COVER',
  subtitle: 'MAKE YOUR OWN AT VICE FRAME',
};

/** True during ?shot=cover capture: those screenshots must be pure artwork. */
let hideSelection = false;

// ------------------------------------------------------------- state plumbing

function emptySlot(grade = DEFAULT_GRADE) {
  return { image: null, panX: 0, panY: 0, zoom: 1, grade };
}

function panelTotal() {
  return TEMPLATES[state.template].panels.length;
}

function currentSlot() {
  return state.slots[state.selected];
}

/** Grows the slot list to fit the active layout and clamps the selection into it. */
function ensureSlots() {
  while (state.slots.length < panelTotal()) state.slots.push(emptySlot());
  state.selected = Math.min(state.selected, panelTotal() - 1);
}

/** Promise wrapper around an <img> load, for sample paths and object URLs alike. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Repaints the cover and re-syncs the rail controls that mirror the selected slot. */
function redraw() {
  ensureSlots();
  drawCover(canvas, state, hideSelection ? -1 : state.selected);
  ui.panelLabel.textContent = `Panel ${state.selected + 1} of ${panelTotal()}`;
  ui.zoom.value = String(currentSlot().zoom);
  ui.grade.value = String(currentSlot().grade);
}

function announce(message) {
  ui.status.textContent = message;
}

/** Loads `url` into panel `index` (keeping the panel's grade), selects it, repaints. */
async function placePhoto(index, url) {
  const grade = state.slots[index]?.grade ?? DEFAULT_GRADE;
  state.slots[index] = { ...emptySlot(grade), image: await loadImage(url) };
  state.selected = index;
  redraw();
}

/** Switches the canvas to one of the named export sizes and repaints. */
function applySize(key) {
  const size = SIZES[key];
  if (!size) return;
  canvas.width = size.w;
  canvas.height = size.h;
  ui.size.value = key;
  redraw();
}

// ------------------------------------------------------------- rail controls

/** Populates a <select> from a { key: { label } } table; returns the select. */
function buildOptions(select, table) {
  for (const [key, entry] of Object.entries(table)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = entry.label;
    select.appendChild(option);
  }
  return select;
}

buildOptions(ui.template, TEMPLATES).value = state.template;
ui.template.addEventListener('change', () => {
  state.template = ui.template.value;
  redraw();
  announce(`${TEMPLATES[state.template].label} layout: ${panelTotal()} panels. Photos stay where they fit.`);
});

buildOptions(ui.size, SIZES);
ui.size.addEventListener('change', () => applySize(ui.size.value));

for (const key of ['title', 'eyebrow', 'subtitle']) {
  ui[key].value = state[key];
  ui[key].addEventListener('input', () => {
    state[key] = ui[key].value;
    redraw();
  });
}

for (const sample of SAMPLES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sample';
  button.textContent = sample.label;
  button.addEventListener('click', async () => {
    await placePhoto(state.selected, sample.url);
    announce(`${sample.label} is in panel ${state.selected + 1}. Pick another panel for the next photo.`);
  });
  ui.samples.appendChild(button);
}

ui.photoButton.addEventListener('click', () => ui.photoFile.click());
ui.photoFile.addEventListener('change', async () => {
  const file = ui.photoFile.files?.[0];
  if (!file) return;
  await placePhoto(state.selected, URL.createObjectURL(file));
  announce(`Your photo is in panel ${state.selected + 1}. Drag it, or nudge with the arrow keys.`);
  ui.photoFile.value = '';
});

ui.fillAll.addEventListener('click', async () => {
  const source = currentSlot();
  if (!source.image) {
    announce('Put a photo in this panel first, then spread it across every panel.');
    return;
  }
  const { src } = source.image;
  for (let i = 0; i < state.slots.length; i += 1) {
    state.slots[i] = { ...emptySlot(source.grade), image: await loadImage(src) };
  }
  redraw();
  announce('One photo, every panel — the classic single-photo cover.');
});

ui.zoom.addEventListener('input', () => {
  currentSlot().zoom = Number(ui.zoom.value);
  redraw();
});
ui.grade.addEventListener('input', () => {
  currentSlot().grade = Number(ui.grade.value);
  redraw();
});
ui.gradeAll.addEventListener('click', () => {
  const grade = currentSlot().grade;
  for (const slot of state.slots) slot.grade = grade;
  redraw();
  announce('Every panel now uses this grade.');
});

ui.exportButton.addEventListener('click', () => {
  // Repaint without the selection, snapshot the canvas, then restore the outline.
  drawCover(canvas, state);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-frame-cover-${canvas.width}x${canvas.height}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
    redraw();
    announce(`Saved ${link.download} — post it anywhere.`);
  }, 'image/png');
});

// ------------------------------------------------------------- direct manipulation

const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

/** Pointer position in canvas pixels, whatever the canvas's displayed size. */
function toCanvasPixels(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * canvas.width,
    y: ((event.clientY - box.top) / box.height) * canvas.height,
  };
}

/** Index of the frontmost panel containing a canvas point, or -1 for a miss. */
function hitPanel(point) {
  const rects = panelRects(state.template, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return i;
  }
  return -1;
}

let dragOrigin = null;
canvas.addEventListener('pointerdown', (event) => {
  const index = hitPanel(toCanvasPixels(event));
  if (index < 0) return;
  state.selected = index;
  const slot = currentSlot();
  dragOrigin = { x: event.clientX, y: event.clientY, panX: slot.panX, panY: slot.panY };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragOrigin) return;
  const box = canvas.getBoundingClientRect();
  const slot = currentSlot();
  slot.panX = clamp(dragOrigin.panX + ((event.clientX - dragOrigin.x) / box.width) * 2.2, -1, 1);
  slot.panY = clamp(dragOrigin.panY + ((event.clientY - dragOrigin.y) / box.height) * 2.2, -1, 1);
  redraw();
});
const endDrag = () => { dragOrigin = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/** Keyboard framing: arrows pan the selected photo (Shift = coarse), + and − zoom.
 *  Ignored while focus sits in a form control, so inputs keep their own keys. */
window.addEventListener('keydown', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLTextAreaElement) return;
  const slot = currentSlot();
  if (!slot) return;
  const step = event.shiftKey ? 0.14 : 0.04;
  const pans = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  if (pans[event.key]) {
    slot.panX = clamp(slot.panX + pans[event.key][0], -1, 1);
    slot.panY = clamp(slot.panY + pans[event.key][1], -1, 1);
    event.preventDefault();
    redraw();
  } else if (event.key === '+' || event.key === '=') {
    slot.zoom = clamp(slot.zoom + 0.05, ZOOM_MIN, ZOOM_MAX);
    redraw();
  } else if (event.key === '-' || event.key === '_') {
    slot.zoom = clamp(slot.zoom - 0.05, ZOOM_MIN, ZOOM_MAX);
    redraw();
  }
});

/** A photo file dropped anywhere on the page lands in the selected panel. */
window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('drop', async (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file?.type.startsWith('image/')) {
    await placePhoto(state.selected, URL.createObjectURL(file));
    announce(`Dropped into panel ${state.selected + 1}.`);
  }
});

// ------------------------------------------------------------- boot paths

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  // Screenshot scene: shots.js assembles the same state through this narrow API.
  // Cover scenes are captured without the selection outline; editor scenes keep it,
  // because the outline is part of the editing story the screenshot tells.
  hideSelection = query.get('shot') === 'cover';
  runShot(query, {
    loadImage,
    setSlotImage: placePhoto,
    setTemplate: (name) => { if (TEMPLATES[name]) state.template = name; },
    setText: (key, value) => { if (key in state && typeof value === 'string') state[key] = value; },
    setSize: applySize,
    redraw,
  });
} else {
  // The app opens on a finished-looking cover: three samples already placed.
  (async () => {
    ensureSlots();
    await placePhoto(0, SAMPLES[0].url);
    if (panelTotal() > 1) await placePhoto(1, SAMPLES[1].url);
    if (panelTotal() > 3) await placePhoto(3, SAMPLES[2].url);
    state.selected = 0;
    redraw();
  })();
}
