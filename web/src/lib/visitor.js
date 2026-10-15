import { TOKEN_KEYS } from './authApi.js'

// Who is looking at the site, so the landing can show each one the page that
// helps them most (main.jsx):
//
//   nuevo        first visit: the full landing, the whole story
//   recurrente   came back (a second visit or more) without signing up:
//                a short page that answers what's left and asks to continue
//   registrado   already filled the register form (or has a session):
//                a welcome back with their panel and what's new
//
// Production's waiting list records form: 'waitlist' under the same key.
// Those visitors have no account, so they count as recurrente (the short
// page tells them they can now continue).
//
// A visit is a run of page views with less than VISIT_GAP between them, so
// browsing several pages in one sitting is still one visit. Everything lives
// in this browser's localStorage. The same facts go to the web tracker as
// events, so the dashboard sees them per visitor (_atrk_vid):
//
//   visitor_profile  once per visit: { state, visits, form }
//   form_completed   when a form is sent: { form: 'register' }
//
// Crawlers keep no storage, so they always get the full landing (and its
// static SEO copy).

const KEY = 'andrho_visitor'
const VISIT_GAP = 30 * 60 * 1000

// ?vista=completa|corta|bienvenida forces a view (testing, and the "Ver el
// sitio completo" link of the other two).
const VIEWS = { completa: 'nuevo', corta: 'recurrente', bienvenida: 'registrado' }

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}

function write(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // Storage blocked: every visit looks like the first one.
  }
}

function hasSession() {
  try {
    return !!localStorage.getItem(TOKEN_KEYS.access)
  } catch {
    return false
  }
}

// Sends a tracker event once tracker.js (loaded with defer) is there.
export function track(eventType, payload) {
  const send = () => window.atrk?.('event', eventType, payload)
  if (window.atrk) send()
  else window.addEventListener('load', send, { once: true })
}

// The tracker's long-lived visitor id, when it has one.
export function trackerVisitorId() {
  try {
    return localStorage.getItem('_atrk_vid') || ''
  } catch {
    return ''
  }
}

function stateOf(v) {
  if (v.form === 'register' || hasSession()) return 'registrado'
  return v.visits > 1 ? 'recurrente' : 'nuevo'
}

// Counts this page view (a new visit after VISIT_GAP of silence) and
// returns { state, visits, form }. Call once per page load.
export function recordVisit() {
  const now = Date.now()
  const v = read() ?? { visits: 0, firstAt: now, lastAt: 0, form: '' }
  const newVisit = now - (v.lastAt || 0) > VISIT_GAP
  if (newVisit) v.visits += 1
  v.lastAt = now
  write(v)
  const profile = { state: stateOf(v), visits: v.visits, form: v.form || '' }
  if (newVisit) track('visitor_profile', profile)
  return profile
}

// The view the landing should show: the visitor's state, unless ?vista=
// asks for another.
export function landingState(profile) {
  const forced = VIEWS[new URLSearchParams(window.location.search).get('vista')]
  return forced ?? profile.state
}

// The last form this visitor completed ('register', 'waitlist' or '').
export function completedForm() {
  return read()?.form || ''
}

// Marks a form as completed by this visitor ('register').
export function markFormDone(form) {
  const v = read() ?? { visits: 1, firstAt: Date.now(), lastAt: Date.now() }
  v.form = form
  v.formAt = Date.now()
  write(v)
  track('form_completed', { form })
}
