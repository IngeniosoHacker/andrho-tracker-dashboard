(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Auth (real accounts, issued by andrho-api). Each account is locked to
  // exactly one site_id -- there is no more "add a site" flow, no more
  // localStorage list of sites. See README.md for the full auth flow.
  // ---------------------------------------------------------------------
  const LS_ACCESS = 'andrho_access_token';
  const LS_REFRESH = 'andrho_refresh_token';

  // Injected server-side by src/server.js from the ANDRHO_API_URL env var.
  // Trailing slash stripped -- see web/src/lib/authApi.js's API_URL comment
  // for why a trailing slash here silently breaks every /auth/* call.
  const ANDRHO_API_URL = (window.ANDRHO_API_URL || '').replace(/\/+$/, '');

  let account = null;      // { accountId, email, siteId, companyName } from /auth/me
  let activeSiteId = null;
  let activeTab = 'overview';
  let charts = {}; // keep Chart.js instances so we can .destroy() before re-render
  let sessionsPage = { limit: 25, offset: 0, total: 0 };

  const els = {
    dash: document.getElementById('dash'),
    activeSiteEyebrow: document.getElementById('activeSiteEyebrow'),
    activeSiteName: document.getElementById('activeSiteName'),
    lastActivity: document.getElementById('lastActivity'),
    logoutBtn: document.getElementById('logoutBtn'),
    tabs: document.getElementById('tabs'),
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

  // The exact snippet a customer pastes into their own site (see WebTracker's
  // public/tracker.js header comment). data-site-id is the account's site_id
  // -- a slug generated at signup (see andrho-api's auth.GenerateSiteID),
  // never the account's internal database id -- so it's safe to expose here
  // and in page source on the customer's own site.
  const TRACKER_SCRIPT_ORIGIN = 'https://webtracker-production-b8d7.up.railway.app';
  function trackerSnippet(siteId) {
    return `<!-- TRACKER -->\n<script src="${TRACKER_SCRIPT_ORIGIN}/tracker.js"\n        data-site-id="${siteId}"\n        defer></script>`;
  }

  async function copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers/contexts without the async Clipboard API.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = '✓ Copiado';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
  }

  function openTrackerDrawer() {
    els.drawer.classList.add('open');
    const snippet = trackerSnippet(activeSiteId);
    els.drawerContent.innerHTML = `
      <p class="eyebrow">Código de seguimiento</p>
      <h1 style="margin:0 0 8px;font-size:20px">Instala el rastreador en tu sitio</h1>
      <p style="margin:0 0 20px;color:var(--text-secondary);font-size:13px;line-height:1.6">
        Pega este bloque justo antes de <code>&lt;/body&gt;</code> en cada página de tu sitio.
        Empezarás a ver sesiones en este panel apenas alguien lo visite.
      </p>

      <div class="tracker-id-row">
        <div>
          <p class="kpi-label" style="margin:0 0 4px">Tu ID de sitio</p>
          <code class="mono tracker-id-value">${esc(activeSiteId)}</code>
        </div>
        <button type="button" class="copy-btn" data-copy="${esc(activeSiteId)}">Copiar ID</button>
      </div>

      <pre class="snippet-box"><code>${esc(snippet)}</code></pre>
      <button type="button" class="copy-btn copy-btn-full" data-copy-snippet="1">Copiar código completo</button>

      <p style="margin:20px 0 0;color:var(--text-tertiary);font-size:12px;line-height:1.6">
        Este ID identifica tu sitio ante el rastreador — no es el identificador interno de tu cuenta,
        así que es seguro que aparezca en el código fuente público de tu página.
      </p>
    `;
    els.drawerContent.querySelector('[data-copy]').addEventListener('click', (e) => {
      copyToClipboard(activeSiteId, e.currentTarget);
    });
    els.drawerContent.querySelector('[data-copy-snippet]').addEventListener('click', (e) => {
      copyToClipboard(snippet, e.currentTarget);
    });
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

    sessionsPage = { limit: 25, offset: 0, total: 0 };
    await loadTab(activeTab, true);
  }

  async function fetchMe() {
    const data = await andrhoApiFetch('/auth/me', {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
    return {
      accountId: data.account_id || data.id,
      email: data.email,
      siteId: data.site_id,
      companyName: data.company_name
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

  els.tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    els.tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.panel').forEach((p) => (p.hidden = true));
    document.getElementById(`panel-${activeTab}`).hidden = false;
    loadTab(activeTab, false);
  });

  async function loadTab(tab, forceOverviewMeta) {
    const panel = document.getElementById(`panel-${tab}`);
    panel.innerHTML = '<p class="loading-state">cargando…</p>';
    try {
      if (tab === 'overview') await renderOverview(panel, forceOverviewMeta);
      else if (tab === 'sessions') await renderSessions(panel);
      else if (tab === 'pages') await renderPages(panel);
      else if (tab === 'traffic') await renderTraffic(panel);
      else if (tab === 'geo') await renderGeo(panel);
      else if (tab === 'ai') await renderAI(panel);
      else if (tab === 'game') await renderGame(panel);
    } catch (err) {
      if (err.status === 401) { clearTokensAndRedirect('/login.html'); return; }
      panel.innerHTML = `<p class="empty-state">Error cargando datos: ${esc(err.message)}</p>`;
    }
  }

  // ---------------------------------------------------------------------
  // Tab: Overview
  // ---------------------------------------------------------------------
  async function renderOverview(panel, updateHeader) {
    const d = await fetchJSON(`/api/sites/${encodeURIComponent(activeSiteId)}/overview`);

    if (updateHeader) {
      els.lastActivity.textContent = d.lastActivity ? `última actividad: ${fmtDate(d.lastActivity)}` : 'sin actividad aún';
    }

    const t = d.totals;
    panel.innerHTML = `
      <button type="button" class="tracker-card" id="trackerCardBtn">
        <div class="tracker-card-text">
          <p class="eyebrow" style="margin:0 0 6px">Código de seguimiento</p>
          <p class="tracker-card-title">Tu ID de sitio: <code class="mono">${esc(activeSiteId)}</code></p>
          <p class="kpi-sub" style="margin-top:4px">Clic para ver cómo instalarlo en tu sitio</p>
        </div>
        <span class="tracker-card-cta">Ver instrucciones →</span>
      </button>

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

    document.getElementById('trackerCardBtn').addEventListener('click', openTrackerDrawer);

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
  // Tab: Sessions (list + click-through detail drawer)
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Tab: Pages
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Tab: Traffic & keywords
  // ---------------------------------------------------------------------
  async function renderTraffic(panel) {
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

  // ---------------------------------------------------------------------
  // Tab: Geo
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Tab: AI visibility (goal ring + bot breakdown + trend)
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Tab: Minijuego (color-scheme experiment — see andrho's AsteroidGame)
  // ---------------------------------------------------------------------
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
  // Boot
  // ---------------------------------------------------------------------
  boot();
})();
