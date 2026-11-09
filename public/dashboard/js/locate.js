// The search bar (like `locate`): a few words find where something is, in
// AndRho or in the ERP. "productos" -> Inventario › Productos, "en vivo" ->
// the lives, "tarjetas" -> shipping cards. An ERP result opens Odoo right on
// that screen (POST /erp/sso with next); a dashboard one changes the route.
// "/" focuses it from anywhere.
import { andrhoApi, esc } from './core.js';
import { ICONS } from './nav.js';

export function setupLocate(root) {
  if (!root) return;
  root.innerHTML = `
    ${ICONS.search}
    <input type="search" id="locateInput" placeholder="Buscar: productos, en vivo, tarjetas…" autocomplete="off"
      aria-label="Buscar en AndRho y en tu ERP" aria-controls="locateList" aria-expanded="false" role="combobox">
    <kbd>/</kbd>
    <ul class="locate-list" id="locateList" role="listbox" hidden></ul>`;
  const input = root.querySelector('input');
  const list = root.querySelector('ul');
  let results = [];
  let active = -1;
  let timer = null;
  let seq = 0;

  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
  const paint = () => {
    if (!results.length) {
      list.innerHTML = input.value.trim() ? '<li class="locate-empty">No encontramos eso. Prueba con otra palabra.</li>' : '';
    } else {
      list.innerHTML = results.map((r, i) => `
        <li role="option" id="loc-${i}" class="${i === active ? 'active' : ''}" aria-selected="${i === active}" data-i="${i}">
          <span class="locate-label">${esc(r.label)}</span>
          <span class="locate-hint">${esc(r.hint)}</span>
          <span class="locate-where">${r.where === 'erp' ? 'abre el ERP' : 'AndRho'}</span>
        </li>`).join('');
    }
    list.hidden = !list.innerHTML;
    input.setAttribute('aria-expanded', String(!list.hidden));
    if (active >= 0) input.setAttribute('aria-activedescendant', `loc-${active}`); else input.removeAttribute('aria-activedescendant');
  };
  const search = async () => {
    const q = input.value.trim();
    if (!q) { results = []; close(); list.innerHTML = ''; return; }
    const mine = ++seq;
    try {
      const d = await andrhoApi(`/erp/locate?q=${encodeURIComponent(q)}`);
      if (mine !== seq) return;
      results = d.results || [];
      active = results.length ? 0 : -1;
      paint();
    } catch { /* offline: keep the last results */ }
  };
  const go = async (r) => {
    if (!r) return;
    close();
    input.value = '';
    input.blur();
    if (r.where === 'dashboard') { window.location.hash = r.path; return; }
    const w = window.open('', '_blank');
    try {
      const { url } = await andrhoApi('/erp/sso', { method: 'POST', body: JSON.stringify({ next: r.path }) });
      if (w) w.location = url; else window.location = url;
    } catch (err) {
      if (w) w.close();
      alert(err.status === 404 ? 'Tu ERP todavía no está listo.' : 'No pudimos abrir tu ERP. Inténtalo en un momento.');
    }
  };

  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 180); });
  input.addEventListener('focus', () => { if (results.length) paint(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && results.length) { e.preventDefault(); active = (active + 1) % results.length; paint(); }
    else if (e.key === 'ArrowUp' && results.length) { e.preventDefault(); active = (active - 1 + results.length) % results.length; paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active] || results[0]); }
    else if (e.key === 'Escape') { close(); input.blur(); }
  });
  list.addEventListener('mousedown', (e) => {
    const li = e.target.closest('[data-i]');
    if (li) { e.preventDefault(); go(results[Number(li.dataset.i)]); }
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (e.key === '/' && !typing) { e.preventDefault(); input.focus(); }
  });
}
