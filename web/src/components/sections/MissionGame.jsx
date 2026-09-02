import Reveal from '../ui/Reveal.jsx'
import AsteroidGame from '../ui/AsteroidGame.jsx'

// Standalone section — plays as a plain arcade discount hook. It's also a
// color-scheme experiment (the interface rotates through stages
// automatically during play, unannounced — see AsteroidGame.jsx and
// src/lib/gameThemes.js), but that's never surfaced to the player: the copy
// here must stay about the discount, not the experiment. Lives before the
// repo/commit-stats section regardless of whether that one loads (see
// LiveProgress.jsx, which just hides itself on failure).
export default function MissionGame() {
  return (
    <section id="minijuego" className="mx-auto max-w-4xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--c-comet)]">Modo desvío de emergencia</p>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Gana descuentos jugando.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--c-mist)]">
          Defiende la nave de un enjambre de asteroides. Destruye suficientes y desbloquea un
          descuento por 1 año.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-16">
        <AsteroidGame />
      </Reveal>
    </section>
  )
}
