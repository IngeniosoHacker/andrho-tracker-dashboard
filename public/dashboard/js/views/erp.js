// Shared by the ERP sections (Inventario, Clientes, Prospectos, Sucursales,
// Resumen): reading andrho-api's /erp/* and, until the account has an ERP,
// its creation progress (erpstatus.js) or the "connect" state.
import { andrhoApi, emptyState, roleAtLeast } from '../core.js';
import { erpStatus, onErpStatus, creatingCard } from '../erpstatus.js';

// Resolves to the data, or to null after rendering the progress or
// "connect" state. While the ERP is being created the card follows its
// progress and, once it's ready, the section reloads itself.
export async function erpGet(el, path) {
  try {
    return await andrhoApi(`/erp${path}`);
  } catch (err) {
    if (err.status === 404 && err.message === 'erp_not_connected') {
      const s = await erpStatus().catch(() => ({ state: 'sin_erp' }));
      if (s.state !== 'creando') {
        el.innerHTML = notConnected();
        return null;
      }
      el.innerHTML = creatingCard(s);
      const off = onErpStatus((next) => {
        const card = el.querySelector('[data-erp-creating]');
        if (!card) { off(); return; }
        if (next.state === 'listo') {
          off();
          window.dispatchEvent(new Event('andrho:reload'));
          return;
        }
        card.outerHTML = creatingCard(next);
      });
      return null;
    }
    throw err;
  }
}

export function notConnected() {
  return emptyState(
    'Conecta tu ERP para ver esto',
    `Esta sección se llena con tu ERP de AndRho (Odoo). Si elegiste el ERP al registrarte, lo estamos preparando;
     si ya usas Odoo, ${roleAtLeast('admin') ? '<a href="#/configuracion">conéctalo en Configuración</a>' : 'pide a un administrador de tu cuenta que lo conecte'}.`,
    '🔌'
  );
}

// Odoo datetimes are UTC "YYYY-MM-DD HH:MM:SS".
export function odooDate(s) {
  if (!s) return null;
  return new Date(String(s).replace(' ', 'T') + 'Z');
}

// The ERP doesn't have the app a section needs (d.missing from andrho-api):
// AndRho proposes turning it on in the panel on the right; the owner only
// accepts and AndRho installs it.
export function missingModuleCard(missing, what) {
  return `
    <div class="card empty-card">
      <p class="empty-card-icon">⚙</p>
      <h2>Tu ERP todavía no tiene ${missing.label}</h2>
      <p class="empty-card-body">Por eso aquí no hay ${what} todavía. AndRho puede activarlo por ti: no tienes que instalar ni configurar nada.</p>
      <p style="margin:14px 0 0"><button type="button" class="primary-btn" data-open-insights>Ver la sugerencia de AndRho</button></p>
    </div>`;
}

export function wireMissingModule(el) {
  const b = el.querySelector('[data-open-insights]');
  if (b) b.addEventListener('click', () => document.body.classList.add('insights-open'));
}
