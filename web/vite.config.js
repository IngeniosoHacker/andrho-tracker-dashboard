import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { SITE, jsonLd, staticLandingHtml } from './src/lib/seo.js'

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url))

// Fills the <!--seo:*--> markers in index.html from src/lib/seo.js: meta
// tags, JSON-LD and a static copy of the page for crawlers that don't run JS
// (see the comment at the top of seo.js).
function landingSeo() {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  return {
    name: 'andrho-landing-seo',
    transformIndexHtml(html) {
      if (!html.includes('<!--seo:head-->')) return html
      const head = [
        `<title>${esc(SITE.title)}</title>`,
        `<meta name="description" content="${esc(SITE.description)}" />`,
        `<link rel="canonical" href="${SITE.url}/" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${SITE.name}" />`,
        `<meta property="og:locale" content="${SITE.locale}" />`,
        `<meta property="og:url" content="${SITE.url}/" />`,
        `<meta property="og:title" content="${esc(SITE.title)}" />`,
        `<meta property="og:description" content="${esc(SITE.description)}" />`,
        `<meta property="og:image" content="${SITE.ogImage}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${esc(SITE.title)}" />`,
        `<meta name="twitter:description" content="${esc(SITE.description)}" />`,
        `<meta name="twitter:image" content="${SITE.ogImage}" />`,
        `<script type="application/ld+json">${JSON.stringify(jsonLd()).replace(/</g, '\\u003c')}</script>`,
      ].join('\n')
      return html.replace('<!--seo:head-->', head).replace('<!--seo:body-->', staticLandingHtml())
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_ANDRHO_API_URL gets inlined into login.jsx/signup.jsx at build time
  // (see web/.env.example, src/lib/authApi.js) -- the browser calls it
  // directly. A Railway *private*-network hostname (*.railway.internal)
  // parses as a perfectly valid URL but only resolves inside Railway's
  // network, never from a user's browser: it would build successfully and
  // then fail every login/signup with a generic "No se pudo conectar con el
  // servidor" that's very hard to trace back to this. Fail the build instead.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiUrl = env.VITE_ANDRHO_API_URL
  if (apiUrl && apiUrl.includes('.railway.internal')) {
    throw new Error(
      `VITE_ANDRHO_API_URL ("${apiUrl}") is a Railway *private*-network hostname (*.railway.internal). ` +
        'It will build fine but browsers cannot resolve it, so login.html/signup.html will fail every ' +
        "request with a network error. Use andrho-api's PUBLIC domain instead (Settings -> Networking -> " +
        'Generate Domain on that service).',
    )
  }

  return {
    plugins: [react(), tailwindcss(), landingSeo()],
    build: {
      rollupOptions: {
        input: {
          main: resolvePath('./index.html'),
          login: resolvePath('./login.html'),
          signup: resolvePath('./signup.html'),
          acceptInvite: resolvePath('./accept-invite.html'),
          waitlist: resolvePath('./waitlist.html'),
        },
      },
    },
  }
})
