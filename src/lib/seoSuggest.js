// Keyword suggestions for the Web > Keywords tab: which searches this site
// should go after, on which page, and what to change there.
//
// Candidates come from four places:
//   1. "cerca"      keywords the domain already ranks for at positions 4-20
//                   (DataForSEO ranked_keywords): the fastest wins
//                   (OpenSEO calls this "striking distance");
//   2. "brecha"     keywords a competitor ranks top-20 for and the site
//                   doesn't rank for at all (domain_intersection);
//   3. "nueva"      keyword ideas seeded with the site's own key phrases
//                   (TF-IDF over the page text the tracker stores);
//   4. "rastreador" searches visitors actually typed (sessions.search_keywords).
//
// Each one gets an estimate of the extra monthly visits it can bring
// (volume x CTR gain from its position to a reachable target, discounted by
// difficulty and weighted by intent and by how well it fits the site's
// content), the page that should rank for it, and concrete on-page actions
// checked against that page's real title / h1 / meta description / text.
//
// Without DataForSEO it still works from (3) and (4) with tracker numbers
// only, and says what's missing.
'use strict';

const dfs = require('./dataforseo');
const text = require('./seoText');

// Approximate organic CTR by position (public CTR studies, rounded).
const CTR = [0, 0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018];
function ctrAt(pos) {
  if (!pos || pos < 1) return 0;
  if (pos <= 10) return CTR[pos];
  if (pos <= 20) return 0.008;
  return 0.001;
}
const INTENT_WEIGHT = { transactional: 1.25, commercial: 1.15, informational: 0.9, navigational: 0.35 };
const CATEGORY_LABEL = {
  cerca: 'Casi en primera página', brecha: 'Tu competencia la tiene', nueva: 'Contenido nuevo', rastreador: 'Ya te buscan así'
};

/** Latest snapshot of each tracked page (+ its traffic) over the last 90 days. */
async function loadPages(pool, siteId) {
  const { rows } = await pool.query(
    `WITH recent AS (
       SELECT path, title, content_text, content_word_count, seo_meta, entered_at,
              ROW_NUMBER() OVER (PARTITION BY path ORDER BY (content_text IS NULL), entered_at DESC) AS rn
       FROM pageviews WHERE site_id = $1 AND entered_at >= now() - interval '90 days'
     ), traffic AS (
       SELECT p.path, COUNT(*) AS pageviews,
              COUNT(*) FILTER (WHERE p.nav_index = 0 AND s.traffic_source_type = 'organic_search') AS organic_entries,
              ROUND(AVG(p.duration_ms)) AS avg_duration_ms, ROUND(AVG(p.max_scroll_percent)) AS avg_scroll
       FROM pageviews p JOIN sessions s ON s.id = p.session_id
       WHERE p.site_id = $1 AND p.entered_at >= now() - interval '90 days'
         AND s.traffic_source_type NOT IN ('ai_crawler', 'search_bot')
       GROUP BY p.path
     )
     SELECT r.path, r.title, r.content_text, r.content_word_count, r.seo_meta,
            COALESCE(t.pageviews, 0)::int AS pageviews, COALESCE(t.organic_entries, 0)::int AS organic_entries,
            t.avg_duration_ms, t.avg_scroll
     FROM recent r LEFT JOIN traffic t ON t.path = r.path
     WHERE r.rn = 1
     ORDER BY pageviews DESC NULLS LAST
     LIMIT 60`,
    [siteId]
  );
  return rows.map((r) => ({
    path: r.path,
    title: r.title || '',
    h1: (r.seo_meta && r.seo_meta.h1) || '',
    metaDescription: (r.seo_meta && r.seo_meta.metaDescription) || '',
    text: r.content_text || '',
    wordCount: r.content_word_count || 0,
    seo: r.seo_meta || null,
    pageviews: r.pageviews,
    organicEntries: r.organic_entries,
    avgDurationMs: r.avg_duration_ms == null ? null : Number(r.avg_duration_ms),
    avgScroll: r.avg_scroll == null ? null : Number(r.avg_scroll)
  }));
}

async function trackerSearches(pool, siteId) {
  const { rows } = await pool.query(
    `SELECT lower(trim(COALESCE(search_keywords, utm_term))) AS keyword, COUNT(*)::int AS sessions,
            mode() WITHIN GROUP (ORDER BY landing_path) AS landing_path
     FROM sessions
     WHERE site_id = $1 AND started_at >= now() - interval '180 days'
       AND COALESCE(search_keywords, utm_term) IS NOT NULL AND length(trim(COALESCE(search_keywords, utm_term))) > 2
     GROUP BY 1 ORDER BY sessions DESC LIMIT 100`,
    [siteId]
  );
  return rows;
}

// The page that best fits a keyword: phrase in title/h1 > text coverage, ties
// broken by traffic.
function bestPage(keyword, pages) {
  let best = null;
  for (const p of pages) {
    const head = `${p.title} ${p.h1}`;
    const fit = (text.containsPhrase(keyword, head) ? 1 : 0.6 * text.coverage(keyword, head)) +
      0.5 * text.coverage(keyword, p.text) + (text.containsPhrase(keyword, p.text) ? 0.3 : 0);
    const s = fit + Math.log10(1 + p.pageviews) * 0.05;
    if (!best || s > best.s) best = { page: p, fit: Math.min(1, fit / 1.8), s };
  }
  return best && best.fit > 0.15 ? best : null;
}

// Concrete on-page work for (keyword, page), from what the page has today.
function pageActions(keyword, page) {
  const acts = [];
  const k = `"${keyword}"`;
  if (!text.containsPhrase(keyword, page.title)) {
    acts.push(`Pon ${k} en el título de ${page.path}${page.title ? ` (hoy: "${page.title.slice(0, 70)}")` : ''}.`);
  }
  if (page.seo && !text.containsPhrase(keyword, page.h1)) {
    acts.push(page.h1 ? `Usa ${k} en el encabezado principal (h1) de la página (hoy: "${page.h1.slice(0, 60)}").` : `La página no tiene encabezado principal (h1): agrega uno con ${k}.`);
  }
  if (page.seo && !text.containsPhrase(keyword, page.metaDescription)) {
    acts.push(page.metaDescription ? `Menciona ${k} en la meta descripción.` : `Escribe una meta descripción (70-160 caracteres) que incluya ${k}.`);
  }
  if (page.wordCount && page.wordCount < 400) {
    acts.push(`Amplía el texto: tiene ${page.wordCount} palabras; las páginas que compiten por esto suelen pasar de 600.`);
  } else if (!text.containsPhrase(keyword, page.text)) {
    acts.push(`Responde ${k} literalmente en el texto, en un párrafo o una pregunta frecuente.`);
  }
  if (page.avgScroll != null && page.avgScroll < 40) {
    acts.push(`Sube lo importante: las visitas solo ven el ${page.avgScroll}% de esta página.`);
  }
  return acts;
}

function newPageActions(keyword, intent) {
  const kind = intent === 'informational' ? 'un artículo que responda' : 'una página dedicada a';
  return [
    `Crea ${kind} "${keyword}", con la frase en el título, el h1 y la URL.`,
    'Enlázala desde tu página de inicio y desde las páginas más visitadas.',
    intent === 'informational' ? 'Puedes publicarlo en Web > Artículos.' : 'Incluye precio o forma de contacto: es una búsqueda con intención de compra.'
  ];
}

function score(c) {
  const vol = c.searchVolume || 0;
  const diff = c.difficulty == null ? 40 : c.difficulty;
  const target = c.position && c.position <= 20 ? Math.max(1, Math.min(3, c.position - 3)) : (diff < 30 ? 3 : 5);
  const gainCtr = Math.max(0, ctrAt(target) - ctrAt(c.position));
  const ease = c.category === 'cerca' ? 1 - diff / 200 : 1 - diff / 110;
  const visits = vol * gainCtr * Math.max(0.05, ease);
  const fit = c.fit == null ? 0.5 : c.fit;
  const w = INTENT_WEIGHT[c.intent] || 1;
  // Tracker searches with no volume still deserve a place: real people typed them.
  const observed = c.trackerSessions ? Math.log2(1 + c.trackerSessions) * 3 : 0;
  return { estimatedVisits: Math.round(visits), score: Math.round((visits + observed) * w * (0.35 + 0.65 * fit) * 10) / 10 };
}

/**
 * settings: seo_settings row (or null). Returns the whole Keywords payload.
 * opts.useApi=false skips DataForSEO (no budget / not configured).
 */
async function buildSuggestions(pool, siteId, settings, opts = {}) {
  const ctx = { pool, siteId };
  const notes = [];
  const pages = await loadPages(pool, siteId);
  const searches = await trackerSearches(pool, siteId);
  const phrases = text.keyPhrases(pages);
  // Multi-word phrases make better research seeds than single (often
  // navigational) words like "contacto" or "precios".
  const NAV = new Set(['contacto', 'precios', 'inicio', 'blog', 'planes', 'nosotros', 'servicios', 'productos', 'home', 'about']);
  const multi = phrases.site.filter((p) => p.phrase.includes(' '));
  const single = phrases.site.filter((p) => !p.phrase.includes(' ') && !NAV.has(p.phrase));
  const seeds = [...multi, ...single].slice(0, 20).map((p) => p.phrase);

  const candidates = new Map(); // keyword -> candidate
  const add = (c) => {
    const k = dfs.normalizeKeyword(c.keyword);
    if (!k || k.length < 3) return;
    const prev = candidates.get(k);
    // The category with more evidence wins: cerca > brecha > rastreador > nueva.
    const rank = { posicionada: 5, cerca: 4, brecha: 3, rastreador: 2, nueva: 1 };
    if (!prev) candidates.set(k, Object.assign({ keyword: k }, c, { keyword: k }));
    else {
      const merged = Object.assign({}, prev);
      for (const [f, v] of Object.entries(c)) if (merged[f] == null && v != null) merged[f] = v;
      if (rank[c.category] > rank[prev.category]) merged.category = c.category;
      candidates.set(k, merged);
    }
  };

  searches.forEach((s) => add({ keyword: s.keyword, category: 'rastreador', trackerSessions: s.sessions, landingPath: s.landing_path }));

  const market = settings && { locationCode: settings.location_code, languageCode: settings.language_code };
  const useApi = opts.useApi !== false && settings && settings.domain && dfs.isConfigured();
  let competitors = [];
  if (!dfs.isConfigured()) notes.push('Sin DataForSEO: las sugerencias salen solo de tu contenido y de las búsquedas que ya registró el rastreador, sin volumen ni dificultad.');
  else if (!settings || !settings.domain) notes.push('Configura el dominio de tu sitio para traer volúmenes, posiciones y competencia.');

  if (useApi) {
    const week = 24 * 7;
    const tasks = [
      dfs.cached(pool, 'ranked', [settings.domain, market], week, () => dfs.rankedKeywords(market, settings.domain, 300, ctx))
        .then((r) => r.data.items.forEach((i) => add(Object.assign({}, i, {
          category: i.position <= 3 ? 'posicionada' : i.position <= 20 ? 'cerca' : 'nueva', rankedPath: i.path
        })))),
      seeds.length ? dfs.cached(pool, 'ideas', [seeds.slice(0, 10), market], week, () => dfs.keywordIdeas(market, seeds.slice(0, 10), 200, ctx))
        .then((r) => r.data.forEach((i) => add(Object.assign({}, i, { category: 'nueva' })))) : null
    ];
    const compNames = (settings.competitors || []).length ? settings.competitors
      : await dfs.cached(pool, 'competitors', [settings.domain, market], week, () => dfs.competitorsDomain(market, settings.domain, 5, ctx))
        .then((r) => { competitors = r.data; return r.data.slice(0, 2).map((c) => c.domain); })
        .catch((err) => { notes.push(err.message); return []; });
    compNames.slice(0, 2).forEach((comp) => tasks.push(
      dfs.cached(pool, 'gap', [settings.domain, comp, market], week, () => dfs.keywordGap(market, settings.domain, comp, 100, ctx))
        .then((r) => r.data.forEach((i) => add(Object.assign({}, i, { category: 'brecha' }))))
    ));
    const results = await Promise.allSettled(tasks.filter(Boolean));
    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason.message);
    if (failed.length) notes.push(...new Set(failed));

    // Volumes for tracker searches and seeds the calls above didn't cover.
    const missing = [...candidates.values()].filter((c) => c.searchVolume == null).map((c) => c.keyword).slice(0, 200);
    if (missing.length) {
      try {
        const r = await dfs.cached(pool, 'overview', [missing, market], week, () => dfs.keywordOverview(market, missing, ctx));
        r.data.forEach((m) => { if (candidates.has(m.keyword)) add(m); });
      } catch (err) { notes.push(err.message); }
    }
  } else {
    seeds.forEach((s) => add({ keyword: s, category: 'nueva' }));
  }

  // Already in the top 3: nothing to suggest (they show up in Posiciones).
  const tracked = new Set((await pool.query('SELECT keyword FROM seo_keywords WHERE site_id = $1', [siteId])).rows.map((r) => r.keyword));
  const prelim = [];
  for (const c of candidates.values()) {
    if (c.category === 'posicionada') continue;
    if (c.position && c.position <= 3) continue;
    if (c.intent === 'navigational' && c.category !== 'rastreador') continue;
    const match = c.rankedPath ? pages.find((p) => p.path === c.rankedPath) : null;
    const best = match ? { page: match, fit: 1 } : bestPage(c.keyword, pages);
    // A new keyword must fit what the business does, or it's noise.
    const fit = best ? best.fit : (c.category === 'brecha' ? 0.25 : 0);
    if (c.category === 'nueva' && fit < 0.3) continue;
    prelim.push({ c, best, fit, s: score(Object.assign({}, c, { fit })) });
  }
  prelim.sort((a, b) => b.s.score - a.s.score);

  // One page, one main search: the best-scoring keyword for a page gets the
  // title/h1 changes; the others get a section on it, or a page of their own
  // when they fit it loosely (otherwise they'd cannibalize each other).
  const claimed = new Map(); // path -> keyword that owns its title
  const out = [];
  for (const { c, best, fit, s } of prelim) {
    let actions, targetPath = best ? best.page.path : null;
    if (best && best.fit >= 0.3) {
      const page = best.page;
      const owner = claimed.get(page.path);
      const alreadyInTitle = text.containsPhrase(c.keyword, page.title);
      if (!owner || alreadyInTitle) {
        if (!owner) claimed.set(page.path, c.keyword);
        actions = pageActions(c.keyword, page);
      } else if (best.fit >= 0.6 || c.position) {
        actions = [
          `Agrega en ${page.path} una sección con un subtítulo (h2) que diga "${c.keyword}" y responda esa búsqueda; el título de la página ya apunta a "${owner}".`,
          `Enlaza a esa sección desde otras páginas con el texto "${c.keyword}".`
        ];
      } else {
        targetPath = null;
        actions = newPageActions(c.keyword, c.intent);
      }
    } else {
      actions = newPageActions(c.keyword, c.intent);
    }
    const reasons = [];
    if (c.category === 'cerca') reasons.push(`Ya apareces en la posición ${c.position}: subir a la primera mitad de la página multiplica las visitas.`);
    if (c.category === 'brecha') reasons.push(`${c.competitor} aparece en la posición ${c.competitorPosition} y tú no apareces.`);
    if (c.trackerSessions) reasons.push(`${c.trackerSessions} visitas llegaron buscando esto.`);
    if (c.searchVolume) reasons.push(`${c.searchVolume.toLocaleString('es')} búsquedas al mes${c.difficulty != null ? `, dificultad ${c.difficulty}/100` : ''}.`);
    out.push({
      keyword: c.keyword,
      category: c.category,
      categoryLabel: CATEGORY_LABEL[c.category],
      searchVolume: c.searchVolume ?? null,
      difficulty: c.difficulty ?? null,
      cpc: c.cpc ?? null,
      intent: c.intent || null,
      position: c.position ?? null,
      competitor: c.competitor || null,
      competitorPosition: c.competitorPosition ?? null,
      trackerSessions: c.trackerSessions || 0,
      monthlySearches: c.monthlySearches || [],
      targetPath,
      fit: Math.round(fit * 100) / 100,
      tracked: tracked.has(c.keyword),
      estimatedVisits: s.estimatedVisits,
      score: s.score,
      reasons,
      actions
    });
  }
  out.sort((a, b) => b.score - a.score);

  // Pages with traffic that don't target any searchable phrase in their title.
  const untargeted = pages
    .filter((p) => p.pageviews >= 5 && p.seo)
    .filter((p) => !out.some((s) => s.targetPath === p.path && text.containsPhrase(s.keyword, p.title)))
    .slice(0, 10)
    .map((p) => {
      const top = (phrases.byPage.find((b) => b.path === p.path) || { phrases: [] }).phrases.slice(0, 3).map((x) => x.phrase);
      return { path: p.path, title: p.title, pageviews: p.pageviews, candidates: top };
    });

  return {
    configured: dfs.isConfigured(),
    domain: settings ? settings.domain : null,
    generatedAt: new Date().toISOString(),
    seeds,
    competitors,
    notes,
    counts: out.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {}),
    suggestions: out.slice(0, 100),
    untargetedPages: untargeted
  };
}

module.exports = { buildSuggestions, loadPages, bestPage, pageActions, score, ctrAt, CATEGORY_LABEL };
