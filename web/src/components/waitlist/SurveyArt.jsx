import BoardingIllustration from '../ui/BoardingIllustration.jsx'

// One flat illustration per kind of waitlist question (waitlist.html), in the
// same mint/teal/ink language as BoardingIllustration. Each scene carries an
// implicit message (waitinglist.md asks for subliminal cues): things that
// rise and line up toward the saucer — AndRho — are safe and growing; paper,
// tangles, small pods and dinosaurs sit under the meteor.
const TEAL = '#4fb39b'
const MINT = '#7fdcc3'
const MINT_SOFT = '#bfeee0'
const INK = '#0b1020'
const SLATE = '#3f4a63'
const PAPER = '#ffffff'
const LIGHT = '#f6ecb0'
const FIRE = '#ff7a45'
const FIRE_SOFT = '#ffc46b'
const ROCK = '#7a5a4a'

// Motion only for people who haven't asked to reduce it.
const MOTION_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .sa-float { animation: sa-float 4s ease-in-out infinite; }
  .sa-rise { animation: sa-rise 3s ease-in-out infinite; }
  .sa-pulse { animation: sa-pulse 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
}
@keyframes sa-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes sa-rise { 0% { transform: translateY(6px); opacity: 0.6; } 50% { opacity: 1; } 100% { transform: translateY(-6px); opacity: 0.6; } }
@keyframes sa-pulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.06); opacity: 1; } }
`

// — Shared parts —————————————————————————————————————————————

// Saucer centered on its disk; `s` scales it (1 = BoardingIllustration's).
function Saucer({ x, y, s = 1, className }) {
  return (
    <g className={className}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M-52 -12 C-50 -72 50 -72 52 -12 Z" fill={MINT_SOFT} />
        <ellipse cx="24" cy="-46" rx="10" ry="6" fill={PAPER} opacity="0.8" />
        <ellipse cx="0" cy="0" rx="124" ry="30" fill={TEAL} />
        <ellipse cx="0" cy="-8" rx="124" ry="16" fill={MINT} />
        {[-80, -40, 0, 40, 80].map((cx) => (
          <circle key={cx} cx={cx} cy="10" r="6" fill={LIGHT} />
        ))}
      </g>
    </g>
  )
}

function Beam({ id, points }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MINT} stopOpacity="0.7" />
          <stop offset="100%" stopColor={MINT} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <polygon points={points} fill={`url(#${id})`} />
    </>
  )
}

// Meteor heading down-right; (x, y) is the rock.
function Meteor({ id, x, y, s = 1, angle = 38 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${angle})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={FIRE_SOFT} stopOpacity="0" />
          <stop offset="70%" stopColor={FIRE_SOFT} stopOpacity="0.85" />
          <stop offset="100%" stopColor={FIRE} />
        </linearGradient>
      </defs>
      <path d="M-112 -16 Q-52 -24 0 -16 L0 16 Q-52 24 -112 16 Q-72 0 -112 -16 Z" fill={`url(#${id})`} />
      <circle r="24" fill={FIRE} opacity="0.35" />
      <circle r="17" fill={ROCK} />
      <circle cx="-6" cy="-6" r="4" fill="#5c4033" />
      <circle cx="7" cy="7" r="3" fill="#5c4033" />
    </g>
  )
}

// The same T-rex as the waitlist window; feet at (x, y), facing right.
function Dino({ x, y, s = 1, flip = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M-8 -40 L-2 -20 L-30 -8 L-40 -10" fill="none" stroke="#2c3549" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M-70 -62 Q-40 -70 -20 -72 C0 -82 20 -80 30 -88 L34 -104 Q36 -112 46 -112 L74 -110 Q80 -109 80 -102 L80 -96 L54 -94 L74 -88 Q78 -84 72 -80 L48 -78 C44 -64 36 -48 20 -38 C6 -30 -16 -32 -26 -42 Q-46 -54 -70 -62 Z"
        fill={SLATE}
      />
      <path d="M60 -95 l3 4 l3 -4 l3 4 l3 -4" fill="none" stroke={PAPER} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="58" cy="-103" r="5" fill={PAPER} />
      <circle cx="60" cy="-103" r="2" fill={INK} />
      <path d="M36 -62 L46 -56 L48 -50" fill="none" stroke={SLATE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 -40 L24 -24 L18 -2 L32 -2" fill="none" stroke={SLATE} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 -122 q-5 7 0 9 q5 -2 0 -9 z" fill={MINT} />
    </g>
  )
}

// Pixel stars, as in the hero.
function Sparkles({ at }) {
  return (
    <g fill={INK}>
      {at.map(([x, y, big]) =>
        big ? (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="6" height="6" />
            <rect x={x - 6} y={y} width="6" height="6" opacity="0.4" />
            <rect x={x + 6} y={y} width="6" height="6" opacity="0.4" />
            <rect x={x} y={y - 6} width="6" height="6" opacity="0.4" />
            <rect x={x} y={y + 6} width="6" height="6" opacity="0.4" />
          </g>
        ) : (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" />
        ),
      )}
    </g>
  )
}

function Dots({ x, y, cols = 6, rows = 4 }) {
  return Array.from({ length: cols * rows }, (_, i) => (
    <circle key={i} cx={x + (i % cols) * 14} cy={y + Math.floor(i / cols) * 14} r="2" fill={MINT} opacity="0.7" />
  ))
}

const Ground = ({ cx = 240, rx = 200 }) => <ellipse cx={cx} cy="368" rx={rx} ry="14" fill={MINT} opacity="0.35" />

function Check({ x, y, s = 1, color = TEAL }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="14" fill={color} />
      <path d="M-6 0 l4 5 l8 -10" fill="none" stroke={PAPER} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

// Upward arrow: the line every scene nudges toward.
function RisingArrow({ d, head }) {
  return (
    <g>
      <path d={d} fill="none" stroke={TEAL} strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10" />
      <polygon points={head} fill={TEAL} />
    </g>
  )
}

// — Scenes ———————————————————————————————————————————————————

// Sectors: a little planet of businesses, a saucer on the way to it.
function Orbit() {
  const shops = [
    { x: 140, y: 274, r: -27, kind: 'shop' },
    { x: 190, y: 256, r: -13, kind: 'food' },
    { x: 240, y: 250, r: 0, kind: 'factory' },
    { x: 290, y: 256, r: 13, kind: 'clinic' },
    { x: 340, y: 274, r: 27, kind: 'truck' },
  ]
  return (
    <>
      <circle cx="240" cy="470" r="220" fill={MINT_SOFT} />
      <circle cx="240" cy="470" r="220" fill="none" stroke={MINT} strokeWidth="6" />
      <text x="240" y="350" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="56" fontWeight="700" fill={MINT} opacity="0.6">
        ρ
      </text>
      {shops.map(({ x, y, r, kind }) => (
        <g key={kind} transform={`rotate(${r} ${x} ${y})`} stroke={SLATE} strokeWidth="2" strokeLinejoin="round">
          {kind === 'shop' && (
            <>
              <rect x={x - 18} y={y - 34} width="36" height="34" fill={PAPER} />
              <rect x={x - 22} y={y - 44} width="44" height="12" fill={TEAL} />
              <rect x={x - 6} y={y - 18} width="12" height="18" fill={SLATE} />
            </>
          )}
          {kind === 'food' && (
            <>
              <rect x={x - 16} y={y - 30} width="32" height="30" fill={PAPER} />
              <path d={`M${x - 20} ${y - 30} L${x} ${y - 46} L${x + 20} ${y - 30} Z`} fill={TEAL} />
              <circle cx={x} cy={y - 16} r="7" fill={LIGHT} stroke={SLATE} strokeWidth="2" />
            </>
          )}
          {kind === 'factory' && (
            <>
              <rect x={x - 22} y={y - 30} width="44" height="30" fill={PAPER} />
              <rect x={x + 8} y={y - 54} width="10" height="26" fill={SLATE} />
              <circle className="sa-rise" cx={x + 18} cy={y - 66} r="7" fill={PAPER} stroke="none" opacity="0.9" />
              <path d={`M${x - 22} ${y - 30} l11 -10 v10 l11 -10 v10`} fill={TEAL} />
            </>
          )}
          {kind === 'clinic' && (
            <>
              <rect x={x - 16} y={y - 34} width="32" height="34" fill={PAPER} />
              <rect x={x - 3} y={y - 28} width="6" height="18" fill={TEAL} />
              <rect x={x - 9} y={y - 22} width="18" height="6" fill={TEAL} />
            </>
          )}
          {kind === 'truck' && (
            <>
              <rect x={x - 22} y={y - 26} width="30" height="20" fill={PAPER} />
              <rect x={x + 8} y={y - 20} width="14" height="14" fill={TEAL} />
              <circle cx={x - 12} cy={y - 4} r="5" fill={SLATE} />
              <circle cx={x + 14} cy={y - 4} r="5" fill={SLATE} />
            </>
          )}
        </g>
      ))}
      <ellipse cx="240" cy="190" rx="200" ry="44" fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray="4 8" opacity="0.6" />
      <Saucer x={120} y={110} s={0.5} className="sa-float" />
      <RisingArrow d="M300 236 Q360 170 380 110" head="370,104 392,96 388,120" />
      <Dots x={360} y={20} />
      <Sparkles at={[[60, 210, true], [420, 220], [210, 60], [30, 120]]} />
    </>
  )
}

// Company size: a growth chart of crew members, the tallest under the beam.
function Crew() {
  const bars = [
    { x: 70, h: 60 },
    { x: 170, h: 120 },
    { x: 270, h: 190 },
  ]
  return (
    <>
      <Ground />
      <Beam id="sa-crew-beam" points="282,96 334,96 352,140 264,140" />
      {bars.map(({ x, h }, i) => (
        <g key={x}>
          <rect x={x} y={368 - h} width="76" height={h} rx="6" fill={i === 2 ? TEAL : MINT} opacity={i === 2 ? 1 : 0.6 + i * 0.15} />
          <g transform={`translate(${x + 38} ${368 - h})`} stroke={SLATE} strokeWidth="3" strokeLinejoin="round">
            <rect x="-14" y="-34" width="28" height="34" rx="8" fill={PAPER} />
            <circle cy="-48" r="16" fill={PAPER} />
            <rect x="-10" y="-56" width="20" height="14" rx="7" fill={MINT} />
            <rect x="-9" y="-24" width="18" height="10" rx="2" fill={MINT_SOFT} />
          </g>
        </g>
      ))}
      <RisingArrow d="M60 260 Q140 230 230 170" head="222,160 246,158 236,182" />
      <Saucer x={308} y={78} s={0.42} className="sa-float" />
      <Dots x={380} y={30} />
      <Sparkles at={[[180, 70, true], [440, 210], [60, 120], [30, 220]]} />
    </>
  )
}

// Sales / messaging: a phone sending chats, bags and quetzales up the beam.
function Channels() {
  return (
    <>
      <Ground />
      <Beam id="sa-ch-beam" points="196,116 284,116 330,360 150,360" />
      <Saucer x={240} y={92} s={0.55} className="sa-float" />
      <g transform="rotate(-8 240 280)">
        <rect x="186" y="200" width="108" height="168" rx="18" fill={INK} />
        <rect x="194" y="214" width="92" height="140" rx="10" fill={PAPER} />
        <rect x="202" y="226" width="60" height="18" rx="9" fill={MINT} />
        <rect x="218" y="252" width="60" height="18" rx="9" fill={MINT_SOFT} />
        <rect x="202" y="278" width="48" height="18" rx="9" fill={MINT} />
        <rect x="226" y="304" width="52" height="18" rx="9" fill={TEAL} />
      </g>
      <g className="sa-rise">
        <rect x="90" y="190" width="70" height="40" rx="14" fill={PAPER} stroke={TEAL} strokeWidth="3" />
        <circle cx="110" cy="210" r="4" fill={TEAL} />
        <circle cx="125" cy="210" r="4" fill={TEAL} />
        <circle cx="140" cy="210" r="4" fill={TEAL} />
        <path d="M104 230 l-10 14 l20 -14 z" fill={PAPER} stroke={TEAL} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g className="sa-rise" style={{ animationDelay: '0.6s' }}>
        <rect x="318" y="210" width="44" height="40" rx="6" fill={TEAL} />
        <path d="M328 210 q12 -20 24 0" fill="none" stroke={TEAL} strokeWidth="4" />
        <path d="M334 232 l5 6 l10 -12" fill="none" stroke={PAPER} strokeWidth="3" strokeLinecap="round" />
      </g>
      {[
        [230, 170],
        [262, 150],
        [216, 136],
      ].map(([cx, cy], i) => (
        <g key={cx} className="sa-rise" style={{ animationDelay: `${i * 0.4}s` }}>
          <circle cx={cx} cy={cy} r="11" fill={LIGHT} stroke="#d6b84a" strokeWidth="2" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="12" fontWeight="700" fill="#8a6d10">
            Q
          </text>
        </g>
      ))}
      <Dots x={370} y={30} />
      <Sparkles at={[[70, 80, true], [420, 150], [40, 300], [430, 300]]} />
    </>
  )
}

// Operation questions: the saucer scans a crate; the checklist mostly checks.
function Scan() {
  return (
    <>
      <Ground cx={220} />
      <Saucer x={200} y={80} s={0.55} className="sa-float" />
      <Beam id="sa-scan-beam" points="160,104 240,104 300,250 100,250" />
      <line className="sa-pulse" x1="96" y1="250" x2="304" y2="250" stroke={TEAL} strokeWidth="3" />
      <g>
        <rect x="120" y="262" width="160" height="106" rx="6" fill="#e9dcc2" />
        <rect x="120" y="262" width="160" height="16" fill="#d8c6a2" />
        {[150, 200, 250].map((x) => (
          <rect key={x} x={x} y="278" width="6" height="90" fill="#d8c6a2" />
        ))}
        <circle cx="200" cy="320" r="22" fill={PAPER} stroke={SLATE} strokeWidth="3" />
        <path d="M200 306 v14 l10 6" fill="none" stroke={SLATE} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="rotate(6 380 250)">
        <rect x="320" y="150" width="120" height="200" rx="10" fill={PAPER} stroke={SLATE} strokeWidth="3" />
        <rect x="352" y="140" width="56" height="20" rx="6" fill={SLATE} />
        {[190, 240, 290].map((y, i) => (
          <g key={y}>
            {i < 2 ? <Check x={344} y={y} s={0.8} /> : <circle cx="344" cy={y} r="11" fill="none" stroke={MINT} strokeWidth="3" />}
            <rect x="362" y={y - 5} width="62" height="10" rx="5" fill={MINT_SOFT} />
          </g>
        ))}
      </g>
      <Dots x={30} y={30} />
      <Sparkles at={[[420, 60, true], [60, 200], [300, 40]]} />
    </>
  )
}

// Website / social: the site is a beacon; likes rise to the saucer.
function Beacon() {
  return (
    <>
      <Ground cx={200} />
      <g>
        <rect x="70" y="150" width="240" height="190" rx="14" fill={PAPER} stroke={SLATE} strokeWidth="3" />
        <rect x="70" y="150" width="240" height="30" rx="14" fill={SLATE} />
        <rect x="70" y="166" width="240" height="14" fill={SLATE} />
        {[92, 110, 128].map((cx, i) => (
          <circle key={cx} cx={cx} cy="165" r="5" fill={[FIRE_SOFT, LIGHT, MINT][i]} />
        ))}
        <polyline points="96,310 140,286 180,296 224,250 284,212" fill="none" stroke={TEAL} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="276,204 296,204 290,224" fill={TEAL} />
        <rect x="96" y="200" width="70" height="10" rx="5" fill={MINT_SOFT} />
        <rect x="96" y="218" width="44" height="10" rx="5" fill={MINT_SOFT} />
      </g>
      {[60, 90, 120].map((r) => (
        <path key={r} className="sa-pulse" d={`M${310 - r * 0.2} ${150 - r * 0.6} a${r} ${r} 0 0 1 ${r * 0.7} ${r * 0.5}`} fill="none" stroke={MINT} strokeWidth="4" strokeLinecap="round" opacity={1 - r / 200} />
      ))}
      {[
        [350, 230, 1],
        [390, 180, 0.8],
        [342, 140, 0.7],
      ].map(([x, y, s], i) => (
        // The animation goes on a wrapper: a CSS transform would replace
        // the SVG transform attribute.
        <g key={x + y} className="sa-rise" style={{ animationDelay: `${i * 0.5}s` }}>
          <path
            transform={`translate(${x} ${y}) scale(${s})`}
            d="M0 8 C-14 -2 -14 -16 -4 -16 C0 -16 0 -12 0 -12 C0 -12 0 -16 4 -16 C14 -16 14 -2 0 8 Z"
            fill={i === 1 ? TEAL : FIRE}
          />
        </g>
      ))}
      <Saucer x={390} y={70} s={0.42} className="sa-float" />
      <Dots x={40} y={40} />
      <Sparkles at={[[240, 80, true], [440, 300], [30, 260]]} />
    </>
  )
}

// Management: paper flies off the desk while the meteor comes down outside.
function Paper() {
  return (
    <>
      <Ground cx={220} />
      <rect x="290" y="40" width="160" height="130" rx="8" fill="#e8f7f2" stroke={SLATE} strokeWidth="4" />
      <line x1="370" y1="40" x2="370" y2="170" stroke={SLATE} strokeWidth="4" />
      <line x1="290" y1="105" x2="450" y2="105" stroke={SLATE} strokeWidth="4" />
      <clipPath id="sa-window">
        <rect x="292" y="42" width="156" height="126" rx="6" />
      </clipPath>
      <g clipPath="url(#sa-window)">
        <Meteor id="sa-paper-meteor" x={400} y={110} s={0.7} />
      </g>
      <rect x="150" y="262" width="230" height="16" rx="4" fill={SLATE} />
      <rect x="166" y="278" width="12" height="90" fill={SLATE} />
      <rect x="352" y="278" width="12" height="90" fill={SLATE} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={250 + (i % 2) * 4} y={248 - i * 14} width="90" height="14" rx="2" fill={i % 2 ? '#f1f5f9' : PAPER} stroke="#cbd5e1" strokeWidth="1.5" />
      ))}
      {[
        [220, 150, -24],
        [180, 110, 18],
        [250, 80, -10],
      ].map(([x, y, r]) => (
        <g key={x} className="sa-rise">
          <g transform={`rotate(${r} ${x} ${y})`}>
            <rect x={x} y={y} width="44" height="56" rx="2" fill={PAPER} stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x={x + 8} y={y + 12} width="28" height="4" fill="#cbd5e1" />
            <rect x={x + 8} y={y + 22} width="20" height="4" fill="#cbd5e1" />
          </g>
        </g>
      ))}
      <Dino x={95} y={368} s={0.95} flip />
      <Sparkles at={[[60, 70, true], [140, 40], [30, 200]]} />
    </>
  )
}

// Satisfaction: a gauge whose arrow pushes into the green.
function Gauge() {
  const segments = [FIRE, FIRE_SOFT, LIGHT, MINT, TEAL]
  const arc = (i) => {
    const a0 = Math.PI + (i * Math.PI) / 5
    const a1 = Math.PI + ((i + 1) * Math.PI) / 5
    const p = (a, r) => `${240 + r * Math.cos(a)} ${300 + r * Math.sin(a)}`
    return `M${p(a0, 170)} A170 170 0 0 1 ${p(a1, 170)} L${p(a1, 110)} A110 110 0 0 0 ${p(a0, 110)} Z`
  }
  return (
    <>
      <Ground />
      {segments.map((c, i) => (
        <path key={c} d={arc(i)} fill={c} opacity={i >= 3 ? 1 : 0.75} stroke={PAPER} strokeWidth="4" />
      ))}
      <g className="sa-pulse" style={{ transformOrigin: '240px 300px' }}>
        <path d="M240 300 L368 214" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </g>
      <circle cx="240" cy="300" r="18" fill={INK} />
      <path d="M150 170 Q240 90 340 140" fill="none" stroke={TEAL} strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
      <polygon points="334,128 356,146 330,152" fill={TEAL} />
      <Check x={400} y={110} s={1.2} />
      <Saucer x={90} y={80} s={0.32} className="sa-float" />
      <Dots x={360} y={300} cols={6} rows={3} />
      <Sparkles at={[[230, 50, true], [440, 220], [40, 220]]} />
    </>
  )
}

// Pain points: the tangle goes through AndRho and comes out a rising line.
function Tangle() {
  return (
    <>
      <Ground />
      <path
        d="M40 300 C80 200 140 360 100 260 C70 190 170 220 130 300 C100 360 60 240 150 230 C210 224 160 320 210 280 L240 250"
        fill="none"
        stroke={SLATE}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle className="sa-pulse" cx="270" cy="230" r="40" fill={MINT_SOFT} stroke={TEAL} strokeWidth="6" />
      <text x="270" y="246" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="46" fontWeight="700" fill={TEAL}>
        ρ
      </text>
      <path d="M310 220 L360 180 L390 190 L440 120" fill="none" stroke={TEAL} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="430,108 452,104 446,128" fill={TEAL} />
      <Saucer x={420} y={52} s={0.3} className="sa-float" />
      <Dots x={40} y={40} />
      <Sparkles at={[[200, 80, true], [440, 300], [330, 320]]} />
    </>
  )
}

// Modules: puzzle pieces clicking together under the saucer.
function Puzzle() {
  const piece = (x, y, fill, key, className) => (
    <g key={key} className={className}>
      <rect x={x} y={y} width="90" height="90" rx="10" fill={fill} />
      <circle cx={x + 90} cy={y + 45} r="16" fill={fill} />
      <circle cx={x + 45} cy={y + 90} r="16" fill={fill} />
    </g>
  )
  return (
    <>
      <Ground />
      <Beam id="sa-pz-beam" points="196,112 284,112 340,330 140,330" />
      <Saucer x={240} y={88} s={0.55} />
      {piece(150, 150, TEAL, 'a')}
      {piece(240, 150, MINT, 'b')}
      {piece(150, 240, MINT, 'c')}
      <rect x="240" y="240" width="90" height="90" rx="10" fill="none" stroke={TEAL} strokeWidth="3" strokeDasharray="6 8" />
      {piece(360, 250, MINT_SOFT, 'd', 'sa-float')}
      <text x="195" y="210" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="40" fontWeight="700" fill={PAPER}>
        ρ
      </text>
      <Dots x={30} y={40} />
      <Sparkles at={[[70, 220, true], [420, 60], [60, 330]]} />
    </>
  )
}

// Expectations: three goals, one arrow in the bullseye.
function Target() {
  return (
    <>
      <Ground />
      {[130, 100, 70, 40].map((r, i) => (
        <circle key={r} cx="290" cy="210" r={r} fill={i % 2 ? PAPER : MINT_SOFT} stroke={TEAL} strokeWidth="3" />
      ))}
      <circle className="sa-pulse" cx="290" cy="210" r="16" fill={TEAL} />
      <path d="M60 340 Q140 300 280 214" fill="none" stroke={MINT} strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
      <g transform="rotate(-33 290 210)">
        <rect x="200" y="206" width="90" height="8" rx="4" fill={INK} />
        <polygon points="200,198 186,198 196,210 186,222 200,222 208,210" fill={FIRE} />
      </g>
      {[
        [110, 120],
        [160, 80],
        [210, 110],
      ].map(([x, y]) => (
        <Check key={x} x={x} y={y} s={0.9} />
      ))}
      <Saucer x={420} y={60} s={0.28} className="sa-float" />
      <Dots x={360} y={330} cols={6} rows={2} />
      <Sparkles at={[[40, 60, true], [440, 160], [40, 220]]} />
    </>
  )
}

// Plan: a small pod, a saucer and the mothership. The meteor aims low.
function Fleet() {
  return (
    <>
      <Ground />
      <Meteor id="sa-fleet-meteor" x={110} y={210} s={0.8} angle={50} />
      <g>
        <circle cx="150" cy="320" r="26" fill={MINT_SOFT} stroke={SLATE} strokeWidth="3" />
        <circle cx="150" cy="316" r="10" fill={PAPER} stroke={SLATE} strokeWidth="2" />
      </g>
      <Saucer x={250} y={240} s={0.4} />
      <g className="sa-float">
        <ellipse cx="370" cy="110" rx="100" ry="52" fill="none" stroke={MINT} strokeWidth="2" strokeDasharray="4 8" />
        <Saucer x={370} y={120} s={0.75} />
      </g>
      <RisingArrow d="M180 300 Q260 210 330 170" head="324,160 346,160 334,182" />
      <Sparkles at={[[60, 70, true], [250, 70], [440, 300]]} />
    </>
  )
}

const SCENES = {
  orbit: Orbit,
  crew: Crew,
  channels: Channels,
  scan: Scan,
  beacon: Beacon,
  paper: Paper,
  gauge: Gauge,
  tangle: Tangle,
  puzzle: Puzzle,
  target: Target,
  fleet: Fleet,
}

export default function SurveyArt({ scene, className = '' }) {
  if (scene === 'boarding') return <BoardingIllustration className={className} />
  const Scene = SCENES[scene] ?? Orbit
  return (
    <svg viewBox="0 0 480 400" className={className} aria-hidden="true">
      <style>{MOTION_CSS}</style>
      <Scene />
    </svg>
  )
}
