import Logo from '../ui/Logo.jsx'
import { FAQ } from '../../lib/seo.js'

const LINK_GROUPS = [
  {
    heading: 'Explora',
    links: [
      { label: 'Relájate', href: '/#relajate' },
      { label: 'IA con criterio', href: '/#ia-con-criterio' },
      { label: 'Adapta a tu operación', href: '/#adapta' },
      { label: 'Todo en una cuenta', href: '/#todo-en-una-cuenta' },
      { label: 'Que no te deje la nave', href: '/#nave' },
      { label: 'Creators', href: '/#creators' },
      { label: 'Juego', href: '/#juego' },
    ],
  },
  {
    heading: 'Cuenta',
    links: [
      { label: 'Lista de espera', href: '/waitlist.html' },
      { label: 'Iniciar sesión', href: '/login.html' },
      { label: 'Crear cuenta', href: '/signup.html' },
    ],
  },
  {
    heading: 'Comunidad',
    links: [
      { label: 'GitHub', href: 'https://github.com/IngeniosoHacker/andrho', external: true },
      { label: 'Instagram', href: 'https://www.instagram.com/andrho.gt/', external: true },
    ],
  },
]

// Dark, to carry on from the (black) game section right above it. The FAQ is
// the visible counterpart of the FAQPage JSON-LD (same data, lib/seo.js).
export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black text-white">
      <section aria-labelledby="faq-title" className="mx-auto max-w-4xl px-6 pt-20 lg:px-10">
        <h2 id="faq-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                <h3>{q}</h3>
                <span aria-hidden="true" className="font-mono text-[var(--mint)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl leading-relaxed text-white/65">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-white/55">
              Análisis de datos con inteligencia artificial para pymes en Guatemala: sitio web, redes, Odoo, hardware y
              Creators en una sola cuenta.
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/35">{group.heading}</p>
              <ul className="mt-4 space-y-3 text-sm text-white/60">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-white/35">
          © 2026 AndRho. Creado por <span className="text-white/70">Ableitung Labs</span>.
        </p>
      </div>
    </footer>
  )
}
