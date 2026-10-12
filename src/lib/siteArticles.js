'use strict';

// Server-side rendering of the articles uploaded from the dashboard
// (andrho-api's public /public/sites/:siteId/articles endpoints) into the
// built site, so crawlers that don't run JavaScript read them like the built
// ones: /articulos/<slug>.html from the articulos/plantilla.html template, the
// /articulos/ index, sitemap.xml and llms.txt. The HTML comes from the site's
// own web/src/lib/articles.js (ESM, loaded with import()), so both always
// render the same markup.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const DIST = path.join(__dirname, '..', '..', 'web', 'dist');
const ARTICLES_MODULE = pathToFileURL(path.join(__dirname, '..', '..', 'web', 'src', 'lib', 'articles.js')).href;
const TTL_MS = 60 * 1000;

const API_URL = (process.env.ANDRHO_API_URL || '').replace(/\/+$/, '');
const SITE_ID = process.env.ARTICLES_SITE_ID || 'andrho';

let lib = null;
const loadLib = async () => (lib = lib || (await import(ARTICLES_MODULE)));

const cache = new Map(); // key -> { at, value }
async function cached(key, load) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function apiGet(p) {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/public/sites/${encodeURIComponent(SITE_ID)}${p}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Uploaded articles (site shape, without bodies). [] when the API is down.
async function remoteList() {
  const { fromApi } = await loadLib();
  return cached('list', async () => {
    const data = await apiGet('/articles');
    return data ? (data.articles || []).map(fromApi) : [];
  });
}

async function remoteArticle(slug) {
  const { fromApi } = await loadLib();
  return cached(`article:${slug}`, async () => {
    const data = await apiGet(`/articles/${encodeURIComponent(slug)}`);
    return data && data.article ? fromApi(data.article) : null;
  });
}

const readDist = (file) => fs.promises.readFile(path.join(DIST, file), 'utf8');

const between = (html, name, replacement) =>
  html.replace(new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`), replacement);

const jsonScript = (obj) =>
  `<script id="article-data" type="application/json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// Express router: mount before express.static(web/dist).
function siteArticlesRouter(express) {
  const router = express.Router();

  router.get(['/articulos', '/articulos/', '/articulos/index.html'], async (req, res, next) => {
    try {
      if (req.path === '/articulos') return res.redirect(301, '/articulos/');
      const { mergeArticles, articlesIndexHead, articlesIndexHtml } = await loadLib();
      const list = mergeArticles(await remoteList());
      let html = await readDist('articulos/index.html');
      html = between(html, 'articles:head', articlesIndexHead(list));
      html = between(html, 'articles:body', articlesIndexHtml(list));
      res.type('html').set('Cache-Control', 'public, max-age=60').send(html);
    } catch (err) { next(err); }
  });

  router.get('/articulos/plantilla.html', (req, res) => res.status(404).type('text').send('not found'));

  // /articulos/<slug>.html that isn't a built page: an uploaded article.
  router.get('/articulos/:file', async (req, res, next) => {
    try {
      const m = req.params.file.match(/^([a-z0-9-]+)(\.html)?$/);
      if (!m) return next();
      if (fs.existsSync(path.join(DIST, 'articulos', `${m[1]}.html`))) {
        return m[2] ? next() : res.redirect(301, `/articulos/${m[1]}.html`);
      }
      const article = await remoteArticle(m[1]);
      if (!article) return next();
      if (!m[2]) return res.redirect(301, `/articulos/${m[1]}.html`);
      const { articleHead, articleHtml } = await loadLib();
      let html = await readDist('articulos/plantilla.html');
      html = html
        .replace(/<meta name="robots" content="noindex" data-template \/>\n?/, '')
        .replace('<!--article:head-->', articleHead(article))
        .replace('<!--article:body-->', articleHtml(article))
        .replace('<!--article:data-->', jsonScript(article));
      res.type('html').set('Cache-Control', 'public, max-age=60').send(html);
    } catch (err) { next(err); }
  });

  router.get('/sitemap.xml', async (req, res, next) => {
    try {
      const { SITE } = await import(pathToFileURL(path.join(__dirname, '..', '..', 'web', 'src', 'lib', 'seo.js')).href);
      const { articleUrl } = await loadLib();
      let xml = await readDist('sitemap.xml');
      const extra = (await remoteList())
        .filter((a) => !xml.includes(`${SITE.url}${articleUrl(a)}<`))
        .map((a) => `  <url>\n    <loc>${SITE.url}${articleUrl(a)}</loc>\n    ${a.date ? `<lastmod>${a.date}</lastmod>\n    ` : ''}<changefreq>monthly</changefreq>\n  </url>`)
        .join('\n');
      if (extra) xml = xml.replace('</urlset>', `${extra}\n</urlset>`);
      res.type('application/xml').set('Cache-Control', 'public, max-age=300').send(xml);
    } catch (err) { next(err); }
  });

  router.get('/llms.txt', async (req, res, next) => {
    try {
      const { SITE } = await import(pathToFileURL(path.join(__dirname, '..', '..', 'web', 'src', 'lib', 'seo.js')).href);
      const { articleUrl } = await loadLib();
      let txt = await readDist('llms.txt');
      const lines = (await remoteList())
        .filter((a) => !txt.includes(`${SITE.url}${articleUrl(a)})`))
        .map((a) => `- [${a.title}](${SITE.url}${articleUrl(a)}): ${a.description}`)
        .join('\n');
      if (lines) txt = txt.replace(/\n\n## Contacto/, `\n${lines}\n\n## Contacto`);
      res.type('text/plain; charset=utf-8').set('Cache-Control', 'public, max-age=300').send(txt);
    } catch (err) { next(err); }
  });

  return router;
}

module.exports = { siteArticlesRouter };
