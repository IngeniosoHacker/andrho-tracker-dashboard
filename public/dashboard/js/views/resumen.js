// Resumen: the history of operations, by category: sales, inventory and
// customers from the ERP, and everything that happened on the AndRho
// account itself.
import { andrhoApi, esc, fmtDate, fmtNum, fmtMoney, tabStrip, wireTabs, withPanel, setSubRoute } from '../core.js';
import { erpGet, odooDate } from './erp.js';

const TABS = [
  { key: 'todo', label: 'Todo' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'cuenta', label: 'Cuenta AndRho' }
];
const CAT = { ventas: 'Ventas', inventario: 'Inventario', clientes: 'Clientes', cuenta: 'Cuenta' };

let panelEl = null;

async function renderTab(panel, tab) {
  if (tab === 'cuenta') {
    const d = await andrhoApi('/account/events?limit=100');
    panel.innerHTML = `<div class="card"><h2>Tu cuenta en AndRho <span class="hint">${fmtNum(d.total)} en total</span></h2>
      ${d.events.length ? `<table><thead><tr><th>Cuándo</th><th>Tipo</th><th>Descripción</th></tr></thead><tbody>
        ${d.events.map((e) => `<tr><td class="mono">${fmtDate(e.created_at)}</td><td><span class="badge badge-muted">${esc(e.type)}</span></td><td>${esc(e.description)}</td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">Sin actividad registrada todavía.</p>'}</div>`;
    return;
  }
  const d = await erpGet(panel, `/history${tab === 'todo' ? '' : `?category=${tab}`}`);
  if (!d) return;
  panel.innerHTML = `<div class="card">
    ${d.items.length ? `<table><thead><tr><th>Cuándo</th><th>Categoría</th><th>Operación</th><th class="num">Monto</th><th>Dónde</th></tr></thead><tbody>
      ${d.items.map((i) => `<tr><td class="mono">${fmtDate(odooDate(i.date))}</td><td><span class="badge badge-muted">${esc(CAT[i.category] || i.category)}</span></td>
        <td>${esc(i.description)}</td><td class="num">${i.amount != null ? fmtMoney(i.amount) : i.quantity != null ? fmtNum(i.quantity) + ' u.' : ''}</td><td>${esc(i.where || '')}</td></tr>`).join('')}
    </tbody></table>` : '<p class="empty-state">Sin operaciones todavía.</p>'}</div>`;
}

function show(tab) {
  if (!TABS.some((t) => t.key === tab)) tab = 'todo';
  document.querySelectorAll('#resTabs [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  setSubRoute('resumen', tab === 'todo' ? '' : tab);
  return withPanel(panelEl, (p) => renderTab(p, tab));
}

export default {
  title: 'Resumen',
  hint: 'el histórico de operaciones, por categoría',
  async render(el, route) {
    el.innerHTML = `${tabStrip('resTabs', TABS, 'todo')}<div class="panel" id="resPanel"></div>`;
    panelEl = el.querySelector('#resPanel');
    wireTabs(el.querySelector('#resTabs'), show);
    await show(route.sub);
  },
  onSubRoute: show
};
