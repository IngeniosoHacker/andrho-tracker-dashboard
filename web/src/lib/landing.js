// Timeline + navigation map for the landing page.
//
// The landing is one long "stage" (see Stage.jsx) pinned to the viewport while
// the visitor scrolls. `t` = viewport-heights scrolled into it:
//
//   0 → 1     the white hero folds itself into the navbar (MORPH_END)
//   ~0.85 →   windows open over the space wallpaper, one at a time, fading
//             between each other
//   STAGE_LENGTH  the stage releases and the game section scrolls in
//
// Each window's `anchor` is the `t` where it's fully open; the nav links jump
// straight there (plain #hash anchors placed at that scroll offset).
export const MORPH_END = 1
export const STAGE_LENGTH = 4

export const WINDOWS = [
  { id: 'relajate', fadeIn: [0.85, 1.2], fadeOut: [1.95, 2.12], anchor: 1.3 },
  { id: 'adapta', fadeIn: [2.12, 2.3], fadeOut: [2.9, 3.07], anchor: 2.4 },
  { id: 'nave', fadeIn: [3.07, 3.25], fadeOut: [3.75, 4], anchor: 3.35 },
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
