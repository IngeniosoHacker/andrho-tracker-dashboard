// Sucursales: branches, their current state and operating info.
import { emptyState } from '../core.js';

export default {
  title: 'Sucursales',
  hint: 'cada sucursal, su estado y su operación',
  render(el) {
    el.innerHTML = emptyState('Tus sucursales aparecerán aquí',
      'Con tu ERP de AndRho activo verás cada sucursal: ventas del día, caja, personal y existencias.', '🏬');
  }
};
