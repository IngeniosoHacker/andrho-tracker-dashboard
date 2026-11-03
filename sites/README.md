# andrho-sites

Every AndRho client website, as **one Railway service** (this folder, root
directory `sites` of the andrho-tracker-dashboard repo).

- A client without a website gets one at signup:
  `web.<site_id>.andrho.com` (andrho-api `internal/sites`, `SITE_HOST_PATTERN`).
- While a Creator builds it, the host shows **"en construcción"**: the
  business' name and logo, the structure its site will have (from its type
  of business: servicios, restaurantes or ventas, andrho-api
  `internal/business`) and AndRho's tracker, so visits count from day one.
  It's marked `noindex` until the real site is up.
- When the Creator delivers (a Railway deployment, `https://…up.railway.app`),
  this service serves that deployment **on the same host** (reverse proxy),
  so the client's address never changes. Only https URLs on
  `SITES_LIVE_HOSTS` are proxied, never an arbitrary one.

## The template

`src/` is React 19 + Vite + Tailwind v4, the same stack and tokens as the
AndRho landing (`../web`). It's also **where Creators start**:

```sh
npm install
npm run dev                       # the "en construcción" page
# ?vista=inicio                   the full home, structured by type
# ?tipo=servicios|restaurantes|ventas   switch the sample business
```

`src/Inicio.jsx` renders a header, a hero with the type's call to action
and one block per section of the type (`src/sections/Section.jsx` is the
placeholder; replace it per section). Copy this folder to a new repo, build
the real site, deploy it on Railway and deliver its URL in the Creator task.

## Railway

| Variable | Notes |
|---|---|
| `ANDRHO_API_URL` | andrho-api's URL (required): `GET /public/site?host=` and the logo. |
| `TRACKER_SCRIPT_ORIGIN` | WebTracker's URL (default the production one). |
| `SITES_LIVE_HOSTS` | Hosts a published site may be proxied from (default `.up.railway.app`). |

Each client host must be a custom domain of this service. andrho-api adds it
by itself with `RAILWAY_API_TOKEN`, `RAILWAY_SITES_SERVICE_ID`,
`RAILWAY_ENVIRONMENT_ID` and creates the DNS records in Porkbun with
`PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY`; without them it records what's
missing (`account_sites.domain_state`) for staff to do by hand.

`npm test` covers the host lookup, the injected data (escaped), the tracker,
404 for unknown hosts and the proxy allow-list.
