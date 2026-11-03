// Prospectos: people who showed interest and haven't bought: the ERP's
// CRM opportunities (or contacts without purchases when there's no CRM).
import { esc, fmtNum, fmtMoney, fmtDate } from '../core.js';
import { erpGet, odooDate, missingModuleCard, wireMissingModule } from './erp.js';

export default {
  title: 'Prospectos',
  hint: 'quienes te dejaron sus datos y todavía no compran',
  async render(el) {
    const d = await erpGet(el, '/leads');
    if (!d) return;
    const pipeline = d.leads.reduce((n, l) => n + (l.expected || 0), 0);
    if (d.missing && !d.leads.length) {
      el.innerHTML = missingModuleCard(d.missing, 'prospectos: tu ERP aún no guarda a las personas interesadas');
      wireMissingModule(el);
      return;
    }
    el.innerHTML = `
      ${d.missing ? `<p class="kpi-sub">Estos son contactos que nunca te compraron. Con el CRM activo, AndRho les da seguimiento por ti: <button type="button" class="link-btn" data-open-insights>ver la sugerencia</button>.</p>` : ''}
      <div class="kpi-grid">
        <div class="kpi-card"><p class="kpi-label">Prospectos</p><p class="kpi-value">${fmtNum(d.leads.length)}</p></div>
        ${d.source === 'crm' ? `<div class="kpi-card"><p class="kpi-label">En juego</p><p class="kpi-value">${fmtMoney(pipeline)}</p><p class="kpi-sub">ingreso esperado</p></div>` : ''}
      </div>
      <div class="card">
        <h2>${d.source === 'crm' ? 'Oportunidades' : 'Contactos sin compras'}</h2>
        ${d.leads.length ? `<table><thead><tr><th>Prospecto</th><th>Contacto</th>${d.source === 'crm' ? '<th>Etapa</th><th class="num">Esperado</th>' : ''}<th>Desde</th></tr></thead><tbody>
          ${d.leads.map((l) => `<tr>
            <td><strong>${esc(l.name)}</strong>${l.company && l.company !== l.name ? `<br><span class="hint">${esc(l.company)}</span>` : ''}</td>
            <td class="mono">${esc(l.contact || '')}${l.email ? `<br>${esc(l.email)}` : ''}${l.phone ? `<br>${esc(l.phone)}` : ''}</td>
            ${d.source === 'crm' ? `<td><span class="badge badge-muted">${esc(l.stage)}</span></td><td class="num">${fmtMoney(l.expected)}</td>` : ''}
            <td class="mono">${fmtDate(odooDate(l.created))}</td></tr>`).join('')}
        </tbody></table>` : '<p class="empty-state">Sin prospectos todavía.</p>'}
      </div>
    `;
    wireMissingModule(el);
  }
};
