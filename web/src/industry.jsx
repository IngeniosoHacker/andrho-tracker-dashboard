import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { recordVisit } from './lib/visitor.js'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Footer from './components/sections/Footer.jsx'
import SurveyArt from './components/survey/SurveyArt.jsx'
import { INDUSTRIES, findIndustry, industryUrl } from './lib/industries.js'

// /software-para/<slug>.html — AndRho for one kind of business, picked by
// #root's data-slug (lib/industries.js).
function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-[var(--window-teal)]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

function IndustryPage({ i }) {
  return (
    <div className="min-h-screen">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="relative z-10 px-3 pb-20 pt-[124px] sm:px-6 md:pt-[100px]">
        <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]">
          <header className="grid items-center gap-6 bg-white/45 p-6 sm:p-10 md:grid-cols-[1.4fr_1fr] lg:p-14">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">AndRho para {i.name}</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">{i.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-[var(--color-ink-soft)]">{i.answer}</p>
              <a href="/signup.html" className="mt-7 inline-flex h-12 items-center rounded-[0.6rem] bg-[var(--color-ink)] px-6 font-bold text-white hover:opacity-90">
                Continuar
              </a>
            </div>
            <SurveyArt scene="puzzle" className="mx-auto hidden max-h-72 w-full md:block" />
          </header>

          <div className="grid gap-10 px-6 py-12 sm:px-10 md:grid-cols-2 lg:px-14">
            <section>
              <h2 className="font-display text-2xl font-bold tracking-tight">Lo que frena a {i.name}</h2>
              <ul className="mt-5 space-y-3 text-[var(--color-ink-soft)]">
                {i.pains.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--violet)]" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold tracking-tight">Lo que AndRho hace por ti</h2>
              <ul className="mt-5 space-y-3">
                {i.modules.map((m) => (
                  <li key={m} className="flex gap-3 font-medium">
                    <Check />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="border-t border-[var(--window-line)] px-6 py-12 sm:px-10 lg:px-14">
            <h2 className="font-display text-2xl font-bold tracking-tight">Preguntas frecuentes</h2>
            <div className="mt-5 divide-y divide-[var(--window-line)]">
              {i.faq.map(([q, a]) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold [&::-webkit-details-marker]:hidden">
                    <h3>{q}</h3>
                    <span aria-hidden="true" className="font-mono text-[var(--window-teal)] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-[var(--color-ink-soft)]">{a}</p>
                </details>
              ))}
            </div>
            <div className="mt-10 rounded-2xl bg-[var(--color-ink)] p-6 text-white sm:p-8">
              <p className="font-display text-2xl font-bold">Los que se suben primero, despegan primero.</p>
              <p className="mt-2 text-white/70">AndRho está en beta y es gratis mientras dure. Cuéntanos de tu negocio y adaptamos la nave a él.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href="/signup.html" className="inline-flex h-12 items-center justify-center rounded-[0.6rem] bg-white px-6 font-bold text-black hover:bg-white/85">Continuar</a>
                <a href={`/articulos/${i.article}.html`} className="inline-flex h-12 items-center justify-center rounded-[0.6rem] border border-white/40 px-6 font-bold hover:bg-white/10">Leer más</a>
              </div>
            </div>
          </section>
        </article>

        <nav aria-label="Otros giros" className="mx-auto mt-6 flex max-w-5xl flex-wrap gap-2">
          {INDUSTRIES.filter((x) => x.slug !== i.slug).map((x) => (
            <a key={x.slug} href={industryUrl(x)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:border-white/50 hover:text-white">
              Software para {x.name}
            </a>
          ))}
        </nav>
      </main>
      <Footer />
    </div>
  )
}

const root = document.getElementById('root')
const industry = findIndustry(root.dataset.slug)
if (industry) {
  recordVisit()

createRoot(root).render(
    <StrictMode>
      <IndustryPage i={industry} />
    </StrictMode>,
  )
}
