// Inventario: stock and product/service movements, from the account's ERP.
import { emptyState } from '../core.js';

export default {
  title: 'Inventario',
  hint: 'tus productos y servicios, y cómo se mueven',
  render(el) {
    el.innerHTML = emptyState('Tu inventario aparecerá aquí',
      'Cuando tu ERP de AndRho esté activo, verás existencias, entradas, salidas y alertas de productos que se agotan o se vencen.', '📦');
  }
};
