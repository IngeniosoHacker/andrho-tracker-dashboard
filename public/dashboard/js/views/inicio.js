// Inicio: each person picks the cards they want to see first (saved in
// andrho-api's /account/me/preferences, so they follow them to any device).
// Each card loads on its own; one that has no data (no ERP, no tracker
// yet) says so instead of breaking the page.
import { andrhoApi, siteApi, esc, fmtNum, fmtMoney, session } from '../core.js';

const WIDGETS = {
  ventas_hoy: {
    label: 'Ventas de hoy', icon: '🧾',
    async load() {
      const d = await andrhoApi('/erp/branches');
      const total = d.points_of_sale.reduce((n, p) => n + p.sales_today, 0);
      const orders = d.points_of_sale.reduce((n, p) => n + p.orders_today, 0);
      return { value: fmtMoney(total), sub: `${fmtNum(orders)} ${orders === 1 ? "venta" : "ventas"} · ${d.points_of_sale.filter((p) => p.open).length} cajas abiertas`, href: '#/sucursales' };
    }
  },
  visitas: {
    label: 'Visitas al sitio', icon: '🌐',
    async load() {
      const d = await siteApi('/overview');
      return { value: fmtNum(d.sessionsLast30d), sub: 'en los últimos 30 días', href: '#/web' };
    }
  },
  agotados: {
    label: 'Inventario por reponer', icon: '📦',
    async load() {
      const d = await andrhoApi('/erp/inventory');
      return { value: fmtNum(d.summary.out_of_stock + d.summary.low_stock), sub: `${fmtNum(d.summary.out_of_stock)} agotados · ${fmtNum(d.summary.low_stock)} por agotarse`, href: '#/inventario', alert: d.summary.out_of_stock > 0 };
    }
  },
  clientes_riesgo: {
    label: 'Clientes que no han vuelto', icon: '🫥',
    async load() {
      const d = await andrhoApi('/erp/customers');
      const risk = d.customers.filter((c) => c.at_risk);
      return { value: fmtNum(risk.length), sub: risk.slice(0, 2).map((c) => c.name).join(', ') || 'todos tus frecuentes siguen viniendo', href: '#/clientes', alert: risk.length > 0 };
    }
  },
  prospectos: {
    label: 'Prospectos', icon: '🔭',
    async load() {
      const d = await andrhoApi('/erp/leads');
      return { value: fmtNum(d.leads.length), sub: d.source === 'crm' ? `${fmtMoney(d.leads.reduce((n, l) => n + (l.expected || 0), 0))} en juego` : 'contactos sin compra', href: '#/prospectos' };
    }
  },
  sugerencias: {
    label: 'Sugerencias por decidir', icon: '💡',
    async load() {
      const d = await andrhoApi('/suggestions');
      const open = d.suggestions.filter((s) => s.status === 'sugerida');
      return { value: fmtNum(open.length), sub: open[0] ? open[0].title : 'nada pendiente', href: `#/${open[0] ? open[0].section : 'inicio'}` };
    }
  },
  equipo: {
    label: 'Equipo en línea', icon: '👥',
    async load() {
      const d = await andrhoApi('/account/presence');
      const on = d.presence.filter((p) => p.online);
      return { value: fmtNum(on.length), sub: `${fmtNum(on.filter((p) => p.status === 'disponible').length)} disponibles`, href: '#/usuarios' };
    }
  },
  ia: {
    label: 'Lecturas de IA en tu sitio', icon: '◆',
    async load() {
      const d = await siteApi(`/ai-visibility?month=${new Date().toISOString().slice(0, 7)}`);
      return { value: fmtNum(d.aiCrawlerHits.total), sub: `${fmtNum(d.aiReferralTraffic.total)} visitas desde asistentes este mes`, href: '#/web/ia' };
    }
  }
};
const DEFAULT = ['ventas_hoy', 'visitas', 'agotados', 'sugerencias', 'equipo'];

let prefs = {};

async function savePrefs() {
  try { prefs = await andrhoApi('/account/me/preferences', { method: 'PUT', body: JSON.stringify(prefs) }); } catch {}
}

function cardsHtml(keys) {
  return keys.filter((k) => WIDGETS[k]).map((k) => `
    <a class="kpi-card home-card" data-widget="${k}" href="#">
      <p class="kpi-label"><span aria-hidden="true">${WIDGETS[k].icon}</span> ${esc(WIDGETS[k].label)}</p>
      <p class="kpi-value"><span class="loading-dots">…</span></p>
      <p class="kpi-sub"></p>
    </a>`).join('');
}

async function fill(card) {
  const w = WIDGETS[card.dataset.widget];
  try {
    const d = await w.load();
    card.querySelector('.kpi-value').textContent = d.value;
    card.querySelector('.kpi-sub').textContent = d.sub;
    card.href = d.href;
    card.classList.toggle('home-alert', !!d.alert);
  } catch (err) {
    card.querySelector('.kpi-value').innerHTML = '<span class="hint">—</span>';
    card.querySelector('.kpi-sub').textContent = err.message === 'erp_not_connected' ? 'Conecta tu ERP para verlo' : 'Sin datos todavía';
    card.href = err.message === 'erp_not_connected' ? '#/configuracion' : '#/inicio';
  }
}

function render(el) {
  const keys = prefs.home && prefs.home.length ? prefs.home : DEFAULT;
  const name = session.account.displayName || session.account.companyName || '';
  el.innerHTML = `
    <div class="section-head">
      <p class="welcome">Hola${name ? ', ' + esc(name.split(' ')[0]) : ''}.</p>
      <button type="button" class="copy-btn" id="homeEdit">Personalizar</button>
    </div>
    <div class="kpi-grid home-grid">${cardsHtml(keys)}</div>
    <div class="card home-editor" id="homeEditor" hidden>
      <h2>Lo que quieres ver primero</h2>
      <ul class="home-pick">
        ${[...keys, ...Object.keys(WIDGETS).filter((k) => !keys.includes(k))].map((k) => `
          <li data-key="${k}">
            <label><input type="checkbox" ${keys.includes(k) ? 'checked' : ''} /> ${WIDGETS[k].icon} ${esc(WIDGETS[k].label)}</label>
            <span><button type="button" class="link-btn" data-move="-1" aria-label="Subir">↑</button> <button type="button" class="link-btn" data-move="1" aria-label="Bajar">↓</button></span>
          </li>`).join('')}
      </ul>
      <button type="button" class="primary-btn" id="homeSave">Guardar</button>
    </div>
  `;
  el.querySelectorAll('[data-widget]').forEach(fill);
  const editor = el.querySelector('#homeEditor');
  el.querySelector('#homeEdit').addEventListener('click', () => { editor.hidden = !editor.hidden; });
  editor.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', () => {
    const li = b.closest('li');
    const sib = b.dataset.move === '-1' ? li.previousElementSibling : li.nextElementSibling;
    if (sib) b.dataset.move === '-1' ? sib.before(li) : sib.after(li);
  }));
  el.querySelector('#homeSave').addEventListener('click', async () => {
    prefs.home = [...editor.querySelectorAll('li')].filter((li) => li.querySelector('input').checked).map((li) => li.dataset.key);
    await savePrefs();
    render(el);
  });
}

export default {
  title: 'Inicio',
  hint: 'lo que quieres ver primero',
  async render(el) {
    try { prefs = await andrhoApi('/account/me/preferences'); } catch { prefs = {}; }
    render(el);
  }
};
