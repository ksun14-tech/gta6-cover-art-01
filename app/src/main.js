// main.js — the editor around the painter: a control rail on one side, the
// canvas on the other, and one small state object flowing between them.
//
// Privacy, plainly: this editor never phones home. A photo the user picks is
// decoded from a local object URL and drawn onto the canvas; the samples ship
// inside app/. Nothing is uploaded, tracked or stored between visits.
//
// The document under edit:
//   doc  = { template, slots, active, title, eyebrow, subtitle }
//   slot = { image, panX, panY, zoom, grade }
// pan runs -1..1 (a quarter panel of travel at the extremes), zoom 1..2.6 and
// grade 0..1. The rail's sliders always describe doc.slots[doc.active], and the
// canvas outlines that panel — except in cover screenshot scenes, where the
// artwork must stand alone.

import { LAYOUTS, EXPORT_SIZES, renderCover, panelBoxes } from './cover.js';
import { runShot } from './shots.js';

/** The bundled photographs, in the order the sample tray shows them. */
const SAMPLES = [
  { id: 'neon', label: 'Neon Portrait', file: 'samples/neon.jpg' },
  { id: 'car', label: 'Sunset Car', file: 'samples/car.jpg' },
  { id: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'The Pier', file: 'samples/pier.jpg' },
];

const BASE_GRADE = 0.65;
const ZOOM_FLOOR = 1;
const ZOOM_CEILING = 2.6;

const byId = (id) => document.getElementById(id);
const canvas = byId('cover');
const rail = {
  template: byId('template'),
  size: byId('size'),
  title: byId('title'),
  eyebrow: byId('eyebrow'),
  subtitle: byId('subtitle'),
  file: byId('photo-file'),
  addPhoto: byId('photo-button'),
  tray: byId('samples'),
  spread: byId('fill-all'),
  zoom: byId('zoom'),
  grade: byId('grade'),
  matchGrade: byId('grade-all'),
  panelName: byId('panel-label'),
  save: byId('export'),
  note: byId('status'),
};

const doc = {
  template: 'boxart',
  slots: [],
  active: 0,
  title: 'VICE CITY HEAT',
  eyebrow: 'GRAND THEFT AUTO VI · FAN COVER',
  subtitle: 'MAKE YOUR OWN AT VICE FRAME',
};

/** True while a ?shot=cover scene is captured: those stills are pure artwork. */
let capturingCover = false;

// ------------------------------------------------------------ state helpers

function blankSlot(grade = BASE_GRADE) {
  return { image: null, panX: 0, panY: 0, zoom: 1, grade };
}

function slotCount() {
  return LAYOUTS[doc.template].panels.length;
}

function activeSlot() {
  return doc.slots[doc.active];
}

const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

/** Keeps the slot list long enough for the current layout and the selection
 *  inside it; called before every repaint so no path can paint a stale shape. */
function padSlots() {
  while (doc.slots.length < slotCount()) doc.slots.push(blankSlot());
  doc.active = Math.min(doc.active, slotCount() - 1);
}

/** Decodes an image from a sample path or an object URL, as a promise. */
function decode(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Repaints the cover, then re-syncs the rail readouts that mirror the
 *  selected slot (its position label and its two sliders). */
function paint() {
  padSlots();
  renderCover(canvas, doc, capturingCover ? -1 : doc.active);
  rail.panelName.textContent = `Panel ${doc.active + 1} of ${slotCount()}`;
  rail.zoom.value = String(activeSlot().zoom);
  rail.grade.value = String(activeSlot().grade);
}

/** The one-line status message under the export button. */
function say(message) {
  rail.note.textContent = message;
}

/** Puts the photo at `url` into panel `index`, preserving that panel's grade,
 *  makes the panel the active one, and repaints. */
async function putPhoto(index, url) {
  const grade = doc.slots[index]?.grade ?? BASE_GRADE;
  doc.slots[index] = { ...blankSlot(grade), image: await decode(url) };
  doc.active = index;
  paint();
}

/** Resizes the canvas to one of the named export sizes and repaints. */
function setSize(key) {
  const size = EXPORT_SIZES[key];
  if (!size) return;
  canvas.width = size.w;
  canvas.height = size.h;
  rail.size.value = key;
  paint();
}

// --------------------------------------------------------------- the rail

/** Fills a <select> with one option per entry of a { key: { label } } table. */
function fillSelect(select, table) {
  for (const [key, entry] of Object.entries(table)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = entry.label;
    select.appendChild(option);
  }
  return select;
}

function wireRail() {
  fillSelect(rail.template, LAYOUTS).value = doc.template;
  rail.template.addEventListener('change', () => {
    doc.template = rail.template.value;
    paint();
    say(`${LAYOUTS[doc.template].label} layout: ${slotCount()} panels. Photos stay where they fit.`);
  });

  fillSelect(rail.size, EXPORT_SIZES);
  rail.size.addEventListener('change', () => setSize(rail.size.value));

  for (const key of ['title', 'eyebrow', 'subtitle']) {
    rail[key].value = doc[key];
    rail[key].addEventListener('input', () => {
      doc[key] = rail[key].value;
      paint();
    });
  }

  for (const sample of SAMPLES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sample';
    button.textContent = sample.label;
    button.addEventListener('click', async () => {
      await putPhoto(doc.active, sample.file);
      say(`${sample.label} is in panel ${doc.active + 1}. Pick another panel for the next photo.`);
    });
    rail.tray.appendChild(button);
  }

  rail.addPhoto.addEventListener('click', () => rail.file.click());
  rail.file.addEventListener('change', async () => {
    const file = rail.file.files?.[0];
    if (!file) return;
    await putPhoto(doc.active, URL.createObjectURL(file));
    say(`Your photo is in panel ${doc.active + 1}. Drag it, or nudge with the arrow keys.`);
    rail.file.value = '';
  });

  rail.spread.addEventListener('click', async () => {
    const source = activeSlot();
    if (!source.image) {
      say('Put a photo in this panel first, then spread it across every panel.');
      return;
    }
    const { src } = source.image;
    for (let i = 0; i < doc.slots.length; i += 1) {
      doc.slots[i] = { ...blankSlot(source.grade), image: await decode(src) };
    }
    paint();
    say('One photo, every panel — the classic single-photo cover.');
  });

  rail.zoom.addEventListener('input', () => {
    activeSlot().zoom = Number(rail.zoom.value);
    paint();
  });
  rail.grade.addEventListener('input', () => {
    activeSlot().grade = Number(rail.grade.value);
    paint();
  });
  rail.matchGrade.addEventListener('click', () => {
    const grade = activeSlot().grade;
    for (const slot of doc.slots) slot.grade = grade;
    paint();
    say('Every panel now uses this grade.');
  });

  rail.save.addEventListener('click', () => {
    // Paint one clean frame (no selection), snapshot it, then put the
    // editor's outline back with a normal repaint.
    renderCover(canvas, doc);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vice-frame-cover-${canvas.width}x${canvas.height}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      paint();
      say(`Saved ${link.download} — post it anywhere.`);
    }, 'image/png');
  });
}

// ------------------------------------------------- pointer and keyboard

/** Pointer position translated into canvas pixels, at any display size. */
function pointerInCanvas(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * canvas.width,
    y: ((event.clientY - box.top) / box.height) * canvas.height,
  };
}

/** The frontmost panel under a canvas point, or -1 when the point misses all. */
function panelAt(point) {
  const boxes = panelBoxes(doc.template, canvas.width, canvas.height);
  for (let i = boxes.length - 1; i >= 0; i -= 1) {
    const b = boxes[i];
    if (point.x >= b.x && point.x <= b.x + b.w && point.y >= b.y && point.y <= b.y + b.h) return i;
  }
  return -1;
}

function wireCanvas() {
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const index = panelAt(pointerInCanvas(event));
    if (index < 0) return;
    doc.active = index;
    const slot = activeSlot();
    drag = { x: event.clientX, y: event.clientY, panX: slot.panX, panY: slot.panY };
    canvas.setPointerCapture(event.pointerId);
    paint();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const box = canvas.getBoundingClientRect();
    const slot = activeSlot();
    slot.panX = clamp(drag.panX + ((event.clientX - drag.x) / box.width) * 2.2, -1, 1);
    slot.panY = clamp(drag.panY + ((event.clientY - drag.y) / box.height) * 2.2, -1, 1);
    paint();
  });
  const release = () => { drag = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // Double-clicking a panel resets just that panel's framing — pan back to
  // centre, zoom back to 1 — leaving its photo and grade untouched. It is
  // the fastest way out of a framing you have dragged yourself into.
  canvas.addEventListener('dblclick', (event) => {
    const index = panelAt(pointerInCanvas(event));
    if (index < 0) return;
    const slot = doc.slots[index];
    if (!slot) return;
    slot.panX = 0;
    slot.panY = 0;
    slot.zoom = 1;
    doc.active = index;
    paint();
    say(`Panel ${index + 1} framing reset.`);
  });

  // A photo file dropped anywhere on the page lands in the active panel.
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', async (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) {
      await putPhoto(doc.active, URL.createObjectURL(file));
      say(`Dropped into panel ${doc.active + 1}.`);
    }
  });
}

function wireKeys() {
  // Arrow keys pan the active photo (Shift travels further), + / − zoom it.
  // Events aimed at form controls are left alone so inputs keep their keys.
  window.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement
      || target instanceof HTMLSelectElement
      || target instanceof HTMLTextAreaElement) return;
    const slot = activeSlot();
    if (!slot) return;
    const step = event.shiftKey ? 0.14 : 0.04;
    const moves = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[event.key]) {
      slot.panX = clamp(slot.panX + moves[event.key][0], -1, 1);
      slot.panY = clamp(slot.panY + moves[event.key][1], -1, 1);
      event.preventDefault();
      paint();
    } else if (event.key === '+' || event.key === '=') {
      slot.zoom = clamp(slot.zoom + 0.05, ZOOM_FLOOR, ZOOM_CEILING);
      paint();
    } else if (event.key === '-' || event.key === '_') {
      slot.zoom = clamp(slot.zoom - 0.05, ZOOM_FLOOR, ZOOM_CEILING);
      paint();
    }
  });
}

// ------------------------------------------------------------------- boot

wireRail();
wireCanvas();
wireKeys();

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  // Screenshot scene: shots.js drives the same state through this narrow API.
  // Cover scenes are captured clean; editor scenes keep the outline, because
  // the outline is part of the editing story those stills are telling.
  capturingCover = query.get('shot') === 'cover';
  runShot(query, {
    loadImage: decode,
    setSlotImage: putPhoto,
    setTemplate: (name) => { if (LAYOUTS[name]) doc.template = name; },
    setText: (key, value) => {
      if (['title', 'eyebrow', 'subtitle'].includes(key)) doc[key] = value;
    },
    setSize,
    redraw: paint,
  });
} else {
  // Open on a finished-looking cover: three samples already in place.
  (async () => {
    padSlots();
    await putPhoto(0, SAMPLES[0].file);
    if (slotCount() > 1) await putPhoto(1, SAMPLES[1].file);
    if (slotCount() > 3) await putPhoto(3, SAMPLES[2].file);
    doc.active = 0;
    paint();
  })();
}
