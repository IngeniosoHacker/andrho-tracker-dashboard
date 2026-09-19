import Logo from '../ui/Logo.jsx'

const LINK_GROUPS = [
  {
    heading: 'Producto',
    links: [
      { label: 'El proyecto', href: '/#proyecto' },
      { label: 'Precios', href: '/#pricing' },
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

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-canvas)]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-[var(--color-muted)]">
              El departamento de Big Data que tu empresa no sabía que necesitaba.
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-faint)]">{group.heading}</p>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="transition-colors hover:text-[var(--color-ink)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-14 border-t border-[var(--color-border)] pt-8 text-center text-xs text-[var(--color-faint)]">
          © 2026 AndRho. Creado por <span className="text-[var(--color-ink-soft)]">Ableitung Labs</span>.
        </p>
      </div>
    </footer>
  )
}
