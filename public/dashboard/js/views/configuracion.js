// Configuración: team management (invites, roles), the account's plan and
// its brand and data (kit.js: what the signup left pending).
import { andrhoApi, andrhoApiFetch, esc, fmtDate, roleAtLeast, openDrawer, ROLE_LABEL, PLAN_LABEL } from '../core.js';
import { kitCard, wireKit } from './kit.js';

const formatQ = (n) => `Q${Number(n || 0).toLocaleString('en-US')}`;
const SITE_STATUS = { offered: ['Reservado, sin construir', 'status-sugerida'], deploying: ['Publicándose', 'status-proceso'], live: ['En línea', 'status-terminada'] };

// One branch per line: "Nombre | Dirección | Teléfono | Horario" (for
// Google's LocalBusiness data).
const branchesToText = (list) => (list || []).map((b) => [b.name, b.address, b.phone, b.hours].map((v) => v || '').join(' | ').replace(/( \| )+$/, '')).join('\n');
const textToBranches = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [name, address, phone, hours] = l.split('|').map((v) => v.trim());
  return { name, address: address || '', phone: phone || '', hours: hours || '' };
});

// The account's website: where it lives, its state, and its SEO (Search
// Console's verification code included). An offered site says how to
// turn it on.
const isOwnerNow = () => roleAtLeast('owner');

// The site's levels this account can buy (or upgrade to): construction
// once, upkeep monthly (POST /account/site/buy).
function siteBuy(site, isOwner) {
  const options = (site.options || []).filter((o) => !o.included);
  if (!options.length) return '';
  return `
      <div class="plan-grid" style="margin-top:12px">
        ${options.map((o) => `
          <div class="plan-card">
            <p class="plan-card-name">${esc(o.upgrade ? `Mejorar a ${o.label.toLowerCase()}` : o.label)}</p>
            <p class="hint" style="margin:0 0 6px">${esc(o.detail)}</p>
            <p class="hint" style="margin:0 0 10px">${formatQ(o.setup)} una vez${o.monthly > 0 ? ` + ${formatQ(o.monthly)}/mes` : ', mismo mantenimiento'}</p>
            ${isOwner ? `<button type="button" class="copy-btn" data-buy-site="${esc(o.id)}">Quiero este sitio</button>` : ''}
          </div>`).join('')}
      </div>`;
}

function siteCard(site, canEdit) {
  if (!site) return '';
  const [label, cls] = SITE_STATUS[site.status] || [site.status, ''];
  const seo = site.seo || {};
  return `
    <div class="card" id="siteCard">
      <h2>Tu sitio web <span class="hint">SEO ${esc(site.seo_level || 'sin sitio')}</span></h2>
      <dl class="detail-kv">
        <dt>Dirección</dt><dd>${site.status === 'live' ? `<a href="${esc(site.url)}" target="_blank" rel="noopener">${esc(site.url)}</a>` : esc(site.url)}</dd>
        <dt>Estado</dt><dd><span class="status-pill ${cls}">${esc(label)}</span></dd>
      </dl>
      ${site.offer ? `<p class="hint">${esc(site.offer)}</p>` : ''}
      ${siteBuy(site, isOwnerNow())}
      ${canEdit && site.status !== 'offered' ? `
        <details>
          <summary class="hint" style="cursor:pointer">SEO y Google Search Console</summary>
          <form class="invite-form" id="seoForm" style="margin-top:12px">
            <label>Título (hasta 70)<input name="title" maxlength="70" value="${esc(seo.title)}" /></label>
            <label>Descripción (hasta 160)<input name="description" maxlength="160" value="${esc(seo.description)}" /></label>
            <label>Imagen para compartir (https)<input name="og_image" type="url" value="${esc(seo.og_image)}" /></label>
            <label>Código de verificación de Google Search Console
              <input name="gsc_token" value="${esc(seo.gsc_token)}" placeholder="Pega el código o la etiqueta &lt;meta name=&quot;google-site-verification&quot; …&gt;" /></label>
            <p class="hint" style="margin:0">En Search Console agrega una propiedad de <strong>prefijo de URL</strong> con ${esc(site.url)}/ y elige la verificación por etiqueta HTML.</p>
            <label>Sucursales, una por línea: Nombre | Dirección | Teléfono | Horario
              <textarea name="branches" rows="3" placeholder="Zona 10 | 4a Av 1-2, Zona 10 | +502 5555 5555 | Mo-Fr 08:00-18:00">${esc(branchesToText(seo.branches))}</textarea></label>
            <p class="form-error" hidden></p>
            <button type="submit">Guardar</button>
          </form>
        </details>` : ''}
    </div>`;
}

const JOB = { erp: 'ERP (Odoo)', whatsapp: 'WhatsApp', website: 'Sitio web', meta: 'Facebook e Instagram' };
const JOB_STATUS = { pendiente: ['En cola', 'status-sugerida'], en_proceso: ['En proceso', 'status-proceso'], listo: ['Listo', 'status-terminada'], esperando_vps: ['Preparando el servidor', 'status-proceso'], esperando_meta: ['Esperando a Meta', 'status-sugerida'], error: ['Se reintentará', 'status-rechazada'] };

function quotaLabel(quota) {
  if (!quota) return '';
  if (quota.limit < 0) return '∞ sugerencias este mes';
  return `${Math.max(0, quota.remaining)} de ${quota.limit} sugerencias restantes este mes`;
}

// The type of business: AndRho's configuration on top of the analysis
// (what it suggests, the ERP's apps, the order of the sections, the site).
function businessCard(biz, canEdit) {
  const p = biz.profile;
  return `
    <div class="card" id="businessCard">
      <h2>Tipo de negocio <span class="hint">AndRho ajusta sus sugerencias, tu ERP y tu sitio a esto</span></h2>
      <div class="plan-grid">
        ${biz.options.map((o) => `
          <div class="plan-card ${o.key === biz.business_type ? 'plan-card-active' : ''}" style="text-align:left">
            <p class="plan-card-name" style="margin:0 0 4px">${esc(o.name)}</p>
            <p class="hint" style="margin:0 0 10px">${esc(o.description)}</p>
            <p class="hint" style="margin:0 0 12px">Ej.: ${o.examples.map(esc).join(', ')}</p>
            ${canEdit ? `<button type="button" class="copy-btn" data-set-type="${o.key}" ${o.key === biz.business_type ? 'disabled' : ''}>${o.key === biz.business_type ? 'Tu tipo de negocio' : 'Elegir'}</button>` : ''}
          </div>`).join('')}
      </div>
      ${p ? `<p class="kpi-sub" style="margin:14px 0 6px">En un negocio de ${esc(p.name.toLowerCase())}, AndRho se fija primero en:</p>
        <ul class="issue-list" style="max-height:none">${p.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
        : '<p class="kpi-sub" style="margin:14px 0 0">Sin tipo: AndRho se guía solo por lo que contaste al registrarte.</p>'}
    </div>`;
}

async function render(el) {
  el.innerHTML = '<p class="loading-state">cargando…</p>';
  const [usersData, planData, erp, prov, biz, catalog, siteData, kitData] = await Promise.all([
    andrhoApi('/account/users'), andrhoApi('/account/plan'),
    andrhoApi('/erp/status').catch(() => ({ connected: false })),
    andrhoApi('/account/provisioning').catch(() => ({ jobs: [], tasks: [] })),
    andrhoApi('/account/business-type').catch(() => null),
    andrhoApiFetch('/plans').catch(() => ({ plans: [] })),
    andrhoApi('/account/site').catch(() => ({ site: null })),
    andrhoApi('/account/assets').catch(() => null)
  ]);
  const canManageTeam = roleAtLeast('admin');
  const isOwner = roleAtLeast('owner');

  el.innerHTML = `
    <div class="card">
      <div class="section-head">
        <h2 style="margin:0">Tu equipo</h2>
        ${canManageTeam ? '<button type="button" class="copy-btn" id="inviteBtn">+ Invitar</button>' : ''}
      </div>
      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th>${canManageTeam ? '<th></th>' : ''}</tr></thead>
        <tbody>
          ${usersData.users.map((u) => `
            <tr>
              <td>${esc(u.display_name || '—')}</td>
              <td class="mono">${esc(u.email)}</td>
              <td>
                ${canManageTeam && u.role !== 'owner' ? `
                  <select class="role-select" data-user-id="${esc(u.id)}" aria-label="Rol de ${esc(u.email)}">
                    ${['viewer', 'editor', 'admin'].map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${esc(ROLE_LABEL[r])}</option>`).join('')}
                  </select>
                ` : esc(ROLE_LABEL[u.role] || u.role)}
              </td>
              <td>${u.pending ? '<span class="badge badge-muted">invitación pendiente</span>' : '<span class="badge badge-human">activo</span>'}</td>
              ${canManageTeam ? `<td>${u.role !== 'owner' ? `<button type="button" class="danger-link" data-remove-user="${esc(u.id)}">Quitar</button>` : ''}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${biz ? businessCard(biz, roleAtLeast('admin')) : ''}

    ${kitCard(kitData, roleAtLeast('admin'))}

    <div class="card">
      <h2>Plan actual: ${esc(PLAN_LABEL[planData.plan] || planData.plan)}</h2>
      <p class="hint" style="margin:0 0 16px">${esc(quotaLabel(planData.suggestions_quota))} · cambiar de plan aquí no genera ningún cobro todavía; solo ajusta qué ve tu cuenta.</p>
      <div class="plan-grid">
        ${catalog.plans.map((p) => `
          <div class="plan-card ${p.id === planData.plan ? 'plan-card-active' : ''}">
            <p class="plan-card-name">${esc(p.name)}</p>
            <p class="hint" style="margin:0 0 10px">${esc(p.label)} · ${formatQ(p.price)}/mes</p>
            ${isOwner ? `<button type="button" class="copy-btn" data-set-plan="${p.id}" ${p.id === planData.plan ? 'disabled' : ''}>${p.id === planData.plan ? 'Plan actual' : 'Cambiar a este plan'}</button>` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    ${siteCard(siteData.site, canManageTeam)}

    <div class="card" id="erp">
      <h2>Tu ERP</h2>
      ${erp.connected ? `
        <dl class="detail-kv"><dt>Odoo</dt><dd><a href="${esc(erp.url)}" target="_blank" rel="noopener">${esc(erp.url)}</a></dd>
          <dt>Base de datos</dt><dd>${esc(erp.db)}</dd><dt>Usuario</dt><dd>${esc(erp.login)}</dd></dl>
        <p class="hint">Inventario, Clientes, Prospectos, Sucursales y Resumen leen de aquí.</p>` :
        '<p class="hint" style="margin:0 0 12px">Sin ERP conectado. Si elegiste el ERP de AndRho al registrarte, aparece aquí cuando esté listo.</p>'}
      ${canManageTeam ? `
        <details ${erp.connected ? '' : 'open'}>
          <summary class="hint" style="cursor:pointer">${erp.connected ? 'Conectar otro Odoo' : '¿Ya usas Odoo? Conéctalo'}</summary>
          <form class="invite-form erp-form" id="erpForm" style="margin-top:12px">
            <label>URL de tu Odoo<input name="url" type="url" required placeholder="https://miempresa.odoo.com" /></label>
            <label>Base de datos<input name="db" required /></label>
            <label>Usuario<input name="login" required autocomplete="off" /></label>
            <label>Contraseña o clave de API<input name="password" type="password" required autocomplete="new-password" /></label>
            <p class="form-error" hidden></p>
            <button type="submit">Conectar</button>
          </form>
        </details>` : ''}
    </div>

    ${prov.jobs.length || prov.tasks.length ? `
    <div class="card">
      <h2>Lo que AndRho preparó para ti</h2>
      <table><thead><tr><th>Servicio</th><th>Estado</th><th>Detalle</th><th>Actualizado</th></tr></thead><tbody>
        ${prov.jobs.map((j) => { const [label, cls] = JOB_STATUS[j.status] || [j.status, '']; return `<tr><td>${esc(JOB[j.kind] || j.kind)}</td><td><span class="status-pill ${cls}">${esc(label)}${j.status === 'en_proceso' && j.progress ? ` · ${j.progress}%` : ''}</span></td><td>${esc(j.detail)}</td><td class="mono">${fmtDate(j.updated_at)}</td></tr>`; }).join('')}
        ${prov.tasks.map((t) => `<tr><td>${esc(t.title)}</td><td><span class="status-pill ${t.status === 'entregada' ? 'status-terminada' : 'status-proceso'}">${t.status === 'entregada' ? 'Entregado' : t.status === 'aceptada' ? 'Un Creator trabaja en ello' : 'Esperando Creator'}</span></td>
          <td>${t.delivery_url ? `<a href="${esc(t.delivery_url)}" target="_blank" rel="noopener">${esc(t.delivery_url)}</a>` : esc(t.notes || '')}</td><td class="mono">${fmtDate(t.updated_at)}</td></tr>`).join('')}
      </tbody></table>
    </div>` : ''}
  `;

  const seoForm = el.querySelector('#seoForm');
  if (seoForm) seoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = seoForm.elements;
    const err = seoForm.querySelector('.form-error');
    const btn = seoForm.querySelector('button');
    btn.disabled = true;
    err.hidden = true;
    try {
      await andrhoApi('/account/site/seo', { method: 'PUT', body: JSON.stringify({ title: f.title.value, description: f.description.value,
        og_image: f.og_image.value, gsc_token: f.gsc_token.value, branches: textToBranches(f.branches.value) }) });
      render(el);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      btn.disabled = false;
    }
  });

  const erpForm = el.querySelector('#erpForm');
  if (erpForm) erpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = erpForm.elements;
    const err = erpForm.querySelector('.form-error');
    const btn = erpForm.querySelector('button');
    btn.disabled = true;
    err.hidden = true;
    try {
      await andrhoApi('/account/erp', { method: 'POST', body: JSON.stringify({ url: f.url.value, db: f.db.value, login: f.login.value, password: f.password.value }) });
      render(el);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      btn.disabled = false;
    }
  });

  const act = async (fn, msg) => {
    try { await fn(); render(el); } catch (err) { alert(err.message || msg); }
  };

  wireKit(el, kitData, () => render(el));

  const inviteBtn = el.querySelector('#inviteBtn');
  if (inviteBtn) inviteBtn.addEventListener('click', openInviteDrawer);

  el.querySelectorAll('.role-select').forEach((sel) => sel.addEventListener('change', () => act(
    () => andrhoApi(`/account/users/${encodeURIComponent(sel.dataset.userId)}/role`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) }),
    'No se pudo cambiar el rol.'
  )));

  el.querySelectorAll('[data-remove-user]').forEach((btn) => btn.addEventListener('click', () => {
    if (!confirm('¿Quitar a esta persona del equipo?')) return;
    act(() => andrhoApi(`/account/users/${encodeURIComponent(btn.dataset.removeUser)}`, { method: 'DELETE' }), 'No se pudo quitar a esta persona.');
  }));

  el.querySelectorAll('[data-set-type]').forEach((btn) => btn.addEventListener('click', () => act(async () => {
    const t = btn.dataset.setType;
    await andrhoApi('/account/business-type', { method: 'PUT', body: JSON.stringify({ business_type: t }) });
    window.dispatchEvent(new CustomEvent('andrho:business-type', { detail: t }));
  }, 'No se pudo cambiar el tipo de negocio.')));

  el.querySelectorAll('[data-buy-site]').forEach((btn) => btn.addEventListener('click', () => {
    if (!confirm('Tu sitio se construye ahora. La construcción se paga una vez y el mantenimiento se suma a tu plan. ¿Seguimos?')) return;
    act(() => andrhoApi('/account/site/buy', { method: 'POST', body: JSON.stringify({ level: btn.dataset.buySite }) }), 'No pudimos agregar tu sitio.');
  }));
  el.querySelectorAll('[data-set-plan]').forEach((btn) => btn.addEventListener('click', () => act(
    () => andrhoApi('/account/plan', { method: 'PATCH', body: JSON.stringify({ plan: btn.dataset.setPlan }) }),
    'No se pudo cambiar el plan.'
  )));
}

function openInviteDrawer() {
  const box = openDrawer(`
    <p class="eyebrow">Invitar a tu equipo</p>
    <h1 class="drawer-title">Nueva invitación</h1>
    <form id="inviteForm" class="invite-form">
      <label>Correo<input type="email" name="email" required /></label>
      <label>Nombre (opcional)<input type="text" name="display_name" /></label>
      <label>Rol
        <select name="role">
          <option value="viewer">Solo lectura</option>
          <option value="editor">Editor</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <button type="submit">Generar invitación</button>
    </form>
    <div id="inviteResult"></div>
  `);
  box.querySelector('#inviteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const result = box.querySelector('#inviteResult');
    try {
      const resp = await andrhoApi('/account/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), display_name: form.get('display_name'), role: form.get('role') })
      });
      const link = `${window.location.origin}/accept-invite.html?token=${encodeURIComponent(resp.invite_token)}`;
      result.innerHTML = `
        <p class="hint" style="margin:16px 0 8px">Comparte este enlace con ${esc(resp.user.email)}; todavía no se envía por correo automáticamente:</p>
        <pre class="snippet-box"><code>${esc(link)}</code></pre>
        <button type="button" class="copy-btn copy-btn-full" id="copyInviteLink">Copiar enlace</button>
      `;
      result.querySelector('#copyInviteLink').addEventListener('click', (ev) => {
        navigator.clipboard.writeText(link).then(() => { ev.target.textContent = '✓ Copiado'; });
      });
      e.target.reset();
    } catch (err) {
      result.innerHTML = `<p class="empty-state">${esc(err.message)}</p>`;
    }
  });
}

export default {
  title: 'Configuración',
  hint: 'tu equipo y tu plan',
  render
};
