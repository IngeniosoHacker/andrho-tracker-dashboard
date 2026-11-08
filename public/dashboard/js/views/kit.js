// "Tu marca y tus datos" (Configuración): what the long signup asked —
// logo, colors, data — with what's still pending ("Lo subo después"). Files
// go to POST /account/assets: images get their colors read into the brand's
// palette, data gets mapped to the ERP (and loaded on its own when it maps
// well). Also used by the Creators view to show a task's attachments.
import { ANDRHO_API_URL, andrhoApi, getAccessToken, esc, fmtDate } from '../core.js';

export const DATA_ACCEPT = '.csv,.tsv,.txt,.xlsx,.xlsm,.xls,.json,.sql,.dump';
const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

export const DATA_STATUS = {
  analizado: ['Se carga cuando tu ERP esté listo', 'status-sugerida'],
  cargando: ['Cargando a tu ERP…', 'status-proceso'],
  cargado: ['En tu ERP', 'status-terminada'],
  revisar: ['Lo revisa un Creator', 'status-proceso'],
  error: ['No se pudo leer', 'status-sugerida']
};
const SOURCE = { elegida: 'la que elegiste', imagenes: 'sacada de tus imágenes', logo: 'sacada de tu logo' };

export const fileSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// A file behind the token, shown as a blob URL (images) or downloaded.
async function authedBlob(path) {
  const res = await fetch(`${ANDRHO_API_URL}${path}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
  if (!res.ok) throw new Error('No pudimos abrir el archivo.');
  return res.blob();
}

export async function loadImage(img, path) {
  try {
    img.src = URL.createObjectURL(await authedBlob(path));
    img.hidden = false;
  } catch { img.remove(); }
}

export async function download(path, name) {
  const url = URL.createObjectURL(await authedBlob(path));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function uploadAsset(kind, file) {
  const body = new FormData();
  body.append('kind', kind);
  body.append('file', file, file.name);
  const res = await fetch(`${ANDRHO_API_URL}/account/assets`, { method: 'POST', headers: { Authorization: `Bearer ${getAccessToken()}` }, body });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'No pudimos subir el archivo.');
  return data.asset;
}

// What AndRho understood of a data file, table by table.
export function dataTables(asset, forCreator) {
  const meta = asset.meta || {};
  if (meta.error && !(meta.tables || []).length) return `<p class="hint" style="margin:4px 0 0">${esc(meta.error)}</p>`;
  const reports = Object.fromEntries((meta.reports || []).map((r) => [r.table, r]));
  const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  return `<ul class="kit-tables">${(meta.tables || []).map((t) => {
    const r = reports[t.table];
    const what = t.kind ? `${esc(t.label)}${forCreator ? ` <span class="mono hint">${esc(t.model)}</span>` : ''}` : 'Sin identificar';
    const issues = (r && r.report.issues) || [];
    const done = r ? ` · en tu ERP: ${n(r.report.created, 'nuevo', 'nuevos')}, ${n(r.report.updated, 'actualizado', 'actualizados')}${issues.length ? `, ${n(issues.length, 'fila quedó fuera', 'filas quedaron fuera')}` : ''}` : '';
    const why = forCreator && issues.length ? `<br><span class="hint">${issues.slice(0, 10).map((i) => `fila ${i.row}: ${esc(i.message)}`).join(' · ')}${issues.length > 10 ? ' …' : ''}</span>` : '';
    const cols = forCreator && t.columns ? Object.entries(t.columns).map(([c, f]) => `${esc(c)} → ${esc((t.fields || {})[f] || f)}`).join(' · ') : '';
    return `<li><strong>${esc(t.table)}</strong>: ${n(t.rows, 'fila', 'filas')} de ${what}${forCreator ? ` <span class="badge badge-muted">confianza ${esc(t.confidence)}</span>` : ''}${done}
      ${cols ? `<br><span class="hint">${cols}</span>` : ''}${why}
      ${forCreator && t.unmapped && t.unmapped.length ? `<br><span class="hint">Sin campo: ${t.unmapped.map(esc).join(', ')}</span>` : ''}</li>`;
  }).join('')}</ul>`;
}

export function swatches(palette) {
  return `<div class="kit-swatches">${(palette || []).map((c) => `<span class="kit-swatch" style="background:${esc(c)}" title="${esc(c)}"></span><span class="mono kit-hex">${esc(c)}</span>`).join('')}</div>`;
}

function pending(label) { return `<span class="status-pill status-sugerida">${esc(label)}</span>`; }

// The card in Configuración.
export function kitCard(data, canEdit) {
  if (!data) return '';
  const { assets = [], kit = {}, palette = [], palette_source: source = '' } = data;
  const logos = assets.filter((a) => a.kind === 'logo');
  const images = assets.filter((a) => a.kind === 'brand_image');
  const files = assets.filter((a) => a.kind === 'data');
  const logo = logos[logos.length - 1];
  const upload = (kind, label, accept, multiple) => canEdit
    ? `<label class="copy-btn kit-upload">${esc(label)}<input type="file" hidden data-kit-upload="${kind}" accept="${accept}" ${multiple ? 'multiple' : ''}></label>`
    : '';
  const ask = (field, label) => canEdit ? `<button type="button" class="copy-btn" data-kit-ask="${field}">${esc(label)}</button>` : '';
  return `
    <div class="card" id="kit">
      <h2>Tu marca y tus datos</h2>
      <p class="hint" style="margin:0 0 14px">Lo que nos diste al registrarte y lo que quedó pendiente. Los Creators lo reciben con sus tareas.</p>
      <div class="kit-grid">
        <section>
          <h3>Logo ${!logo && kit.logo !== 'crear' ? pending('Pendiente') : ''}</h3>
          ${logo ? `<img class="kit-logo" alt="Tu logo" hidden data-kit-img="${esc(logo.id)}">` : ''}
          <p class="hint">${logo ? `Subido el ${fmtDate(logo.created_at)}.` : kit.logo === 'crear' ? 'Un Creator te lo está diseñando.' : 'Todavía no lo subes.'}</p>
          <div class="kit-actions">${upload('logo', logo ? 'Cambiar logo' : 'Subir logo', 'image/png,image/jpeg,image/webp', false)}${!logo && kit.logo !== 'crear' ? ask('logo', 'Que me lo diseñen') : ''}</div>
        </section>
        <section>
          <h3>Colores ${!palette.length && kit.colors !== 'crear' ? pending('Pendiente') : ''}</h3>
          ${palette.length ? `${swatches(palette)}<p class="hint">Paleta ${esc(SOURCE[source] || '')}.</p>` : `<p class="hint">${kit.colors === 'crear' ? 'Un Creator te está proponiendo una paleta.' : 'Sube imágenes de tu marca y sacamos sus colores.'}</p>`}
          ${images.length ? `<div class="kit-thumbs">${images.map((a) => `<img alt="${esc(a.filename)}" hidden data-kit-img="${esc(a.id)}">`).join('')}</div>` : ''}
          <div class="kit-actions">${upload('brand_image', 'Subir imágenes', IMAGE_ACCEPT, true)}${!palette.length && kit.colors !== 'crear' ? ask('colors', 'Que me los propongan') : ''}</div>
        </section>
        <section>
          <h3>Tus datos ${!files.length && kit.data === 'despues' ? pending('Pendiente') : ''}</h3>
          ${files.length ? files.map((a) => {
            const [label, cls] = DATA_STATUS[a.status] || [a.status, ''];
            return `<div class="kit-file"><div><strong>${esc(a.filename)}</strong> <span class="hint">${fileSize(a.size)}</span></div><span class="status-pill ${cls}">${esc(label)}</span>${dataTables(a, false)}</div>`;
          }).join('') : `<p class="hint">${kit.data === 'cero' ? 'Empezaste de cero. Si encuentras datos viejos, súbelos aquí.' : 'Excel, CSV, JSON o un respaldo SQL: AndRho los acomoda en tu ERP.'}</p>`}
          <div class="kit-actions">${upload('data', 'Subir datos', DATA_ACCEPT, true)}</div>
        </section>
      </div>
      <p class="hint" id="kitStatus" role="status" style="margin:10px 0 0"></p>
    </div>`;
}

// Wires the card; rerender() reloads the view after a change.
export function wireKit(el, data, rerender) {
  const card = el.querySelector('#kit');
  if (!card) return;
  const status = card.querySelector('#kitStatus');
  card.querySelectorAll('[data-kit-img]').forEach((img) => loadImage(img, `/account/assets/${encodeURIComponent(img.dataset.kitImg)}/file`));
  card.querySelectorAll('[data-kit-upload]').forEach((input) => input.addEventListener('change', async () => {
    const files = [...input.files];
    for (const [i, f] of files.entries()) {
      status.textContent = `Subiendo ${f.name} (${i + 1} de ${files.length})…`;
      try { await uploadAsset(input.dataset.kitUpload, f); } catch (err) { status.textContent = `${f.name}: ${err.message}`; return; }
    }
    rerender();
  }));
  card.querySelectorAll('[data-kit-ask]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    const kit = Object.assign({}, data.kit, { [b.dataset.kitAsk]: 'crear' });
    try {
      await andrhoApi('/account/kit', { method: 'PUT', body: JSON.stringify(kit) });
      rerender();
    } catch (err) { status.textContent = err.message; b.disabled = false; }
  }));
}
