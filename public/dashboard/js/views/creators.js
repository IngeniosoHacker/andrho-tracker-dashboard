// Creators (AndRho staff): the work customers asked for, a website at
// signup for now. Open tasks can be accepted; your own can be delivered
// (with a link) or given back. Admins see every task.
import {
  andrhoApi, getAccessToken, ANDRHO_API_URL, esc, fmtDate, session, tabStrip, wireTabs, setSubRoute, withPanel, emptyState
} from '../core.js';

const TABS = [
  { key: 'mias', label: 'Mis tareas' },
  { key: 'abiertas', label: 'Disponibles' },
  { key: 'entregadas', label: 'Entregadas' }
];

const KIND = { website: 'Sitio web', brand: 'Marca' };
const STATUS = { abierta: ['Disponible', 'status-sugerida'], aceptada: ['En curso', 'status-proceso'], entregada: ['Entregada', 'status-terminada'] };

const MODULE_NAMES = {
  analitica: 'Análisis con IA', unificacion: 'Unificación', erp: 'ERP', inventario: 'Inventario', ventas: 'Punto de venta',
  vencimientos: 'Vencimientos', mermas: 'Mermas', compras: 'Compras', produccion: 'Producción', finanzas: 'Finanzas',
  rrhh: 'Personal', logistica: 'Envíos', rutas: 'Rutas', agenda: 'Agenda', citas: 'Citas', clientes: 'CRM',
  marketing: 'Marketing', sitio_web: 'Sitio web', tracking: 'Rastreador', redes: 'Redes', redes_creacion: 'Creación de redes',
  whatsapp: 'WhatsApp'
};

let panelEl = null;
let tasks = [];

function filtered(tab) {
  const me = session.account.userId;
  if (tab === 'abiertas') return tasks.filter((t) => t.status === 'abierta');
  if (tab === 'entregadas') return tasks.filter((t) => t.status === 'entregada');
  return tasks.filter((t) => t.status === 'aceptada' && (t.creator_id === me || session.account.staffRole === 'admin'));
}

// The logo needs the token, so it's fetched and shown as a blob URL.
async function loadLogo(img, taskId) {
  try {
    const res = await fetch(`${ANDRHO_API_URL}/creators/tasks/${encodeURIComponent(taskId)}/logo`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
    if (!res.ok) { img.remove(); return; }
    img.src = URL.createObjectURL(await res.blob());
    img.hidden = false;
  } catch { img.remove(); }
}

function taskCard(t) {
  const b = t.brief || {};
  const [label, cls] = STATUS[t.status] || [t.status, ''];
  const mine = t.creator_id === session.account.userId || session.account.staffRole === 'admin';
  return `
    <article class="card task-card" data-task="${esc(t.id)}">
      <header class="task-head">
        <div>
          <p class="eyebrow">${esc(KIND[t.kind] || t.kind)} · ${esc(t.company_name || b.company || '')}</p>
          <h2>${esc(t.title)}</h2>
        </div>
        <span class="status-pill ${cls}">${esc(label)}</span>
      </header>
      <div class="task-body">
        <img class="task-logo" alt="Logo de ${esc(t.company_name || '')}" hidden data-logo="${b.has_logo ? '1' : ''}" />
        <dl class="detail-kv">
          <dt>Esencia</dt><dd>${b.essence ? esc(b.essence) : '<span class="hint">Sin descripción</span>'}</dd>
          <dt>Marca</dt><dd>${b.brand_help ? 'No tiene: proponer una' : b.has_logo ? 'Tiene logo' : 'Sin logo'}</dd>
          <dt>Giro</dt><dd>${(b.sectors || []).map(esc).join(', ') || '—'}</dd>
          <dt>Módulos</dt><dd>${(b.modules || []).map((m) => esc(MODULE_NAMES[m] || m)).join(', ') || '—'}</dd>
          <dt>Client id</dt><dd class="mono">${esc(b.client_id || '')}</dd>
          <dt>Entrega</dt><dd>${t.due_at ? fmtDate(t.due_at) : '—'}</dd>
          ${t.delivery_url ? `<dt>Enlace</dt><dd><a href="${esc(t.delivery_url)}" target="_blank" rel="noopener">${esc(t.delivery_url)}</a></dd>` : ''}
          ${t.notes ? `<dt>Notas</dt><dd>${esc(t.notes)}</dd>` : ''}
        </dl>
      </div>
      <footer class="task-actions">
        ${t.status === 'abierta' ? '<button type="button" class="primary-btn" data-act="aceptar">Aceptar tarea</button>' : ''}
        ${t.status === 'aceptada' && mine ? `
          <form class="deliver-form" data-deliver>
            <input type="url" name="url" required placeholder="https://enlace-de-la-entrega" aria-label="Enlace de la entrega" />
            <input type="text" name="notes" placeholder="Notas para el cliente (opcional)" aria-label="Notas" maxlength="2000" />
            <button type="submit" class="primary-btn">Entregar</button>
            <button type="button" class="copy-btn" data-act="liberar">Liberar</button>
          </form>` : ''}
      </footer>
    </article>`;
}

async function renderTab(tab) {
  const list = filtered(tab);
  panelEl.innerHTML = list.length
    ? `<div class="task-grid">${list.map(taskCard).join('')}</div>`
    : emptyState(
        tab === 'mias' ? 'No tienes tareas en curso' : tab === 'abiertas' ? 'No hay tareas disponibles' : 'Nada entregado todavía',
        tab === 'mias' ? 'Acepta una tarea disponible para empezar.' : 'Cuando un cliente pida un sitio o una marca, aparece aquí.',
        '🛰️'
      );
  panelEl.querySelectorAll('[data-task]').forEach((card) => {
    const id = card.dataset.task;
    const img = card.querySelector('.task-logo');
    if (img.dataset.logo) loadLogo(img, id); else img.remove();
    const act = async (body) => {
      card.querySelectorAll('button').forEach((b) => (b.disabled = true));
      try {
        await andrhoApi(`/creators/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
        await load(tab);
      } catch (err) {
        alert(err.message);
        card.querySelectorAll('button').forEach((b) => (b.disabled = false));
      }
    };
    card.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act({ action: b.dataset.act })));
    const form = card.querySelector('[data-deliver]');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      act({ action: 'entregar', delivery_url: form.url.value, notes: form.notes.value });
    });
  });
}

async function load(tab) {
  tasks = (await andrhoApi('/creators/tasks')).tasks;
  const counts = { mias: filtered('mias').length, abiertas: filtered('abiertas').length, entregadas: filtered('entregadas').length };
  document.querySelectorAll('#creatorTabs [data-tab]').forEach((b) => {
    const t = TABS.find((x) => x.key === b.dataset.tab);
    b.innerHTML = `${t.label} <span class="tab-count">${counts[t.key]}</span>`;
  });
  await renderTab(tab);
}

function show(tab) {
  if (!TABS.some((t) => t.key === tab)) tab = 'mias';
  document.querySelectorAll('#creatorTabs [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  setSubRoute('creators', tab === 'mias' ? '' : tab);
  return withPanel(panelEl, () => load(tab));
}

export default {
  title: 'Creators',
  hint: 'sitios y marcas que los clientes esperan',
  async render(el, route) {
    el.innerHTML = `${tabStrip('creatorTabs', TABS, 'mias')}<div class="panel" id="creatorPanel"></div>`;
    panelEl = el.querySelector('#creatorPanel');
    wireTabs(el.querySelector('#creatorTabs'), show);
    await show(route.sub);
  },
  onSubRoute: show
};
