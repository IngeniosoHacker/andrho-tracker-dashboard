// Flat illustration for the "la nave" window: a saucer beaming up a boarding
// pass while a meteor falls and a T-rex runs for the beam — the ones who
// don't board go the way of the dinosaurs. Same palette as the PDF artwork
// (mint/teal, ink, off-white) plus the meteor's fire, so it sits next to the
// alien and astronaut without looking borrowed.
const TEAL = '#4fb39b'
const MINT = '#7fdcc3'
const MINT_SOFT = '#bfeee0'
const INK = '#0b1020'
const DINO = '#3f4a63'
const FIRE = '#ff7a45'
const FIRE_SOFT = '#ffc46b'

// Motion only for people who haven't asked to reduce it.
const MOTION_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .bi-dino { animation: bi-run 0.32s ease-in-out infinite alternate; }
  .bi-trail { animation: bi-flicker 0.18s linear infinite alternate; transform-box: fill-box; transform-origin: 100% 100%; }
}
@keyframes bi-run { from { transform: translateY(0); } to { transform: translateY(-5px); } }
@keyframes bi-flicker { from { opacity: 0.85; transform: scale(1); } to { opacity: 1; transform: scale(1.04); } }
`

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
    <svg
      viewBox="-140 0 620 440"
      className={className}
      role="img"
      aria-label="Un platillo volador sube un pase de abordaje con su rayo mientras un dinosaurio corre hacia la nave huyendo de un meteorito"
    >
      <style>{MOTION_CSS}</style>
      <defs>
        <linearGradient id="bi-trail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={FIRE_SOFT} stopOpacity="0" />
          <stop offset="70%" stopColor={FIRE_SOFT} stopOpacity="0.8" />
          <stop offset="100%" stopColor={FIRE} />
        </linearGradient>
        <radialGradient id="bi-impact">
          <stop offset="0%" stopColor={FIRE} stopOpacity="0.45" />
          <stop offset="100%" stopColor={FIRE} stopOpacity="0" />
        </radialGradient>
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

      {/* where the meteor is about to land: right behind the dinosaur */}
      <ellipse cx="-70" cy="398" rx="70" ry="14" fill="url(#bi-impact)" />

      {/* meteor, falling toward the dinosaur */}
      <g transform="rotate(38 -38 128)">
        <path className="bi-trail" d="M-150 112 Q-90 104 -38 112 L-38 144 Q-90 152 -150 144 Q-110 128 -150 112 Z" fill="url(#bi-trail)" />
        <circle cx="-38" cy="128" r="24" fill={FIRE} opacity="0.35" />
        <circle cx="-38" cy="128" r="17" fill="#7a5a4a" />
        <circle cx="-44" cy="122" r="4" fill="#5c4033" />
        <circle cx="-31" cy="135" r="3" fill="#5c4033" />
        <circle cx="-30" cy="120" r="2.5" fill="#5c4033" />
      </g>

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
          PASE DE ABORDAJE
        </text>
        <line x1="274" y1="248" x2="274" y2="318" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        {BARS.map(([x, w]) => (
          <rect key={x} x={284 + x} y="256" width={w} height="52" fill={INK} />
        ))}
      </g>

      {/* T-rex running for the beam */}
      <g transform="translate(14 398) scale(0.92)">
        {/* speed lines */}
        <g stroke={DINO} strokeWidth="3" strokeLinecap="round" opacity="0.35">
          <line x1="-112" y1="-86" x2="-84" y2="-86" />
          <line x1="-120" y1="-66" x2="-82" y2="-66" />
          <line x1="-104" y1="-46" x2="-80" y2="-46" />
        </g>
        <g className="bi-dino">
          {/* far leg, kicked back */}
          <path d="M-8 -40 L-2 -20 L-30 -8 L-40 -10" fill="none" stroke="#2c3549" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M-70 -62 Q-40 -70 -20 -72 C0 -82 20 -80 30 -88 L34 -104 Q36 -112 46 -112 L74 -110 Q80 -109 80 -102 L80 -96 L54 -94 L74 -88 Q78 -84 72 -80 L48 -78 C44 -64 36 -48 20 -38 C6 -30 -16 -32 -26 -42 Q-46 -54 -70 -62 Z"
            fill={DINO}
          />
          {/* teeth */}
          <path d="M60 -95 l3 4 l3 -4 l3 4 l3 -4" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
          {/* wide, scared eye */}
          <circle cx="58" cy="-103" r="5" fill="#ffffff" />
          <circle cx="60" cy="-103" r="2" fill={INK} />
          {/* tiny arm */}
          <path d="M36 -62 L46 -56 L48 -50" fill="none" stroke={DINO} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* near leg, reaching forward */}
          <path d="M4 -40 L24 -24 L18 -2 L32 -2" fill="none" stroke={DINO} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          {/* sweat */}
          <path d="M28 -122 q-5 7 0 9 q5 -2 0 -9 z" fill={MINT} />
          <path d="M18 -114 q-4 6 0 7 q4 -1 0 -7 z" fill={MINT} opacity="0.7" />
        </g>
        {/* dust kicked up */}
        <g fill={DINO} opacity="0.25">
          <circle cx="-46" cy="-6" r="7" />
          <circle cx="-60" cy="-10" r="5" />
          <circle cx="-72" cy="-4" r="4" />
        </g>
      </g>

      {/* pixel sparkles — the same pixel stars as the hero */}
      <g fill={INK}>
        <rect x="70" y="60" width="6" height="6" />
        <rect x="64" y="60" width="6" height="6" opacity="0.4" />
        <rect x="76" y="60" width="6" height="6" opacity="0.4" />
        <rect x="70" y="54" width="6" height="6" opacity="0.4" />
        <rect x="70" y="66" width="6" height="6" opacity="0.4" />
        <rect x="40" y="190" width="6" height="6" />
        <rect x="-110" y="250" width="4" height="4" />
        <rect x="420" y="170" width="6" height="6" />
        <rect x="360" y="150" width="4" height="4" />
        <rect x="104" y="140" width="4" height="4" />
      </g>
    </svg>
  )
}
