import { useLayoutEffect, useRef, useState } from 'react'
import { AndRhoBadge, BlipAvatar, IceCreamArt, PALETTE, VegaAvatar, YellowAd, ZorbAvatar } from '../ui/Avatars.jsx'
import WindowFrame from '../landing/WindowFrame.jsx'
import { logo } from '../../lib/assets.js'
import { CREATORS_LENGTH, CREATORS_TRACK } from '../../lib/landing.js'
import { easeInOutCubic, easeOutCubic, lerp, seg } from '../../lib/motion.js'
import { CREATOR_TERMS } from '../../lib/seo.js'

// Track geometry, in unscaled track pixels. The track is scaled down to fit
// short viewports (see `scale` below), so these never change.
const TRACK_W = 2400
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
}

const LINKS = [
  ['suggestion', 'client'],
  ['client', 'note'],
  ['note', 'task'],
  ['task', 'vega'],
  ['task', 'blip'],
  ['blip', 'ad'],
]

// Scroll-driven horizontal timeline: a suggestion born in AndRho's analysis
// travels to the client, gets accepted (with a note), becomes a task shown to
// two matching Creators — one declines and fades away, the other accepts and
// publishes. Pinned like the stage: `progress` = viewport-heights scrolled
// into the section — slides the track right to left for the first
// CREATORS_TRACK, then zooms into the last card (the published ad), out of
// which a window like the landing's grows: the closing call to sign up.
export default function Creators({ progress, sectionRef }) {
  const stickyRef = useRef(null)
  const trackBoxRef = useRef(null)
  const [box, setBox] = useState({ w: 1280, h: DESIGN_H, left: 0, top: 0, vw: 1280, vh: 800, pad: 96 })
  const adRef = useRef(null)
  const [adH, setAdH] = useState(240)

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
  // Ends with the ad just past the play line, so it's published on arrival.
  const scroll = lerp(-visibleW * 0.45, EVENTS.ad.x + 220 - visibleW * 0.62, p)
  // Things happen as they cross this line (track coordinates).
  const play = scroll + visibleW * 0.62

  const at = (id, from, to) => seg(play, EVENTS[id].x + from, EVENTS[id].x + to)
  const declined = at('vega', 220, 400)

  // Finale, in two beats (like the "Adapta" window growing out of the AI
  // scene): the ad flies to the center, straightens and grows; then a window
  // grows out of it to fill the screen.
  const zoom = easeInOutCubic(seg(progress, CREATORS_TRACK + 0.1, CREATORS_TRACK + 0.8))
  const grow = easeInOutCubic(seg(progress, CREATORS_TRACK + 0.8, CREATORS_TRACK + 1.5))
  const fadeRest = 1 - seg(zoom, 0, 0.55)
  const ad = EVENTS.ad
  const adW = Math.min(340, box.vw * 0.5, ((box.vh - box.pad) * 0.6 * ad.w) / adH)
  const card = {
    x: lerp(box.left + (ad.x - scroll) * scale, box.vw / 2, zoom),
    y: lerp(box.top + ad.y * H * scale, box.pad + (box.vh - box.pad) / 2, zoom),
    s: lerp(scale, adW / ad.w, zoom),
    rot: lerp(ad.rot, 0, zoom),
  }

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
                <Card ev="ad" H={H} show={zoom > 0 ? 0 : at('ad', -300, -110)}>
                  <AdCard published={at('ad', 0, 80)} />
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

        {zoom > 0 && <Finale card={card} grow={grow} adRef={adRef} onAdHeight={setAdH} box={box} />}
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


// The finale: a copy of the ad card that flies to the center (`card`), then
// the closing window growing out of it (`grow`, 0 → 1) — clipped to the
// card's box at first, then to the whole stage like the landing's windows.
function Finale({ card, grow, adRef, onAdHeight, box }) {
  useLayoutEffect(() => {
    if (adRef.current) onAdHeight(adRef.current.offsetHeight)
  }, [adRef, onAdHeight, box.vw])

  const ad = EVENTS.ad
  const w = ad.w * card.s
  const h = (adRef.current?.offsetHeight ?? 240) * card.s
  // The window's box in the sticky viewport (same insets as the stage's
  // desktop area), and the card's box as clip insets relative to it.
  const side = box.vw >= 640 ? 24 : 12
  const frame = { top: box.pad - 12, left: side, right: side, bottom: box.vw >= 640 ? 20 : 12 }
  const fw = box.vw - frame.left - frame.right
  const fh = box.vh - frame.top - frame.bottom
  const from = [
    card.y - h / 2 - frame.top,
    frame.left + fw - (card.x + w / 2),
    frame.top + fh - (card.y + h / 2),
    card.x - w / 2 - frame.left,
  ]
  const clip = `inset(${from.map((v) => `${lerp(v, 0, grow)}px`).join(' ')} round ${lerp(16, 24, grow)}px)`

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute top-0 left-0"
        style={{ width: ad.w, transform: `translate(${card.x}px, ${card.y}px) translate(-50%, -50%) rotate(${card.rot}deg) scale(${card.s})` }}
      >
        <div ref={adRef} className="overflow-hidden rounded-2xl border border-black/5 bg-white text-[var(--color-ink)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)]">
          <AdCard published={1} />
        </div>
      </div>

      {grow > 0 && (
        <div
          className="absolute flex"
          style={{ top: frame.top, left: frame.left, width: fw, height: fh, clipPath: clip, WebkitClipPath: clip }}
        >
          <WindowFrame className="h-full" style={{ maxWidth: 'none', backgroundColor: PALETTE.yellow }} contentStyle={{ opacity: seg(grow, 0.35, 0.9) }}>
            <CrecerWindow active={grow > 0.9} />
          </WindowFrame>
        </div>
      )}
    </>
  )
}

// The closing window: the ad from the example, blown up and rewritten for
// the visitor.
function CrecerWindow({ active }) {
  return (
    <div inert={!active} className="relative flex h-full min-h-full items-center overflow-hidden" style={{ backgroundColor: PALETTE.yellow }}>
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <circle cx="88" cy="8" r="26" fill="#ffe27a" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 120 20" className="absolute bottom-[7%] left-[5%] w-[18%] max-w-40">
        <path d="M2 18l12-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12" stroke={PALETTE.ink} strokeWidth="3" fill="none" strokeLinejoin="round" />
      </svg>
      <div className="relative grid w-full items-center gap-6 p-6 sm:p-10 md:grid-cols-[1.3fr_1fr] md:p-14 lg:p-16">
        <div>
          <h2 id="crecer-title" className="font-display text-5xl leading-[0.92] font-bold tracking-tight text-[var(--color-ink)] sm:text-7xl lg:text-8xl">
            Estancado y sin crecer.
          </h2>
          <p className="mt-5 text-xl font-semibold text-[var(--color-ink)]/75 sm:text-2xl lg:text-3xl">No en tu caso.</p>
          <a
            href="/signup.html"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[var(--color-ink)] px-8 text-sm font-bold tracking-[0.15em] uppercase transition-colors hover:bg-[#1f2937] lg:h-14 lg:px-10"
            style={{ color: PALETTE.yellow }}
          >
            Regístrate
          </a>
        </div>
        <IceCreamArt className="mx-auto max-h-[30svh] w-auto md:max-h-[60svh]" />
      </div>
    </div>
  )
}
