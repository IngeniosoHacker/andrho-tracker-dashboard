// The AndRho panel on the right of every section: on top, what AndRho read
// from the section's data (summary, comments, notifications); below, the
// suggestions it makes, to accept or reject. Opening a section runs its
// analysis on andrho-api (POST /insights/:section: extraction, statistics,
// AI translation), which also files new suggestions.
import { andrhoApi, esc, fmtDate, roleAtLeast, openDrawer, chart, cssVar } from './core.js';

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
        ${assignmentLine(s)}
        ${s.report ? `<p class="suggestion-report">${esc(s.report)}</p>` : ''}
        <p class="hint">${fmtDate(s.created_at)}
          ${s.explain ? ` · <button type="button" class="link-btn" data-why="${esc(s.id)}">¿Por qué?</button>` : ''}</p>
        ${canAct ? `
          <div class="suggestion-actions" data-id="${esc(s.id)}">
            ${s.status === 'sugerida' ? `<button type="button" class="accept" data-status="aceptada_en_proceso">${esc((s.action && s.action.label) || 'Aceptar')}</button>` : ''}
            ${s.status === 'aceptada_en_proceso' ? '<button type="button" data-status="terminada">Marcar terminada</button>' : ''}
            ${s.status === 'sugerida' || s.status === 'aceptada_en_proceso' ? '<button type="button" class="danger" data-status="rechazada">Rechazar</button>' : ''}
          </div>` : ''}
      </article>
    `).join('') : '<p class="empty-state">Sin sugerencias para esta sección todavía.</p>'}
  `;

  box.querySelectorAll('[data-why]').forEach((btn) => btn.addEventListener('click', () => {
    openWhy(suggestions.find((x) => x.id === btn.dataset.why));
  }));

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

// Who is doing an accepted suggestion, in the owner's words.
function assignmentLine(s) {
  if (s.status !== 'aceptada_en_proceso' || !s.assignment) return '';
  const a = s.assignment;
  if (a.kind === 'andrho') return '<p class="hint">⚙ AndRho lo está haciendo por ti; te avisamos aquí cuando esté listo.</p>';
  if (a.creator_name) return `<p class="hint">✦ ${esc(a.creator_name)}, de los Creators de AndRho, ya está trabajando en esto.</p>`;
  return '<p class="hint">✦ En la lista de los Creators de AndRho: alguien la toma muy pronto.</p>';
}

const CONFIDENCE = {
  alta: ['Comprobado', 'seo-pill-ok'],
  media: ['Patrón claro', 'seo-pill-warn'],
  baja: ['Para vigilar', 'cannibal-pill-baja']
};

// "¿Por qué?": the finding behind a suggestion as one picture, for the owner.
function openWhy(s) {
  if (!s || !s.explain) return;
  const x = s.explain;
  const [confLabel, confCls] = CONFIDENCE[x.confidence] || CONFIDENCE.media;
  const box = openDrawer(`
    <p class="eyebrow">¿Por qué te lo sugerimos?</p>
    <h1 class="drawer-title">${esc(s.title)}</h1>
    <p class="drawer-text" style="font-size:16px;line-height:1.5"><strong>${esc(x.headline)}</strong></p>
    ${x.kind === 'pasos' ? stepsPicture(s) : '<div class="chart-box" style="height:260px"><canvas id="whyChart"></canvas></div>'}
    ${x.lower_is_better ? `<p class="hint" style="margin:6px 0 0">${x.kind === 'tendencia'
      ? 'Más arriba en la gráfica es mejor: el lugar 1 es el primero que se ve en Google.'
      : 'Un lugar más bajo es mejor: el 1 es el primero que se ve en Google.'}</p>` : ''}
    <div class="card" style="margin-top:18px;padding:16px">
      <p class="eyebrow" style="margin:0 0 6px">Qué significa para tu negocio</p>
      <p style="margin:0;line-height:1.55">${esc(x.takeaway)}</p>
    </div>
    <p style="margin:16px 0 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span class="status-pill ${confCls}">${confLabel}</span>
      <span class="hint">${esc(x.confidence_text || '')}</span>
    </p>
    <div class="card" style="margin-top:18px;padding:16px">
      <p class="eyebrow" style="margin:0 0 6px">Lo que proponemos</p>
      <p style="margin:0;line-height:1.55">${esc(s.body)}</p>
      <p class="hint" style="margin:8px 0 0">${s.action && s.action.type === 'erp_install'
        ? 'Si aceptas, AndRho lo hace por ti en tu ERP: no tienes que instalar ni configurar nada.'
        : 'Si aceptas, un Creator de AndRho se encarga y te avisamos aquí cuando esté listo.'}</p>
    </div>
  `);
  const canvas = box.querySelector('#whyChart');
  if (!canvas) return;
  const hl = cssVar('--accent-ai');
  const base = cssVar('--accent-human-dim');
  const ticks = { color: cssVar('--text-tertiary'), font: { family: 'Inter', size: 12 } };
  if (x.kind === 'tendencia') {
    const pts = x.series || [];
    chart('why', canvas, {
      type: 'line',
      data: { labels: pts.map((p) => p.label), datasets: [{ data: pts.map((p) => p.value), borderColor: hl, backgroundColor: hl, tension: 0.3, pointRadius: 2, fill: false }] },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: {
          y: { reverse: !!x.lower_is_better, ticks, grid: { color: cssVar('--border-soft') }, title: { display: !!x.unit, text: x.unit, color: cssVar('--text-tertiary') } },
          x: { ticks: Object.assign({ maxTicksLimit: 8 }, ticks), grid: { display: false } }
        }
      }
    });
    return;
  }
  const bars = x.bars || [];
  if (x.kind === 'proporcion' && bars.length === 2) {
    chart('why', canvas, {
      type: 'doughnut',
      data: { labels: bars.map((b) => b.label), datasets: [{ data: bars.map((b) => b.value), backgroundColor: bars.map((b) => (b.highlight ? hl : base)), borderColor: cssVar('--bg-elevated'), borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { color: cssVar('--text-secondary'), font: { family: 'Inter', size: 12 }, boxWidth: 12 } } } }
    });
    return;
  }
  chart('why', canvas, {
    type: 'bar',
    data: { labels: bars.map((b) => b.label), datasets: [{ data: bars.map((b) => b.value), backgroundColor: bars.map((b) => (b.highlight ? hl : base)), borderRadius: 6 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.formattedValue} ${x.unit || ''}` } } },
      scales: {
        x: { beginAtZero: true, ticks, grid: { color: cssVar('--border-soft') }, title: { display: !!x.unit, text: x.unit, color: cssVar('--text-tertiary') } },
        y: { ticks, grid: { display: false } }
      }
    }
  });
}

// For "AndRho does it for you" suggestions: what happens, in three steps.
function stepsPicture(s) {
  const steps = [
    ['1', 'Aceptas', 'Un clic en esta sugerencia.'],
    ['2', 'AndRho lo hace', s.action && s.action.type === 'erp_install' ? 'Activa lo necesario en tu ERP, sin que toques nada.' : 'Un Creator de AndRho se encarga.'],
    ['3', 'Listo', 'Esta sección empieza a llenarse sola y AndRho te avisa qué hacer.']
  ];
  return `<ol class="cannibal-list" style="list-style:none;padding:0;margin:8px 0 0">${steps.map(([n, t, d]) => `
    <li class="cannibal" style="display:flex;gap:12px;align-items:flex-start">
      <span class="status-pill seo-pill-ok" style="font-size:13px">${n}</span>
      <div><strong>${t}</strong><p class="cannibal-fix" style="margin:2px 0 0">${d}</p></div>
    </li>`).join('')}</ol>`;
}
