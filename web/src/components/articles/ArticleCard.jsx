import { articleUrl, formatDate } from '../../lib/articles.js'

// One article in a list: the landing's "Artículos" section and /articulos/.
// `dark` = on the black landing background.
export default function ArticleCard({ article, dark = false }) {
  return (
    <a
      href={articleUrl(article)}
      className={`group flex h-full flex-col rounded-3xl border p-6 transition-colors sm:p-8 ${
        dark ? 'border-white/12 bg-white/[0.04] hover:border-white/35' : 'border-[var(--window-line)] bg-white/80 hover:border-[var(--color-ink-soft)]'
      }`}
    >
      <p className={`font-mono text-xs uppercase tracking-[0.2em] ${dark ? 'text-white/45' : 'text-[var(--color-muted)]'}`}>
        {article.tags[0]} · {article.readingMinutes} min
      </p>
      <h3 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{article.title}</h3>
      <p className={`mt-3 flex-1 leading-relaxed ${dark ? 'text-white/60' : 'text-[var(--color-ink-soft)]'}`}>{article.description}</p>
      <p className={`mt-6 text-sm font-semibold ${dark ? 'text-[var(--mint)]' : 'text-[var(--window-teal)]'}`}>
        Leer artículo <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        <span className={`ml-3 font-normal ${dark ? 'text-white/40' : 'text-[var(--color-muted)]'}`}>{formatDate(article.date)}</span>
      </p>
    </a>
  )
}
