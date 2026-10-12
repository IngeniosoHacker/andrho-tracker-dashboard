// Migrating from the previous system (ETL): the business exports its
// products or customers as CSV (Excel: "Guardar como CSV"), maps the
// columns, reviews a dry run and loads it into its ERP (POST /erp/import).
import { andrhoApi, esc, fmtNum, fmtDate, openDrawer, closeDrawer, withPanel } from '../core.js';

const FIELDS = {
  products: [
    ['name', 'Nombre', ['nombre', 'producto', 'descripcion', 'descripción', 'name', 'articulo', 'artículo']],
    ['code', 'Código', ['codigo', 'código', 'sku', 'code', 'referencia', 'ref']],
    ['price', 'Precio de venta', ['precio', 'precio venta', 'precio de venta', 'price', 'pvp']],
    ['cost', 'Costo', ['costo', 'cost', 'precio compra', 'precio de compra']],
    ['qty', 'Existencia', ['existencia', 'existencias', 'stock', 'cantidad', 'qty', 'inventario']],
    ['category', 'Categoría', ['categoria', 'categoría', 'category', 'familia', 'linea', 'línea']],
    ['barcode', 'Código de barras', ['barras', 'codigo de barras', 'código de barras', 'barcode', 'ean']]
  ],
  customers: [
    ['name', 'Nombre', ['nombre', 'cliente', 'name', 'razon social', 'razón social']],
    ['email', 'Correo', ['correo', 'email', 'e-mail', 'mail']],
    ['phone', 'Teléfono', ['telefono', 'teléfono', 'celular', 'whatsapp', 'phone', 'tel']],
    ['vat', 'NIT', ['nit', 'vat', 'rtu']],
    ['street', 'Dirección', ['direccion', 'dirección', 'address', 'calle']],
    ['city', 'Ciudad', ['ciudad', 'municipio', 'city']],
    ['company', 'Empresa', ['empresa', 'compania', 'compañía', 'company']]
  ]
};
const KIND = { products: 'productos', customers: 'clientes' };

// CSV with "," or ";" (Excel in Spanish uses ";"), quoted fields, CRLF.
export function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split('\n')[0];
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function guess(kind, headers) {
  const map = {};
  for (const [key, , aliases] of FIELDS[kind]) {
    const i = headers.findIndex((h) => aliases.some((a) => norm(h) === norm(a)));
    if (i >= 0) map[key] = i;
  }
  return map;
}

export function openMigration(kind, onDone) {
  const box = openDrawer(`
    <p class="eyebrow">Migrar ${KIND[kind]}</p>
    <h1 class="drawer-title">Trae tus ${KIND[kind]} de tu sistema anterior</h1>
    <p class="drawer-text">Exporta tus ${KIND[kind]} como CSV (en Excel: Archivo → Guardar como → CSV) y súbelo. Revisamos todo antes de guardar nada.</p>
    <label class="copy-btn file-btn">Elegir archivo CSV<input type="file" accept=".csv,text/csv" hidden data-file /></label>
    <div data-step></div>
    <div data-history></div>
  `);
  const step = box.querySelector('[data-step]');
  let file = null;

  andrhoApi('/erp/imports').then((d) => {
    const runs = d.imports.filter((r) => !r.dry_run && r.kind === kind);
    if (runs.length) box.querySelector('[data-history]').innerHTML = `<p class="eyebrow" style="margin-top:24px">Migraciones anteriores</p>
      <table><tbody>${runs.slice(0, 5).map((r) => `<tr><td class="mono">${fmtDate(r.created_at)}</td><td>${esc(r.filename || '—')}</td><td class="num">${fmtNum(r.report.created)} nuevos · ${fmtNum(r.report.updated)} actualizados</td></tr>`).join('')}</tbody></table>`;
  }).catch(() => {});

  box.querySelector('[data-file]').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { step.innerHTML = '<p class="form-error">El archivo pasa de 5 MB.</p>'; return; }
    const rows = parseCSV(await f.text());
    if (rows.length < 2) { step.innerHTML = '<p class="form-error">El archivo no tiene filas.</p>'; return; }
    file = { name: f.name, headers: rows[0], rows: rows.slice(1) };
    renderMapping(guess(kind, file.headers));
  });

  function mapped(map) {
    return file.rows.map((r) => Object.fromEntries(Object.entries(map).filter(([, i]) => i !== '' && i != null).map(([k, i]) => [k, (r[i] ?? '').trim()])));
  }

  function renderMapping(map) {
    step.innerHTML = `
      <p class="eyebrow" style="margin-top:20px">${esc(file.name)} · ${fmtNum(file.rows.length)} filas</p>
      <p class="hint">Dinos qué columna de tu archivo es cada dato. Las que reconocimos ya están elegidas.</p>
      <div class="map-grid">
        ${FIELDS[kind].map(([key, label]) => `
          <label>${esc(label)}${key === 'name' ? ' *' : ''}
            <select data-field="${key}">
              <option value="">— no viene —</option>
              ${file.headers.map((h, i) => `<option value="${i}" ${map[key] === i ? 'selected' : ''}>${esc(h || `Columna ${i + 1}`)}</option>`).join('')}
            </select>
          </label>`).join('')}
      </div>
      <button type="button" class="primary-btn" data-check>Revisar</button>
      <div data-report></div>
    `;
    step.querySelector('[data-check]').addEventListener('click', () => run(true));
  }

  async function run(dry) {
    const map = {};
    step.querySelectorAll('[data-field]').forEach((s) => { if (s.value !== '') map[s.dataset.field] = Number(s.value); });
    const report = step.querySelector('[data-report]');
    if (map.name == null) { report.innerHTML = '<p class="form-error">Elige la columna del nombre.</p>'; return; }
    report.innerHTML = `<p class="loading-state">${dry ? 'revisando…' : 'migrando a tu ERP…'}</p>`;
    try {
      const r = await andrhoApi('/erp/import', { method: 'POST', body: JSON.stringify({ kind, filename: file.name, dry_run: dry, rows: mapped(map) }) });
      const cols = FIELDS[kind].filter(([k]) => map[k] != null);
      report.innerHTML = `
        <div class="kpi-grid" style="margin-top:16px">
          <div class="kpi-card"><p class="kpi-label">Filas</p><p class="kpi-value">${fmtNum(r.rows)}</p></div>
          <div class="kpi-card"><p class="kpi-label">${dry ? 'Listas' : 'Nuevos'}</p><p class="kpi-value">${fmtNum(dry ? r.valid : r.created)}</p></div>
          ${dry ? '' : `<div class="kpi-card"><p class="kpi-label">Actualizados</p><p class="kpi-value">${fmtNum(r.updated)}</p></div>`}
          <div class="kpi-card"><p class="kpi-label">Con problemas</p><p class="kpi-value" style="color:var(--accent-danger)">${fmtNum(r.issues.length)}</p></div>
        </div>
        ${r.issues.length ? `<details ${dry ? 'open' : ''}><summary class="hint">Problemas por fila</summary><ul class="issue-list">${r.issues.slice(0, 50).map((i) => `<li><span class="mono">fila ${i.row}</span> ${esc(i.message)}</li>`).join('')}</ul></details>` : ''}
        ${dry && r.preview.length ? `<p class="eyebrow" style="margin-top:14px">Así quedarán</p><table><thead><tr>${cols.map(([, l]) => `<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>
          ${r.preview.map((p) => `<tr>${cols.map(([k]) => `<td>${esc(p[k] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
        ${dry ? `<button type="button" class="primary-btn" data-go ${r.valid ? '' : 'disabled'} style="margin-top:14px">Migrar ${fmtNum(r.valid)} ${KIND[kind]}</button>`
              : '<p class="drawer-note">Listo. Ya están en tu ERP.</p><button type="button" class="copy-btn" data-close>Cerrar</button>'}
      `;
      const go = report.querySelector('[data-go]');
      if (go) go.addEventListener('click', () => run(false));
      const close = report.querySelector('[data-close]');
      if (close) close.addEventListener('click', () => { closeDrawer(); onDone && onDone(); });
    } catch (err) {
      report.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
    }
  }
}
