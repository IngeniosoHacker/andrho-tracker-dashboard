// Tiny math helpers for the scroll-driven landing (see App.jsx / Stage.jsx).
// Everything on the landing is a pure function of one number, `t`: how many
// viewport-heights the visitor has scrolled into the stage. These helpers turn
// that into per-element progress values.
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export const lerp = (a, b, p) => a + (b - a) * p

// 0 before `start`, 1 after `end`, linear in between.
export const seg = (t, start, end) => clamp((t - start) / (end - start))

export const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

export const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3)

// Overshoots slightly before settling — used for the logo "pop" when the
// wordmark bumps into the left edge of the navbar.
export const easeOutBack = (p) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}

// Mixes two #rrggbb colors, returns an rgb() string.
export function mixColor(from, to, p) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return `rgb(${Math.round(lerp(a[0], b[0], p))}, ${Math.round(lerp(a[1], b[1], p))}, ${Math.round(lerp(a[2], b[2], p))})`
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
