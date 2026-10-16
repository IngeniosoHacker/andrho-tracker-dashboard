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
