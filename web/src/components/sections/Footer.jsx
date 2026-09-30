import Logo from '../ui/Logo.jsx'

const LINK_GROUPS = [
  {
    heading: 'Explora',
    links: [
      { label: 'Relájate', href: '/#relajate' },
      { label: 'Adapta a tu operación', href: '/#adapta' },
      { label: 'Que no te deje la nave', href: '/#nave' },
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

// Dark, to carry on from the (black) game section right above it.
export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-white/55">
              El departamento de Big Data que tu empresa no sabía que necesitaba.
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
