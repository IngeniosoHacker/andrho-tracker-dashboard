import Logo from './Logo.jsx'
import { sections } from './site.js'

// "En construcción": the business' name, what its site will have (the
// structure for its type of business) and that a person is building it.
export default function Construyendo({ site }) {
  const title = `${site.company} · sitio en construcción`
  if (typeof document !== 'undefined') document.title = title
  return (
    <main className="min-h-screen bg-canvas-soft flex flex-col">
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, var(--color-brand), var(--color-brand-2), var(--color-violet))' }} />
      <section className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="flex items-center gap-4">
          <Logo site={site} size={64} />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{site.type_name || 'Próximamente'}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight break-words">{site.company}</h1>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-white border border-line p-6 sm:p-8 shadow-[0_18px_40px_-30px_rgba(11,16,32,0.35)]">
          <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Estamos construyendo este sitio
          </p>
          <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold leading-snug">
            {site.site && site.site.headline ? site.site.headline : 'Muy pronto, todo lo que necesitas saber de nosotros'}
          </h2>
          {site.essence ? <p className="mt-3 text-ink-soft leading-relaxed">{site.essence}</p> : null}

          <p className="mt-8 text-sm font-medium text-muted">Lo que vas a encontrar aquí</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.key} className="rounded-2xl border border-line p-4">
                <p className="font-medium">{s.title}</p>
                <div className="mt-3 space-y-2" aria-hidden="true">
                  <div className="skeleton h-2.5 rounded-full w-11/12" />
                  <div className="skeleton h-2.5 rounded-full w-8/12" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <footer className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-8 text-xs text-muted">
        Sitio hecho con <a className="underline underline-offset-2 hover:text-ink" href="https://andrho.com" rel="noopener">AndRho</a>
      </footer>
    </main>
  )
}
