import { TOKEN_KEYS } from './authApi.js'

// Who's visiting, from the session the auth pages leave in localStorage (the
// andrho-api access token; payload contract in the repo README). Read
// locally, never verified or sent anywhere — it only personalizes copy.
// Returns null for anonymous visitors or an expired/garbled token.
export function sessionVisitor() {
  try {
    const token = localStorage.getItem(TOKEN_KEYS.access)
    if (!token) return null
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(decodeURIComponent(escape(atob(part))))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    const source = payload.company_name || (payload.email || '').split('@')[0]
    const handle = toHandle(source)
    return handle ? { handle } : null
  } catch {
    return null
  }
}

// "Heladería Nada S.A." → "heladeria.nada.s.a" — an Instagram-style username.
function toHandle(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 28)
}
