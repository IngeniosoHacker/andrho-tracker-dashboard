import { illustrations } from '../../lib/assets.js'

// Window view, opens the "adapta" group (from sections.pdf, page 2).
export default function Adapta() {
  return (
    <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1fr_1.1fr] md:gap-12 md:p-14 lg:p-16">
      <img
        src={illustrations.astronautPuzzle}
        alt="Un astronauta abrumado rodeado de piezas que no encajan"
        width="608"
        height="576"
        draggable="false"
        className="order-2 mx-auto max-h-[24svh] w-auto md:order-1 md:max-h-none md:w-full"
      />
      <div className="order-1 text-center md:order-2">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
          Software a la medida de tu negocio
        </p>
        <p className="mx-auto max-w-lg text-lg leading-snug sm:text-xl lg:text-2xl">
          Hemos pasado por esto, sincronizar la vida real con el sistema a veces es imposible. Por eso hemos creado un
          Software que se
        </p>
        <h2 id="adapta-title" className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
          Adapta a tu operación
        </h2>
        <a href="/signup.html" className="btn-solid mx-auto mt-8 w-full max-w-60 sm:mt-12">
          Crea tu propio Sistema
        </a>
      </div>
    </div>
  )
}
