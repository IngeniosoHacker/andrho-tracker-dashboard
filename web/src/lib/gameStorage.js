// Persistence for the asteroid mini-game analytics — routed through the
// AndRho web-tracker's existing custom-event pipeline instead of a separate
// backend. `window.atrk` is exposed globally by tracker.js (loaded in
// index.html with data-site-id="andrho"); each call becomes one row in the
// tracker's `events` table (site_id='andrho', type=<eventType>, payload
// =JSONB), scoped and queryable exactly like every other tracked event. See
// the dashboard's "Minijuego" tab (andrho-tracker-dashboard) and
// analysis/anova.py for how this data gets read back.
//
// atrk() is fire-and-forget by design (tracker.js swallows its own network
// errors so a tracking failure never breaks the host page), so the only
// failure this module can actually detect is "the tracker script hasn't
// defined window.atrk yet" (ad blocker, script load race, offline). In that
// case rows are queued in localStorage and resent the next time
// flushPendingSync() runs.
const QUEUE_KEY = 'andrho_game_pending_sync'

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Storage full or unavailable (private browsing) — nothing more we can do.
  }
}

function sendOrQueue(eventType, payload) {
  if (typeof window.atrk === 'function') {
    window.atrk('event', eventType, payload)
    return
  }
  const queue = readQueue()
  queue.push({ eventType, payload })
  writeQueue(queue)
}

export function submitGameSession(session) {
  sendOrQueue('game_session', session)
}

export function submitThemeSegments(segments) {
  segments.forEach((segment) => sendOrQueue('game_theme_segment', segment))
}

export function submitRegistration(registration) {
  sendOrQueue('game_registration', registration)
}

// Retries anything queued while the tracker wasn't available yet. Safe to
// call opportunistically (e.g. when the game mounts) — a no-op without a
// loaded tracker or an empty queue.
export function flushPendingSync() {
  if (typeof window.atrk !== 'function') return
  const queue = readQueue()
  if (!queue.length) return
  queue.forEach(({ eventType, payload }) => window.atrk('event', eventType, payload))
  writeQueue([])
}
