// The AndRho panel on the right of every section: on top, what AndRho read
// from the section's data (summary, comments, notifications); below, the
// suggestions it makes, to accept or reject. Opening a section runs its
// analysis on andrho-api (POST /insights/:section: extraction, statistics,
// AI translation), which also files new suggestions.
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
  await renderSummary(section, my);
  await renderSuggestions(section, my);
}

const SEV_ICON = { alerta: '!', buena: '↑', info: '·' };

async function renderSummary(section, my, refresh) {
  const top = document.getElementById('insightsTop');
  let d;
  try {
    d = await andrhoApi(`/insights/${encodeURIComponent(section)}${refresh ? '?refresh=1' : ''}`, { method: 'POST' });
  } catch (err) {
    if (my === token && top) top.innerHTML = `<div class="insight-summary"><p>No pudimos analizar esta sección ahora.</p></div>`;
    return;
  }
  if (my !== token || !top) return;
  const i = d.insights;
  const list = (kind, title) => {
    const items = i.findings.filter((f) => f.kind === kind);
    return items.length ? `<p class="insights-label">${title}</p><ul class="insight-list">${items.map((f) => `
      <li class="insight-${f.severity}"><span class="insight-dot" aria-hidden="true">${SEV_ICON[f.severity] || '·'}</span><span>${esc(f.text)}</span></li>`).join('')}</ul>` : '';
  };
  top.innerHTML = `
    <div class="insight-summary"><p>${esc(i.summary)}</p></div>
    ${list('notificacion', 'Notificaciones')}
    ${list('comentario', 'Comentarios')}
    ${d.quota_reached ? '<p class="insight-upsell">AndRho tiene más sugerencias para ti, pero tu plan llegó a su límite del mes. <a href="#/configuracion">Ver planes</a></p>' : ''}
    <p class="insights-meta">${i.source === 'ia' ? 'Explicado por IA' : 'Calculado'} · ${fmtDate(i.generated_at)}
      <button type="button" class="link-btn" id="insightsRefresh">Actualizar</button></p>
  `;
  top.querySelector('#insightsRefresh').addEventListener('click', async () => {
    top.style.opacity = '0.5';
    await renderSummary(section, token, true);
    top.style.opacity = '';
    await renderSuggestions(section, token);
  });
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
