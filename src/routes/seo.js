// SEO endpoints for Web > Keywords / Posiciones / Competencia / Páginas:
// keyword suggestions and research, rank tracking, competitors, keyword gap,
// backlinks and the on-page audit. Mounted by routes/api.js under
// /sites/:siteId (already JWT-checked against the token's site_id there).
//
// Paid data comes from DataForSEO (lib/dataforseo.js), cached in
// seo_api_cache and capped per site by seo_settings.monthly_budget_usd.
// Writes (settings, tracked keywords) need the editor role or above.
'use strict';

const express = require('express');
const pool = require('../config/db');
const dfs = require('../lib/dataforseo');
const { buildSuggestions } = require('../lib/seoSuggest');
const { auditPages } = require('../lib/seoPages');

const router = express.Router({ mergeParams: true });
const WEEK = 24 * 7;
const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };

function requireEditor(req, res, next) {
  if ((ROLE_RANK[req.account.role] || 0) < ROLE_RANK.editor) return res.status(403).json({ error: 'Tu rol no permite cambiar esto.' });
  next();
}

// DataForSEO problems are expected states (no key, budget reached), not 500s.
function seoErrors(err, req, res, next) {
  if (err instanceof dfs.SeoError) return res.status(err.status).json({ error: err.message, code: err.code });
  next(err);
}

const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
function cleanDomain(v) {
  const d = String(v || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/[/?#].*$/, '').replace(/:\d+$/, '').replace(/^www\./, '');
  return DOMAIN_RE.test(d) ? d : null;
}

async function getSettings(siteId) {
  const { rows } = await pool.query('SELECT * FROM seo_settings WHERE site_id = $1', [siteId]);
  return rows[0] || null;
}

// The public hostname most tracked visits landed on (same rule as /seo-audit).
async function guessDomain(siteId) {
  const { rows } = await pool.query(
    `SELECT lower(substring(landing_page from '^https?://([^/?#:]+)')) AS host, COUNT(*) AS n
     FROM sessions WHERE site_id = $1 AND landing_page ~* '^https?://'
     GROUP BY 1 ORDER BY n DESC LIMIT 5`,
    [siteId]
  );
  return rows.map((r) => cleanDomain(r.host)).find((h) => h && !/(^|\.)(localhost|local|railway\.app|vercel\.app|netlify\.app)$/.test(h)) || null;
}

function marketOf(s) { return { locationCode: s.location_code, languageCode: s.language_code }; }

async function requireSettings(req, res) {
  const s = await getSettings(req.params.siteId);
  if (!s) { res.status(409).json({ error: 'Configura primero el dominio de tu sitio.', code: 'no_settings' }); return null; }
  return s;
}

// ---------------------------------------------------------------------------
// Settings + spend
// ---------------------------------------------------------------------------

router.get('/seo/settings', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const [s, budget] = await Promise.all([getSettings(siteId), dfs.budgetFor(pool, siteId)]);
    res.json({
      configured: dfs.isConfigured(),
      settings: s ? {
        domain: s.domain, locationCode: s.location_code, languageCode: s.language_code, device: s.device,
        competitors: s.competitors, monthlyBudgetUsd: Number(s.monthly_budget_usd)
      } : null,
      suggestedDomain: s ? null : await guessDomain(siteId),
      spend: { monthUsd: Math.round(budget.spent * 1000) / 1000, budgetUsd: budget.budget }
    });
  } catch (err) { next(err); }
});

router.put('/seo/settings', requireEditor, async (req, res, next) => {
  const { siteId } = req.params;
  const b = req.body || {};
  const domain = cleanDomain(b.domain);
  if (!domain) return res.status(400).json({ error: 'Dominio inválido (ej. miempresa.com).' });
  const competitors = [...new Set((Array.isArray(b.competitors) ? b.competitors : []).map(cleanDomain).filter((d) => d && d !== domain))].slice(0, 5);
  const location = Number.isInteger(b.locationCode) && b.locationCode > 0 ? b.locationCode : 2320;
  const language = /^[a-z]{2}(-[a-z]{2})?$/i.test(b.languageCode || '') ? b.languageCode.toLowerCase() : 'es';
  const device = b.device === 'desktop' ? 'desktop' : 'mobile';
  // The budget is AndRho's money: only the account owner can raise it, up to 50.
  const budget = req.account.role === 'owner' && Number(b.monthlyBudgetUsd) > 0 ? Math.min(50, Number(b.monthlyBudgetUsd)) : null;
  try {
    await pool.query(
      `INSERT INTO seo_settings (site_id, domain, location_code, language_code, device, competitors, monthly_budget_usd)
       VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, 5))
       ON CONFLICT (site_id) DO UPDATE SET domain = EXCLUDED.domain, location_code = EXCLUDED.location_code,
         language_code = EXCLUDED.language_code, device = EXCLUDED.device, competitors = EXCLUDED.competitors,
         monthly_budget_usd = COALESCE($7, seo_settings.monthly_budget_usd), updated_at = now()`,
      [siteId, domain, location, language, device, competitors, budget]
    );
    res.json({ ok: true, domain, competitors });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Keyword suggestions + research
// ---------------------------------------------------------------------------

router.get('/seo/suggestions', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const s = await getSettings(siteId);
    const key = ['suggestions', siteId, s && s.domain, s && s.competitors, s && s.location_code];
    // The heavy calls are cached a week inside; this caches the computed list a day.
    const ttl = req.query.refresh === '1' ? 0 : 24;
    const r = await dfs.cached(pool, 'suggestions', key, ttl, () => buildSuggestions(pool, siteId, s));
    // `tracked` may have changed since the list was cached.
    const tracked = new Set((await pool.query('SELECT keyword FROM seo_keywords WHERE site_id = $1', [siteId])).rows.map((x) => x.keyword));
    r.data.suggestions.forEach((x) => { x.tracked = tracked.has(x.keyword); });
    res.json(r.data);
  } catch (err) { next(err); }
});

router.get('/seo/research', async (req, res, next) => {
  const q = dfs.normalizeKeyword(req.query.q).slice(0, 80);
  if (q.length < 2) return res.status(400).json({ error: 'Escribe una palabra o frase.' });
  try {
    const s = await requireSettings(req, res);
    if (!s) return;
    const ctx = { pool, siteId: req.params.siteId };
    const m = marketOf(s);
    const [sugg, related] = await Promise.all([
      dfs.cached(pool, 'kw-suggest', [q, m], WEEK, () => dfs.keywordSuggestions(m, q, 100, ctx)),
      dfs.cached(pool, 'kw-related', [q, m], WEEK, () => dfs.relatedKeywords(m, q, 100, ctx))
    ]);
    // Interleave both sources so neither crowds the other out (as OpenSEO does).
    const rows = [], seen = new Set();
    for (let i = 0; i < Math.max(sugg.data.length, related.data.length) && rows.length < 150; i++) {
      for (const r of [sugg.data[i], related.data[i]]) {
        if (r && !seen.has(r.keyword)) { seen.add(r.keyword); rows.push(r); }
      }
    }
    const tracked = new Set((await pool.query('SELECT keyword FROM seo_keywords WHERE site_id = $1', [req.params.siteId])).rows.map((x) => x.keyword));
    rows.forEach((r) => { r.tracked = tracked.has(r.keyword); });
    res.json({ query: q, keywords: rows, fetchedAt: sugg.fetchedAt });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Rank tracking (positions are checked by WebTracker's rankWorker)
// ---------------------------------------------------------------------------

router.get('/seo/keywords', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const s = await getSettings(siteId);
    const { rows } = await pool.query(
      `SELECT k.id, k.keyword, k.source, k.target_path, k.tracked, k.created_at,
              m.search_volume, m.difficulty, m.intent, m.cpc,
              last.position, last.url, last.checked_at, last.error, last.serp_features,
              prev.position AS prev_position,
              best.best_position,
              COALESCE(hist.points, '[]') AS history
       FROM seo_keywords k
       LEFT JOIN seo_keyword_metrics m ON m.keyword = k.keyword AND m.location_code = $2 AND m.language_code = $3
       LEFT JOIN LATERAL (SELECT position, url, checked_at, error, serp_features FROM seo_rank_checks c
                          WHERE c.site_id = k.site_id AND c.keyword = k.keyword AND c.error IS NULL
                          ORDER BY checked_at DESC LIMIT 1) last ON true
       LEFT JOIN LATERAL (SELECT position FROM seo_rank_checks c
                          WHERE c.site_id = k.site_id AND c.keyword = k.keyword AND c.error IS NULL
                            AND c.checked_at <= now() - interval '6 days'
                          ORDER BY checked_at DESC LIMIT 1) prev ON true
       LEFT JOIN LATERAL (SELECT MIN(position) AS best_position FROM seo_rank_checks c
                          WHERE c.site_id = k.site_id AND c.keyword = k.keyword) best ON true
       LEFT JOIN LATERAL (SELECT json_agg(json_build_object('d', d, 'p', p) ORDER BY d) AS points FROM (
                            SELECT date_trunc('day', checked_at)::date AS d, MIN(position) AS p FROM seo_rank_checks c
                            WHERE c.site_id = k.site_id AND c.keyword = k.keyword AND c.error IS NULL
                              AND c.checked_at >= now() - interval '90 days'
                            GROUP BY 1) h) hist ON true
       WHERE k.site_id = $1
       ORDER BY k.tracked DESC, last.position ASC NULLS LAST, k.keyword`,
      [siteId, s ? s.location_code : 2320, s ? s.language_code : 'es']
    );
    const ranked = rows.filter((r) => r.position != null);
    res.json({
      configured: dfs.isConfigured(),
      hasSettings: Boolean(s),
      device: s ? s.device : null,
      summary: {
        tracked: rows.filter((r) => r.tracked).length,
        top3: ranked.filter((r) => r.position <= 3).length,
        top10: ranked.filter((r) => r.position <= 10).length,
        avgPosition: ranked.length ? Math.round((ranked.reduce((a, r) => a + r.position, 0) / ranked.length) * 10) / 10 : null,
        improved: rows.filter((r) => r.position != null && r.prev_position != null && r.position < r.prev_position).length,
        declined: rows.filter((r) => r.prev_position != null && (r.position == null || r.position > r.prev_position)).length
      },
      keywords: rows
    });
  } catch (err) { next(err); }
});

router.post('/seo/keywords', requireEditor, async (req, res, next) => {
  const { siteId } = req.params;
  const b = req.body || {};
  const list = [...new Set((Array.isArray(b.keywords) ? b.keywords : [b.keyword]).map(dfs.normalizeKeyword).filter((k) => k && k.length <= 80))];
  if (!list.length) return res.status(400).json({ error: 'Falta la palabra clave.' });
  const source = ['manual', 'sugerida', 'posicionada', 'rastreador'].includes(b.source) ? b.source : 'manual';
  const targetPath = typeof b.targetPath === 'string' && b.targetPath.startsWith('/') ? b.targetPath.slice(0, 300) : null;
  try {
    const { rows: [{ n }] } = await pool.query('SELECT COUNT(*)::int AS n FROM seo_keywords WHERE site_id = $1 AND tracked', [siteId]);
    const max = parseInt(process.env.SEO_MAX_TRACKED_KEYWORDS || '100', 10);
    if (n + list.length > max) return res.status(409).json({ error: `Puedes seguir hasta ${max} palabras clave.` });
    await pool.query(
      `INSERT INTO seo_keywords (site_id, keyword, source, target_path)
       SELECT $1, k, $3, $4 FROM unnest($2::text[]) k
       ON CONFLICT (site_id, keyword) DO UPDATE SET tracked = true, target_path = COALESCE(EXCLUDED.target_path, seo_keywords.target_path)`,
      [siteId, list, source, targetPath]
    );
    // Fill search metrics now (one cheap call) so the table isn't blank until tomorrow.
    const s = await getSettings(siteId);
    if (s && dfs.isConfigured()) {
      const m = marketOf(s);
      const missing = (await pool.query(
        `SELECT k FROM unnest($1::text[]) k WHERE NOT EXISTS (SELECT 1 FROM seo_keyword_metrics m
           WHERE m.keyword = k AND m.location_code = $2 AND m.language_code = $3 AND m.fetched_at > now() - interval '30 days')`,
        [list, m.locationCode, m.languageCode])).rows.map((r) => r.k);
      if (missing.length) {
        try {
          await saveMetrics(m, await dfs.keywordOverview(m, missing, { pool, siteId }));
        } catch (err) { if (!(err instanceof dfs.SeoError)) throw err; }
      }
    }
    res.status(201).json({ ok: true, added: list });
  } catch (err) { next(err); }
});

async function saveMetrics(m, rows) {
  for (const r of rows) {
    await pool.query(
      `INSERT INTO seo_keyword_metrics (keyword, location_code, language_code, search_volume, cpc, competition, difficulty, intent, monthly_searches, fetched_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       ON CONFLICT (keyword, location_code, language_code) DO UPDATE SET search_volume = EXCLUDED.search_volume, cpc = EXCLUDED.cpc,
         competition = EXCLUDED.competition, difficulty = EXCLUDED.difficulty, intent = EXCLUDED.intent,
         monthly_searches = EXCLUDED.monthly_searches, fetched_at = now()`,
      [r.keyword, m.locationCode, m.languageCode, r.searchVolume, r.cpc, r.competition, r.difficulty, r.intent, JSON.stringify(r.monthlySearches || [])]
    );
  }
}

router.delete('/seo/keywords/:id', requireEditor, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM seo_keywords WHERE id = $1 AND site_id = $2', [req.params.id, req.params.siteId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Competition: domain overview, competitors, keyword gap, backlinks
// ---------------------------------------------------------------------------

router.get('/seo/competition', async (req, res, next) => {
  try {
    const s = await requireSettings(req, res);
    if (!s) return;
    const ctx = { pool, siteId: req.params.siteId };
    const m = marketOf(s);
    const settled = await Promise.allSettled([
      dfs.cached(pool, 'overview-domain', [s.domain, m], 24, () => dfs.domainOverview(m, s.domain, ctx)),
      dfs.cached(pool, 'competitors', [s.domain, m], WEEK, () => dfs.competitorsDomain(m, s.domain, 5, ctx)),
      dfs.cached(pool, 'backlinks', [s.domain], WEEK, () => dfs.backlinksSummary(s.domain, ctx)),
      dfs.cached(pool, 'ref-domains', [s.domain], WEEK, () => dfs.referringDomains(s.domain, 20, ctx))
    ]);
    const val = (i) => (settled[i].status === 'fulfilled' ? settled[i].value.data : null);
    const errors = [...new Set(settled.filter((x) => x.status === 'rejected').map((x) => x.reason.message))];
    if (errors.length === settled.length) {
      const e = settled[0].reason;
      if (e instanceof dfs.SeoError) throw e;
    }
    // Compare against the client's chosen competitors, or the detected ones.
    const chosen = s.competitors.length ? s.competitors : (val(1) || []).slice(0, 3).map((c) => c.domain);
    const rivals = await Promise.all(chosen.map((d) =>
      dfs.cached(pool, 'overview-domain', [d, m], WEEK, () => dfs.domainOverview(m, d, ctx))
        .then((r) => Object.assign({ domain: d }, r.data)).catch(() => ({ domain: d }))));
    res.json({
      domain: s.domain, overview: val(0), competitors: val(1) || [], comparison: rivals,
      backlinks: val(2), referringDomains: val(3) || [], errors
    });
  } catch (err) { next(err); }
});

router.get('/seo/gap', async (req, res, next) => {
  try {
    const s = await requireSettings(req, res);
    if (!s) return;
    const competitor = cleanDomain(req.query.competitor);
    if (!competitor) return res.status(400).json({ error: 'Competidor inválido.' });
    const m = marketOf(s);
    const r = await dfs.cached(pool, 'gap', [s.domain, competitor, m], WEEK,
      () => dfs.keywordGap(m, s.domain, competitor, 100, { pool, siteId: req.params.siteId }));
    res.json({ domain: s.domain, competitor, keywords: r.data, fetchedAt: r.fetchedAt });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// On-page audit per tracked page (no paid data)
// ---------------------------------------------------------------------------

router.get('/seo/pages', async (req, res, next) => {
  try { res.json(await auditPages(pool, req.params.siteId)); } catch (err) { next(err); }
});

router.use(seoErrors);

module.exports = router;
