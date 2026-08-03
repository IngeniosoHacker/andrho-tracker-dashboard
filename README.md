# webtracker-dashboard

A read-only analytics dashboard for [`analytics-tracker`](../analytics-tracker). It
connects **directly to the same PostgreSQL database** (read-only queries) and gives
you a sidebar of tracked sites plus a set of views (overview, sessions, navigation
paths, pages, traffic/keywords, geo, AI visibility) to analyze the data collected by
the tracker.

This is a **separate Railway service** from `analytics-tracker` — it doesn't touch
Redis, doesn't ingest tracking data, and never writes to the `sessions`/`pageviews`
tables. The only writes it performs are to `ai_visibility_goals` (setting a monthly
AI-crawler target), which is intentionally a dashboard-owned feature.

---

## 1. Access model: "login" by site_id, no password

There is no user/password system. Knowing a site's `site_id` (the same string used
in `data-site-id="..."` on the tracker script) is what grants access to that site's
dashboard — the same trust model the tracker itself uses for ingesting data.

- The gate screen asks for a `site_id`, verifies it exists in the `sites` table
  (`GET /api/sites/:siteId/verify`), and if valid, adds it to a list kept in the
  browser's `localStorage`.
- The sidebar lists every site you've "logged into" this way. Click one to load its
  dashboard; click the ✕ to remove it from your local list (this does not delete any
  data, it just forgets it locally).
- There's also a `GET /api/sites` endpoint listing every known site, used only to
  help autocomplete/discover ids — nothing sensitive is exposed beyond the id, name,
  and session count.

**This is intentionally lightweight** for an internal/agency tool used by a small
team. If you need real access control (e.g. giving each client only their own site,
enforced server-side, not just "don't type other ids"), see §5.

---

## 2. Views included

- **Resumen (Overview)** — KPI cards (sessions, pageviews, unique visitors, avg
  session duration, avg max scroll), a traffic-type donut chart (human vs. AI crawler
  vs. AI referral vs. search bot), and top landing pages.
- **Sesiones (Sessions)** — paginated table of visits; click a row to open a detail
  drawer with the full **navigation path** (ordered pageviews) and a small bar chart
  of **time spent per scroll-depth level** for each page.
- **Páginas (Pages)** — per-URL aggregates: pageviews, avg time on page, avg max
  scroll.
- **Tráfico & Keywords** — traffic sources breakdown and organic search keywords
  (see the tracker's README for why most modern organic search keywords show up
  empty — that's expected, not a bug).
- **Geografía** — sessions grouped by country/city.
- **Visibilidad IA (AI visibility)** — AI-crawler hits and AI-referral sessions this
  month, broken down by bot/product, a daily trend chart, and a **goal ring** showing
  progress against a configurable monthly target (the same `ai_visibility_goals`
  feature from the tracker).

---

## 3. Deployment on Railway (same project as analytics-tracker)

1. Add this as a **new service in the same Railway project** where `analytics-tracker`
   and its Postgres/Redis plugins already live (so they can all reference each other).
2. Push this project to its own repo (or a `webtracker-dashboard/` folder if you keep
   both in one repo — either works with Railway).
3. Set the environment variable:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
   pointing at the **same Postgres service** analytics-tracker uses (reuse the
   reference, don't create a second database). If the internal reference doesn't
   resolve for some reason, use `${{Postgres.DATABASE_PUBLIC_URL}}` as a fallback,
   same as documented for analytics-tracker.
4. This service never runs migrations — it assumes `analytics-tracker` has already
   created the schema. Deploy `analytics-tracker` first (or at least once) before
   this one.
5. `ALLOWED_ORIGINS` can stay as `*` for this service in most setups, since the
   dashboard's frontend calls its own backend same-origin (browser → this service),
   not cross-site like the tracker does.
6. Generate a public domain for this service (**Settings → Networking → Generate
   Domain**) — that's the URL you'll open to use the dashboard.

### Running locally

```bash
cp .env.example .env
# point DATABASE_URL at the same Postgres analytics-tracker uses (or a local copy)
npm install
npm start
# open http://localhost:3000
```

---

## 4. Architecture note: why connect directly to Postgres instead of calling analytics-tracker's API

`analytics-tracker` already exposes very similar `/api/*` read endpoints. This
dashboard duplicates that logic against the database directly (in
`src/routes/api.js`) rather than proxying through the tracker's API, for two
reasons: it keeps this service independently deployable/scalable without a hard
runtime dependency on the tracker service being reachable, and it lets the dashboard
evolve its own queries (e.g. the `/overview` KPI endpoint) without needing to change
the tracker's API surface. The trade-off is that both projects now own similar SQL —
if you change the schema, update both `analytics-tracker/src/db/schema.sql` and the
queries in this project's `src/routes/api.js`.

---

## 5. Known limitations / possible next steps

- No real authentication — access is "know the site_id". Fine for an internal tool
  with a small trusted team; not fine if you ever hand a client a link expecting them
  to only see their own data by URL alone (they could type/guess another site_id).
  If you need that, add a proper auth layer (e.g. a login with per-client tokens
  mapped to allowed `site_id`s) in front of the `/api/*` routes.
  If you want, I can build this next: real accounts, one per client, each locked to
  their own `site_id`.
- Read queries run directly against the same Postgres analytics-tracker writes to;
  at high traffic volumes consider a read replica so dashboard queries never
  compete with the ingestion path.
- No CSV/export functionality yet on the sessions/pages tables.
