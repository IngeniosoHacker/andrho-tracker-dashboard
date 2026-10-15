import { useEffect, useState } from 'react'
import { apiGet } from '../../lib/authApi.js'

// "Avance en vivo": AndRho is still in development and says so. This shows
// the real commits of our three repositories, merged into one timeline by
// andrho-api's GET /progress (cached there, so visitors never hit GitHub's
// rate limit). If the API can't be reached it falls back to plain links to
// the repos instead of hiding — the point is that anyone can check.
const REPOS = {
  andrho: { label: 'Sitio', body: 'El sitio que estás viendo.', color: '#00e6b8' },
  'andrho-tracker-dashboard': { label: 'Plataforma', body: 'El panel de AndRho y su analítica.', color: '#38d9ff' },
  'andrho-api': { label: 'Backend', body: 'Cuentas, registro, recomendaciones y servicios.', color: '#c084fc' },
}
const GITHUB = 'https://github.com/IngeniosoHacker'

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
function ago(date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    // 0.98: 59 min 50 s reads "hace 1 hora", not "hace 60 minutos".
    if (Math.abs(seconds) >= size * 0.98) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'hace un momento'
}

const monthYear = (date) => new Date(date).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-4xl font-bold sm:text-5xl">{value}</p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">{label}</p>
    </div>
  )
}

// `cta` = false hides "Continuar" (the welcome back: they're already on board).
export default function Progreso({ cta = true }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let cancelled = false
    apiGet('/progress')
      .then((d) => {
        if (cancelled) return
        setData(d)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="progreso" aria-labelledby="progreso-title" className="relative z-10 bg-black px-6 py-24 text-white lg:px-10 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-white/50">
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[var(--mint)]" />
          Beta abierta · código público
        </p>
        <h2 id="progreso-title" className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
          No confíes en la palabra, confía en el commit.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
          AndRho está en beta, y no lo escondemos. Lo construimos a la vista: estos son los commits de nuestros tres
          repositorios, en vivo. Ya puedes subir a bordo, gratis mientras dure la beta.
        </p>

        {status === 'loading' && <div className="mt-12 h-72 animate-pulse rounded-3xl bg-white/5" />}

        {status === 'error' && (
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {Object.entries(REPOS).map(([name, repo]) => (
              <li key={name}>
                <a href={`${GITHUB}/${name}`} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 p-5 transition-colors hover:border-white/30">
                  <p className="font-mono text-xs uppercase tracking-widest" style={{ color: repo.color }}>
                    {repo.label}
                  </p>
                  <p className="mt-2 font-semibold">{name}</p>
                  <p className="mt-1 text-sm text-white/55">{repo.body}</p>
                </a>
              </li>
            ))}
          </ul>
        )}

        {status === 'ready' && data && (
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="grid grid-cols-2 gap-6">
                <Stat value={data.totalCommits} label="Commits totales" />
                <Stat value={data.commitsPerWeek.toLocaleString('es-GT')} label="Commits por semana" />
              </div>
              <p className="mt-6 text-sm text-white/50">Desde {monthYear(data.since)}, en {data.repos.length} repositorios.</p>

              <ul className="mt-8 space-y-3">
                {data.repos.map((r) => {
                  const repo = REPOS[r.name] ?? { label: 'Repo', body: r.description, color: '#ffffff' }
                  return (
                    <li key={r.name}>
                      <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3.5 transition-colors hover:border-white/30">
                        <span>
                          <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: repo.color }}>
                            {repo.label}
                          </span>
                          <span className="block font-semibold">{r.name}</span>
                          <span className="block text-sm text-white/50">{repo.body}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-display text-2xl font-bold">{r.commits}</span>
                          <span className="block text-xs text-white/45">{ago(r.lastCommitAt)}</span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>

              {data.contributors.length > 0 && (
                <div className="mt-8">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Quienes lo construyen</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.contributors.map((c) => (
                      <a key={c.login} href={c.url} target="_blank" rel="noreferrer" title={`@${c.login} · ${c.commits} commits`}>
                        <img src={c.avatarUrl} alt={`@${c.login}`} loading="lazy" className="h-11 w-11 rounded-full border border-white/15" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Últimos commits, de los tres repos</p>
              <ol className="mt-4 border-l border-white/15">
                {data.recent.map((c) => {
                  const repo = REPOS[c.repo] ?? { label: c.repo, color: '#ffffff' }
                  return (
                    <li key={`${c.repo}-${c.sha}`} className="relative pb-5 pl-6 last:pb-0">
                      <span aria-hidden="true" className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rounded-full" style={{ backgroundColor: repo.color }} />
                      <a href={c.url} target="_blank" rel="noreferrer" className="group block">
                        <span className="font-medium leading-snug group-hover:underline">{c.subject}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-white/45">
                          <span className="font-mono uppercase tracking-wider" style={{ color: repo.color }}>
                            {repo.label}
                          </span>
                          <span>·</span>
                          <span>@{c.author}</span>
                          <span>·</span>
                          <time dateTime={c.date}>{ago(c.date)}</time>
                          <span className="font-mono">{c.sha}</span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          {cta && (
            <a href="/signup.html" className="inline-flex h-12 items-center justify-center rounded-[0.6rem] bg-white px-6 font-bold text-black transition-colors hover:bg-white/85">
              Continuar
            </a>
          )}
          <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-[0.6rem] border border-white/40 px-6 font-bold transition-colors hover:bg-white/10">
            Ver en GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
