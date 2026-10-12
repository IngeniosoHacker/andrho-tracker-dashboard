// Sucursales: each branch (warehouse) and point of sale, whether the
// register is open and what it sold today.
import { esc, fmtNum, fmtMoney } from '../core.js';
import { erpGet } from './erp.js';

const STATE = { opened: 'Abierta', opening_control: 'Abriendo', closing_control: 'Cerrando', closed: 'Cerrada', '': 'Sin abrir' };

export default {
  title: 'Sucursales',
  hint: 'cada sucursal, su estado y su operación',
  async render(el) {
    const d = await erpGet(el, '/branches');
    if (!d) return;
    const today = d.points_of_sale.reduce((n, p) => n + p.sales_today, 0);
    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Ventas de hoy</p><p class="kpi-value">${fmtMoney(today)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Cajas abiertas</p><p class="kpi-value">${fmtNum(d.points_of_sale.filter((p) => p.open).length)} <span class="hint">de ${fmtNum(d.points_of_sale.length)}</span></p></div>
      </div>
      <div class="task-grid">
        ${d.points_of_sale.map((p) => `
          <article class="card branch-card">
            <header class="task-head"><h2>${esc(p.name)}</h2><span class="status-pill ${p.open ? 'status-terminada' : 'status-sugerida'}">${esc(STATE[p.state] ?? p.state)}</span></header>
            <dl class="detail-kv">
              <dt>Ventas hoy</dt><dd>${fmtMoney(p.sales_today)} · ${fmtNum(p.orders_today)} ${p.orders_today === 1 ? 'venta' : 'ventas'}</dd>
              <dt>En caja</dt><dd>${esc(p.cashier || '—')}</dd>
            </dl>
          </article>`).join('')}
      </div>
      <div class="card" style="margin-top:18px">
        <h2>Bodegas</h2>
        <table><thead><tr><th>Bodega</th><th>Código</th><th>Dirección</th><th class="num">Productos con existencia</th></tr></thead><tbody>
          ${d.warehouses.map((w) => `<tr><td><strong>${esc(w.name)}</strong></td><td class="mono">${esc(w.code)}</td><td>${esc(w.address)}</td><td class="num">${fmtNum(w.products_in_stock)}</td></tr>`).join('')}
        </tbody></table>
      </div>
    `;
  }
};
