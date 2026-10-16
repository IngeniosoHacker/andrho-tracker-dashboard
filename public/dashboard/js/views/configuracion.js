// Configuración: team management (invites, roles) and the account's plan.
import { andrhoApi, esc, fmtDate, roleAtLeast, openDrawer, ROLE_LABEL, PLAN_LABEL } from '../core.js';

const JOB = { erp: 'ERP (Odoo)', whatsapp: 'WhatsApp', website: 'Sitio web', meta: 'Facebook e Instagram' };
const JOB_STATUS = { pendiente: ['En cola', 'status-sugerida'], en_proceso: ['En proceso', 'status-proceso'], listo: ['Listo', 'status-terminada'], esperando_vps: ['Preparando el servidor', 'status-proceso'], esperando_meta: ['Esperando a Meta', 'status-sugerida'], error: ['Se reintentará', 'status-rechazada'] };

function quotaLabel(quota) {
  if (!quota) return '';
  if (quota.limit < 0) return '∞ sugerencias este mes';
  return `${Math.max(0, quota.remaining)} de ${quota.limit} sugerencias restantes este mes`;
}

async function render(el) {
  el.innerHTML = '<p class="loading-state">cargando…</p>';
  const [usersData, planData, erp, prov] = await Promise.all([
    andrhoApi('/account/users'), andrhoApi('/account/plan'),
    andrhoApi('/erp/status').catch(() => ({ connected: false })),
    andrhoApi('/account/provisioning').catch(() => ({ jobs: [], tasks: [] }))
  ]);
  const canManageTeam = roleAtLeast('admin');
  const isOwner = roleAtLeast('owner');

  el.innerHTML = `
    <div class="card">
      <div class="section-head">
        <h2 style="margin:0">Tu equipo</h2>
        ${canManageTeam ? '<button type="button" class="copy-btn" id="inviteBtn">+ Invitar</button>' : ''}
      </div>
      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th>${canManageTeam ? '<th></th>' : ''}</tr></thead>
        <tbody>
          ${usersData.users.map((u) => `
            <tr>
              <td>${esc(u.display_name || '—')}</td>
              <td class="mono">${esc(u.email)}</td>
              <td>
                ${canManageTeam && u.role !== 'owner' ? `
                  <select class="role-select" data-user-id="${esc(u.id)}" aria-label="Rol de ${esc(u.email)}">
                    ${['viewer', 'editor', 'admin'].map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${esc(ROLE_LABEL[r])}</option>`).join('')}
                  </select>
                ` : esc(ROLE_LABEL[u.role] || u.role)}
              </td>
              <td>${u.pending ? '<span class="badge badge-muted">invitación pendiente</span>' : '<span class="badge badge-human">activo</span>'}</td>
              ${canManageTeam ? `<td>${u.role !== 'owner' ? `<button type="button" class="danger-link" data-remove-user="${esc(u.id)}">Quitar</button>` : ''}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Plan actual: ${esc(PLAN_LABEL[planData.plan] || planData.plan)}</h2>
      <p class="hint" style="margin:0 0 16px">${esc(quotaLabel(planData.suggestions_quota))} · cambiar de plan aquí no genera ningún cobro todavía; solo ajusta qué ve tu cuenta.</p>
      <div class="plan-grid">
        ${['base', 'despegue', 'en_orbita', 'galactico'].map((p) => `
          <div class="plan-card ${p === planData.plan ? 'plan-card-active' : ''}">
            <p class="plan-card-name">${esc(PLAN_LABEL[p])}</p>
            ${isOwner ? `<button type="button" class="copy-btn" data-set-plan="${p}" ${p === planData.plan ? 'disabled' : ''}>${p === planData.plan ? 'Plan actual' : 'Cambiar a este plan'}</button>` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card" id="erp">
      <h2>Tu ERP</h2>
      ${erp.connected ? `
        <dl class="detail-kv"><dt>Odoo</dt><dd><a href="${esc(erp.url)}" target="_blank" rel="noopener">${esc(erp.url)}</a></dd>
          <dt>Base de datos</dt><dd>${esc(erp.db)}</dd><dt>Usuario</dt><dd>${esc(erp.login)}</dd></dl>
        <p class="hint">Inventario, Clientes, Prospectos, Sucursales y Resumen leen de aquí.</p>` :
        '<p class="hint" style="margin:0 0 12px">Sin ERP conectado. Si elegiste el ERP de AndRho al registrarte, aparece aquí cuando esté listo.</p>'}
      ${canManageTeam ? `
        <details ${erp.connected ? '' : 'open'}>
          <summary class="hint" style="cursor:pointer">${erp.connected ? 'Conectar otro Odoo' : '¿Ya usas Odoo? Conéctalo'}</summary>
          <form class="invite-form erp-form" id="erpForm" style="margin-top:12px">
            <label>URL de tu Odoo<input name="url" type="url" required placeholder="https://miempresa.odoo.com" /></label>
            <label>Base de datos<input name="db" required /></label>
            <label>Usuario<input name="login" required autocomplete="off" /></label>
            <label>Contraseña o clave de API<input name="password" type="password" required autocomplete="new-password" /></label>
            <p class="form-error" hidden></p>
            <button type="submit">Conectar</button>
          </form>
        </details>` : ''}
    </div>

    ${prov.jobs.length || prov.tasks.length ? `
    <div class="card">
      <h2>Lo que AndRho preparó para ti</h2>
      <table><thead><tr><th>Servicio</th><th>Estado</th><th>Detalle</th><th>Actualizado</th></tr></thead><tbody>
        ${prov.jobs.map((j) => { const [label, cls] = JOB_STATUS[j.status] || [j.status, '']; return `<tr><td>${esc(JOB[j.kind] || j.kind)}</td><td><span class="status-pill ${cls}">${esc(label)}${j.status === 'en_proceso' && j.progress ? ` · ${j.progress}%` : ''}</span></td><td>${esc(j.detail)}</td><td class="mono">${fmtDate(j.updated_at)}</td></tr>`; }).join('')}
        ${prov.tasks.map((t) => `<tr><td>${esc(t.title)}</td><td><span class="status-pill ${t.status === 'entregada' ? 'status-terminada' : 'status-proceso'}">${t.status === 'entregada' ? 'Entregado' : t.status === 'aceptada' ? 'Un Creator trabaja en ello' : 'Esperando Creator'}</span></td>
          <td>${t.delivery_url ? `<a href="${esc(t.delivery_url)}" target="_blank" rel="noopener">${esc(t.delivery_url)}</a>` : esc(t.notes || '')}</td><td class="mono">${fmtDate(t.updated_at)}</td></tr>`).join('')}
      </tbody></table>
    </div>` : ''}
  `;

  const erpForm = el.querySelector('#erpForm');
  if (erpForm) erpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = erpForm.elements;
    const err = erpForm.querySelector('.form-error');
    const btn = erpForm.querySelector('button');
    btn.disabled = true;
    err.hidden = true;
    try {
      await andrhoApi('/account/erp', { method: 'POST', body: JSON.stringify({ url: f.url.value, db: f.db.value, login: f.login.value, password: f.password.value }) });
      render(el);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      btn.disabled = false;
    }
  });

  const act = async (fn, msg) => {
    try { await fn(); render(el); } catch (err) { alert(err.message || msg); }
  };

  const inviteBtn = el.querySelector('#inviteBtn');
  if (inviteBtn) inviteBtn.addEventListener('click', openInviteDrawer);

  el.querySelectorAll('.role-select').forEach((sel) => sel.addEventListener('change', () => act(
    () => andrhoApi(`/account/users/${encodeURIComponent(sel.dataset.userId)}/role`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) }),
    'No se pudo cambiar el rol.'
  )));

  el.querySelectorAll('[data-remove-user]').forEach((btn) => btn.addEventListener('click', () => {
    if (!confirm('¿Quitar a esta persona del equipo?')) return;
    act(() => andrhoApi(`/account/users/${encodeURIComponent(btn.dataset.removeUser)}`, { method: 'DELETE' }), 'No se pudo quitar a esta persona.');
  }));

  el.querySelectorAll('[data-set-plan]').forEach((btn) => btn.addEventListener('click', () => act(
    () => andrhoApi('/account/plan', { method: 'PATCH', body: JSON.stringify({ plan: btn.dataset.setPlan }) }),
    'No se pudo cambiar el plan.'
  )));
}

function openInviteDrawer() {
  const box = openDrawer(`
    <p class="eyebrow">Invitar a tu equipo</p>
    <h1 class="drawer-title">Nueva invitación</h1>
    <form id="inviteForm" class="invite-form">
      <label>Correo<input type="email" name="email" required /></label>
      <label>Nombre (opcional)<input type="text" name="display_name" /></label>
      <label>Rol
        <select name="role">
          <option value="viewer">Solo lectura</option>
          <option value="editor">Editor</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <button type="submit">Generar invitación</button>
    </form>
    <div id="inviteResult"></div>
  `);
  box.querySelector('#inviteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const result = box.querySelector('#inviteResult');
    try {
      const resp = await andrhoApi('/account/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), display_name: form.get('display_name'), role: form.get('role') })
      });
      const link = `${window.location.origin}/accept-invite.html?token=${encodeURIComponent(resp.invite_token)}`;
      result.innerHTML = `
        <p class="hint" style="margin:16px 0 8px">Comparte este enlace con ${esc(resp.user.email)}; todavía no se envía por correo automáticamente:</p>
        <pre class="snippet-box"><code>${esc(link)}</code></pre>
        <button type="button" class="copy-btn copy-btn-full" id="copyInviteLink">Copiar enlace</button>
      `;
      result.querySelector('#copyInviteLink').addEventListener('click', (ev) => {
        navigator.clipboard.writeText(link).then(() => { ev.target.textContent = '✓ Copiado'; });
      });
      e.target.reset();
    } catch (err) {
      result.innerHTML = `<p class="empty-state">${esc(err.message)}</p>`;
    }
  });
}

export default {
  title: 'Configuración',
  hint: 'tu equipo y tu plan',
  render
};
