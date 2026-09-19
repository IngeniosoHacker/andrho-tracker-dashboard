import Logo from '../ui/Logo.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-canvas)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-12 text-center lg:px-10">
        <Logo />
        <p className="max-w-md text-sm text-[var(--color-muted)]">
          El departamento de Big Data que tu empresa no sabía que necesitaba.
        </p>
        <div className="flex gap-6 font-mono text-xs text-[var(--color-muted)]">
          <a href="https://github.com/IngeniosoHacker/andrho" target="_blank" rel="noreferrer" className="hover:text-[var(--color-ink)]">
            GitHub
          </a>
          <a href="https://www.instagram.com/andrho.gt/" target="_blank" rel="noreferrer" className="hover:text-[var(--color-ink)]">
            Instagram
          </a>
          <a href="#pricing" className="hover:text-[var(--color-ink)]">
            Precios
          </a>
        </div>
        <p className="mt-4 text-xs text-[var(--color-faint)]">
          © 2026 AndRho. Creado por <span className="text-[var(--color-ink-soft)]">Ableitung Labs</span>.
        </p>
      </div>
    </footer>
  )
}
