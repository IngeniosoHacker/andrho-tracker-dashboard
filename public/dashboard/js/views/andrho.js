// Métricas AndRho (staff admins): AndRho's own numbers. The waiting list
// (who's coming and what they need), the landing's minigame, the ranking of
// what to build first, and the accounts already on board.
import {
  andrhoApi, esc, fmtNum, fmtDate, cssVar, chart, barChartOptions, tabStrip, wireTabs, setSubRoute, withPanel
} from '../core.js';

const TABS = [
  { key: 'prioridades', label: 'Prioridades' },
  { key: 'lista', label: 'Lista de espera' },
  { key: 'minijuego', label: 'Minijuego' },
  { key: 'cuentas', label: 'Cuentas' }
];

// Labels for the survey's values.
const L = {
  comercio: 'Comercio', restaurantes: 'Restaurantes', servicios: 'Servicios', manufactura: 'Manufactura', logistica: 'Logística', salud: 'Salud', otro: 'Otro',
  solo: 'Solo', '1-10': '2–10', '11-50': '11–50', '51-200': '51–200', '200+': '200+',
  papel: 'Papel', excel: 'Excel', software: 'Software', erp: 'ERP', varias: 'Varias herramientas', nada: 'Nada formal',
  datos_dispersos: 'Datos regados', no_me_dice: 'Datos que no dicen nada', reportes_tarde: 'Reportes tarde', dificil: 'Sistema difícil',
  caro: 'Sistema caro', no_conecta: 'No se conecta', pierdo_control: 'Pierde control', soporte: 'Soporte lento', sin_sistema: 'Sin sistema',
  finanzas: 'Finanzas', ventas: 'Ventas / POS', inventario: 'Inventario', marketing: 'Marketing', clientes: 'Clientes', compras: 'Compras',
  produccion: 'Producción', rrhh: 'Personal', sitio_web: 'Sitio web', analitica: 'Análisis con IA', unificacion: 'Unificación',
  tracking: 'Rastreador', redes: 'Redes', redes_creacion: 'Creación de redes', whatsapp: 'WhatsApp', vencimientos: 'Vencimientos',
  mermas: 'Mermas', agenda: 'Agenda', citas: 'Citas', rutas: 'Rutas',
  mas_clientes: 'Más clientes', vender_mas: 'Vender más', organizarse: 'Organizarse', digitalizarse: 'Digitalizarse', automatizar: 'Automatizar',
  decidir_mejor: 'Decidir mejor', reducir_perdidas: 'Reducir pérdidas', mas_vistas: 'Más vistas', mas_seguidores: 'Más seguidores',
  basico: 'Lo esencial', crecer: 'Crecer', todo: 'Todo mi negocio',
  despegue: 'Despegue', en_orbita: 'En Órbita', galactico: 'Galáctico', base: 'Base', rapida: 'Rápida', personalizada: 'Personalizada'
};
const label = (v) => L[v] || v;

let panelEl = null;
let overview = null;

// A list of { value, count } as horizontal bars.
function bars(rows, max) {
  if (!rows || !rows.length) return '<p class="empty-state">Sin datos todavía</p>';
  const top = Math.max(1, ...rows.map((r) => r.count));
  return `<ul class="hbars">${rows.slice(0, max || 10).map((r) => `
    <li><span class="hbar-label">${esc(label(r.value))}</span>
      <span class="hbar-track"><span class="hbar-fill" style="width:${Math.round((r.count / top) * 100)}%"></span></span>
      <span class="hbar-value">${fmtNum(r.count)}</span></li>`).join('')}</ul>`;
}

function renderPriorities(panel) {
  const u = overview.urgency;
  panel.innerHTML = `
    <div class="card">
      <h2>Qué construir primero <span class="hint">lo que piden, lo que el Analyzer sugiere, sus dolores y lo que ya activaron las cuentas</span></h2>
      ${u.length ? `
      <table>
        <thead><tr><th>#</th><th>Módulo</th><th>Urgencia</th><th class="num">Lo piden</th><th class="num">Sugerido</th><th class="num">Por dolor</th><th class="num">Cuentas</th></tr></thead>
        <tbody>${u.map((p, i) => `
          <tr>
            <td class="mono">${i + 1}</td>
            <td><strong>${esc(p.name)}</strong></td>
            <td style="min-width:160px"><span class="hbar-track"><span class="hbar-fill" style="width:${p.share}%"></span></span></td>
            <td class="num">${fmtNum(p.requested)}</td><td class="num">${fmtNum(p.suggested)}</td>
            <td class="num">${fmtNum(p.pains)}</td><td class="num">${fmtNum(p.accounts)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p class="hint" style="margin:12px 0 0">Urgencia = pedidos + ½ sugeridos + ½ dolores que el módulo resuelve + 1½ cuentas que ya lo activaron.</p>` : '<p class="empty-state">Sin datos todavía</p>'}
    </div>
  `;
}

async function renderWaitlist(panel) {
  const w = overview.waitlist;
  const list = await andrhoApi('/admin/waitlist?limit=50');
  const f = w.fields;
  const accepted = w.plan_match.filter((m) => m.recommended === m.picked).reduce((n, m) => n + m.count, 0);
  const matched = w.plan_match.reduce((n, m) => n + m.count, 0);
  panel.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">En la lista</p><p class="kpi-value">${fmtNum(w.total)}</p><p class="kpi-sub">${fmtNum(w.last_7_days)} en los últimos 7 días</p></div>
      <div class="kpi-card"><p class="kpi-label">Aceptan la recomendación</p><p class="kpi-value">${matched ? Math.round((100 * accepted) / matched) : '—'}${matched ? '%' : ''}</p><p class="kpi-sub">eligen el plan que les recomendamos</p></div>
      <div class="kpi-card"><p class="kpi-label">Satisfacción con lo que usan</p><p class="kpi-value">${w.avg_satisfaction || '—'}</p><p class="kpi-sub">de 5, quienes tienen sistema</p></div>
    </div>
    <div class="card"><h2>Registros por día <span class="hint">últimos 30 días</span></h2><div class="chart-box chart-box-short"><canvas id="chartWlDaily"></canvas></div></div>
    <div class="grid-2">
      <div class="card"><h2>Áreas que piden</h2>${bars(f.modules)}</div>
      <div class="card"><h2>Lo que más les frena</h2>${bars(f.pain_points)}</div>
      <div class="card"><h2>Giro</h2>${bars(f.sectors)}</div>
      <div class="card"><h2>Con qué administran hoy</h2>${bars(f.management)}</div>
      <div class="card"><h2>Qué esperan</h2>${bars(f.expectations)}</div>
      <div class="card"><h2>Tamaño</h2>${bars(f.company_size)}</div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h2>Recomendado contra elegido</h2>
        ${w.plan_match.length ? `<table><thead><tr><th>Recomendamos</th><th>Eligieron</th><th class="num">Personas</th></tr></thead><tbody>
          ${w.plan_match.map((m) => `<tr class="${m.recommended === m.picked ? '' : 'row-muted'}"><td>${esc(label(m.recommended))}</td><td>${esc(label(m.picked))}</td><td class="num">${fmtNum(m.count)}</td></tr>`).join('')}
        </tbody></table>` : '<p class="empty-state">Sin datos todavía</p>'}
      </div>
      <div class="card">
        <h2>Si pudieran mejorar una sola cosa</h2>
        ${w.improvements.length ? `<ul class="quote-list">${w.improvements.slice(0, 12).map((t) => `<li>“${esc(t)}”</li>`).join('')}</ul>` : '<p class="empty-state">Sin respuestas todavía</p>'}
      </div>
    </div>
    <div class="card">
      <h2>Últimos registros</h2>
      <table>
        <thead><tr><th>Cuándo</th><th>Nombre</th><th>Empresa</th><th>Contacto</th><th>Giro</th><th>Tamaño</th><th>Plan</th></tr></thead>
        <tbody>${list.submissions.map((s) => `
          <tr>
            <td class="mono">${fmtDate(s.created_at)}</td><td>${esc(s.name)}</td><td>${esc(s.company)}</td>
            <td class="mono">${esc(s.email)}${s.phone ? `<br>${esc(s.phone)}` : ''}</td>
            <td>${s.sectors.map(label).map(esc).join(', ')}</td><td>${esc(label(s.company_size))}</td>
            <td>${esc(label(s.plan_interest))}${s.recommended_plan && s.recommended_plan !== s.plan_interest ? ` <span class="hint">(rec. ${esc(label(s.recommended_plan))})</span>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
  chart('wlDaily', panel.querySelector('#chartWlDaily'), {
    type: 'bar',
    data: { labels: w.daily.map((d) => d.value.slice(5)), datasets: [{ data: w.daily.map((d) => d.count), backgroundColor: cssVar('--accent-human'), borderRadius: 3 }] },
    options: Object.assign(barChartOptions(), { maintainAspectRatio: false })
  });
}

async function renderGame(panel) {
  const g = await andrhoApi('/admin/game');
  panel.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">Partidas</p><p class="kpi-value">${fmtNum(g.sessions)}</p></div>
      <div class="kpi-card"><p class="kpi-label">Descuentos reclamados</p><p class="kpi-value">${fmtNum(g.registrations)}</p><p class="kpi-sub">${g.sessions ? Math.round((100 * g.registrations) / g.sessions) : 0}% de las partidas</p></div>
      <div class="kpi-card"><p class="kpi-label">Asteroides por partida</p><p class="kpi-value">${g.avg_destroyed || '—'}</p></div>
    </div>
    <div class="grid-2">
      <div class="card"><h2>Rendimiento por tema <span class="hint">destruidos por segundo</span></h2><div class="chart-box"><canvas id="chartGameThemes"></canvas></div></div>
      <div class="card">
        <h2>Detalle por tema</h2>
        ${g.by_theme.length ? `<table><thead><tr><th>Tema</th><th class="num">Segmentos</th><th class="num">Destruidos</th><th class="num">Perdidos</th><th class="num">Por seg.</th></tr></thead><tbody>
          ${g.by_theme.map((t) => `<tr><td class="mono">${esc(t.theme)}</td><td class="num">${fmtNum(t.segments)}</td><td class="num">${fmtNum(t.destroyed)}</td><td class="num">${fmtNum(t.missed)}</td><td class="num">${t.rate_per_sec}</td></tr>`).join('')}
        </tbody></table>` : '<p class="empty-state">Sin partidas todavía</p>'}
      </div>
      <div class="card"><h2>Quién reclama el descuento <span class="hint">tipo de comercio</span></h2>${bars(g.by_commerce)}</div>
      <div class="card"><h2>Descuentos ganados</h2>${bars(g.discount_tiers)}</div>
    </div>
  `;
  chart('gameThemes', panel.querySelector('#chartGameThemes'), {
    type: 'bar',
    data: { labels: g.by_theme.map((t) => t.theme), datasets: [{ data: g.by_theme.map((t) => t.rate_per_sec), backgroundColor: cssVar('--accent-violet'), borderRadius: 3 }] },
    options: Object.assign(barChartOptions(), { maintainAspectRatio: false })
  });
}

function renderAccounts(panel) {
  const a = overview.accounts;
  const jobs = {};
  for (const p of a.provisioning) {
    const [kind, status] = p.value.split(':');
    (jobs[kind] = jobs[kind] || []).push({ value: status, count: p.count });
  }
  panel.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">Cuentas</p><p class="kpi-value">${fmtNum(a.total)}</p><p class="kpi-sub">${fmtNum(a.last_30_days)} en 30 días</p></div>
    </div>
    <div class="grid-2">
      <div class="card"><h2>Por paquete</h2>${bars(a.by_plan)}</div>
      <div class="card"><h2>Cómo se registraron</h2>${bars(a.by_setup)}</div>
      <div class="card"><h2>Módulos activados</h2>${bars(a.modules)}</div>
      <div class="card">
        <h2>Aprovisionamiento</h2>
        ${Object.keys(jobs).length ? Object.entries(jobs).map(([k, rows]) => `<p class="eyebrow" style="margin:10px 0 4px">${esc(k)}</p>${bars(rows)}`).join('') : '<p class="empty-state">Nada que aprovisionar todavía</p>'}
      </div>
    </div>
  `;
}

const RENDER = { prioridades: renderPriorities, lista: renderWaitlist, minijuego: renderGame, cuentas: renderAccounts };

function show(tab) {
  if (!RENDER[tab]) tab = 'prioridades';
  document.querySelectorAll('#andrhoTabs [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  setSubRoute('andrho', tab === 'prioridades' ? '' : tab);
  return withPanel(panelEl, async (p) => {
    if (!overview) overview = await andrhoApi('/admin/overview');
    await RENDER[tab](p);
  });
}

export default {
  title: 'Métricas AndRho',
  hint: 'la lista de espera, el minijuego y qué construir primero',
  async render(el, route) {
    overview = null;
    el.innerHTML = `${tabStrip('andrhoTabs', TABS, 'prioridades')}<div class="panel" id="andrhoPanel"></div>`;
    panelEl = el.querySelector('#andrhoPanel');
    wireTabs(el.querySelector('#andrhoTabs'), show);
    await show(route.sub);
  },
  onSubRoute: show
};
