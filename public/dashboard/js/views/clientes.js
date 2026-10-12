// Clientes: who already bought, from the ERP's point of sale: how much,
// how often, and the regulars who stopped coming.
import { esc, fmtNum, fmtMoney, fmtDate } from '../core.js';
import { erpGet, odooDate } from './erp.js';

export default {
  title: 'Clientes',
  hint: 'quienes ya te compraron',
  async render(el) {
    const d = await erpGet(el, '/customers');
    if (!d) return;
    const s = d.summary;
    const risk = d.customers.filter((c) => c.at_risk);
    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Clientes identificados</p><p class="kpi-value">${fmtNum(s.customers)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Ventas</p><p class="kpi-value">${fmtNum(s.orders)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Ingresos</p><p class="kpi-value">${fmtMoney(s.revenue)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Dejaron de venir</p><p class="kpi-value" style="color:var(--accent-danger)">${fmtNum(risk.length)}</p><p class="kpi-sub">clientes frecuentes, más de 30 días sin comprar</p></div>
      </div>
      <div class="card">
        <h2>Clientes <span class="hint">ordenados por lo que te han comprado</span></h2>
        ${d.customers.length ? `<table><thead><tr><th>Cliente</th><th>Contacto</th><th class="num">Compras</th><th class="num">Total</th><th class="num">Ticket prom.</th><th>Última compra</th></tr></thead><tbody>
          ${d.customers.map((c) => `<tr>
            <td><strong>${esc(c.name)}</strong>${c.at_risk ? ' <span class="status-pill status-rechazada">no ha vuelto</span>' : ''}</td>
            <td class="mono">${esc(c.email || '')}${c.phone ? `<br>${esc(c.phone)}` : ''}</td>
            <td class="num">${fmtNum(c.orders)}</td><td class="num">${fmtMoney(c.total)}</td><td class="num">${fmtMoney(c.average)}</td>
            <td class="mono">${fmtDate(odooDate(c.last_order))} <span class="hint">hace ${fmtNum(c.days_since)} d</span></td></tr>`).join('')}
        </tbody></table>` : '<p class="empty-state">Todavía no hay ventas con cliente registrado.</p>'}
      </div>
    `;
  }
};
