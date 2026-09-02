// Thin client for andrho-api's auth endpoints. Shared by login.jsx and
// signup.jsx (and mirrored, conceptually, by public/dashboard/app.js on the
// Express side — see that file's ANDRHO_API_URL usage).
const API_URL = import.meta.env.VITE_ANDRHO_API_URL || ''

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
  } catch {
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
