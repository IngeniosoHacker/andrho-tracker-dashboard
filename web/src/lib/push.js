import { TOKEN_KEYS } from './authApi.js'

// Web Push from the signup's last card and the panel: register the service
// worker (web/public/sw.js), subscribe with andrho-api's VAPID key (GET
// /push/key) and store the subscription for the signed-in person (POST
// /account/push). andrho-api (internal/notify) pushes when the ERP is ready.

const API_URL = (import.meta.env.VITE_ANDRHO_API_URL || '').replace(/\/+$/, '')

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function keyBytes(b64) {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

// The public key, or '' when andrho-api has push off.
export async function pushKey() {
  try {
    const res = await fetch(`${API_URL}/push/key`)
    return res.ok ? (await res.json()).key || '' : ''
  } catch {
    return ''
  }
}

// Asks permission and subscribes this browser. Resolves to 'on', 'denied'
// or 'unavailable'.
export async function enablePush() {
  if (!pushSupported()) return 'unavailable'
  const key = await pushKey()
  if (!key) return 'unavailable'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }))
  const res = await fetch(`${API_URL}/account/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEYS.access)}` },
    body: JSON.stringify(sub.toJSON()),
  })
  if (!res.ok) throw new Error('No pudimos activar los avisos.')
  return 'on'
}

// Whether this browser already gets them.
export async function pushState() {
  if (!pushSupported() || !(await pushKey())) return 'unavailable'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = reg && (await reg.pushManager.getSubscription())
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}
