// Shared by the ERP sections (Inventario, Clientes, Prospectos, Sucursales,
// Resumen): reading andrho-api's /erp/* and the empty state until the
// account has an ERP connected.
import { andrhoApi, emptyState, roleAtLeast } from '../core.js';

// Resolves to the data, or to null after rendering the "connect" state.
export async function erpGet(el, path) {
  try {
    return await andrhoApi(`/erp${path}`);
  } catch (err) {
    if (err.status === 404 && err.message === 'erp_not_connected') {
      el.innerHTML = notConnected();
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
