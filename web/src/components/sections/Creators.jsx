import { useLayoutEffect, useRef, useState } from 'react'
import { AndRhoBadge, BlipAvatar, PALETTE, VegaAvatar, YellowAd, ZorbAvatar } from '../ui/Avatars.jsx'
import { logo } from '../../lib/assets.js'
import { CREATORS_LENGTH, CREATORS_TRACK } from '../../lib/landing.js'
import { easeInOutCubic, easeOutCubic, lerp, seg } from '../../lib/motion.js'
import { sessionVisitor } from '../../lib/visitor.js'
import { CREATOR_TERMS } from '../../lib/seo.js'

// Track geometry, in unscaled track pixels. The track is scaled down to fit
// short viewports (see `scale` below), so these never change.
const TRACK_W = 2720
const DESIGN_H = 620

// Lanes = who acts (AndRho, client, creator, creator), as fractions of the
// track height. Cards sit on (or near) their actor's lane.
const LANES = [0.16, 0.4, 0.64, 0.86]

// The story, left to right. `x`/`y` = card center (y as a fraction of the
// track height), `rot` = resting tilt in degrees. Times are part of the
// example: a Monday suggestion published on Wednesday.
const EVENTS = {
  suggestion: { x: 250, y: 0.22, rot: -4, w: 272 },
  client: { x: 640, y: 0.46, rot: 3, w: 252 },
  note: { x: 935, y: 0.37, rot: 7, w: 184 },
  task: { x: 1250, y: 0.22, rot: -3, w: 268 },
  vega: { x: 1610, y: 0.6, rot: 5, w: 252 },
  blip: { x: 1720, y: 0.86, rot: -5, w: 252 },
  ad: { x: 2090, y: 0.7, rot: 3, w: 222 },
  result: { x: 2460, y: 0.24, rot: -6, w: 236 },
}

const LINKS = [
  ['suggestion', 'client'],
  ['client', 'note'],
  ['note', 'task'],
  ['task', 'vega'],
  ['task', 'blip'],
  ['blip', 'ad'],
  ['ad', 'result'],
]

// Scroll-driven horizontal timeline: a suggestion born in AndRho's analysis
// travels to the client, gets accepted (with a note), becomes a task shown to
// two matching Creators — one declines and fades away, the other accepts and
// publishes. Pinned like the stage: `progress` = viewport-heights scrolled
// into the section — slides the track right to left for the first
// CREATORS_TRACK, then zooms into the last card, which turns into a promo
// post (PromoPost) that closes the section.
export default function Creators({ progress, sectionRef }) {
  const stickyRef = useRef(null)
  const trackBoxRef = useRef(null)
  const [box, setBox] = useState({ w: 1280, h: DESIGN_H, left: 0, top: 0, vw: 1280, vh: 800, pad: 96 })
  const [visitor] = useState(sessionVisitor)

  useLayoutEffect(() => {
    const el = trackBoxRef.current
    const sticky = stickyRef.current
    const measure = () =>
      setBox({
        w: el.clientWidth,
        h: el.clientHeight,
        left: el.offsetLeft,
        top: el.offsetTop,
        vw: sticky.clientWidth,
        vh: sticky.clientHeight,
        pad: parseFloat(getComputedStyle(sticky).paddingTop),
      })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ro.observe(sticky)
    return () => ro.disconnect()
  }, [])

  const scale = Math.min(1, Math.max(0.5, box.h / DESIGN_H))
  const H = box.h / scale
  const visibleW = box.w / scale
  // From "track starts mid-screen" to "last card well inside the screen".
  const p = Math.min(Math.max(progress / CREATORS_TRACK, 0), 1)
  const scroll = lerp(-visibleW * 0.45, TRACK_W - visibleW * 0.9, p)
  // Things happen as they cross this line (track coordinates).
  const play = scroll + visibleW * 0.62

  const at = (id, from, to) => seg(play, EVENTS[id].x + from, EVENTS[id].x + to)
  const declined = at('vega', 220, 400)

  // Finale: the result card flies to the center and grows into the post.
  const zoom = easeInOutCubic(seg(progress, CREATORS_TRACK + 0.1, CREATORS_TRACK + 1.1))
  const fadeRest = 1 - seg(zoom, 0, 0.55)
  const result = EVENTS.result
  const postW = Math.max(240, Math.min(420, box.vw - 32, box.vh - box.pad - 250))
  const from = {
    x: box.left + (result.x - scroll) * scale,
    y: box.top + result.y * H * scale,
    s: (result.w * scale) / postW,
  }
  const to = { x: box.vw / 2, y: box.pad + (box.vh - box.pad) / 2, s: 1 }

  return (
    <section ref={sectionRef} id="creators" aria-labelledby="creators-title" className="relative z-10" style={{ height: `calc(${CREATORS_LENGTH} * 100vh + 100svh)` }}>
      <div ref={stickyRef} className="sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-[124px] pb-4 text-white md:pt-[96px]">
        <header inert={zoom > 0.5} style={{ opacity: fadeRest }} className="mx-auto flex w-full max-w-[83rem] flex-wrap items-end justify-between gap-x-10 gap-y-3 px-5 sm:px-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--mint)]">Creators · la red de AndRho</p>
            <h2 id="creators-title" className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Personas reales. <span className="text-[var(--mint)]">A tiempo.</span>
            </h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-white/65 sm:text-base">
            Así viaja una idea: de tus datos a tu aprobación, y de ahí a un diseñador o programador de la red que
            la acepta y la entrega.{' '}
            <a href="/waitlist.html" className="font-semibold text-white underline decoration-[var(--mint)] underline-offset-4">
              ¿Eres Creator?
            </a>
          </p>
        </header>

        <div ref={trackBoxRef} inert={zoom > 0.5} className="relative mt-4 min-h-0 flex-1" style={{ opacity: fadeRest }}>
          <div
            className="absolute inset-0"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0, #000 7%, #000 94%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 7%, #000 94%, transparent 100%)',
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left will-change-transform"
              style={{ width: TRACK_W, height: H, transform: `scale(${scale}) translateX(${-scroll}px)` }}
            >
              <Lines H={H} play={play} declined={declined} />
              <ol>
                <Card ev="suggestion" H={H} show={at('suggestion', -300, -100)}>
                  <SuggestionCard />
                </Card>
                <Card ev="client" H={H} show={at('client', -300, -100)}>
                  <ClientCard accepted={at('client', 0, 80)} />
                </Card>
                <Card ev="note" H={H} show={at('note', -280, -100)} paper>
                  <NoteCard />
                </Card>
                <Card ev="task" H={H} show={at('task', -300, -100)}>
                  <TaskCard matched={at('task', 0, 90)} />
                </Card>
                <Card ev="vega" H={H} show={at('vega', -300, -110)} gone={declined}>
                  <CreatorCard
                    Avatar={VegaAvatar}
                    name="Cmdte. Vega"
                    role="Diseñadora · UI y branding"
                    rating="4.9"
                    match="91%"
                    decision={at('vega', 40, 120) > 0 ? 'decline' : null}
                    stamp={at('vega', 40, 120)}
                  />
                </Card>
                <Card ev="blip" H={H} show={at('blip', -300, -110)}>
                  <CreatorCard
                    Avatar={BlipAvatar}
                    name="Blip-9"
                    role="Diseñador · Contenido y redes"
                    rating="4.8"
                    match="96%"
                    decision={at('blip', 60, 140) > 0 ? 'accept' : null}
                    stamp={at('blip', 60, 140)}
                  />
                </Card>
                <Card ev="ad" H={H} show={at('ad', -300, -110)}>
                  <AdCard published={at('ad', 0, 80)} />
                </Card>
                <Card ev="result" H={H} show={zoom > 0 ? 0 : at('result', -300, -110)}>
                  <ResultCard />
                </Card>
              </ol>
            </div>
          </div>

        </div>

        <dl style={{ opacity: fadeRest }} className="mx-auto mt-4 hidden w-full max-w-[83rem] grid-cols-2 gap-x-8 gap-y-3 px-5 sm:grid sm:px-8 lg:grid-cols-4">
          {CREATOR_TERMS.map((item) => (
            <div key={item.term} className="border-l-2 border-[var(--mint)]/60 pl-3">
              <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white">{item.term}</dt>
              <dd className="mt-1 text-xs leading-snug text-white/55">{item.body}</dd>
            </div>
          ))}
        </dl>

        {zoom > 0 && (
          <Finale
            zoom={zoom}
            width={postW}
            x={lerp(from.x, to.x, zoom)}
            y={lerp(from.y, to.y, zoom)}
            scale={lerp(from.s, to.s, zoom)}
            rot={lerp(result.rot, 0, zoom)}
            handle={visitor?.handle}
          />
        )}
      </div>
    </section>
  )
}

// Lane rails + the paths between cards, drawn up to the play line.
function Lines({ H, play, declined }) {
  const point = (id) => [EVENTS[id].x, EVENTS[id].y * H]
  return (
    <svg aria-hidden="true" width={TRACK_W} height={H} className="absolute inset-0 overflow-visible">
      <defs>
        <clipPath id="creators-drawn">
          <rect x="-50" y="-50" width={Math.max(0, play + 50)} height={H + 100} />
        </clipPath>
      </defs>
      {LANES.map((y) => (
        <line key={y} x1="0" x2={TRACK_W} y1={y * H} y2={y * H} stroke="rgba(255,255,255,0.09)" strokeDasharray="2 10" strokeWidth="2" />
      ))}
      <g clipPath="url(#creators-drawn)" fill="none" strokeLinecap="round">
        {LINKS.map(([a, b]) => {
          const [x1, y1] = point(a)
          const [x2, y2] = point(b)
          const dx = (x2 - x1) / 2
          const rejected = b === 'vega'
          return (
            <path
              key={`${a}-${b}`}
              d={`M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`}
              stroke={rejected ? 'rgba(255,255,255,0.5)' : PALETTE.mint}
              strokeWidth="3"
              strokeDasharray={rejected ? '4 9' : '10 8'}
              opacity={rejected ? 1 - declined * 0.85 : 0.9}
            />
          )
        })}
      </g>
      {/* The play line itself: a faint "now" marker. */}
      <line x1={play} x2={play} y1="0" y2={H} stroke="rgba(127,220,195,0.18)" strokeWidth="1.5" />
    </svg>
  )
}

// A physical card on the table: lands from below with extra tilt, settles on
// its own resting angle. `gone` (0 → 1) fades it out of the story.
function Card({ ev, H, show, gone = 0, paper = false, children }) {
  const e = EVENTS[ev]
  const s = easeOutCubic(show)
  return (
    <li
      className="absolute"
      style={{
        left: e.x,
        top: e.y * H,
        width: e.w,
        opacity: s * (1 - gone),
        visibility: s * (1 - gone) < 0.01 ? 'hidden' : 'visible',
        filter: gone > 0 ? `grayscale(${gone}) blur(${gone * 3}px)` : undefined,
        transform: `translate(-50%, -50%) translateY(${(1 - s) * 60 + gone * 30}px) rotate(${e.rot + (1 - s) * (e.rot > 0 ? 10 : -10)}deg) scale(${0.9 + 0.1 * s - gone * 0.05})`,
      }}
    >
      <div
        className={`overflow-hidden rounded-2xl text-[var(--color-ink)] ${paper ? '' : 'border border-black/5 bg-white'}`}
        style={{ boxShadow: '0 2px 0 rgba(11,16,32,0.06), 0 14px 0 -6px rgba(255,255,255,0.12), 0 30px 60px -20px rgba(0,0,0,0.65)' }}
      >
        {children}
      </div>
    </li>
  )
}

function Meta({ children }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{children}</p>
}

function Stamp({ p, color, children, className = '' }) {
  if (p <= 0) return null
  return (
    <span
      className={`pointer-events-none absolute rounded-md border-[2.5px] px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.2em] ${className}`}
      style={{ color, borderColor: color, opacity: p, transform: `rotate(-12deg) scale(${lerp(1.6, 1, easeOutCubic(p))})` }}
    >
      {children}
    </span>
  )
}

function SuggestionCard() {
  return (
    <>
      <AndRhoBadge className="h-24" />
      <div className="p-4">
        <Meta>Sugerencia · Lun 09:12</Meta>
        <h3 className="mt-1.5 text-lg leading-tight font-extrabold tracking-tight">Crear campaña para Helado sin sabor</h3>
        <p className="mt-1.5 text-xs leading-snug text-[var(--color-ink-soft)]">
          Las búsquedas de «helado sin sabor» subieron 38% esta semana en tu zona.
        </p>
        <span className="mt-3 inline-block rounded-full bg-[#dbeafe] px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#1d4ed8] uppercase">
          Modelo · tendencia de demanda
        </span>
      </div>
    </>
  )
}

function Person({ Avatar, name, role }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size={44} />
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold">{name}</p>
        <p className="truncate text-xs text-[var(--color-muted)]">{role}</p>
      </div>
    </div>
  )
}

function Choice({ accept, decline }) {
  const base = 'flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition-colors'
  return (
    <div className="mt-3 flex gap-2">
      <span className={`${base} ${decline ? 'bg-[#ffe1d8] text-[#c2410c]' : 'border border-[var(--color-border)] text-[var(--color-muted)]'}`}>Rechazar</span>
      <span className={`${base} ${accept ? 'bg-[var(--color-ink)] text-white' : 'border border-[var(--color-border)] text-[var(--color-muted)]'}`}>Aceptar</span>
    </div>
  )
}

function ClientCard({ accepted }) {
  return (
    <div className="relative p-4">
      <Meta>Cliente · Lun 10:40</Meta>
      <div className="mt-2.5">
        <Person Avatar={ZorbAvatar} name="Zorb Quintana" role="Heladería Nada · dueño" />
      </div>
      <p className="mt-3 rounded-lg bg-[var(--color-surface)] px-2.5 py-2 text-xs leading-snug">
        Recibió: <strong>Crear campaña para Helado sin sabor</strong>
      </p>
      <Choice accept={accepted > 0} />
      <Stamp p={accepted} color={PALETTE.teal} className="top-14 right-3 bg-white/85">
        Aceptada
      </Stamp>
    </div>
  )
}

function NoteCard() {
  return (
    <div className="relative px-4 pt-6 pb-4" style={{ backgroundColor: PALETTE.yellowSoft }}>
      <span aria-hidden="true" className="absolute -top-1 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-4deg] bg-white/60" />
      <Meta>Nota del cliente</Meta>
      <p className="mt-2 font-display text-lg leading-snug font-bold">Asegúrense de que el anuncio sea amarillo.</p>
      <p className="mt-2 text-right text-xs font-semibold text-[var(--color-ink-soft)]">— Zorb</p>
    </div>
  )
}

function TaskCard({ matched }) {
  return (
    <>
      <div className="flex items-center justify-between bg-[var(--window-teal)] px-4 py-2 font-mono text-[10px] font-bold tracking-[0.2em] text-white uppercase">
        <span>Tarea #0427</span>
        <img src={logo.mark} alt="" className="h-4 w-4 rounded-sm bg-white object-contain p-0.5" />
      </div>
      <div className="p-4">
        <h3 className="text-base leading-tight font-extrabold tracking-tight">Campaña · Helado sin sabor</h3>
        <dl className="mt-2.5 space-y-1 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Tipo</dt>
            <dd className="font-semibold">Diseño + publicación</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Entrega</dt>
            <dd className="font-semibold">Vie · 18:00</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Nota</dt>
            <dd className="flex items-center gap-1.5 font-semibold">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PALETTE.yellow }} />
              anuncio amarillo
            </dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] pt-3" style={{ opacity: lerp(0.35, 1, matched) }}>
          <span className="flex -space-x-2">
            <VegaAvatar size={24} />
            <BlipAvatar size={24} />
          </span>
          <span className="text-xs font-semibold">{matched > 0 ? '2 Creators con match' : 'Buscando Creators…'}</span>
        </div>
      </div>
    </>
  )
}

function CreatorCard({ Avatar, name, role, rating, match, decision, stamp }) {
  const accept = decision === 'accept'
  return (
    <div className="relative p-4">
      <Person Avatar={Avatar} name={name} role={role} />
      <div className="mt-3 flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider uppercase">
        <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5">★ {rating}</span>
        <span className="rounded-full bg-[#d1f2e8] px-2 py-0.5 text-[#21705e]">Match {match}</span>
        <span className="text-[var(--color-muted)]">#0427</span>
      </div>
      <Choice accept={accept} decline={decision === 'decline'} />
      <Stamp p={stamp} color={accept ? PALETTE.teal : PALETTE.coral} className="top-3 right-3">
        {accept ? 'Aceptó' : 'Rechazó'}
      </Stamp>
    </div>
  )
}

function AdCard({ published }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: PALETTE.yellow }} />
        <div className="leading-tight">
          <p className="text-xs font-bold">heladeria.nada</p>
          <p className="text-[10px] text-[var(--color-muted)]">Publicidad</p>
        </div>
      </div>
      <YellowAd className="block h-auto w-full" />
      <div className="flex items-center justify-between px-3 py-2 text-xs">
        <span className="font-semibold">♥ 1,204</span>
        <span className="text-[var(--color-muted)]">por Blip-9 · Mié 16:40</span>
      </div>
      <Stamp p={published} color={PALETTE.teal} className="top-12 left-3 bg-white/85">
        Publicado
      </Stamp>
    </div>
  )
}

function ResultCard() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <Meta>AndRho · Jue 09:00</Meta>
        <img src={logo.mark} alt="" className="h-5 w-5 object-contain" />
      </div>
      <h3 className="mt-2 text-base leading-tight font-extrabold tracking-tight">Entregada 2 días antes</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[var(--color-surface)] p-2">
          <p className="font-display text-xl font-bold">12.4k</p>
          <p className="text-[10px] text-[var(--color-muted)]">personas alcanzadas</p>
        </div>
        <div className="rounded-lg bg-[#d1f2e8] p-2">
          <p className="font-display text-xl font-bold text-[#21705e]">+23%</p>
          <p className="text-[10px] text-[#21705e]">visitas a la tienda</p>
        </div>
      </div>
      <p className="mt-2.5 text-xs text-[var(--color-ink-soft)]">Y el ciclo vuelve a empezar: AndRho sigue midiendo.</p>
    </div>
  )
}

// The zooming card: the result card (scaled to the post's width) cross-fades
// into the promo post as it flies to the center of the screen.
function Finale({ zoom, width, x, y, scale, rot, handle }) {
  const card = 1 - seg(zoom, 0.3, 0.6)
  const post = seg(zoom, 0.3, 0.65)
  const k = width / EVENTS.result.w
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ opacity: zoom, background: 'radial-gradient(60% 55% at 50% 58%, rgba(127,220,195,0.22), transparent 70%)' }}
      />
      <div
        className="absolute top-0 left-0"
        style={{ width, transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})` }}
      >
        <div inert={zoom < 0.9} style={{ opacity: post }}>
          <PromoPost handle={handle} width={width} />
        </div>
        {card > 0 && (
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 overflow-hidden rounded-2xl border border-black/5 bg-white text-[var(--color-ink)]"
            style={{ width: EVENTS.result.w, opacity: card, transform: `translate(-50%, -50%) scale(${k})`, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.65)' }}
          >
            <ResultCard />
          </div>
        )}
      </div>
    </>
  )
}

// AndRho's own ad, dressed as an Instagram post — posted by the visitor when
// we know who they are (their session, lib/visitor.js), by AndRho otherwise.
function PromoPost({ handle, width }) {
  const own = Boolean(handle)
  const name = handle || 'andrho'
  const cta = own ? { label: 'Ir a mi panel', href: '/dashboard/' } : { label: 'Crear mi cuenta', href: '/signup.html' }
  return (
    <article aria-labelledby="crecer-title" className="overflow-hidden rounded-2xl bg-white text-[var(--color-ink)] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
      <header className="flex items-center gap-3 px-3.5 py-2.5">
        {own ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--window-teal)] font-display text-sm font-bold text-white uppercase">
            {name[0]}
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)]">
            <img src={logo.mark} alt="" className="h-5 w-5 object-contain" />
          </span>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="text-[11px] text-[var(--color-muted)]">Patrocinado · con AndRho</p>
        </div>
        <span aria-hidden="true" className="font-bold tracking-widest text-[var(--color-muted)]">···</span>
      </header>

      <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: PALETTE.mintSoft }}>
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="350" cy="60" r="90" fill={PALETTE.yellow} />
          <circle cx="40" cy="380" r="70" fill={PALETTE.coral} opacity="0.9" />
          <path d="M24 42l14-14 14 14 14-14 14 14" stroke={PALETTE.ink} strokeWidth="4" fill="none" strokeLinejoin="round" />
          <polygon points="330,300 372,370 288,370" fill={PALETTE.violet} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={150 + i * 40} y={330 - (i + 1) * 30} width="26" height={(i + 1) * 30 + 40} rx="5" fill={i === 4 ? PALETTE.teal : '#ffffff'} />
          ))}
          <path d="M150 290 L190 262 L230 270 L270 222 L320 176" stroke={PALETTE.ink} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="320,160 332,186 306,182" fill={PALETTE.ink} />
        </svg>
        <div className="absolute inset-0 flex flex-col p-[7%]">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
            <img src={logo.mark} alt="" className="h-3.5 w-3.5 object-contain" />
            AndRho
          </span>
          <h2
            id="crecer-title"
            className="mt-[6%] max-w-[85%] font-display leading-[0.95] font-bold tracking-tight"
            style={{ fontSize: Math.round(width * 0.105) }}
          >
            ¿Estás listo para empezar a crecer?
          </h2>
        </div>
      </div>

      <a href={cta.href} className="flex items-center justify-between bg-[var(--color-ink)] px-3.5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1f2937]">
        {cta.label}
        <span aria-hidden="true">→</span>
      </a>

      <div className="px-3.5 pt-2.5 pb-3.5">
        <div aria-hidden="true" className="flex items-center gap-3.5 text-lg">
          <span className="text-[#ef4444]">♥</span>
          <span>💬</span>
          <span>↗</span>
          <span className="ml-auto">⌑</span>
        </div>
        <p className="mt-1.5 text-xs font-bold">1,204 Me gusta</p>
        <p className="mt-1 text-xs leading-snug">
          <span className="font-bold">{name}</span> Sitio web, redes, Odoo y Creators en una sola cuenta. Tú apruebas, nosotros
          lo hacemos crecer.{' '}
          <a href="/waitlist.html" className="font-semibold text-[var(--window-teal)] underline-offset-2 hover:underline">
            #ListaDeEspera
          </a>
        </p>
      </div>
    </article>
  )
}
