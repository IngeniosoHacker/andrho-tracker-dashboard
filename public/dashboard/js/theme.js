// Light / dark theme. index.html sets data-theme on <html> before the first
// paint (saved choice, else the system's); this wires the header button that
// flips it, saves the choice and tells the starfield and the current view
// (charts read their colors from the CSS tokens when drawn) to repaint.
const KEY = 'andrho_theme';

export const currentTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

function paintButton(btn) {
  const dark = currentTheme() === 'dark';
  btn.setAttribute('aria-pressed', String(dark));
  btn.setAttribute('aria-label', dark ? 'Modo claro' : 'Modo oscuro');
  btn.title = dark ? 'Modo claro' : 'Modo oscuro';
}

export function setupThemeToggle(btn, onChange) {
  paintButton(btn);
  btn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch {}
    paintButton(btn);
    window.dispatchEvent(new Event('andrho:theme'));
    onChange?.();
  });
}
