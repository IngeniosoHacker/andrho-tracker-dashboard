import { FLOW } from '../../lib/seo.js'

// Who does each step of the flow — the point of the scene is that AI is one
// step out of five, not the whole product.
const WHO_STYLE = {
  Modelos: 'bg-[#1d4ed8]/30 text-[#93c5fd]',
  IA: 'bg-[#8b5cf6]/30 text-[#ddd6fe]',
  Tú: 'bg-white text-[var(--color-ink)]',
  Creators: 'bg-[var(--window-teal)] text-white',
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
export default function IaConCriterio() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto my-auto w-full max-w-[83rem] px-6 py-8 sm:px-10 md:px-12">
        <p className="font-mono text-xs tracking-[0.25em] text-[var(--mint)] uppercase">Inteligencia artificial, con criterio</p>
        <h2 id="ia-con-criterio-title" className="mt-4 max-w-4xl font-display text-4xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl">
          IA con criterio, <span className="text-[var(--mint)]">no a lo loco.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-snug text-white/65 sm:text-lg lg:text-xl">
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
                      ? 'border border-[var(--violet-light)]/70 bg-white/10'
                      : 'border border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-xs font-bold ${last ? 'text-[var(--window-teal)]' : 'text-[var(--mint)]'}`}>0{i + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${WHO_STYLE[step.who]}`}>
                    {step.who}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-extrabold tracking-tight sm:mt-3 sm:text-xl lg:text-2xl">{step.title}</h3>
                <p className={`mt-1 hidden text-sm leading-snug sm:block ${last ? 'text-[var(--color-ink-soft)]' : 'text-white/60'}`}>{step.body}</p>
                {!last && (
                  <span aria-hidden="true" className="absolute top-1/2 -right-3 z-10 hidden -translate-y-1/2 font-mono text-[var(--mint)] lg:block">
                    →
                  </span>
                )}
              </li>
            )
          })}
        </ol>

        <dl className="mt-6 hidden flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 sm:flex lg:mt-8">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex items-baseline gap-2">
              <dt className="font-display text-2xl font-bold tracking-tight">{fact.value}</dt>
              <dd className="max-w-[16rem] text-sm leading-tight text-white/55">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
