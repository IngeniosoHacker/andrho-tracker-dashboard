import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--c-line)] bg-[var(--c-void)]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span
            className="h-2.5 w-2.5 rounded-full bg-[var(--c-solar)]"
            style={{ animation: 'pulse-glow 2.4s ease-in-out infinite' }}
          />
          &ρ AndRho
        </a>

        <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest text-[var(--c-mist)] md:flex">
          <a href="#proyecto" className="transition-colors hover:text-[var(--c-stardust)]">
            El proyecto
          </a>
          <a href="#pricing" className="transition-colors hover:text-[var(--c-stardust)]">
            Precios
          </a>
          <a href="/login.html" className="transition-colors hover:text-[var(--c-stardust)]">
            Iniciar sesión
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/signup.html"
            className="btn-solar rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          >
            Crear cuenta
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-line)] text-[var(--c-stardust)] transition-colors hover:border-[var(--c-comet)]/50 md:hidden"
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
        className={`overflow-hidden border-t border-[var(--c-line)] transition-[max-height] duration-300 ease-out md:hidden ${open ? 'max-h-60' : 'max-h-0 border-t-0'}`}
      >
        <div className="flex flex-col gap-1 bg-[var(--c-void)]/95 px-6 py-4 font-mono text-sm uppercase tracking-widest text-[var(--c-mist)]">
          <a href="#proyecto" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--c-panel)] hover:text-[var(--c-stardust)]">
            El proyecto
          </a>
          <a href="#pricing" onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--c-panel)] hover:text-[var(--c-stardust)]">
            Precios
          </a>
          <a href="/login.html" className="rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--c-panel)] hover:text-[var(--c-stardust)]">
            Iniciar sesión
          </a>
        </div>
      </div>
    </header>
  )
}
