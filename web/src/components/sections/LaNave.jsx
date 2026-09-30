import BoardingIllustration from '../ui/BoardingIllustration.jsx'

// Window 3 — the waitlist call. Not in sections.pdf: built in the same
// language as the two windows before it (big heading, short copy, black
// primary + outlined secondary, flat mint illustration).
export default function LaNave() {
  return (
    <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1.05fr_1fr] md:gap-10 md:p-14">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
          Lista de espera · compuertas abiertas
        </p>
        <h2 id="nave-title" className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
          Que no te deje <span className="text-[var(--window-teal)]">la nave</span>
        </h2>
        <p className="mt-5 max-w-md text-lg leading-snug sm:text-xl">
          Estamos por despegar. Anótate en la lista de espera y asegura tu lugar a bordo antes de que cerremos las
          compuertas.
        </p>
        <div className="mt-8 flex max-w-xs flex-col gap-3 sm:mt-10">
          <a href="/waitlist.html" className="btn-solid">
            Unirme a la lista de espera
          </a>
          <a href="#juego" className="btn-outline">
            Jugar mientras despegamos
          </a>
        </div>
      </div>
      <BoardingIllustration className="mx-auto max-h-[24svh] w-auto md:max-h-none md:w-full" />
    </div>
  )
}
