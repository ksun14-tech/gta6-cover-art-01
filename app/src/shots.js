// shots.js — deterministic screenshot scenes, addressed entirely by URL query.
//
// The entry's screenshots are captured from URLs like:
//   ?shot=cover&template=triptych&size=post&photos=car,neon,pier&title=Sunset%20Chase
//
//   shot      "cover" shows the artwork alone (the body gets the shot-cover class,
//             which hides the control rail); "editor" shows the whole app.
//   template  a layout key from cover.js: boxart | triptych | hero | strip
//   size      an export-size key: post | portrait | story | wide
//   photos    comma-separated sample ids, one per panel, in panel order
//   title / eyebrow / subtitle   the lettering, taken verbatim
//
// Once the scene is fully painted, window.__shotReady is set — two animation frames
// after the final redraw, so the frame a tool captures is the frame a user would see.

/** Sample ids the scene language accepts, mapped to their files under app/samples. */
const SAMPLE_FILES = {
  neon: 'samples/neon.jpg',
  car: 'samples/car.jpg',
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

/** Panels filled when a scene URL does not say: a spread across all four samples. */
const DEFAULT_PHOTOS = ['neon', 'car', 'boulevard', 'pier', 'neon'];

/**
 * Builds the scene `query` describes through the editor API supplied by main.js
 * ({ setTemplate, setSize, setText, setSlotImage, redraw }) and flags readiness.
 * Photos are placed sequentially so panel i of the URL is panel i of the cover.
 */
export async function runShot(query, api) {
  if (query.get('shot') === 'cover') document.body.classList.add('shot-cover');

  const template = query.get('template');
  if (template) api.setTemplate(template);
  const size = query.get('size');
  if (size) api.setSize(size);
  for (const field of ['title', 'eyebrow', 'subtitle']) {
    const value = query.get(field);
    if (value !== null) api.setText(field, value);
  }

  const requested = (query.get('photos') ?? DEFAULT_PHOTOS.join(','))
    .split(',')
    .map((id) => id.trim());
  const usable = requested.filter((id) => Object.hasOwn(SAMPLE_FILES, id));
  for (let panel = 0; panel < usable.length; panel += 1) {
    await api.setSlotImage(panel, SAMPLE_FILES[usable[panel]]);
  }

  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
