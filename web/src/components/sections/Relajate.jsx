import TextType from '../ui/TextType.jsx'
import { illustrations } from '../../lib/assets.js'
import { ACTIVITIES } from '../../lib/seo.js'

// Window view, opens the "relájate" group (from sections.pdf, page 1). "vender" types through different
// business activities (lib/seo.js ACTIVITIES), ending on a joke.
export default function Relajate() {
  return (
    <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1fr_1.15fr] md:gap-12 md:p-14 lg:p-16">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
          Análisis de datos para pymes
        </p>
        <h2 id="relajate-title" className="mt-3 text-6xl font-extrabold tracking-[-0.045em] text-[var(--window-teal)] sm:text-7xl lg:text-9xl">
          Relájate
        </h2>
        <p className="mt-5 max-w-md text-xl leading-snug sm:text-2xl lg:text-3xl">
          <span className="sr-only">
            Encárgate de {ACTIVITIES.slice(0, -1).join(', ')} mientras la plataforma hace toda la parte complicada.
          </span>
          <span aria-hidden="true">
            Encárgate de
            <span className="block min-h-[1.3em] font-bold text-[var(--window-teal)]">
              <TextType text={ACTIVITIES} typingSpeed={70} deletingSpeed={35} pauseDuration={1500} cursorClassName="text-[var(--window-teal)]" />
            </span>
            mientras la plataforma hace toda la parte complicada.
          </span>
        </p>
        <div className="mt-8 flex max-w-sm flex-col gap-3 sm:mt-12">
          <a href="/signup.html" className="btn-solid">
            Comenzar
          </a>
          <a href="#como-funciona" className="btn-outline">
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
        className="mx-auto max-h-[24svh] w-auto md:max-h-[64svh] md:w-full md:max-w-full md:object-contain"
      />
    </div>
  )
}
