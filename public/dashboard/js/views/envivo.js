// En vivo: AndRho's live sales (andrho-api /live/*, founder/live-sale-spec.md).
// AndRho is the admin side: organize the next live, watch it while it's on
// air, see how lives go, print shipping cards and set the card and loyalty
// program. The ERP (Odoo, module andrho_live_sale) is the operational side.
import {
  andrhoApi, esc, fmtMoney, fmtNum, fmtDate, tabStrip, wireTabs, setSubRoute, roleAtLeast, emptyState,
  chart, barChartOptions, cssVar, session
} from '../core.js';

const TABS = [
  { key: 'organizar', label: 'Organizar' },
  { key: 'vivo', label: 'En vivo' },
  { key: 'historial', label: 'Historial' },
  { key: 'tarjetas', label: 'Tarjetas de envío' },
  { key: 'ajustes', label: 'Ajustes' }
];

const LINE_STATE = {
  available: ['Disponible', ''],
  reserved: ['Apartado', 'status-proceso'],
  confirmed: ['Vendido', 'status-terminada'],
  unsold: ['Sin vender', 'status-rechazada'],
  posted: ['Publicado', 'status-sugerida']
};
const CLAIM_STATE = {
  queued: ['En fila', ''],
  asked: ['Esperando "Sí"', 'status-proceso'],
  confirmed: ['Confirmó', 'status-terminada'],
  declined: ['Dijo que no', 'status-rechazada'],
  expired: ['No respondió', 'status-rechazada'],
  failed: ['No se pudo escribir', 'status-rechazada']
};
const CARD_STATE = { data: 'Esperando datos', ready: 'Lista', printed: 'Impresa', delivered: 'Entregada' };

const pill = (map, s) => { const [label, cls] = map[s] || [s, '']; return `<span class="status-pill ${cls}">${esc(label)}</span>`; };
const apiMsg = (err) => (err.data && err.data.message) || err.message;

let refreshTimer = null;
const stopRefresh = () => { clearTimeout(refreshTimer); refreshTimer = null; };

// Opens the ERP right on a path (one-time entry, POST /erp/sso).
async function openERP(next) {
  const w = window.open('', '_blank');
  try {
    const { url } = await andrhoApi('/erp/sso', { method: 'POST', body: JSON.stringify({ next }) });
    if (w) w.location = url; else window.location = url;
  } catch (err) {
    if (w) w.close();
    alert(apiMsg(err));
  }
}

export default {
  title: 'En vivo',
  hint: 'organiza tu live: AndRho aparta, confirma por Messenger y arma tus envíos',

  async render(el, { sub }) {
    stopRefresh();
    this.el = el;
    const status = await andrhoApi('/live/status');
    this.status = status;
    if (status.plan_allows && !status.enabled) {
      el.innerHTML = emptyState('La venta en vivo está apagada',
        'Actívala en <a href="#/configuracion">Configuración › Funciones</a> si vendes por lives de Facebook.', '🎥');
      return;
    }
    if (!status.plan_allows) {
      el.innerHTML = emptyState('La venta en vivo viene desde el plan Plataforma',
        'AndRho aparta con el primer comentario, le pregunta al comprador por Messenger con botones Sí/No, arma tus tarjetas de envío y publica lo que no se vendió. <a href="#/configuracion">Ver planes</a>', '🎥');
      return;
    }
    el.innerHTML = `
      <div id="liveSetup"></div>
      ${tabStrip('liveTabs', TABS, TABS.some((t) => t.key === sub) ? sub : 'organizar')}
      <div id="livePanel"></div>
    `;
    this.drawSetup();
    wireTabs(el.querySelector('#liveTabs'), (t) => this.show(t));
    const params = new URLSearchParams((window.location.hash.split('?')[1]) || '');
    if (params.get('meta')) {
      const msg = { ok: 'Tu Página de Facebook quedó conectada.', no_pages: 'Tu cuenta de Facebook no administra ninguna Página. Crea una Página (no sirve un perfil personal) y vuelve a conectar.', error: 'No pudimos conectar Facebook. Inténtalo otra vez.' }[params.get('meta')];
      if (msg) this.notice(msg);
    }
    this.show(TABS.some((t) => t.key === sub) ? sub : 'organizar');
  },

  onSubRoute(sub) {
    const btn = this.el && this.el.querySelector(`#liveTabs [data-tab="${sub}"]`);
    if (btn) btn.click();
  },

  notice(msg) {
    const box = this.el.querySelector('#liveSetup');
    box.insertAdjacentHTML('afterbegin', `<div class="card live-notice">${esc(msg)}</div>`);
  },

  // What's missing before selling: the ERP module and the Facebook Page.
  drawSetup() {
    const s = this.status;
    const box = this.el.querySelector('#liveSetup');
    const page = (s.pages || []).find((p) => p.selected);
    const steps = [];
    if (s.erp === 'not_connected') {
      steps.push(`<li><strong>Tu ERP se está preparando.</strong> La venta en vivo usa tu Inventario: en cuanto esté listo, aquí aparecen tus productos.</li>`);
    } else if (s.erp === 'connected') {
      steps.push(`<li><strong>Activa la venta en vivo en tu ERP.</strong> ${roleAtLeast('admin') ? '<button type="button" class="primary-btn" data-setup>Activar</button>' : 'Pídeselo a un administrador.'}</li>`);
    }
    if (!page) {
      const pages = s.pages || [];
      if (pages.length > 1) {
        steps.push(`<li><strong>Elige la Página con la que vendes.</strong>
          <span class="live-pages">${pages.map((p) => `<button type="button" class="copy-btn" data-page="${esc(p.id)}">${esc(p.name)}</button>`).join('')}</span></li>`);
      } else if (s.meta_ready) {
        steps.push(`<li><strong>Conecta tu Página de Facebook.</strong> AndRho lee los comentarios de tu live y escribe por Messenger a nombre de tu Página.
          ${roleAtLeast('admin') ? '<button type="button" class="primary-btn" data-connect>Conectar Facebook</button>' : ''}
          <span class="hint">Tiene que ser una Página: los perfiles personales y los grupos no se pueden conectar.</span></li>`);
      } else {
        steps.push(`<li><strong>La conexión con Facebook se activa cuando Meta apruebe a AndRho.</strong> Mientras, ya puedes organizar tus lives y usar tus tarjetas de envío.
          <span class="hint">Vas a necesitar una Página de Facebook (no un perfil personal ni un grupo).</span></li>`);
      }
    }
    box.innerHTML = steps.length ? `<div class="card live-setup"><ol>${steps.join('')}</ol></div>`
      : `<p class="hint live-page">Vendiendo con <strong>${esc(page.name)}</strong>${page.instagram ? ' · Instagram conectado' : ''}
          ${roleAtLeast('admin') ? ' · <button type="button" class="link-btn" data-disconnect>Desconectar</button>' : ''}</p>`;
    const on = (sel, fn) => { const b = box.querySelector(sel); if (b) b.addEventListener('click', fn); };
    on('[data-setup]', async (e) => {
      e.target.disabled = true; e.target.textContent = 'Activando… (unos minutos)';
      try { await andrhoApi('/live/setup', { method: 'POST' }); this.render(this.el, { sub: 'organizar' }); } catch (err) { e.target.disabled = false; e.target.textContent = 'Activar'; alert(apiMsg(err)); }
    });
    on('[data-connect]', async () => {
      try { const { url } = await andrhoApi('/live/meta/connect'); window.location = url; } catch (err) { alert(apiMsg(err)); }
    });
    on('[data-disconnect]', async () => {
      if (!confirm('¿Desconectar tu Página? AndRho dejará de leer tus lives.')) return;
      await andrhoApi('/live/meta', { method: 'DELETE' }).catch((err) => alert(apiMsg(err)));
      this.render(this.el, { sub: 'organizar' });
    });
    box.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', async () => {
      try { await andrhoApi('/live/meta/page', { method: 'PUT', body: JSON.stringify({ page_id: b.dataset.page }) }); this.render(this.el, { sub: 'organizar' }); } catch (err) { alert(apiMsg(err)); }
    }));
  },

  async show(tab) {
    stopRefresh();
    setSubRoute('envivo', tab);
    const panel = this.el.querySelector('#livePanel');
    panel.innerHTML = '<p class="loading-state">cargando…</p>';
    try {
      if (tab === 'organizar') await this.organize(panel);
      else if (tab === 'vivo') await this.onAir(panel);
      else if (tab === 'historial') await this.history(panel);
      else if (tab === 'tarjetas') await this.cards(panel);
      else await this.settings(panel);
    } catch (err) {
      panel.innerHTML = err.status === 404
        ? emptyState('Tu ERP todavía no está listo', 'La venta en vivo usa tu Inventario. En cuanto tu ERP esté listo, aquí aparecen tus productos.', '⏳')
        : `<p class="empty-state">${esc(apiMsg(err))}</p>`;
    }
  },

  // --- Organizar --------------------------------------------------------
  async organize(panel) {
    if (this.status.erp !== 'ready') {
      panel.innerHTML = '<p class="empty-state">Activa la venta en vivo en tu ERP (arriba) para elegir tus artículos.</p>';
      return;
    }
    const { products } = await andrhoApi('/live/products');
    if (!products.length) {
      panel.innerHTML = `<div class="card"><p class="empty-state">No tienes productos con existencia en tu Inventario.</p>
        <p style="text-align:center"><button type="button" class="primary-btn" data-erp="/odoo/action-stock.product_template_action_product">Subir mi mercancía en el ERP</button></p></div>`;
      panel.querySelector('[data-erp]').addEventListener('click', (e) => openERP(e.target.dataset.erp));
      return;
    }
    const picked = new Set();
    panel.innerHTML = `
      <div class="card">
        <div class="section-head">
          <div><h3 style="margin:0">Elige lo que vas a vender</h3><p class="hint" style="margin:4px 0 0">AndRho propone el orden y le pone a cada artículo un nombre corto para el live.</p></div>
          <input type="search" class="live-search" placeholder="Buscar producto" aria-label="Buscar producto">
        </div>
        <div class="live-products">${products.map((p) => `
          <label class="live-product" data-name="${esc(p.name.toLowerCase())}">
            <input type="checkbox" value="${p.id}">
            ${p.image ? `<img src="data:image/png;base64,${p.image}" alt="">` : '<span class="live-noimg">sin foto</span>'}
            <span class="live-product-name">${esc(p.name)}</span>
            <span class="mono">${fmtMoney(p.price)} · ${fmtNum(p.stock)} u.</span>
          </label>`).join('')}
        </div>
        <div class="form-actions" style="margin-top:16px">
          <input type="text" class="live-name" placeholder="Nombre del live (opcional)" maxlength="120">
          ${roleAtLeast('editor') ? '<button type="button" class="primary-btn" data-organize disabled>Organizar venta</button>' : ''}
          <span class="hint" data-count>0 artículos</span>
        </div>
      </div>
      <div id="liveOrder"></div>`;
    const count = panel.querySelector('[data-count]');
    const btn = panel.querySelector('[data-organize]');
    panel.querySelectorAll('.live-product input').forEach((cb) => cb.addEventListener('change', () => {
      cb.checked ? picked.add(Number(cb.value)) : picked.delete(Number(cb.value));
      cb.closest('.live-product').classList.toggle('picked', cb.checked);
      count.textContent = `${picked.size} artículo${picked.size === 1 ? '' : 's'}`;
      if (btn) btn.disabled = picked.size === 0;
    }));
    panel.querySelector('.live-search').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      panel.querySelectorAll('.live-product').forEach((l) => { l.hidden = q && !l.dataset.name.includes(q); });
    });
    if (btn) btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = 'Organizando…';
      try {
        const res = await andrhoApi('/live/sessions', { method: 'POST', body: JSON.stringify({
          name: panel.querySelector('.live-name').value.trim(), items: [...picked].map((id) => ({ product_id: id })) }) });
        this.current = res.session.id;
        this.drawOrder(panel.querySelector('#liveOrder'), res);
        panel.querySelector('#liveOrder').scrollIntoView({ behavior: 'smooth' });
      } catch (err) { alert(apiMsg(err)); }
      btn.disabled = false; btn.textContent = 'Organizar venta';
    });
  },

  // The suggested order, the tip, and "Empezar".
  drawOrder(box, res) {
    const lv = res.live;
    box.innerHTML = `
      <div class="card live-order">
        <div class="section-head">
          <div><h3 style="margin:0">${esc(lv.name)}: orden sugerido</h3>
          <p class="hint" style="margin:4px 0 0">Abre fuerte, alterna precios y cierra con lo mejor. Di el nombre de cada artículo en el live: quien lo comente primero se lo lleva.</p></div>
          <button type="button" class="copy-btn" data-erp>Ver en el ERP</button>
        </div>
        <ol class="live-order-list">${lv.lines.map((l) => `<li><strong>${esc(l.live_name)}</strong> <span class="hint">${esc(l.product)}</span> <span class="mono">${fmtMoney(l.price)}</span></li>`).join('')}</ol>
        <p class="live-tip">📱 Si no tienes otro dispositivo para ver este orden durante el live, toma una captura o anótalo y síguelo. AndRho aparta y confirma por ti.</p>
        <div class="form-actions">
          <input type="url" class="live-url" placeholder="Enlace de tu live (opcional: AndRho lo detecta solo)">
          ${roleAtLeast('editor') ? '<button type="button" class="primary-btn" data-start>Ya estoy en vivo: empezar</button>' : ''}
        </div>
        <p class="hint">Si tu Página está conectada, AndRho empieza solo cuando sales en vivo.</p>
      </div>`;
    box.querySelector('[data-erp]').addEventListener('click', () => openERP(`/odoo/action-andrho_live_sale.action_live_sale/${lv.id}`));
    const start = box.querySelector('[data-start]');
    if (start) start.addEventListener('click', async () => {
      start.disabled = true;
      try {
        await andrhoApi(`/live/sessions/${res.session.id}/start`, { method: 'POST', body: JSON.stringify({ live_url: box.querySelector('.live-url').value.trim() }) });
        this.current = res.session.id;
        this.onSubRoute('vivo');
      } catch (err) { alert(apiMsg(err)); start.disabled = false; }
    });
  },

  // --- En vivo ------------------------------------------------------------
  async onAir(panel) {
    if (!this.current) {
      const { lives } = await andrhoApi('/live/sessions');
      const cur = (lives || []).find((l) => l.status === 'live') || (lives || []).find((l) => l.status === 'ready');
      this.current = cur && cur.session_id;
    }
    if (!this.current) {
      panel.innerHTML = '<p class="empty-state">No hay un live organizado. Empieza en "Organizar".</p>';
      return;
    }
    const d = await andrhoApi(`/live/sessions/${this.current}`);
    const lv = d.live;
    const s = d.session;
    const onAir = s.status === 'live';
    panel.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">${onAir ? '🔴 En vivo' : s.status === 'done' ? 'Terminado' : 'Organizado'}</p><p class="kpi-value" style="font-size:18px">${esc(lv.name)}</p>${s.live_url ? `<p class="kpi-sub"><a href="${esc(s.live_url)}" target="_blank" rel="noopener">ver live</a></p>` : ''}</div>
        <div class="kpi-card"><p class="kpi-label">Vendidos</p><p class="kpi-value">${fmtNum(lv.sold_count)}<span class="hint"> / ${fmtNum(lv.item_count)}</span></p></div>
        <div class="kpi-card"><p class="kpi-label">Apartados esperando "Sí"</p><p class="kpi-value ai">${fmtNum(lv.reserved_count)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Ventas</p><p class="kpi-value">${fmtMoney(lv.revenue)}</p></div>
      </div>
      <div class="live-cols">
        <div class="card">
          <h3 style="margin-top:0">Orden</h3>
          <table><thead><tr><th>#</th><th>Nombre en el live</th><th class="num">Precio</th><th>Estado</th><th>Comprador</th></tr></thead><tbody>
            ${lv.lines.map((l, i) => `<tr><td class="mono">${i + 1}</td><td><strong>${esc(l.live_name)}</strong></td><td class="num">${fmtMoney(l.price)}</td><td>${pill(LINE_STATE, l.state)}</td><td>${esc(l.buyer)}</td></tr>`).join('')}
          </tbody></table>
        </div>
        <div class="card">
          <h3 style="margin-top:0">Comentarios que apartaron</h3>
          ${d.activity.length ? `<ul class="live-feed">${d.activity.map((a) => `<li><strong>${esc(a.buyer || 'Alguien')}</strong> <span class="hint">“${esc(a.comment)}”</span> → ${esc(a.item || '')} ${pill(CLAIM_STATE, a.state)}</li>`).join('')}</ul>`
            : `<p class="empty-state">${onAir ? 'Esperando el primer comentario con el nombre de un artículo…' : 'Todavía no hay comentarios.'}</p>`}
        </div>
      </div>
      <div class="form-actions" style="margin-top:16px">
        ${onAir && roleAtLeast('editor') ? '<button type="button" class="copy-btn" data-end>Terminar live</button>' : ''}
        ${s.status === 'done' && lv.unsold_count && roleAtLeast('editor') ? `<button type="button" class="primary-btn" data-publish>Publicar los ${lv.unsold_count} que no se vendieron</button>
          <span class="hint">Una publicación por artículo, con foto y precio: quien comente “Mío” primero se lo lleva.</span>` : ''}
        <button type="button" class="copy-btn" data-erp>Ver en el ERP</button>
      </div>`;
    const on = (sel, fn) => { const b = panel.querySelector(sel); if (b) b.addEventListener('click', fn); };
    on('[data-erp]', () => openERP(`/odoo/action-andrho_live_sale.action_live_sale/${lv.id}`));
    on('[data-end]', async () => {
      if (!confirm('¿Terminar el live? Lo que no se vendió queda como "Sin vender".')) return;
      await andrhoApi(`/live/sessions/${s.id}/end`, { method: 'POST' }).catch((err) => alert(apiMsg(err)));
      this.show('vivo');
    });
    on('[data-publish]', async (e) => {
      e.target.disabled = true; e.target.textContent = 'Publicando…';
      try {
        const r = await andrhoApi(`/live/sessions/${s.id}/publish`, { method: 'POST', body: '{}' });
        alert(`Publicamos ${r.posted} artículo(s).${r.failed ? ` ${r.failed} no tenían foto o no se pudieron publicar.` : ''}`);
      } catch (err) { alert(apiMsg(err)); }
      this.show('vivo');
    });
    if (onAir || lv.reserved_count) refreshTimer = setTimeout(() => { if (document.body.contains(panel)) this.show('vivo'); }, 4000);
  },

  // --- Historial ------------------------------------------------------------
  async history(panel) {
    const [{ lives }, m] = await Promise.all([andrhoApi('/live/sessions'), andrhoApi('/live/metrics')]);
    if (!lives.length) {
      panel.innerHTML = '<p class="empty-state">Aquí vas a ver cada live: cuánto vendiste, cuántos apartados se confirmaron y a qué hora te va mejor.</p>';
      return;
    }
    const pct = (x) => `${Math.round((x || 0) * 100)}%`;
    const bestHour = (m.by_hour || []).slice().sort((a, b) => b.avg_revenue - a.avg_revenue)[0];
    panel.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Lives terminados</p><p class="kpi-value">${fmtNum(m.lives || 0)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Ventas</p><p class="kpi-value">${fmtMoney(m.revenue || 0)}</p></div>
        <div class="kpi-card"><p class="kpi-label">De lo que muestras, vendes</p><p class="kpi-value">${pct(m.sell_through)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Apartados que confirman</p><p class="kpi-value ai">${pct(m.confirm_rate)}</p></div>
        ${bestHour ? `<div class="kpi-card"><p class="kpi-label">Tu mejor hora</p><p class="kpi-value">${bestHour.hour}:00</p><p class="kpi-sub">${fmtMoney(bestHour.avg_revenue)} por live</p></div>` : ''}
      </div>
      ${(m.series || []).length > 1 ? '<div class="card" style="margin-bottom:16px"><h3 style="margin-top:0">Ventas por live</h3><canvas id="liveSeries" height="90"></canvas></div>' : ''}
      <div class="live-cols">
        <div class="card"><h3 style="margin-top:0">Quién te compra más</h3>
          ${(m.top_buyers || []).length ? `<table><tbody>${m.top_buyers.map((b) => `<tr><td>${esc(b.name)} ${b.frequent ? '<span class="status-pill status-terminada">frecuente</span>' : ''}</td><td class="num">${fmtNum(b.purchases)} compras</td><td class="num">${fmtMoney(b.total)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty-state">Aún no hay compradores.</p>'}
        </div>
        <div class="card"><h3 style="margin-top:0">Lo que más se vende</h3>
          ${(m.top_products || []).length ? `<table><tbody>${m.top_products.map((p) => `<tr><td>${esc(p.product)}</td><td class="num">${fmtNum(p.count)}</td><td class="num">${fmtMoney(p.revenue)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty-state">Aún no hay ventas.</p>'}
        </div>
      </div>
      <div class="card" style="margin-top:16px"><h3 style="margin-top:0">Todos tus lives</h3>
        <table><thead><tr><th>Fecha</th><th>Live</th><th class="num">Artículos</th><th class="num">Vendidos</th><th class="num">Sin vender</th><th class="num">Compradores</th><th class="num">Ventas</th><th></th></tr></thead><tbody>
          ${lives.map((l) => `<tr><td class="mono">${fmtDate(new Date(l.date.replace(' ', 'T') + 'Z'))}</td><td>${esc(l.name)}</td><td class="num">${fmtNum(l.items)}</td><td class="num">${fmtNum(l.sold)}</td><td class="num">${fmtNum(l.unsold)}</td><td class="num">${fmtNum(l.buyers)}</td><td class="num">${fmtMoney(l.revenue)}</td>
            <td>${l.session_id ? `<button type="button" class="link-btn" data-open="${esc(l.session_id)}">ver</button>` : ''}</td></tr>`).join('')}
        </tbody></table>
      </div>`;
    panel.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => { this.current = b.dataset.open; this.onSubRoute('vivo'); }));
    const canvas = panel.querySelector('#liveSeries');
    if (canvas) {
      chart('liveSeries', canvas, { type: 'bar', data: { labels: m.series.map((x) => x.name), datasets: [{ data: m.series.map((x) => x.revenue), backgroundColor: cssVar('--accent-human') }] }, options: barChartOptions() });
    }
  },

  // --- Tarjetas -------------------------------------------------------------
  async cards(panel) {
    const { cards } = await andrhoApi('/live/cards');
    if (!cards.length) {
      panel.innerHTML = '<p class="empty-state">Cuando un comprador confirma por Messenger, aquí aparece su tarjeta de envío con sus datos.</p>';
      return;
    }
    panel.innerHTML = `
      <div class="card">
        <div class="section-head"><p class="hint" style="margin:0">Se imprimen 4 tarjetas de 10 × 10 cm por hoja carta, con tu logo y “¡Gracias por tu compra, {nombre}!”. Cámbialo en Ajustes.</p>
          ${roleAtLeast('editor') ? '<button type="button" class="primary-btn" data-print disabled>Imprimir seleccionadas</button>' : ''}</div>
        <table><thead><tr><th><input type="checkbox" data-all aria-label="Todas"></th><th>Comprador</th><th>Teléfono</th><th>Dirección</th><th class="num">Artículos</th><th class="num">Total</th><th>Estado</th><th>Live</th></tr></thead><tbody>
          ${cards.map((c) => `<tr><td><input type="checkbox" value="${c.id}" ${c.state === 'ready' ? 'checked' : ''}></td><td><strong>${esc(c.buyer)}</strong>${c.discount_pct ? ` <span class="status-pill status-terminada">-${c.discount_pct}%</span>` : ''}</td>
            <td class="mono">${esc(c.phone)}</td><td>${esc([c.address, c.zone].filter(Boolean).join(', '))}</td><td class="num">${fmtNum(c.items)}</td><td class="num">${fmtMoney(c.total)}</td><td>${esc(CARD_STATE[c.state] || c.state)}</td><td class="hint">${esc(c.live)}</td></tr>`).join('')}
        </tbody></table>
      </div>`;
    const btn = panel.querySelector('[data-print]');
    const boxes = () => [...panel.querySelectorAll('tbody input[type=checkbox]')];
    const sync = () => { if (btn) btn.disabled = !boxes().some((b) => b.checked); };
    panel.querySelector('[data-all]').addEventListener('change', (e) => { boxes().forEach((b) => { b.checked = e.target.checked; }); sync(); });
    boxes().forEach((b) => b.addEventListener('change', sync));
    sync();
    if (btn) btn.addEventListener('click', async () => {
      const ids = boxes().filter((b) => b.checked).map((b) => Number(b.value));
      const w = window.open('', '_blank');
      try {
        const { url } = await andrhoApi('/live/cards/print', { method: 'POST', body: JSON.stringify({ card_ids: ids }) });
        if (w) w.location = url; else window.location = url;
        setTimeout(() => this.show('tarjetas'), 1500);
      } catch (err) { if (w) w.close(); alert(apiMsg(err)); }
    });
  },

  // --- Ajustes --------------------------------------------------------------
  async settings(panel) {
    const s = await andrhoApi('/live/settings');
    const admin = roleAtLeast('admin');
    const dis = admin ? '' : 'disabled';
    panel.innerHTML = `
      <div class="live-cols">
        <form class="card invite-form" id="cardForm">
          <h3 style="margin:0">Tu tarjeta de envío</h3>
          <label>Mensaje <input name="card_message" maxlength="120" value="${esc(s.card_message || '')}" ${dis}></label>
          <p class="hint" style="margin:-6px 0 0">{nombre} se cambia por el primer nombre del comprador.</p>
          <label class="live-check"><input type="checkbox" name="card_show_logo" ${s.card_show_logo !== '0' ? 'checked' : ''} ${dis}> Mostrar mi logo</label>
          <div class="live-card-preview"><p class="live-card-logo">${esc((session.account && session.account.companyName) || 'Tu logo')}</p><p data-preview></p></div>
          ${admin ? '<button type="submit">Guardar</button>' : ''}
        </form>
        <form class="card invite-form" id="wordForm">
          <h3 style="margin:0">Lo que no se vendió</h3>
          <label>Palabra para pedir <input name="claim_word" maxlength="20" value="${esc(s.claim_word || 'mío')}" ${dis}></label>
          <p class="hint" style="margin:-6px 0 0">En tus publicaciones de lo no vendido, quien comente esta palabra primero se lo lleva. No importan mayúsculas ni tildes: “Mío”, “mio” y “MÍO!” cuentan igual. Los demás comentarios se ignoran.</p>
          <p class="live-word-preview">Comenta «<span data-word></span>» si lo quieres.</p>
          ${admin ? '<button type="submit">Guardar</button>' : ''}
        </form>
        <form class="card invite-form" id="loyaltyForm">
          <h3 style="margin:0">Clientes frecuentes</h3>
          <label class="live-check"><input type="checkbox" name="loyalty_enabled" ${s.loyalty_enabled === '1' ? 'checked' : ''} ${dis}> Premiar a quien más me compra</label>
          <label>Desde cuántas compras <input name="loyalty_min" type="number" min="1" max="100" value="${esc(s.loyalty_min || '3')}" ${dis}></label>
          <label>Descuento (%) <input name="loyalty_discount" type="number" min="0" max="50" step="1" value="${esc(s.loyalty_discount || '10')}" ${dis}></label>
          <p class="hint" style="margin:0">El descuento se aplica solo al confirmar, y tus publicaciones de lo no vendido dicen “Aplica descuento para clientes frecuentes”.</p>
          ${admin ? '<button type="submit">Guardar</button>' : ''}
        </form>
      </div>`;
    const msg = panel.querySelector('[name=card_message]');
    const prev = panel.querySelector('[data-preview]');
    const paint = () => { prev.textContent = msg.value.replace('{nombre}', 'Ana'); };
    msg.addEventListener('input', paint);
    paint();
    const save = (form, pick) => form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try { await andrhoApi('/live/settings', { method: 'PUT', body: JSON.stringify(pick(form)) }); btn.textContent = 'Guardado'; setTimeout(() => { btn.textContent = 'Guardar'; }, 1500); } catch (err) { alert(apiMsg(err)); }
      btn.disabled = false;
    });
    const word = panel.querySelector('[name=claim_word]');
    const wordPrev = panel.querySelector('[data-word]');
    const paintWord = () => { const w = word.value.trim() || 'mío'; wordPrev.textContent = w.charAt(0).toUpperCase() + w.slice(1); };
    word.addEventListener('input', paintWord);
    paintWord();
    save(panel.querySelector('#wordForm'), (f) => ({ claim_word: f.claim_word.value.trim() || 'mío' }));
    save(panel.querySelector('#cardForm'), (f) => ({ card_message: f.card_message.value, card_show_logo: f.card_show_logo.checked ? '1' : '0' }));
    save(panel.querySelector('#loyaltyForm'), (f) => ({ loyalty_enabled: f.loyalty_enabled.checked ? '1' : '0', loyalty_min: String(f.loyalty_min.value), loyalty_discount: String(f.loyalty_discount.value) }));
  }
};
