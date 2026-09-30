import TextType from '../ui/TextType.jsx'
import MagnetButton from '../ui/MagnetButton.jsx'
import ScrambleLogo from '../ui/ScrambleLogo.jsx'
import { seg } from '../../lib/motion.js'

// Module-level so re-rendering on every scroll frame doesn't restart TextType.
const TYPE_LINES = [
  '> conectando tu ERP...',
  '> aplicando modelos estadísticos...',
  '> unificando WhatsApp y web-tracker...',
  '> traduciendo datos en decisiones...',
]

// The white hero, pinned inside the landing stage (Stage.jsx). As soon as the
// visitor scrolls (t > 0) the title and the bold words hand off to flying
// copies that travel into the navbar — here they just leave an invisible
// placeholder behind (`titleRef` / `wordRefs` mark where they start) — and
// everything else fades out.
export default function Hero({ morph: t, titleRef, wordRefs }) {
  const moving = t > 0.001
  const fade = seg(t, 0, 0.3)
  const rest = { opacity: 1 - fade, transform: `translateY(${-fade * 24}px)` }
  const word = (id, text) => (
    <strong ref={wordRefs[id]} className="font-semibold text-[var(--color-ink)]" style={{ visibility: moving ? 'hidden' : 'visible' }}>
      {text}
    </strong>
  )

  return (
    <div
      inert={t > 0.35}
      className="relative flex h-full items-center justify-center overflow-hidden px-6 pt-10 lg:px-10"
      style={{ visibility: t >= 1 ? 'hidden' : 'visible' }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-display text-6xl font-bold leading-none tracking-tight text-[var(--color-ink)] sm:text-8xl lg:text-9xl">
          {/* The scramble is decorative; crawlers and screen readers get the
              real name + what it is. */}
          <span ref={titleRef} aria-hidden="true" className="inline-block whitespace-nowrap" style={{ visibility: moving ? 'hidden' : 'visible' }}>
            <ScrambleLogo paused={moving} />
          </span>
          <span className="sr-only">AndRho: análisis de datos con inteligencia artificial para pymes en Guatemala</span>
        </h1>

        <p style={rest} className="mt-10 font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
          Conecta y entiende tu negocio
        </p>

        <div style={rest} className="mt-6 min-h-[3.5rem] font-mono text-sm text-[var(--color-muted)] sm:text-base">
          <TextType text={TYPE_LINES} cursorClassName="text-[var(--blue)]" />
        </div>

        {/* Opacity only (no translate): the bold words' in-flow position is
            the measured start point of their flight into the navbar. */}
        <p style={{ opacity: rest.opacity }} className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
          AndRho es el centro de control que unifica tu ERP, tu marketing y tu equipo, lo analiza con modelos
          estadísticos y, con inteligencia artificial, te lo traduce en decisiones — no en más pestañas. Así que {word('relajate', 'relájate')}: la plataforma se {word('adapta', 'adapta')} a
          tu operación.
        </p>

        <div style={rest} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <MagnetButton as="a" href="/signup.html">
            Continuar →
          </MagnetButton>
          <MagnetButton as="a" href="#relajate" variant="secondary">
            Saber más ↓
          </MagnetButton>
        </div>

        <p style={rest} className="mt-10 font-mono text-xs text-[var(--color-faint)]">
          Sin humo. Con progreso público en GitHub.
        </p>
      </div>
    </div>
  )
}
