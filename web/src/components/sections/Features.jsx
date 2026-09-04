import GradientText from '../ui/GradientText.jsx'
import ShinyText from '../ui/ShinyText.jsx'
import Reveal from '../ui/Reveal.jsx'
import SpotlightCard from '../ui/SpotlightCard.jsx'
import Carousel from '../ui/Carousel.jsx'
import ParallaxLayer from '../ui/ParallaxLayer.jsx'
import InfiniteMenu from '../ui/InfiniteMenu.jsx'
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

export default function Features() {
  return (
    <section id="proyecto" className="relative mx-auto max-w-6xl px-6 py-28 lg:px-10 lg:py-40">
      <ParallaxLayer speed={0.1} className="pointer-events-none absolute inset-0">
        <div className="glow-orb -right-32 top-24 h-96 w-96 bg-[var(--c-comet)]/10" aria-hidden="true" />
      </ParallaxLayer>

      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Una plataforma. <GradientText>Toda tu operación.</GradientText>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--c-mist)]">
          AndRho combina ciencia de datos, inteligencia artificial e infraestructura en la nube en
          un solo panel administrativo. No sustituye tu ERP ni tu CRM: los conecta, los entiende, y
          convierte lo que encuentra en decisiones que cualquier persona del equipo puede usar.
        </p>
      </Reveal>

      <Reveal delay={100} className="relative mt-14 overflow-hidden">
        <div className="flex w-max gap-10 animate-marquee py-2 font-mono text-sm uppercase tracking-[0.2em] text-[var(--c-mist)]">
          {[...CAPABILITIES, ...CAPABILITIES].map((tag, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap">
              {tag}
              <span className="h-1 w-1 rounded-full bg-[var(--c-line)]" />
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--c-void)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--c-void)] to-transparent" />
      </Reveal>

      <Reveal delay={100} className="mt-16">
        <p className="mb-4 text-center font-mono text-xs uppercase tracking-[0.3em] text-[var(--c-mist)]">
          Arrastra la esfera para explorar
        </p>
        <div
          style={{ height: '620px', position: 'relative' }}
          className="overflow-hidden rounded-3xl border border-[var(--c-line)] bg-black/40"
        >
          <InfiniteMenu items={MENU_ITEMS} scale={1} />
        </div>
      </Reveal>

      <Reveal delay={150} className="mx-auto mt-28 max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--c-comet)]">Un vistazo por sector</p>
        <h3 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <ShinyText text="Se adapta a cómo ya trabajas." speed={4} />
        </h3>
      </Reveal>

      <Reveal delay={220} className="mx-auto mt-12 max-w-3xl">
        <Carousel
          items={USE_CASES.map((useCase) => (
            <SpotlightCard key={useCase.title} className="p-10 text-center sm:p-14">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--c-solar)]">{useCase.sector}</span>
              <h4 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">{useCase.title}</h4>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--c-mist)]">{useCase.body}</p>
            </SpotlightCard>
          ))}
        />
      </Reveal>
    </section>
  )
}
