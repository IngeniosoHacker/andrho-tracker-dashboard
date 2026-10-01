// Timeline + navigation map for the landing page.
//
// The landing starts with a short "stage" (see Stage.jsx) pinned to the
// viewport while the visitor scrolls. `t` = viewport-heights scrolled into it:
//
//   0 → MORPH_LENGTH   the white hero folds itself into the navbar. Kept short
//                      so it takes only a few wheel ticks; the morph code works
//                      on `morph` = t / MORPH_LENGTH (0 → 1).
//   → STAGE_LENGTH     the big window (LandingWindow.jsx) rises from below
//                      over the space wallpaper.
//
// From there the page just scrolls: the window is one tall panel with its
// views stacked top to bottom, followed by the Creators timeline and the game.
export const MORPH_LENGTH = 0.6
export const STAGE_LENGTH = MORPH_LENGTH + 0.6

// Groups = the chapters of the window (and its tab bar). `views` are ids of
// components in LandingWindow.jsx, each rendered as a section with that #id;
// `label` is what the window's tab shows. A group's id is the id of its
// first view, so #relajate / #adapta / #nave land on the group's start.
export const GROUPS = [
  { id: 'relajate', label: 'Relájate', views: ['relajate', 'como-funciona', 'ia-con-criterio'] },
  { id: 'adapta', label: 'Adapta', views: ['adapta', 'todo-en-una-cuenta'] },
  { id: 'nave', label: 'La nave', views: ['nave'] },
]

// Creators timeline (Creators.jsx): its own pinned section after the stage,
// `CREATORS_LENGTH` viewport-heights of scroll drive the horizontal track.
export const CREATORS_LENGTH = 3.6

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
