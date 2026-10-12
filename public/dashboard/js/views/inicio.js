// Inicio: the view each user arranges with what they want to see first.
import { emptyState, session, esc } from '../core.js';

export default {
  title: 'Inicio',
  hint: 'lo que quieres ver primero',
  render(el) {
    const name = session.account.displayName || session.account.companyName || '';
    el.innerHTML = `<p class="welcome">Hola${name ? ', ' + esc(name) : ''}.</p>` +
      emptyState('Arma tu inicio', 'Pronto podrás elegir qué números y listas ver aquí apenas entras.', '🧭');
  }
};
