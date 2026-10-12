// Social: the same reading as Web, for the account's social networks.
import { emptyState } from '../core.js';

export default {
  title: 'Social',
  hint: 'tus redes sociales, medidas como tu sitio',
  render(el) {
    el.innerHTML = emptyState(
      'Conecta tus redes sociales',
      'Cuando conectes Facebook, Instagram o TikTok, aquí verás alcance, interacción, seguidores y qué publicaciones venden. La conexión con Meta y TikTok está en camino.',
      '📡'
    );
  }
};
