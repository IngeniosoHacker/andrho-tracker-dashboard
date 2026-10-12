// Inventario: products and their stock from the account's ERP, what's
// running out, and the latest movements.
import { esc, fmtNum, fmtMoney, fmtDate, tabStrip, wireTabs } from '../core.js';
import { erpGet, odooDate } from './erp.js';

const STATUS = { agotado: ['Agotado', 'status-rechazada'], bajo: ['Bajo', 'status-proceso'], ok: ['Bien', 'status-terminada'] };

export default {
  title: 'Inventario',
  hint: 'tus productos y servicios, y cómo se mueven',
  async render(el) {
    const d = await erpGet(el, '/inventory');
    if (!d) return;
    const s = d.summary;
    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Productos</p><p class="kpi-value">${fmtNum(s.products)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Valor del inventario</p><p class="kpi-value">${fmtMoney(s.stock_value)}</p><p class="kpi-sub">a costo</p></div>
        <div class="kpi-card"><p class="kpi-label">Agotados</p><p class="kpi-value" style="color:var(--accent-danger)">${fmtNum(s.out_of_stock)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Por agotarse</p><p class="kpi-value ai">${fmtNum(s.low_stock)}</p><p class="kpi-sub">5 unidades o menos</p></div>
      </div>
      ${tabStrip('invTabs', [{ key: 'productos', label: 'Productos' }, { key: 'movimientos', label: 'Movimientos' }], 'productos')}
      <div class="card" id="invPanel"></div>
    `;
    const panel = el.querySelector('#invPanel');
    const show = (tab) => {
      panel.innerHTML = tab === 'movimientos'
        ? (d.moves.length ? `<table><thead><tr><th>Cuándo</th><th>Producto</th><th class="num">Cantidad</th><th>De</th><th>A</th><th>Referencia</th></tr></thead><tbody>
            ${d.moves.map((m) => `<tr><td class="mono">${fmtDate(odooDate(m.date))}</td><td>${esc(m.product)}</td><td class="num">${fmtNum(m.qty)}</td><td>${esc(m.from)}</td><td>${esc(m.to)}</td><td class="mono">${esc(m.reference)}</td></tr>`).join('')}
          </tbody></table>` : '<p class="empty-state">Sin movimientos todavía</p>')
        : (d.products.length ? `<table><thead><tr><th>Producto</th><th>Estado</th><th class="num">Existencia</th><th class="num">Precio</th><th class="num">Costo</th><th>Categoría</th></tr></thead><tbody>
            ${d.products.map((p) => `<tr><td><strong>${esc(p.name)}</strong>${p.code ? ` <span class="mono hint">${esc(p.code)}</span>` : ''}</td>
              <td><span class="status-pill ${STATUS[p.status][1]}">${STATUS[p.status][0]}</span></td>
              <td class="num">${fmtNum(p.qty)} <span class="hint">${esc(p.uom)}</span></td><td class="num">${fmtMoney(p.price)}</td><td class="num">${fmtMoney(p.cost)}</td><td>${esc(p.category)}</td></tr>`).join('')}
          </tbody></table>` : '<p class="empty-state">Sin productos todavía</p>');
    };
    wireTabs(el.querySelector('#invTabs'), show);
    show('productos');
  }
};
