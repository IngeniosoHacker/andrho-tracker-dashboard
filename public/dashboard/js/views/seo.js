// Web > Keywords / Posiciones / Competencia / Auditoría: the SEO tools
// ported from OpenSEO (keyword research, rank tracking, competitors and
// keyword gap, backlinks, site audit) on top of AndRho's own tracker data.
// Backend: src/routes/seo.js. Everything paid comes from DataForSEO and is
// cached server-side; the UI says so when a number isn't available.
import {
  siteApi, esc, fmtNum, fmtDate, cssVar, chart, openDrawer, closeDrawer, withPanel, emptyState, roleAtLeast
} from '../core.js';

const MARKETS = [
  [2320, 'Guatemala'], [2222, 'El Salvador'], [2340, 'Honduras'], [2558, 'Nicaragua'], [2188, 'Costa Rica'],
  [2591, 'Panamá'], [2484, 'México'], [2170, 'Colombia'], [2724, 'España'], [2840, 'Estados Unidos']
];
const INTENT = { informational: 'Informativa', commercial: 'Comparación', transactional: 'Compra', navigational: 'Marca' };
const CAT_CLASS = { cerca: 'seo-pill-ok', brecha: 'cannibal-pill-alta', rastreador: 'cannibal-pill-baja', nueva: 'seo-pill-warn' };

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const canEdit = () => roleAtLeast('editor');
const fmtPos = (p) => (p == null ? '<span class="hint">—</span>' : `#${p}`);

function difficultyLabel(d) {
  if (d == null) return '—';
  const word = d < 30 ? 'fácil' : d < 60 ? 'media' : 'difícil';
  return `${d} <span class="hint">${word}</span>`;
}

function delta(now, before) {
  if (now == null && before != null) return '<span class="trend down">salió</span>';
  if (now == null || before == null || now === before) return '';
  const up = now < before; // a smaller position is better
  return `<span class="trend ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${Math.abs(before - now)}</span>`;
}

// Errors the SEO API returns on purpose (no key, budget, no domain yet).
function seoProblem(err) {
  if (err.status === 409) return emptyState('Falta configurar tu dominio', 'Dinos qué dominio analizar y en qué país, y AndRho trae tus posiciones, tu competencia y las búsquedas que te conviene atacar.', '⌕');
  if (err.status === 503) return emptyState('Investigación de keywords no disponible', 'Esta instalación de AndRho no tiene conectado DataForSEO todavía (variable DATAFORSEO_API_KEY). Las sugerencias de la pestaña Keywords siguen funcionando con los datos de tu rastreador.', '⚙');
  if (err.status === 429 || err.status === 402) return emptyState('Llegamos al límite de este mes', esc(err.message), '⏳');
  return null;
}

async function trackKeywords(keywords, source, targetPath, btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Agregando…'; }
  try {
    await siteApi('/seo/keywords', json('POST', { keywords, source, targetPath }));
    if (btn) { btn.textContent = '✓ Siguiendo'; btn.classList.add('copied'); }
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Seguir'; }
    alert(err.message);
  }
}

function trackButton(keyword, tracked, source, targetPath) {
  if (tracked) return '<span class="badge badge-human">✓ siguiendo</span>';
  if (!canEdit()) return '';
  return `<button type="button" class="copy-btn" data-track="${esc(keyword)}" data-source="${source}" ${targetPath ? `data-path="${esc(targetPath)}"` : ''}>Seguir</button>`;
}

function wireTrackButtons(root) {
  root.querySelectorAll('[data-track]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    trackKeywords([b.dataset.track], b.dataset.source, b.dataset.path || null, b);
  }));
}

// ---------------------------------------------------------------------
// Settings drawer (domain, market, competitors)
// ---------------------------------------------------------------------
export async function openSeoSettings(onSaved) {
  const box = openDrawer();
  const d = await siteApi('/seo/settings');
  const s = d.settings || { domain: d.suggestedDomain || '', locationCode: 2320, languageCode: 'es', device: 'mobile', competitors: [] };
  box.innerHTML = `
    <p class="eyebrow">SEO</p>
    <h1 class="drawer-title">Qué analizamos</h1>
    <p class="drawer-text">El dominio de tu sitio, el país donde quieres aparecer en Google y, si los conoces, tus competidores.
      Si no pones competidores, AndRho detecta quién compite contigo por las mismas búsquedas.</p>
    <form class="invite-form" id="seoSettingsForm">
      <label>Dominio <input name="domain" required placeholder="miempresa.com" value="${esc(s.domain)}" /></label>
      <div class="form-row">
        <label>País
          <select name="locationCode">${MARKETS.map(([c, n]) => `<option value="${c}" ${c === s.locationCode ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
        <label>Idioma
          <select name="languageCode">${[['es', 'Español'], ['en', 'Inglés']].map(([c, n]) => `<option value="${c}" ${c === s.languageCode ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
      </div>
      <label>Dispositivo para medir posiciones
        <select name="device"><option value="mobile" ${s.device === 'mobile' ? 'selected' : ''}>Celular</option><option value="desktop" ${s.device === 'desktop' ? 'selected' : ''}>Computadora</option></select>
      </label>
      <label>Competidores <span class="hint">uno por línea, hasta 5</span>
        <textarea name="competitors" rows="4" placeholder="competidor.com">${esc((s.competitors || []).join('\n'))}</textarea>
      </label>
      <p class="form-error" id="seoSettingsError" hidden></p>
      <div class="form-actions"><button type="submit" class="primary-btn">Guardar</button></div>
    </form>
    <p class="drawer-note">Gasto de datos SEO este mes: US$${d.spend.monthUsd.toFixed(2)} de US$${Number(d.spend.budgetUsd).toFixed(2)}.
      ${d.configured ? '' : 'DataForSEO aún no está conectado en esta instalación.'}</p>
  `;
  const form = box.querySelector('#seoSettingsForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const err = box.querySelector('#seoSettingsError');
    err.hidden = true;
    try {
      await siteApi('/seo/settings', json('PUT', {
        domain: f.get('domain'),
        locationCode: Number(f.get('locationCode')),
        languageCode: f.get('languageCode'),
        device: f.get('device'),
        competitors: String(f.get('competitors') || '').split(/[\n,]+/).map((x) => x.trim()).filter(Boolean)
      }));
      closeDrawer();
      if (onSaved) onSaved();
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });
}

function settingsButton() {
  return canEdit() ? '<button type="button" class="copy-btn" data-seo-settings>Ajustes SEO</button>' : '';
}
function wireSettings(root, panel, render) {
  const b = root.querySelector('[data-seo-settings]');
  if (b) b.addEventListener('click', () => openSeoSettings(() => withPanel(panel, render)));
}

// ---------------------------------------------------------------------
// Keywords: suggestions (the pipeline) + free research
// ---------------------------------------------------------------------
let catFilter = '';

export async function renderKeywords(panel, refresh) {
  const d = await siteApi(`/seo/suggestions${refresh === true ? '?refresh=1' : ''}`);
  const cats = [['', 'Todas'], ['cerca', 'Casi en primera página'], ['brecha', 'Tu competencia la tiene'], ['rastreador', 'Ya te buscan así'], ['nueva', 'Contenido nuevo']];
  const list = d.suggestions.filter((s) => !catFilter || s.category === catFilter);
  panel.innerHTML = `
    <div class="card">
      <div class="seo-audit-head" style="margin-bottom:6px">
        <div>
          <h2 style="margin:0">Keywords que te conviene atacar</h2>
          <p class="kpi-sub" style="margin:4px 0 0">${d.domain ? `<span class="mono">${esc(d.domain)}</span> · ` : ''}calculado ${fmtDate(d.generatedAt)} con tu contenido, tus visitas${d.configured && d.domain ? ', Google y tu competencia' : ''}</p>
        </div>
        <span style="margin-left:auto;display:flex;gap:8px">${settingsButton()}<button type="button" class="copy-btn" data-refresh>Recalcular</button></span>
      </div>
      ${d.notes.length ? `<ul class="issue-list">${d.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <p class="keyword-cloud" style="margin-top:12px">
        ${cats.map(([k, l]) => `<button type="button" class="tab ${catFilter === k ? 'active' : ''}" data-cat="${k}">${l}<span class="tab-count">${k ? d.counts[k] || 0 : d.suggestions.length}</span></button>`).join('')}
      </p>
      ${list.length ? `<ul class="cannibal-list">${list.slice(0, 40).map(suggestionCard).join('')}</ul>`
        : '<p class="empty-state">Todavía no hay suficiente contenido o visitas para sugerir keywords en esta categoría.</p>'}
    </div>

    ${d.untargetedPages.length ? `
    <div class="card">
      <h2>Páginas con visitas que no apuntan a ninguna búsqueda <span class="hint">su título no contiene ninguna keyword sugerida</span></h2>
      <table>
        <thead><tr><th>Página</th><th>Título actual</th><th>Frases que más repite</th><th class="num">Visitas</th></tr></thead>
        <tbody>${d.untargetedPages.map((p) => `
          <tr><td class="mono">${esc(p.path)}</td><td>${esc(p.title || '(sin título)')}</td>
              <td>${p.candidates.map((c) => `<span class="badge badge-muted">${esc(c)}</span>`).join(' ') || '—'}</td>
              <td class="num">${fmtNum(p.pageviews)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div class="card" id="researchCard">
      <h2>Investigar una keyword <span class="hint">volumen, dificultad e ideas relacionadas en Google</span></h2>
      <form class="goal-form" id="researchForm">
        <input type="search" id="researchInput" style="flex:1" placeholder="ej. software para restaurantes" aria-label="Keyword a investigar" />
        <button type="submit">Investigar</button>
      </form>
      <div id="researchResults"></div>
    </div>
  `;
  panel.querySelector('[data-refresh]').addEventListener('click', () => withPanel(panel, (p) => renderKeywords(p, true)));
  panel.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { catFilter = b.dataset.cat; renderKeywords(panel); }));
  wireSettings(panel, panel, renderKeywords);
  wireTrackButtons(panel);
  panel.querySelector('#researchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    research(panel.querySelector('#researchInput').value, panel.querySelector('#researchResults'));
  });
}

function suggestionCard(s) {
  const metrics = [
    s.searchVolume != null ? `<span>⌕ ${fmtNum(s.searchVolume)}/mes</span>` : '',
    s.difficulty != null ? `<span>◔ dificultad ${s.difficulty}</span>` : '',
    s.position ? `<span>↕ hoy #${s.position}</span>` : '',
    s.intent ? `<span>◎ ${INTENT[s.intent] || s.intent}</span>` : '',
    s.estimatedVisits ? `<span>↗ +${fmtNum(s.estimatedVisits)} visitas/mes posibles</span>` : ''
  ].filter(Boolean).join('');
  return `
    <li class="cannibal">
      <div class="cannibal-head">
        <span class="status-pill ${CAT_CLASS[s.category] || ''}">${esc(s.categoryLabel)}</span>
        <strong>${esc(s.keyword)}</strong>
        ${s.targetPath ? `<span class="mono hint">→ ${esc(s.targetPath)}</span>` : '<span class="hint">página nueva</span>'}
        <span style="margin-left:auto">${trackButton(s.keyword, s.tracked, 'sugerida', s.targetPath)}</span>
      </div>
      ${metrics ? `<div class="path-step-stats" style="margin-top:6px">${metrics}</div>` : ''}
      ${s.reasons.length ? `<p class="cannibal-fix">${s.reasons.map(esc).join(' ')}</p>` : ''}
      <ul class="cannibal-pages">${s.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    </li>`;
}

async function research(q, box) {
  q = String(q || '').trim();
  if (!q) return;
  box.innerHTML = '<p class="loading-state">consultando Google…</p>';
  let d;
  try {
    d = await siteApi(`/seo/research?q=${encodeURIComponent(q)}`);
  } catch (err) {
    const p = seoProblem(err);
    box.innerHTML = p || `<p class="empty-state">${esc(err.message)}</p>`;
    return;
  }
  if (!d.keywords.length) { box.innerHTML = '<p class="empty-state">Google no tiene datos para esa frase en tu país.</p>'; return; }
  box.innerHTML = `
    <table>
      <thead><tr><th>Keyword</th><th>Intención</th><th class="num">Búsquedas/mes</th><th class="num">Dificultad</th><th class="num">CPC</th><th></th></tr></thead>
      <tbody>${d.keywords.slice(0, 60).map((k) => `
        <tr><td>${esc(k.keyword)}</td><td>${esc(INTENT[k.intent] || '—')}</td><td class="num">${fmtNum(k.searchVolume)}</td>
            <td class="num">${difficultyLabel(k.difficulty)}</td><td class="num">${k.cpc != null ? 'US$' + Number(k.cpc).toFixed(2) : '—'}</td>
            <td class="num">${trackButton(k.keyword, k.tracked, 'manual')}</td></tr>`).join('')}
      </tbody>
    </table>`;
  wireTrackButtons(box);
}

// ---------------------------------------------------------------------
// Posiciones (rank tracking)
// ---------------------------------------------------------------------
function sparkline(points) {
  const ps = (points || []).filter((p) => p.p != null);
  if (ps.length < 2) return '';
  const w = 90, h = 24;
  const max = Math.max(...ps.map((p) => p.p)), min = Math.min(...ps.map((p) => p.p));
  const span = Math.max(1, max - min);
  // Position 1 at the top.
  const pts = ps.map((p, i) => `${((i / (ps.length - 1)) * w).toFixed(1)},${(((p.p - min) / span) * (h - 4) + 2).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="${cssVar('--accent-human')}" stroke-width="1.6" points="${pts}"/></svg>`;
}

export async function renderRanks(panel) {
  const d = await siteApi('/seo/keywords');
  const s = d.summary;
  panel.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">Keywords seguidas</p><p class="kpi-value">${fmtNum(s.tracked)}</p><p class="kpi-sub">${d.device === 'desktop' ? 'en computadora' : 'en celular'}, revisadas cada día</p></div>
      <div class="kpi-card"><p class="kpi-label">En el top 3</p><p class="kpi-value">${fmtNum(s.top3)}</p></div>
      <div class="kpi-card"><p class="kpi-label">En primera página</p><p class="kpi-value">${fmtNum(s.top10)}</p></div>
      <div class="kpi-card"><p class="kpi-label">Posición promedio</p><p class="kpi-value">${s.avgPosition ?? '—'}</p></div>
      <div class="kpi-card"><p class="kpi-label">Esta semana</p><p class="kpi-value"><span style="color:var(--accent-human)">▲${s.improved}</span> <span style="color:var(--accent-danger)">▼${s.declined}</span></p><p class="kpi-sub">subieron / bajaron</p></div>
    </div>
    ${!d.configured ? '<p class="empty-state">Las posiciones se miden con DataForSEO, que aún no está conectado en esta instalación.</p>' : ''}
    ${d.configured && !d.hasSettings ? `<p class="empty-state">Configura tu dominio para empezar a medir posiciones. ${settingsButton()}</p>` : ''}
    <div class="card">
      <div class="seo-audit-head" style="margin-bottom:10px">
        <h2 style="margin:0">Posiciones en Google <span class="hint">clic en una fila para ver su historia</span></h2>
        <span style="margin-left:auto">${d.hasSettings ? settingsButton() : ''}</span>
      </div>
      ${canEdit() ? `
      <form class="goal-form" id="addKwForm" style="margin:0 0 14px">
        <input id="addKwInput" style="flex:1" placeholder="agrega keywords separadas por coma" aria-label="Keywords a seguir" />
        <button type="submit">Seguir</button>
      </form>` : ''}
      ${d.keywords.length ? `
      <table>
        <thead><tr><th>Keyword</th><th class="num">Posición</th><th class="num">Mejor</th><th>Tendencia</th><th class="num">Búsquedas/mes</th><th>URL que aparece</th><th>Revisado</th><th></th></tr></thead>
        <tbody>${d.keywords.map((k) => `
          <tr class="row-clickable ${k.tracked ? '' : 'row-muted'}" data-kw="${k.id}" tabindex="0">
            <td>${esc(k.keyword)}${k.source === 'sugerida' ? ' <span class="badge badge-ai">sugerida</span>' : ''}</td>
            <td class="num">${k.checked_at ? fmtPos(k.position) : '<span class="hint">en cola</span>'} ${delta(k.position, k.prev_position)}</td>
            <td class="num">${fmtPos(k.best_position)}</td>
            <td>${sparkline(k.history)}</td>
            <td class="num">${fmtNum(k.search_volume)}</td>
            <td class="mono">${k.url ? esc(new URL(k.url).pathname) : '—'}</td>
            <td class="mono">${k.checked_at ? fmtDate(k.checked_at) : '—'}</td>
            <td class="num">${canEdit() ? `<button type="button" class="link-btn" data-del="${k.id}" aria-label="Dejar de seguir">quitar</button>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<p class="empty-state">Aún no sigues ninguna keyword. Agrégalas aquí o desde las sugerencias de la pestaña Keywords.</p>'}
    </div>
  `;
  wireSettings(panel, panel, renderRanks);
  const form = panel.querySelector('#addKwForm');
  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const list = panel.querySelector('#addKwInput').value.split(',').map((x) => x.trim()).filter(Boolean);
    if (!list.length) return;
    await trackKeywords(list, 'manual');
    withPanel(panel, renderRanks);
  });
  panel.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async (e) => {
    e.stopPropagation();
    await siteApi(`/seo/keywords/${b.dataset.del}`, { method: 'DELETE' });
    withPanel(panel, renderRanks);
  }));
  panel.querySelectorAll('[data-kw]').forEach((row) => {
    const open = () => openRankDrawer(d.keywords.find((k) => String(k.id) === row.dataset.kw));
    row.addEventListener('click', open);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
}

function openRankDrawer(k) {
  const box = openDrawer(`
    <p class="eyebrow">Posición en Google</p>
    <h1 class="drawer-title">${esc(k.keyword)}</h1>
    <dl class="detail-kv">
      <dt>Hoy</dt><dd>${k.position ? '#' + k.position : 'fuera del top 100'}</dd>
      <dt>Mejor posición</dt><dd>${k.best_position ? '#' + k.best_position : '—'}</dd>
      <dt>URL</dt><dd>${esc(k.url || '—')}</dd>
      <dt>Búsquedas/mes</dt><dd>${fmtNum(k.search_volume)}</dd>
      <dt>Dificultad</dt><dd>${difficultyLabel(k.difficulty)}</dd>
      <dt>Intención</dt><dd>${esc(INTENT[k.intent] || '—')}</dd>
      <dt>En la página de Google</dt><dd>${(k.serp_features || []).map((f) => `<span class="badge badge-muted">${esc(f)}</span>`).join(' ') || '—'}</dd>
    </dl>
    <div class="chart-box chart-box-short"><canvas id="rankChart"></canvas></div>
  `);
  const pts = (k.history || []).filter((p) => p.p != null);
  chart('rankHistory', box.querySelector('#rankChart'), {
    type: 'line',
    data: {
      labels: pts.map((p) => new Date(p.d).toLocaleDateString('es', { day: '2-digit', month: 'short' })),
      datasets: [{ data: pts.map((p) => p.p), borderColor: cssVar('--accent-human'), backgroundColor: cssVar('--accent-human'), tension: 0.25, pointRadius: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        y: { reverse: true, min: 1, ticks: { color: cssVar('--text-tertiary'), precision: 0 }, grid: { color: cssVar('--border-soft') } },
        x: { ticks: { color: cssVar('--text-tertiary') }, grid: { display: false } }
      }
    }
  });
}

// ---------------------------------------------------------------------
// Competencia (domain overview, competitors, keyword gap, backlinks)
// ---------------------------------------------------------------------
export async function renderCompetition(panel) {
  let d;
  try {
    d = await siteApi('/seo/competition');
  } catch (err) {
    const p = seoProblem(err);
    if (!p) throw err;
    panel.innerHTML = p + `<p style="text-align:center">${settingsButton()}</p>`;
    wireSettings(panel, panel, renderCompetition);
    return;
  }
  const o = d.overview || {};
  const b = d.backlinks || {};
  const rows = [Object.assign({ domain: d.domain, self: true }, o), ...d.comparison];
  panel.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">Keywords donde apareces</p><p class="kpi-value">${fmtNum(o.organicKeywords)}</p><p class="kpi-sub">${fmtNum(o.top10)} en primera página</p></div>
      <div class="kpi-card"><p class="kpi-label">Visitas estimadas desde Google</p><p class="kpi-value">${fmtNum(Math.round(o.organicTraffic || 0))}</p><p class="kpi-sub">al mes, según tus posiciones</p></div>
      <div class="kpi-card"><p class="kpi-label">Keywords nuevas / perdidas</p><p class="kpi-value"><span style="color:var(--accent-human)">+${fmtNum(o.newKeywords)}</span> <span style="color:var(--accent-danger)">−${fmtNum(o.lostKeywords)}</span></p></div>
      <div class="kpi-card"><p class="kpi-label">Sitios que te enlazan</p><p class="kpi-value">${fmtNum(b.referringDomains)}</p><p class="kpi-sub">${fmtNum(b.backlinks)} enlaces${b.rank != null ? ` · autoridad ${b.rank}` : ''}</p></div>
    </div>
    ${d.errors.length ? `<ul class="issue-list">${d.errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}

    <div class="card">
      <div class="seo-audit-head" style="margin-bottom:10px">
        <h2 style="margin:0">Tú contra tu competencia</h2>
        <span style="margin-left:auto">${settingsButton()}</span>
      </div>
      <table>
        <thead><tr><th>Dominio</th><th class="num">Keywords</th><th class="num">Top 3</th><th class="num">Top 10</th><th class="num">Visitas est./mes</th><th></th></tr></thead>
        <tbody>${rows.map((r) => `
          <tr ${r.self ? 'style="font-weight:600"' : ''}>
            <td class="mono">${esc(r.domain)}${r.self ? ' <span class="badge badge-human">tú</span>' : ''}</td>
            <td class="num">${fmtNum(r.organicKeywords)}</td><td class="num">${fmtNum(r.top3)}</td><td class="num">${fmtNum(r.top10)}</td>
            <td class="num">${fmtNum(r.organicTraffic != null ? Math.round(r.organicTraffic) : null)}</td>
            <td class="num">${r.self ? '' : `<button type="button" class="copy-btn" data-gap="${esc(r.domain)}">Ver brecha</button>`}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${d.competitors.length ? `<p class="kpi-sub" style="margin-top:12px">Detectados por Google: ${d.competitors.map((c) => `<button type="button" class="link-btn" data-gap="${esc(c.domain)}">${esc(c.domain)}</button> <span class="hint">(${fmtNum(c.intersections)} keywords en común)</span>`).join(' · ')}</p>` : ''}
    </div>

    <div class="card" id="gapCard" hidden></div>

    <div class="card">
      <h2>Sitios que te enlazan <span class="hint">los de más autoridad primero</span></h2>
      ${d.referringDomains.length ? `
      <table>
        <thead><tr><th>Dominio</th><th class="num">Autoridad</th><th class="num">Enlaces</th><th>Desde</th></tr></thead>
        <tbody>${d.referringDomains.map((r) => `<tr><td class="mono">${esc(r.domain)}</td><td class="num">${fmtNum(r.rank)}</td><td class="num">${fmtNum(r.backlinks)}</td><td class="mono">${r.firstSeen ? fmtDate(r.firstSeen) : '—'}</td></tr>`).join('')}</tbody>
      </table>` : '<p class="empty-state">Ningún sitio te enlaza todavía. Directorios locales, proveedores y prensa de tu zona son el primer paso.</p>'}
    </div>
  `;
  wireSettings(panel, panel, renderCompetition);
  panel.querySelectorAll('[data-gap]').forEach((btn) => btn.addEventListener('click', () => showGap(panel.querySelector('#gapCard'), btn.dataset.gap)));
}

async function showGap(card, competitor) {
  card.hidden = false;
  card.innerHTML = `<h2>Brecha con ${esc(competitor)}</h2><p class="loading-state">buscando keywords que tiene y tú no…</p>`;
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  let d;
  try {
    d = await siteApi(`/seo/gap?competitor=${encodeURIComponent(competitor)}`);
  } catch (err) {
    card.innerHTML = `<h2>Brecha con ${esc(competitor)}</h2><p class="empty-state">${esc(err.message)}</p>`;
    return;
  }
  card.innerHTML = `
    <h2>Brecha con ${esc(competitor)} <span class="hint">keywords donde aparece en el top 20 y tú no apareces</span></h2>
    ${d.keywords.length ? `
    <table>
      <thead><tr><th>Keyword</th><th class="num">Su posición</th><th class="num">Búsquedas/mes</th><th class="num">Dificultad</th><th>Su página</th><th></th></tr></thead>
      <tbody>${d.keywords.slice(0, 60).map((k) => `
        <tr><td>${esc(k.keyword)}</td><td class="num">#${k.competitorPosition ?? '—'}</td><td class="num">${fmtNum(k.searchVolume)}</td>
            <td class="num">${difficultyLabel(k.difficulty)}</td>
            <td class="mono">${k.competitorUrl ? esc(new URL(k.competitorUrl).pathname) : '—'}</td>
            <td class="num">${trackButton(k.keyword, false, 'sugerida')}</td></tr>`).join('')}
      </tbody>
    </table>` : '<p class="empty-state">No encontramos keywords suyas que te falten.</p>'}
  `;
  wireTrackButtons(card);
}

// ---------------------------------------------------------------------
// Auditoría (on-page, per tracked page)
// ---------------------------------------------------------------------
const ISSUE_LABEL = {
  title: 'Título', meta: 'Meta descripción', h1: 'Encabezado h1', words: 'Poco texto', canonical: 'Sin canónica',
  lang: 'Sin idioma', alt: 'Imágenes sin alt', schema: 'Sin datos estructurados', index: 'noindex'
};

export async function renderAudit(panel) {
  const d = await siteApi('/seo/pages');
  if (!d.pages.length) {
    panel.innerHTML = emptyState('Sin páginas para revisar', 'Cuando el rastreador registre visitas, aquí verás qué arreglar en cada página para que Google la entienda mejor.', '✎');
    return;
  }
  const label = { ok: 'Bien', warn: 'Mejorable', fail: 'Falta' };
  panel.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">Puntaje promedio</p><p class="kpi-value">${d.averageScore}<span class="hint">/100</span></p><p class="kpi-sub">${fmtNum(d.pages.length)} páginas revisadas</p></div>
      ${Object.entries(d.issues).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `
        <div class="kpi-card"><p class="kpi-label">${esc(ISSUE_LABEL[k] || k)}</p><p class="kpi-value">${fmtNum(n)}</p><p class="kpi-sub">páginas con este problema</p></div>`).join('')}
    </div>
    ${d.withoutSignals ? `<p class="kpi-sub">${fmtNum(d.withoutSignals)} páginas solo se revisaron por título y texto: las demás señales llegan con la versión nueva del rastreador en su próxima visita.</p>` : ''}
    <div class="card">
      <h2>Páginas <span class="hint">las peores primero · clic para ver qué arreglar</span></h2>
      <table>
        <thead><tr><th>Página</th><th class="num">Puntaje</th><th>Problemas</th><th class="num">Visitas</th><th class="num">Desde Google</th></tr></thead>
        <tbody>${d.pages.map((p, i) => `
          <tr class="row-clickable" data-page="${i}" tabindex="0">
            <td class="mono">${esc(p.path)}</td>
            <td class="num"><span class="status-pill ${p.score >= 80 ? 'seo-pill-ok' : p.score >= 50 ? 'seo-pill-warn' : 'seo-pill-fail'}">${p.score}</span></td>
            <td>${p.checks.filter((c) => c.status !== 'ok').map((c) => `<span class="badge ${c.status === 'fail' ? 'cannibal-pill-alta' : 'badge-muted'}">${esc(ISSUE_LABEL[c.key] || c.key)}</span>`).join(' ') || '<span class="hint">ninguno</span>'}</td>
            <td class="num">${fmtNum(p.pageviews)}</td><td class="num">${fmtNum(p.organicEntries)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
  panel.querySelectorAll('[data-page]').forEach((row) => {
    const open = () => {
      const p = d.pages[Number(row.dataset.page)];
      openDrawer(`
        <p class="eyebrow">Auditoría de página</p>
        <h1 class="drawer-title mono">${esc(p.path)}</h1>
        <p class="drawer-text">${esc(p.title || '(sin título)')} · puntaje ${p.score}/100</p>
        <ul class="seo-checks" style="grid-template-columns:1fr">${p.checks.map((c) => `
          <li class="seo-check seo-${c.status}">
            <span class="status-pill seo-pill-${c.status}">${label[c.status]}</span>
            <div><p class="seo-check-label">${esc(c.label)}</p>${c.fix ? `<p class="seo-check-fix">${esc(c.fix)}</p>` : ''}</div>
          </li>`).join('')}
        </ul>`);
    };
    row.addEventListener('click', open);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
}
