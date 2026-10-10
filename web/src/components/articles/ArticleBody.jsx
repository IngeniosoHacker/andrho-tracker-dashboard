import { inline } from '../../lib/articles.js'

// Renders an article's blocks (lib/articles.js) with the site's reading type.
function Inline({ text }) {
  return inline(text).map((t, i) =>
    t.bold ? (
      <strong key={i} className="font-semibold text-[var(--color-ink)]">
        {t.bold}
      </strong>
    ) : t.link ? (
      <a key={i} href={t.href} className="font-semibold text-[var(--window-teal)] underline underline-offset-4 hover:text-[var(--color-ink)]">
        {t.link}
      </a>
    ) : (
      <span key={i}>{t.text}</span>
    ),
  )
}

function Block({ b }) {
  if (b.p) return <p className="mt-5 text-lg leading-relaxed text-[var(--color-ink-soft)]"><Inline text={b.p} /></p>
  if (b.h2) return <h2 className="mt-14 font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">{b.h2}</h2>
  if (b.h3) return <h3 className="mt-9 text-xl font-extrabold tracking-tight text-[var(--color-ink)]">{b.h3}</h3>
  if (b.quote)
    return (
      <blockquote className="mt-6 border-l-4 border-[var(--window-teal)] pl-5 text-xl font-semibold leading-snug">
        <Inline text={b.quote} />
      </blockquote>
    )
  if (b.ul || b.ol) {
    const List = b.ul ? 'ul' : 'ol'
    return (
      <List className={`mt-5 space-y-3 pl-6 text-lg leading-relaxed text-[var(--color-ink-soft)] ${b.ul ? 'list-disc' : 'list-decimal'} marker:text-[var(--window-teal)]`}>
        {(b.ul ?? b.ol).map((item) => (
          <li key={item} className="pl-1">
            <Inline text={item} />
          </li>
        ))}
      </List>
    )
  }
  if (b.table)
    return (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--window-line)] bg-white">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="bg-[var(--color-canvas-soft)] font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">
            <tr>
              {b.table.head.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.table.rows.map((row) => (
              <tr key={row[0]} className="border-t border-[var(--window-line)]">
                {row.map((cell, i) => (
                  <td key={i} className={`px-4 py-3 ${i === 0 ? 'font-semibold text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'}`}>
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  return null
}

export default function ArticleBody({ blocks }) {
  return blocks.map((b, i) => <Block key={i} b={b} />)
}
