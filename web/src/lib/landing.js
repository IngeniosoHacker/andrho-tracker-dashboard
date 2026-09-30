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
//   STAGE_LENGTH       the stage releases and the game section scrolls in
//
// Each window's `anchor` is the `t` where it's fully open; its #id is a plain
// anchor placed at that scroll offset. `nav` = the navbar link that stays
// highlighted while the window is open (windows without their own link).
export const MORPH_LENGTH = 0.6
export const STAGE_LENGTH = 4.55

export const WINDOWS = [
  { id: 'relajate', fadeIn: [0.5, 0.8], fadeOut: [1.5, 1.65], anchor: 0.9 },
  { id: 'como-funciona', nav: 'relajate', fadeIn: [1.65, 1.8], fadeOut: [2.45, 2.6], anchor: 1.9 },
  { id: 'adapta', fadeIn: [2.6, 2.75], fadeOut: [3.4, 3.55], anchor: 2.85 },
  { id: 'nave', fadeIn: [3.55, 3.7], fadeOut: [4.3, 4.55], anchor: 3.8 },
]

// Navbar entries, in order. `fromHero` ones are the bold words in the hero
// copy — they physically fly up into the navbar during the morph. The rest
// fade in next to them once the bar has formed.
export const NAV_LINKS = [
  { id: 'relajate', label: 'relájate', fromHero: true },
  { id: 'adapta', label: 'adapta', fromHero: true },
  { id: 'nave', label: 'la nave' },
  { id: 'juego', label: 'juego' },
]

// Background palette: the hero starts as an inverted, black-on-white night
// sky and ends as the dark-blue space wallpaper the windows sit on.
export const SKY = {
  light: { bg: '#ffffff', star: '#0b1020' },
  dark: { bg: '#0a1330', star: '#ffffff' },
}
