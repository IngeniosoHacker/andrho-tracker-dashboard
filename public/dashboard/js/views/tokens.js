// Tokens Usage (AndRho staff only): AI tokens spent on development and by
// the WhatsApp integration.
import { emptyState } from '../core.js';

export default {
  title: 'Tokens Usage',
  hint: 'tokens de IA usados por AndRho',
  render(el) {
    el.innerHTML = emptyState('Sin registros de tokens todavía',
      'Aquí verás los tokens usados en desarrollo y por la integración de WhatsApp.', '🪙');
  }
};
