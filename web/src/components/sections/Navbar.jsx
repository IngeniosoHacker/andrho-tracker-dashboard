export default function Navbar() {
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
        <a
          href="/signup.html"
          className="btn-solar rounded-full px-4 py-2 text-sm font-semibold transition-colors"
        >
          Crear cuenta
        </a>
      </nav>
    </header>
  )
}
