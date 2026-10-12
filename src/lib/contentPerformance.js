'use strict';

// Performance of a site's articles from the tracker's data: reading
// (pageviews, time, scroll depth, how many read to the end), how people
// arrive (organic search and the queries behind it, AI assistants), how
// often AI crawlers read them, and keyword cannibalization -- several
// articles competing for the same search.
//
// The articles themselves live in andrho-api; the dashboard sends their
// paths and target keywords here (POST /api/sites/:siteId/content-performance).

// A built page can be reached as /a/b.html or /a/b: count both as one path.
function pathVariants(p) {
  const out = new Set([p]);
  if (p.endsWith('.html')) out.add(p.slice(0, -5));
  else if (!p.endsWith('/')) out.add(`${p}.html`);
  return [...out];
}

const normKeyword = (k) => String(k || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

async function contentPerformance(pool, siteId, articles) {
  const owner = new Map(); // tracked path -> article path
  for (const a of articles) for (const v of pathVariants(a.path)) owner.set(v, a.path);
  const paths = [...owner.keys()];

  const [reading, depth, entries, queries, crawlers, daily] = await Promise.all([
    pool.query(
      `SELECT pv.path,
              COUNT(*)::int AS pageviews,
              COUNT(DISTINCT s.visitor_id)::int AS visitors,
              ROUND(AVG(pv.duration_ms))::int AS avg_duration_ms,
              ROUND(AVG(pv.max_scroll_percent))::int AS avg_scroll,
              COUNT(*) FILTER (WHERE pv.max_scroll_percent >= 90)::int AS read_to_end,
              COUNT(*) FILTER (WHERE pv.entered_at >= now() - interval '30 days')::int AS views_30d,
              COUNT(*) FILTER (WHERE pv.entered_at >= now() - interval '60 days' AND pv.entered_at < now() - interval '30 days')::int AS views_prev_30d
         FROM pageviews pv JOIN sessions s ON s.id = pv.session_id
        WHERE pv.site_id = $1 AND pv.path = ANY($2)
        GROUP BY pv.path`,
      [siteId, paths]
    ),
    // Share of readers that reached each 10% of the page.
    pool.query(
      `SELECT path, b AS depth, COUNT(*) FILTER (WHERE max_scroll_percent >= b)::int AS reached, COUNT(*)::int AS total
         FROM pageviews, generate_series(10, 100, 10) b
        WHERE site_id = $1 AND path = ANY($2)
        GROUP BY path, b`,
      [siteId, paths]
    ),
    pool.query(
      `SELECT landing_path AS path,
              COUNT(*)::int AS entrances,
              COUNT(*) FILTER (WHERE traffic_source_type = 'organic_search')::int AS organic,
              COUNT(*) FILTER (WHERE traffic_source_type = 'ai_referral')::int AS ai_referrals,
              COUNT(*) FILTER (WHERE traffic_source_type = 'referral')::int AS referrals
         FROM sessions
        WHERE site_id = $1 AND landing_path = ANY($2)
        GROUP BY landing_path`,
      [siteId, paths]
    ),
    pool.query(
      `SELECT landing_path AS path, lower(search_keywords) AS query, COUNT(*)::int AS sessions
         FROM sessions
        WHERE site_id = $1 AND landing_path = ANY($2) AND coalesce(search_keywords, '') <> ''
        GROUP BY landing_path, lower(search_keywords)`,
      [siteId, paths]
    ),
    pool.query(
      `SELECT path, bot_name, COUNT(*)::int AS hits, MAX(occurred_at) AS last_seen
         FROM bot_visits
        WHERE site_id = $1 AND path = ANY($2) AND traffic_source_type = 'ai_crawler'
        GROUP BY path, bot_name`,
      [siteId, paths]
    ),
    pool.query(
      `SELECT path, entered_at::date AS day, COUNT(*)::int AS views
         FROM pageviews
        WHERE site_id = $1 AND path = ANY($2) AND entered_at >= now() - interval '30 days'
        GROUP BY path, entered_at::date`,
      [siteId, paths]
    )
  ]);

  const byArticle = new Map(articles.map((a) => [a.path, {
    path: a.path, pageviews: 0, visitors: 0, avgDurationMs: null, avgScroll: null, readToEnd: 0,
    views30d: 0, viewsPrev30d: 0, depth: [], entrances: 0, organic: 0, aiReferrals: 0, referrals: 0,
    queries: [], aiCrawlers: [], aiCrawlerHits: 0, daily: []
  }]));
  const get = (p) => byArticle.get(owner.get(p));

  // Two variants of the same path are merged: sums, and weighted averages.
  for (const r of reading.rows) {
    const a = get(r.path);
    const n = a.pageviews + r.pageviews;
    a.avgDurationMs = Math.round(((a.avgDurationMs || 0) * a.pageviews + r.avg_duration_ms * r.pageviews) / n);
    a.avgScroll = Math.round(((a.avgScroll || 0) * a.pageviews + r.avg_scroll * r.pageviews) / n);
    a.pageviews = n;
    a.visitors += r.visitors;
    a.readToEnd += r.read_to_end;
    a.views30d += r.views_30d;
    a.viewsPrev30d += r.views_prev_30d;
  }
  const depthAcc = new Map();
  for (const r of depth.rows) {
    const key = `${owner.get(r.path)}|${r.depth}`;
    const d = depthAcc.get(key) || { reached: 0, total: 0 };
    d.reached += r.reached; d.total += r.total;
    depthAcc.set(key, d);
  }
  for (const [key, d] of depthAcc) {
    const [p, b] = key.split('|');
    byArticle.get(p).depth.push({ depth: Number(b), percent: d.total ? Math.round((100 * d.reached) / d.total) : 0 });
  }
  for (const r of entries.rows) {
    const a = get(r.path);
    a.entrances += r.entrances; a.organic += r.organic; a.aiReferrals += r.ai_referrals; a.referrals += r.referrals;
  }
  for (const r of queries.rows) get(r.path).queries.push({ query: r.query, sessions: r.sessions });
  for (const r of crawlers.rows) {
    const a = get(r.path);
    a.aiCrawlers.push({ bot: r.bot_name, hits: r.hits, lastSeen: r.last_seen });
    a.aiCrawlerHits += r.hits;
  }
  for (const r of daily.rows) get(r.path).daily.push({ day: r.day, views: r.views });

  for (const a of byArticle.values()) {
    a.depth.sort((x, y) => x.depth - y.depth);
    a.queries = mergeBy(a.queries, 'query', 'sessions');
    a.aiCrawlers = mergeBy(a.aiCrawlers, 'bot', 'hits');
    a.daily = mergeBy(a.daily.map((d) => ({ ...d, day: new Date(d.day).toISOString().slice(0, 10) })), 'day', 'views')
      .sort((x, y) => x.day.localeCompare(y.day));
    a.readToEndPercent = a.pageviews ? Math.round((100 * a.readToEnd) / a.pageviews) : null;
  }

  return {
    articles: [...byArticle.values()],
    cannibalization: cannibalization(articles, byArticle)
  };
}

function mergeBy(rows, key, sum) {
  const m = new Map();
  for (const r of rows) {
    const cur = m.get(r[key]);
    if (cur) cur[sum] += r[sum];
    else m.set(r[key], { ...r });
  }
  return [...m.values()].sort((a, b) => (b[sum] > a[sum] ? 1 : b[sum] < a[sum] ? -1 : 0));
}

// Two signals, strongest first:
//  - observed: the same search query brought visitors to two or more
//    articles -- they compete in the results and split the clicks.
//  - targeted: two or more articles declare the same target keyword, so
//    they will compete once they rank.
function cannibalization(articles, byArticle) {
  const out = [];

  const byQuery = new Map();
  for (const a of byArticle.values()) {
    for (const q of a.queries) {
      const k = normKeyword(q.query);
      if (!byQuery.has(k)) byQuery.set(k, { keyword: q.query, pages: [] });
      byQuery.get(k).pages.push({ path: a.path, sessions: q.sessions });
    }
  }
  for (const { keyword, pages } of byQuery.values()) {
    if (pages.length < 2) continue;
    const total = pages.reduce((n, p) => n + p.sessions, 0);
    const top = Math.max(...pages.map((p) => p.sessions));
    pages.sort((x, y) => y.sessions - x.sessions);
    out.push({
      type: 'observed', keyword, sessions: total,
      pages: pages.map((p) => ({ ...p, share: Math.round((100 * p.sessions) / total) })),
      // An even split hurts most: nobody becomes "the" page for the query.
      severity: total >= 3 && top / total < 0.7 ? 'alta' : 'media'
    });
  }

  const byTarget = new Map();
  for (const a of articles) {
    for (const k of a.keywords || []) {
      const n = normKeyword(k);
      if (!n) continue;
      if (!byTarget.has(n)) byTarget.set(n, { keyword: k, paths: new Set() });
      byTarget.get(n).paths.add(a.path);
    }
  }
  for (const [n, { keyword, paths }] of byTarget) {
    if (paths.size < 2) continue;
    if (out.some((c) => normKeyword(c.keyword) === n)) continue;
    out.push({ type: 'targeted', keyword, pages: [...paths].map((p) => ({ path: p })), severity: 'baja' });
  }

  const rank = { alta: 0, media: 1, baja: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || (b.sessions || 0) - (a.sessions || 0));
}

module.exports = { contentPerformance, normKeyword };
