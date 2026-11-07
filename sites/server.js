// AndRho client websites on Railway, one codebase in two modes (SITE_MODE):
//
// router (sites-router, Clients project, owns *.web.andrho.com)
//   Reads the Host (<subdomain>.web.andrho.com, or a client's own domain),
//   resolves it with andrho-api's GET /public/site?host=… (cached a minute)
//   and forwards the request over Railway's private network to the client's
//   own service, http://site-<account_id>.railway.internal:<port>, keeping
//   path, query and headers and adding X-Forwarded-Host/-Proto.
//     unknown host            → 404, generic AndRho page, noindex
//     old host / not canonical → 301 to the site's public host
//     not deployed yet        → 503 with Retry-After, noindex
//
// site (one per client: site-<account_id>, SITE_ID=<site_id>)
//   Serves the client's website: the template (dist/) with the business'
//   data as window.__SITE__ and its own SEO: robots.txt and sitemap.xml with
//   absolute URLs of its host, <link rel="canonical"> to the public host,
//   Google Search Console's verification meta tag, lang es-GT, and
//   LocalBusiness structured data per branch. The plan's SEO comes as flags
//   (features.store → product sitemap; features.full_site → a page per
//   branch). Until the Creator delivers (published=false) the page is
//   "en construcción" and noindex. Reached only through sites-router: a
//   request on *.up.railway.app is sent to the public host.
//
// Env: ANDRHO_API_URL (required), SITE_MODE (router | site, default router),
// SITE_ID (site mode), TRACKER_SCRIPT_ORIGIN, SITES_INTERNAL_SUFFIX
// (default .railway.internal), PORT.
import express from 'express'
import helmet from 'helmet'
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(DIR, 'dist')
const API = (process.env.ANDRHO_API_URL || '').replace(/\/+$/, '')
const TRACKER = (process.env.TRACKER_SCRIPT_ORIGIN || 'https://webtracker-production-b8d7.up.railway.app').replace(/\/+$/, '')
const INTERNAL_SUFFIX = process.env.SITES_INTERNAL_SUFFIX || '.railway.internal'
const TTL_MS = 60 * 1000
const RETRY_AFTER = '120'

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const slug = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

// ---------------------------------------------------------------------------
// andrho-api lookups (cached; a blip keeps serving the last answer)
// ---------------------------------------------------------------------------
function cached(fetchImpl) {
  const cache = new Map() // url -> { at, data }
  return async function get(url) {
    const hit = cache.get(url)
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data
    let data = null
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) })
      if (res.ok) data = await res.json()
      else if (res.status !== 404) throw new Error(`andrho-api ${res.status}`)
    } catch (err) {
      if (hit) return hit.data
      throw err
    }
    cache.set(url, { at: Date.now(), data })
    return data
  }
}

// ---------------------------------------------------------------------------
// Pages for people who reach a host without a site
// ---------------------------------------------------------------------------
const page = (title, body) => `<!doctype html><html lang="es-GT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#0b0f19;color:#e8ecf4;text-align:center;padding:24px}
a{color:#00e6b8}h1{font-size:1.6rem;margin:0 0 8px}</style></head>
<body><main><h1>${esc(title)}</h1><p>${body}</p><p><a href="https://andrho.com">AndRho</a></p></main></body></html>`

export const NOT_FOUND_HTML = page('Aquí todavía no hay un sitio', 'Esta dirección no pertenece a ningún negocio de AndRho.')
export const BUILDING_HTML = page('Este sitio está por despegar', 'Lo estamos publicando. Vuelve en un par de minutos.')

function notFound(res) {
  res.status(404).set('X-Robots-Tag', 'noindex').set('Cache-Control', 'no-store').type('html').send(NOT_FOUND_HTML)
}
function building(res) {
  res.status(503).set('Retry-After', RETRY_AFTER).set('X-Robots-Tag', 'noindex').set('Cache-Control', 'no-store').type('html').send(BUILDING_HTML)
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const SERVICE_RE = /^[a-z0-9][a-z0-9-]{0,79}$/

// upstreamOf: where the site's service listens, never anything but a
// Railway private host (a bad name from the API is refused).
export function upstreamOf(site) {
  const u = site && site.upstream
  const port = Number(u && u.port)
  if (!u || !SERVICE_RE.test(String(u.service || '')) || !Number.isInteger(port) || port < 1 || port > 65535) return null
  return { host: `${u.service}${INTERNAL_SUFFIX}`, port }
}

const HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade'])

function proxy(req, res, target, requestImpl) {
  const headers = {}
  for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k)) headers[k] = v
  headers['x-forwarded-host'] = req.hostname
  headers['x-forwarded-proto'] = 'https'
  headers['x-forwarded-for'] = [req.headers['x-forwarded-for'], req.socket.remoteAddress].filter(Boolean).join(', ')
  const up = requestImpl({ host: target.host, port: target.port, method: req.method, path: req.originalUrl, headers, timeout: 30000 }, (r) => {
    const out = {}
    for (const [k, v] of Object.entries(r.headers)) if (!HOP.has(k)) out[k] = v
    res.writeHead(r.statusCode || 502, out)
    r.pipe(res)
  })
  up.on('timeout', () => up.destroy(new Error('timeout')))
  up.on('error', (err) => {
    console.error('[router] upstream', target.host, err.message)
    if (!res.headersSent) res.status(502).set('Retry-After', '30').set('X-Robots-Tag', 'noindex').type('text/plain').send('El sitio no respondió. Intenta de nuevo en un momento.')
    else res.destroy()
  })
  req.pipe(up)
}

export function createRouter({ fetchImpl = fetch, requestImpl = http.request } = {}) {
  const lookup = cached(fetchImpl)
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)
  app.get('/_health', (req, res) => res.json({ ok: true, mode: 'router' }))
  app.use(async (req, res) => {
    const host = (req.hostname || '').toLowerCase().replace(/\.$/, '')
    let site
    try {
      site = await lookup(`${API}/public/site?host=${encodeURIComponent(host)}`)
    } catch (err) {
      console.error('[router] lookup', host, err.message)
      return building(res)
    }
    if (!site) return notFound(res)
    if (site.redirect && site.redirect !== host) return res.redirect(301, `https://${site.redirect}${req.originalUrl}`)
    const target = site.status === 'live' ? upstreamOf(site) : null
    if (!target) return building(res)
    proxy(req, res, target, requestImpl)
  })
  return app
}

// ---------------------------------------------------------------------------
// Site: SEO built from the business' data
// ---------------------------------------------------------------------------
export function branchesOf(site) {
  const list = Array.isArray(site?.seo?.branches) ? site.seo.branches : []
  return list.filter((b) => b && b.name).map((b) => ({ ...b, slug: slug(b.name) }))
}

// The site's pages, absolute: home, plus a page per branch when the plan
// has the full site.
export function pagesOf(site) {
  const pages = ['/']
  if (site?.features?.full_site) for (const b of branchesOf(site)) if (b.slug) pages.push(`/sucursales/${b.slug}`)
  return pages
}

export function robotsTxt(site) {
  const base = `https://${site.public_host}`
  const lines = ['User-agent: *', 'Allow: /', '', `Sitemap: ${base}/sitemap.xml`]
  if (site?.features?.store) lines.push(`Sitemap: ${base}/sitemap-productos.xml`)
  return lines.join('\n') + '\n'
}

export function sitemapXml(site, urls = pagesOf(site)) {
  const base = `https://${site.public_host}`
  const body = urls.map((u) => `  <url><loc>${esc(base + u)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}${body ? '\n' : ''}</urlset>\n`
}

// LocalBusiness per branch (or the business itself without branches).
export function localBusiness(site, only) {
  const url = `https://${site.public_host}/`
  const one = (b) => {
    const ld = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: b.name || site.company, url }
    if (site.seo?.og_image) ld.image = site.seo.og_image
    if (b.address) ld.address = { '@type': 'PostalAddress', streetAddress: b.address, addressCountry: 'GT' }
    if (b.phone) ld.telephone = b.phone
    if (b.hours) ld.openingHours = b.hours
    if (typeof b.lat === 'number' && typeof b.lng === 'number') ld.geo = { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng }
    return ld
  }
  const list = only ? [only] : branchesOf(site)
  return list.length ? list.map(one) : [one({ name: site.company })]
}

const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

export function renderSite(html, site, reqPath = '/') {
  const branch = reqPath.startsWith('/sucursales/') ? branchesOf(site).find((b) => `/sucursales/${b.slug}` === reqPath) : null
  const seo = site.seo || {}
  const published = !!site.published
  const name = branch ? `${branch.name} · ${site.company}` : site.company
  const title = published ? seo.title || name : `${site.company} · sitio en construcción`
  const description = seo.description || (site.site && site.site.headline) || `El sitio de ${site.company} viene en camino.`
  const canonical = `https://${site.public_host}${branch ? reqPath : '/'}`
  const data = {
    site_id: site.site_id, company: site.company, business_type: site.business_type, type_name: site.type_name,
    status: site.status, published, site: site.site, essence: site.essence, has_logo: site.has_logo, features: site.features, branch
  }
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(seo.title || name)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:locale" content="es_GT" />`,
    seo.og_image ? `<meta property="og:image" content="${esc(seo.og_image)}" />` : '',
    seo.gsc_token ? `<meta name="google-site-verification" content="${esc(seo.gsc_token)}" />` : '',
    // Being built: out of search results until the Creator's site is up.
    published ? '' : '<meta name="robots" content="noindex" />',
    ...localBusiness(site, branch).map((ld) => `<script type="application/ld+json">${json(ld)}</script>`),
    `<script>window.__SITE__=${json(data)}</script>`
  ].filter(Boolean).join('\n    ')
  const body = `<script src="${esc(TRACKER)}/tracker.js" data-site-id="${esc(site.site_id)}" defer></script>`
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${esc(seo.lang || 'es-GT')}">`)
    .replace('<!--site:head-->', head)
    .replace('<!--site:body-->', body)
}

let template = null
function indexHtml() {
  if (template === null) {
    const file = path.join(DIST, 'index.html')
    template = existsSync(file) ? readFileSync(file, 'utf8') : ''
  }
  return template
}

export function createSite({ siteId = process.env.SITE_ID, fetchImpl = fetch, html = indexHtml } = {}) {
  const load = cached(fetchImpl)
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)
  app.get('/_health', (req, res) => res.json({ ok: true, mode: 'site' }))

  app.use(async (req, res, next) => {
    try {
      req.site = await load(`${API}/public/sites/${encodeURIComponent(siteId)}`)
    } catch (err) {
      console.error('[site] lookup', siteId, err.message)
      return building(res)
    }
    if (!req.site) return notFound(res)
    // Only through sites-router: never duplicate content on Railway's domain.
    if ((req.hostname || '').endsWith('.up.railway.app')) return res.redirect(301, `https://${req.site.public_host}${req.originalUrl}`)
    next()
  })

  app.get('/robots.txt', (req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=300').send(robotsTxt(req.site)))
  app.get('/sitemap.xml', (req, res) => res.type('application/xml').set('Cache-Control', 'public, max-age=300').send(sitemapXml(req.site)))
  app.get('/sitemap-productos.xml', (req, res) => {
    if (!req.site.features?.store) return notFound(res)
    // The store's products (Product schema) come with the store module; the
    // sitemap exists from day one so Search Console can read it.
    const urls = (req.site.products || []).map((p) => `/productos/${slug(p.slug || p.name)}`)
    res.type('application/xml').set('Cache-Control', 'public, max-age=300').send(sitemapXml(req.site, urls))
  })

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
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", TRACKER],
        upgradeInsecureRequests: process.env.NODE_ENV === 'development' ? null : []
      }
    }
  }))
  app.use('/assets', express.static(path.join(DIST, 'assets'), { maxAge: '7d', immutable: true }))
  app.get('*', (req, res) => {
    const doc = html()
    if (!doc) return res.status(500).type('text/plain').send('Falta compilar la plantilla (npm run build).')
    if (req.path.startsWith('/sucursales/') && !pagesOf(req.site).includes(req.path)) return notFound(res)
    res.setHeader('Cache-Control', 'no-cache')
    res.type('html').send(renderSite(doc, req.site, req.path))
  })
  return app
}

export function createApp(opts = {}) {
  const mode = opts.mode || process.env.SITE_MODE || 'router'
  return mode === 'site' ? createSite(opts) : createRouter(opts)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!API) {
    console.error('[sites] ANDRHO_API_URL is required')
    process.exit(1)
  }
  const mode = process.env.SITE_MODE || 'router'
  if (mode === 'site' && !process.env.SITE_ID) {
    console.error('[sites] SITE_ID is required with SITE_MODE=site')
    process.exit(1)
  }
  const port = process.env.PORT || 3000
  // '::' so Railway's private network (IPv6) reaches the client's service.
  createApp().listen(port, '::', () => console.log(`[sites] ${mode} listening on ${port}`))
}
