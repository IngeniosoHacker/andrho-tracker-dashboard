import { useEffect, useRef, useState } from 'react'
import Relajate from '../sections/Relajate.jsx'
import ComoFunciona from '../sections/ComoFunciona.jsx'
import IaConCriterio from '../sections/IaConCriterio.jsx'
import Adapta from '../sections/Adapta.jsx'
import TodoEnUnaCuenta from '../sections/TodoEnUnaCuenta.jsx'
import LaNave from '../sections/LaNave.jsx'
import { GROUPS } from '../../lib/landing.js'

const VIEW_CONTENT = {
  relajate: Relajate,
  'como-funciona': ComoFunciona,
  'ia-con-criterio': IaConCriterio,
  adapta: Adapta,
  'todo-en-una-cuenta': TodoEnUnaCuenta,
  nave: LaNave,
}

const VIEW_IDS = GROUPS.flatMap((g) => g.views)
const groupOf = (viewId) => GROUPS.find((g) => g.views.includes(viewId))

// Small print along the bottom edge of the window: what an AndRho account
// covers, as plain text (decorative for people, useful for search).
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

// The view whose top has crossed the upper part of the viewport, or null
// while the window hasn't reached it yet.
function useCurrentView() {
  const [current, setCurrent] = useState(null)
  useEffect(() => {
    let raf = 0
    function update() {
      raf = 0
      const line = window.innerHeight * 0.45
      let found = null
      for (const id of VIEW_IDS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) found = id
      }
      setCurrent(found)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])
  return current
}

// The one big window of the landing: a single tall panel that rises from
// below once the hero has folded into the navbar (its negative top margin
// tucks it under the end of the pinned stage) and then scrolls like the rest
// of the page. Its views are stacked top to bottom, grouped into chapters
// (GROUPS in lib/landing.js); the tab bar sticks under the navbar and shows
// which chapter — and which view inside it — is on screen.
export default function LandingWindow({ onGroupChange }) {
  const current = useCurrentView()
  const group = current ? groupOf(current).id : null
  const reported = useRef(undefined)

  useEffect(() => {
    if (reported.current !== group) {
      reported.current = group
      onGroupChange?.(group)
    }
  }, [group, onGroupChange])

  return (
    <div className="relative z-20 -mt-[calc(100svh-128px)] px-3 sm:px-6 md:-mt-[calc(100svh-96px)]">
      <article
        aria-label="AndRho"
        className="mx-auto max-w-[83rem] overflow-clip rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]"
      >
        <WindowTabs current={current} />

        {GROUPS.map((g, i) => (
          <div key={g.id}>
            <div className="flex items-center gap-3 px-6 pt-10 font-mono text-[11px] tracking-[0.25em] text-[var(--color-ink-soft)] uppercase sm:px-10 md:px-12">
              <span className="text-[var(--window-teal)]">0{i + 1}</span>
              {g.label}
              <span aria-hidden="true" className="h-px flex-1 bg-[var(--window-line)]" />
            </div>
            {g.views.map((id) => {
              const Body = VIEW_CONTENT[id]
              return (
                <section
                  key={id}
                  id={id}
                  aria-labelledby={`${id}-title`}
                  className="flex scroll-mt-[168px] items-center md:min-h-[calc(100svh-150px)] md:scroll-mt-[140px]"
                >
                  <div className="w-full">
                    <Body />
                  </div>
                </section>
              )
            })}
          </div>
        ))}

        <CoverageStrip />
      </article>
    </div>
  )
}

// Chapter tabs + where you are inside the chapter. Sticks right under the
// navbar while the window scrolls; tabs are plain links to each group. The
// ::before strip hides content peeking between the navbar and the bar (the
// article's overflow-clip trims it before the bar sticks).
function WindowTabs({ current }) {
  const group = current ? groupOf(current) : GROUPS[0]
  const index = current ? group.views.indexOf(current) : -1
  return (
    <div className="sticky top-[116px] z-10 flex h-11 before:absolute before:inset-x-0 before:bottom-full before:h-[140px] before:bg-[var(--window-bg)] items-center gap-3 rounded-t-3xl border-b border-[var(--window-line)] bg-[var(--window-bar)] px-3 sm:h-12 sm:px-5 md:top-[84px]">
      <nav aria-label="Capítulos" className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {GROUPS.map((g, i) => {
          const active = current && g.id === group.id
          return (
            <a
              key={g.id}
              href={`#${g.id}`}
              aria-current={active ? 'true' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors sm:px-3 ${
                active ? 'bg-white text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-ink-soft)] hover:bg-white/50'
              }`}
            >
              <span className={`hidden sm:inline ${active ? 'text-[var(--window-teal)]' : 'opacity-50'}`}>0{i + 1}</span>
              {g.label}
            </a>
          )
        })}
      </nav>

      {/* Which view of the current group is on screen. */}
      <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
        {group.views.map((id, i) => (
          <span
            key={id}
            className={`h-1.5 w-3.5 rounded-full transition-colors duration-300 sm:w-7 ${i <= index ? 'bg-[var(--window-teal)]' : 'bg-[var(--window-line)]'}`}
          />
        ))}
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
    <div className="mt-6 flex h-9 items-center overflow-hidden border-t border-[var(--window-line)] bg-[var(--window-bar)] font-mono text-[10px] tracking-[0.2em] text-[var(--color-ink-soft)] uppercase">
      <p className="sr-only">Una cuenta de AndRho incluye:</p>
      <div className="animate-marquee flex w-max">
        {items(false)}
        {items(true)}
      </div>
    </div>
  )
}
