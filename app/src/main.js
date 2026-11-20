// VICE FRAME's editor: wires the controls to the renderer in cover.js. Everything runs locally —
// photos are read into memory and never uploaded anywhere.
//
// State: one slot per panel of the chosen template. A slot holds the photo (an Image), its
// framing (panX/panY in -1..1, zoom >= 1) and its grade (0..1). Clicking a panel on the canvas
// selects its slot; dragging on the canvas pans the selected photo.

import { TEMPLATES, SIZES, drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = [
  { id: 'neon', label: 'Neon Portrait', url: 'samples/neon.jpg' },
  { id: 'car', label: 'Sunset Car', url: 'samples/car.jpg' },
  { id: 'boulevard', label: 'Boulevard', url: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'The Pier', url: 'samples/pier.jpg' },
];

const canvas = document.getElementById('cover');
const els = {
  template: document.getElementById('template'),
  size: document.getElementById('size'),
  title: document.getElementById('title'),
  eyebrow: document.getElementById('eyebrow'),
  subtitle: document.getElementById('subtitle'),
  photoFile: document.getElementById('photo-file'),
  samples: document.getElementById('samples'),
  zoom: document.getElementById('zoom'),
  grade: document.getElementById('grade'),
  panelLabel: document.getElementById('panel-label'),
  exportBtn: document.getElementById('export'),
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

function blankSlot() {
  return { image: null, panX: 0, panY: 0, zoom: 1, grade: 0.65 };
}

function syncSlots() {
  const count = TEMPLATES[state.template].panels.length;
  while (state.slots.length < count) state.slots.push(blankSlot());
  state.selected = Math.min(state.selected, count - 1);
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  syncSlots();
  drawCover(canvas, state);
  els.panelLabel.textContent = `Panel ${state.selected + 1} of ${TEMPLATES[state.template].panels.length}`;
  const slot = state.slots[state.selected];
  els.zoom.value = String(slot.zoom);
  els.grade.value = String(slot.grade);
}

async function setSlotImage(index, url) {
  state.slots[index] = { ...blankSlot(), image: await loadImage(url), grade: state.slots[index]?.grade ?? 0.65 };
  state.selected = index;
  redraw();
}

// ---------------------------------------------------------------- controls

for (const [key, template] of Object.entries(TEMPLATES)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = template.label;
  els.template.appendChild(option);
}
els.template.value = state.template;
els.template.addEventListener('change', () => {
  state.template = els.template.value;
  redraw();
});

for (const [key, size] of Object.entries(SIZES)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = size.label;
  els.size.appendChild(option);
}
els.size.addEventListener('change', () => {
  const size = SIZES[els.size.value];
  canvas.width = size.w;
  canvas.height = size.h;
  redraw();
});

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
    await setSlotImage(state.selected, sample.url);
    els.status.textContent = `${sample.label} is in panel ${state.selected + 1}. Pick another panel to place the next photo.`;
  });
  els.samples.appendChild(button);
}

document.getElementById('photo-button').addEventListener('click', () => els.photoFile.click());
els.photoFile.addEventListener('change', async () => {
  const file = els.photoFile.files[0];
  if (!file) return;
  await setSlotImage(state.selected, URL.createObjectURL(file));
  els.status.textContent = `Your photo is in panel ${state.selected + 1}. Drag it on the cover to reframe.`;
  els.photoFile.value = '';
});

document.getElementById('fill-all').addEventListener('click', async () => {
  // One photo, every panel: the classic single-photo cover.
  const slot = state.slots[state.selected];
  if (!slot.image) {
    els.status.textContent = 'Load a photo first, then spread it across every panel.';
    return;
  }
  const src = slot.image.src;
  for (let i = 0; i < state.slots.length; i += 1) {
    state.slots[i] = { ...blankSlot(), image: await loadImage(src), grade: slot.grade };
  }
  redraw();
});

els.zoom.addEventListener('input', () => {
  state.slots[state.selected].zoom = Number(els.zoom.value);
  redraw();
});
els.grade.addEventListener('input', () => {
  state.slots[state.selected].grade = Number(els.grade.value);
  redraw();
});
document.getElementById('grade-all').addEventListener('click', () => {
  const grade = state.slots[state.selected].grade;
  for (const slot of state.slots) slot.grade = grade;
  redraw();
});

els.exportBtn.addEventListener('click', () => {
  const size = SIZES[els.size.value];
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-cover-${size.w}x${size.h}.png`;
    a.click();
    els.status.textContent = `Saved vice-frame-cover-${size.w}x${size.h}.png — share it anywhere.`;
  }, 'image/png');
});

// ---------------------------------------------------------------- canvas interaction

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const rects = panelRects(state.template, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) {
      state.selected = i;
      drag = { startX: event.clientX, startY: event.clientY, panX: state.slots[i].panX, panY: state.slots[i].panY };
      canvas.setPointerCapture(event.pointerId);
      redraw();
      return;
    }
  }
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const slot = state.slots[state.selected];
  slot.panX = Math.max(-1, Math.min(1, drag.panX + ((event.clientX - drag.startX) / rect.width) * 2.2));
  slot.panY = Math.max(-1, Math.min(1, drag.panY + ((event.clientY - drag.startY) / rect.height) * 2.2));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

// Drag-and-drop a photo file anywhere on the page fills the selected panel.
window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('drop', async (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    await setSlotImage(state.selected, URL.createObjectURL(file));
  }
});

// ---------------------------------------------------------------- boot / screenshots

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query, {
    loadImage,
    setSlotImage,
    setTemplate: (name) => {
      if (TEMPLATES[name]) state.template = name;
    },
    setText: (key, value) => {
      if (key in state && typeof value === 'string') state[key] = value;
    },
    setSize: (key) => {
      const size = SIZES[key];
      if (size) {
        canvas.width = size.w;
        canvas.height = size.h;
        els.size.value = key;
      }
    },
    redraw,
  });
} else {
  (async () => {
    // A welcoming default scene: two samples placed, so the first paint is already a cover.
    syncSlots();
    await setSlotImage(0, SAMPLES[0].url);
    if (state.slots.length > 1) await setSlotImage(1, SAMPLES[1].url);
    if (state.slots.length > 3) await setSlotImage(3, SAMPLES[2].url);
    state.selected = 0;
    redraw();
  })();
}
