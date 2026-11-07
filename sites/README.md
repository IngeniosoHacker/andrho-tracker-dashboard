# andrho-sites

AndRho client websites on Railway, in the **`Clients` project**. One
codebase (this folder, root directory `sites` of the
andrho-tracker-dashboard repo), two modes (`SITE_MODE`):

| Mode | Service | What it does |
|---|---|---|
| `router` (default) | **sites-router**, owns `*.web.andrho.com` | Resolves the `Host` with andrho-api (`GET /public/site?host=`, cached 60 s) and forwards the request to the client's service at `http://site-<account_id>.railway.internal:<port>`, keeping path, query and headers and adding `X-Forwarded-Host` / `X-Forwarded-Proto: https`. Unknown host → 404 (generic page, `X-Robots-Tag: noindex`); not deployed yet → 503 with `Retry-After`; an old `web.<name>.andrho.com` host (or the subdomain of a site with its own domain) → 301 to the public host. |
| `site` | **site-&lt;account_id&gt;**, one per client, created by andrho-api | Serves that client's site (`SITE_ID`) with its own SEO: `robots.txt` and `sitemap.xml` with absolute URLs of its host, `<link rel="canonical">` to the public host, `<meta name="google-site-verification">`, `lang="es-GT"`, `LocalBusiness` per branch. The plan's SEO comes as flags: `features.store` adds `sitemap-productos.xml`, `features.full_site` a page per branch (`/sucursales/<slug>`). Until the Creator delivers (`published`), it shows "en construcción" with `noindex`. A request on `*.up.railway.app` gets a 301 to the public host. |

A client's service never has a public `*.up.railway.app` domain (andrho-api
removes it): the same content on two hosts would split it for Google. It's
only reached through sites-router, which works because Railway's private
network (`*.railway.internal`) spans one project and environment, so
sites-router lives in `Clients` too.

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
placeholder; replace it per section). The Creator builds the real site on a
copy of this folder **keeping `server.js`** (it serves the SEO), connects it
as the source of the client's service (`railway_service` in the task's
brief, `site-<account_id>`), and delivers the task with its link. Delivering
marks the site `published`: the home stops being "en construcción" and
becomes indexable.

## Railway

**sites-router** (once, by hand): new service in `Clients` → `production`
from this repo, *Root Directory* `sites`, and the custom domain
`*.web.andrho.com` (Railway asks for a wildcard CNAME, an `_acme-challenge`
CNAME and a TXT; `go run ./cmd/sites-wildcard` in andrho-api adds the domain
and creates the records in Porkbun).

| Variable | sites-router | site-&lt;id&gt; (set by andrho-api) |
|---|---|---|
| `SITE_MODE` | `router` (or unset) | `site` |
| `ANDRHO_API_URL` | andrho-api's URL (required) | `SITES_API_URL` of andrho-api |
| `SITE_ID` | — | the client's `site_id` |
| `PORT` | Railway's | `8080` |
| `TRACKER_SCRIPT_ORIGIN` | — | optional, WebTracker's URL |
| `SITES_INTERNAL_SUFFIX` | optional, default `.railway.internal` | — |

The server listens on `::` so the private network (IPv6) reaches it.

`npm test` covers the router (forwarding, 404/503/301, only private
targets) and the site (escaped data, canonical, verification, robots,
sitemaps, LocalBusiness, branch pages, the 301 from Railway's domain).
