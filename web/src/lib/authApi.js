// Thin client for andrho-api's auth endpoints. Shared by login.jsx and
// signup.jsx (and mirrored, conceptually, by public/dashboard/app.js on the
// Express side — see that file's ANDRHO_API_URL usage).
//
// Strip a trailing slash: VITE_ANDRHO_API_URL is often copy-pasted straight
// from Railway's "Generate Domain" output, which includes one. Left in, every
// call below becomes `${API_URL}/auth/login` = ".../api-domain//auth/login"
// -- a double slash the Go router 404s on *before* it ever runs CORS
// middleware, so the browser's preflight gets a response with no
// Access-Control-Allow-Origin header and reports it to fetch() as a generic
// network failure. That's indistinguishable from andrho-api being down and is
// exactly what surfaces as "No se pudo conectar con el servidor" below, even
// though a request to the correct (single-slash) path succeeds.
const API_URL = (import.meta.env.VITE_ANDRHO_API_URL || '').replace(/\/+$/, '')

export const TOKEN_KEYS = {
  access: 'andrho_access_token',
  refresh: 'andrho_refresh_token',
}

export function storeTokens(tokens) {
  if (!tokens) return
  if (tokens.access_token) localStorage.setItem(TOKEN_KEYS.access, tokens.access_token)
  if (tokens.refresh_token) localStorage.setItem(TOKEN_KEYS.refresh, tokens.refresh_token)
}

export async function apiPost(path, body) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (cause) {
    // fetch() only throws for network-level failures: DNS/connection refused,
    // a CORS rejection, or a CSP connect-src violation -- never for a real
    // HTTP error response (that falls through to the !res.ok branch below).
    // Logging the exact URL + underlying error here is the fastest way to
    // tell those apart from devtools: an empty API_URL or a *.railway.internal
    // host means VITE_ANDRHO_API_URL/ANDRHO_API_URL is misconfigured (see
    // vite.config.js and src/server.js); a CORS/CSP message in the console
    // next to this means andrho-api's ALLOWED_ORIGINS or this app's
    // ANDRHO_API_URL don't match the domain the browser is actually on.
    console.error(`[auth] could not reach ${API_URL}${path} (VITE_ANDRHO_API_URL="${API_URL}")`, cause)
    const error = new Error('No se pudo conectar con el servidor. Intenta de nuevo en un momento.')
    error.status = 0
    throw error
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // no JSON body (e.g. 204) -- fine
  }

  if (!res.ok) {
    const error = new Error((data && data.error) || res.statusText || 'Ocurrió un error inesperado.')
    error.status = res.status
    throw error
  }

  return data
}
