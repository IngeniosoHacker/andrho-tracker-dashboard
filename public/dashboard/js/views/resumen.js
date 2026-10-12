// Resumen: the history of everything that happened on the account.
import { andrhoApi, esc, fmtDate, fmtNum } from '../core.js';

export default {
  title: 'Resumen',
  hint: 'el histórico de operaciones de tu cuenta',
  async render(el) {
    el.innerHTML = '<p class="loading-state">cargando…</p>';
    const d = await andrhoApi('/account/events?limit=100');
    el.innerHTML = `
      <div class="card">
        <h2>Histórico <span class="hint">${fmtNum(d.total)} en total</span></h2>
        ${d.events.length ? `
        <table>
          <thead><tr><th>Cuándo</th><th>Tipo</th><th>Descripción</th></tr></thead>
          <tbody>
            ${d.events.map((e) => `
              <tr>
                <td class="mono">${fmtDate(e.created_at)}</td>
                <td><span class="badge badge-muted">${esc(e.type)}</span></td>
                <td>${esc(e.description)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : '<p class="empty-state">Sin actividad registrada todavía.</p>'}
      </div>
    `;
  }
};
