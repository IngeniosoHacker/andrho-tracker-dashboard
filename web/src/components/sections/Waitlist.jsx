import SpotlightCard from '../ui/SpotlightCard.jsx'
import MagnetButton from '../ui/MagnetButton.jsx'
import Reveal from '../ui/Reveal.jsx'
import TiltedCard from '../ui/TiltedCard.jsx'

const PERKS = [
  { title: 'Acceso anticipado', body: 'Entras antes que nadie cuando abramos las primeras cuentas.' },
  { title: 'Precio de fundador', body: 'Condiciones especiales por ser parte de la tripulación original.' },
  { title: 'Voz en el diseño', body: 'Tus respuestas literalmente definen qué construimos primero.' },
]

export default function Waitlist() {
  return (
    <section id="waitlist" className="mx-auto max-w-6xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Reserva tu asiento antes del despegue.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--c-mist)]">
          Todavía estamos construyendo AndRho. Únete a la lista de espera respondiendo una
          misión corta — nos sirve para saber exactamente qué necesita tu negocio primero.
        </p>
      </Reveal>

      <div className="mx-auto mt-16 grid gap-6 sm:grid-cols-3">
        {PERKS.map((perk, i) => (
          <Reveal key={perk.title} delay={i * 90}>
            <TiltedCard>
              <SpotlightCard className="p-6">
                <h3 className="font-display text-lg font-semibold">{perk.title}</h3>
                <p className="mt-2 text-sm text-[var(--c-mist)]">{perk.body}</p>
              </SpotlightCard>
            </TiltedCard>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-16 flex flex-col items-center gap-4 text-center">
        <MagnetButton as="a" href="#mission-form">
          Completar misión para reservar tu asiento
        </MagnetButton>
        <p className="font-mono text-xs text-[var(--c-mist)]">Toma menos de 3 minutos. Cero spam, cero ventas forzadas.</p>
      </Reveal>
    </section>
  )
}
