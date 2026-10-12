// Clientes: people who already bought.
import { emptyState } from '../core.js';

export default {
  title: 'Clientes',
  hint: 'quienes ya te compraron',
  render(el) {
    el.innerHTML = emptyState('Tus clientes aparecerán aquí',
      'Cada venta registrada en tu punto de venta o ERP de AndRho suma a su cliente: cuánto compra, cada cuánto y qué.', '🧾');
  }
};
