// The account's ERP: whether it's ready, and how far its creation is while
// it isn't. Signup ends long before the VPS finishes Odoo, so the sidebar's
// ERP button wears a progress ring and every section that reads the ERP
// shows the same progress instead of an empty state (views/erp.js,
// views/inicio.js). Polls andrho-api while the ERP is being created and
// tells subscribers on every change; when it's ready the button opens the
// ERP with a one-time entry (POST /erp/sso, no Odoo login).
import { andrhoApi, esc } from './core.js';

const POLL_MS = 5000;

// { state: 'listo' | 'creando' | 'sin_erp', progress: 0-100, detail, waiting }
let current = null;
let loading = null;
let timer = null;
const listeners = new Set();

async function load() {
  const [status, prov] = await Promise.all([
    andrhoApi('/erp/status').catch(() => ({ connected: false })),
    andrhoApi('/account/provisioning').catch(() => ({ jobs: [] }))
  ]);
  const job = (prov.jobs || []).find((j) => j.kind === 'erp');
  if (status.connected) return { state: 'listo', progress: 100, detail: 'Tu ERP está listo.' };
  if (!job) return { state: 'sin_erp', progress: 0, detail: '' };
  return {
    state: 'creando',
    progress: job.status === 'listo' ? 100 : job.progress || 0,
    detail: job.detail || 'Preparando tu ERP…',
    // Nothing moves until the VPS is connected or the retry comes.
    waiting: job.status === 'esperando_vps' || job.status === 'error'
  };
}

async function refresh() {
  const prev = current;
  current = await load();
  if (!prev || prev.state !== current.state || prev.progress !== current.progress || prev.detail !== current.detail) {
    listeners.forEach((fn) => fn(current, prev));
  }
  clearTimeout(timer);
  if (current.state === 'creando') timer = setTimeout(refresh, POLL_MS);
  return current;
}

// The current state (loads it the first time).
export function erpStatus() {
  if (current) return Promise.resolve(current);
  if (!loading) loading = refresh();
  return loading;
}

// fn(state, previous) on every change. Returns an unsubscribe function.
export function onErpStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// The card the ERP sections show while it's being created.
export function creatingCard(s) {
  const pct = Math.round(s.progress || 0);
  return `
    <div class="card erp-creating" data-erp-creating>
      <div class="erp-creating-head">
        ${ring(s, 44)}
        <div>
          <h2>Estamos creando tu ERP</h2>
          <p class="hint">Esta sección se llena con tu ERP en cuanto esté listo; no tienes que hacer nada.</p>
        </div>
      </div>
      <div class="erp-bar" role="progressbar" aria-label="Avance de tu ERP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
        <span style="width:${Math.max(pct, 3)}%"></span>
      </div>
      <p class="erp-creating-detail"><span>${esc(s.detail || 'Preparando tu ERP…')}</span><span class="mono">${pct}%</span></p>
    </div>`;
}

// A ring around the AndRho mark: the button's logo and the cards' icon.
export function ring(s, size = 40) {
  const r = 18, c = 2 * Math.PI * r;
  const pct = s.state === 'listo' ? 100 : Math.max(0, Math.min(100, s.progress || 0));
  const spin = s.state === 'creando' && pct < 2;
  return `
    <span class="erp-ring ${s.state === 'listo' ? 'is-ready' : 'is-creating'} ${spin ? 'is-indeterminate' : ''}" style="width:${size}px;height:${size}px" aria-hidden="true">
      <svg viewBox="0 0 40 40">
        <circle class="erp-ring-track" cx="20" cy="20" r="${r}"/>
        <circle class="erp-ring-fill" cx="20" cy="20" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${spin ? c * 0.75 : c * (1 - pct / 100)}"/>
      </svg>
      <img src="/images/logo/andrho-mark.png" alt=""/>
    </span>`;
}

// Opens the ERP in a new tab, logged in. The tab opens right away (inside
// the click, so it isn't blocked) and goes to the entry URL once the API
// signs it.
export async function openErp() {
  const tab = window.open('', '_blank');
  try {
    const { url } = await andrhoApi('/erp/sso', { method: 'POST' });
    if (tab) tab.location.href = url; else window.location.href = url;
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}

// The sidebar button (index.html #erpLaunch).
export function setupErpButton(btn) {
  const paint = (s) => {
    btn.hidden = s.state === 'sin_erp';
    btn.disabled = s.state !== 'listo';
    btn.classList.toggle('is-ready', s.state === 'listo');
    const sub = s.state === 'listo' ? 'Abrir' : s.waiting ? 'En cola' : `Creándose · ${Math.round(s.progress)}%`;
    btn.innerHTML = `${ring(s, 34)}<span class="erp-launch-text"><span class="erp-launch-title">Tu ERP</span><span class="erp-launch-sub">${esc(sub)}</span></span>`;
    btn.title = s.state === 'listo' ? 'Abrir tu ERP' : s.detail;
    btn.setAttribute('aria-label', s.state === 'listo' ? 'Abrir tu ERP' : `Tu ERP se está creando: ${Math.round(s.progress)}%`);
  };
  onErpStatus(paint);
  erpStatus().then(paint).catch(() => { btn.hidden = true; });
  btn.addEventListener('click', () => {
    openErp().catch((err) => alert(`No pudimos abrir tu ERP: ${err.message}`));
  });
}
