import SiteHeader from './components/landing/SiteHeader.jsx'
import WindowFrame from './components/landing/WindowFrame.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import SurveyArt from './components/survey/SurveyArt.jsx'
import Footer from './components/sections/Footer.jsx'
import { SITE } from './lib/seo.js'
import { completedForm } from './lib/visitor.js'

// The landing for a visitor who comes back without having signed up
// (lib/visitor.js → 'recurrente'). They already saw the long story, so this
// is the short close: what happens when they continue, the doubts that
// usually hold people back, and the button. The full landing stays one link
// away (?vista=completa).

const STEPS = [
  {
    title: 'Cuéntanos de tu negocio',
    body: 'Un párrafo o unas preguntas rápidas. AndRho entiende qué vendes, cómo lo vendes y qué te falta.',
  },
  {
    title: 'Elige tu paquete',
    body: 'Despegue, En Órbita o Galáctico, con los módulos que tu negocio necesita. Quita lo que no quieras.',
  },
  {
    title: 'Sube a bordo',
    body: 'Entras a tu panel y empezamos a preparar tu ERP, tu WhatsApp y tu sitio web, cada uno con su estado a la vista.',
  },
]

const DOUBTS = [
  { q: '¿Cuánto cuesta?', a: 'Nada mientras dure la beta. Te avisamos antes de que cualquier cosa tenga precio.' },
  { q: '¿Tengo que cambiar mis sistemas?', a: 'No. AndRho se conecta a lo que ya usas; si no tienes ERP, te levantamos Odoo.' },
  { q: '¿La IA va a hacer cosas sola?', a: 'No. Los modelos analizan y la IA te lo explica, pero nada se ejecuta sin tu aprobación.' },
  { q: '¿Está terminado?', a: 'Está en beta y lo construimos a la vista: puedes ver cada commit en el avance en vivo.' },
]

export default function ShortLanding() {
  // Signed up to the old waiting list: their spot is open now.
  const waitlisted = completedForm() === 'waitlist'
  return (
    <div className="antialiased">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="relative z-10 px-3 pb-16 pt-[124px] sm:px-6 md:pt-[104px]">
        <WindowFrame className="mx-auto">
          <section aria-labelledby="corta-title" className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12 lg:p-14">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
                {waitlisted ? 'Estabas en la lista: tu lugar está listo' : 'Qué bueno verte de nuevo'}
              </p>
              <h1 id="corta-title" className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Ya conoces AndRho. <span className="text-[var(--window-teal)]">Falta tu negocio.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-snug sm:text-xl">
                En unos minutos nos cuentas de tu negocio, eliges tu paquete y empezamos a preparar tu nave. Gratis
                mientras dure la beta.
              </p>
              <div className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <a href="/signup.html" className="btn-solid sm:flex-1">
                  Continuar →
                </a>
                <a href="/?vista=completa" className="btn-outline sm:flex-1">
                  Ver el sitio completo
                </a>
              </div>
            </div>
            <SurveyArt scene="boarding" className="mx-auto max-h-[26svh] w-auto md:max-h-[56svh] md:w-full" />
          </section>
        </WindowFrame>

        <WindowFrame className="mx-auto mt-6">
          <section aria-labelledby="pasos-title" className="p-6 sm:p-10 lg:p-14">
            <h2 id="pasos-title" className="text-3xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Lo que pasa cuando continúas
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-2xl bg-white/70 p-6">
                  <span className="font-mono text-sm font-bold text-[var(--window-teal)]">0{i + 1}</span>
                  <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{step.title}</h3>
                  <p className="mt-2 leading-snug text-[var(--color-ink-soft)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>
        </WindowFrame>

        <WindowFrame className="mx-auto mt-6">
          <section aria-labelledby="dudas-title" className="p-6 sm:p-10 lg:p-14">
            <h2 id="dudas-title" className="text-3xl font-extrabold tracking-[-0.04em] sm:text-5xl">
              Lo que suele frenar a la gente
            </h2>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {DOUBTS.map((d) => (
                <div key={d.q} className="rounded-2xl bg-white/70 p-6">
                  <dt className="text-xl font-extrabold tracking-tight">{d.q}</dt>
                  <dd className="mt-2 leading-snug text-[var(--color-ink-soft)]">{d.a}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a href="/signup.html" className="btn-solid w-full sm:w-auto sm:px-10">
                Continuar →
              </a>
              <p className="text-[var(--color-ink-soft)]">
                ¿Otra duda?{' '}
                <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-ink)] underline decoration-[var(--window-teal)] underline-offset-4">
                  Escríbenos por WhatsApp
                </a>
              </p>
            </div>
          </section>
        </WindowFrame>
      </main>
      <Footer />
    </div>
  )
}
