import TextType from '../ui/TextType.jsx'
import MagnetButton from '../ui/MagnetButton.jsx'
import ScrambleLogo from '../ui/ScrambleLogo.jsx'
import ParallaxLayer from '../ui/ParallaxLayer.jsx'
import Illustration from '../ui/Illustration.jsx'
import { illustrations } from '../../lib/assets.js'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[var(--color-canvas)] pt-40 pb-28 lg:pt-52 lg:pb-32">
      <ParallaxLayer speed={0.08} className="pointer-events-none absolute inset-0 hidden sm:block">
        <Illustration
          src={illustrations.alienWave}
          alt=""
          className="absolute right-[8%] top-36 h-14 w-14 animate-float-slow opacity-90 lg:right-[14%] lg:h-20 lg:w-20"
        />
      </ParallaxLayer>

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
        <h1 className="font-display text-6xl font-bold leading-none tracking-tight text-[var(--color-ink)] sm:text-8xl lg:text-9xl">
          <ScrambleLogo />
        </h1>

        <p className="mt-10 font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
          Conecta y entiende tu negocio
        </p>

        <div className="mt-6 min-h-[3.5rem] font-mono text-sm text-[var(--color-muted)] sm:text-base">
          <TextType
            text={[
              '> conectando tu ERP...',
              '> entrenando a los agentes de IA...',
              '> unificando WhatsApp y web-tracker...',
              '> traduciendo datos en decisiones...',
            ]}
            cursorClassName="text-[var(--blue)]"
          />
        </div>

        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
          AndRho es el centro de control que unifica tu ERP, tus canales digitales y tu equipo —
          y lo traduce en decisiones, no en más pestañas.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <MagnetButton as="a" href="/signup.html">
            Crear mi cuenta →
          </MagnetButton>
          <MagnetButton as="a" href="#proyecto" variant="secondary">
            Sobre el proyecto ↓
          </MagnetButton>
        </div>

        <p className="mt-10 font-mono text-xs text-[var(--color-faint)]">
          Sin humo. Con progreso público en GitHub.
        </p>
      </div>
    </section>
  )
}
