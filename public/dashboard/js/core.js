// Shared plumbing for every dashboard view: the session (andrho-api JWTs),
// the two backends (this Express app's /api/sites/:siteId/* for tracker data,
// andrho-api for everything account-related) and small formatting helpers.
//
// Auth model (see README.md): andrho-api issues an access + refresh token at
// login; GET /auth/me resolves the user, their account (one site_id each),
// their role (owner/admin/editor/viewer) and plan. Role gates are enforced
// for real on andrho-api -- checks here are UI-only, so the interface doesn't
// offer what a user can't do anyway.

const LS_ACCESS = 'andrho_access_token';
const LS_REFRESH = 'andrho_refresh_token';
const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };

// Injected server-side by src/server.js from the ANDRHO_API_URL env var.
export const ANDRHO_API_URL = (window.ANDRHO_API_URL || '').replace(/\/+$/, '');

// The logged-in user + account, filled by boot() in main.js.
// { userId, accountId, email, displayName, role, staffRole, siteId, companyName, plan }
export const session = { account: null };

export function getAccessToken() { return localStorage.getItem(LS_ACCESS); }
export function getRefreshToken() { return localStorage.getItem(LS_REFRESH); }

function storeTokens(tokens) {
  if (!tokens) return;
  if (tokens.access_token) localStorage.setItem(LS_ACCESS, tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem(LS_REFRESH, tokens.refresh_token);
}

export function clearTokensAndRedirect(path) {
  localStorage.removeItem(LS_ACCESS);
  localStorage.removeItem(LS_REFRESH);
  window.location.href = path;
}

export function roleAtLeast(min) {
  const role = session.account && session.account.role;
  return (ROLE_RANK[role] || 0) >= (ROLE_RANK[min] || 99);
}

// AndRho's own staff (not a customer role): 'admin' sees AndRho's internal
// metrics, 'creator' builds customer sites. Comes from /auth/me.
export function isStaff(kind) {
  const staff = session.account && session.account.staffRole;
  if (!staff) return false;
  return kind ? staff === kind || staff === 'admin' : true;
}

// ---------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------

// This Express app's tracker API (same origin).
export async function fetchJSON(url, opts) {
  const headers = Object.assign({}, opts && opts.headers);
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// Tracker data for the logged-in account's site: siteApi('/overview').
export function siteApi(path, opts) {
  return fetchJSON(`/api/sites/${encodeURIComponent(session.account.siteId)}${path}`, opts);
}

// andrho-api without auth (kept separate from andrhoApi below so
// /auth/refresh's own 401s don't recurse into themselves).
export async function andrhoApiFetch(path, opts) {
  const res = await fetch(`${ANDRHO_API_URL}${path}`, opts);
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

// andrho-api with the user's access token.
export function andrhoApi(path, opts) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts && opts.headers, {
    Authorization: `Bearer ${getAccessToken()}`
  });
  return andrhoApiFetch(path, Object.assign({}, opts, { headers }));
}

export async function fetchMe() {
  const data = await andrhoApiFetch('/auth/me', {
    headers: { Authorization: `Bearer ${getAccessToken()}` }
  });
  return {
    userId: data.user_id,
    accountId: data.account_id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    staffRole: data.staff_role || '',
    siteId: data.site_id,
    companyName: data.company_name,
    plan: data.plan
  };
}

export async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const data = await andrhoApiFetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    storeTokens(data);
    return true;
  } catch {
    return false;
  }
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await andrhoApiFetch('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    }
  } catch {
    // best-effort -- still clear the local session either way
  }
  clearTokensAndRedirect('/');
}

// ---------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmtMs(ms) {
  if (ms === null || ms === undefined) return '—';
  const s = Math.round(Number(ms) / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('es');
}

export function fmtMoney(n, currency) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('es', { style: 'currency', currency: currency || 'GTQ', maximumFractionDigits: 2 });
}

export const ROLE_LABEL = { owner: 'Dueño', admin: 'Administrador', editor: 'Editor', viewer: 'Solo lectura' };
export const PLAN_LABEL = { base: 'Base', despegue: 'Despegue', en_orbita: 'En Órbita', galactico: 'Galáctico' };

export function sourceBadge(type) {
  const map = {
    ai_crawler: ['badge-ai', '◆ AI crawler'],
    ai_referral: ['badge-ai', '↳ AI referral'],
    search_bot: ['badge-muted', '⚙ search bot'],
    organic_search: ['badge-human', '⌕ búsqueda'],
    direct: ['badge-human', '→ directo'],
    referral: ['badge-human', '↳ referral']
  };
  const [cls, label] = map[type] || ['badge-muted', type || '—'];
  return `<span class="badge ${cls}">${label}</span>`;
}

// Honest "nothing here yet" card: what's missing and what fills it.
export function emptyState(title, body, icon) {
  return `
    <div class="card empty-card">
      <p class="empty-card-icon">${icon || '⏳'}</p>
      <h2>${esc(title)}</h2>
      <p class="empty-card-body">${body}</p>
    </div>
  `;
}

// Renders `fn(panel)` into panel with a loading state and an error state.
export async function withPanel(panel, fn) {
  panel.innerHTML = '<p class="loading-state">cargando…</p>';
  try {
    await fn(panel);
  } catch (err) {
    if (err.status === 401) { clearTokensAndRedirect('/login.html'); return; }
    panel.innerHTML = `<p class="empty-state">Error cargando datos: ${esc(err.message)}</p>`;
  }
}

// ---------------------------------------------------------------------
// Charts: colors come from the CSS tokens in styles.css, so charts follow
// the dashboard theme instead of hardcoding it twice.
// ---------------------------------------------------------------------
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const axisTicks = () => ({ color: cssVar('--text-tertiary'), font: { family: 'JetBrains Mono', size: 10 } });

const charts = {};
// Creates (or replaces) a Chart.js chart by key, destroying the previous one.
export function chart(key, canvas, config) {
  if (charts[key]) charts[key].destroy();
  if (!canvas || !window.Chart) return null;
  charts[key] = new window.Chart(canvas, config);
  return charts[key];
}

export function barChartOptions() {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: axisTicks() },
      y: { grid: { color: cssVar('--border-soft') }, ticks: axisTicks(), beginAtZero: true }
    }
  };
}

// ---------------------------------------------------------------------
// Drawer (session detail, invite link, article editor, ...)
// ---------------------------------------------------------------------
const drawer = () => document.getElementById('drawer');
export function openDrawer(html) {
  drawer().classList.add('open');
  const content = document.getElementById('drawerContent');
  content.innerHTML = html ?? '<p class="loading-state">cargando…</p>';
  return content;
}
export function closeDrawer() { drawer().classList.remove('open'); }

// Small horizontal tab strip inside a view: tabs = [{ key, label }].
// Returns the markup; wireTabs() hooks clicks to onSelect(key).
export function tabStrip(id, tabs, active) {
  return `<nav class="tabs inner-tabs" id="${id}" role="tablist">
    ${tabs.map((t) => `<button type="button" role="tab" class="tab ${t.key === active ? 'active' : ''}" data-tab="${t.key}" aria-selected="${t.key === active}">${t.label}</button>`).join('')}
  </nav>`;
}

export function wireTabs(nav, onSelect) {
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    nav.querySelectorAll('[data-tab]').forEach((t) => {
      t.classList.toggle('active', t === btn);
      t.setAttribute('aria-selected', t === btn);
    });
    onSelect(btn.dataset.tab);
  });
}

// ---------------------------------------------------------------------
// Routing: "#/web/sesiones" -> { key: 'web', sub: 'sesiones' }
// ---------------------------------------------------------------------
export function parseRoute() {
  const [key, sub] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { key: key || 'inicio', sub: sub || '' };
}

// Lets a view record its own sub-route (tab) without re-rendering itself.
export function setSubRoute(key, sub) {
  const hash = `#/${key}${sub ? '/' + sub : ''}`;
  if (window.location.hash !== hash) history.replaceState(null, '', hash);
}
