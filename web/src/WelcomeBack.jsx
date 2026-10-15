import { useEffect, useState } from 'react'
import SiteHeader from './components/landing/SiteHeader.jsx'
import WindowFrame from './components/landing/WindowFrame.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import SurveyArt from './components/survey/SurveyArt.jsx'
import { SpinnerIcon } from './components/ui/icons.jsx'
import Progreso from './components/sections/Progreso.jsx'
import Articulos from './components/sections/Articulos.jsx'
import Footer from './components/sections/Footer.jsx'
import { apiGetAuth } from './lib/authApi.js'
import { JOB_LABELS, JOB_STATUS } from './lib/signup.js'

// The landing for someone who already filled the register form (lib/
// visitor.js → 'registrado'). No pitch: straight to their panel, how their
// services are coming along (when this browser still has their session) and
// what's new in AndRho.
export default function WelcomeBack() {
  // undefined = loading, null = no session here (log in), object = theirs.
  const [me, setMe] = useState(undefined)
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    let alive = true
    apiGetAuth('/auth/me').then(async (m) => {
      if (!alive) return
      setMe(m)
      if (!m) return
      const p = await apiGetAuth('/account/provisioning')
      if (alive && p) setJobs(p.jobs ?? [])
    })
    return () => {
      alive = false
    }
  }, [])

  const first = (me?.display_name || '').trim().split(/\s+/)[0]

  return (
    <div className="antialiased">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="relative z-10">
        <div className="px-3 pb-16 pt-[124px] sm:px-6 md:pt-[104px]">
          <WindowFrame className="mx-auto">
            <section aria-labelledby="bienvenida-title" className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12 lg:p-14">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
                  {me?.company_name ? `A bordo · ${me.company_name}` : 'Ya estás a bordo'}
                </p>
                <h1 id="bienvenida-title" className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                  Bienvenido de vuelta{first ? ', ' : ''}
                  <span className="text-[var(--window-teal)]">{first}</span>.
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-snug sm:text-xl">
                  {me
                    ? 'Tu panel te espera. Esto es lo que AndRho está preparando para ti:'
                    : 'Inicia sesión para ver tu panel y cómo va lo que estamos preparando para tu negocio.'}
                </p>

                {me === undefined && <SpinnerIcon className="mt-6 h-5 w-5 animate-spin text-[var(--color-ink-soft)]" />}
                {me && jobs.length > 0 && (
                  <ul className="mt-6 grid max-w-xl gap-2">
                    {jobs.map((j) => (
                      <li key={j.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm">
                        <span>
                          <span className="block font-semibold">{JOB_LABELS[j.kind] ?? j.kind}</span>
                          <span className="text-[var(--color-muted)]">{j.detail}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs uppercase tracking-wider">{JOB_STATUS[j.status] ?? j.status}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                  {me ? (
                    <a href="/dashboard/" className="btn-solid sm:flex-1">
                      Ir a mi panel
                    </a>
                  ) : (
                    <a href="/login.html" className="btn-solid sm:flex-1">
                      Iniciar sesión
                    </a>
                  )}
                  <a href="/?vista=completa" className="btn-outline sm:flex-1">
                    Ver el sitio completo
                  </a>
                </div>
              </div>
              <SurveyArt scene="aboard" className="mx-auto max-h-[26svh] w-auto md:max-h-[56svh] md:w-full" />
            </section>
          </WindowFrame>
        </div>
        <Progreso cta={false} />
        <Articulos />
      </main>
      <Footer />
    </div>
  )
}
