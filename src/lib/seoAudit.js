// "Preparación para buscadores e IA" (SEO/GEO readiness) for a customer's
// site: fetches the home page, robots.txt, sitemap and llms.txt *the way a
// crawler does* — plain HTTP, no JavaScript — and scores what search engines
// and AI assistants can actually read and are allowed to read.
//
// The origin audited is never user input: it's derived from the site's own
// tracked sessions (see the /seo-audit route). Tracked URLs can still be
// spoofed by anyone posting to the tracker, so every fetch goes through
// safeFetch(): http(s) on default ports only, DNS resolved and checked
// against private/loopback/link-local ranges, redirects re-validated, size
// and time capped.
const dns = require('dns').promises;
const net = require('net');

const USER_AGENT = 'AndRhoSEOCheck/1.0 (+https://andrho.com)';
const TIMEOUT_MS = 6000;
const MAX_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;

// Crawlers whose access we report on. `critical` = blocking it hurts classic SEO.
const CRAWLERS = [
  { token: 'Googlebot', label: 'Google', critical: true },
  { token: 'Bingbot', label: 'Bing', critical: true },
  { token: 'GPTBot', label: 'OpenAI (entrenamiento)' },
  { token: 'OAI-SearchBot', label: 'ChatGPT Search' },
  { token: 'ChatGPT-User', label: 'ChatGPT (navegación)' },
  { token: 'ClaudeBot', label: 'Anthropic' },
  { token: 'Claude-SearchBot', label: 'Claude Search' },
  { token: 'PerplexityBot', label: 'Perplexity' },
  { token: 'Google-Extended', label: 'Gemini' },
];

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') ||
    v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb') || v6.startsWith('ff');
}

async function assertPublicUrl(url) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('protocolo no permitido');
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('puerto no permitido');
  if (url.username || url.password) throw new Error('URL con credenciales');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error('el dominio apunta a una red privada');
  }
}

async function readCapped(res) {
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) { await reader.cancel(); break; }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Returns { status, contentType, body } or { status: 0, error } — never throws.
async function safeFetch(rawUrl) {
  let url = new URL(rawUrl);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicUrl(url);
      const res = await fetch(url, {
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,text/plain,application/xml;q=0.9,*/*;q=0.5' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        url = new URL(res.headers.get('location'), url);
        continue;
      }
      return { status: res.status, contentType: res.headers.get('content-type') || '', body: await readCapped(res), finalUrl: url.href };
    }
    return { status: 0, error: 'demasiadas redirecciones' };
  } catch (err) {
    return { status: 0, error: err.message || 'no se pudo conectar' };
  }
}

// --- HTML helpers (regex-level on purpose: we only need a few tags) -------

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '').trim() : null;
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

function metaContent(html, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const name = (attr(tag, 'name') || attr(tag, 'property') || '').toLowerCase();
    if (name === key) return decode(attr(tag, 'content') || '');
  }
  return null;
}

function analyzeHtml(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const canonicalTag = (html.match(/<link\b[^>]*rel\s*=\s*["']?canonical["']?[^>]*>/i) || [])[0];
  const jsonLdTypes = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = [].concat(data['@graph'] || data);
      for (const n of nodes) [].concat(n['@type'] || []).forEach((t) => jsonLdTypes.push(t));
    } catch { jsonLdTypes.push('(JSON inválido)'); }
  }
  // What a crawler that doesn't run JavaScript reads: the markup minus
  // scripts/styles/templates.
  const text = decode(
    html
      .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
  return {
    title: title ? decode(title).replace(/\s+/g, ' ').trim() : null,
    description: metaContent(html, 'description'),
    canonical: canonicalTag ? attr(canonicalTag, 'href') : null,
    ogTitle: metaContent(html, 'og:title'),
    ogImage: metaContent(html, 'og:image'),
    lang: attr((html.match(/<html\b[^>]*>/i) || [''])[0], 'lang'),
    h1Count: (html.match(/<h1\b/gi) || []).length,
    jsonLdTypes,
    wordCount: text ? text.split(' ').length : 0,
  };
}

// --- robots.txt ------------------------------------------------------------

function parseRobots(body) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'sitemap') { sitemaps.push(value); continue; }
    if (key === 'user-agent') {
      if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (current && (key === 'allow' || key === 'disallow')) current.rules.push({ allow: key === 'allow', path: value });
  }
  return { groups, sitemaps };
}

// Whether `token` may fetch "/" (the home page): most specific group wins,
// longest matching rule wins, Allow wins ties (RFC 9309).
function robotsAllowsHome(robots, token) {
  const t = token.toLowerCase();
  const group = robots.groups.find((g) => g.agents.includes(t)) || robots.groups.find((g) => g.agents.includes('*'));
  if (!group) return true;
  let best = null;
  for (const rule of group.rules) {
    if (rule.path === '' || !'/'.startsWith(rule.path.replace(/\*$/, ''))) continue;
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) best = rule;
  }
  return !best || best.allow;
}

// --- the audit ------------------------------------------------------------

async function auditSite(origin) {
  const [home, robotsRes, llms] = await Promise.all([
    safeFetch(`${origin}/`),
    safeFetch(`${origin}/robots.txt`),
    safeFetch(`${origin}/llms.txt`),
  ]);
  const checks = [];
  const add = (id, label, status, detail, fix) => checks.push({ id, label, status, detail, fix: status === 'ok' ? null : fix });

  if (!home.status || home.status >= 400) {
    add('home', 'Página de inicio accesible', 'fail', home.error || `respondió ${home.status}`, 'Verifica que tu sitio responda públicamente sin iniciar sesión.');
    return { origin, checkedAt: new Date().toISOString(), checks, score: 0 };
  }

  const h = analyzeHtml(home.body);
  add('https', 'Sitio con HTTPS', origin.startsWith('https://') ? 'ok' : 'fail',
    origin.startsWith('https://') ? 'Conexión segura' : 'El sitio se sirve sin HTTPS',
    'Activa HTTPS: los buscadores lo usan como señal de confianza.');
  add('title', 'Título de la página', !h.title ? 'fail' : h.title.length > 65 ? 'warn' : 'ok',
    h.title ? `"${h.title}" (${h.title.length} caracteres)` : 'Sin etiqueta <title>',
    'Usa un título de 30 a 65 caracteres con tu marca y lo que haces (ej. "Marca: servicio en Ciudad").');
  add('description', 'Meta descripción', !h.description ? 'fail' : h.description.length < 50 || h.description.length > 160 ? 'warn' : 'ok',
    h.description ? `${h.description.length} caracteres` : 'Sin meta descripción',
    'Escribe una descripción de 50 a 160 caracteres: es el texto que aparece en Google y que resumen las IA.');
  add('h1', 'Encabezado principal (h1)', h.h1Count === 1 ? 'ok' : h.h1Count === 0 ? 'fail' : 'warn',
    h.h1Count === 0 ? 'No hay h1 en el HTML' : `${h.h1Count} h1 en el HTML`,
    'Deja un solo h1 que diga claramente qué es tu negocio.');
  add('canonical', 'URL canónica', h.canonical ? 'ok' : 'warn', h.canonical || 'Sin <link rel="canonical">',
    'Agrega una URL canónica para evitar contenido duplicado.');
  add('og', 'Vista previa al compartir (Open Graph)', h.ogTitle && h.ogImage ? 'ok' : h.ogTitle || h.ogImage ? 'warn' : 'fail',
    [h.ogTitle ? 'og:title' : null, h.ogImage ? 'og:image' : null].filter(Boolean).join(' + ') || 'Sin etiquetas Open Graph',
    'Agrega og:title, og:description y og:image para que tus enlaces se vean bien en redes y chats.');
  add('jsonld', 'Datos estructurados (JSON-LD)', h.jsonLdTypes.length ? 'ok' : 'warn',
    h.jsonLdTypes.length ? h.jsonLdTypes.join(', ') : 'Sin datos estructurados',
    'Agrega JSON-LD (Organization, LocalBusiness o Product, FAQPage): ayuda a Google y a las IA a entender quién eres.');
  add('static-content', 'Contenido legible sin JavaScript', h.wordCount >= 150 ? 'ok' : h.wordCount >= 40 ? 'warn' : 'fail',
    `${h.wordCount} palabras en el HTML inicial`,
    'La mayoría de rastreadores de IA no ejecutan JavaScript: incluye el texto principal de tu página en el HTML (pre-renderizado o contenido estático).');
  add('lang', 'Idioma declarado', h.lang ? 'ok' : 'warn', h.lang ? `lang="${h.lang}"` : 'Sin atributo lang',
    'Declara el idioma en <html lang="es">.');

  const robotsOk = robotsRes.status === 200 && !/text\/html/i.test(robotsRes.contentType);
  const robots = robotsOk ? parseRobots(robotsRes.body) : { groups: [], sitemaps: [] };
  add('robots', 'Archivo robots.txt', robotsOk ? 'ok' : 'warn', robotsOk ? 'Encontrado' : 'No encontrado',
    'Publica un /robots.txt que indique qué pueden rastrear los buscadores y las IA, con la línea Sitemap.');
  const crawlers = CRAWLERS.map((c) => ({ ...c, allowed: robotsAllowsHome(robots, c.token) }));
  const blocked = crawlers.filter((c) => !c.allowed);
  add('crawlers', 'Buscadores e IA pueden leer tu sitio',
    blocked.some((c) => c.critical) ? 'fail' : blocked.length ? 'warn' : 'ok',
    blocked.length ? `Bloqueados: ${blocked.map((c) => c.label).join(', ')}` : 'Todos los rastreadores revisados tienen acceso',
    'Si quieres aparecer en respuestas de IA, permite sus rastreadores en robots.txt (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended).');

  let sitemapUrl = robots.sitemaps[0] || `${origin}/sitemap.xml`;
  let sitemapOk = false;
  try {
    // Only follow sitemap URLs on the audited site itself.
    if (new URL(sitemapUrl).origin !== origin) sitemapUrl = `${origin}/sitemap.xml`;
    const sm = await safeFetch(sitemapUrl);
    sitemapOk = sm.status === 200 && /<(urlset|sitemapindex)\b/i.test(sm.body);
  } catch { /* invalid URL in robots.txt -- reported as missing */ }
  add('sitemap', 'Sitemap XML', sitemapOk ? 'ok' : 'warn', sitemapOk ? sitemapUrl : 'No encontrado',
    'Publica un sitemap.xml con tus páginas importantes y enlázalo desde robots.txt.');

  const llmsOk = llms.status === 200 && !/text\/html/i.test(llms.contentType) && llms.body.trim().length > 0;
  add('llms', 'Resumen para IA (llms.txt)', llmsOk ? 'ok' : 'warn', llmsOk ? 'Encontrado' : 'No encontrado',
    'Opcional pero recomendado: un /llms.txt con un resumen en texto de tu negocio y tus páginas clave para asistentes de IA.');

  const points = checks.reduce((sum, c) => sum + (c.status === 'ok' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  return {
    origin,
    checkedAt: new Date().toISOString(),
    score: Math.round((points / checks.length) * 100),
    checks,
    crawlers: crawlers.map(({ token, label, allowed }) => ({ token, label, allowed })),
  };
}

module.exports = { auditSite, safeFetch, analyzeHtml, parseRobots, robotsAllowsHome, isPrivateAddress };
