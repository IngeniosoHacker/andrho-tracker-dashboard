import { useState } from 'react'
import GradientText from '../ui/GradientText.jsx'
import Reveal from '../ui/Reveal.jsx'
import InfiniteMenu from '../ui/InfiniteMenu.jsx'
import Illustration from '../ui/Illustration.jsx'
import { illustrations } from '../../lib/assets.js'
import { makeTileImage } from '../../lib/tileImage.js'

// High-level, customer-facing description of what AndRho does. Deliberately
// stays at the "what" level — the underlying statistical/AI methods are
// documented internally (see PRODUCT.md) and are not exposed here.
const FEATURES = [
  {
    title: 'Conexión total',
    body: 'Une tu ERP, tus canales digitales y tus comunicaciones en un solo lugar, sin duplicar procesos ni pagar por media docena de herramientas que hacen lo mismo.',
  },
  {
    title: 'Inteligencia aplicada',
    body: 'Un motor de análisis interpreta lo que ocurre en tu operación y lo traduce en explicaciones claras — no en reportes que solo entiende quien los construyó.',
  },
  {
    title: 'Decisiones, no reportes',
    body: 'Cada hallazgo llega como una sugerencia concreta: se acepta, se rechaza o se comenta. La plataforma propone, tu equipo decide.',
  },
  {
    title: 'Comunicación organizada',
    body: 'Lo que llega por WhatsApp o Telegram se convierte en un ticket, no en un mensaje perdido entre trescientos no leídos.',
  },
  {
    title: 'Memoria institucional',
    body: 'Cada decisión queda registrada: qué se aceptó, qué se rechazó y por qué. Tu historial no depende de la memoria de nadie.',
  },
  {
    title: 'Red entre negocios',
    body: 'Cuando la necesidad de un cliente coincide con la capacidad de otro dentro de la red AndRho, la plataforma sugiere la conexión.',
  },
]

// Sphere-menu items: on-brand generated planet tiles (no external stock
// photos, no CORS/canvas-tainting risk) paired with each feature's
// title/description.
const MENU_ITEMS = FEATURES.map((feature, i) => ({
  image: makeTileImage({ label: feature.title, index: i }),
  link: '#pricing',
  title: feature.title,
  description: feature.body,
}))

const CAPABILITIES = ['ERP', 'WhatsApp', 'Telegram', 'Web-tracker', 'Analítica', 'Inteligencia artificial', 'Seguridad interna', 'Red B2B']

// Sector-flavored, still method-free — pairs with the sectors asked about in
// the waiting-list survey.
const USE_CASES = [
  {
    sector: 'Retail',
    title: 'Anticipa quiebres de stock',
    body: 'AndRho detecta cuando un producto va camino a agotarse antes de que el cliente lo note en el estante.',
  },
  {
    sector: 'Restaurantes',
    title: 'Vencimientos bajo control',
    body: 'Organiza tu inventario por fecha de caducidad sin depender de una hoja de cálculo ni de la memoria de nadie.',
  },
  {
    sector: 'Servicios',
    title: 'Prioriza lo que sí urge',
    body: 'Los tickets con impacto real en el cliente suben al tope de la lista automáticamente.',
  },
  {
    sector: 'Logística',
    title: 'Se ajusta a la demanda real',
    body: 'La operación reacciona a lo que está pasando esta semana, no a un promedio del trimestre pasado.',
  },
]

function SectorShowcase() {
  const [active, setActive] = useState(0)
  const current = USE_CASES[active]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {USE_CASES.map((useCase, i) => (
          <button
            key={useCase.sector}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              i === active
                ? 'bg-[var(--color-ink)] text-[var(--color-canvas)]'
                : 'border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--blue)] hover:text-[var(--color-ink)]'
            }`}
          >
            {useCase.sector}
          </button>
        ))}
      </div>

      <div key={current.sector} className="mx-auto mt-12 max-w-2xl animate-fade-up text-center">
        <h4 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">{current.title}</h4>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">{current.body}</p>
      </div>
    </div>
  )
}

export default function Features() {
  return (
    <section id="proyecto" className="relative mx-auto max-w-6xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16">
        <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
          Una plataforma. <GradientText>Toda tu operación.</GradientText>
        </h2>
        <p className="text-lg leading-relaxed text-[var(--color-ink-soft)] lg:pb-1">
          AndRho combina ciencia de datos, inteligencia artificial e infraestructura en la nube en
          un solo panel administrativo. No sustituye tu ERP ni tu CRM: los conecta, los entiende, y
          convierte lo que encuentra en decisiones que cualquier persona del equipo puede usar.
        </p>
      </Reveal>

      <Reveal delay={100} className="relative mt-16 overflow-hidden">
        <div className="flex w-max gap-3 animate-marquee">
          {[...CAPABILITIES, ...CAPABILITIES].map((tag, i) => (
            <span
              key={i}
              className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[var(--color-border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-ink-soft)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)]" />
              {tag}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--color-canvas)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--color-canvas)] to-transparent" />
      </Reveal>

      {/* The sphere — preserved as-is: a draggable WebGL globe of feature
          tiles, sitting directly on the page canvas. */}
      <Reveal delay={100} className="relative mt-20">
        <p className="mb-4 flex items-center justify-center gap-2 text-center font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-faint)]">
          Arrastra la esfera para explorar
          <Illustration src={illustrations.satellite} alt="" className="h-6 w-9 opacity-80" />
        </p>
        <div className="sm:h-[520px] lg:h-[620px]">
          <InfiniteMenu items={MENU_ITEMS} scale={1} />
        </div>
      </Reveal>

      <Reveal delay={150} className="mx-auto mt-28 max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--blue)]">Un vistazo por sector</p>
        <h3 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
          Se adapta a cómo ya trabajas.
        </h3>
      </Reveal>

      <Reveal delay={220} className="mt-12">
        <SectorShowcase />
      </Reveal>
    </section>
  )
}
