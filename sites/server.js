// andrho-sites: every AndRho client website, one Railway service.
//
// A request's Host (web.<site_id>.andrho.com, a custom domain of this
// service) is resolved with andrho-api's GET /public/site?host=… (cached a
// minute). Then:
//   - status "construyendo": the built template (dist/) with the business'
//     data injected as window.__SITE__, its name in <title>, and AndRho's
//     tracker so visits count from day one;
//   - status "publicado": the Creator's deployment (live_url) is served
//     through this host by a reverse proxy, so the client's address never
//     changes. live_url must be https on an allowed host (SITES_LIVE_HOSTS,
//     default .up.railway.app), never an arbitrary URL.
//
// Env: ANDRHO_API_URL (required), TRACKER_SCRIPT_ORIGIN, SITES_LIVE_HOSTS, PORT.
import express from 'express'
import helmet from 'helmet'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(DIR, 'dist')
const API = (process.env.ANDRHO_API_URL || '').replace(/\/+$/, '')
const TRACKER = (process.env.TRACKER_SCRIPT_ORIGIN || 'https://webtracker-production-b8d7.up.railway.app').replace(/\/+$/, '')
const LIVE_HOSTS = (process.env.SITES_LIVE_HOSTS || '.up.railway.app').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
const TTL_MS = 60 * 1000

if (!API) {
  console.error('[sites] ANDRHO_API_URL is required')
  process.exit(1)
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// ---------------------------------------------------------------------------
// Site lookup
// ---------------------------------------------------------------------------
const cache = new Map() // host -> { at, site }

export async function lookup(host, fetchImpl = fetch) {
  const hit = cache.get(host)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.site
  let site = null
  try {
    const res = await fetchImpl(`${API}/public/site?host=${encodeURIComponent(host)}`, { signal: AbortSignal.timeout(8000) })
    if (res.ok) site = await res.json()
    else if (res.status !== 404) throw new Error(`andrho-api ${res.status}`)
  } catch (err) {
    if (hit) return hit.site // andrho-api blipped: keep serving the last answer
    throw err
  }
  cache.set(host, { at: Date.now(), site })
  return site
}

export function allowedLive(url) {
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    return u.protocol === 'https:' && !u.username && !u.password && LIVE_HOSTS.some((s) => (s.startsWith('.') ? h.endsWith(s) : h === s))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// "En construcción": the template with the business' data
// ---------------------------------------------------------------------------
let template = null
function indexHtml() {
  if (template === null) {
    const file = path.join(DIST, 'index.html')
    template = existsSync(file) ? readFileSync(file, 'utf8') : ''
  }
  return template
}

export function renderSite(html, site) {
  const data = {
    site_id: site.site_id, company: site.company, business_type: site.business_type, type_name: site.type_name,
    status: site.status, site: site.site, essence: site.essence, has_logo: site.has_logo
  }
  const title = `${site.company} · sitio en construcción`
  const description = (site.site && site.site.headline) || `El sitio de ${site.company} viene en camino.`
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:title" content="${esc(site.company)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    // Being built: keep it out of search results until the real site is up.
    '<meta name="robots" content="noindex" />',
    `<script>window.__SITE__=${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
  ].join('\n    ')
  const body = `<script src="${esc(TRACKER)}/tracker.js" data-site-id="${esc(site.site_id)}" defer></script>`
  return html.replace('<!--site:head-->', head).replace('<!--site:body-->', body)
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export function createApp({ fetchImpl = fetch } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)

  app.get('/_health', (req, res) => res.json({ ok: true }))

  // Resolve the business for every request.
  app.use(async (req, res, next) => {
    const host = (req.hostname || '').toLowerCase()
    try {
      req.site = await lookup(host, fetchImpl)
    } catch (err) {
      console.error('[sites] lookup', host, err.message)
      return res.status(503).type('text/plain').send('Este sitio no está disponible en este momento. Intenta de nuevo en un minuto.')
    }
    if (!req.site) return res.status(404).type('text/plain').send('Aquí todavía no hay un sitio.')
    next()
  })

  // Published: the Creator's deployment, through this host.
  app.use(async (req, res, next) => {
    const s = req.site
    if (s.status !== 'publicado' || !s.live_url) return next()
    if (!allowedLive(s.live_url)) {
      console.error('[sites] live_url not allowed for', s.site_id, s.live_url)
      return next() // safer to show "en construcción" than to proxy anywhere
    }
    try {
      const target = new URL(req.originalUrl, s.live_url)
      const headers = {}
      for (const h of ['accept', 'accept-language', 'content-type', 'user-agent', 'if-none-match', 'if-modified-since', 'cookie']) {
        if (req.headers[h]) headers[h] = req.headers[h]
      }
      headers['x-forwarded-host'] = req.hostname
      const hasBody = !['GET', 'HEAD'].includes(req.method)
      const up = await fetchImpl(target, {
        method: req.method, headers, redirect: 'manual', body: hasBody ? req : undefined, duplex: hasBody ? 'half' : undefined,
        signal: AbortSignal.timeout(20000)
      })
      res.status(up.status)
      up.headers.forEach((v, k) => {
        if (['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k)) return
        if (k === 'location') v = v.replace(new URL(s.live_url).origin, `https://${req.hostname}`)
        res.setHeader(k, v)
      })
      if (req.method === 'HEAD' || !up.body) return res.end()
      const buf = Buffer.from(await up.arrayBuffer())
      return res.end(buf)
    } catch (err) {
      console.error('[sites] proxy', s.site_id, err.message)
      return res.status(502).type('text/plain').send('El sitio no respondió. Intenta de nuevo en un momento.')
    }
  })

  // Being built: the template.
  app.get('/logo', async (req, res) => {
    if (!req.site.has_logo) return res.status(404).end()
    try {
      const up = await fetchImpl(`${API}/public/sites/${encodeURIComponent(req.site.site_id)}/logo`, { signal: AbortSignal.timeout(8000) })
      if (!up.ok) return res.status(404).end()
      res.setHeader('Content-Type', up.headers.get('content-type') || 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      return res.end(Buffer.from(await up.arrayBuffer()))
    } catch {
      return res.status(404).end()
    }
  })

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", TRACKER],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", TRACKER],
        // Real sites are https; only a local http preview must not upgrade.
        upgradeInsecureRequests: process.env.NODE_ENV === 'development' ? null : []
      }
    }
  }))
  app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '7d', immutable: true }))
  app.get('*', (req, res) => {
    const html = indexHtml()
    if (!html) return res.status(500).type('text/plain').send('Falta compilar la plantilla (npm run build).')
    res.setHeader('Cache-Control', 'no-cache')
    res.type('html').send(renderSite(html, req.site))
  })
  return app
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3000
  createApp().listen(port, () => console.log(`[sites] listening on ${port}`))
}
