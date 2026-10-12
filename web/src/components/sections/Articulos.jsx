import ArticleCard from '../articles/ArticleCard.jsx'
import { useArticles } from '../../lib/remoteArticles.js'

// The landing's informative section: the latest articles, built and uploaded.
export default function Articulos() {
  const articles = useArticles()
  return (
    <section id="articulos" aria-labelledby="articulos-title" className="relative z-10 border-t border-white/10 bg-black px-6 py-24 text-white lg:px-10 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/50">Artículos</p>
            <h2 id="articulos-title" className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
              Lee mientras despegamos.
            </h2>
          </div>
          <a href="/articulos/" className="text-sm font-semibold text-[var(--mint)] hover:underline">
            Ver todos los artículos →
          </a>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {articles.slice(0, 4).map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} dark />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
