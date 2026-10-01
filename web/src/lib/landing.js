// Timeline + navigation map for the landing page.
//
// The landing is one long "stage" (see Stage.jsx) pinned to the viewport while
// the visitor scrolls. `t` = viewport-heights scrolled into it:
//
//   0 → MORPH_LENGTH   the white hero folds itself into the navbar. Kept short
//                      so it takes only a few wheel ticks; the morph code works
//                      on `morph` = t / MORPH_LENGTH (0 → 1).
//   ~0.5 →             windows open over the space wallpaper, one at a time,
//                      fading between each other
//   STAGE_LENGTH       the stage releases (the last window stays open and
//                      scrolls away) and the Creators timeline scrolls in
//
// Each window's `anchor` is the `t` where it's fully open; its #id is a plain
// anchor placed at that scroll offset. `nav` = the navbar link that stays
// highlighted while the window is open (windows without their own link).
// `bare` windows have no frame: their content fills the whole viewport,
// straight on the wallpaper. `emergeFrom` = a window that doesn't fade in but
// grows out of an element of that (bare) window — the element marked with
// `data-emerge` (see Stage.jsx).
export const MORPH_LENGTH = 0.6

export const WINDOWS = [
  { id: 'relajate', fadeIn: [0.5, 0.8], fadeOut: [1.5, 1.65], anchor: 0.9 },
  { id: 'como-funciona', nav: 'relajate', fadeIn: [1.65, 1.8], fadeOut: [2.45, 2.6], anchor: 1.9 },
  { id: 'ia-con-criterio', nav: 'relajate', bare: true, fadeIn: [2.6, 2.8], fadeOut: [3.75, 3.85], anchor: 2.9 },
  { id: 'adapta', emergeFrom: 'ia-con-criterio', fadeIn: [3.45, 3.85], fadeOut: [4.55, 4.7], anchor: 3.95 },
  { id: 'todo-en-una-cuenta', nav: 'adapta', fadeIn: [4.7, 4.85], fadeOut: [5.5, 5.65], anchor: 4.95 },
  { id: 'nave', fadeIn: [5.65, 5.8], anchor: 5.9 },
]
export const STAGE_LENGTH = 6.4

// Creators timeline (Creators.jsx): its own pinned section after the stage.
// The first CREATORS_TRACK viewport-heights of scroll slide the horizontal
// track; the rest zoom into the last card, out of which the closing window
// grows.
export const CREATORS_TRACK = 3.6
export const CREATORS_LENGTH = 5.4

// Navbar entries, in order. `fromHero` ones are the bold words in the hero
// copy — they physically fly up into the navbar during the morph. The rest
// fade in next to them once the bar has formed.
export const NAV_LINKS = [
  { id: 'relajate', label: 'relájate', fromHero: true },
  { id: 'adapta', label: 'adapta', fromHero: true },
  { id: 'nave', label: 'la nave' },
  { id: 'creators', label: 'creators' },
  { id: 'juego', label: 'juego' },
]

// Background palette: the hero starts as an inverted, black-on-white night
// sky and ends as the dark-blue space wallpaper the windows sit on.
export const SKY = {
  light: { bg: '#ffffff', star: '#0b1020' },
  dark: { bg: '#0a1330', star: '#ffffff' },
}
