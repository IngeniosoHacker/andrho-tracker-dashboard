import { useState } from 'react'
import Logo from '../ui/Logo.jsx'

// `page` tells the navbar which auth page it's rendered on (it's reused on
// login.html/signup.html so those keep the same persistent header) so it can
// skip linking to the page you're already on instead of showing a dead link.
export default function Navbar({ page = 'home' }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <a href="/">
          <Logo />
        </a>

        <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest text-[var(--color-muted)] md:flex">
          <a href="/#relajate" className="transition-colors hover:text-[var(--color-ink)]">
            El proyecto
          </a>
          <a href="/waitlist.html" className="transition-colors hover:text-[var(--color-ink)]">
            Lista de espera
          </a>
        </div>

        {/* Login + register are one pair, login immediately before register */}
        <div className="flex items-center gap-3">
          {page !== 'login' && (
            <a
              href="/login.html"
              className="hidden font-mono text-xs uppercase tracking-widest text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] md:inline"
            >
              Iniciar sesión
            </a>
          )}
          {page !== 'signup' && (
            <a href="/signup.html" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold transition-colors">
              Crear cuenta
            </a>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-ink)] transition-colors hover:border-[var(--mint)] md:hidden"
          >
            <span className="relative block h-3 w-4" aria-hidden="true">
              <span
                className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-200 ${open ? 'translate-y-[6px] rotate-45' : ''}`}
              />
              <span
                className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
              />
              <span
                className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-200 ${open ? '-translate-y-[6px] -rotate-45' : ''}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu — desktop links collapse into this below md */}
      <div
        className={`overflow-hidden border-t border-[var(--color-border)] transition-[max-height] duration-300 ease-out md:hidden ${open ? 'max-h-72' : 'max-h-0 border-t-0'}`}
      >
        <div className="flex flex-col gap-1 bg-[var(--color-canvas)] px-6 py-4 font-mono text-sm uppercase tracking-widest text-[var(--color-muted)]">
          <a href="/#relajate" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)]">
            El proyecto
          </a>
          <a href="/waitlist.html" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)]">
            Lista de espera
          </a>
          {page !== 'login' && (
            <a href="/login.html" className="rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)]">
              Iniciar sesión
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
