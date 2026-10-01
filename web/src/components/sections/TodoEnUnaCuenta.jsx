import { BoxesIcon, ChipIcon, GlobeIcon, MegaphoneIcon } from '../ui/icons.jsx'
import { SERVICES } from '../../lib/seo.js'

const ICONS = { web: GlobeIcon, redes: MegaphoneIcon, erp: BoxesIcon, hardware: ChipIcon }
// One accent per card so the grid reads as four different things.
const ACCENTS = ['#4fb39b', '#8b5cf6', '#3b82f6', '#f59e0b']

// Window view (group "adapta"): everything a business gets with one AndRho
// account, beyond the analytics panel.
export default function TodoEnUnaCuenta() {
  return (
    <div className="p-6 sm:p-10 md:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Una cuenta, todo tu negocio</p>
      <h2 id="todo-en-una-cuenta-title" className="mt-4 max-w-4xl text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
        Crea tu cuenta. <span className="text-[var(--window-teal)]">Del resto</span> nos encargamos.
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-snug sm:text-lg text-[var(--color-ink-soft)] lg:text-xl">
        AndRho no es solo un panel: también construimos y operamos las piezas que tu negocio necesita, con
        Creators verificados y conectado a tus datos desde el día uno.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-4">
        {SERVICES.map((service, i) => {
          const Icon = ICONS[service.id]
          return (
            <li key={service.id} className="grid grid-cols-[auto_1fr] gap-x-4 rounded-2xl bg-white/75 p-4 sm:flex sm:flex-col sm:p-5 lg:p-6">
              <span
                className="row-span-2 flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: ACCENTS[i] }}
              >
                <Icon width={20} height={20} />
              </span>
              <h3 className="text-lg font-extrabold tracking-tight sm:mt-4 sm:text-xl lg:text-2xl">{service.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-snug text-[var(--color-ink-soft)]">{service.body}</p>
              <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
                {service.tags.map((tag) => (
                  <li key={tag} className="rounded-full border border-[var(--window-line)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)]">
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row lg:mt-10">
        <a href="/signup.html" className="btn-solid sm:flex-1">
          Crear mi cuenta
        </a>
        <a href="#creators" className="btn-outline sm:flex-1">
          Conoce a los Creators
        </a>
      </div>
    </div>
  )
}
