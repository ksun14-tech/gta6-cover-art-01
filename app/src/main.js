// main.js — VICE FRAME's editor: the control rail on the left, wired to the renderer in
// cover.js. Everything happens on this machine: photos are decoded into memory and drawn
// onto the canvas; nothing is uploaded, tracked or sent anywhere.
//
// The state is one slot per panel of the chosen layout. A slot is
//   { image, panX, panY, zoom, grade }
// — the photo itself, where it sits inside its panel (pan in -1..1), how far it is zoomed
// (1 = just covering the panel) and how much neon grade it carries (0..1). The panel being
// edited is `state.selected`; the canvas outlines it, and the sliders always describe it.

import { TEMPLATES, SIZES, drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

/** The built-in photos, offered as one-tap panel fillers. Files live beside the app. */
const SAMPLES = [
  { id: 'neon', label: 'Neon Portrait', url: 'samples/neon.jpg' },
  { id: 'car', label: 'Sunset Car', url: 'samples/car.jpg' },
  { id: 'boulevard', label: 'Boulevard', url: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'The Pier', url: 'samples/pier.jpg' },
];

const DEFAULT_GRADE = 0.65;

const canvas = document.getElementById('cover');
const els = Object.fromEntries(
  [
    'template', 'size', 'title', 'eyebrow', 'subtitle', 'photo-file', 'photo-button',
    'samples', 'fill-all', 'zoom', 'grade', 'grade-all', 'panel-label', 'export', 'status',
  ].map((id) => [id, document.getElementById(id)]),
);

const state = {
  template: 'boxart',
  slots: [],
  selected: 0,
  title: 'VICE CITY HEAT',
  eyebrow: 'GRAND THEFT AUTO VI · FAN COVER',
  subtitle: 'MAKE YOUR OWN AT VICE FRAME',
};

// --------------------------------------------------------------------------- state helpers

function blankSlot(grade = DEFAULT_GRADE) {
  return { image: null, panX: 0, panY: 0, zoom: 1, grade };
}

function panelCount() {
  return TEMPLATES[state.template].panels.length;
}

function selectedSlot() {
  return state.slots[state.selected];
}

/** Keeps the slot list as long as the current layout needs, and the selection inside it. */
function syncSlots() {
  while (state.slots.length < panelCount()) state.slots.push(blankSlot());
  state.selected = Math.min(state.selected, panelCount() - 1);
}

/** Decodes an image from a URL (a sample path or an object URL for the user's own file). */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** True while a ?shot=cover scene is being captured: cover screenshots must be the
 *  clean artwork, so the editor's selection outline is suppressed for them. */
let suppressSelection = false;

/** Repaints the cover (with the selection outline, unless suppressed) and refreshes the
 *  controls that describe the selected panel, so the rail never disagrees with the canvas. */
function redraw() {
  syncSlots();
  drawCover(canvas, state, suppressSelection ? -1 : state.selected);
  els['panel-label'].textContent = `Panel ${state.selected + 1} of ${panelCount()}`;
  els.zoom.value = String(selectedSlot().zoom);
  els.grade.value = String(selectedSlot().grade);
}

function say(message) {
  els.status.textContent = message;
}

/** Puts a photo into a panel, keeping the grade the panel already had, and selects it. */
async function placePhoto(index, url) {
  const grade = state.slots[index]?.grade ?? DEFAULT_GRADE;
  state.slots[index] = { ...blankSlot(grade), image: await loadImage(url) };
  state.selected = index;
  redraw();
}

// --------------------------------------------------------------------------- control wiring

/** Fills a <select> from a {key: {label}} table and returns the element for chaining. */
function fillSelect(select, table) {
  for (const [key, entry] of Object.entries(table)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = entry.label;
    select.appendChild(option);
  }
  return select;
}

fillSelect(els.template, TEMPLATES).value = state.template;
els.template.addEventListener('change', () => {
  state.template = els.template.value;
  redraw();
  say(`${TEMPLATES[state.template].label} layout: ${panelCount()} panels. Photos carry over where they fit.`);
});

fillSelect(els.size, SIZES);
els.size.addEventListener('change', () => applySize(els.size.value));

/** Resizes the canvas to one of the SIZES keys and repaints at the new aspect. */
function applySize(key) {
  const size = SIZES[key];
  if (!size) return;
  canvas.width = size.w;
  canvas.height = size.h;
  els.size.value = key;
  redraw();
}

for (const key of ['title', 'eyebrow', 'subtitle']) {
  els[key].value = state[key];
  els[key].addEventListener('input', () => {
    state[key] = els[key].value;
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
    say(`${sample.label} is in panel ${state.selected + 1}. Click another panel to place the next photo.`);
  });
  els.samples.appendChild(button);
}

els['photo-button'].addEventListener('click', () => els['photo-file'].click());
els['photo-file'].addEventListener('change', async () => {
  const [file] = els['photo-file'].files;
  if (!file) return;
  await placePhoto(state.selected, URL.createObjectURL(file));
  say(`Your photo is in panel ${state.selected + 1}. Drag it on the cover — or nudge with the arrow keys — to reframe.`);
  els['photo-file'].value = '';
});

els['fill-all'].addEventListener('click', async () => {
  const slot = selectedSlot();
  if (!slot.image) {
    say('Load a photo first, then spread it across every panel.');
    return;
  }
  const { src } = slot.image;
  for (let i = 0; i < state.slots.length; i += 1) {
    state.slots[i] = { ...blankSlot(slot.grade), image: await loadImage(src) };
  }
  redraw();
  say('One photo in every panel — the classic single-photo cover.');
});

els.zoom.addEventListener('input', () => {
  selectedSlot().zoom = Number(els.zoom.value);
  redraw();
});
els.grade.addEventListener('input', () => {
  selectedSlot().grade = Number(els.grade.value);
  redraw();
});
els['grade-all'].addEventListener('click', () => {
  const { grade } = selectedSlot();
  for (const slot of state.slots) slot.grade = grade;
  redraw();
  say('Every panel now carries this panel’s grade.');
});

els.export.addEventListener('click', () => {
  // The PNG must be the clean cover: repaint without the selection outline, capture,
  // then put the outline back for editing.
  drawCover(canvas, state);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-cover-${canvas.width}x${canvas.height}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    redraw();
    say(`Saved ${a.download} — share it anywhere.`);
  }, 'image/png');
});

// --------------------------------------------------------------------------- pointer + keys

/** Converts a pointer event into canvas pixel coordinates. */
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

/** The topmost panel under a canvas point, or -1 when the point misses every panel. */
function panelAt(point) {
  const rects = panelRects(state.template, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return i;
  }
  return -1;
}

const clampPan = (value) => Math.max(-1, Math.min(1, value));

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const index = panelAt(canvasPoint(event));
  if (index === -1) return;
  state.selected = index;
  const slot = selectedSlot();
  drag = { startX: event.clientX, startY: event.clientY, panX: slot.panX, panY: slot.panY };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const slot = selectedSlot();
  slot.panX = clampPan(drag.panX + ((event.clientX - drag.startX) / rect.width) * 2.2);
  slot.panY = clampPan(drag.panY + ((event.clientY - drag.startY) / rect.height) * 2.2);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// Arrow keys nudge the selected photo (Shift for bigger steps); + / − zoom it. Keys are
// left alone while a form control has focus, so the sliders and text fields keep theirs.
window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement
    || event.target instanceof HTMLSelectElement
    || event.target instanceof HTMLTextAreaElement) return;
  const slot = selectedSlot();
  if (!slot) return;
  const step = event.shiftKey ? 0.14 : 0.04;
  const moves = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  };
  if (moves[event.key]) {
    slot.panX = clampPan(slot.panX + moves[event.key][0]);
    slot.panY = clampPan(slot.panY + moves[event.key][1]);
    event.preventDefault();
    redraw();
  } else if (event.key === '+' || event.key === '=') {
    slot.zoom = Math.min(2.6, slot.zoom + 0.05);
    redraw();
  } else if (event.key === '-' || event.key === '_') {
    slot.zoom = Math.max(1, slot.zoom - 0.05);
    redraw();
  }
});

// Dropping a photo file anywhere on the page fills the selected panel.
window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('drop', async (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file?.type.startsWith('image/')) {
    await placePhoto(state.selected, URL.createObjectURL(file));
    say(`Dropped into panel ${state.selected + 1}.`);
  }
});

// --------------------------------------------------------------------------- boot

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  // Screenshot mode: shots.js drives the same state through this small API surface.
  // A cover scene is captured clean; an editor scene keeps the selection outline,
  // since showing which panel is being edited is part of what it demonstrates.
  suppressSelection = query.get('shot') === 'cover';
  runShot(query, {
    loadImage,
    setSlotImage: placePhoto,
    setTemplate: (name) => { if (TEMPLATES[name]) state.template = name; },
    setText: (key, value) => { if (key in state && typeof value === 'string') state[key] = value; },
    setSize: applySize,
    redraw,
  });
} else {
  // First paint is already a cover: three samples placed before anyone touches a control.
  (async () => {
    syncSlots();
    await placePhoto(0, SAMPLES[0].url);
    if (panelCount() > 1) await placePhoto(1, SAMPLES[1].url);
    if (panelCount() > 3) await placePhoto(3, SAMPLES[2].url);
    state.selected = 0;
    redraw();
  })();
}
