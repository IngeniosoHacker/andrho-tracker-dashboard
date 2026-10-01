import { FLOW } from '../../lib/seo.js'

// Who does each step of the flow — the point of the view is that AI is one
// step out of five, not the whole product.
const WHO_STYLE = {
  Modelos: 'bg-[#dbeafe] text-[#1d4ed8]',
  IA: 'bg-[#ede9fe] text-[#6d28d9]',
  Tú: 'bg-[var(--color-ink)] text-white',
  Creators: 'bg-[#d1f2e8] text-[#21705e]',
}

// Small facts under the flow — mostly decoration, but each one is a real
// claim about how AndRho works.
const FACTS = [
  { value: '0', label: 'agentes autónomos tomando decisiones por ti' },
  { value: '30+', label: 'modelos estadísticos, de precios e inventario' },
  { value: '100%', label: 'de las sugerencias pasan por tu aprobación' },
]

// Window view (group "relájate"): how AndRho uses AI — on purpose, in one
// step of the flow, instead of everywhere.
export default function IaConCriterio() {
  return (
    <div className="p-6 sm:p-10 md:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
        Inteligencia artificial, con criterio
      </p>
      <h2 id="ia-con-criterio-title" className="mt-4 max-w-4xl text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
        IA con criterio, <span className="text-[var(--window-teal)]">no a lo loco.</span>
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-snug sm:text-lg text-[var(--color-ink-soft)] lg:text-xl">
        La IA no adivina tus números ni decide por ti. Cada paso lo hace quien mejor lo sabe hacer: los modelos
        calculan, la IA traduce, tú decides y personas reales ejecutan.
      </p>

      <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-10 lg:grid-cols-5 lg:gap-4">
        {FLOW.map((step, i) => (
          <li
            key={step.title}
            className={`relative rounded-2xl p-3 sm:p-4 lg:p-5 ${step.who === 'IA' ? 'bg-white ring-2 ring-[var(--violet-light)]' : 'bg-white/70'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[var(--window-teal)]">0{i + 1}</span>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${WHO_STYLE[step.who]}`}>
                {step.who}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-extrabold sm:mt-3 sm:text-xl tracking-tight lg:text-2xl">{step.title}</h3>
            <p className="mt-1 hidden text-sm leading-snug text-[var(--color-ink-soft)] sm:block">{step.body}</p>
            {i < FLOW.length - 1 && (
              <span aria-hidden="true" className="absolute top-1/2 -right-3 z-10 hidden -translate-y-1/2 font-mono text-[var(--window-teal)] lg:block">
                →
              </span>
            )}
          </li>
        ))}
      </ol>

      <dl className="mt-6 hidden flex-wrap sm:flex gap-x-8 gap-y-3 border-t border-[var(--window-line)] pt-5 lg:mt-8">
        {FACTS.map((fact) => (
          <div key={fact.label} className="flex items-baseline gap-2">
            <dt className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)]">{fact.value}</dt>
            <dd className="max-w-[16rem] text-sm leading-tight text-[var(--color-ink-soft)]">{fact.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
