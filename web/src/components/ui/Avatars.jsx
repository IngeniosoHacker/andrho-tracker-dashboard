import { logo } from '../../lib/assets.js'

// Flat, Alegría-style ("corporate Memphis") characters for the Creators
// timeline: round profile pictures of aliens and astronauts, the AndRho
// badge, and the published ad. Same palette as the landing illustrations —
// mint/teal and ink — plus a few loud accents for the Memphis shapes.
export const PALETTE = {
  ink: '#0b1020',
  mint: '#7fdcc3',
  teal: '#4fb39b',
  mintSoft: '#bfeee0',
  yellow: '#ffd23f',
  yellowSoft: '#fff3a3',
  coral: '#ff7a59',
  violet: '#a78bfa',
  violetSoft: '#ddd6fe',
  pink: '#f9a8d4',
  sky: '#93c5fd',
}
const P = PALETTE

function Frame({ id, bg, size, label, children }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={label} className="shrink-0 rounded-full">
      <defs>
        <clipPath id={`clip-${id}`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        <rect width="64" height="64" fill={bg} />
        {children}
      </g>
    </svg>
  )
}

// The client: the mint alien from the hero illustrations, in a pink
// ice-cream-shop apron.
export function ZorbAvatar({ size = 48 }) {
  return (
    <Frame id="zorb" bg={P.coral} size={size} label="Zorb, un alienígena verde">
      <circle cx="54" cy="10" r="7" fill={P.yellow} />
      <path d="M8 64c2-13 12-19 24-19s22 6 24 19Z" fill={P.pink} />
      <path d="M25 47h14l-2 17H27Z" fill="#fff" opacity="0.85" />
      <rect x="29" y="37" width="6" height="9" fill={P.teal} />
      <path d="M32 9c13 0 18 10 16 19-2 9-10 16-16 16s-14-7-16-16C14 19 19 9 32 9Z" fill={P.mint} />
      <ellipse cx="25" cy="27" rx="5.2" ry="3.2" transform="rotate(28 25 27)" fill={P.ink} />
      <ellipse cx="39" cy="27" rx="5.2" ry="3.2" transform="rotate(-28 39 27)" fill={P.ink} />
      <circle cx="26.5" cy="26" r="1" fill="#fff" />
      <circle cx="40.5" cy="26" r="1" fill="#fff" />
      <path d="M29 36q3 2 6 0" stroke={P.ink} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </Frame>
  )
}

// Creator 1: an astronaut designer.
export function VegaAvatar({ size = 48 }) {
  return (
    <Frame id="vega" bg={P.violetSoft} size={size} label="Vega, una astronauta">
      <path d="M2 18l6-6 6 6 6-6" stroke={P.violet} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M6 64c2-12 12-18 26-18s24 6 26 18Z" fill="#f8fafc" />
      <rect x="20" y="52" width="9" height="6" rx="1.5" fill={P.coral} />
      <circle cx="32" cy="29" r="18" fill="#f8fafc" />
      <circle cx="32" cy="29" r="18" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="18" y="20" width="28" height="20" rx="10" fill="#1e2a4a" />
      <circle cx="28" cy="31" r="7" fill="#c68642" />
      <circle cx="26" cy="30" r="1" fill={P.ink} />
      <circle cx="31" cy="30" r="1" fill={P.ink} />
      <path d="M21 25q4-4 9-3" stroke={P.mint} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9" />
      <rect x="45" y="13" width="2" height="7" fill="#cbd5e1" />
      <circle cx="46" cy="12" r="2.2" fill={P.coral} />
    </Frame>
  )
}

// Creator 2: a one-eyed violet alien in a designer's beret.
export function BlipAvatar({ size = 48 }) {
  return (
    <Frame id="blip" bg={P.mintSoft} size={size} label="Blip-9, un alienígena violeta de un solo ojo">
      <circle cx="10" cy="52" r="10" fill={P.yellow} />
      <path d="M8 64c2-12 11-17 24-17s22 5 24 17Z" fill={P.teal} />
      <path d="M26 47l6 7 6-7" fill="#fff" />
      <path d="M22 16l-4-8M42 16l4-8" stroke={P.violet} strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="8" r="3" fill={P.coral} />
      <circle cx="46" cy="8" r="3" fill={P.coral} />
      <ellipse cx="32" cy="31" rx="15" ry="16" fill={P.violet} />
      <path d="M17 22c3-7 26-8 30 0-2-3-28-3-30 0Z" fill={P.ink} />
      <ellipse cx="34" cy="18.5" rx="13" ry="4" fill={P.ink} />
      <circle cx="32" cy="30" r="7" fill="#fff" />
      <circle cx="33.5" cy="31" r="3.4" fill={P.ink} />
      <circle cx="34.6" cy="29.8" r="1" fill="#fff" />
      <path d="M27 40q5 3 10 0" stroke={P.ink} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </Frame>
  )
}

// The AndRho logo dropped into a Memphis collage: blob, dots, zigzag,
// triangle — the header of AndRho's own cards on the timeline.
export function AndRhoBadge({ className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: P.mintSoft }}>
      <svg viewBox="0 0 280 110" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M150 -10c60 0 90 30 80 70s-50 60-100 55-80-35-70-70 30-55 90-55Z" fill={P.yellow} />
        <circle cx="236" cy="86" r="26" fill={P.coral} />
        <path d="M18 78l12-12 12 12 12-12 12 12 12-12" stroke={P.ink} strokeWidth="3" fill="none" strokeLinejoin="round" />
        <polygon points="40,14 62,46 18,46" fill={P.violet} />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={212 + (i % 4) * 10} cy={14 + Math.floor(i / 4) * 10} r="2" fill={P.ink} opacity="0.55" />
        ))}
        <circle cx="96" cy="94" r="8" fill="none" stroke={P.teal} strokeWidth="3" />
      </svg>
      <span className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_6px_0_rgba(11,16,32,0.12)]">
        <img src={logo.mark} alt="AndRho" draggable="false" className="h-9 w-9 object-contain" />
      </span>
    </div>
  )
}

// The published ad: yellow, as the client asked, for a flavourless ice cream.
export function YellowAd({ className = '' }) {
  return (
    <svg viewBox="0 0 220 160" className={className} role="img" aria-label="Anuncio amarillo: un cono de helado blanco con el texto Helado sin sabor">
      <rect width="220" height="160" fill={P.yellow} />
      <circle cx="186" cy="26" r="40" fill="#ffe27a" />
      <path d="M10 140l10-10 10 10 10-10 10 10" stroke={P.ink} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      {/* cone */}
      <polygon points="150,92 186,92 168,150" fill="#e0a458" />
      <path d="M156 100l20 20M162 94l20 20M152 110l14 14M172 96l-16 30M182 96l-22 40" stroke="#b97a2f" strokeWidth="1.5" />
      {/* the flavourless scoop */}
      <circle cx="168" cy="80" r="21" fill="#fffdf5" />
      <circle cx="152" cy="90" r="8" fill="#fffdf5" />
      <circle cx="184" cy="90" r="8" fill="#fffdf5" />
      <circle cx="161" cy="72" r="4" fill="#fff" />
      <text x="16" y="52" fontFamily="Space Grotesk, sans-serif" fontSize="25" fontWeight="700" fill={P.ink}>
        Helado
      </text>
      <text x="16" y="78" fontFamily="Space Grotesk, sans-serif" fontSize="25" fontWeight="700" fill={P.ink}>
        sin sabor.
      </text>
      <text x="16" y="100" fontFamily="Inter, sans-serif" fontSize="10.5" fontWeight="600" fill={P.ink} opacity="0.75">
        Cero distracciones.
      </text>
      <rect x="16" y="110" width="66" height="18" rx="9" fill={P.ink} />
      <text x="49" y="122.5" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="700" fill={P.yellow}>
        PRUÉBALO
      </text>
    </svg>
  )
}

// Just the cone from the ad, big — for the closing window (Creators.jsx).
export function IceCreamArt({ className = '' }) {
  return (
    <svg viewBox="128 44 84 116" className={className} aria-hidden="true">
      <polygon points="150,92 186,92 168,150" fill="#e0a458" />
      <path d="M156 100l20 20M162 94l20 20M152 110l14 14M172 96l-16 30M182 96l-22 40" stroke="#b97a2f" strokeWidth="1.5" />
      <circle cx="168" cy="80" r="21" fill="#fffdf5" />
      <circle cx="152" cy="90" r="8" fill="#fffdf5" />
      <circle cx="184" cy="90" r="8" fill="#fffdf5" />
      <circle cx="161" cy="72" r="4" fill="#fff" />
    </svg>
  )
}
