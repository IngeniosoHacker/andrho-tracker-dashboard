(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // State + persistence (localStorage acts as the "session" -- no server auth)
  // ---------------------------------------------------------------------
  const LS_SITES = 'wtd_sites';       // [{id, name}]
  const LS_ACTIVE = 'wtd_active_site';

  let sites = JSON.parse(localStorage.getItem(LS_SITES) || '[]');
  let activeSiteId = localStorage.getItem(LS_ACTIVE) || null;
  let activeTab = 'overview';
  let charts = {}; // keep Chart.js instances so we can .destroy() before re-render
  let sessionsPage = { limit: 25, offset: 0, total: 0 };

  const els = {
    siteList: document.getElementById('siteList'),
    addSiteBtn: document.getElementById('addSiteBtn'),
    gate: document.getElementById('gate'),
    gateForm: document.getElementById('gateForm'),
    gateInput: document.getElementById('gateInput'),
    gateError: document.getElementById('gateError'),
    dash: document.getElementById('dash'),
    activeSiteName: document.getElementById('activeSiteName'),
    lastActivity: document.getElementById('lastActivity'),
    tabs: document.getElementById('tabs'),
    drawer: document.getElementById('drawer'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    drawerClose: document.getElementById('drawerClose'),
    drawerContent: document.getElementById('drawerContent')
  };

  // ---------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------
  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) {
      let msg = res.statusText;
      try { const j = await res.json(); msg = j.error || msg; } catch {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
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

  // ---------------------------------------------------------------------
  // Sidebar / site management ("login" = knowing a valid site_id)
  // ---------------------------------------------------------------------
  function saveSites() { localStorage.setItem(LS_SITES, JSON.stringify(sites)); }
  function saveActive() { localStorage.setItem(LS_ACTIVE, activeSiteId || ''); }

  function renderSidebar() {
    if (!sites.length) {
      els.siteList.innerHTML = `<p class="empty-state" style="padding:20px 4px">Aún no agregaste ningún sitio.</p>`;
      return;
    }
    els.siteList.innerHTML = sites.map((s) => `
      <div class="site-item ${s.id === activeSiteId ? 'active' : ''}" data-site="${esc(s.id)}">
        <div class="site-item-row">
          <span class="site-id">${esc(s.id)}</span>
          <button class="site-remove" data-remove="${esc(s.id)}" title="Quitar">✕</button>
        </div>
        <span class="site-meta"><span class="dot ${s.id === activeSiteId ? 'dot-ok' : 'dot-muted'}"></span>${esc(s.name || 'sin nombre')}</span>
      </div>
    `).join('');

    els.siteList.querySelectorAll('.site-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.site-remove')) return;
        selectSite(el.dataset.site);
      });
    });
    els.siteList.querySelectorAll('.site-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSite(btn.dataset.remove);
      });
    });
  }

  function removeSite(id) {
    sites = sites.filter((s) => s.id !== id);
    saveSites();
    if (activeSiteId === id) {
      activeSiteId = sites[0] ? sites[0].id : null;
      saveActive();
    }
    renderSidebar();
    renderMain();
  }

  async function selectSite(id) {
    activeSiteId = id;
    saveActive();
    renderSidebar();
    await renderMain();
  }

  async function addSiteFlow(idRaw) {
    const id = (idRaw || '').trim();
    els.gateError.textContent = '';
    if (!id) return;
    try {
      const result = await fetchJSON(`/api/sites/${encodeURIComponent(id)}/verify`);
      if (!result.exists) {
        els.gateError.textContent = `No existe un sitio con id "${id}" en la base de datos.`;
        return;
      }
      if (!sites.some((s) => s.id === id)) {
        sites.push({ id: result.site.id, name: result.site.name });
        saveSites();
      }
      els.gateInput.value = '';
      await selectSite(id);
    } catch (err) {
      els.gateError.textContent = 'No se pudo verificar el sitio: ' + err.message;
    }
  }

  els.gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addSiteFlow(els.gateInput.value);
  });
  els.addSiteBtn.addEventListener('click', () => {
    els.gate.hidden = false;
    els.dash.hidden = true;
    els.gateInput.focus();
  });

  // ---------------------------------------------------------------------
  // Main dashboard render
  // ---------------------------------------------------------------------
  async function renderMain() {
    if (!activeSiteId) {
      els.gate.hidden = false;
      els.dash.hidden = true;
      return;
    }
    els.gate.hidden = true;
    els.dash.hidden = false;

    const site = sites.find((s) => s.id === activeSiteId);
    els.activeSiteName.textContent = site ? site.id : activeSiteId;

    sessionsPage = { limit: 25, offset: 0, total: 0 };
    await loadTab(activeTab, true);
  }

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
  renderSidebar();
  if (activeSiteId && sites.some((s) => s.id === activeSiteId)) {
    renderMain();
  } else {
    els.gate.hidden = false;
    els.dash.hidden = true;
  }
})();
