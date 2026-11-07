import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

process.env.ANDRHO_API_URL = 'https://api.test'
process.env.TRACKER_SCRIPT_ORIGIN = 'https://tracker.test'
process.env.SITES_INTERNAL_SUFFIX = '.internal.test'
const { createApp, upstreamOf, robotsTxt, sitemapXml, localBusiness } = await import('../server.js')

const base = {
  site_id: 'comedor', company: 'Comedor <Doña Ana>', business_type: 'restaurantes', type_name: 'Restaurantes',
  host: 'comedor.web.andrho.com', public_host: 'comedor.web.andrho.com',
  site: { headline: 'Ven a probarlo', cta: 'Haz tu pedido', sections: [{ key: 'menu', title: 'Menú', hint: '' }] }, has_logo: false,
  seo: { title: '', description: '', og_image: '', lang: 'es-GT', gsc_token: 'abcDEF123_-xyz', branches: [] },
  features: { website: true, store: false, full_site: false, seo_level: 'basico' }
}
const SITES = {
  'comedor.web.andrho.com': { ...base, status: 'live', upstream: { service: 'site-acc1', port: 8080 } },
  'nuevo.web.andrho.com': { ...base, site_id: 'nuevo', status: 'deploying' },
  'web.comedor.andrho.com': { ...base, status: 'live', redirect: 'comedor.web.andrho.com' },
  'malo.web.andrho.com': { ...base, status: 'live', upstream: { service: 'evil.com/x', port: 80 } }
}
const BY_ID = {
  comedor: { ...base, status: 'live' },
  galaxia: {
    ...base, site_id: 'galaxia', company: 'Galaxia', public_host: 'galaxia.web.andrho.com', published: true, status: 'live',
    seo: { ...base.seo, title: 'Galaxia: tacos', branches: [
      { name: 'Zona 10', address: '4a Av 1-2', phone: '+502 5555 5555', hours: 'Mo-Su 08:00-20:00', lat: 14.6, lng: -90.5 },
      { name: 'Mixco' }] },
    features: { website: true, store: true, full_site: true, seo_level: 'completo' }
  }
}

function fakeFetch(url) {
  const u = new URL(url)
  if (u.origin !== 'https://api.test') return Promise.reject(new Error('unexpected fetch ' + url))
  let s
  if (u.pathname === '/public/site') s = SITES[u.searchParams.get('host')]
  else if (u.pathname.startsWith('/public/sites/')) s = BY_ID[decodeURIComponent(u.pathname.split('/')[3])]
  return Promise.resolve(new Response(s ? JSON.stringify(s) : '{}', { status: s ? 200 : 404 }))
}

// The client's service, as a real HTTP server the router forwards to.
let seen = null
const upstream = http.createServer((req, res) => {
  seen = { url: req.url, headers: req.headers, method: req.method }
  res.writeHead(200, { 'content-type': 'text/html', 'x-from': 'site' })
  res.end(`<h1>sitio ${req.url}</h1>`)
}).listen(0)
after(() => upstream.close())
// Every *.internal.test resolves to the local upstream.
const requestImpl = (opts, cb) => http.request({ ...opts, host: '127.0.0.1', port: upstream.address().port }, cb)

const TEMPLATE = '<!doctype html><html lang="es"><head><!--site:head--></head><body><div id="root"></div><!--site:body--></body></html>'

function get(app, host, path = '/') {
  const srv = app.listen(0)
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: srv.address().port, path, headers: { host } }, (res) => {
      let text = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (text += c))
      res.on('end', () => { srv.close(); resolve({ status: res.statusCode, text, headers: new Headers(res.headers) }) })
    })
    req.on('error', (e) => { srv.close(); reject(e) })
    req.end()
  })
}
const router = () => createApp({ mode: 'router', fetchImpl: fakeFetch, requestImpl })
const site = (siteId) => createApp({ mode: 'site', siteId, fetchImpl: fakeFetch, html: () => TEMPLATE })

// ---------------------------------------------------------------- router
test('router: a live site is forwarded to its service with path, query and forwarded headers', async () => {
  const r = await get(router(), 'comedor.web.andrho.com', '/menu?dia=hoy')
  assert.equal(r.status, 200)
  assert.equal(r.text, '<h1>sitio /menu?dia=hoy</h1>')
  assert.equal(r.headers.get('x-from'), 'site')
  assert.equal(seen.headers['x-forwarded-host'], 'comedor.web.andrho.com')
  assert.equal(seen.headers['x-forwarded-proto'], 'https')
  assert.equal(seen.headers.host, 'comedor.web.andrho.com')
})

test('router: an unknown host gets the generic 404, noindex', async () => {
  const r = await get(router(), 'cualquiercosa.web.andrho.com')
  assert.equal(r.status, 404)
  assert.equal(r.headers.get('x-robots-tag'), 'noindex')
  assert.match(r.text, /AndRho/)
})

test('router: a site still deploying gets 503 with Retry-After, noindex', async () => {
  const r = await get(router(), 'nuevo.web.andrho.com')
  assert.equal(r.status, 503)
  assert.equal(r.headers.get('retry-after'), '120')
  assert.equal(r.headers.get('x-robots-tag'), 'noindex')
})

test('router: the old web.<name>.andrho.com answers 301 to the new host', async () => {
  const r = await get(router(), 'web.comedor.andrho.com', '/menu?x=1')
  assert.equal(r.status, 301)
  assert.equal(r.headers.get('location'), 'https://comedor.web.andrho.com/menu?x=1')
})

test('router: only Railway private hosts are ever targets', async () => {
  assert.deepEqual(upstreamOf({ upstream: { service: 'site-abc', port: 8080 } }), { host: 'site-abc.internal.test', port: 8080 })
  assert.equal(upstreamOf({ upstream: { service: 'evil.com/x', port: 80 } }), null)
  assert.equal(upstreamOf({ upstream: { service: 'site-abc', port: 'x' } }), null)
  assert.equal(upstreamOf({}), null)
  assert.equal((await get(router(), 'malo.web.andrho.com')).status, 503)
})

// ------------------------------------------------------------------ site
test('site: the template with its data escaped, canonical, verification and the tracker', async () => {
  const r = await get(site('comedor'), 'comedor.web.andrho.com')
  assert.equal(r.status, 200)
  assert.match(r.text, /<html lang="es-GT">/)
  assert.match(r.text, /<title>Comedor &lt;Doña Ana&gt; · sitio en construcción<\/title>/)
  assert.ok(!r.text.includes('<Doña Ana>'), 'raw < must not reach the HTML')
  assert.match(r.text, /<link rel="canonical" href="https:\/\/comedor\.web\.andrho\.com\/" \/>/)
  assert.match(r.text, /<meta name="google-site-verification" content="abcDEF123_-xyz" \/>/)
  assert.match(r.text, /"@type":"LocalBusiness","name":"Comedor \\u003cDoña Ana>"/)
  assert.match(r.text, /noindex/, 'not delivered yet: noindex')
  assert.match(r.text, /https:\/\/tracker\.test\/tracker\.js" data-site-id="comedor"/)
  assert.match(r.headers.get('content-security-policy') || '', /tracker\.test/)
})

test('site: robots.txt and sitemap.xml are its own, with absolute URLs of its host', async () => {
  const robots = await get(site('comedor'), 'comedor.web.andrho.com', '/robots.txt')
  assert.equal(robots.text, 'User-agent: *\nAllow: /\n\nSitemap: https://comedor.web.andrho.com/sitemap.xml\n')
  const map = await get(site('comedor'), 'comedor.web.andrho.com', '/sitemap.xml')
  assert.match(map.headers.get('content-type'), /xml/)
  assert.match(map.text, /<loc>https:\/\/comedor\.web\.andrho\.com\/<\/loc>/)
  assert.equal((await get(site('comedor'), 'comedor.web.andrho.com', '/sitemap-productos.xml')).status, 404, 'no store on this plan')
})

test('site: the full plan lists a page per branch and the store sitemap; published sites are indexable', async () => {
  const s = BY_ID.galaxia
  assert.match(robotsTxt(s), /Sitemap: https:\/\/galaxia\.web\.andrho\.com\/sitemap-productos\.xml/)
  assert.match(sitemapXml(s), /\/sucursales\/zona-10<\/loc>/)
  assert.match(sitemapXml(s), /\/sucursales\/mixco<\/loc>/)
  const ld = localBusiness(s)
  assert.equal(ld.length, 2)
  assert.deepEqual(ld[0].geo, { '@type': 'GeoCoordinates', latitude: 14.6, longitude: -90.5 })
  assert.equal(ld[0].telephone, '+502 5555 5555')
  const home = await get(site('galaxia'), 'galaxia.web.andrho.com')
  assert.match(home.text, /<title>Galaxia: tacos<\/title>/)
  assert.ok(!home.text.includes('noindex'))
  const branch = await get(site('galaxia'), 'galaxia.web.andrho.com', '/sucursales/zona-10')
  assert.equal(branch.status, 200)
  assert.match(branch.text, /<link rel="canonical" href="https:\/\/galaxia\.web\.andrho\.com\/sucursales\/zona-10" \/>/)
  assert.equal((await get(site('galaxia'), 'galaxia.web.andrho.com', '/sucursales/no-existe')).status, 404)
  assert.equal((await get(site('comedor'), 'comedor.web.andrho.com', '/sucursales/zona-10')).status, 404, 'branch pages need the full site')
  assert.equal((await get(site('galaxia'), 'galaxia.web.andrho.com', '/sitemap-productos.xml')).status, 200)
})

test('site: a request on Railway\'s public domain goes to the public host', async () => {
  const r = await get(site('comedor'), 'site-acc1-production.up.railway.app', '/menu')
  assert.equal(r.status, 301)
  assert.equal(r.headers.get('location'), 'https://comedor.web.andrho.com/menu')
})

test('site: deep links still get the page; an unknown site gets 404', async () => {
  assert.equal((await get(site('comedor'), 'comedor.web.andrho.com', '/menu/sopas')).status, 200)
  assert.equal((await get(site('nadie'), 'x.web.andrho.com')).status, 404)
})
