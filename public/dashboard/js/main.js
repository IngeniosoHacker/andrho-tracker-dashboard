// Dashboard shell: resolves the session, draws the left sidebar and routes
// #/<section>/<sub> to a view module (js/views/*.js). Every view renders
// into #view; the AndRho panel on the right (insights.js) follows along with
// the section's summary, notifications and suggestions.
import {
  session, getAccessToken, fetchMe, tryRefresh, clearTokensAndRedirect, logout,
  esc, isStaff, ROLE_LABEL, closeDrawer, parseRoute, withPanel, andrhoApi
} from './core.js';
import { NAV, STAFF_NAV, FOOTER_NAV, ICONS, findNav } from './nav.js';
import { loadInsights } from './insights.js';
import { setupThemeToggle } from './theme.js';
import { setupErpButton } from './erpstatus.js';

import inicio from './views/inicio.js';
import web from './views/web.js';
import social from './views/social.js';
import inventario from './views/inventario.js';
import clientes from './views/clientes.js';
import prospectos from './views/prospectos.js';
import sucursales from './views/sucursales.js';
import usuarios from './views/usuarios.js';
import resumen from './views/resumen.js';
import tokens from './views/tokens.js';
import creators from './views/creators.js';
import andrho from './views/andrho.js';
import configuracion from './views/configuracion.js';

const VIEWS = { inicio, web, social, inventario, clientes, prospectos, sucursales, usuarios, resumen, tokens, configuracion, creators, andrho };

const els = {
  sidebar: document.getElementById('sidebar'),
  nav: document.getElementById('sideNav'),
  view: document.getElementById('view'),
  title: document.getElementById('viewTitle'),
  hint: document.getElementById('viewHint'),
  company: document.getElementById('companyName'),
  user: document.getElementById('userName'),
  role: document.getElementById('roleBadge'),
  logout: document.getElementById('logoutBtn'),
  menu: document.getElementById('menuBtn'),
  insightsToggle: document.getElementById('insightsToggle')
};

function navItem(n) {
  return `<a class="side-link" href="#/${n.key}" data-key="${n.key}">
    ${ICONS[n.icon || n.key] || ''}<span>${esc(n.label)}</span>
  </a>`;
}

function drawSidebar() {
  const staff = STAFF_NAV.filter((n) => isStaff(n.staff));
  els.nav.innerHTML = `
    ${NAV.map(navItem).join('')}
    ${staff.length ? `<p class="side-group">AndRho</p>${staff.map(navItem).join('')}` : ''}
    <div class="side-spacer"></div>
    ${FOOTER_NAV.map(navItem).join('')}
  `;
}

function markActive(key) {
  els.nav.querySelectorAll('.side-link').forEach((a) => {
    const on = a.dataset.key === key;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

let currentKey = null;
async function route() {
  let { key, sub } = parseRoute();
  const nav = findNav(key);
  if (!VIEWS[key] || !nav || (nav.staff && !isStaff(nav.staff))) {
    key = 'inicio'; sub = '';
  }
  const view = VIEWS[key];
  document.body.classList.remove('nav-open');
  closeDrawer();
  markActive(key);
  els.title.textContent = view.title;
  els.hint.textContent = view.hint || '';
  document.title = `${view.title} · AndRho`;

  // Same section, new sub-route: the view handles it (tabs) when it can.
  if (key === currentKey && view.onSubRoute) {
    view.onSubRoute(sub);
    return;
  }
  currentKey = key;
  els.view.innerHTML = '';
  document.getElementById('lastActivity').textContent = '';
  loadInsights(nav.section || key, view.title);
  await withPanel(els.view, (el) => view.render(el, { key, sub }));
}

// My status in the sidebar, and a heartbeat so the team sees who's online.
async function setupPresence() {
  const sel = document.getElementById('myStatus');
  const dot = document.getElementById('statusDot');
  const paint = () => { dot.dataset.status = sel.value; };
  try {
    const { presence } = await andrhoApi('/account/presence');
    const mine = presence.find((p) => p.user_id === session.account.userId);
    if (mine) sel.value = mine.status;
  } catch {}
  paint();
  sel.addEventListener('change', async () => {
    paint();
    try { await andrhoApi('/account/me/status', { method: 'PATCH', body: JSON.stringify({ status: sel.value }) }); } catch {}
  });
  const beat = () => { if (!document.hidden) andrhoApi('/account/me/heartbeat', { method: 'POST' }).catch(() => {}); };
  beat();
  setInterval(beat, 60000);
}

async function boot() {
  if (!getAccessToken()) { window.location.href = '/login.html'; return; }
  try {
    session.account = await fetchMe();
  } catch (err) {
    if (err.status !== 401 || !(await tryRefresh())) { clearTokensAndRedirect('/login.html'); return; }
    try { session.account = await fetchMe(); } catch { clearTokensAndRedirect('/login.html'); return; }
  }

  const a = session.account;
  els.company.textContent = a.companyName || 'Tu empresa';
  els.user.textContent = a.displayName || a.email;
  if (a.role) { els.role.textContent = ROLE_LABEL[a.role] || a.role; els.role.hidden = false; }

  drawSidebar();
  setupPresence();
  setupErpButton(document.getElementById('erpLaunch'));
  // A Creator (not an admin) lands on their tasks.
  if (!window.location.hash && a.staffRole === 'creator') history.replaceState(null, '', '#/creators');
  window.addEventListener('hashchange', route);
  await route();
}

els.logout.addEventListener('click', logout);
els.menu.addEventListener('click', () => document.body.classList.toggle('nav-open'));
els.insightsToggle.addEventListener('click', () => document.body.classList.toggle('insights-open'));
// Charts take their colors when drawn, so a theme change redraws the view.
setupThemeToggle(document.getElementById('themeToggle'), () => { currentKey = null; route(); });
// A view asks to be drawn again (e.g. the ERP became ready: views/erp.js).
window.addEventListener('andrho:reload', () => { currentKey = null; route(); });
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
document.getElementById('navBackdrop').addEventListener('click', () => document.body.classList.remove('nav-open'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDrawer(); document.body.classList.remove('nav-open', 'insights-open'); }
});

boot();
