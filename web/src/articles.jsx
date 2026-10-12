import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SiteHeader from './components/landing/SiteHeader.jsx'
import PixelStarfield from './components/ui/PixelStarfield.jsx'
import Footer from './components/sections/Footer.jsx'
import ArticleCard from './components/articles/ArticleCard.jsx'
import { useArticles } from './lib/remoteArticles.js'

// /articulos/ — every article, newest first.
function ArticlesPage() {
  const articles = useArticles()
  return (
    <div className="min-h-screen">
      <PixelStarfield mix={1} />
      <SiteHeader base="/" />
      <main className="relative z-10 px-3 pb-20 pt-[124px] sm:px-6 md:pt-[100px]">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/15 bg-[var(--window-bg)] p-6 text-[var(--color-ink)] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] sm:p-10 lg:p-14">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Artículos</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            Lee mientras <span className="text-[var(--window-teal)]">despegamos</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-snug">
            Datos, software libre, ERP y marketing para pymes en Guatemala, desde lo que aprendemos construyendo AndRho.
          </p>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {articles.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ArticlesPage />
  </StrictMode>,
)
