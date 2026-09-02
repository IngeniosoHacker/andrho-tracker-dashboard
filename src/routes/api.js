'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.use(express.json());

// ---------------------------------------------------------------------------
// Auth: every /sites/:siteId/* route below requires a valid JWT (issued by
// andrho-api) AND that the token's site_id matches the :siteId in the URL.
// This replaces the old "know the site_id" gate entirely -- there is no more
// unauthenticated GET /api/sites (it listed every client's site) and no more
// GET /api/sites/:siteId/verify (the old login screen's existence check).
// ---------------------------------------------------------------------------
router.use('/sites/:siteId', requireAuth, (req, res, next) => {
  if (req.params.siteId !== req.account.siteId) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
});

// ---------------------------------------------------------------------------
// Overview (KPI cards)
// ---------------------------------------------------------------------------

router.get('/sites/:siteId/overview', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const [
      site, totals, last30d, avgSession, avgPage, traffic, topLanding, lastSeen
    ] = await Promise.all([
      pool.query('SELECT id, name, created_at FROM sites WHERE id = $1', [siteId]),
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM sessions WHERE site_id = $1) AS total_sessions,
           (SELECT COUNT(*) FROM pageviews WHERE site_id = $1) AS total_pageviews,
           (SELECT COUNT(DISTINCT visitor_id) FROM sessions WHERE site_id = $1) AS unique_visitors`,
        [siteId]
      ),
      pool.query(
        `SELECT COUNT(*) AS sessions_last_30d
         FROM sessions WHERE site_id = $1 AND started_at >= now() - interval '30 days'`,
        [siteId]
      ),
      pool.query(
        `SELECT ROUND(AVG(duration_ms)) AS avg_session_duration_ms
         FROM sessions WHERE site_id = $1 AND duration_ms IS NOT NULL AND duration_ms > 0`,
        [siteId]
      ),
      pool.query(
        `SELECT ROUND(AVG(duration_ms)) AS avg_pageview_duration_ms, ROUND(AVG(max_scroll_percent)) AS avg_max_scroll_percent
         FROM pageviews WHERE site_id = $1`,
        [siteId]
      ),
      pool.query(
        `SELECT traffic_source_type, COUNT(*) AS sessions
         FROM sessions WHERE site_id = $1
         GROUP BY traffic_source_type ORDER BY sessions DESC`,
        [siteId]
      ),
      pool.query(
        `SELECT landing_path, COUNT(*) AS sessions
         FROM sessions WHERE site_id = $1 AND landing_path IS NOT NULL
         GROUP BY landing_path ORDER BY sessions DESC LIMIT 5`,
        [siteId]
      ),
      pool.query('SELECT MAX(started_at) AS last_activity FROM sessions WHERE site_id = $1', [siteId])
    ]);

    if (!site.rows.length) return res.status(404).json({ error: 'site not found' });

    res.json({
      site: site.rows[0],
      totals: totals.rows[0],
      sessionsLast30d: Number(last30d.rows[0].sessions_last_30d),
      avgSessionDurationMs: avgSession.rows[0].avg_session_duration_ms,
      avgPageviewDurationMs: avgPage.rows[0].avg_pageview_duration_ms,
      avgMaxScrollPercent: avgPage.rows[0].avg_max_scroll_percent,
      trafficBreakdown: traffic.rows,
      topLandingPages: topLanding.rows,
      lastActivity: lastSeen.rows[0].last_activity
    });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Sessions (list + detail with full navigation path + scroll segments)
// ---------------------------------------------------------------------------

router.get('/sites/:siteId/sessions', async (req, res, next) => {
  const { siteId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = parseInt(req.query.offset || '0', 10);
  try {
    const { rows } = await pool.query(
      `SELECT id, visitor_id, landing_page, landing_path, referrer, referrer_domain,
              utm_source, utm_medium, utm_campaign,
              device_type, browser, os, country, city,
              search_engine, search_keywords, traffic_source_type, bot_name,
              started_at, ended_at, duration_ms, pageview_count, is_finished
       FROM sessions WHERE site_id = $1
       ORDER BY started_at DESC LIMIT $2 OFFSET $3`,
      [siteId, limit, offset]
    );
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM sessions WHERE site_id = $1', [siteId]);
    res.json({ sessions: rows, total: Number(countRows[0].count), limit, offset });
  } catch (err) { next(err); }
});

router.get('/sites/:siteId/sessions/:sessionId', async (req, res, next) => {
  const { siteId, sessionId } = req.params;
  try {
    const session = await pool.query('SELECT * FROM sessions WHERE id = $1 AND site_id = $2', [sessionId, siteId]);
    if (!session.rows.length) return res.status(404).json({ error: 'not found' });

    const pageviews = await pool.query(
      'SELECT * FROM pageviews WHERE session_id = $1 ORDER BY nav_index ASC',
      [sessionId]
    );
    const pageviewIds = pageviews.rows.map((p) => p.id);
    let scrollByPageview = {};
    if (pageviewIds.length) {
      const segments = await pool.query(
        'SELECT * FROM scroll_segments WHERE pageview_id = ANY($1) ORDER BY depth_bucket ASC',
        [pageviewIds]
      );
      scrollByPageview = segments.rows.reduce((acc, seg) => {
        (acc[seg.pageview_id] ||= []).push({ depthBucket: seg.depth_bucket, timeMs: seg.time_ms });
        return acc;
      }, {});
    }

    res.json({
      session: session.rows[0],
      path: pageviews.rows.map((p) => ({ ...p, scrollSegments: scrollByPageview[p.id] || [] }))
    });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Pages, traffic sources, geo, search keywords
// ---------------------------------------------------------------------------

router.get('/sites/:siteId/pages', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT path,
              COUNT(*) AS pageviews,
              ROUND(AVG(duration_ms)) AS avg_duration_ms,
              ROUND(AVG(max_scroll_percent)) AS avg_max_scroll_percent
       FROM pageviews WHERE site_id = $1
       GROUP BY path ORDER BY pageviews DESC LIMIT 50`,
      [siteId]
    );
    res.json({ pages: rows });
  } catch (err) { next(err); }
});

router.get('/sites/:siteId/traffic-sources', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(utm_source, referrer_domain, 'direct') AS source,
              COALESCE(utm_medium, 'none') AS medium,
              traffic_source_type,
              COUNT(*) AS sessions
       FROM sessions WHERE site_id = $1
       GROUP BY 1,2,3 ORDER BY sessions DESC LIMIT 25`,
      [siteId]
    );
    res.json({ trafficSources: rows });
  } catch (err) { next(err); }
});

router.get('/sites/:siteId/geo', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(country, 'unknown') AS country, COALESCE(city, 'unknown') AS city, COUNT(*) AS sessions
       FROM sessions WHERE site_id = $1
       GROUP BY 1,2 ORDER BY sessions DESC LIMIT 50`,
      [siteId]
    );
    res.json({ geo: rows });
  } catch (err) { next(err); }
});

router.get('/sites/:siteId/search-keywords', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(search_engine, 'unknown') AS search_engine,
              COALESCE(search_keywords, utm_term, '(not provided)') AS keywords,
              COUNT(*) AS sessions
       FROM sessions
       WHERE site_id = $1 AND traffic_source_type = 'organic_search'
       GROUP BY 1,2 ORDER BY sessions DESC LIMIT 50`,
      [siteId]
    );
    res.json({ keywords: rows });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// AI visibility (mirrors analytics-tracker's endpoint so this dashboard works
// standalone against the shared DB, without depending on the tracker's API)
// ---------------------------------------------------------------------------

router.get('/sites/:siteId/ai-visibility', async (req, res, next) => {
  const { siteId } = req.params;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01`;

  try {
    const [crawlerHits, crawlerSessions, referralSessions, goal, dailyTrend] = await Promise.all([
      pool.query(
        `SELECT bot_name, COUNT(*) AS hits FROM bot_visits
         WHERE site_id = $1 AND traffic_source_type = 'ai_crawler'
           AND occurred_at >= $2::date AND occurred_at < ($2::date + interval '1 month')
         GROUP BY bot_name ORDER BY hits DESC`,
        [siteId, monthStart]
      ),
      pool.query(
        `SELECT bot_name, COUNT(*) AS hits FROM sessions
         WHERE site_id = $1 AND traffic_source_type = 'ai_crawler'
           AND started_at >= $2::date AND started_at < ($2::date + interval '1 month')
         GROUP BY bot_name ORDER BY hits DESC`,
        [siteId, monthStart]
      ),
      pool.query(
        `SELECT bot_name AS ai_product, COUNT(*) AS sessions FROM sessions
         WHERE site_id = $1 AND traffic_source_type = 'ai_referral'
           AND started_at >= $2::date AND started_at < ($2::date + interval '1 month')
         GROUP BY bot_name ORDER BY sessions DESC`,
        [siteId, monthStart]
      ),
      pool.query('SELECT target_visits FROM ai_visibility_goals WHERE site_id = $1 AND month = $2', [siteId, month]),
      pool.query(
        `SELECT day::date AS day, COUNT(*) AS hits FROM (
           SELECT occurred_at AS day FROM bot_visits
             WHERE site_id = $1 AND traffic_source_type = 'ai_crawler'
               AND occurred_at >= $2::date AND occurred_at < ($2::date + interval '1 month')
           UNION ALL
           SELECT started_at AS day FROM sessions
             WHERE site_id = $1 AND traffic_source_type = 'ai_crawler'
               AND started_at >= $2::date AND started_at < ($2::date + interval '1 month')
         ) t GROUP BY 1 ORDER BY 1`,
        [siteId, monthStart]
      )
    ]);

    const totalCrawlerHits = crawlerHits.rows.reduce((sum, r) => sum + Number(r.hits), 0)
      + crawlerSessions.rows.reduce((sum, r) => sum + Number(r.hits), 0);
    const totalReferralSessions = referralSessions.rows.reduce((sum, r) => sum + Number(r.sessions), 0);
    const target = goal.rows[0] ? goal.rows[0].target_visits : null;

    const botMap = new Map();
    for (const r of [...crawlerHits.rows, ...crawlerSessions.rows]) {
      const key = r.bot_name || 'unknown';
      botMap.set(key, (botMap.get(key) || 0) + Number(r.hits));
    }

    res.json({
      month,
      aiCrawlerHits: {
        total: totalCrawlerHits,
        byBot: Array.from(botMap.entries()).map(([botName, hits]) => ({ botName, hits })).sort((a, b) => b.hits - a.hits)
      },
      aiReferralTraffic: { total: totalReferralSessions, byProduct: referralSessions.rows },
      dailyTrend: dailyTrend.rows,
      goal: target
        ? { targetVisits: target, achieved: totalCrawlerHits, progressPercent: Math.round((totalCrawlerHits / target) * 100) }
        : null
    });
  } catch (err) { next(err); }
});

router.get('/sites/:siteId/ai-goal', async (req, res, next) => {
  const { siteId } = req.params;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  try {
    const { rows } = await pool.query(
      'SELECT month, target_visits FROM ai_visibility_goals WHERE site_id = $1 AND month = $2',
      [siteId, month]
    );
    res.json(rows[0] || { month, target_visits: null });
  } catch (err) { next(err); }
});

router.post('/sites/:siteId/ai-goal', async (req, res, next) => {
  const { siteId } = req.params;
  const { month, targetVisits } = req.body || {};
  if (!month || !Number.isFinite(targetVisits)) {
    return res.status(400).json({ error: 'month (YYYY-MM) and targetVisits (number) are required' });
  }
  try {
    await pool.query(
      `INSERT INTO ai_visibility_goals (site_id, month, target_visits)
       VALUES ($1,$2,$3)
       ON CONFLICT (site_id, month) DO UPDATE SET target_visits = EXCLUDED.target_visits`,
      [siteId, month, targetVisits]
    );
    res.status(204).end();
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Mini-game color-scheme experiment. The AndRho frontend's asteroid game
// (see andrho/src/lib/gameStorage.js) reports through the tracker's normal
// custom-event pipeline via window.atrk() — it has no table of its own,
// it's just rows in `events` filtered by type. DISTINCT ON de-dupes in case
// a queued/retried atrk() call ever double-sends the same session/segment.
// ---------------------------------------------------------------------------

router.get('/sites/:siteId/game', async (req, res, next) => {
  const { siteId } = req.params;
  try {
    const [summary, byTheme, byThemeCommerce] = await Promise.all([
      pool.query(
        `WITH sessions_dedup AS (
           SELECT DISTINCT ON (payload->>'id') payload
           FROM events WHERE site_id = $1 AND type = 'game_session'
           ORDER BY payload->>'id', occurred_at DESC
         ),
         registrations_dedup AS (
           SELECT DISTINCT ON (payload->>'session_id') payload
           FROM events WHERE site_id = $1 AND type = 'game_registration'
           ORDER BY payload->>'session_id', occurred_at DESC
         )
         SELECT
           (SELECT COUNT(*) FROM sessions_dedup) AS sessions_played,
           (SELECT COUNT(*) FROM registrations_dedup) AS discounts_claimed,
           (SELECT ROUND(AVG((payload->>'destroyed_count')::numeric), 1) FROM sessions_dedup) AS avg_destroyed`,
        [siteId]
      ),
      pool.query(
        `WITH segments_dedup AS (
           SELECT DISTINCT ON (payload->>'session_id', payload->>'segment_order') payload
           FROM events WHERE site_id = $1 AND type = 'game_theme_segment'
           ORDER BY payload->>'session_id', payload->>'segment_order', occurred_at DESC
         )
         SELECT
           payload->>'theme' AS theme,
           COUNT(*) AS segments,
           SUM((payload->>'destroyed')::int) AS destroyed,
           SUM((payload->>'missed')::int) AS missed,
           ROUND(
             (SUM((payload->>'destroyed')::numeric) / NULLIF(SUM((payload->>'duration_ms')::numeric) / 1000, 0))::numeric,
             3
           ) AS destroy_rate_per_sec
         FROM segments_dedup
         GROUP BY payload->>'theme'
         ORDER BY destroy_rate_per_sec DESC NULLS LAST`,
        [siteId]
      ),
      pool.query(
        `WITH segments_dedup AS (
           SELECT DISTINCT ON (payload->>'session_id', payload->>'segment_order') payload
           FROM events WHERE site_id = $1 AND type = 'game_theme_segment'
           ORDER BY payload->>'session_id', payload->>'segment_order', occurred_at DESC
         ),
         registrations_dedup AS (
           SELECT DISTINCT ON (payload->>'session_id')
             payload->>'session_id' AS session_id, payload->>'commerce_type' AS commerce_type
           FROM events WHERE site_id = $1 AND type = 'game_registration'
           ORDER BY payload->>'session_id', occurred_at DESC
         )
         SELECT
           seg.payload->>'theme' AS theme,
           r.commerce_type,
           COUNT(*) AS segments,
           ROUND(
             AVG((seg.payload->>'destroyed')::numeric / NULLIF((seg.payload->>'duration_ms')::numeric / 1000, 0))::numeric,
             3
           ) AS avg_destroy_rate
         FROM segments_dedup seg
         JOIN registrations_dedup r ON r.session_id = seg.payload->>'session_id'
         GROUP BY seg.payload->>'theme', r.commerce_type
         ORDER BY theme, commerce_type`,
        [siteId]
      )
    ]);

    res.json({
      summary: summary.rows[0],
      byTheme: byTheme.rows,
      byThemeCommerce: byThemeCommerce.rows
    });
  } catch (err) { next(err); }
});

module.exports = router;
