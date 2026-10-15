import Logo from './components/ui/Logo.jsx'
import { FAQ, SERVICES, SITE } from './lib/seo.js'
import { completedForm } from './lib/visitor.js'

// The landing for a visitor who comes back without having signed up
// (lib/visitor.js → 'recurrente'). They already saw the long, animated story;
// now they're looking for information. So this page is plain on purpose: a
// white page, a static header, an index of anchors, short sections and native
// <details> for the questions — no starfield, no scroll stage, no
// transitions. The full landing stays one link away (?vista=completa).
//
// "Así que sí te interesa" is said out loud: recognizing a returning visitor
// and showing them something else is itself something AndRho does for a
// client's site.

const CTA = { href: '/signup.html', label: 'Continuar' }

const SECTIONS = [
  { id: 'que-es', label: 'Qué es' },
  { id: 'incluye', label: 'Qué incluye' },
  { id: 'empezar', label: 'Cómo empiezas' },
  { id: 'precio', label: 'Precio' },
  { id: 'preguntas', label: 'Preguntas' },
]

const STEPS = [
  { title: 'Cuéntanos de tu negocio', body: 'Un párrafo o unas preguntas rápidas: qué vendes, cómo lo vendes y qué te falta.' },
  { title: 'Elige tu paquete', body: 'Despegue, En Órbita o Galáctico, con los módulos que tu negocio necesita. Quita lo que no quieras.' },
  { title: 'Entra a tu panel', body: 'Empezamos a preparar tu ERP, tu WhatsApp y tu sitio web, cada uno con su estado a la vista.' },
]

const H2 = 'font-display text-2xl font-bold tracking-tight sm:text-3xl'
const LINK = 'font-semibold text-[var(--color-ink)] underline decoration-[var(--window-teal)] underline-offset-4 hover:decoration-2'

export default function ShortLanding() {
  // Signed up to the old waiting list: their spot is open now.
  const waitlisted = completedForm() === 'waitlist'

  return (
    <div className="min-h-screen scroll-smooth bg-white text-[var(--color-ink)] motion-reduce:scroll-auto">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/">
            <Logo />
          </a>
          <nav aria-label="Cuenta" className="flex items-center gap-2">
            <a href="/login.html" className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-canvas-soft)]">
              Iniciar sesión
            </a>
            <a href={CTA.href} className="rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1f2937]">
              {CTA.label}
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <section aria-labelledby="interes-title" className="pt-12 sm:pt-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            {waitlisted ? 'Estabas en la lista de espera' : 'Volviste'}
          </p>
          <h1 id="interes-title" className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Así que sí te interesa.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-ink-soft)]">
            {waitlisted
              ? 'Tu lugar ya está listo: cuéntanos de tu negocio y sube a bordo, gratis mientras dure la beta.'
              : 'Ya viste la historia completa, así que aquí va lo concreto: qué es AndRho, qué incluye, cómo empiezas y cuánto cuesta.'}
          </p>
          <p className="mt-4 rounded-xl border border-[var(--window-teal)]/40 bg-[var(--window-teal)]/8 px-4 py-3 text-sm leading-relaxed">
            <strong>¿Notaste el cambio?</strong> Este sitio te reconoció al volver y te muestra otra página. Con AndRho, tu sitio
            también puede hacerlo con tus clientes: hasta eso puedes controlar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={CTA.href} className="btn-solid">
              {CTA.label} →
            </a>
            <a href="/?vista=completa" className="btn-outline">
              Ver el sitio completo
            </a>
          </div>

          <nav aria-label="En esta página" className="mt-10 border-y border-[var(--color-border)] py-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={LINK}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <section id="que-es" aria-labelledby="que-es-title" className="scroll-mt-6 pt-12">
          <h2 id="que-es-title" className={H2}>
            Qué es AndRho
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
            Un centro de control para pymes: junta los datos de tu ERP y tu marketing, los analiza con modelos estadísticos y
            la inteligencia artificial te explica en lenguaje claro qué está pasando y qué conviene hacer. Nada se ejecuta sin
            tu aprobación.
          </p>
        </section>

        <section id="incluye" aria-labelledby="incluye-title" className="scroll-mt-6 pt-12">
          <h2 id="incluye-title" className={H2}>
            Qué incluye tu cuenta
          </h2>
          <ul className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            <li className="py-3">
              <strong>Panel con análisis e IA.</strong>{' '}
              <span className="text-[var(--color-ink-soft)]">Ventas, inventario, sitio y redes en un solo lugar, explicados.</span>
            </li>
            {SERVICES.map((s) => (
              <li key={s.id} className="py-3">
                <strong>{s.title}.</strong> <span className="text-[var(--color-ink-soft)]">{s.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="empezar" aria-labelledby="empezar-title" className="scroll-mt-6 pt-12">
          <h2 id="empezar-title" className={H2}>
            Cómo empiezas
          </h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-mono text-sm font-bold text-[var(--window-teal)]">0{i + 1}</span>
                <span>
                  <strong>{step.title}.</strong> <span className="text-[var(--color-ink-soft)]">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section id="precio" aria-labelledby="precio-title" className="scroll-mt-6 pt-12">
          <h2 id="precio-title" className={H2}>
            Precio
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
            Gratis mientras dure la beta, con cualquiera de los tres paquetes. Te avisamos antes de que algo tenga precio, y
            el descuento que ganes en el juego queda guardado en tu cuenta.
          </p>
        </section>

        <section id="preguntas" aria-labelledby="preguntas-title" className="scroll-mt-6 pt-12">
          <h2 id="preguntas-title" className={H2}>
            Preguntas
          </h2>
          <div className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden="true" className="font-mono text-[var(--window-teal)] group-open:hidden">
                    +
                  </span>
                  <span aria-hidden="true" className="hidden font-mono text-[var(--window-teal)] group-open:inline">
                    −
                  </span>
                </summary>
                <p className="mt-2 leading-relaxed text-[var(--color-ink-soft)]">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="cierre-title" className="mt-14 rounded-2xl bg-[var(--color-canvas-soft)] p-6 sm:p-8">
          <h2 id="cierre-title" className={H2}>
            ¿Listo?
          </h2>
          <p className="mt-2 text-[var(--color-ink-soft)]">
            Toma unos minutos.{' '}
            <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className={LINK}>
              ¿Otra duda? Escríbenos por WhatsApp
            </a>
            .
          </p>
          <a href={CTA.href} className="btn-solid mt-5 inline-flex">
            {CTA.label} →
          </a>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-sm text-[var(--color-ink-soft)] sm:px-6">
          <span>© AndRho</span>
          <a href="/?vista=completa" className="hover:text-[var(--color-ink)]">
            Sitio completo
          </a>
          <a href="/articulos/" className="hover:text-[var(--color-ink)]">
            Artículos
          </a>
          <a href={SITE.instagram} target="_blank" rel="noreferrer" className="hover:text-[var(--color-ink)]">
            Instagram {SITE.instagramHandle}
          </a>
        </div>
      </footer>
    </div>
  )
}
