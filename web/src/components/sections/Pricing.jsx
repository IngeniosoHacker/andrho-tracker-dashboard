import GradientText from '../ui/GradientText.jsx'
import Reveal from '../ui/Reveal.jsx'
import Card from '../ui/Card.jsx'
import MagnetButton from '../ui/MagnetButton.jsx'
import Illustration from '../ui/Illustration.jsx'
import { illustrations } from '../../lib/assets.js'

// PLACEHOLDER PRICES — swap these for the real numbers before this goes
// live. Names ("Base" -> "Galáctico", most basic to most pro) are final;
// `price`/`period` are round placeholders and `highlight` marks the plan
// called out as recommended. `accent` traces the brand's mint->violet
// gradient across the tiers — a literal launch sequence, matching the names.
const TIERS = [
  {
    name: 'Base',
    accent: 'var(--mint)',
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
    accent: 'var(--cyan)',
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
    accent: 'var(--blue)',
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
    accent: 'var(--violet)',
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
    <section id="pricing" className="relative bg-[var(--color-canvas-soft)] py-28 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
            Un plan para <GradientText>cada etapa del viaje.</GradientText>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--color-ink-soft)]">
            Empieza con lo que tu operación necesita hoy y sube de nivel cuando lo necesites. Sin
            contratos forzosos, sin letra pequeña.
          </p>
        </Reveal>

        <div className="mx-auto mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 90} className="h-full">
              <Card
                className={`relative flex h-full flex-col overflow-hidden p-6 ${
                  tier.highlight ? 'card-highlight shadow-xl' : ''
                }`}
                style={tier.highlight ? { borderColor: tier.accent } : undefined}
              >
                <span className="-mx-6 -mt-6 mb-6 block h-1.5" style={{ background: tier.accent }} aria-hidden="true" />

                {tier.highlight && (
                  <Illustration
                    src={illustrations.ufoSmall}
                    alt=""
                    className="absolute -right-3 top-2 h-12 w-16 animate-float-slower"
                  />
                )}
                {tier.highlight && (
                  <span className="mb-4 inline-flex w-fit items-center rounded-full bg-[var(--mint-light)]/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--color-ink)]">
                    Recomendado
                  </span>
                )}
                <h3 className="font-display text-xl font-bold tracking-tight text-[var(--color-ink)]">{tier.name}</h3>
                <p className="mt-2 min-h-[2.5rem] text-sm text-[var(--color-muted)]">{tier.tagline}</p>

                <p className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)]">{tier.price}</span>
                  {tier.period && <span className="font-mono text-sm text-[var(--color-muted)]">{tier.period}</span>}
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--color-ink-soft)]">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: tier.accent }}
                        aria-hidden="true"
                      />
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
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
