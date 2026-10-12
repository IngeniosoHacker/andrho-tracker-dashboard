// The AndRho panel on the right of every section: on top, what AndRho read
// from the section's data (summary, comments, notifications); below, the
// suggestions it makes, to accept or reject.
import { andrhoApi, esc, fmtDate, roleAtLeast } from './core.js';

const panel = () => document.getElementById('insights');

const STATUS_LABEL = {
  sugerida: 'Sugerida',
  aceptada_en_proceso: 'Aceptada · en proceso',
  terminada: 'Terminada',
  rechazada: 'Rechazada'
};
const STATUS_CLASS = {
  sugerida: 'status-sugerida',
  aceptada_en_proceso: 'status-proceso',
  terminada: 'status-terminada',
  rechazada: 'status-rechazada'
};

function quotaLabel(quota) {
  if (!quota) return '';
  if (quota.limit < 0) return '∞ sugerencias este mes';
  return `${Math.max(0, quota.remaining)} de ${quota.limit} sugerencias restantes este mes`;
}

// Each call bumps the token, so a slow response for a section the user
// already left never paints over the current one.
let token = 0;

export async function loadInsights(section, title) {
  const my = ++token;
  const el = panel();
  el.innerHTML = `
    <header class="insights-head">
      <button type="button" class="insights-close" aria-label="Cerrar panel de AndRho">✕</button>
      <p class="eyebrow">AndRho · ${esc(title)}</p>
      <h2>Lo que vemos</h2>
    </header>
    <div class="insights-top" id="insightsTop"><p class="loading-state">analizando…</p></div>
    <div class="insights-bottom">
      <h3>Sugerencias</h3>
      <div id="insightsSuggestions"><p class="loading-state">cargando…</p></div>
    </div>
  `;
  el.querySelector('.insights-close').addEventListener('click', () => document.body.classList.remove('insights-open'));
  await Promise.all([renderSummary(section, my), renderSuggestions(section, my)]);
}

async function renderSummary(section, my) {
  const top = document.getElementById('insightsTop');
  if (my !== token || !top) return;
  top.innerHTML = `
    <div class="insight-summary">
      <p>AndRho resume aquí lo más importante de esta sección cada vez que entras.</p>
    </div>
  `;
}

async function renderSuggestions(section, my) {
  let list, plan;
  try {
    [list, plan] = await Promise.all([
      andrhoApi(`/suggestions?section=${encodeURIComponent(section)}`),
      andrhoApi('/account/plan')
    ]);
  } catch (err) {
    const box = document.getElementById('insightsSuggestions');
    if (my === token && box) box.innerHTML = `<p class="empty-state">No pudimos cargar las sugerencias: ${esc(err.message)}</p>`;
    return;
  }
  const box = document.getElementById('insightsSuggestions');
  if (my !== token || !box) return;

  // Open suggestions first: those are the ones waiting for an answer.
  const order = { sugerida: 0, aceptada_en_proceso: 1, terminada: 2, rechazada: 3 };
  const suggestions = (list.suggestions || []).slice().sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  const quota = plan.suggestions_quota;
  const canAct = roleAtLeast('editor');

  box.innerHTML = `
    <p class="quota-label">${esc(quotaLabel(quota))}</p>
    ${suggestions.length ? suggestions.map((s) => `
      <article class="suggestion-card">
        <div class="suggestion-card-head">
          <strong>${esc(s.title)}</strong>
          <span class="status-pill ${STATUS_CLASS[s.status] || ''}">${esc(STATUS_LABEL[s.status] || s.status)}</span>
        </div>
        <p class="suggestion-body">${esc(s.body)}</p>
        ${s.report ? `<p class="suggestion-report">${esc(s.report)}</p>` : ''}
        <p class="hint">${fmtDate(s.created_at)}</p>
        ${canAct ? `
          <div class="suggestion-actions" data-id="${esc(s.id)}">
            ${s.status === 'sugerida' ? '<button type="button" class="accept" data-status="aceptada_en_proceso">Aceptar</button>' : ''}
            ${s.status === 'aceptada_en_proceso' ? '<button type="button" data-status="terminada">Marcar terminada</button>' : ''}
            ${s.status === 'sugerida' || s.status === 'aceptada_en_proceso' ? '<button type="button" class="danger" data-status="rechazada">Rechazar</button>' : ''}
          </div>` : ''}
      </article>
    `).join('') : '<p class="empty-state">Sin sugerencias para esta sección todavía.</p>'}
  `;

  box.querySelectorAll('.suggestion-actions button[data-status]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await andrhoApi(`/suggestions/${encodeURIComponent(btn.parentElement.dataset.id)}/status`, {
          method: 'PATCH', body: JSON.stringify({ status: btn.dataset.status })
        });
        await renderSuggestions(section, token);
      } catch (err) {
        btn.disabled = false;
        alert(err.message || 'No se pudo actualizar la sugerencia.');
      }
    });
  });
}
