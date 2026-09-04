export default function Footer() {
  return (
    <footer className="border-t border-[var(--c-line)] bg-[var(--c-nebula)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-12 text-center lg:px-10">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--c-solar)]" />
          &ρ AndRho
        </p>
        <p className="max-w-md text-sm text-[var(--c-mist)]">
          El departamento de Big Data que tu empresa no sabía que necesitaba.
        </p>
        <div className="flex gap-6 font-mono text-xs text-[var(--c-mist)]">
          <a href="https://github.com/IngeniosoHacker/andrho" target="_blank" rel="noreferrer" className="hover:text-[var(--c-stardust)]">
            GitHub
          </a>
          <a href="https://www.instagram.com/andrho.gt/" target="_blank" rel="noreferrer" className="hover:text-[var(--c-stardust)]">
            Instagram
          </a>
          <a href="#pricing" className="hover:text-[var(--c-stardust)]">
            Precios
          </a>
        </div>
        <p className="mt-4 text-xs text-[var(--c-mist)]">
          © 2026 AndRho. Creado por <span className="text-[var(--c-stardust)]">Ableitung Labs</span>.
        </p>
      </div>
    </footer>
  )
}
