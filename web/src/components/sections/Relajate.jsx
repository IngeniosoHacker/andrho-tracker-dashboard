import { illustrations } from '../../lib/assets.js'

// Window 1 (from sections.pdf, page 1).
export default function Relajate() {
  return (
    <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1fr_1.15fr] md:gap-10 md:p-14">
      <div>
        <h2 id="relajate-title" className="text-6xl font-extrabold tracking-[-0.045em] text-[var(--window-teal)] sm:text-7xl lg:text-8xl">
          Relájate
        </h2>
        <p className="mt-5 max-w-sm text-xl leading-snug sm:text-2xl">
          Encárgate de Vender mientras la plataforma hace toda la parte complicada.
        </p>
        <div className="mt-8 flex max-w-xs flex-col gap-3 sm:mt-12">
          <a href="/signup.html" className="btn-solid">
            Comenzar
          </a>
          <a href="#adapta" className="btn-outline">
            Cómo funciona
          </a>
        </div>
      </div>
      <img
        src={illustrations.alienRelax}
        alt="Un alienígena relajado en su sillón, con limonada y el teléfono en la mano"
        width="743"
        height="688"
        draggable="false"
        className="mx-auto max-h-[26svh] w-auto md:max-h-none md:w-full"
      />
    </div>
  )
}
