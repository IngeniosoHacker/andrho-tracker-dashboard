// Usuarios: the company's staff on AndRho.
import { andrhoApi, esc, ROLE_LABEL } from '../core.js';

export default {
  title: 'Usuarios',
  hint: 'tu equipo y cómo está ahora',
  async render(el) {
    el.innerHTML = '<p class="loading-state">cargando…</p>';
    const data = await andrhoApi('/account/users');
    el.innerHTML = `
      <div class="card">
        <h2>Tu equipo <span class="hint">${data.users.length} persona${data.users.length === 1 ? '' : 's'}</span></h2>
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>
            ${data.users.map((u) => `
              <tr>
                <td>${esc(u.display_name || '—')}</td>
                <td class="mono">${esc(u.email)}</td>
                <td>${esc(ROLE_LABEL[u.role] || u.role)}</td>
                <td>${u.pending ? '<span class="badge badge-muted">invitación pendiente</span>' : '<span class="badge badge-human">activo</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};
