import Logo from './Logo.jsx'
import { sections } from './site.js'
import Section from './sections/Section.jsx'

// The template's home: header, hero with the type's call to action, and one
// block per section of the business' type (servicios: servicios, zona,
// proceso…; restaurantes: menú, horario, pedidos…; ventas: catálogo,
// envíos, pagos…). Creators replace each block's placeholder with the real
// content; src/sections/ is where each one grows its own component.
export default function Inicio({ site }) {
  const cta = (site.site && site.site.cta) || 'Contáctanos'
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-line">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#inicio" className="flex items-center gap-3 min-w-0">
            <Logo site={site} size={36} />
            <span className="font-display font-bold truncate">{site.company}</span>
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm text-ink-soft">
            {sections.slice(0, 4).map((s) => <a key={s.key} href={`#${s.key}`} className="hover:text-ink">{s.title}</a>)}
          </div>
          <a href="#contacto" className="shrink-0 rounded-full bg-ink text-white text-sm font-medium px-4 py-2 hover:opacity-90">{cta}</a>
        </nav>
      </header>

      <section id="inicio" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{site.type_name}</p>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl font-bold leading-[1.05] max-w-3xl">
          {(site.site && site.site.headline) || site.company}
        </h1>
        {site.essence ? <p className="mt-5 text-lg text-ink-soft max-w-2xl">{site.essence}</p> : null}
        <a href="#contacto" className="mt-8 inline-block rounded-full px-6 py-3 font-medium text-ink"
          style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-2))' }}>{cta}</a>
      </section>

      {sections.map((s, i) => <Section key={s.key} section={s} alt={i % 2 === 0} />)}

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-muted flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} {site.company}</span>
          <span>Hecho con <a href="https://andrho.com" className="underline underline-offset-2">AndRho</a></span>
        </div>
      </footer>
    </div>
  )
}
