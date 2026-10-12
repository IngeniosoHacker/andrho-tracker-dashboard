// Uploads the Markdown articles in content/articulos/ to andrho-api, the same
// way the dashboard's Web > Artículos "Cargar .md" does: front matter for the
// fields, the rest as the body. Creates new slugs and updates existing ones.
//
//   ANDRHO_API_URL=https://... ANDRHO_EMAIL=... ANDRHO_PASSWORD=... \
//     node scripts/upload-articles.mjs [file.md ...]
//
// The account must own the site the articles are for (site_id "andrho" for
// andrho.com) and have the editor role or above.
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontMatter, markdownToBlocks } from '../web/src/lib/markdown.js'

const API = (process.env.ANDRHO_API_URL || '').replace(/\/+$/, '')
const { ANDRHO_EMAIL: email, ANDRHO_PASSWORD: password } = process.env
if (!API || !email || !password) {
  console.error('Set ANDRHO_API_URL, ANDRHO_EMAIL and ANDRHO_PASSWORD.')
  process.exit(1)
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content', 'articulos')
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : (await readdir(dir)).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f))

async function api(p, opts = {}) {
  const res = await fetch(`${API}${p}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${p}: ${res.status} ${(data && data.error) || ''}`)
  return data
}

const { access_token: token } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
const existing = new Map((await api('/articles', { token })).articles.map((a) => [a.slug, a]))

for (const file of files) {
  const { meta, body } = parseFrontMatter(await readFile(file, 'utf8'))
  const { title } = markdownToBlocks(body)
  const article = {
    title: meta.title || title,
    slug: meta.slug || path.basename(file, '.md'),
    description: meta.description || '',
    keywords: meta.keywords || [],
    tags: meta.tags || [],
    author: meta.author || '',
    path: meta.path || '',
    status: meta.status === 'publicado' ? 'publicado' : 'borrador',
    body: title ? body.replace(/^\s*#\s+.*\n+/, '') : body,
  }
  const found = existing.get(article.slug)
  const saved = found
    ? await api(`/articles/${found.id}`, { method: 'PUT', token, body: JSON.stringify(article) })
    : await api('/articles', { method: 'POST', token, body: JSON.stringify(article) })
  console.log(`${found ? 'updated' : 'created'}  ${saved.article.status.padEnd(9)} ${saved.article.slug}`)
}
