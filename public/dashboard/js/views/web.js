// Web: everything the WebTracker measures on the account's site.
import { siteApi, esc, fmtMs, fmtNum, fmtDate, cssVar, chart } from '../core.js';

function overviewHtml(d) {
  const t = d.totals;
  return `
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
}

function mountTrafficChart(d) {
  const palette = {
    ai_crawler: cssVar('--accent-ai'), ai_referral: cssVar('--accent-ai-dim'), search_bot: cssVar('--text-tertiary'),
    organic_search: cssVar('--accent-human'), direct: cssVar('--accent-human-dim'), referral: cssVar('--accent-violet')
  };
  const rows = d.trafficBreakdown.length ? d.trafficBreakdown : [{ traffic_source_type: 'sin datos', sessions: 1 }];
  chart('traffic', document.getElementById('chartTraffic'), {
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
      plugins: { legend: { position: 'bottom', labels: { color: cssVar('--text-secondary'), font: { family: 'JetBrains Mono', size: 11 }, boxWidth: 10, padding: 12 } } },
      cutout: '65%'
    }
  });
}

export default {
  title: 'Web',
  hint: 'lo que mide el rastreador de AndRho en tu sitio',
  async render(el) {
    el.innerHTML = '<p class="loading-state">cargando…</p>';
    const d = await siteApi('/overview');
    document.getElementById('lastActivity').textContent = d.lastActivity ? `última actividad: ${fmtDate(d.lastActivity)}` : 'sin actividad aún';
    el.innerHTML = overviewHtml(d);
    mountTrafficChart(d);
  }
};
