// Web: everything the WebTracker measures on the account's site, with the
// tab-per-report layout the dashboard had before the sidebar (f33d39b):
// Resumen, Sesiones, Páginas, Tráfico & Keywords, Geografía, Visibilidad IA
// and Minijuego. The tab lives in the route (#/web/sesiones) so a reload or
// a shared link opens the same report.
import {
  session, siteApi, esc, fmtMs, fmtNum, fmtDate, sourceBadge, cssVar, chart, barChartOptions,
  openDrawer, tabStrip, wireTabs, withPanel, setSubRoute
} from '../core.js';
import { renderArticles } from './articles.js';

const TRACKER_SCRIPT_ORIGIN = 'https://webtracker-production-b8d7.up.railway.app';

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'sesiones', label: 'Sesiones' },
  { key: 'paginas', label: 'Páginas' },
  { key: 'trafico', label: 'Tráfico &amp; Keywords' },
  { key: 'geografia', label: 'Geografía' },
  { key: 'ia', label: 'Visibilidad IA' },
  { key: 'minijuego', label: 'Minijuego' },
  { key: 'articulos', label: 'Artículos' }
];

const RENDER = {
  resumen: renderOverview,
  sesiones: renderSessions,
  paginas: renderPages,
  trafico: renderTraffic,
  geografia: renderGeo,
  ia: renderAI,
  minijuego: renderGame,
  articulos: renderArticles
};

let sessionsPage = { limit: 25, offset: 0, total: 0 };
let panelEl = null;

function siteId() { return session.account.siteId; }

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

function trackerSnippet(id) {
  return `<!-- TRACKER -->\n<script src="${TRACKER_SCRIPT_ORIGIN}/tracker.js"\n        data-site-id="${id}"\n        defer></script>`;
}

// The install instructions: the public site_id (safe to embed, it's not the
// account's internal id) and the exact <script> tag for it.
function openTrackerDrawer() {
  const id = siteId();
  const snippet = trackerSnippet(id);
  const box = openDrawer(`
    <p class="eyebrow">Código de seguimiento</p>
    <h1 class="drawer-title">Instala el rastreador en tu sitio</h1>
    <p class="drawer-text">
      Pega este bloque justo antes de <code>&lt;/body&gt;</code> en cada página de tu sitio.
      Empezarás a ver sesiones en este panel apenas alguien lo visite.
    </p>
    <div class="tracker-id-row">
      <div>
        <p class="kpi-label" style="margin:0 0 4px">Tu ID de sitio</p>
        <code class="mono tracker-id-value">${esc(id)}</code>
      </div>
      <button type="button" class="copy-btn" data-copy-id>Copiar ID</button>
    </div>
    <pre class="snippet-box"><code>${esc(snippet)}</code></pre>
    <button type="button" class="copy-btn copy-btn-full" data-copy-snippet>Copiar código completo</button>
    <p class="drawer-note">
      Este ID identifica tu sitio ante el rastreador; no es el identificador interno de tu cuenta,
      así que es seguro que aparezca en el código fuente público de tu página.
    </p>
  `);
  box.querySelector('[data-copy-id]').addEventListener('click', (e) => copyToClipboard(id, e.currentTarget));
  box.querySelector('[data-copy-snippet]').addEventListener('click', (e) => copyToClipboard(snippet, e.currentTarget));
}

// ---------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------
async function renderOverview(panel) {
  const d = await siteApi('/overview');
  document.getElementById('lastActivity').textContent = d.lastActivity ? `última actividad: ${fmtDate(d.lastActivity)}` : 'sin actividad aún';
  const t = d.totals;
  panel.innerHTML = `
    <button type="button" class="tracker-card" id="trackerCardBtn">
      <div>
        <p class="eyebrow" style="margin:0 0 6px">Código de seguimiento</p>
        <p class="tracker-card-title">Tu ID de sitio: <code class="mono">${esc(siteId())}</code></p>
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
        <div class="chart-box"><canvas id="chartTraffic"></canvas></div>
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
  panel.querySelector('#trackerCardBtn').addEventListener('click', openTrackerDrawer);

  const palette = {
    ai_crawler: cssVar('--accent-ai'), ai_referral: cssVar('--accent-ai-dim'), search_bot: cssVar('--text-tertiary'),
    organic_search: cssVar('--accent-human'), direct: cssVar('--accent-human-dim'), referral: cssVar('--accent-violet')
  };
  const rows = d.trafficBreakdown.length ? d.trafficBreakdown : [{ traffic_source_type: 'sin datos', sessions: 1 }];
  chart('traffic', panel.querySelector('#chartTraffic'), {
    type: 'doughnut',
    data: {
      labels: rows.map((r) => r.traffic_source_type),
      datasets: [{
        data: rows.map((r) => Number(r.sessions)),
        backgroundColor: rows.map((r) => palette[r.traffic_source_type] || cssVar('--border')),
        borderColor: cssVar('--bg-elevated'), borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: cssVar('--text-secondary'), font: { family: 'JetBrains Mono', size: 11 }, boxWidth: 10, padding: 12 } } },
      cutout: '65%'
    }
  });
}

// ---------------------------------------------------------------------
// Sesiones (list + click-through navigation path)
// ---------------------------------------------------------------------
async function renderSessions(panel) {
  const { limit, offset } = sessionsPage;
  const d = await siteApi(`/sessions?limit=${limit}&offset=${offset}`);
  sessionsPage.total = d.total;

  panel.innerHTML = `
    <div class="card">
      <h2>Sesiones <span class="hint">${fmtNum(d.total)} en total · clic en una fila para ver la ruta de navegación</span></h2>
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
            <tr class="row-clickable" data-session="${esc(s.id)}" tabindex="0">
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
        <button type="button" data-page="prev" ${offset === 0 ? 'disabled' : ''}>← anterior</button>
        <button type="button" data-page="next" ${offset + limit >= d.total ? 'disabled' : ''}>siguiente →</button>
      </div>
      ` : '<p class="empty-state">Todavía no hay sesiones registradas para este sitio.</p>'}
    </div>
  `;

  panel.querySelectorAll('[data-session]').forEach((row) => {
    row.addEventListener('click', () => openSessionDrawer(row.dataset.session));
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter') openSessionDrawer(row.dataset.session); });
  });
  const prev = panel.querySelector('[data-page="prev"]');
  const next = panel.querySelector('[data-page="next"]');
  if (prev) prev.addEventListener('click', () => { sessionsPage.offset = Math.max(0, offset - limit); withPanel(panel, renderSessions); });
  if (next) next.addEventListener('click', () => { sessionsPage.offset = offset + limit; withPanel(panel, renderSessions); });
}

async function openSessionDrawer(sessionId) {
  const box = openDrawer();
  try {
    const d = await siteApi(`/sessions/${encodeURIComponent(sessionId)}`);
    const s = d.session;
    box.innerHTML = `
      <p class="eyebrow">Sesión</p>
      <h1 class="drawer-title mono">${esc(s.id.slice(0, 8))}…</h1>
      <dl class="detail-kv">
        <dt>Visitante</dt><dd>${esc(s.visitor_id.slice(0, 12))}…</dd>
        <dt>Landing</dt><dd>${esc(s.landing_path)}</dd>
        <dt>Referrer</dt><dd>${esc(s.referrer || '(directo)')}</dd>
        <dt>UTM</dt><dd>${esc([s.utm_source, s.utm_medium, s.utm_campaign].filter(Boolean).join(' / ') || '—')}</dd>
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
    box.innerHTML = `<p class="empty-state">Error: ${esc(err.message)}</p>`;
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

// ---------------------------------------------------------------------
// Páginas
// ---------------------------------------------------------------------
async function renderPages(panel) {
  const d = await siteApi('/pages');
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
// Tráfico & Keywords
// ---------------------------------------------------------------------
async function renderTraffic(panel) {
  const [traffic, keywords] = await Promise.all([siteApi('/traffic-sources'), siteApi('/search-keywords')]);
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
// Geografía
// ---------------------------------------------------------------------
async function renderGeo(panel) {
  const d = await siteApi('/geo');
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
// Visibilidad IA (+ monthly goal + SEO/GEO readiness audit)
// ---------------------------------------------------------------------
async function renderAI(panel) {
  const month = new Date().toISOString().slice(0, 7);
  const d = await siteApi(`/ai-visibility?month=${month}`);
  const progress = d.goal ? Math.min(100, d.goal.progressPercent) : 0;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (progress / 100) * circumference;

  panel.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">Hits de AI crawlers (${month})</p><p class="kpi-value ai">${fmtNum(d.aiCrawlerHits.total)}</p></div>
      <div class="kpi-card"><p class="kpi-label">Sesiones AI-referral</p><p class="kpi-value ai">${fmtNum(d.aiReferralTraffic.total)}</p><p class="kpi-sub">personas que llegaron desde ChatGPT, Perplexity y similares</p></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h2>Meta mensual de visibilidad IA</h2>
        ${d.goal ? `
          <div class="goal-ring-wrap">
            <div class="goal-ring">
              <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden="true">
                <circle cx="58" cy="58" r="50" fill="none" stroke="${cssVar('--border')}" stroke-width="10" />
                <circle cx="58" cy="58" r="50" fill="none" stroke="${cssVar('--accent-ai')}" stroke-width="10"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" />
              </svg>
              <div class="goal-ring-value"><strong>${progress}%</strong><span>de la meta</span></div>
            </div>
            <div>
              <p class="goal-count">${fmtNum(d.goal.achieved)} <span>/ ${fmtNum(d.goal.targetVisits)}</span></p>
              <p class="kpi-sub" style="margin:0">hits de AI crawlers este mes</p>
            </div>
          </div>
        ` : '<p class="empty-state">No hay meta configurada para este mes.</p>'}
        <form class="goal-form" id="goalForm">
          <input type="number" min="1" id="goalInput" placeholder="ej. 500" aria-label="Meta mensual de hits" value="${d.goal ? d.goal.targetVisits : ''}" />
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
      <div class="chart-box chart-box-short"><canvas id="chartAiTrend"></canvas></div>
    </div>

    <div class="card seo-audit" id="seoAuditCard">
      <h2>Preparación para buscadores e IA</h2>
      <p class="loading-state">Revisando tu sitio como lo ve un rastreador…</p>
    </div>
  `;
  renderSeoAudit(panel.querySelector('#seoAuditCard'));

  chart('aiTrend', panel.querySelector('#chartAiTrend'), {
    type: 'bar',
    data: {
      labels: d.dailyTrend.map((r) => new Date(r.day).toLocaleDateString('es', { day: '2-digit', month: 'short' })),
      datasets: [{ data: d.dailyTrend.map((r) => Number(r.hits)), backgroundColor: cssVar('--accent-ai'), borderRadius: 3 }]
    },
    options: Object.assign(barChartOptions(), { maintainAspectRatio: false })
  });

  panel.querySelector('#goalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = parseInt(panel.querySelector('#goalInput').value, 10);
    if (!val || val < 1) return;
    await siteApi('/ai-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, targetVisits: val })
    });
    withPanel(panel, renderAI);
  });
}

// SEO/GEO readiness: what search engines and AI crawlers can read (and are
// allowed to read) on the site's public origin. Loaded on its own so a slow
// third-party site never blocks the rest of the tab.
async function renderSeoAudit(card, refresh) {
  const title = '<h2>Preparación para buscadores e IA <span class="hint">cómo te ve un rastreador sin JavaScript</span></h2>';
  let d;
  try {
    d = await siteApi(`/seo-audit${refresh ? '?refresh=1' : ''}`);
  } catch {
    card.innerHTML = `${title}<p class="empty-state">No se pudo revisar tu sitio ahora.</p>`;
    return;
  }
  if (!d.origin) {
    card.innerHTML = `${title}<p class="empty-state">${esc(d.reason || 'Sin datos todavía')}</p>`;
    return;
  }
  const label = { ok: 'Bien', warn: 'Mejorable', fail: 'Falta' };
  card.innerHTML = `
    ${title}
    <div class="seo-audit-head">
      <div class="seo-score"><strong>${d.score}</strong><span>/100</span></div>
      <div>
        <p class="mono" style="margin:0">${esc(d.origin)}</p>
        <p class="kpi-sub" style="margin:4px 0 0">Revisado ${esc(new Date(d.checkedAt).toLocaleString('es'))}</p>
      </div>
      <button type="button" class="copy-btn" data-refresh>Volver a revisar</button>
    </div>
    <ul class="seo-checks">
      ${d.checks.map((c) => `
        <li class="seo-check seo-${c.status}">
          <span class="status-pill seo-pill-${c.status}">${label[c.status]}</span>
          <div>
            <p class="seo-check-label">${esc(c.label)}</p>
            <p class="seo-check-detail">${esc(c.detail)}</p>
            ${c.fix ? `<p class="seo-check-fix">${esc(c.fix)}</p>` : ''}
          </div>
        </li>`).join('')}
    </ul>
    ${d.crawlers ? `
      <p class="seo-crawlers">${d.crawlers.map((c) => `<span class="badge ${c.allowed ? 'badge-human' : 'badge-muted'}">${c.allowed ? '✓' : '✕'} ${esc(c.label)}</span>`).join(' ')}</p>` : ''}
  `;
  card.querySelector('[data-refresh]').addEventListener('click', () => {
    card.querySelector('.seo-checks').style.opacity = '0.5';
    renderSeoAudit(card, true);
  });
}

// ---------------------------------------------------------------------
// Minijuego (the landing's asteroids game: color-scheme experiment)
// ---------------------------------------------------------------------
async function renderGame(panel) {
  const d = await siteApi('/game');
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
        <div class="chart-box"><canvas id="chartGameTheme"></canvas></div>
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

  const rows = d.byTheme.length ? d.byTheme : [{ theme: 'sin datos', destroy_rate_per_sec: 0 }];
  chart('gameTheme', panel.querySelector('#chartGameTheme'), {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.theme),
      datasets: [{ data: rows.map((r) => Number(r.destroy_rate_per_sec || 0)), backgroundColor: cssVar('--accent-violet'), borderRadius: 3 }]
    },
    options: Object.assign(barChartOptions(), { maintainAspectRatio: false })
  });
}

// ---------------------------------------------------------------------
// View
// ---------------------------------------------------------------------
function showTab(key) {
  if (!RENDER[key]) key = 'resumen';
  const nav = document.getElementById('webTabs');
  nav.querySelectorAll('[data-tab]').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === key);
    t.setAttribute('aria-selected', t.dataset.tab === key);
  });
  setSubRoute('web', key === 'resumen' ? '' : key);
  return withPanel(panelEl, RENDER[key]);
}

export default {
  title: 'Web',
  hint: 'lo que mide el rastreador de AndRho en tu sitio',
  async render(el, route) {
    sessionsPage = { limit: 25, offset: 0, total: 0 };
    el.innerHTML = `${tabStrip('webTabs', TABS, 'resumen')}<div class="panel" id="webPanel"></div>`;
    panelEl = el.querySelector('#webPanel');
    wireTabs(el.querySelector('#webTabs'), showTab);
    await showTab(route.sub);
  },
  onSubRoute(sub) { return showTab(sub); }
};
