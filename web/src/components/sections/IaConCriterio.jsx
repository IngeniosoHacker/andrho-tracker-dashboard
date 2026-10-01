import { FLOW } from '../../lib/seo.js'

// Who does each step of the flow — the point of the scene is that AI is one
// step out of five, not the whole product.
const WHO_STYLE = {
  dark: {
    Modelos: 'bg-[#1d4ed8]/30 text-[#93c5fd]',
    IA: 'bg-[#8b5cf6]/30 text-[#ddd6fe]',
    Tú: 'bg-white text-[var(--color-ink)]',
    Creators: 'bg-[var(--window-teal)] text-white',
  },
  light: {
    Modelos: 'bg-[#dbeafe] text-[#1d4ed8]',
    IA: 'bg-[#ede9fe] text-[#6d28d9]',
    Tú: 'bg-[var(--color-ink)] text-white',
    Creators: 'bg-[var(--window-teal)] text-white',
  },
}

// Colors for the two backgrounds the scene can sit on: the dark wallpaper
// (default) or the glass version's light backdrop (`light`, lib/variant.js).
const TONE = {
  dark: {
    accent: 'text-[var(--mint)]',
    soft: 'text-white/65',
    faint: 'text-white/55',
    card: 'border border-white/10 bg-white/5',
    ai: 'border border-[var(--violet-light)]/70 bg-white/10',
    rule: 'border-white/10',
  },
  light: {
    accent: 'text-[var(--window-teal)]',
    soft: 'text-[var(--color-ink-soft)]',
    faint: 'text-[var(--color-ink-soft)]',
    card: 'bg-white/60',
    ai: 'bg-white ring-2 ring-[var(--violet-light)]',
    rule: 'border-[var(--color-ink)]/10',
  },
}

// Small facts under the flow — mostly decoration, but each one is a real
// claim about how AndRho works.
const FACTS = [
  { value: '0', label: 'agentes autónomos tomando decisiones por ti' },
  { value: '30+', label: 'modelos estadísticos, de precios e inventario' },
  { value: '100%', label: 'de las sugerencias pasan por tu aprobación' },
]

// Bare scene (no window, straight on the wallpaper): how AndRho uses AI — on
// purpose, in one step of the flow, instead of everywhere. The last step's
// card ("Ejecuta") is lit in the window color: the next window grows out of
// it (`data-emerge`, see Stage.jsx).
export default function IaConCriterio({ light = false }) {
  const tone = light ? 'light' : 'dark'
  const c = TONE[tone]
  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto my-auto w-full max-w-[83rem] px-6 py-8 sm:px-10 md:px-12">
        <p className={`font-mono text-xs tracking-[0.25em] uppercase ${c.accent}`}>Inteligencia artificial, con criterio</p>
        <h2 id="ia-con-criterio-title" className="mt-4 max-w-4xl font-display text-4xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl">
          IA con criterio, <span className={c.accent}>no a lo loco.</span>
        </h2>
        <p className={`mt-5 max-w-2xl text-base leading-snug sm:text-lg lg:text-xl ${c.soft}`}>
          La IA no adivina tus números ni decide por ti. Cada paso lo hace quien mejor lo sabe hacer: los modelos
          calculan, la IA traduce, tú decides y personas reales ejecutan.
        </p>

        <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-10 lg:grid-cols-5 lg:gap-4">
          {FLOW.map((step, i) => {
            const last = i === FLOW.length - 1
            return (
              <li
                key={step.title}
                data-emerge={last ? 'ia-con-criterio' : undefined}
                className={`relative rounded-2xl p-3 sm:p-4 lg:p-5 ${
                  last
                    ? 'bg-[var(--window-bg)] text-[var(--color-ink)]'
                    : step.who === 'IA'
                      ? c.ai
                      : c.card
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-xs font-bold ${last ? 'text-[var(--window-teal)]' : c.accent}`}>0{i + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${WHO_STYLE[tone][step.who]}`}>
                    {step.who}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-extrabold tracking-tight sm:mt-3 sm:text-xl lg:text-2xl">{step.title}</h3>
                <p className={`mt-1 hidden text-sm leading-snug sm:block ${last ? 'text-[var(--color-ink-soft)]' : c.soft}`}>{step.body}</p>
                {!last && (
                  <span aria-hidden="true" className={`absolute top-1/2 -right-3 z-10 hidden -translate-y-1/2 font-mono lg:block ${c.accent}`}>
                    →
                  </span>
                )}
              </li>
            )
          })}
        </ol>

        <dl className={`mt-6 hidden flex-wrap gap-x-8 gap-y-3 border-t pt-5 sm:flex lg:mt-8 ${c.rule}`}>
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex items-baseline gap-2">
              <dt className="font-display text-2xl font-bold tracking-tight">{fact.value}</dt>
              <dd className={`max-w-[16rem] text-sm leading-tight ${c.faint}`}>{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
