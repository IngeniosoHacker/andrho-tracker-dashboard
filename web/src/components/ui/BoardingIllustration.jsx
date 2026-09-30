// Flat illustration for the waitlist window: a saucer beaming up a boarding
// pass. Same palette as the PDF artwork (mint/teal, ink, off-white) so it
// sits next to the alien and astronaut without looking borrowed.
const TEAL = '#4fb39b'
const MINT = '#7fdcc3'
const MINT_SOFT = '#bfeee0'
const INK = '#0b1020'

const DOTS = Array.from({ length: 35 }, (_, i) => [372 + (i % 7) * 14, 26 + Math.floor(i / 7) * 14])
// [x offset, width] per bar of the stub's barcode.
const BARS = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1].reduce(
  (acc, w) => {
    acc.bars.push([acc.x, w * 2])
    acc.x += w * 2 + 2
    return acc
  },
  { x: 0, bars: [] },
).bars

export default function BoardingIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 440" className={className} role="img" aria-label="Un platillo volador subiendo un pase de abordaje con su rayo">
      <defs>
        <linearGradient id="bi-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MINT} stopOpacity="0.75" />
          <stop offset="100%" stopColor={MINT} stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {DOTS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill={MINT} opacity="0.7" />
      ))}

      <polygon points="392,396 470,236 470,396" fill={MINT} opacity="0.75" />
      <ellipse cx="226" cy="398" rx="170" ry="16" fill={MINT} opacity="0.35" />

      {/* beam */}
      <polygon points="176,132 276,132 356,396 96,396" fill="url(#bi-beam)" />

      {/* saucer */}
      <path d="M174 100 C176 40 276 40 278 100 Z" fill={MINT_SOFT} />
      <ellipse cx="250" cy="66" rx="10" ry="6" fill="#ffffff" opacity="0.8" />
      <ellipse cx="226" cy="112" rx="124" ry="30" fill={TEAL} />
      <ellipse cx="226" cy="104" rx="124" ry="16" fill={MINT} />
      {[146, 186, 226, 266, 306].map((cx) => (
        <circle key={cx} cx={cx} cy="122" r="6" fill="#f6ecb0" />
      ))}

      {/* boarding pass */}
      <g transform="rotate(-8 226 268)">
        <rect x="118" y="218" width="216" height="104" rx="12" fill="#ffffff" />
        <path d="M130 218 h192 a12 12 0 0 1 12 12 v14 h-216 v-14 a12 12 0 0 1 12 -12 z" fill={TEAL} />
        <text x="132" y="236" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#ffffff" letterSpacing="2">
          PASE DE ABORDAJE
        </text>
        <text x="132" y="272" fontFamily="Space Grotesk, sans-serif" fontSize="22" fontWeight="700" fill={INK}>
          AndRho
        </text>
        <text x="132" y="294" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#3f4a63" letterSpacing="1">
          PUERTA ρ-01
        </text>
        <text x="132" y="310" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#3f4a63" letterSpacing="1">
          LISTA DE ESPERA
        </text>
        <line x1="274" y1="248" x2="274" y2="318" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        {BARS.map(([x, w]) => (
          <rect key={x} x={284 + x} y="256" width={w} height="52" fill={INK} />
        ))}
      </g>

      {/* pixel sparkles — the same pixel stars as the hero */}
      <g fill={INK}>
        <rect x="70" y="60" width="6" height="6" />
        <rect x="64" y="60" width="6" height="6" opacity="0.4" />
        <rect x="76" y="60" width="6" height="6" opacity="0.4" />
        <rect x="70" y="54" width="6" height="6" opacity="0.4" />
        <rect x="70" y="66" width="6" height="6" opacity="0.4" />
        <rect x="40" y="190" width="6" height="6" />
        <rect x="420" y="170" width="6" height="6" />
        <rect x="360" y="150" width="4" height="4" />
        <rect x="104" y="140" width="4" height="4" />
      </g>
    </svg>
  )
}
