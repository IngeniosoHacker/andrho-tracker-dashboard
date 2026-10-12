// Prospectos: people who left their details but haven't bought yet.
import { emptyState } from '../core.js';

export default {
  title: 'Prospectos',
  hint: 'quienes te dejaron sus datos y todavía no compran',
  render(el) {
    el.innerHTML = emptyState('Tus prospectos aparecerán aquí',
      'Formularios de tu sitio, mensajes y oportunidades del ERP: todo el que mostró interés, en una sola lista.', '🔭');
  }
};
