# andrho-tracker-dashboard

This Express service now serves three things:

- **`/`** — the official AndRho marketing landing page (built from `web/`, a
  Vite + React + Tailwind v4 app ported from the `andrho` repo).
- **`/login.html`** and **`/signup.html`** — real account auth, backed by
  [`andrho-api`](../andrho-api) (a separate Go service that owns accounts and
  issues JWTs).
- **`/dashboard/`** — the read-only analytics dashboard for
  [`analytics-tracker`](../analytics-tracker) (formerly served at `/`). It
  connects **directly to the same PostgreSQL database** (read-only queries)
  and shows one client's own data: overview, sessions, navigation paths,
  pages, traffic/keywords, geo, AI visibility, and the minigame experiment.

This is a **separate Railway service** from `analytics-tracker` — it doesn't
touch Redis, doesn't ingest tracking data, and never writes to the
`sessions`/`pageviews` tables. The only writes it performs are to
`ai_visibility_goals` (setting a monthly AI-crawler target), which is
intentionally a dashboard-owned feature.
this is bassically the final product interface

---

## 1. Access model: real accounts, one site_id per account

The old "know the site_id, no password" gate is gone. Access now works like this:

1. A user creates an account at `/signup.html` (email, password, company name)
   or logs in at `/login.html`. Both pages call `andrho-api`'s `/auth/signup`
   and `/auth/login` directly (client-side, via `VITE_ANDRHO_API_URL`).
2. `andrho-api` issues a short-lived **access token** and a longer-lived
   **refresh token** (both JWTs, HS256). The browser stores them in
   `localStorage` under `andrho_access_token` / `andrho_refresh_token` and is
   redirected to `/dashboard/`.
3. `public/dashboard/app.js` reads the access token on load, calls
   `GET {ANDRHO_API_URL}/auth/me` to resolve the account (email, company name,
   and — critically — the account's `site_id`), and renders a single-site
   dashboard for that account. No sidebar, no "add another site" flow.
4. If `/auth/me` returns 401 (expired access token), the dashboard tries
   `POST {ANDRHO_API_URL}/auth/refresh` once with the refresh token. If that
   also fails, both tokens are cleared and the user is sent back to
   `/login.html`.
5. Every dashboard API call (`/api/sites/:siteId/*`) sends
   `Authorization: Bearer <access_token>`. The Express backend verifies the
   JWT with `JWT_SECRET` (the same secret `andrho-api` signs with) and checks
   that the token's `site_id` matches the `:siteId` in the URL — a mismatch is
   a `403`, not just a client-side inconvenience.
6. "Cerrar sesión" calls `POST {ANDRHO_API_URL}/auth/logout` with the refresh
   token, clears `localStorage`, and redirects to `/`.

The JWT payload contract (owned by `andrho-api`, mirrored here in
`src/middleware/auth.js`) is:

```json
{ "sub": "<account id>", "email": "...", "site_id": "...", "company_name": "...", "iat": 0, "exp": 0 }
```

**Removed as part of this change:** the unauthenticated `GET /api/sites`
(listed every client's site — a security hole) and `GET /api/sites/:siteId/verify`
(the old login screen's existence check). Neither is used anywhere anymore.

---

## 2. Project layout

```
web/                    Vite + React + Tailwind v4 app: landing + login + signup
  index.html            AndRho marketing landing (ported from andrho/, "under
                         construction" copy removed, LiveProgress dropped)
  login.html            -> src/login.jsx
  signup.html           -> src/signup.jsx
  src/                  components ported from andrho/src/ (Features/InfiniteMenu
                         kept as-is; Waitlist/MissionForm/MissionGame kept as-is)
  dist/                 build output (gitignored), served at "/" by src/server.js

public/dashboard/       the analytics dashboard (formerly public/), now served
                         under /dashboard/ and gated by JWT instead of site_id
  index.html            gets `window.ANDRHO_API_URL` injected server-side
  app.js                single-site dashboard, JWT auth flow, no more sidebar
  styles.css

src/
  server.js             serves web/dist/ at "/", public/dashboard/ at "/dashboard",
                         mounts /api, fails fast if JWT_SECRET is unset
  middleware/auth.js     verifies andrho-api's JWTs, attaches req.account
  routes/api.js          all /sites/:siteId/* routes require auth + site match
  config/db.js           pg pool (unchanged)
```

---

## 3. Environment variables

Root `.env` (Express backend) — see `.env.example`:

| Var | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `DATABASE_URL` | same Postgres `analytics-tracker` uses |
| `ALLOWED_ORIGINS` | CORS allowlist for `/api/*` |
| `JWT_SECRET` | **must match** the secret `andrho-api` signs JWTs with. The server refuses to start without it. |
| `ANDRHO_API_URL` | public/local URL of `andrho-api`. Injected into `public/dashboard/index.html` as `window.ANDRHO_API_URL`, and used to build the CSP `connect-src` allowance. |

`web/.env` (Vite build-time) — see `web/.env.example`:

| Var | Purpose |
|---|---|
| `VITE_ANDRHO_API_URL` | where `login.html`/`signup.html` call `/auth/login`, `/auth/signup` |

---

## 4. Running locally

You need `andrho-api` running locally too (it owns accounts/JWTs) — see that
repo's own README. Then:

```bash
# 1. Backend
cp .env.example .env
# point DATABASE_URL at a Postgres with analytics-tracker's schema,
# set JWT_SECRET to the same value andrho-api uses locally,
# set ANDRHO_API_URL to andrho-api's local URL (e.g. http://localhost:8080)
npm install

# 2. Landing/login/signup (built once, served statically by Express)
cp web/.env.example web/.env
# point VITE_ANDRHO_API_URL at the same andrho-api URL
npm --prefix web install
npm --prefix web run build

# 3. Run
npm start
# open http://localhost:3000            -> landing
# open http://localhost:3000/login.html -> login
# open http://localhost:3000/dashboard/ -> analytics (requires a logged-in account)
```

During frontend development you can also run `npm --prefix web run dev` for
hot-reload (Vite dev server), then rebuild (`npm --prefix web run build`)
before relying on Express to serve the production bundle.

---

## 5. Deployment on Railway (same project as analytics-tracker)

1. Add this as a **new service in the same Railway project** where
   `analytics-tracker` and its Postgres/Redis plugins already live, and where
   `andrho-api` is deployed.
2. Set the environment variables from §3 above. `DATABASE_URL` should
   reference the **same Postgres service** analytics-tracker uses
   (`${{Postgres.DATABASE_URL}}`); `ANDRHO_API_URL` should point at
   `andrho-api`'s Railway URL.
3. `nixpacks.toml` installs (`npm ci` + `npm --prefix web ci`) and builds
   (`npm --prefix web run build`) in separate Nixpacks phases before
   `node src/server.js` starts, so `web/dist/` always exists in production
   (kept as two phases rather than one `railway.json` `buildCommand` to avoid
   an `npm ci`-vs-cache-mount `EBUSY` failure — see the commit that added this
   file). `VITE_ANDRHO_API_URL` must be set as a **build-time** env var
   (Vite inlines it at build time, not at runtime) for the build to point
   login/signup at the right `andrho-api` URL.
4. This service never runs migrations — it assumes `analytics-tracker` has
   already created the schema.
5. Generate a public domain for this service (**Settings → Networking →
   Generate Domain**).

---

## 6. Architecture note: why connect directly to Postgres instead of calling analytics-tracker's API

`analytics-tracker` already exposes very similar `/api/*` read endpoints. This
dashboard duplicates that logic against the database directly (in
`src/routes/api.js`) rather than proxying through the tracker's API, for two
reasons: it keeps this service independently deployable/scalable without a
hard runtime dependency on the tracker service being reachable, and it lets
the dashboard evolve its own queries (e.g. the `/overview` KPI endpoint)
without needing to change the tracker's API surface. The trade-off is that
both projects now own similar SQL — if you change the schema, update both
`analytics-tracker/src/db/schema.sql` and the queries in this project's
`src/routes/api.js`.

---

## 7. Known limitations / possible next steps

- `andrho-api`'s exact `/auth/me`, `/auth/refresh`, `/auth/logout` response
  shapes were assumed (see `public/dashboard/app.js` and `web/src/lib/authApi.js`)
  based on the JWT contract in §1 — verify against `andrho-api`'s actual
  implementation once both services are deployed together and adjust if the
  field names differ (`account_id` vs `id`, etc).
- Read queries run directly against the same Postgres analytics-tracker
  writes to; at high traffic volumes consider a read replica so dashboard
  queries never compete with the ingestion path.
- No CSV/export functionality yet on the sessions/pages tables.
- No password reset / email verification flow yet — that lives entirely in
  `andrho-api`'s scope.
