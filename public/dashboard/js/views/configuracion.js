// Configuración: team management (invites, roles) and the account's plan.
import { andrhoApi, esc, roleAtLeast, openDrawer, ROLE_LABEL, PLAN_LABEL } from '../core.js';

function quotaLabel(quota) {
  if (!quota) return '';
  if (quota.limit < 0) return '∞ sugerencias este mes';
  return `${Math.max(0, quota.remaining)} de ${quota.limit} sugerencias restantes este mes`;
}

async function render(el) {
  el.innerHTML = '<p class="loading-state">cargando…</p>';
  const [usersData, planData] = await Promise.all([andrhoApi('/account/users'), andrhoApi('/account/plan')]);
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
  `;

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
