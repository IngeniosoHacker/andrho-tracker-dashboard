import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { recordVisit } from './lib/visitor.js'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Footer from './components/sections/Footer.jsx'
import SurveyArt from './components/survey/SurveyArt.jsx'
import ArticleBody from './components/articles/ArticleBody.jsx'
import ArticleCard from './components/articles/ArticleCard.jsx'
import { findArticle, formatDate } from './lib/articles.js'
import { fetchRemoteArticle, useArticles } from './lib/remoteArticles.js'

// /articulos/<slug>.html — one article. A built one is picked by #root's
// data-slug; an uploaded one comes inlined by src/server.js (#article-data)
// or, failing that, from andrho-api by the slug in the URL.
function ArticlePage({ article }) {
  const others = useArticles().filter((a) => a.slug !== article.slug).slice(0, 2)
  return (
    <div className="min-h-screen">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="relative z-10 px-3 pb-20 pt-[124px] sm:px-6 md:pt-[100px]">
        <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[var(--window-bg)] text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]">
          <header className="grid items-center gap-6 bg-white/45 p-6 sm:p-10 md:grid-cols-[1.4fr_1fr] lg:p-14">
            <div>
              <nav aria-label="Ruta" className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
                <a href="/" className="hover:underline">
                  AndRho
                </a>{' '}
                ›{' '}
                <a href="/articulos/" className="hover:underline">
                  Artículos
                </a>
              </nav>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">{article.title}</h1>
              <p className="mt-5 text-sm text-[var(--color-muted)]">
                {article.author} · <time dateTime={article.date}>{formatDate(article.date)}</time> · {article.readingMinutes} min de lectura
              </p>
            </div>
            <SurveyArt scene="puzzle" className="mx-auto hidden max-h-72 w-full md:block" />
          </header>

          <div className="mx-auto max-w-[44rem] px-6 pb-14 pt-4 sm:px-10">
            <ArticleBody blocks={article.body} />

            <aside className="mt-14 rounded-2xl bg-[var(--color-ink)] p-6 text-white sm:p-8">
              <p className="font-display text-2xl font-bold">Que no te deje la nave.</p>
              <p className="mt-2 text-white/70">AndRho está en beta y es gratis mientras dure. Cuéntanos de tu negocio y sube a bordo.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href="/signup.html" className="inline-flex h-12 items-center justify-center rounded-[0.6rem] bg-white px-6 font-bold text-black hover:bg-white/85">
                  Continuar
                </a>
                <a href="/#progreso" className="inline-flex h-12 items-center justify-center rounded-[0.6rem] border border-white/40 px-6 font-bold hover:bg-white/10">
                  Ver el avance en vivo
                </a>
              </div>
            </aside>
          </div>
        </article>

        {others.length > 0 && (
          <ul className="mx-auto mt-6 grid max-w-5xl gap-5 md:grid-cols-2">
            {others.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="relative z-10 px-3 pb-20 pt-[124px] sm:px-6 md:pt-[100px]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-[var(--window-bg)] p-10 text-center text-[var(--color-ink)]">
          <h1 className="text-4xl font-extrabold tracking-tight">No encontramos este artículo</h1>
          <p className="mt-4 text-[var(--color-ink-soft)]">Puede que lo hayan movido o que todavía no esté publicado.</p>
          <a href="/articulos/" className="mt-6 inline-flex h-12 items-center rounded-[0.6rem] bg-[var(--color-ink)] px-6 font-bold text-white">
            Ver todos los artículos
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function inlinedArticle() {
  const el = document.getElementById('article-data')
  if (!el) return null
  try {
    return JSON.parse(el.textContent)
  } catch {
    return null
  }
}

function slugFromUrl() {
  return window.location.pathname.match(/\/articulos\/([^/]+?)(?:\.html)?$/)?.[1] || ''
}

// Uploaded article not inlined by the server (e.g. the static host in
// production): fetch it, keeping the crawler copy until it arrives.
function RemoteArticle({ slug }) {
  const [state, setState] = useState({ loading: true, article: null })
  useEffect(() => {
    fetchRemoteArticle(slug).then((article) => setState({ loading: false, article }))
  }, [slug])
  if (state.loading) return null
  if (!state.article) return <NotFound />
  document.title = `${state.article.title} | AndRho`
  return <ArticlePage article={state.article} />
}

const root = document.getElementById('root')
const slug = root.dataset.slug || slugFromUrl()
const article = findArticle(root.dataset.slug) || inlinedArticle()
recordVisit()

createRoot(root).render(
  <StrictMode>{article ? <ArticlePage article={article} /> : <RemoteArticle slug={slug} />}</StrictMode>,
)
