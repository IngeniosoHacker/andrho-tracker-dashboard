// Creators (AndRho staff): the work customers asked for: a website at
// signup, and every suggestion a customer accepts (assigned by andrho-api's
// internal/matching from your skills, load and availability). Open tasks can
// be accepted; your own can be delivered (with a link) or given back.
// Delivering a suggestion's task closes the suggestion for the customer.
// Admins see every task.
import {
  andrhoApi, getAccessToken, ANDRHO_API_URL, esc, fmtDate, session, tabStrip, wireTabs, setSubRoute, withPanel, emptyState
} from '../core.js';
import { DATA_STATUS, dataTables, download, fileSize, loadImage, swatches } from './kit.js';

const TABS = [
  { key: 'mias', label: 'Mis tareas' },
  { key: 'abiertas', label: 'Disponibles' },
  { key: 'entregadas', label: 'Entregadas' }
];

const KIND = {
  website: 'Sitio web', brand: 'Marca', datos: 'Datos', web: 'Web', social: 'Redes sociales', erp: 'ERP',
  contenido: 'Contenido', diseno: 'Diseño', general: 'General'
};
const SKILLS = { web: 'Web', social: 'Redes', erp: 'ERP', contenido: 'Contenido', diseno: 'Diseño' };
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

const ASSET_KIND = { logo: 'Logo', brand_image: 'Imagen de marca', data: 'Datos' };

// What the Creator has to do (andrho-api provision.Instructions), the
// brand's palette and the files the business uploaded (signup or later).
function kitBlock(t) {
  const steps = t.instructions || [];
  const files = t.assets || [];
  const palette = t.kind === 'datos' ? [] : t.palette || [];
  if (!steps.length && !files.length && !palette.length) return '';
  const src = (a) => `/creators/tasks/${encodeURIComponent(t.id)}/assets/${encodeURIComponent(a.id)}`;
  return `
      <div class="task-body" style="display:block">
        ${steps.length ? `<p class="eyebrow" style="margin:0 0 4px">Qué hacer</p><ol class="task-instructions">${steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
        ${palette.length ? `<p class="eyebrow" style="margin:0 0 4px">Paleta</p>${swatches(palette)}` : ''}
        ${files.length ? `<p class="eyebrow" style="margin:12px 0 0">Archivos adjuntos (${files.length})</p>
        <div class="task-files">${files.map((a) => {
          const [label, cls] = a.kind === 'data' ? (DATA_STATUS[a.status] || [a.status, '']) : ['', ''];
          return `<div class="task-file">
            ${a.kind === 'data' ? '' : `<img alt="${esc(a.filename)}" hidden data-asset-img="${esc(src(a))}">`}
            <div style="flex:1;min-width:0">
              <strong>${esc(a.filename)}</strong> <span class="hint">${esc(ASSET_KIND[a.kind] || a.kind)} · ${fileSize(a.size)}</span>
              ${label ? ` <span class="status-pill ${cls}">${esc(label)}</span>` : ''}
              ${a.kind === 'data' ? dataTables(a, true) : ''}
            </div>
            <button type="button" class="copy-btn" data-download="${esc(src(a))}" data-name="${esc(a.filename)}">Descargar</button>
          </div>`;
        }).join('')}</div>` : ''}
      </div>`;
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
      ${b.suggestion ? `
      <div class="task-body" style="display:block">
        <p class="eyebrow" style="margin:0 0 4px">Sugerencia que aceptó el cliente</p>
        <p style="margin:0 0 6px"><strong>${esc(b.suggestion)}</strong></p>
        <p class="kpi-sub" style="margin:0 0 8px">${esc(b.body || '')}</p>
        ${b.evidence ? `<p class="mono hint" style="margin:0 0 8px;font-size:11.5px">Datos: ${esc(b.evidence)}</p>` : ''}
        ${t.match && t.match.reasons ? `<p class="hint" style="margin:0">Te la asignamos porque: ${t.match.reasons.map(esc).join(' · ')}</p>` : ''}
        <p class="hint" style="margin:4px 0 0">Entrega: ${t.due_at ? fmtDate(t.due_at) : '—'}</p>
      </div>` : `
      <div class="task-body">
        <img class="task-logo" alt="Logo de ${esc(t.company_name || '')}" hidden data-logo="${b.has_logo ? '1' : ''}" />
        <dl class="detail-kv">
          ${t.kind === 'datos' ? `<dt>Client id</dt><dd class="mono">${esc(b.client_id || '')}</dd><dt>Entrega</dt><dd>${t.due_at ? fmtDate(t.due_at) : '—'}</dd>` : `
          <dt>Esencia</dt><dd>${b.essence ? esc(b.essence) : '<span class="hint">Sin descripción</span>'}</dd>
          <dt>Marca</dt><dd>${b.brand_help ? 'No tiene: proponer una' : b.has_logo ? 'Tiene logo' : 'Sin logo'}</dd>
          <dt>Giro</dt><dd>${(b.sectors || []).map(esc).join(', ') || '—'}</dd>
          <dt>Módulos</dt><dd>${(b.modules || []).map((m) => esc(MODULE_NAMES[m] || m)).join(', ') || '—'}</dd>
          <dt>Client id</dt><dd class="mono">${esc(b.client_id || '')}</dd>
          ${b.business_type ? `<dt>Tipo</dt><dd>${esc(b.business_type)}</dd>` : ''}
          ${b.site_host ? `<dt>Vive en</dt><dd><a class="mono" href="https://${esc(b.site_host)}" target="_blank" rel="noopener">${esc(b.site_host)}</a> <span class="hint">(hoy: en construcción)</span></dd>` : ''}
          ${b.site && b.site.sections ? `<dt>Estructura</dt><dd>${b.site.sections.map((x) => esc(x.title)).join(' · ')}<br><span class="hint">Llamada a la acción: ${esc(b.site.cta || '')}</span></dd>` : ''}
          ${t.kind === 'website' ? `<dt>Cómo entregar</dt><dd class="hint">Parte de la plantilla <span class="mono">andrho-tracker-dashboard/sites</span> (React + Vite + Tailwind; <span class="mono">npm run dev</span>, <span class="mono">?vista=inicio</span>). Despliégalo en Railway y entrega su URL <span class="mono">https://…up.railway.app</span>: AndRho lo publica en la dirección del cliente.</dd>` : ''}
          <dt>Entrega</dt><dd>${t.due_at ? fmtDate(t.due_at) : '—'}</dd>`}
          ${t.delivery_url ? `<dt>Enlace</dt><dd><a href="${esc(t.delivery_url)}" target="_blank" rel="noopener">${esc(t.delivery_url)}</a></dd>` : ''}
          ${t.notes ? `<dt>Notas</dt><dd>${esc(t.notes)}</dd>` : ''}
        </dl>
      </div>`}
      ${kitBlock(t)}
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
    if (img) { if (img.dataset.logo) loadLogo(img, id); else img.remove(); }
    card.querySelectorAll('[data-asset-img]').forEach((im) => loadImage(im, im.dataset.assetImg));
    card.querySelectorAll('[data-download]').forEach((b) => b.addEventListener('click', () =>
      download(b.dataset.download, b.dataset.name).catch((err) => alert(err.message))));
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

// What the matching knows you do best.
async function renderSkills(box) {
  let d;
  try { d = await andrhoApi('/creators/skills'); } catch { box.remove(); return; }
  const mine = new Set(d.skills);
  box.innerHTML = `
    <p class="kpi-sub" style="margin:0 0 8px">Tus habilidades: AndRho te asigna las sugerencias que aceptan los clientes según esto, tu carga y tu disponibilidad. Sin ninguna marcada, recibes de todo.</p>
    <p class="keyword-cloud" style="margin:0">${d.options.map((k) => `
      <button type="button" class="tab ${mine.has(k) ? 'active' : ''}" data-skill="${k}" aria-pressed="${mine.has(k)}">${esc(SKILLS[k] || k)}</button>`).join('')}</p>`;
  box.querySelectorAll('[data-skill]').forEach((b) => b.addEventListener('click', async () => {
    const k = b.dataset.skill;
    if (mine.has(k)) mine.delete(k); else mine.add(k);
    b.classList.toggle('active', mine.has(k));
    b.setAttribute('aria-pressed', mine.has(k));
    try { await andrhoApi('/creators/skills', { method: 'PUT', body: JSON.stringify({ skills: [...mine] }) }); } catch (err) { alert(err.message); }
  }));
}

export default {
  title: 'Creators',
  hint: 'sitios, marcas y sugerencias que los clientes aceptaron',
  async render(el, route) {
    el.innerHTML = `<div class="card" id="creatorSkills"></div>${tabStrip('creatorTabs', TABS, 'mias')}<div class="panel" id="creatorPanel"></div>`;
    renderSkills(el.querySelector('#creatorSkills'));
    panelEl = el.querySelector('#creatorPanel');
    wireTabs(el.querySelector('#creatorTabs'), show);
    await show(route.sub);
  },
  onSubRoute: show
};
