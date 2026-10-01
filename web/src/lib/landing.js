// Timeline + navigation map for the landing page.
//
// The landing is one long "stage" (see Stage.jsx) pinned to the viewport while
// the visitor scrolls. `t` = viewport-heights scrolled into it:
//
//   0 → MORPH_LENGTH   the white hero folds itself into the navbar. Kept short
//                      so it takes only a few wheel ticks; the morph code works
//                      on `morph` = t / MORPH_LENGTH (0 → 1).
//   WINDOW_OPEN        ONE big window opens over the space wallpaper and stays
//                      open. Its views slide inside it: sideways between the
//                      views of a group, up/down between groups (see
//                      `viewPosition` below and LandingWindow.jsx).
//   STAGE_LENGTH       the stage releases: the window (still open on its last
//                      view) scrolls away as the Creators timeline, then the
//                      game, scroll in.
//
// Each view's `anchor` is the `t` where it's settled; its #id is a plain
// anchor placed at that scroll offset (Stage.jsx). A group's id is the id of
// its first view, so #relajate / #adapta / #nave land on the group's start.
export const MORPH_LENGTH = 0.6

export const WINDOW_OPEN = [0.5, 0.8]
// Each view holds for VIEW_HOLD, then slides to the next over the rest of
// VIEW_SPAN.
const VIEW_SPAN = 0.9
const VIEW_HOLD = 0.55
const VIEWS_START = 0.8

// Groups = the chapters of the window (and its tab bar). `views` are ids of
// components in LandingWindow.jsx; `label` is what the window's tab shows.
export const GROUPS = [
  { id: 'relajate', label: 'Relájate', views: ['relajate', 'como-funciona', 'ia-con-criterio'] },
  { id: 'adapta', label: 'Adapta', views: ['adapta', 'todo-en-una-cuenta'] },
  { id: 'nave', label: 'La nave', views: ['nave'] },
]

// Flat list of views in scroll order, each knowing its group, its row/column
// in the window's grid, and where it sits on the timeline.
export const VIEWS = GROUPS.flatMap((group, row) =>
  group.views.map((id, col) => ({ id, group: group.id, row, col })),
).map((view, i) => ({ ...view, index: i, anchor: VIEWS_START + i * VIEW_SPAN + VIEW_HOLD * 0.4 }))

const LAST = VIEWS.length - 1
export const STAGE_LENGTH = VIEWS_START + LAST * VIEW_SPAN + VIEW_HOLD

// Continuous view index at `t`: integer while a view holds, fractional while
// sliding to the next one (eased, so each slide starts and lands softly).
export function viewPosition(t) {
  const local = Math.max(0, t - VIEWS_START)
  const i = Math.floor(local / VIEW_SPAN)
  if (i >= LAST) return LAST
  const f = local - i * VIEW_SPAN
  if (f <= VIEW_HOLD) return i
  const p = (f - VIEW_HOLD) / (VIEW_SPAN - VIEW_HOLD)
  return i + (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
}

// The window's grid offset for a continuous view position: each group is a
// row, its views are columns. While sliding between two views of the same
// group only x moves; across a group boundary only y moves (each row keeps
// its own x, so the old row leaves on its last view and the new one arrives
// on its first).
export function gridOffset(pos) {
  const i = Math.floor(pos)
  const f = pos - i
  const from = VIEWS[i]
  const to = VIEWS[Math.min(i + 1, LAST)]
  const y = from.row === to.row ? from.row : from.row + f
  const rowX = GROUPS.map((group, row) => {
    const first = VIEWS.findIndex((v) => v.row === row)
    return Math.min(Math.max(pos - first, 0), group.views.length - 1)
  })
  return { y, rowX }
}

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
