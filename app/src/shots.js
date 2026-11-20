// Fixed scenes for the entry's screenshots, driven by the URL query:
//   ?shot=cover&template=boxart&size=post&photos=neon,car,boulevard&title=...&eyebrow=...&subtitle=...
//     → the cover alone, filling the window.
//   ?shot=editor&... (same parameters)
//     → the whole editor with that scene loaded.
// window.__shotReady is set once the scene is painted, so a screenshot tool can wait for it.

const SAMPLE_URLS = {
  neon: 'samples/neon.jpg',
  car: 'samples/car.jpg',
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

export async function runShot(query, api) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (query.get('template')) api.setTemplate(query.get('template'));
  if (query.get('size')) api.setSize(query.get('size'));
  for (const key of ['title', 'eyebrow', 'subtitle']) {
    if (query.get(key) !== null) api.setText(key, query.get(key));
  }
  const photos = (query.get('photos') ?? 'neon,car,boulevard,pier,neon').split(',').map((name) => name.trim());
  for (let i = 0; i < photos.length; i += 1) {
    const url = SAMPLE_URLS[photos[i]];
    if (url) await api.setSlotImage(i, url);
  }
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
