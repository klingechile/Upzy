(function () {
  const $ = (selector) => document.querySelector(selector);

  const state = {
    status: 'loading',
    error: null,
    data: null,
  };

  function token() {
    return sessionStorage.getItem('upzy_token');
  }

  async function api(path) {
    const auth = token();
    if (!auth) throw new Error('Sin sesión activa. Inicia sesión para revisar beta operativa.');

    const res = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error || `Error HTTP ${res.status}`);
    return payload;
  }

  function renderStatus() {
    const target = $('#upzy-beta-live-status');
    if (!target) return;
    const live = state.status === 'live';
    const error = state.status === 'error';
    const tone = live ? 'live' : error ? 'error' : 'fallback';
    const badge = live ? 'BETA' : error ? 'ERROR' : 'LOADING';
    const message = live
      ? `Beta ${state.data?.beta?.status || 'ready'} · Score ${state.data?.beta?.score || 0}%`
      : error
        ? `${state.error?.message || 'Error desconocido'} · Revisa sesión o endpoint.`
        : 'Consultando estado de beta operativa...';

    target.innerHTML = `
      <div class="upzy-live-banner ${tone}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">QA Final + Beta Operativa</div>
          <div class="upzy-live-detail">${message}</div>
        </div>
        <span class="upzy-badge ${live ? 'ok' : error ? 'hot' : 'warm'}">${badge}</span>
      </div>
    `;
  }

  function renderScore() {
    const target = $('#upzy-beta-score');
    if (!target) return;
    const score = state.data?.beta?.score || 0;
    const status = state.data?.beta?.status || 'loading';
    target.innerHTML = `
      <div class="upzy-report-summary">
        <div class="upzy-report-big">${score}%</div>
        <div class="upzy-report-label">Estado beta: ${status}. Este score cruza autenticación, tenant, seguridad, tablas base y módulos live.</div>
        <div class="upzy-insight-grid">
          <div class="upzy-card upzy-insight"><div class="upzy-insight-title">Usuario</div><p class="upzy-empty-state">${state.data?.user?.email || 'Sin usuario'} · ${state.data?.user?.rol || 'sin rol'}</p></div>
          <div class="upzy-card upzy-insight"><div class="upzy-insight-title">Tenant</div><p class="upzy-empty-state">${state.data?.user?.tenant_id || 'sin tenant'}</p></div>
          <div class="upzy-card upzy-insight"><div class="upzy-insight-title">Siguiente</div><p class="upzy-empty-state">Smoke test manual y validación de operación diaria.</p></div>
        </div>
      </div>
    `;
  }

  function pill(status) {
    const s = String(status || '').toLowerCase();
    const cls = s === 'ok' || s === 'live' || s === 'ready' ? 'ok' : s === 'warn' ? 'warm' : 'hot';
    return `<span class="upzy-badge ${cls}">${status}</span>`;
  }

  function renderChecks() {
    const target = $('#upzy-beta-checks');
    if (!target) return;
    const checks = state.data?.checks || [];
    target.innerHTML = checks.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${item.label}</div>
          <div class="upzy-list-meta"><span class="upzy-event-code">${item.id}</span> · ${item.detail || 'sin detalle'}</div>
        </div>
        ${pill(item.status)}
      </div>
    `).join('') || '<div class="upzy-live-empty">No hay checks disponibles.</div>';
  }

  function renderModules() {
    const target = $('#upzy-beta-modules');
    if (!target) return;
    const modules = state.data?.modules || [];
    target.innerHTML = `
      <div class="upzy-report-table-wrap">
        <table class="upzy-report-table">
          <thead><tr><th>Módulo</th><th>Estado</th><th>Endpoint</th></tr></thead>
          <tbody>
            ${modules.map((item) => `
              <tr>
                <td><strong>${item.module}</strong></td>
                <td>${pill(item.status)}</td>
                <td><span class="upzy-event-code">${item.endpoint || 'n/a'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRoutes() {
    const target = $('#upzy-beta-routes');
    if (!target) return;
    const routes = state.data?.routes || [];
    target.innerHTML = routes.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.route}</span></div>
          <div class="upzy-list-meta">${item.purpose}</div>
        </div>
        ${pill(item.status)}
      </div>
    `).join('') || '<div class="upzy-live-empty">No hay rutas cargadas.</div>';
  }

  function renderNext() {
    const target = $('#upzy-beta-next');
    if (!target) return;
    const next = state.data?.next || [];
    target.innerHTML = next.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${item}</div>
          <div class="upzy-list-meta">Backlog post-beta / operación inicial</div>
        </div>
        <span class="upzy-priority">Next</span>
      </div>
    `).join('') || '<div class="upzy-live-empty">Sin siguientes acciones.</div>';
  }

  function renderAll() {
    renderStatus();
    renderScore();
    renderChecks();
    renderModules();
    renderRoutes();
    renderNext();
  }

  async function load() {
    renderStatus();
    try {
      state.data = await api('/api/beta/status');
      state.status = 'live';
      state.error = null;
    } catch (error) {
      state.status = 'error';
      state.error = error;
    }
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', load);
})();
