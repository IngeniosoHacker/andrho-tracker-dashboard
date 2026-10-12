// Web > Artículos: how the site's articles perform (reading, scroll, search
// queries, AI reach, cannibalization) and the editor to write or upload new
// ones. Articles live in andrho-api (/articles); the numbers come from the
// tracker (POST /api/sites/:siteId/content-performance).
import {
  andrhoApi, siteApi, esc, fmtMs, fmtNum, fmtDate, cssVar, chart, barChartOptions,
  openDrawer, closeDrawer, roleAtLeast, withPanel
} from '../core.js';
import { markdownToBlocks, parseFrontMatter, readingMinutes } from '../markdown.js';

const articlePath = (a) => a.path || `/articulos/${a.slug}.html`;

function trend(now, before) {
  if (!before) return now ? '<span class="trend up">nuevo</span>' : '';
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return '<span class="trend">=</span>';
  return `<span class="trend ${pct > 0 ? 'up' : 'down'}">${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}%</span>`;
}

const STATUS = { publicado: ['Publicado', 'status-terminada'], borrador: ['Borrador', 'status-sugerida'] };
const statusPill = (s) => `<span class="status-pill ${(STATUS[s] || [])[1] || ''}">${esc((STATUS[s] || [s])[0])}</span>`;

let state = { articles: [], perf: new Map(), cannibalization: [] };

export async function renderArticles(panel) {
  const { articles } = await andrhoApi('/articles');
  let perf = { articles: [], cannibalization: [] };
  if (articles.length) {
    perf = await siteApi('/content-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles: articles.map((a) => ({ path: articlePath(a), keywords: a.keywords })) })
    });
  }
  state = { articles, perf: new Map(perf.articles.map((p) => [p.path, p])), cannibalization: perf.cannibalization };
  const canEdit = roleAtLeast('editor');

  const published = articles.filter((a) => a.status === 'publicado');
  const all = [...state.perf.values()];
  const sum = (k) => all.reduce((n, p) => n + (p[k] || 0), 0);
  const views = sum('pageviews');
  const readEnd = views ? Math.round((100 * sum('readToEnd')) / views) : null;

  panel.innerHTML = `
    <div class="section-head">
      <p class="hint" style="margin:0">Tus artículos y cómo los leen personas, buscadores e IA.</p>
      ${canEdit ? `
        <div class="head-actions">
          <label class="copy-btn file-btn">Cargar .md<input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" id="mdUpload" hidden /></label>
          <button type="button" class="primary-btn" id="newArticle">+ Nuevo artículo</button>
        </div>` : ''}
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><p class="kpi-label">Publicados</p><p class="kpi-value">${fmtNum(published.length)}</p><p class="kpi-sub">${fmtNum(articles.length - published.length)} en borrador</p></div>
      <div class="kpi-card"><p class="kpi-label">Visitas (30 días)</p><p class="kpi-value">${fmtNum(sum('views30d'))}</p><p class="kpi-sub">${trend(sum('views30d'), sum('viewsPrev30d'))} vs. 30 días antes</p></div>
      <div class="kpi-card"><p class="kpi-label">Leídos hasta el final</p><p class="kpi-value">${readEnd ?? '—'}${readEnd === null ? '' : '%'}</p><p class="kpi-sub">llegaron al 90% de la página</p></div>
      <div class="kpi-card"><p class="kpi-label">Entradas desde buscadores</p><p class="kpi-value">${fmtNum(sum('organic'))}</p></div>
      <div class="kpi-card"><p class="kpi-label">Alcance en IA</p><p class="kpi-value ai">${fmtNum(sum('aiCrawlerHits'))}</p><p class="kpi-sub">lecturas de rastreadores de IA · ${fmtNum(sum('aiReferrals'))} visitas desde asistentes</p></div>
    </div>

    <div class="card">
      <h2>Artículos <span class="hint">clic en uno para ver el detalle</span></h2>
      ${articles.length ? `
      <table>
        <thead><tr>
          <th>Artículo</th><th class="num">Visitas 30d</th><th class="num">Tiempo prom.</th><th class="num">Scroll prom.</th>
          <th class="num">Hasta el final</th><th class="num">Buscadores</th><th class="num">IA</th><th>Búsquedas que lo traen</th>
        </tr></thead>
        <tbody>
          ${articles.map((a) => {
            const p = state.perf.get(articlePath(a)) || {};
            return `
            <tr class="row-clickable" data-article="${esc(a.id)}" tabindex="0">
              <td class="article-cell">
                <strong>${esc(a.title)}</strong>
                <span class="article-meta">${statusPill(a.status)} <span class="mono">${esc(articlePath(a))}</span></span>
              </td>
              <td class="num">${fmtNum(p.views30d || 0)} ${trend(p.views30d || 0, p.viewsPrev30d || 0)}</td>
              <td class="num">${fmtMs(p.avgDurationMs)}</td>
              <td class="num">${p.avgScroll ?? '—'}${p.avgScroll == null ? '' : '%'}</td>
              <td class="num">${p.readToEndPercent ?? '—'}${p.readToEndPercent == null ? '' : '%'}</td>
              <td class="num">${fmtNum(p.organic || 0)}</td>
              <td class="num">${fmtNum((p.aiCrawlerHits || 0) + (p.aiReferrals || 0))}</td>
              <td>${(p.queries || []).slice(0, 2).map((q) => `<span class="badge badge-muted">${esc(q.query)}</span>`).join(' ') || '<span class="hint">—</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>` : `<p class="empty-state">Todavía no tienes artículos. ${canEdit ? 'Escribe uno o carga un archivo .md.' : ''}</p>`}
    </div>

    ${cannibalizationCard()}
  `;

  panel.querySelectorAll('[data-article]').forEach((row) => {
    const open = () => openArticleDrawer(row.dataset.article, panel);
    row.addEventListener('click', open);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
  const nb = panel.querySelector('#newArticle');
  if (nb) nb.addEventListener('click', () => openEditor(null, panel));
  const up = panel.querySelector('#mdUpload');
  if (up) up.addEventListener('change', async () => {
    const file = up.files[0];
    up.value = '';
    if (!file) return;
    if (file.size > 400_000) { alert('El archivo es demasiado grande.'); return; }
    openEditor(fromMarkdownFile(await file.text(), file.name), panel);
  });
}

function cannibalizationCard() {
  const items = state.cannibalization;
  const title = (p) => {
    const a = state.articles.find((x) => articlePath(x) === p);
    return a ? a.title : p;
  };
  return `
    <div class="card">
      <h2>Canibalización <span class="hint">artículos que compiten por la misma búsqueda</span></h2>
      ${items.length ? `
      <ul class="cannibal-list">
        ${items.map((c) => `
          <li class="cannibal cannibal-${c.severity}">
            <div class="cannibal-head">
              <span class="status-pill cannibal-pill-${c.severity}">${c.severity === 'alta' ? 'Alta' : c.severity === 'media' ? 'Media' : 'Posible'}</span>
              <strong>“${esc(c.keyword)}”</strong>
              <span class="hint">${c.type === 'observed' ? `${fmtNum(c.sessions)} visitas desde buscadores, repartidas` : 'la declaran como palabra clave varios artículos'}</span>
            </div>
            <ul class="cannibal-pages">
              ${c.pages.map((p) => `<li>${esc(title(p.path))}${p.share != null ? ` <span class="mono">${p.share}%</span>` : ''}</li>`).join('')}
            </ul>
            <p class="cannibal-fix">${c.type === 'observed'
              ? 'Elige un artículo principal para esta búsqueda: une el contenido o enlaza desde los demás hacia él y ajusta sus títulos para que apunten a búsquedas distintas.'
              : 'Antes de que compitan, dale a cada artículo una palabra clave principal distinta.'}</p>
          </li>`).join('')}
      </ul>` : '<p class="empty-state">Ningún artículo compite con otro por ahora.</p>'}
    </div>
  `;
}

// ---------------------------------------------------------------------
// Detail drawer
// ---------------------------------------------------------------------
async function openArticleDrawer(id, panel) {
  const a = state.articles.find((x) => x.id === id);
  if (!a) return;
  const p = state.perf.get(articlePath(a)) || { depth: [], daily: [], queries: [], aiCrawlers: [] };
  const targets = (a.keywords || []).map((k) => k.toLowerCase());
  const box = openDrawer(`
    <p class="eyebrow">Artículo · ${statusPill(a.status)}</p>
    <h1 class="drawer-title">${esc(a.title)}</h1>
    <p class="drawer-text">${esc(a.description || '')}</p>
    <div class="drawer-actions">
      ${a.status === 'publicado' ? `<a class="copy-btn" href="${esc(articlePath(a))}" target="_blank" rel="noopener">Ver en el sitio ↗</a>` : ''}
      ${roleAtLeast('editor') ? '<button type="button" class="primary-btn" data-edit>Editar</button>' : ''}
    </div>

    <dl class="detail-kv">
      <dt>Visitas</dt><dd>${fmtNum(p.pageviews || 0)} (${fmtNum(p.visitors || 0)} personas)</dd>
      <dt>Tiempo prom.</dt><dd>${fmtMs(p.avgDurationMs)} · lectura estimada ${readingMinutes(a.word_count)} min</dd>
      <dt>Hasta el final</dt><dd>${p.readToEndPercent ?? '—'}${p.readToEndPercent == null ? '' : '%'}</dd>
      <dt>Entradas</dt><dd>${fmtNum(p.entrances || 0)} · ${fmtNum(p.organic || 0)} buscadores · ${fmtNum(p.aiReferrals || 0)} asistentes IA</dd>
      <dt>Publicado</dt><dd>${a.published_at ? fmtDate(a.published_at) : '—'}</dd>
    </dl>

    <p class="eyebrow">Hasta dónde leen</p>
    <div class="chart-box chart-box-short"><canvas id="chartDepth"></canvas></div>

    <p class="eyebrow" style="margin-top:20px">Visitas por día (30 días)</p>
    <div class="chart-box chart-box-short"><canvas id="chartDaily"></canvas></div>

    <p class="eyebrow" style="margin-top:20px">Palabras clave</p>
    <p class="hint" style="margin:0 0 8px">Las que apuntas <span class="badge badge-human">✓ ya te encuentran</span> y las búsquedas reales que traen visitas.</p>
    <p class="keyword-cloud">
      ${targets.map((k) => `<span class="badge ${p.queries.some((q) => q.query.includes(k)) ? 'badge-human' : 'badge-muted'}">${p.queries.some((q) => q.query.includes(k)) ? '✓ ' : ''}${esc(k)}</span>`).join(' ') || '<span class="hint">Sin palabras clave declaradas.</span>'}
    </p>
    ${p.queries.length ? `
      <table>
        <thead><tr><th>Búsqueda</th><th class="num">Visitas</th></tr></thead>
        <tbody>${p.queries.slice(0, 10).map((q) => `<tr><td>${esc(q.query)}</td><td class="num">${fmtNum(q.sessions)}</td></tr>`).join('')}</tbody>
      </table>` : '<p class="hint">Todavía no hay búsquedas registradas que lleguen aquí.</p>'}

    <p class="eyebrow" style="margin-top:20px">Alcance en IA</p>
    ${p.aiCrawlers.length ? `
      <table>
        <thead><tr><th>Rastreador</th><th class="num">Lecturas</th><th>Última</th></tr></thead>
        <tbody>${p.aiCrawlers.map((c) => `<tr><td class="mono">${esc(c.bot)}</td><td class="num">${fmtNum(c.hits)}</td><td class="mono">${fmtDate(c.lastSeen)}</td></tr>`).join('')}</tbody>
      </table>` : '<p class="hint">Ningún rastreador de IA lo ha leído todavía.</p>'}
  `);

  const edit = box.querySelector('[data-edit]');
  if (edit) edit.addEventListener('click', async () => {
    const { article } = await andrhoApi(`/articles/${encodeURIComponent(a.id)}`);
    openEditor(article, panel);
  });

  chart('articleDepth', box.querySelector('#chartDepth'), {
    type: 'bar',
    data: {
      labels: (p.depth.length ? p.depth : [{ depth: 0 }]).map((d) => `${d.depth}%`),
      datasets: [{ data: p.depth.map((d) => d.percent), backgroundColor: cssVar('--accent-human'), borderRadius: 3 }]
    },
    options: Object.assign(barChartOptions(), { maintainAspectRatio: false })
  });
  chart('articleDaily', box.querySelector('#chartDaily'), {
    type: 'line',
    data: {
      labels: p.daily.map((d) => new Date(`${d.day}T12:00:00`).toLocaleDateString('es', { day: '2-digit', month: 'short' })),
      datasets: [{ data: p.daily.map((d) => d.views), borderColor: cssVar('--accent-violet'), backgroundColor: 'transparent', tension: 0.3, pointRadius: 2 }]
    },
    options: Object.assign(barChartOptions(), { maintainAspectRatio: false })
  });
}

// ---------------------------------------------------------------------
// Editor (new, edit, uploaded .md)
// ---------------------------------------------------------------------

// An uploaded .md file -> editor fields. Front matter wins; otherwise the
// first "# heading" is the title and the file name the slug.
function fromMarkdownFile(text, filename) {
  const { meta, body } = parseFrontMatter(text);
  const { title } = markdownToBlocks(body);
  return {
    title: meta.title || title || '',
    slug: meta.slug || filename.replace(/\.(md|markdown|txt)$/i, ''),
    description: meta.description || '',
    keywords: meta.keywords || [],
    tags: meta.tags || [],
    author: meta.author || '',
    path: meta.path || '',
    status: meta.status === 'publicado' ? 'publicado' : 'borrador',
    // The "# Title" line is the title field, not part of the body.
    body: title ? body.replace(/^\s*#\s+.*\n+/, '') : body
  };
}

const list = (v) => (Array.isArray(v) ? v.join(', ') : v || '');
const splitList = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

// Links in uploaded Markdown: web, relative, anchors and mail only.
const safeHref = (h) => (/^(https?:\/\/|\/|#|mailto:)/i.test(h) ? h.replace(/"/g, '&quot;') : '#');

function previewHtml(md) {
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (m, text, href) => `<a href="${safeHref(href)}" target="_blank" rel="noopener">${text}</a>`);
  return markdownToBlocks(md).blocks.map((b) => {
    if (b.p) return `<p>${inline(b.p)}</p>`;
    if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
    if (b.h3) return `<h3>${esc(b.h3)}</h3>`;
    if (b.quote) return `<blockquote>${inline(b.quote)}</blockquote>`;
    if (b.ul) return `<ul>${b.ul.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
    if (b.ol) return `<ol>${b.ol.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`;
    if (b.table) return `<table><thead><tr>${b.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.table.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    return '';
  }).join('') || '<p class="hint">Nada que mostrar todavía.</p>';
}

function openEditor(article, panel) {
  const a = article || { title: '', slug: '', description: '', keywords: [], tags: [], author: '', path: '', status: 'borrador', body: '' };
  const isNew = !a.id;
  const box = openDrawer(`
    <p class="eyebrow">${isNew ? 'Nuevo artículo' : 'Editar artículo'}</p>
    <h1 class="drawer-title">${isNew ? (a.title ? esc(a.title) : 'Escribe o pega tu artículo') : esc(a.title)}</h1>
    <form class="invite-form article-form" id="articleForm" novalidate>
      <label>Título<input name="title" required maxlength="200" value="${esc(a.title)}" /></label>
      <label>Descripción <span class="counter" data-for="description"></span>
        <textarea name="description" maxlength="320" rows="3" placeholder="Lo que verá la gente en Google y al compartirlo">${esc(a.description)}</textarea>
      </label>
      <label>Palabras clave<input name="keywords" value="${esc(list(a.keywords))}" placeholder="software para restaurantes, inventario de cocina" /></label>
      <div class="form-row">
        <label>Etiquetas<input name="tags" value="${esc(list(a.tags))}" placeholder="Restaurantes, Datos" /></label>
        <label>Autor<input name="author" value="${esc(a.author)}" placeholder="Equipo AndRho" /></label>
      </div>
      <div class="form-row">
        <label>Slug<input name="slug" value="${esc(a.slug)}" placeholder="se genera del título" /></label>
        <label>Ruta en el sitio<input name="path" value="${esc(a.path)}" placeholder="/articulos/&lt;slug&gt;.html" /></label>
      </div>
      <div class="editor-tabs" role="tablist">
        <button type="button" class="tab active" data-mode="write" role="tab">Escribir</button>
        <button type="button" class="tab" data-mode="preview" role="tab">Vista previa</button>
        <span class="hint" data-words></span>
      </div>
      <textarea name="body" class="md-editor" rows="18" placeholder="## Un subtítulo&#10;&#10;Párrafos, listas con -, citas con >, **negritas** y [enlaces](https://...)">${esc(a.body)}</textarea>
      <div class="md-preview article-preview" hidden></div>
      <p class="form-error" role="alert" hidden></p>
      <div class="form-actions">
        <button type="submit" data-status="borrador" class="secondary">Guardar borrador</button>
        <button type="submit" data-status="publicado">${a.status === 'publicado' && !isNew ? 'Guardar y mantener publicado' : 'Publicar'}</button>
        ${!isNew ? '<button type="button" class="danger-link" data-delete>Eliminar</button>' : ''}
      </div>
    </form>
  `);
  const form = box.querySelector('#articleForm');
  const body = form.elements.body;
  const preview = box.querySelector('.md-preview');
  const words = box.querySelector('[data-words]');
  const desc = form.elements.description;
  const counter = box.querySelector('.counter');
  const err = box.querySelector('.form-error');

  const updateCounts = () => {
    const n = body.value.trim() ? body.value.trim().split(/\s+/).length : 0;
    words.textContent = `${fmtNum(n)} palabras · ${readingMinutes(n)} min de lectura`;
    counter.textContent = `${desc.value.length}/320`;
  };
  body.addEventListener('input', updateCounts);
  desc.addEventListener('input', updateCounts);
  updateCounts();

  box.querySelectorAll('[data-mode]').forEach((btn) => btn.addEventListener('click', () => {
    const write = btn.dataset.mode === 'write';
    box.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b === btn));
    body.hidden = !write;
    preview.hidden = write;
    if (!write) preview.innerHTML = previewHtml(body.value);
  }));

  let submitter = 'borrador';
  form.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => { submitter = b.dataset.status; }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const f = form.elements;
    const payload = {
      title: f.title.value, description: f.description.value, slug: f.slug.value, path: f.path.value,
      author: f.author.value, keywords: splitList(f.keywords.value), tags: splitList(f.tags.value),
      body: f.body.value, status: e.submitter ? e.submitter.dataset.status : submitter
    };
    const buttons = form.querySelectorAll('button');
    buttons.forEach((b) => (b.disabled = true));
    try {
      await andrhoApi(isNew ? '/articles' : `/articles/${encodeURIComponent(a.id)}`, {
        method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload)
      });
      closeDrawer();
      withPanel(panel, renderArticles);
    } catch (ex) {
      err.textContent = ex.message || 'No se pudo guardar el artículo.';
      err.hidden = false;
      buttons.forEach((b) => (b.disabled = false));
    }
  });

  const del = form.querySelector('[data-delete]');
  if (del) del.addEventListener('click', async () => {
    if (!confirm(`¿Eliminar “${a.title}”? Esto no se puede deshacer.`)) return;
    try {
      await andrhoApi(`/articles/${encodeURIComponent(a.id)}`, { method: 'DELETE' });
      closeDrawer();
      withPanel(panel, renderArticles);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });
}
