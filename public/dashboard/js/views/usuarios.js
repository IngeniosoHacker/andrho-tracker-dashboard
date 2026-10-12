// Usuarios: the company's staff on AndRho and where each one is right now:
// the status they set (disponible, almorzando, en reunión...) and whether
// the dashboard is open on their side.
import { andrhoApi, esc, ROLE_LABEL, fmtDate } from '../core.js';

const STATUS = { disponible: 'Disponible', almorzando: 'Almorzando', en_reunion: 'En reunión', en_ruta: 'En ruta', fuera: 'Fuera de turno' };

function ago(d) {
  const min = Math.round((Date.now() - new Date(d)) / 60000);
  if (min < 60) return `hace ${Math.max(1, min)} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  return fmtDate(d);
}

export default {
  title: 'Usuarios',
  hint: 'tu equipo y cómo está ahora',
  async render(el) {
    const [data, pres] = await Promise.all([andrhoApi('/account/users'), andrhoApi('/account/presence')]);
    const by = Object.fromEntries(pres.presence.map((p) => [p.user_id, p]));
    const online = pres.presence.filter((p) => p.online).length;
    el.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">En tu equipo</p><p class="kpi-value">${data.users.length}</p></div>
        <div class="kpi-card"><p class="kpi-label">En línea ahora</p><p class="kpi-value">${online}</p></div>
        <div class="kpi-card"><p class="kpi-label">Disponibles</p><p class="kpi-value">${pres.presence.filter((p) => p.online && p.status === 'disponible').length}</p></div>
      </div>
      <div class="card">
        <h2>Tu equipo</h2>
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Ahora</th></tr></thead>
          <tbody>
            ${data.users.map((u) => {
              const p = by[u.id];
              const now = u.pending ? '<span class="badge badge-muted">invitación pendiente</span>'
                : p ? `<span class="presence"><span class="status-dot" data-status="${p.online ? esc(p.status) : 'fuera'}"></span>${esc(STATUS[p.status] || p.status)}${p.note ? ` · ${esc(p.note)}` : ''}
                    <small>${p.online ? 'en línea' : 'visto ' + ago(p.last_seen_at)}</small></span>`
                : '<span class="hint">Todavía no entra</span>';
              return `<tr><td>${esc(u.display_name || '—')}</td><td class="mono">${esc(u.email)}</td><td>${esc(ROLE_LABEL[u.role] || u.role)}</td><td>${now}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};
