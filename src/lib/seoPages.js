// On-page audit of every tracked page, from the SEO signals tracker.js
// reads off the rendered DOM (pageviews.seo_meta) — OpenSEO's "site audit"
// without crawling: the tracker already saw each page. Pages tracked before
// tracker.js sent seo_meta are audited on title and word count only.
'use strict';

const { loadPages } = require('./seoSuggest');

const W = { title: 15, meta: 15, h1: 15, words: 15, canonical: 10, lang: 5, alt: 10, schema: 10, index: 5 };

function auditPage(p) {
  const checks = [];
  const add = (key, status, label, fix) => checks.push({ key, status, label, fix: status === 'ok' ? null : fix });
  const s = p.seo || {};
  const tl = (p.title || '').length;
  add('title', tl >= 30 && tl <= 60 ? 'ok' : tl ? 'warn' : 'fail', tl ? `Título de ${tl} caracteres` : 'Sin título',
    tl > 60 ? 'Acórtalo a 60 caracteres o menos: Google corta el resto.' : 'Escribe un título de 30 a 60 caracteres con la búsqueda principal.');
  if (p.seo) {
    const ml = (s.metaDescription || '').length;
    add('meta', ml >= 70 && ml <= 160 ? 'ok' : ml ? 'warn' : 'fail', ml ? `Meta descripción de ${ml} caracteres` : 'Sin meta descripción',
      ml > 160 ? 'Recórtala a 160 caracteres.' : 'Escribe una de 70 a 160 caracteres: es el texto bajo tu enlace en Google.');
    const h = s.h1Count || 0;
    add('h1', h === 1 ? 'ok' : h ? 'warn' : 'fail', h === 1 ? 'Un encabezado principal (h1)' : `${h} encabezados h1`,
      h ? 'Deja un solo h1 por página.' : 'Agrega un h1 que diga de qué trata la página.');
    add('canonical', s.canonical ? 'ok' : 'warn', s.canonical ? 'URL canónica declarada' : 'Sin URL canónica',
      'Agrega <link rel="canonical"> para que Google no vea duplicados (con y sin www, parámetros).');
    add('lang', s.lang ? 'ok' : 'warn', s.lang ? `Idioma declarado (${s.lang})` : 'Sin idioma declarado', 'Agrega lang="es" a la etiqueta <html>.');
    const noAlt = s.imgNoAlt || 0;
    add('alt', noAlt === 0 ? 'ok' : 'warn', noAlt ? `${noAlt} de ${s.imgCount} imágenes sin texto alternativo` : 'Imágenes con texto alternativo',
      'Describe cada imagen en su atributo alt: Google Imágenes y los lectores de pantalla lo usan.');
    const types = s.schemaTypes || [];
    add('schema', types.length ? 'ok' : 'warn', types.length ? `Datos estructurados: ${types.slice(0, 3).join(', ')}` : 'Sin datos estructurados',
      'Agrega JSON-LD (LocalBusiness, Product, FAQPage...) para salir con más detalle en Google y en asistentes de IA.');
    const noindex = /noindex/i.test(s.robots || '');
    add('index', noindex ? 'fail' : 'ok', noindex ? 'La página pide no ser indexada (noindex)' : 'Indexable',
      'Quita "noindex" del meta robots si quieres que aparezca en Google.');
  }
  const wc = p.wordCount || 0;
  add('words', wc >= 300 ? 'ok' : wc >= 120 ? 'warn' : 'fail', `${wc} palabras de contenido`,
    'Las páginas con menos de 300 palabras rara vez posicionan: explica más (beneficios, preguntas frecuentes, ejemplos).');

  let got = 0, max = 0;
  checks.forEach((c) => { max += W[c.key]; got += c.status === 'ok' ? W[c.key] : c.status === 'warn' ? W[c.key] / 2 : 0; });
  return { score: Math.round((got / max) * 100), checks };
}

async function auditPages(pool, siteId) {
  const pages = await loadPages(pool, siteId);
  const rows = pages.map((p) => Object.assign({
    path: p.path, title: p.title, pageviews: p.pageviews, organicEntries: p.organicEntries, hasSignals: Boolean(p.seo)
  }, auditPage(p)));
  // Worst first among pages that matter (traffic-weighted).
  rows.sort((a, b) => (a.score - b.score) || (b.pageviews - a.pageviews));
  const issues = {};
  rows.forEach((r) => r.checks.forEach((c) => { if (c.status !== 'ok') issues[c.key] = (issues[c.key] || 0) + 1; }));
  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length) : null;
  return { pages: rows, averageScore: avg, issues, withoutSignals: rows.filter((r) => !r.hasSignals).length };
}

module.exports = { auditPage, auditPages };
