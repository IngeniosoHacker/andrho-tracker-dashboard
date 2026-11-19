// Personal: the staff of each work site (obra), its crews and where they
// work, as the supervisors reported them by WhatsApp (andrho-api
// /workforce/*, ERP module andrho_workforce). Admins register the sites
// and their supervisors; a supervisor sees only their own sites.
import { andrhoApi, esc, fmtDate, fmtNum, emptyState } from '../core.js';

const ID_MODE = { name: 'Nombre', code: 'Código interno', both: 'Nombre y código' };
const apiMsg = (err) => (err.data && err.data.message) || err.message;
const when = (s) => (s ? fmtDate(new Date(s.replace(' ', 'T') + 'Z')) : '—');

function whatsappCard(st) {
  if (st.my_whatsapp) return '';
  return `
    <div class="card" id="wfWa">
      <h3 style="margin-top:0">Vincula tu WhatsApp</h3>
      ${st.whatsapp
        ? `<p class="hint" style="margin:0 0 12px">Desde la obra le mandas a AndRho las fotos de los trabajadores y tus cuadrillas por WhatsApp. Primero vincula tu número: te damos un código y lo mandas desde tu WhatsApp.</p>
           <button type="button" class="copy-btn" id="wfWaLink">Vincular mi WhatsApp</button><div id="wfWaCode" hidden style="margin-top:12px"></div>`
        : '<p class="hint" style="margin:0">El WhatsApp de AndRho todavía no está activo.</p>'}
    </div>`;
}

const HOW = `
  <div class="card">
    <h3 style="margin-top:0">Cómo se usa desde la obra</h3>
    <ul class="hint" style="margin:0;padding-left:18px">
      <li><strong>Alta:</strong> manda por WhatsApp la foto del trabajador con su nombre o código en el texto.</li>
      <li><strong>Cuadrilla:</strong> «Cuadrilla Losa Norte: Juan Pérez, Pedro Gómez, en el nivel 3, armado de losa».</li>
      <li><strong>Baja:</strong> «Baja de Juan Pérez». Su foto se borra.</li>
    </ul>
    <p class="hint" style="margin:10px 0 0">AndRho te pide confirmar antes de guardar. Las fotos solo se guardan en tu ERP.</p>
  </div>`;

export default {
  title: 'Personal',
  hint: 'tu personal por obra, sus cuadrillas y dónde están',

  async render(el) {
    this.el = el;
    const st = await andrhoApi('/workforce/status');
    if (!st.available) {
      el.innerHTML = emptyState('Personal en obra viene en los planes En órbita y Galaxy',
        'Tus supervisores dan de alta al personal y reportan cuadrillas por WhatsApp, sin computadora. <a href="#/configuracion">Ver planes</a>', '🦺');
      return;
    }
    if (!st.enabled) {
      el.innerHTML = emptyState('Personal en obra está apagado',
        st.can_manage ? 'Actívalo en <a href="#/configuracion">Configuración › Funciones</a>.' : 'Pídele al administrador de tu cuenta que lo active.', '🦺');
      return;
    }
    if (st.erp !== 'ready') {
      el.innerHTML = st.can_manage && st.erp === 'connected'
        ? `<div class="card"><h3 style="margin-top:0">Activa Personal en tu ERP</h3><p class="hint">AndRho agrega a tu ERP las obras, el personal y las cuadrillas. Tarda unos minutos.</p><button type="button" class="copy-btn" id="wfSetup">Activar</button></div>`
        : emptyState('Tu ERP todavía no está listo', 'En cuanto tu ERP esté listo, aquí ves a tu personal por obra.', '⏳');
      const b = el.querySelector('#wfSetup');
      if (b) b.addEventListener('click', async () => {
        b.disabled = true; b.textContent = 'Activando…';
        try { await andrhoApi('/workforce/setup', { method: 'POST' }); this.render(el); } catch (err) { alert(apiMsg(err)); b.disabled = false; b.textContent = 'Activar'; }
      });
      return;
    }
    const [staff, team] = await Promise.all([
      andrhoApi('/workforce/staff').catch(() => ({ sites: [] })),
      st.can_manage ? andrhoApi('/account/users').catch(() => ({ users: [] })) : Promise.resolve({ users: [] })
    ]);
    const people = staff.sites.reduce((n, s) => n + s.employees.length, 0);
    const crews = staff.sites.reduce((n, s) => n + s.crews.length, 0);
    el.innerHTML = `
      ${whatsappCard(st)}
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Obras</p><p class="kpi-value">${fmtNum(st.sites.filter((s) => s.active).length)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Personal</p><p class="kpi-value">${fmtNum(people)}</p></div>
        <div class="kpi-card"><p class="kpi-label">Cuadrillas</p><p class="kpi-value">${fmtNum(crews)}</p></div>
      </div>
      ${staff.sites.length ? staff.sites.map((s) => this.siteCard(s)).join('') : `<div class="card"><p class="empty-state">${st.can_manage ? 'Registra tu primera obra abajo y asígnale un supervisor.' : 'No tienes obras asignadas todavía.'}</p></div>`}
      ${st.can_manage ? this.adminCard(st, team.users) : ''}
      ${HOW}`;
    this.wire(el, st);
  },

  siteCard(s) {
    return `
      <div class="card" style="margin-bottom:16px">
        <h3 style="margin-top:0">${esc(s.name)} <span class="hint">${fmtNum(s.employees.length)} personas · ${fmtNum(s.crews.length)} cuadrillas</span></h3>
        <h4 style="margin:12px 0 6px">Cuadrillas</h4>
        ${s.crews.length ? `<table><thead><tr><th>Cuadrilla</th><th>Integrantes</th><th>Dónde</th><th>Actividad</th><th>Reportó</th><th>Cuándo</th></tr></thead><tbody>
          ${s.crews.map((c) => `<tr><td>${esc(c.name)}</td><td>${c.members.map((m) => esc(m.name)).join(', ') || '—'}</td><td>${esc(c.zone || '—')}</td><td>${esc(c.activity || '—')}</td><td>${esc(c.reported_by || '—')}</td><td class="mono">${when(c.reported_at)}</td></tr>`).join('')}
        </tbody></table>` : '<p class="hint" style="margin:0">Sin cuadrillas reportadas.</p>'}
        <h4 style="margin:16px 0 6px">Personal</h4>
        ${s.employees.length ? `<table><thead><tr><th>Nombre</th><th>Código</th><th>Foto</th><th>Cuadrilla</th><th>Alta por</th><th>Cuándo</th><th></th></tr></thead><tbody>
          ${s.employees.map((e) => `<tr><td>${esc(e.name)}</td><td class="mono">${esc(e.code || '—')}</td><td>${e.has_photo ? 'Sí' : '—'}</td><td>${esc((e.crews || []).join(', ') || '—')}</td><td>${esc(e.reported_by || '—')}</td><td class="mono">${when(e.reported_at)}</td>
            <td><button type="button" class="danger-link" data-letgo="${e.id}" data-name="${esc(e.name)}">Dar de baja</button></td></tr>`).join('')}
        </tbody></table>` : '<p class="hint" style="margin:0">Nadie dado de alta todavía.</p>'}
      </div>`;
  },

  adminCard(st, users) {
    const active = users.filter((u) => !u.pending);
    return `
      <div class="card" style="margin-bottom:16px" id="wfAdmin">
        <h3 style="margin-top:0">Obras y supervisores <span class="hint">las obras van aparte de tus sucursales</span></h3>
        ${st.sites.length ? `<table><thead><tr><th>Obra</th><th>Supervisores</th><th>Estado</th><th></th></tr></thead><tbody>
          ${st.sites.map((s) => `<tr>
            <td>${esc(s.name)}</td>
            <td><select multiple size="${Math.min(4, Math.max(2, active.length))}" data-sups="${esc(s.id)}" aria-label="Supervisores de ${esc(s.name)}">
              ${active.map((u) => `<option value="${esc(u.id)}" ${s.supervisors.includes(u.id) ? 'selected' : ''}>${esc(u.display_name || u.email)}${u.role === 'supervisor' ? '' : ` (${esc(u.role)})`}</option>`).join('')}
            </select></td>
            <td>${s.active ? 'Activa' : 'Cerrada'}</td>
            <td><button type="button" class="link-btn" data-toggle-site="${esc(s.id)}" data-active="${s.active ? '1' : '0'}">${s.active ? 'Cerrar' : 'Reabrir'}</button></td>
          </tr>`).join('')}
        </tbody></table>
        <p class="hint">Un supervisor necesita el rol «Supervisor de obra» (Configuración › Tu equipo) y su WhatsApp vinculado. Solo ve el personal de sus obras.</p>` : ''}
        <form class="invite-form" id="wfNewSite" style="margin-top:12px">
          <label>Nueva obra <input name="name" maxlength="80" required placeholder="Torre Las Margaritas"></label>
          <button type="submit">Agregar obra</button>
        </form>
        <form class="invite-form" id="wfMode" style="margin-top:12px">
          <label>Cada trabajador se identifica por
            <select name="id_mode">${Object.entries(ID_MODE).map(([k, v]) => `<option value="${k}" ${k === st.id_mode ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
          </label>
          <button type="submit">Guardar</button>
        </form>
      </div>`;
  },

  wire(el, st) {
    const again = () => this.render(el);
    const link = el.querySelector('#wfWaLink');
    if (link) link.addEventListener('click', async () => {
      link.disabled = true;
      try {
        const r = await andrhoApi('/account/me/whatsapp/link', { method: 'POST' });
        const box = el.querySelector('#wfWaCode');
        box.innerHTML = `<p style="margin:0 0 8px">Manda este mensaje${r.number ? ` al <span class="mono">+${esc(r.number)}</span>` : ''}:</p>
          <p class="mono" style="font-size:1.1em;margin:0 0 12px">${esc(r.text)}</p>
          ${r.link ? `<a class="copy-btn" href="${esc(r.link)}" target="_blank" rel="noopener">Abrir WhatsApp</a>` : ''}`;
        box.hidden = false;
      } catch (err) { alert(apiMsg(err)); link.disabled = false; }
    });
    el.querySelectorAll('[data-letgo]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(`¿Dar de baja a ${b.dataset.name}? Se archiva en tu ERP y su foto se borra.`)) return;
      try { await andrhoApi(`/workforce/employees/${b.dataset.letgo}/terminate`, { method: 'POST' }); again(); } catch (err) { alert(apiMsg(err)); }
    }));
    if (!st.can_manage) return;
    el.querySelectorAll('[data-sups]').forEach((sel) => sel.addEventListener('change', async () => {
      const ids = [...sel.selectedOptions].map((o) => o.value);
      try { await andrhoApi(`/workforce/sites/${sel.dataset.sups}/supervisors`, { method: 'PUT', body: JSON.stringify({ user_ids: ids }) }); } catch (err) { alert(apiMsg(err)); }
    }));
    el.querySelectorAll('[data-toggle-site]').forEach((b) => b.addEventListener('click', async () => {
      try { await andrhoApi(`/workforce/sites/${b.dataset.toggleSite}`, { method: 'PUT', body: JSON.stringify({ active: b.dataset.active !== '1' }) }); again(); } catch (err) { alert(apiMsg(err)); }
    }));
    const form = el.querySelector('#wfNewSite');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await andrhoApi('/workforce/sites', { method: 'POST', body: JSON.stringify({ name: form.name.value.trim() }) }); again(); } catch (err) { alert(apiMsg(err)); }
    });
    const mode = el.querySelector('#wfMode');
    mode.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = mode.querySelector('button');
      try { await andrhoApi('/workforce/settings', { method: 'PUT', body: JSON.stringify({ id_mode: mode.id_mode.value }) }); btn.textContent = 'Guardado'; setTimeout(() => { btn.textContent = 'Guardar'; }, 1500); } catch (err) { alert(apiMsg(err)); }
    });
  }
};
