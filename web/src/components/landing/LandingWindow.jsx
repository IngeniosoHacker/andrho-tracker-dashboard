import Relajate from '../sections/Relajate.jsx'
import ComoFunciona from '../sections/ComoFunciona.jsx'
import IaConCriterio from '../sections/IaConCriterio.jsx'
import Adapta from '../sections/Adapta.jsx'
import TodoEnUnaCuenta from '../sections/TodoEnUnaCuenta.jsx'
import LaNave from '../sections/LaNave.jsx'
import { GROUPS, VIEWS, WINDOW_OPEN, gridOffset, viewPosition } from '../../lib/landing.js'
import { easeOutCubic, seg } from '../../lib/motion.js'

const VIEW_CONTENT = {
  relajate: Relajate,
  'como-funciona': ComoFunciona,
  'ia-con-criterio': IaConCriterio,
  adapta: Adapta,
  'todo-en-una-cuenta': TodoEnUnaCuenta,
  nave: LaNave,
}

// Small print scrolling along the bottom edge of the window: what an AndRho
// account covers, as plain text (decorative for people, useful for search).
const COVERAGE = [
  'ERP Odoo',
  'Meta Business',
  'WhatsApp Business',
  'Instagram y Facebook',
  'Sitio web',
  'SEO y visibilidad en IA',
  'Inventario',
  'Punto de venta',
  'Modelos estadísticos',
  'Creators verificados',
  'Hardware especializado',
]

// The one big window of the landing. It opens once after the hero morph and
// stays open until the stage scrolls away; what changes is the view inside it. Views live on a grid — one
// row per group (GROUPS in lib/landing.js), one column per view — and the
// grid slides under the window: sideways within a group, up to the next
// group. The tab bar on top names the groups so the visitor always knows
// which chapter they're in.
export default function LandingWindow({ t }) {
  const opacity = easeOutCubic(seg(t, WINDOW_OPEN[0], WINDOW_OPEN[1]))
  const open = opacity > 0.5

  const pos = viewPosition(t)
  const current = VIEWS[Math.round(pos)]
  const { y, rowX } = gridOffset(pos)

  return (
    <div
      inert={!open}
      className="absolute inset-0 flex items-stretch justify-center"
      style={{ opacity, visibility: opacity < 0.001 ? 'hidden' : 'visible' }}
    >
      <article
        aria-label="AndRho"
        className={`flex h-full w-full max-w-[83rem] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] ${open ? 'pointer-events-auto' : ''}`}
        style={{ transform: `scale(${0.94 + 0.06 * opacity})` }}
      >
        <WindowTabs current={current} pos={pos} />

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="h-full will-change-transform" style={{ transform: `translateY(${-y * 100}%)` }}>
            {GROUPS.map((group, row) => (
              <div key={group.id} className="h-full overflow-hidden">
                <div className="flex h-full will-change-transform" style={{ transform: `translateX(${-rowX[row] * 100}%)` }}>
                  {group.views.map((id) => {
                    const Body = VIEW_CONTENT[id]
                    return (
                      <section
                        key={id}
                        aria-labelledby={`${id}-title`}
                        inert={id !== current.id}
                        className="no-scrollbar flex h-full w-full shrink-0 overflow-y-auto"
                      >
                        <div className="my-auto w-full">
                          <Body />
                        </div>
                      </section>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <CoverageStrip />
      </article>
    </div>
  )
}

// Chapter tabs + where you are inside the chapter. Tabs are plain links to
// each group's anchor, so they double as in-window navigation.
function WindowTabs({ current, pos }) {
  const group = GROUPS.find((g) => g.id === current.group)
  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--window-line)] bg-[var(--window-bar)] px-3 sm:h-12 sm:px-5">
      <nav aria-label="Capítulos" className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {GROUPS.map((g, i) => {
          const active = g.id === current.group
          return (
            <a
              key={g.id}
              href={`#${g.id}`}
              aria-current={active ? 'true' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors sm:px-3 ${
                active ? 'bg-white text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-ink-soft)] hover:bg-white/50'
              }`}
            >
              <span className={`hidden sm:inline ${active ? 'text-[var(--window-teal)]' : 'opacity-50'}`}>0{i + 1}</span>
              {g.label}
            </a>
          )
        })}
      </nav>

      {/* Progress through the current group's views. */}
      <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
        {group.views.map((id) => {
          const view = VIEWS.find((v) => v.id === id)
          const fill = Math.min(Math.max(pos - view.index + 1, 0), 1)
          return (
            <span key={id} className="relative h-1.5 w-3.5 overflow-hidden rounded-full bg-[var(--window-line)] sm:w-7">
              <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--window-teal)]" style={{ width: `${fill * 100}%` }} />
            </span>
          )
        })}
      </div>
    </div>
  )
}

function CoverageStrip() {
  const items = (hidden) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {COVERAGE.map((item) => (
        <li key={item} className="flex items-center gap-4 pr-4 whitespace-nowrap">
          <span aria-hidden="true" className="h-1 w-1 bg-[var(--window-teal)]" />
          {item}
        </li>
      ))}
    </ul>
  )
  return (
    <div className="flex h-8 shrink-0 items-center overflow-hidden border-t border-[var(--window-line)] bg-[var(--window-bar)] font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] sm:h-9">
      <p className="sr-only">Una cuenta de AndRho incluye:</p>
      <div className="animate-marquee flex w-max">
        {items(false)}
        {items(true)}
      </div>
    </div>
  )
}
