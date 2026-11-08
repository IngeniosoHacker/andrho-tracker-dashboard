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
// ("Windows" are the sections; none has a frame — they sit on the stage's
// glass backdrop.) `bare` ones fill the whole viewport instead of the
// desktop area below the navbar; `framed` ones keep the light window frame
// on top of the glass (the astronaut's black-and-white art needs it).
export const MORPH_LENGTH = 0.6

export const WINDOWS = [
  { id: 'relajate', fadeIn: [0.5, 0.8], fadeOut: [1.5, 1.65], anchor: 0.9 },
  { id: 'como-funciona', nav: 'relajate', fadeIn: [1.65, 1.8], fadeOut: [2.45, 2.6], anchor: 1.9 },
  // Pricing is the third window, ~15% into the page: most visitors never
  // scroll past the first fifth.
  { id: 'precios', fadeIn: [2.6, 2.75], fadeOut: [3.6, 3.75], anchor: 2.85 },
  { id: 'ia-con-criterio', nav: 'relajate', bare: true, fadeIn: [3.75, 3.95], fadeOut: [4.9, 5.0], anchor: 4.05 },
  { id: 'adapta', framed: true, fadeIn: [5.0, 5.15], fadeOut: [5.7, 5.85], anchor: 5.2 },
  { id: 'todo-en-una-cuenta', nav: 'adapta', fadeIn: [5.85, 6.0], fadeOut: [6.65, 6.8], anchor: 6.1 },
  { id: 'nave', fadeIn: [6.8, 6.95], anchor: 7.05 },
]
export const STAGE_LENGTH = 7.55

// Creators timeline (Creators.jsx): its own pinned section after the stage.
// The first CREATORS_TRACK viewport-heights of scroll slide the horizontal
// track; the rest zoom into the last card, out of which the closing window
// grows.
export const CREATORS_TRACK = 3.6
export const CREATORS_LENGTH = 5.4

// Navbar entries, in order. `fromHero` ones are the bold words in the hero
// copy — they physically fly up into the navbar during the morph. The rest
// fade in next to them once the bar has formed. `wide` ones only show from
// the sm breakpoint (the phone bar has no room for all of them).
export const NAV_LINKS = [
  { id: 'relajate', label: 'relájate', fromHero: true },
  { id: 'precios', label: 'precios', fromHero: true },
  { id: 'adapta', label: 'adapta', fromHero: true },
  { id: 'nave', label: 'la nave' },
  { id: 'creators', label: 'creators' },
  { id: 'juego', label: 'juego', wide: true },
]

// Background palette: the hero starts as an inverted, black-on-white night
// sky and ends as the dark-blue space wallpaper the windows sit on.
export const SKY = {
  light: { bg: '#ffffff', star: '#0b1020' },
  dark: { bg: '#0a1330', star: '#ffffff' },
}
