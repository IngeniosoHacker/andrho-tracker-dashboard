import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

process.env.ANDRHO_API_URL = 'https://api.test'
process.env.TRACKER_SCRIPT_ORIGIN = 'https://tracker.test'
const { createApp, allowedLive } = await import('../server.js')

const SITES = {
  'web.comedor.andrho.com': { site_id: 'comedor', company: 'Comedor <Doña Ana>', business_type: 'restaurantes', type_name: 'Restaurantes',
    status: 'construyendo', site: { headline: 'Ven a probarlo', cta: 'Haz tu pedido', sections: [{ key: 'menu', title: 'Menú', hint: '' }] }, has_logo: false },
  'web.listo.andrho.com': { site_id: 'listo', company: 'Listo', status: 'publicado', live_url: 'https://listo-site.up.railway.app', site: {} },
  'web.malo.andrho.com': { site_id: 'malo', company: 'Malo', status: 'publicado', live_url: 'https://evil.example.com', site: {} }
}

function fakeFetch(url, opts) {
  const u = new URL(url)
  if (u.origin === 'https://api.test' && u.pathname === '/public/site') {
    const s = SITES[u.searchParams.get('host')]
    return Promise.resolve(new Response(s ? JSON.stringify(s) : '{}', { status: s ? 200 : 404 }))
  }
  if (u.hostname === 'listo-site.up.railway.app') {
    return Promise.resolve(new Response(`<h1>sitio real ${u.pathname}</h1>`, { status: 200, headers: { 'content-type': 'text/html' } }))
  }
  return Promise.reject(new Error('unexpected fetch ' + url))
}

// fetch() drops a custom Host header; http.request keeps it.
function get(host, path = '/') {
  const app = createApp({ fetchImpl: fakeFetch })
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

test('a site being built gets the template with its data, escaped, and the tracker', async () => {
  const r = await get('web.comedor.andrho.com')
  assert.equal(r.status, 200)
  assert.match(r.text, /<title>Comedor &lt;Doña Ana&gt; · sitio en construcción<\/title>/)
  assert.match(r.text, /window\.__SITE__=\{"site_id":"comedor"/)
  assert.ok(!r.text.includes('<Doña Ana>'), 'raw < must not reach the HTML')
  assert.match(r.text, /https:\/\/tracker\.test\/tracker\.js" data-site-id="comedor"/)
  assert.match(r.text, /noindex/)
  assert.match(r.headers.get('content-security-policy') || '', /tracker\.test/)
})

test('deep links of a site being built still get the page', async () => {
  const r = await get('web.comedor.andrho.com', '/menu/sopas')
  assert.equal(r.status, 200)
})

test('an unknown host gets 404', async () => {
  assert.equal((await get('web.nadie.andrho.com')).status, 404)
})

test('a published site is proxied from its deployment on the same host', async () => {
  const r = await get('web.listo.andrho.com', '/contacto')
  assert.equal(r.status, 200)
  assert.equal(r.text, '<h1>sitio real /contacto</h1>')
})

test('a published site on a host that is not allowed is never proxied', async () => {
  const r = await get('web.malo.andrho.com')
  assert.equal(r.status, 200)
  assert.match(r.text, /sitio en construcción/)
  assert.equal(allowedLive('http://x.up.railway.app'), false)
  assert.equal(allowedLive('https://u:p@x.up.railway.app'), false)
  assert.equal(allowedLive('https://x.up.railway.app.evil.com'), false)
})
