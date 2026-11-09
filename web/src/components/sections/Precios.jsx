import { useState } from 'react'
import { HIGHLIGHT, SITE_KINDS, includedSiteRank, money, siteOptionsFor, usePricing } from '../../lib/pricing.js'

// How many of a plan's "includes" a closed card lists (the rest: "+N más").
// FEL isn't one of them: it has its own badge on every card.
const SHOWN = 3
const isFEL = (item) => item.includes('FEL')

// Window view "precios": the five plans and the three kinds of website,
// early in the story (most visitors never scroll past the first fifth of
// the page). Prices come from andrho-api (lib/pricing.js). Clicking a plan
// opens it: everything it includes and what each kind of site costs on it.
export default function Precios() {
  const { plans, site_levels: sites } = usePricing()
  const [open, setOpen] = useState(null)
  const openPlan = plans.find((p) => p.id === open)
  const toggle = (id) => setOpen((cur) => (cur === id ? null : id))

  return (
    <div className="p-5 sm:p-8 md:p-10 lg:px-12 lg:py-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Precios claros, en quetzales</p>
      <h2 id="precios-title" className="mt-3 max-w-4xl text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-5xl xl:text-6xl">
        Desde <span className="text-[var(--window-teal)]">{money(plans[0].price)}</span> al mes.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-snug text-[var(--color-ink-soft)] sm:text-lg">
        Toca un plan para ver todo lo que trae y qué sitio web te toca. Al registrarte te decimos cuál puedes sostener.
      </p>
      <FelNote plans={plans} />

      <ul className="mt-5 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
        {plans.map((plan) => {
          const featured = plan.id === HIGHLIGHT
          const isOpen = plan.id === open
          const short = plan.includes.filter((item) => !isFEL(item))
          const extra = short.length - SHOWN
          return (
            <li
              key={plan.id}
              className={`relative rounded-2xl transition-colors ${isOpen ? 'price-card-open sm:col-span-2 lg:col-span-1 lg:rounded-b-none' : 'price-card bg-white/70'} ${featured && !isOpen ? 'ring-2 ring-[var(--window-teal)]' : ''} ${isOpen ? 'ring-2 ring-[var(--color-ink)]' : ''}`}
            >
              {featured && (
                <span className="absolute -top-2.5 right-4 hidden rounded-full bg-[var(--window-teal)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--night)] lg:inline">
                  Equilibrado
                </span>
              )}
              <button
                type="button"
                onClick={() => toggle(plan.id)}
                aria-expanded={isOpen}
                className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-baseline gap-x-3 px-4 py-2.5 text-left lg:flex lg:h-full lg:flex-col lg:items-stretch lg:p-5"
              >
                <div className="flex items-baseline gap-2 lg:block">
                  <h3 className="text-lg font-extrabold tracking-tight lg:text-2xl">{plan.name}</h3>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">{plan.label}</p>
                </div>
                <p className="lg:mt-2">
                  <span className="text-xl font-extrabold tracking-tight lg:text-3xl">{money(plan.price)}</span>
                  <span className="text-sm text-[var(--color-ink-soft)]"> /mes</span>
                </p>
                <FelBadge plan={plan} />
                <p className="mt-1 hidden text-sm leading-snug text-[var(--color-ink-soft)] lg:block">{plan.tagline}</p>
                <ul className="mt-3 hidden space-y-1 border-t border-[var(--window-line)] pt-3 text-[13px] leading-snug lg:block">
                  {short.slice(0, SHOWN).map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span aria-hidden="true" className="text-[var(--window-teal)]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <span className="col-span-2 mt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--window-teal)] lg:mt-auto lg:pt-3">
                  {isOpen ? 'Cerrar ▴' : extra > 0 ? `Ver todo (+${extra}) ▾` : 'Ver todo ▾'}
                </span>
              </button>
              {/* Phones and tablets: the card itself grows. */}
              {isOpen && (
                <div className="px-4 pb-4 lg:hidden">
                  <PlanDetail plan={plan} plans={plans} sites={sites} />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Desktop: the open card grows down into a full-width panel. */}
      {openPlan && (
        <div
          className="plan-grow price-card-open hidden rounded-2xl rounded-t-none p-6 ring-2 ring-[var(--color-ink)] lg:block"
        >
          <PlanDetail plan={openPlan} plans={plans} sites={sites} />
        </div>
      )}

      <SiteKinds plans={plans} sites={sites} />

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

// An open plan: everything it includes, and the website on this plan.
function PlanDetail({ plan, plans, sites }) {
  const options = siteOptionsFor(plan, sites)
  return (
    <div className="plan-grow grid gap-5 border-t border-[var(--window-line)] pt-4 lg:grid-cols-[1fr_1.4fr] lg:gap-8 lg:border-0 lg:pt-0">
      <div>
        <p className="text-sm leading-snug text-[var(--color-ink-soft)] lg:hidden">{plan.tagline}</p>
        <h4 className="mt-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] lg:mt-0">
          Todo lo que trae {plan.name}
        </h4>
        <ul className="mt-2 grid gap-1 text-[13px] leading-snug sm:grid-cols-2 lg:grid-cols-1">
          {plan.includes.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span aria-hidden="true" className="text-[var(--window-teal)]">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {!hasFEL(plan) && (
          <p className="mt-3 rounded-xl border border-[var(--window-line)] p-3 text-[13px] leading-snug">
            <strong>Sin factura electrónica FEL.</strong> Es para negocios que todavía no facturan: no pagas por algo
            que aún no usas. Cuando te formalices, subes a {plans.find(hasFEL)?.name ?? 'el siguiente plan'} y sigues con tus mismos datos.
          </p>
        )}
      </div>
      <div>
        <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
          Tu sitio web con {plan.name}
        </h4>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {options.map(({ level, state, setup, monthly }) => {
            const kind = SITE_KINDS[level.id] ?? { name: level.label, adds: [] }
            return (
              <li
                key={level.id}
                className={`rounded-xl border p-3 text-[13px] leading-snug ${state === 'included' ? 'border-[var(--window-teal)] bg-[var(--window-teal)]/10' : 'border-[var(--window-line)]'} ${state === 'covered' ? 'opacity-50' : ''}`}
              >
                <p className="font-extrabold">{kind.name}</p>
                {state === 'included' && <p className="mt-1 font-bold text-[var(--window-teal)]">Incluido: construcción y mantenimiento</p>}
                {state === 'covered' && <p className="mt-1">Ya cubierto por lo que trae tu plan</p>}
                {state === 'buy' && (
                  <p className="mt-1">
                    <strong>{money(setup)}</strong> una vez + <strong>{money(monthly)}/mes</strong>
                    {includedSiteRank(plan) > 0 && (
                      <span className="block text-[var(--color-ink-soft)]">Pagas solo la diferencia</span>
                    )}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[12px] leading-snug text-[var(--color-ink-soft)]">
          {includedSiteRank(plan)
            ? 'Puedes subir a un sitio más completo cuando quieras.'
            : 'Este plan no trae sitio: lo agregas cuando quieras, en cualquiera de los tres tipos.'}
        </p>
      </div>
    </div>
  )
}

// The three kinds of website, side by side: what each adds, its price on
// its own, and the plan that already includes it.
function SiteKinds({ plans, sites }) {
  return (
    <section aria-labelledby="sitios-title" className="mt-6">
      <h3 id="sitios-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">
        Tres tipos de sitio web, hechos por Creators
      </h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-3">
        {sites.map((level, i) => {
          const kind = SITE_KINDS[level.id] ?? { name: level.label, adds: [level.detail].filter(Boolean) }
          const inPlan = plans.find((p) => includedSiteRank(p) === i + 1)
          return (
            <li key={level.id} className="flex flex-col rounded-2xl bg-white/70 px-4 py-3 lg:p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-lg font-extrabold tracking-tight">{kind.name}</h4>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">Tipo {i + 1}</span>
              </div>
              <ul className="mt-2 space-y-1 text-[13px] leading-snug">
                {kind.adds.map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span aria-hidden="true" className="text-[var(--window-teal)]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-[var(--window-line)] pt-2 text-[13px] leading-snug lg:mt-auto">
                <strong>{money(level.setup)}</strong> una vez + <strong>{money(level.monthly)}/mes</strong>
                <span className="block text-[var(--color-ink-soft)]">
                  {inPlan ? `Incluido en ${inPlan.name}, o súmalo a cualquier plan` : 'Súmalo a cualquier plan'}
                </span>
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const hasFEL = (plan) => Boolean(plan.capabilities?.fel)

// Every card says where it stands on FEL: it's what separates Base from the
// rest, and where AndRho differs from the local POS systems (they charge
// for invoicing from their cheapest plan).
function FelBadge({ plan }) {
  const on = hasFEL(plan)
  return (
    <span
      className={`col-span-2 mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${on ? 'bg-[var(--window-teal)] text-[var(--night)]' : 'border border-[var(--window-line)] text-[var(--color-ink-soft)]'}`}
    >
      {on ? '✓ Factura FEL incluida' : 'Sin FEL · aún no facturas'}
    </span>
  )
}

// The FEL line under the heading: Base is for businesses that don't invoice
// yet; FEL comes with the plan they move to when they formalize.
function FelNote({ plans }) {
  const first = plans.find(hasFEL)
  const base = plans.find((p) => !hasFEL(p))
  if (!first || !base) return null
  return (
    <p className="mt-3 max-w-4xl rounded-2xl border border-[var(--window-teal)] px-4 py-2.5 text-sm leading-snug sm:text-base">
      <strong>¿Todavía no facturas?</strong> Empieza con {base.name} ({money(base.price)}) sin pagar factura
      electrónica. Otros sistemas te la cobran desde su plan más barato. Cuando te formalices, la factura FEL viene
      incluida desde {first.name}.
    </p>
  )
}
