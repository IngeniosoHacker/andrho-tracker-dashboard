(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Auth (real accounts, issued by andrho-api). Each account is locked to
  // exactly one site_id -- there is no more "add a site" flow, no more
  // localStorage list of sites. See README.md for the full auth flow.
  //
  // Since the multi-user/roles migration, `account` also carries `role`
  // (owner/admin/editor/viewer) and `plan` (base/despegue/en_orbita/
  // galactico) -- both come from GET /auth/me. Role gates are enforced for
  // real on andrho-api; the checks here are UI-only (hide/disable an action
  // a user can't perform anyway) so the interface doesn't lie about what
  // will happen when clicked.
  // ---------------------------------------------------------------------
  const LS_ACCESS = 'andrho_access_token';
  const LS_REFRESH = 'andrho_refresh_token';
  const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };

  // Injected server-side by src/server.js from the ANDRHO_API_URL env var.
  const ANDRHO_API_URL = (window.ANDRHO_API_URL || '').replace(/\/+$/, '');

  let account = null;      // { userId, accountId, email, displayName, role, siteId, companyName, plan }
  let activeSiteId = null;
  let activeTopTab = 'overview';
  let charts = {}; // keep Chart.js instances so we can .destroy() before re-render
  let sessionsPage = { limit: 25, offset: 0, total: 0 };
  let cachedSessions = null; // reused by the "Hoy" tab so it doesn't re-fetch

  const els = {
    dash: document.getElementById('dash'),
    activeSiteEyebrow: document.getElementById('activeSiteEyebrow'),
    activeSiteName: document.getElementById('activeSiteName'),
    roleBadge: document.getElementById('roleBadge'),
    lastActivity: document.getElementById('lastActivity'),
    logoutBtn: document.getElementById('logoutBtn'),
    topTabs: document.getElementById('topTabs'),
    drawer: document.getElementById('drawer'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    drawerClose: document.getElementById('drawerClose'),
    drawerContent: document.getElementById('drawerContent')
  };

  function getAccessToken() { return localStorage.getItem(LS_ACCESS); }
  function getRefreshToken() { return localStorage.getItem(LS_REFRESH); }
  function storeTokens(tokens) {
    if (!tokens) return;
    if (tokens.access_token) localStorage.setItem(LS_ACCESS, tokens.access_token);
    if (tokens.refresh_token) localStorage.setItem(LS_REFRESH, tokens.refresh_token);
  }
  function clearTokensAndRedirect(path) {
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
    window.location.href = path;
  }

  function roleAtLeast(min) {
    return (ROLE_RANK[account && account.role] || 0) >= (ROLE_RANK[min] || 99);
  }

  // ---------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------
  async function fetchJSON(url, opts) {
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

  // For andrho-api calls that don't need auth (kept separate from the authed
  // helper below so /auth/refresh's own 401s don't recurse into themselves).
  async function andrhoApiFetch(path, opts) {
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

  // For the new /account/* and /suggestions endpoints on andrho-api, which
  // all require Authorization: Bearer <access token>.
  async function andrhoApiAuthed(path, opts) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts && opts.headers, {
      Authorization: `Bearer ${getAccessToken()}`
    });
    return andrhoApiFetch(path, Object.assign({}, opts, { headers }));
  }

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtMs(ms) {
    if (ms === null || ms === undefined) return '—';
    const s = Math.round(Number(ms) / 1000);
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
  }

  function fmtDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function fmtNum(n) {
    if (n === null || n === undefined) return '—';
    return Number(n).toLocaleString('es');
  }

  function sourceBadge(type) {
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

  const ROLE_LABEL = { owner: 'Dueño', admin: 'Administrador', editor: 'Editor', viewer: 'Solo lectura' };
  const PLAN_LABEL = { base: 'Base', despegue: 'Despegue', en_orbita: 'En Órbita', galactico: 'Galáctico' };

  function emptyState(title, body) {
    return `
      <div class="card empty-card">
        <p class="empty-card-icon">⏳</p>
        <h2>${esc(title)}</h2>
        <p class="empty-card-body">${body}</p>
      </div>
    `;
  }

  // A section header with a title/hint on the left and a "Sugerencias"
  // button on the right -- used by every Resumen/Rendimiento sub-view (see
  // the feature spec: "cada vista debe tener al extremo derecho un botón de
  // sugerencias").
  function sectionHeader(section, title, hint) {
    return `
      <div class="section-head">
        <div>
          <h2 style="margin:0">${esc(title)}</h2>
          ${hint ? `<p class="hint" style="margin:4px 0 0">${hint}</p>` : ''}
        </div>
        <button type="button" class="suggestions-btn" data-suggestions-section="${esc(section)}">
          💡 Sugerencias
        </button>
      </div>
    `;
  }

  function bindSectionHeader(panel) {
    const btn = panel.querySelector('[data-suggestions-section]');
    if (btn) btn.addEventListener('click', () => openSuggestionsDrawer(btn.dataset.suggestionsSection));
  }

  // ---------------------------------------------------------------------
  // Boot: resolve the logged-in account against andrho-api before rendering
  // anything. No access token -> straight to /login.html. An expired access
  // token gets one refresh attempt; if that also fails, the local session is
  // wiped and the user is sent back to /login.html.
  // ---------------------------------------------------------------------
  async function boot() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      window.location.href = '/login.html';
      return;
    }

    try {
      account = await fetchMe();
    } catch (err) {
      if (err.status === 401) {
        const refreshed = await tryRefresh();
        if (!refreshed) { clearTokensAndRedirect('/login.html'); return; }
        try {
          account = await fetchMe();
        } catch {
          clearTokensAndRedirect('/login.html');
          return;
        }
      } else {
        clearTokensAndRedirect('/login.html');
        return;
      }
    }

    activeSiteId = account.siteId;
    els.activeSiteEyebrow.textContent = account.companyName || 'cuenta';
    els.activeSiteName.textContent = account.email || activeSiteId;
    if (account.role) {
      els.roleBadge.textContent = ROLE_LABEL[account.role] || account.role;
      els.roleBadge.hidden = false;
    }

    sessionsPage = { limit: 25, offset: 0, total: 0 };
    await loadTopTab(activeTopTab, true);
  }

  async function fetchMe() {
    const data = await andrhoApiFetch('/auth/me', {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
    return {
      userId: data.user_id,
      accountId: data.account_id,
      email: data.email,
      displayName: data.display_name,
      role: data.role,
      siteId: data.site_id,
      companyName: data.company_name,
      plan: data.plan
    };
  }

  async function tryRefresh() {
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

  els.logoutBtn.addEventListener('click', async () => {
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
  });

  // ---------------------------------------------------------------------
  // Top-level tab navigation: overview | performance | suggestions |
  // updates | today | settings
  // ---------------------------------------------------------------------
  els.topTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    els.topTabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    activeTopTab = btn.dataset.toptab;
    document.querySelectorAll('.top-panel').forEach((p) => (p.hidden = true));
    document.getElementById(`top-panel-${activeTopTab}`).hidden = false;
    loadTopTab(activeTopTab, false);
  });

  function wireSubTabs(navEl, onSelect) {
    if (navEl.dataset.wired) return;
    navEl.dataset.wired = '1';
    navEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      navEl.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.subtab || btn.dataset.innertab;
      onSelect(key);
    });
  }

  async function loadTopTab(tab) {
    if (tab === 'overview') {
      wireSubTabs(document.getElementById('overviewSubTabs'), (key) => loadOverviewSubTab(key));
      await loadOverviewSubTab('marketing');
    } else if (tab === 'performance') {
      wireSubTabs(document.getElementById('performanceSubTabs'), (key) => loadPerformanceSubTab(key));
      await loadPerformanceSubTab('campanas');
    } else if (tab === 'suggestions') {
      await renderGlobalSuggestions(document.getElementById('panel-suggestions'));
    } else if (tab === 'updates') {
      await renderUpdates(document.getElementById('panel-updates'));
    } else if (tab === 'today') {
      await renderToday(document.getElementById('panel-today'));
    } else if (tab === 'settings') {
      await renderSettings(document.getElementById('panel-settings'));
    }
  }

  async function withPanel(panel, fn) {
    panel.innerHTML = '<p class="loading-state">cargando…</p>';
    try {
      await fn(panel);
    } catch (err) {
      if (err.status === 401) { clearTokensAndRedirect('/login.html'); return; }
      panel.innerHTML = `<p class="empty-state">Error cargando datos: ${esc(err.message)}</p>`;
    }
  }

  // ---------------------------------------------------------------------
  // Resumen (Visibilidad): Marketing | Ventas | Inventarios | KPIs
  // ---------------------------------------------------------------------
  async function loadOverviewSubTab(key) {
    document.querySelectorAll('#top-panel-overview > .panel').forEach((p) => (p.hidden = true));
    const panel = document.getElementById(`panel-overview-${key}`);
    panel.hidden = false;
    if (key === 'marketing') await withPanel(panel, renderMarketing);
    else if (key === 'ventas') await withPanel(panel, (p) => renderErpPlaceholder(p, 'ventas', 'Ventas'));
    else if (key === 'inventarios') await withPanel(panel, (p) => renderErpPlaceholder(p, 'inventarios', 'Inventarios'));
    else if (key === 'kpis') await withPanel(panel, renderKpis);
  }

  async function renderMarketing(panel) {
    const [traffic, keywords, ai] = await Promise.all([
      fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/traffic-sources`),
      fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/search-keywords`),
      fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/ai-visibility?month=${new Date().toISOString().slice(0, 7)}`)
    ]);

    panel.innerHTML = `
      ${sectionHeader('marketing', 'Marketing', 'de dónde viene tu tráfico, qué buscan y qué tan visible sos ante IA')}
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Hits de AI crawlers (mes)</p><p class="kpi-value ai">${fmtNum(ai.aiCrawlerHits.total)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Sesiones AI-referral</p><p class="kpi-value ai">${fmtNum(ai.aiReferralTraffic.total)}</p></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h2>Fuentes de tráfico</h2>
          ${traffic.trafficSources.length ? `
          <table>
            <thead><tr><th>Fuente</th><th>Medio</th><th>Tipo</th><th class="num">Sesiones</th></tr></thead>
            <tbody>
              ${traffic.trafficSources.map((r) => `
                <tr><td class="mono">${esc(r.source)}</td><td class="mono">${esc(r.medium)}</td><td>${sourceBadge(r.traffic_source_type)}</td><td class="num">${fmtNum(r.sessions)}</td></tr>
              `).join('')}
            </tbody>
          </table>` : '<p class="empty-state">Sin datos todavía</p>'}
        </div>
        <div class="card">
          <h2>Keywords de búsqueda <span class="hint">orgánico</span></h2>
          ${keywords.keywords.length ? `
          <table>
            <thead><tr><th>Motor</th><th>Keyword</th><th class="num">Sesiones</th></tr></thead>
            <tbody>
              ${keywords.keywords.map((r) => `
                <tr><td class="mono">${esc(r.search_engine)}</td><td>${esc(r.keywords)}</td><td class="num">${fmtNum(r.sessions)}</td></tr>
              `).join('')}
            </tbody>
          </table>` : '<p class="empty-state">Sin tráfico orgánico registrado aún</p>'}
        </div>
      </div>
    `;
    bindSectionHeader(panel);
  }

  function renderErpPlaceholder(panel, section, label) {
    panel.innerHTML = `
      ${sectionHeader(section, label, null)}
      ${emptyState(
        'Conectá tu ERP para ver esto',
        `AndRho todavía no tiene una fuente de datos de ${esc(label.toLowerCase())} conectada para tu cuenta.
         Tu cuenta ya tiene un identificador reservado para Odoo -- en cuanto esa integración esté activa,
         esta vista se llena sola.`
      )}
    `;
    bindSectionHeader(panel);
  }

  async function renderKpis(panel) {
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/overview`);
    els.lastActivity.textContent = d.lastActivity ? `última actividad: ${fmtDate(d.lastActivity)}` : 'sin actividad aún';

    const t = d.totals;
    panel.innerHTML = `
      ${sectionHeader('kpis', 'KPIs', 'los números clave de tu sitio, de un vistazo')}
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Sesiones totales</p><p class="kpi-value">${fmtNum(t.total_sessions)}</p><p class="kpi-sub">${fmtNum(d.sessionsLast30d)} en los últimos 30 días</p></div>
        <div class="kpi-card"><p class="kpi-label">Pageviews totales</p><p class="kpi-value">${fmtNum(t.total_pageviews)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Visitantes únicos</p><p class="kpi-value">${fmtNum(t.unique_visitors)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Duración prom. sesión</p><p class="kpi-value">${fmtMs(d.avgSessionDurationMs)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Scroll máx. promedio</p><p class="kpi-value">${d.avgMaxScrollPercent ?? '—'}%</p></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h2>Tipo de tráfico <span class="hint">humano vs. IA vs. bots de búsqueda</span></h2>
          <canvas id="chartTraffic" height="180"></canvas>
        </div>
        <div class="card">
          <h2>Top landing pages</h2>
          ${d.topLandingPages.length ? `
            <table>
              <thead><tr><th>Página</th><th class="num">Sesiones</th></tr></thead>
              <tbody>
                ${d.topLandingPages.map((p) => `<tr><td class="mono">${esc(p.landing_path)}</td><td class="num">${fmtNum(p.sessions)}</td></tr>`).join('')}
              </tbody>
            </table>
          ` : '<p class="empty-state">Sin datos todavía</p>'}
        </div>
      </div>
    `;
    bindSectionHeader(panel);

    const ctx = document.getElementById('chartTraffic');
    if (charts.traffic) charts.traffic.destroy();
    const palette = {
      ai_crawler: '#f0a94e', ai_referral: '#e0c07a', search_bot: '#565d6b',
      organic_search: '#46c4b8', direct: '#2c6f68', referral: '#8b93f8'
    };
    const rows = d.trafficBreakdown.length ? d.trafficBreakdown : [{ traffic_source_type: 'sin datos', sessions: 1 }];
    charts.traffic = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: rows.map((r) => r.traffic_source_type),
        datasets: [{
          data: rows.map((r) => Number(r.sessions)),
          backgroundColor: rows.map((r) => palette[r.traffic_source_type] || '#3a4152'),
          borderColor: '#1a1e26', borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { color: '#8b93a3', font: { family: 'IBM Plex Mono', size: 11 }, boxWidth: 10, padding: 12 } } },
        cutout: '65%'
      }
    });
  }

  // ---------------------------------------------------------------------
  // Rendimiento: Campañas | Ventas | Personal | AndRho
  // ---------------------------------------------------------------------
  async function loadPerformanceSubTab(key) {
    document.querySelectorAll('#top-panel-performance > .panel').forEach((p) => (p.hidden = true));
    const panel = document.getElementById(`panel-performance-${key}`);
    panel.hidden = false;
    if (key === 'campanas') await withPanel(panel, (p) => renderErpPlaceholder(p, 'campanas', 'Campañas'));
    else if (key === 'ventas') await withPanel(panel, (p) => renderErpPlaceholder(p, 'ventas', 'Ventas'));
    else if (key === 'personal') await withPanel(panel, renderPersonal);
    else if (key === 'andrho') {
      wireSubTabs(document.getElementById('andrhoTabs'), (innerKey) => loadAndrhoTab(innerKey));
      await loadAndrhoTab('sessions');
    }
  }

  async function renderPersonal(panel) {
    const data = await andrhoApiAuthed('/account/users');
    panel.innerHTML = `
      ${sectionHeader('personal', 'Personal', 'tu equipo en AndRho -- todavía sin métricas de desempeño por persona')}
      <div class="card">
        <h2>Tu equipo <span class="hint">${data.users.length} persona${data.users.length === 1 ? '' : 's'}</span></h2>
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead>
          <tbody>
            ${data.users.map((u) => `
              <tr>
                <td>${esc(u.display_name || '—')}</td>
                <td class="mono">${esc(u.email)}</td>
                <td>${esc(ROLE_LABEL[u.role] || u.role)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${emptyState('Sin métricas de desempeño todavía', 'Cuando existan datos de operaciones/tareas por persona, van a aparecer acá.')}
    `;
    bindSectionHeader(panel);
  }

  // ------- the "AndRho" sub-tab: the tracker's own analytics (formerly the
  // dashboard's top-level tabs) -------
  async function loadAndrhoTab(key) {
    document.querySelectorAll('#panel-performance-andrho > .panel').forEach((p) => (p.hidden = true));
    const panel = document.getElementById(`panel-andrho-${key}`);
    panel.hidden = false;
    await withPanel(panel, (p) => {
      if (key === 'sessions') return renderSessions(p);
      if (key === 'pages') return renderPages(p);
      if (key === 'traffic') return renderAndrhoTraffic(p);
      if (key === 'geo') return renderGeo(p);
      if (key === 'ai') return renderAI(p);
      if (key === 'game') return renderGame(p);
    });
  }

  async function renderSessions(panel) {
    const { limit, offset } = sessionsPage;
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/sessions?limit=${limit}&offset=${offset}`);
    sessionsPage.total = d.total;

    panel.innerHTML = `
      <div class="card">
        <h2>Sesiones <span class="hint">${fmtNum(d.total)} en total — clic en una fila para ver la ruta de navegación</span></h2>
        ${d.sessions.length ? `
        <table>
          <thead>
            <tr>
              <th>Inicio</th><th>Landing</th><th>Origen</th><th>País</th><th>Dispositivo</th>
              <th class="num">Duración</th><th class="num">Páginas</th>
            </tr>
          </thead>
          <tbody>
            ${d.sessions.map((s) => `
              <tr class="row-clickable" data-session="${esc(s.id)}">
                <td class="mono">${fmtDate(s.started_at)}</td>
                <td class="mono">${esc(s.landing_path || '—')}</td>
                <td>${sourceBadge(s.traffic_source_type)}</td>
                <td>${esc(s.country || '—')}${s.city ? ' · ' + esc(s.city) : ''}</td>
                <td>${esc(s.device_type || '—')} · ${esc(s.browser || '—')}</td>
                <td class="num">${fmtMs(s.duration_ms)}</td>
                <td class="num">${fmtNum(s.pageview_count)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="pager">
          <button id="prevPage" ${offset === 0 ? 'disabled' : ''}>← anterior</button>
          <button id="nextPage" ${offset + limit >= d.total ? 'disabled' : ''}>siguiente →</button>
        </div>
        ` : '<p class="empty-state">Todavía no hay sesiones registradas para este sitio.</p>'}
      </div>
    `;

    panel.querySelectorAll('[data-session]').forEach((row) => {
      row.addEventListener('click', () => openSessionDrawer(row.dataset.session));
    });
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.addEventListener('click', () => { sessionsPage.offset = Math.max(0, offset - limit); renderSessions(panel); });
    if (next) next.addEventListener('click', () => { sessionsPage.offset = offset + limit; renderSessions(panel); });
  }

  async function openSessionDrawer(sessionId) {
    els.drawer.classList.add('open');
    els.drawerContent.innerHTML = '<p class="loading-state">cargando…</p>';
    try {
      const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/sessions/${encodeURIComponent(sessionId)}`);
      const s = d.session;
      els.drawerContent.innerHTML = `
        <p class="eyebrow">Sesión</p>
        <h1 style="margin:0 0 16px;font-size:18px;font-family:var(--font-mono)">${esc(s.id.slice(0, 8))}…</h1>
        <dl class="detail-kv">
          <dt>Visitante</dt><dd>${esc(s.visitor_id.slice(0, 12))}…</dd>
          <dt>Landing</dt><dd>${esc(s.landing_path)}</dd>
          <dt>Referrer</dt><dd>${esc(s.referrer || '(directo)')}</dd>
          <dt>UTM</dt><dd>${[s.utm_source, s.utm_medium, s.utm_campaign].filter(Boolean).join(' / ') || '—'}</dd>
          <dt>Origen</dt><dd>${sourceBadge(s.traffic_source_type)}</dd>
          <dt>Ubicación</dt><dd>${esc(s.country || '—')}${s.city ? ' · ' + esc(s.city) : ''}</dd>
          <dt>Dispositivo</dt><dd>${esc(s.device_type || '—')} · ${esc(s.browser || '—')} · ${esc(s.os || '—')}</dd>
          <dt>Duración total</dt><dd>${fmtMs(s.duration_ms)}</dd>
          <dt>Búsqueda</dt><dd>${s.search_keywords ? esc(s.search_keywords) + (s.search_engine ? ' (' + esc(s.search_engine) + ')' : '') : '—'}</dd>
        </dl>

        <p class="eyebrow">Ruta de navegación (${d.path.length} páginas)</p>
        ${d.path.map((p, i) => `
          <div class="path-step">
            <div class="path-step-index">${i}</div>
            <div class="path-step-body">
              <div class="path-step-title">${esc(p.title || '(sin título)')}</div>
              <div class="path-step-path">${esc(p.path)}</div>
              <div class="path-step-stats">
                <span>⏱ ${fmtMs(p.duration_ms)}</span>
                <span>↓ ${p.max_scroll_percent}% scroll</span>
                ${p.content_word_count ? `<span>✎ ${fmtNum(p.content_word_count)} palabras</span>` : ''}
              </div>
              ${p.scrollSegments.length ? renderScrollBars(p.scrollSegments) : ''}
            </div>
          </div>
        `).join('')}
      `;
    } catch (err) {
      els.drawerContent.innerHTML = `<p class="empty-state">Error: ${esc(err.message)}</p>`;
    }
  }

  function renderScrollBars(segments) {
    const byBucket = {};
    segments.forEach((s) => (byBucket[s.depthBucket] = s.timeMs));
    const buckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
    const max = Math.max(1, ...buckets.map((b) => byBucket[b] || 0));
    return `<div class="scroll-bars" title="Tiempo por nivel de profundidad de scroll (0–100%)">
      ${buckets.map((b) => {
        const h = Math.max(2, Math.round(((byBucket[b] || 0) / max) * 28));
        return `<div class="scroll-bar" style="height:${h}px" title="${b}-${b + 10}%: ${fmtMs(byBucket[b] || 0)}"></div>`;
      }).join('')}
    </div>`;
  }

  els.drawerClose.addEventListener('click', () => els.drawer.classList.remove('open'));
  els.drawerBackdrop.addEventListener('click', () => els.drawer.classList.remove('open'));

  async function renderPages(panel) {
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/pages`);
    panel.innerHTML = `
      <div class="card">
        <h2>Páginas <span class="hint">promedios por URL</span></h2>
        ${d.pages.length ? `
        <table>
          <thead><tr><th>Ruta</th><th class="num">Pageviews</th><th class="num">Duración prom.</th><th class="num">Scroll máx. prom.</th></tr></thead>
          <tbody>
            ${d.pages.map((p) => `
              <tr>
                <td class="mono">${esc(p.path)}</td>
                <td class="num">${fmtNum(p.pageviews)}</td>
                <td class="num">${fmtMs(p.avg_duration_ms)}</td>
                <td class="num">${p.avg_max_scroll_percent ?? '—'}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : '<p class="empty-state">Sin datos todavía</p>'}
      </div>
    `;
  }

  async function renderAndrhoTraffic(panel) {
    const [traffic, keywords] = await Promise.all([
      fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/traffic-sources`),
      fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/search-keywords`)
    ]);
    panel.innerHTML = `
      <div class="grid-2">
        <div class="card">
          <h2>Fuentes de tráfico</h2>
          ${traffic.trafficSources.length ? `
          <table>
            <thead><tr><th>Fuente</th><th>Medio</th><th>Tipo</th><th class="num">Sesiones</th></tr></thead>
            <tbody>
              ${traffic.trafficSources.map((r) => `
                <tr><td class="mono">${esc(r.source)}</td><td class="mono">${esc(r.medium)}</td><td>${sourceBadge(r.traffic_source_type)}</td><td class="num">${fmtNum(r.sessions)}</td></tr>
              `).join('')}
            </tbody>
          </table>` : '<p class="empty-state">Sin datos todavía</p>'}
        </div>
        <div class="card">
          <h2>Keywords de búsqueda <span class="hint">orgánico</span></h2>
          ${keywords.keywords.length ? `
          <table>
            <thead><tr><th>Motor</th><th>Keyword</th><th class="num">Sesiones</th></tr></thead>
            <tbody>
              ${keywords.keywords.map((r) => `
                <tr><td class="mono">${esc(r.search_engine)}</td><td>${esc(r.keywords)}</td><td class="num">${fmtNum(r.sessions)}</td></tr>
              `).join('')}
            </tbody>
          </table>` : '<p class="empty-state">Sin tráfico orgánico registrado aún</p>'}
        </div>
      </div>
    `;
  }

  async function renderGeo(panel) {
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/geo`);
    panel.innerHTML = `
      <div class="card">
        <h2>Ubicación de las visitas</h2>
        ${d.geo.length ? `
        <table>
          <thead><tr><th>País</th><th>Ciudad</th><th class="num">Sesiones</th></tr></thead>
          <tbody>
            ${d.geo.map((r) => `<tr><td>${esc(r.country)}</td><td>${esc(r.city)}</td><td class="num">${fmtNum(r.sessions)}</td></tr>`).join('')}
          </tbody>
        </table>` : '<p class="empty-state">Sin datos todavía</p>'}
      </div>
    `;
  }

  async function renderAI(panel) {
    const month = new Date().toISOString().slice(0, 7);
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/ai-visibility?month=${month}`);
    const progress = d.goal ? Math.min(100, d.goal.progressPercent) : 0;
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (progress / 100) * circumference;

    panel.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Hits de AI crawlers (${month})</p><p class="kpi-value ai">${fmtNum(d.aiCrawlerHits.total)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Sesiones AI-referral</p><p class="kpi-value ai">${fmtNum(d.aiReferralTraffic.total)}</p><p class="kpi-sub">humanos que llegaron desde ChatGPT/Perplexity/etc.</p></div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h2>Meta mensual de visibilidad IA</h2>
          ${d.goal ? `
            <div class="goal-ring-wrap">
              <div class="goal-ring">
                <svg width="116" height="116" viewBox="0 0 116 116">
                  <circle cx="58" cy="58" r="50" fill="none" stroke="#262b36" stroke-width="10" />
                  <circle cx="58" cy="58" r="50" fill="none" stroke="#f0a94e" stroke-width="10"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" />
                </svg>
                <div class="goal-ring-value"><strong>${progress}%</strong><span>de la meta</span></div>
              </div>
              <div>
                <p style="margin:0 0 4px;font-family:var(--font-mono);font-size:20px">${fmtNum(d.goal.achieved)} <span style="color:var(--text-tertiary);font-size:13px">/ ${fmtNum(d.goal.targetVisits)}</span></p>
                <p class="kpi-sub" style="margin:0">hits de AI crawlers este mes</p>
              </div>
            </div>
          ` : '<p class="empty-state">No hay meta configurada para este mes.</p>'}
          <form class="goal-form" id="goalForm">
            <input type="number" min="1" id="goalInput" placeholder="ej. 500" value="${d.goal ? d.goal.targetVisits : ''}" />
            <button type="submit">Guardar meta</button>
          </form>
        </div>
        <div class="card">
          <h2>Por bot / producto IA</h2>
          ${d.aiCrawlerHits.byBot.length || d.aiReferralTraffic.byProduct.length ? `
          <table>
            <thead><tr><th>Nombre</th><th>Tipo</th><th class="num">Hits</th></tr></thead>
            <tbody>
              ${d.aiCrawlerHits.byBot.map((b) => `<tr><td class="mono">${esc(b.botName)}</td><td>${sourceBadge('ai_crawler')}</td><td class="num">${fmtNum(b.hits)}</td></tr>`).join('')}
              ${d.aiReferralTraffic.byProduct.map((b) => `<tr><td class="mono">${esc(b.ai_product)}</td><td>${sourceBadge('ai_referral')}</td><td class="num">${fmtNum(b.sessions)}</td></tr>`).join('')}
            </tbody>
          </table>` : '<p class="empty-state">Sin visitas de IA registradas todavía este mes</p>'}
        </div>
      </div>

      <div class="card">
        <h2>Tendencia diaria de hits de AI crawlers</h2>
        <canvas id="chartAiTrend" height="90"></canvas>
      </div>
    `;

    const ctx = document.getElementById('chartAiTrend');
    if (charts.aiTrend) charts.aiTrend.destroy();
    charts.aiTrend = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: d.dailyTrend.map((r) => new Date(r.day).toLocaleDateString('es', { day: '2-digit', month: 'short' })),
        datasets: [{ data: d.dailyTrend.map((r) => Number(r.hits)), backgroundColor: '#f0a94e', borderRadius: 3 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#565d6b', font: { family: 'IBM Plex Mono', size: 10 } } },
          y: { grid: { color: '#1e222b' }, ticks: { color: '#565d6b', font: { family: 'IBM Plex Mono', size: 10 } }, beginAtZero: true }
        }
      }
    });

    document.getElementById('goalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = parseInt(document.getElementById('goalInput').value, 10);
      if (!val || val < 1) return;
      await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/ai-goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, targetVisits: val })
      });
      renderAI(panel);
    });
  }

  async function renderGame(panel) {
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/game`);
    const s = d.summary;

    panel.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Partidas jugadas</p><p class="kpi-value">${fmtNum(s.sessions_played)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Descuentos reclamados</p><p class="kpi-value">${fmtNum(s.discounts_claimed)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Asteroides destruidos (prom.)</p><p class="kpi-value">${s.avg_destroyed ?? '—'}</p></div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h2>Rendimiento por tema <span class="hint">asteroides destruidos por segundo</span></h2>
          <canvas id="chartGameTheme" height="180"></canvas>
        </div>
        <div class="card">
          <h2>Por tema y tipo de comercio</h2>
          ${d.byThemeCommerce.length ? `
          <table>
            <thead><tr><th>Tema</th><th>Comercio</th><th class="num">Segmentos</th><th class="num">Destruidos/seg</th></tr></thead>
            <tbody>
              ${d.byThemeCommerce.map((r) => `
                <tr><td class="mono">${esc(r.theme)}</td><td>${esc(r.commerce_type)}</td><td class="num">${fmtNum(r.segments)}</td><td class="num">${r.avg_destroy_rate ?? '—'}</td></tr>
              `).join('')}
            </tbody>
          </table>` : '<p class="empty-state">Necesitamos más partidas con descuento reclamado para cruzar esto.</p>'}
        </div>
      </div>

      <div class="card">
        <h2>Detalle por tema</h2>
        ${d.byTheme.length ? `
        <table>
          <thead><tr><th>Tema</th><th class="num">Segmentos</th><th class="num">Destruidos</th><th class="num">Perdidos</th><th class="num">Destruidos/seg</th></tr></thead>
          <tbody>
            ${d.byTheme.map((r) => `
              <tr><td class="mono">${esc(r.theme)}</td><td class="num">${fmtNum(r.segments)}</td><td class="num">${fmtNum(r.destroyed)}</td><td class="num">${fmtNum(r.missed)}</td><td class="num">${r.destroy_rate_per_sec ?? '—'}</td></tr>
            `).join('')}
          </tbody>
        </table>` : '<p class="empty-state">Sin partidas registradas todavía</p>'}
      </div>
    `;

    const ctx = document.getElementById('chartGameTheme');
    if (charts.gameTheme) charts.gameTheme.destroy();
    const rows = d.byTheme.length ? d.byTheme : [{ theme: 'sin datos', destroy_rate_per_sec: 0 }];
    charts.gameTheme = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.theme),
        datasets: [{ data: rows.map((r) => Number(r.destroy_rate_per_sec || 0)), backgroundColor: '#8b93f8', borderRadius: 3 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#565d6b', font: { family: 'IBM Plex Mono', size: 10 } } },
          y: { grid: { color: '#1e222b' }, ticks: { color: '#565d6b', font: { family: 'IBM Plex Mono', size: 10 } }, beginAtZero: true }
        }
      }
    });
  }

  // ---------------------------------------------------------------------
  // Sugerencias (per-section drawer + global tab)
  // ---------------------------------------------------------------------
  const STATUS_LABEL = {
    sugerida: 'Sugerida',
    aceptada_en_proceso: 'Aceptada · en proceso',
    terminada: 'Terminada',
    rechazada: 'Rechazada'
  };
  const STATUS_CLASS = {
    sugerida: 'status-sugerida',
    aceptada_en_proceso: 'status-proceso',
    terminada: 'status-terminada',
    rechazada: 'status-rechazada'
  };

  function quotaLabel(quota) {
    if (!quota) return '';
    if (quota.limit < 0) return `∞ sugerencias este mes`;
    return `${Math.max(0, quota.remaining)} de ${quota.limit} sugerencias restantes este mes`;
  }

  async function openSuggestionsDrawer(section) {
    els.drawer.classList.add('open');
    els.drawerContent.innerHTML = '<p class="loading-state">cargando…</p>';
    await renderSuggestionsInto(els.drawerContent, section, { compact: true });
  }

  async function renderSuggestionsInto(container, section, opts) {
    opts = opts || {};
    try {
      const [list, plan] = await Promise.all([
        andrhoApiAuthed(`/suggestions${section ? `?section=${encodeURIComponent(section)}` : ''}`),
        andrhoApiAuthed('/account/plan')
      ]);
      const suggestions = list.suggestions || [];
      const quota = plan.suggestions_quota;

      container.innerHTML = `
        ${opts.compact ? `<p class="eyebrow">Sugerencias${section ? ' · ' + esc(section) : ''}</p><h1 style="margin:0 0 4px;font-size:18px">${section ? esc(section[0].toUpperCase() + section.slice(1)) : 'Todas'}</h1>` : ''}
        <div class="quota-row">
          <span class="quota-label">${esc(quotaLabel(quota))}</span>
          ${roleAtLeast('editor') ? `<button type="button" class="copy-btn" id="newSuggestionBtn" ${quota.limit >= 0 && quota.remaining <= 0 ? 'disabled' : ''}>+ Generar nueva</button>` : ''}
        </div>
        ${suggestions.length ? suggestions.map((s) => `
          <div class="suggestion-card">
            <div class="suggestion-card-head">
              <strong>${esc(s.title)}</strong>
              <span class="status-pill ${STATUS_CLASS[s.status] || ''}">${esc(STATUS_LABEL[s.status] || s.status)}</span>
            </div>
            <p class="suggestion-body">${esc(s.body)}</p>
            ${s.report ? `<p class="suggestion-report">${esc(s.report)}</p>` : ''}
            <p class="hint" style="margin:6px 0 10px">${esc(s.section)} · ${fmtDate(s.created_at)}</p>
            ${roleAtLeast('editor') ? `
              <div class="suggestion-actions" data-id="${esc(s.id)}">
                ${s.status !== 'aceptada_en_proceso' && s.status !== 'terminada' ? `<button type="button" data-status="aceptada_en_proceso">Aceptar</button>` : ''}
                ${s.status === 'aceptada_en_proceso' ? `<button type="button" data-status="terminada">Marcar terminada</button>` : ''}
                ${s.status !== 'rechazada' && s.status !== 'terminada' ? `<button type="button" class="danger" data-status="rechazada">Rechazar</button>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('') : '<p class="empty-state">Sin sugerencias todavía.</p>'}
      `;

      const newBtn = container.querySelector('#newSuggestionBtn');
      if (newBtn) newBtn.addEventListener('click', async () => {
        newBtn.disabled = true;
        try {
          await andrhoApiAuthed('/suggestions', { method: 'POST', body: JSON.stringify({ section: section || 'general' }) });
          await renderSuggestionsInto(container, section, opts);
        } catch (err) {
          alert(err.message || 'No se pudo generar la sugerencia.');
          newBtn.disabled = false;
        }
      });

      container.querySelectorAll('.suggestion-actions').forEach((wrap) => {
        wrap.querySelectorAll('button[data-status]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            try {
              await andrhoApiAuthed(`/suggestions/${encodeURIComponent(wrap.dataset.id)}/status`, {
                method: 'PATCH', body: JSON.stringify({ status: btn.dataset.status })
              });
              await renderSuggestionsInto(container, section, opts);
            } catch (err) {
              alert(err.message || 'No se pudo actualizar la sugerencia.');
            }
          });
        });
      });
    } catch (err) {
      container.innerHTML = `<p class="empty-state">Error: ${esc(err.message)}</p>`;
    }
  }

  async function renderGlobalSuggestions(panel) {
    panel.innerHTML = '<p class="loading-state">cargando…</p>';
    panel.innerHTML = `<div class="card" id="globalSuggestionsCard"></div>`;
    await renderSuggestionsInto(document.getElementById('globalSuggestionsCard'), '', { compact: false });
  }

  // ---------------------------------------------------------------------
  // Actualizaciones (account_events feed)
  // ---------------------------------------------------------------------
  async function renderUpdates(panel) {
    try {
      const d = await andrhoApiAuthed('/account/events?limit=100');
      panel.innerHTML = `
        <div class="card">
          <h2>Actualizaciones <span class="hint">${fmtNum(d.total)} en total</span></h2>
          ${d.events.length ? `
          <table>
            <thead><tr><th>Cuándo</th><th>Tipo</th><th>Descripción</th></tr></thead>
            <tbody>
              ${d.events.map((e) => `
                <tr>
                  <td class="mono">${fmtDate(e.created_at)}</td>
                  <td><span class="badge badge-muted">${esc(e.type)}</span></td>
                  <td>${esc(e.description)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : '<p class="empty-state">Sin actividad registrada todavía.</p>'}
        </div>
      `;
    } catch (err) {
      panel.innerHTML = `<p class="empty-state">Error: ${esc(err.message)}</p>`;
    }
  }

  // ---------------------------------------------------------------------
  // Hoy: today's real session activity + an honest placeholder for staff
  // presence (no such tracking exists yet).
  // ---------------------------------------------------------------------
  async function renderToday(panel) {
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/sessions?limit=100&offset=0`);
    cachedSessions = d.sessions;
    const todayStr = new Date().toDateString();
    const todaysSessions = d.sessions.filter((s) => new Date(s.started_at).toDateString() === todayStr);

    panel.innerHTML = `
      <div class="card">
        <h2>Sitios abiertos hoy <span class="hint">${todaysSessions.length} sesión${todaysSessions.length === 1 ? '' : 'es'} desde la medianoche</span></h2>
        ${todaysSessions.length ? `
        <table>
          <thead><tr><th>Hora</th><th>Landing</th><th>Origen</th><th>País</th></tr></thead>
          <tbody>
            ${todaysSessions.map((s) => `
              <tr>
                <td class="mono">${new Date(s.started_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="mono">${esc(s.landing_path || '—')}</td>
                <td>${sourceBadge(s.traffic_source_type)}</td>
                <td>${esc(s.country || '—')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : '<p class="empty-state">Todavía no hubo visitas hoy.</p>'}
      </div>
      ${emptyState('Personal en cada sitio', 'AndRho todavía no rastrea presencia de tu equipo por sitio -- esta sección va a mostrar eso en cuanto exista esa fuente de datos.')}
    `;
  }

  // ---------------------------------------------------------------------
  // Configuración: team (users/roles) + plan
  // ---------------------------------------------------------------------
  async function renderSettings(panel) {
    try {
      const [usersData, planData] = await Promise.all([
        andrhoApiAuthed('/account/users'),
        andrhoApiAuthed('/account/plan')
      ]);
      const canManageTeam = roleAtLeast('admin');
      const isOwner = roleAtLeast('owner');

      panel.innerHTML = `
        <div class="card">
          <div class="section-head">
            <h2 style="margin:0">Tu equipo</h2>
            ${canManageTeam ? `<button type="button" class="copy-btn" id="inviteBtn">+ Invitar</button>` : ''}
          </div>
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th>${canManageTeam ? '<th></th>' : ''}</tr></thead>
            <tbody>
              ${usersData.users.map((u) => `
                <tr data-user="${esc(u.id)}">
                  <td>${esc(u.display_name || '—')}</td>
                  <td class="mono">${esc(u.email)}</td>
                  <td>
                    ${canManageTeam && u.role !== 'owner' ? `
                      <select class="role-select" data-user-id="${esc(u.id)}">
                        ${['viewer', 'editor', 'admin'].map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${esc(ROLE_LABEL[r])}</option>`).join('')}
                      </select>
                    ` : esc(ROLE_LABEL[u.role] || u.role)}
                  </td>
                  <td>${u.pending ? '<span class="badge badge-muted">invitación pendiente</span>' : '<span class="badge badge-human">activo</span>'}</td>
                  ${canManageTeam ? `<td>${u.role !== 'owner' ? `<button type="button" class="danger-link" data-remove-user="${esc(u.id)}">Quitar</button>` : ''}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <h2>Plan actual: ${esc(PLAN_LABEL[planData.plan] || planData.plan)}</h2>
          <p class="hint" style="margin:0 0 16px">${esc(quotaLabel(planData.suggestions_quota))} · cambiar de plan acá no genera ningún cobro todavía -- solo ajusta qué ve tu cuenta.</p>
          <div class="plan-grid">
            ${['base', 'despegue', 'en_orbita', 'galactico'].map((p) => `
              <div class="plan-card ${p === planData.plan ? 'plan-card-active' : ''}">
                <p class="plan-card-name">${esc(PLAN_LABEL[p])}</p>
                ${isOwner ? `<button type="button" class="copy-btn" data-set-plan="${p}" ${p === planData.plan ? 'disabled' : ''}>${p === planData.plan ? 'Plan actual' : 'Cambiar a este plan'}</button>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const inviteBtn = panel.querySelector('#inviteBtn');
      if (inviteBtn) inviteBtn.addEventListener('click', () => openInviteDrawer());

      panel.querySelectorAll('.role-select').forEach((sel) => {
        sel.addEventListener('change', async () => {
          try {
            await andrhoApiAuthed(`/account/users/${encodeURIComponent(sel.dataset.userId)}/role`, {
              method: 'PATCH', body: JSON.stringify({ role: sel.value })
            });
            renderSettings(panel);
          } catch (err) {
            alert(err.message || 'No se pudo cambiar el rol.');
          }
        });
      });

      panel.querySelectorAll('[data-remove-user]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Quitar a esta persona del equipo?')) return;
          try {
            await andrhoApiAuthed(`/account/users/${encodeURIComponent(btn.dataset.removeUser)}`, { method: 'DELETE' });
            renderSettings(panel);
          } catch (err) {
            alert(err.message || 'No se pudo quitar a esta persona.');
          }
        });
      });

      panel.querySelectorAll('[data-set-plan]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await andrhoApiAuthed('/account/plan', { method: 'PATCH', body: JSON.stringify({ plan: btn.dataset.setPlan }) });
            renderSettings(panel);
          } catch (err) {
            alert(err.message || 'No se pudo cambiar el plan.');
          }
        });
      });
    } catch (err) {
      panel.innerHTML = `<p class="empty-state">Error: ${esc(err.message)}</p>`;
    }
  }

  function openInviteDrawer() {
    els.drawer.classList.add('open');
    els.drawerContent.innerHTML = `
      <p class="eyebrow">Invitar a tu equipo</p>
      <h1 style="margin:0 0 16px;font-size:18px">Nueva invitación</h1>
      <form id="inviteForm" class="invite-form">
        <label>Correo<input type="email" name="email" required /></label>
        <label>Nombre (opcional)<input type="text" name="display_name" /></label>
        <label>Rol
          <select name="role">
            <option value="viewer">Solo lectura</option>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <button type="submit">Generar invitación</button>
      </form>
      <div id="inviteResult"></div>
    `;
    document.getElementById('inviteForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      try {
        const resp = await andrhoApiAuthed('/account/users/invite', {
          method: 'POST',
          body: JSON.stringify({ email: form.get('email'), display_name: form.get('display_name'), role: form.get('role') })
        });
        const link = `${window.location.origin}/accept-invite.html?token=${encodeURIComponent(resp.invite_token)}`;
        document.getElementById('inviteResult').innerHTML = `
          <p class="hint" style="margin:16px 0 8px">Compartí este enlace con ${esc(resp.user.email)} -- todavía no se envía por correo automáticamente:</p>
          <pre class="snippet-box"><code>${esc(link)}</code></pre>
          <button type="button" class="copy-btn copy-btn-full" id="copyInviteLink">Copiar enlace</button>
        `;
        document.getElementById('copyInviteLink').addEventListener('click', (ev) => {
          navigator.clipboard.writeText(link).then(() => {
            ev.currentTarget.textContent = '✓ Copiado';
          });
        });
        e.target.reset();
      } catch (err) {
        document.getElementById('inviteResult').innerHTML = `<p class="empty-state">${esc(err.message)}</p>`;
      }
    });
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  boot();
})();
