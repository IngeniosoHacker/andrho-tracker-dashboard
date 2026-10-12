// The left sidebar: every section of the dashboard, in order. `key` is the
// route (#/key/sub), `section` is what andrho-api's suggestions/insights are
// filed under, `staff` limits an entry to AndRho's own team (see isStaff).

const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONS = {
  inicio: icon('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  web: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>'),
  social: icon('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8"/>'),
  inventario: icon('<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>'),
  clientes: icon('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 11.5a3 3 0 1 0 0-6"/><path d="M18 20a5 5 0 0 0-2.5-4.3"/>'),
  prospectos: icon('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5L16 16"/><path d="M11 8v6M8 11h6"/>'),
  sucursales: icon('<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/><path d="M8 10h.01M16 10h.01"/>'),
  usuarios: icon('<circle cx="12" cy="7.5" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/><circle cx="19" cy="5" r="1.6" fill="currentColor" stroke="none"/>'),
  resumen: icon('<path d="M12 7v5l3 2"/><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 4v4h4"/>'),
  creators: icon('<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z"/>'),
  admin: icon('<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  tokens: icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h3.75a1.75 1.75 0 0 1 0 3.5h-2.5a1.75 1.75 0 0 0 0 3.5H14.5"/>'),
  config: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  logout: icon('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>'),
  panel: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>')
};

export const NAV = [
  { key: 'inicio', label: 'Inicio', section: 'inicio' },
  { key: 'web', label: 'Web', section: 'web' },
  { key: 'social', label: 'Social', section: 'social' },
  { key: 'inventario', label: 'Inventario', section: 'inventario' },
  { key: 'clientes', label: 'Clientes', section: 'clientes' },
  { key: 'prospectos', label: 'Prospectos', section: 'prospectos' },
  { key: 'sucursales', label: 'Sucursales', section: 'sucursales' },
  { key: 'usuarios', label: 'Usuarios', section: 'usuarios' },
  { key: 'resumen', label: 'Resumen', section: 'resumen' }
];

// AndRho's own team only.
export const STAFF_NAV = [
  { key: 'creators', label: 'Creators', section: 'creators', staff: 'creator' },
  { key: 'andrho', label: 'Métricas AndRho', icon: 'admin', section: 'andrho', staff: 'admin' },
  { key: 'tokens', label: 'Tokens Usage', section: 'tokens', staff: 'admin' }
];

export const FOOTER_NAV = [
  { key: 'configuracion', label: 'Configuración', icon: 'config' }
];

export function findNav(key) {
  return [...NAV, ...STAFF_NAV, ...FOOTER_NAV].find((n) => n.key === key);
}
