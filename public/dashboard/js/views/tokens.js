// Tokens Usage (AndRho staff admins): AI tokens spent on development and by
// the WhatsApp integration, plus what the product itself uses (the
// Analyzer at signup, the AndRho panel's explanations). Development usage
// happens outside the product, so it's entered here by day.
import { andrhoApi, esc, fmtNum, fmtDate, cssVar, chart, withPanel } from '../core.js';

const SOURCES = {
  development: ['Desarrollo', '--accent-violet'],
  whatsapp: ['Integración de WhatsApp', '--accent-human'],
  analyzer: ['Analyzer (registro)', '--accent-ai'],
  insights: ['Panel de AndRho', '--accent-ai-dim']
};
const name = (s) => (SOURCES[s] || [s])[0];
const total = (g) => (g ? g.input_tokens + g.output_tokens : 0);

let days = 30;

async function render(el) {
  const d = await andrhoApi(`/admin/tokens?days=${days}`);
  const by = Object.fromEntries(d.by_source.map((g) => [g.key, g]));
  const all = d.by_source.reduce((n, g) => n + total(g), 0);
  const card = (key) => {
    const g = by[key];
    return `<div class="kpi-card"><p class="kpi-label">${esc(name(key))}</p><p class="kpi-value">${fmtNum(total(g))}</p>
      <p class="kpi-sub">${g ? `${fmtNum(g.input_tokens)} entrada · ${fmtNum(g.output_tokens)} salida · ${fmtNum(g.calls)} llamadas` : 'sin uso en el periodo'}</p></div>`;
  };
  el.innerHTML = `
    <div class="section-head">
      <p class="hint" style="margin:0">${fmtNum(all)} tokens en los últimos ${days} días.</p>
      <div class="head-actions">
        <select class="role-select" id="tokDays" aria-label="Periodo">
          ${[7, 30, 90, 365].map((n) => `<option value="${n}" ${n === days ? 'selected' : ''}>${n} días</option>`).join('')}
        </select>
        <button type="button" class="primary-btn" id="tokImport">+ Registrar uso</button>
      </div>
    </div>
    <div class="kpi-grid">${['development', 'whatsapp', 'analyzer', 'insights'].map(card).join('')}</div>
    <div class="card"><h2>Por día <span class="hint">tokens de entrada + salida</span></h2><div class="chart-box"><canvas id="chartTokens"></canvas></div></div>
    <div class="grid-2">
      <div class="card">
        <h2>Por modelo</h2>
        ${d.by_model.length ? `<table><thead><tr><th>Modelo</th><th class="num">Llamadas</th><th class="num">Entrada</th><th class="num">Salida</th></tr></thead><tbody>
          ${d.by_model.map((g) => `<tr><td class="mono">${esc(g.key)}</td><td class="num">${fmtNum(g.calls)}</td><td class="num">${fmtNum(g.input_tokens)}</td><td class="num">${fmtNum(g.output_tokens)}</td></tr>`).join('')}
        </tbody></table>` : '<p class="empty-state">Sin uso todavía</p>'}
      </div>
      <div class="card">
        <h2>Cuentas que más usan</h2>
        ${d.accounts.length ? `<table><thead><tr><th>Cuenta</th><th class="num">Llamadas</th><th class="num">Tokens</th></tr></thead><tbody>
          ${d.accounts.map((g) => `<tr><td>${esc(g.key)}</td><td class="num">${fmtNum(g.calls)}</td><td class="num">${fmtNum(total(g))}</td></tr>`).join('')}
        </tbody></table>` : '<p class="empty-state">Ninguna cuenta ha usado IA todavía</p>'}
      </div>
    </div>
    <div class="card">
      <h2>Últimos registros</h2>
      ${d.recent.length ? `<table><thead><tr><th>Cuándo</th><th>Uso</th><th>Modelo</th><th class="num">Entrada</th><th class="num">Salida</th><th>Nota</th></tr></thead><tbody>
        ${d.recent.map((u) => `<tr><td class="mono">${fmtDate(u.created_at)}</td><td>${esc(name(u.source))}</td><td class="mono">${esc(u.model)}</td><td class="num">${fmtNum(u.input_tokens)}</td><td class="num">${fmtNum(u.output_tokens)}</td><td>${esc(u.note || '')}</td></tr>`).join('')}
      </tbody></table>` : '<p class="empty-state">Sin registros</p>'}
    </div>
  `;

  const dayList = [...new Set(d.daily.map((x) => x.day))];
  const sources = [...new Set(d.daily.map((x) => x.source))];
  chart('tokens', el.querySelector('#chartTokens'), {
    type: 'bar',
    data: {
      labels: dayList.map((x) => x.slice(5)),
      datasets: sources.map((s) => ({
        label: name(s),
        data: dayList.map((day) => (d.daily.find((x) => x.day === day && x.source === s) || {}).tokens || 0),
        backgroundColor: cssVar((SOURCES[s] || [])[1] || '--border'),
        borderRadius: 3
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'JetBrains Mono', size: 11 } } } },
      scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } }
    }
  });

  el.querySelector('#tokDays').addEventListener('change', (e) => { days = Number(e.target.value); withPanel(el, render); });
  el.querySelector('#tokImport').addEventListener('click', () => openImport(el));
}

// Development (or WhatsApp) usage entered by hand, one line per day:
// "2026-10-11, claude-opus-5-5, 120000, 30000, nota".
function openImport(el) {
  const dialog = document.createElement('div');
  dialog.className = 'card import-card';
  dialog.innerHTML = `
    <h2>Registrar uso de tokens</h2>
    <form class="invite-form" id="tokForm">
      <label>Uso
        <select name="source"><option value="development">Desarrollo</option><option value="whatsapp">Integración de WhatsApp</option></select>
      </label>
      <label>Un día por línea: fecha, modelo, tokens de entrada, tokens de salida, nota
        <textarea name="lines" rows="5" required placeholder="2026-10-11, claude-opus-5-5, 120000, 30000, Claude Code: dashboard"></textarea>
      </label>
      <p class="form-error" hidden></p>
      <button type="submit">Registrar</button>
    </form>`;
  el.prepend(dialog);
  const form = dialog.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = form.querySelector('.form-error');
    const entries = form.lines.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [date, model, input, output, ...note] = l.split(',').map((x) => x.trim());
      return { date, model, input_tokens: Number(input) || 0, output_tokens: Number(output) || 0, note: note.join(', ') };
    });
    try {
      await andrhoApi('/admin/tokens', { method: 'POST', body: JSON.stringify({ source: form.source.value, entries }) });
      withPanel(el, render);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });
}

export default {
  title: 'Tokens Usage',
  hint: 'tokens de IA usados en desarrollo, por WhatsApp y por el producto',
  render
};
