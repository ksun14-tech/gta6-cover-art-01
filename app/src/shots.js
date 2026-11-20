// shots.js — the fixed scenes the entry's screenshots are taken from.
//
// The app is driven entirely by the URL query, for example:
//   ?shot=cover&template=boxart&size=post&photos=neon,car&title=Vice%20City%20Heat
//     shot=cover   → the cover alone fills the window (body.shot-cover hides the rail)
//     shot=editor  → the whole editor, with the same scene loaded into it
//     template     → a layout key from cover.js (boxart, triptych, hero, strip)
//     size         → an export-size key (post, portrait, story, wide)
//     photos       → sample ids, one per panel, in panel order
//     title / eyebrow / subtitle → the lettering, verbatim
//
// When the scene has painted, window.__shotReady becomes true (after two animation
// frames, so the canvas is genuinely on screen) and a screenshot tool can fire.

/** Sample id → file, mirroring the editor's own sample list. */
const SAMPLE_URLS = {
  neon: 'samples/neon.jpg',
  car: 'samples/car.jpg',
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

/** The scene used when a screenshot URL leaves the photos unspecified. */
const FALLBACK_PHOTOS = 'neon,car,boulevard,pier,neon';

/**
 * Applies the scene described by `query` through the editor's API (see main.js) and
 * signals readiness. Photos load one panel at a time, in order, so panel numbering in
 * the scene matches panel numbering on the cover.
 */
export async function runShot(query, api) {
  if (query.get('shot') === 'cover') document.body.classList.add('shot-cover');

  if (query.get('template')) api.setTemplate(query.get('template'));
  if (query.get('size')) api.setSize(query.get('size'));
  for (const key of ['title', 'eyebrow', 'subtitle']) {
    const value = query.get(key);
    if (value !== null) api.setText(key, value);
  }

  const photoIds = (query.get('photos') ?? FALLBACK_PHOTOS)
    .split(',')
    .map((id) => id.trim())
    .filter((id) => SAMPLE_URLS[id]);
  for (let panel = 0; panel < photoIds.length; panel += 1) {
    await api.setSlotImage(panel, SAMPLE_URLS[photoIds[panel]]);
  }

  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
