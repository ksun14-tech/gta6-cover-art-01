// shots.js — the entry's still photographs, composed from the URL alone.
//
// A scene is a query string, for example:
//   ?shot=cover&template=triptych&size=post&photos=car,neon,pier&title=Sunset%20Chase
//
//   shot      "cover" frames the artwork by itself (the body gains the
//             shot-cover class, which takes the control rail away); "editor"
//             frames the whole app with the scene loaded into it.
//   template  a layout key from cover.js — boxart | triptych | hero | strip
//   size      an export-size key — post | portrait | story | wide
//   photos    sample ids separated by commas, one per panel, in panel order;
//             an id the app does not ship is skipped rather than fatal
//   title, eyebrow, subtitle   the lettering, used exactly as given
//
// The scene is read into a plain object first and only then applied through
// the editor API main.js hands over, so parsing and painting stay separate.
// When the painting is done, window.__shotReady is raised two animation
// frames later — capture tools wait for it, and the frame they take is the
// frame a user would see.

/** The sample ids a scene may name, each mapped to its file under app/samples. */
const FILES = {
  neon: 'samples/neon.jpg',
  car: 'samples/car.jpg',
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

/** Panels filled when a scene names no photos: a tour of all four samples. */
const FALLBACK_PHOTOS = 'neon,car,boulevard,pier,neon';

/** Turns a scene URL's query into { coverOnly, template, size, words, urls }. */
function readScene(query) {
  const ids = (query.get('photos') ?? FALLBACK_PHOTOS)
    .split(',')
    .map((id) => id.trim())
    .filter((id) => Object.hasOwn(FILES, id));
  return {
    coverOnly: query.get('shot') === 'cover',
    template: query.get('template'),
    size: query.get('size'),
    words: {
      title: query.get('title'),
      eyebrow: query.get('eyebrow'),
      subtitle: query.get('subtitle'),
    },
    urls: ids.map((id) => FILES[id]),
  };
}

/**
 * Applies the scene `query` describes through `api` — the narrow editor
 * surface main.js provides ({ setTemplate, setSize, setText, setSlotImage,
 * redraw }) — placing photos one at a time so URL order is panel order,
 * then flags the finished frame.
 */
export async function runShot(query, api) {
  const scene = readScene(query);
  if (scene.coverOnly) document.body.classList.add('shot-cover');
  if (scene.template) api.setTemplate(scene.template);
  if (scene.size) api.setSize(scene.size);
  for (const [field, value] of Object.entries(scene.words)) {
    if (value !== null) api.setText(field, value);
  }
  for (let panel = 0; panel < scene.urls.length; panel += 1) {
    await api.setSlotImage(panel, scene.urls[panel]);
  }
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
