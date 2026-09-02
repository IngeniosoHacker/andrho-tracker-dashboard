// Generates small on-brand SVG "planet" tiles (as data URIs) to texture the
// InfiniteMenu sphere, instead of unrelated stock photography or emoji
// glyphs. Data URIs are same-origin, so they also sidestep the
// canvas-tainting/CORS issues that external images would otherwise hit when
// read back into a WebGL texture.
const PLANETS = [
  { base: '#FFC745', shade: '#FF2162', variant: 'ring' },
  { base: '#6EE7FF', shade: '#2C6E8F', variant: 'bands' },
  { base: '#FF7A9C', shade: '#FF2162', variant: 'craters' },
  { base: '#6EE7FF', shade: '#241F45', variant: 'glow' },
  { base: '#FFC745', shade: '#241F45', variant: 'moon' },
  { base: '#B98BFF', shade: '#241F45', variant: 'terminator' },
]

const CX = 320
const CY = 254
const R = 138

function starsMarkup(seed) {
  let stars = ''
  for (let i = 0; i < 16; i++) {
    const x = (i * 97 + seed * 53) % 640
    const y = (i * 131 + seed * 29) % 640
    const r = (i % 3) * 0.6 + 0.6
    const o = (0.25 + ((i * 17) % 40) / 100).toFixed(2)
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#f5f2ff" opacity="${o}" />`
  }
  return stars
}

// Overlay rendered *before* the sphere (e.g. the far side of a ring, or an
// atmospheric glow that should sit behind the planet's own shading).
function behindOverlay(variant, base) {
  if (variant === 'ring') {
    return `<ellipse cx="${CX}" cy="${CY}" rx="${R * 1.9}" ry="${R * 0.4}" fill="none" stroke="${base}" stroke-width="16" opacity="0.5" transform="rotate(-16 ${CX} ${CY})" />`
  }
  if (variant === 'glow') {
    return `<circle cx="${CX}" cy="${CY}" r="${R * 1.35}" fill="${base}" opacity="0.35" filter="url(#blur)" />`
  }
  return ''
}

// Overlay rendered *after* the sphere, clipped to its silhouette (surface
// detail) or drawn just outside it (a moon).
function frontOverlay(variant, shade) {
  switch (variant) {
    case 'bands':
      return `
        <g clip-path="url(#clip)">
          <rect x="${CX - R}" y="${CY - R * 0.7}" width="${R * 2}" height="${R * 0.28}" fill="${shade}" opacity="0.35" />
          <rect x="${CX - R}" y="${CY - R * 0.08}" width="${R * 2}" height="${R * 0.2}" fill="${shade}" opacity="0.28" />
          <rect x="${CX - R}" y="${CY + R * 0.32}" width="${R * 2}" height="${R * 0.32}" fill="${shade}" opacity="0.32" />
        </g>`
    case 'craters':
      return `
        <g clip-path="url(#clip)" opacity="0.4">
          <circle cx="${CX - R * 0.35}" cy="${CY - R * 0.3}" r="${R * 0.16}" fill="${shade}" />
          <circle cx="${CX + R * 0.28}" cy="${CY - R * 0.05}" r="${R * 0.1}" fill="${shade}" />
          <circle cx="${CX - R * 0.1}" cy="${CY + R * 0.32}" r="${R * 0.13}" fill="${shade}" />
          <circle cx="${CX + R * 0.4}" cy="${CY + R * 0.38}" r="${R * 0.08}" fill="${shade}" />
        </g>`
    case 'moon':
      return `<circle cx="${CX + R * 1.35}" cy="${CY + R * 0.7}" r="${R * 0.22}" fill="${shade}" opacity="0.85" />`
    case 'terminator':
      return `
        <g clip-path="url(#clip)">
          <rect x="${CX}" y="${CY - R}" width="${R}" height="${R * 2}" fill="#0b0a1a" opacity="0.4" />
        </g>`
    default:
      return ''
  }
}

export function makeTileImage({ label, index = 0 }) {
  const { base, shade, variant } = PLANETS[index % PLANETS.length]

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
  <defs>
    <radialGradient id="sphere" cx="35%" cy="32%" r="75%">
      <stop offset="0%" stop-color="#f5f2ff" stop-opacity="0.9" />
      <stop offset="35%" stop-color="${base}" />
      <stop offset="75%" stop-color="${shade}" />
      <stop offset="100%" stop-color="#0b0a1a" />
    </radialGradient>
    <clipPath id="clip">
      <circle cx="${CX}" cy="${CY}" r="${R}" />
    </clipPath>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>

  <rect width="640" height="640" fill="#0b0a1a" />
  ${starsMarkup(index)}
  ${behindOverlay(variant, base)}
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#sphere)" />
  ${frontOverlay(variant, shade)}
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#f5f2ff" stroke-width="1.5" opacity="0.25" />
  <text x="320" y="512" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="32" fill="#f5f2ff">${label}</text>
</svg>`.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
