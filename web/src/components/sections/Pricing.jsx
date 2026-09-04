import GradientText from '../ui/GradientText.jsx'
import Reveal from '../ui/Reveal.jsx'
import ParallaxLayer from '../ui/ParallaxLayer.jsx'
import SpotlightCard from '../ui/SpotlightCard.jsx'
import MagnetButton from '../ui/MagnetButton.jsx'

// PLACEHOLDER PRICES — swap these for the real numbers before this goes
// live. Names ("Base" -> "Galáctico", most basic to most pro) are final;
// `price`/`period` are round placeholders and `highlight` marks the plan
// called out as recommended.
const TIERS = [
  {
    name: 'Base',
    price: 'Q299',
    period: '/mes',
    tagline: 'Para arrancar con un canal digital bajo control.',
    features: [
      'Un canal conectado (WhatsApp o Telegram)',
      'Tickets organizados automáticamente',
      'Dashboard de analítica básico',
      'Soporte por correo',
    ],
  },
  {
    name: 'Despegue',
    price: 'Q599',
    period: '/mes',
    tagline: 'Cuando ya necesitas conectar tu ERP.',
    features: [
      'Todo lo de Base',
      'Conexión con tu ERP',
      'WhatsApp y Telegram a la vez',
      'Sugerencias del motor de inteligencia',
      'Memoria institucional (historial de decisiones)',
    ],
  },
  {
    name: 'En Órbita',
    price: 'Q999',
    period: '/mes',
    tagline: 'Para equipos que ya operan con AndRho todos los días.',
    highlight: true,
    features: [
      'Todo lo de Despegue',
      'Asientos ilimitados para tu equipo',
      'Acceso a la red B2B AndRho',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Galáctico',
    price: 'Contáctanos',
    period: '',
    tagline: 'Integraciones a medida y un gestor de cuenta dedicado.',
    features: [
      'Todo lo de En Órbita',
      'Integraciones personalizadas',
      'Gestor de cuenta dedicado',
      'SLA a medida',
    ],
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-6 py-28 lg:px-10 lg:py-40">
      <ParallaxLayer speed={0.1} className="pointer-events-none absolute inset-0">
        <div className="glow-orb -left-32 top-24 h-96 w-96 bg-[var(--c-solar)]/10" aria-hidden="true" />
      </ParallaxLayer>

      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Un plan para <GradientText>cada etapa del viaje.</GradientText>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--c-mist)]">
          Empieza con lo que tu operación necesita hoy y sube de nivel cuando lo necesites. Sin
          contratos forzosos, sin letra pequeña.
        </p>
      </Reveal>

      <div className="mx-auto mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 90}>
            <SpotlightCard
              className={`flex h-full flex-col p-6 ${tier.highlight ? 'border-[var(--c-solar)]/50' : ''}`}
            >
              {tier.highlight && (
                <span className="mb-4 inline-flex w-fit items-center rounded-full bg-[var(--c-solar)]/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--c-solar)]">
                  Recomendado
                </span>
              )}
              <h3 className="font-display text-xl font-bold tracking-tight">{tier.name}</h3>
              <p className="mt-2 min-h-[2.5rem] text-sm text-[var(--c-mist)]">{tier.tagline}</p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold tracking-tight">{tier.price}</span>
                {tier.period && <span className="font-mono text-sm text-[var(--c-mist)]">{tier.period}</span>}
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--c-stardust)]">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-comet)]" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <MagnetButton
                as="a"
                href="/signup.html"
                variant={tier.highlight ? 'primary' : 'secondary'}
                className="mt-8 w-full"
              >
                {tier.price === 'Contáctanos' ? 'Contáctanos' : 'Crear mi cuenta'}
              </MagnetButton>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
