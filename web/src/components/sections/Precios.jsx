import { HIGHLIGHT, money, usePricing } from '../../lib/pricing.js'

// How many of a plan's "includes" each card lists (the rest: "+N más").
const SHOWN = 3

// Window view "precios": the five plans and the website, early in the
// story (most visitors never scroll past the first fifth of the page).
// Prices come from andrho-api (lib/pricing.js).
export default function Precios() {
  const { plans, site_levels: sites } = usePricing()
  const cheapestSite = sites.reduce((a, b) => (b.setup < a.setup ? b : a), sites[0])

  return (
    <div className="p-5 sm:p-8 md:p-10 lg:px-12 lg:py-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Precios claros, en quetzales</p>
      <h2 id="precios-title" className="mt-3 max-w-4xl text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-5xl xl:text-6xl">
        Desde <span className="text-[var(--window-teal)]">{money(plans[0].price)}</span> al mes.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-snug text-[var(--color-ink-soft)] sm:text-lg">
        Cambia de plan cuando crezcas. Al registrarte te decimos cuál puedes sostener, según tu equipo y lo que
        puedes invertir.
      </p>

      <ul className="mt-5 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:mt-6 lg:grid-cols-5">
        {plans.map((plan) => {
          const featured = plan.id === HIGHLIGHT
          const extra = plan.includes.length - SHOWN
          return (
            <li
              key={plan.id}
              className={`relative grid grid-cols-[1fr_auto] items-baseline gap-x-3 rounded-2xl bg-white/70 px-4 py-2.5 lg:flex lg:flex-col lg:items-stretch lg:p-5 ${featured ? 'ring-2 ring-[var(--window-teal)]' : ''}`}
            >
              {featured && (
                <span className="absolute -top-2.5 right-4 hidden rounded-full lg:inline bg-[var(--window-teal)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--night)]">
                  Equilibrado
                </span>
              )}
              <div className="flex items-baseline gap-2 lg:block">
                <h3 className="text-lg font-extrabold tracking-tight lg:text-2xl">{plan.name}</h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">{plan.label}</p>
              </div>
              <p className="lg:mt-2">
                <span className="text-xl font-extrabold tracking-tight lg:text-3xl">{money(plan.price)}</span>
                <span className="text-sm text-[var(--color-ink-soft)]"> /mes</span>
              </p>
              <p className="mt-1 hidden text-sm leading-snug text-[var(--color-ink-soft)] lg:block">{plan.tagline}</p>
              <ul className="mt-3 hidden space-y-1 border-t border-[var(--window-line)] pt-3 text-[13px] leading-snug lg:block">
                {plan.includes.slice(0, SHOWN).map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span aria-hidden="true" className="text-[var(--window-teal)]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
                {extra > 0 && <li className="pl-4 text-[var(--color-ink-soft)]">+{extra} más</li>}
              </ul>
            </li>
          )
        })}
      </ul>

      {cheapestSite && (
        <p className="mt-4 max-w-4xl text-sm leading-snug text-[var(--color-ink-soft)]">
          <strong className="text-[var(--color-ink)]">Sitio web:</strong> desde {money(cheapestSite.setup)} de construcción
          (una vez) + {money(cheapestSite.monthly)}/mes de mantenimiento. Ya viene incluido en En órbita (con tienda) y en
          Galaxy (sitio pro).
        </p>
      )}

      <div className="mt-5 flex max-w-2xl flex-col gap-3 sm:mt-6 sm:flex-row">
        <a href="/signup.html" className="btn-solid sm:flex-1">
          Descubre cuál te conviene
        </a>
        {/* Phones skip it: the window has no room, the next one is a scroll away. */}
        <span className="hidden sm:flex sm:flex-1">
          <a href="#ia-con-criterio" className="btn-outline w-full">
            ¿Y la IA?
          </a>
        </span>
      </div>
    </div>
  )
}
