// Markdown <-> article blocks (the block model of lib/articles.js).
//
// Articles uploaded from the dashboard are Markdown; the site renders blocks.
// This file has no dependencies and no browser/Node-only APIs, so the same
// code runs in the site (React pages), in the Express server (server-side
// rendering of uploaded articles) and in the dashboard's editor preview,
// which src/server.js serves it to as /dashboard/js/markdown.js.
//
// Supported: ## / ### headings (a leading "# Title" is the title, not a
// block), paragraphs, - / * / 1. lists, > quotes, | tables |, and the inline
// **bold** and [link](url). A YAML-ish front matter block (--- key: value ---)
// carries the article's fields when a .md file is uploaded.

const LIST_UL = /^\s*[-*+]\s+(.*)$/
const LIST_OL = /^\s*\d+[.)]\s+(.*)$/
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

const cells = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())

// Markdown body -> { title, blocks }. `title` is the first "# heading", if any.
export function markdownToBlocks(md) {
  const lines = String(md || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let title = ''
  let para = []
  const flush = () => {
    if (para.length) blocks.push({ p: para.join(' ') })
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()
    if (!t) {
      flush()
      continue
    }
    let m
    if ((m = t.match(/^(#{1,6})\s+(.*?)\s*#*$/))) {
      flush()
      const level = m[1].length
      if (level === 1 && !title && blocks.length === 0) title = m[2]
      else blocks.push(level <= 2 ? { h2: m[2] } : { h3: m[2] })
      continue
    }
    if (t.startsWith('>')) {
      flush()
      const quote = []
      while (i < lines.length && lines[i].trim().startsWith('>')) quote.push(lines[i++].trim().replace(/^>\s?/, ''))
      i--
      blocks.push({ quote: quote.join(' ') })
      continue
    }
    if (LIST_UL.test(line) || LIST_OL.test(line)) {
      flush()
      const ordered = !LIST_UL.test(line)
      const re = ordered ? LIST_OL : LIST_UL
      const items = []
      while (i < lines.length) {
        const l = lines[i]
        if ((m = l.match(re))) items.push(m[1].trim())
        else if (l.trim() && /^\s{2,}/.test(l) && items.length) items[items.length - 1] += ' ' + l.trim()
        else break
        i++
      }
      i--
      blocks.push(ordered ? { ol: items } : { ul: items })
      continue
    }
    if (t.startsWith('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      flush()
      const head = cells(t)
      const rows = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]))
      i--
      blocks.push({ table: { head, rows } })
      continue
    }
    para.push(t)
  }
  flush()
  return { title, blocks }
}

// Blocks -> Markdown (to move a block article into the Markdown editor).
export function blocksToMarkdown(blocks, title) {
  const out = []
  if (title) out.push(`# ${title}`)
  for (const b of blocks) {
    if (b.p) out.push(b.p)
    else if (b.h2) out.push(`## ${b.h2}`)
    else if (b.h3) out.push(`### ${b.h3}`)
    else if (b.quote) out.push(`> ${b.quote}`)
    else if (b.ul) out.push(b.ul.map((i) => `- ${i}`).join('\n'))
    else if (b.ol) out.push(b.ol.map((i, n) => `${n + 1}. ${i}`).join('\n'))
    else if (b.table)
      out.push(
        [`| ${b.table.head.join(' | ')} |`, `| ${b.table.head.map(() => '---').join(' | ')} |`, ...b.table.rows.map((r) => `| ${r.join(' | ')} |`)].join('\n'),
      )
  }
  return out.join('\n\n') + '\n'
}

// "---\ntitle: X\nkeywords: a, b\n---\nbody" -> { meta: { title, keywords: [...] }, body }.
// List fields (keywords, tags) accept "a, b" or "[a, b]".
const LIST_FIELDS = ['keywords', 'tags']
export function parseFrontMatter(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n')
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { meta: {}, body: src }
  const meta = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^\s*([A-Za-z_]+)\s*:\s*(.*)$/)
    if (!kv) continue
    const key = kv[1].toLowerCase()
    let value = kv[2].trim().replace(/^["']|["']$/g, '')
    if (LIST_FIELDS.includes(key)) {
      value = value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    }
    meta[key] = value
  }
  return { meta, body: src.slice(m[0].length) }
}

// Reading time at ~200 words per minute, at least 1.
export const readingMinutes = (words) => Math.max(1, Math.round((words || 0) / 200))
