import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { recordVisit } from './lib/visitor.js'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Footer from './components/sections/Footer.jsx'
import LiveDemo from './components/landing/LiveDemo.jsx'
import { money, usePricing } from './lib/pricing.js'

// /vende-en-vivo/: the page for campaign and keyword traffic about selling
// through Facebook lives (founder/marketing.md §1). One message (what AndRho
// does in a live), one goal (signing up). Nothing here is promised that the
// product doesn't do; what waits on Meta's approval says so.

const STEPS = [
  { n: '1', title: 'Sube tu mercancía', body: 'Con foto, precio y cuántas tienes, en tu inventario de AndRho.' },
  { n: '2', title: 'Organiza la venta', body: 'Eliges qué vas a vender y AndRho propone el orden y un nombre corto para cada artículo: “blusa roja 2”.' },
  { n: '3', title: 'Haz tu live', body: 'Quien comenta primero el nombre se lo aparta. AndRho le escribe por Messenger: “¿Confirmas la compra de blusa roja 2 por Q85?” con un botón Sí y uno No.' },
  { n: '4', title: 'Imprime tus envíos', body: 'Cuando confirma, AndRho le pide teléfono y dirección y arma su tarjeta de envío: 4 por hoja, con tu logo y “¡Gracias por tu compra, Ana!”.' },
]

const NO_MORE = [
  'Anotar en un cuaderno quién comentó primero.',
  'Pasar la noche escribiéndole a cada comprador.',
  'Perder ventas por apartados que nunca confirman: si no confirma, el artículo pasa a quien comentó después.',
  'Volver a subir uno por uno lo que no se vendió.',
]

const FAQ = [
  ['¿Necesito factura o estar inscrito?', 'No. Puedes vender en vivo con AndRho sin facturar. Si un día te formalizas, la factura electrónica FEL ya viene en tu plan.'],
  ['¿Mis compradores tienen que instalar algo?', 'No. Comentan en tu live como siempre y confirman con un botón en Messenger, el que ya usan.'],
  ['¿Funciona con mi perfil personal o en grupos?', 'No: Facebook solo deja conectar Páginas. Si hoy vendes desde tu perfil, te ayudamos a crear tu Página y a pasar a tus seguidores.'],
  ['¿Qué pasa si alguien aparta y no confirma?', 'Tiene unos minutos para tocar “Sí”. Si dice que no o no responde, AndRho le pregunta a la siguiente persona que comentó el mismo artículo.'],
  ['¿Y lo que no se vendió?', 'Al terminar, AndRho te pregunta si lo publica: una publicación por artículo, con foto y precio. Quien comente “Mío” primero se lo lleva, y la publicación se quita al confirmar.'],
  ['¿Funciona con Instagram o TikTok?', 'Empezamos con Facebook. Instagram viene después. TikTok no deja que otras apps lean los comentarios de un live, así que por ahora no.'],
  ['¿Desde cuándo funciona la conexión con Facebook?', 'Desde que Meta apruebe a AndRho. Mientras, ya puedes subir tu mercancía, organizar tus lives y usar tus tarjetas de envío.'],
]

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-[var(--window-teal)]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

function Page() {
  const { plans } = usePricing()
  const plan = plans.find((p) => p.capabilities?.live_sale) ?? plans[1]
  return (
    <div className="min-h-screen">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="relative z-10 px-3 pb-20 pt-[124px] sm:px-6 md:pt-[100px]">
        <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]">
          <header className="grid items-center gap-8 bg-white/45 p-6 sm:p-10 md:grid-cols-[1.25fr_1fr] lg:p-14">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">Venta en vivo por Facebook</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Haz tu live. AndRho aparta, confirma y arma tus envíos.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[var(--color-ink-soft)]">
                El primer comentario se lleva el artículo, el comprador confirma con un botón en Messenger y tú terminas el live con tus pedidos listos.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="/signup.html" className="inline-flex h-12 items-center justify-center rounded-[0.6rem] bg-[var(--color-ink)] px-6 font-bold text-white hover:opacity-90">
                  Aparta tu lugar
                </a>
                <a href="#como" className="inline-flex h-12 items-center justify-center rounded-[0.6rem] border border-[var(--color-ink)]/30 px-6 font-bold hover:bg-black/5">
                  Cómo funciona
                </a>
              </div>
            </div>
            <LiveDemo />
          </header>

          <section id="como" className="px-6 py-12 sm:px-10 lg:px-14">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Cómo funciona</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-2xl border border-[var(--window-line)] bg-white/50 p-5">
                  <span className="font-mono text-sm font-bold text-[var(--window-teal)]">{s.n}</span>
                  <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 leading-relaxed text-[var(--color-ink-soft)]">{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-2xl bg-black/[0.04] p-4 text-[var(--color-ink-soft)]">
              <strong className="text-[var(--color-ink)]">Lo que no se vendió se sigue vendiendo:</strong> AndRho lo publica en tu Página con foto y precio, y quien comente “Mío” primero se lo lleva.
            </p>
          </section>

          <div className="grid gap-10 border-t border-[var(--window-line)] px-6 py-12 sm:px-10 md:grid-cols-2 lg:px-14">
            <section>
              <h2 className="font-display text-2xl font-bold tracking-tight">Lo que ya no vas a hacer</h2>
              <ul className="mt-5 space-y-3 text-[var(--color-ink-soft)]">
                {NO_MORE.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--violet)]" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-display text-2xl font-bold tracking-tight">Y además</h2>
              <ul className="mt-5 space-y-3">
                {[
                  'Premia a tus clientes frecuentes con un descuento automático, si quieres.',
                  'Mira cuánto vendiste en cada live, qué se vende primero y a qué hora te va mejor.',
                  'Tu inventario se aparta solo: no vendes dos veces la misma prenda.',
                  'Busca cualquier cosa escribiendo: “productos”, “tarjetas”, “en vivo”.',
                ].map((m) => (
                  <li key={m} className="flex gap-3 font-medium">
                    <Check />
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {plan && (
            <section className="border-t border-[var(--window-line)] px-6 py-12 sm:px-10 lg:px-14">
              <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">Plan {plan.name}</p>
                  <p className="mt-2 text-5xl font-extrabold tracking-tight">
                    {money(plan.price)}
                    <span className="text-lg font-semibold text-[var(--color-ink-soft)]"> /mes</span>
                  </p>
                  <p className="mt-2 text-[var(--color-ink-soft)]">Sin comisión por venta.</p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex gap-2 text-sm">
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 rounded-2xl border border-[var(--window-teal)] p-5">
                <h3 className="font-bold">Lo que necesitas</h3>
                <ul className="mt-2 space-y-1 text-[var(--color-ink-soft)]">
                  <li>• Una Página de Facebook (no un perfil personal ni un grupo). Si no tienes, te ayudamos a crearla.</li>
                  <li>• Tu celular para hacer el live.</li>
                  <li>• Fotos de tu mercancía.</li>
                </ul>
              </div>
            </section>
          )}

          <section className="border-t border-[var(--window-line)] px-6 py-12 sm:px-10 lg:px-14">
            <h2 className="font-display text-2xl font-bold tracking-tight">Preguntas frecuentes</h2>
            <div className="mt-5 divide-y divide-[var(--window-line)]">
              {FAQ.map(([q, a]) => (
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
              <p className="font-display text-2xl font-bold">Tu próximo live, con los pedidos listos al terminar.</p>
              <p className="mt-2 text-white/70">Cuéntanos de tu negocio en dos minutos y preparamos tu cuenta.</p>
              <a href="/signup.html" className="mt-5 inline-flex h-12 items-center justify-center rounded-[0.6rem] bg-white px-6 font-bold text-black hover:bg-white/85">
                Aparta tu lugar
              </a>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}

recordVisit()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
