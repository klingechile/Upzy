(function () {
  const $ = (selector) => document.querySelector(selector);

  const state = {
    status: 'loading',
    error: null,
    ops: null,
    smoke: null,
  };

  function token() {
    return sessionStorage.getItem('upzy_token');
  }

  async function api(path, options = {}) {
    const auth = token();
    if (!auth) throw new Error('Sin sesión activa. Inicia sesión para revisar operación.');

    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
        ...(options.headers || {}),
      },
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error || `Error HTTP ${res.status}`);
    return payload;
  }

  function badge(status) {
    const value = String(status || '').toUpperCase();
    const cls = ['OK', 'GO', 'READY', 'DEFINED'].includes(value) ? 'ok' : value === 'WARN' ? 'warm' : 'hot';
    return `<span class="upzy-badge ${cls}">${value}</span>`;
  }

  function renderStatus() {
    const target = $('#upzy-ops-status');
    if (!target) return;

    const live = state.status === 'live';
    const error = state.status === 'error';
    const score = state.ops?.ops?.score || 0;
    const rec = state.ops?.recommendation || 'PENDIENTE';
    const tone = live ? 'live' : error ? 'error' : 'fallback';
    const label = live ? rec : error ? 'ERROR' : 'LOADING';
    const message = live
      ? `Score operativo ${score}% · Recomendación ${rec}`
      : error
        ? `${state.error?.message || 'Error desconocido'} · Revisa sesión, rol o endpoint.`
        : 'Consultando estado operativo productivo...';

    target.innerHTML = `
      <div class="upzy-live-banner ${tone}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Producción, Monitoreo y Smoke Tests</div>
          <div class="upzy-live-detail">${message}</div>
        </div>
        <span class="upzy-badge ${live ? 'ok' : error ? 'hot' : 'warm'}">${label}</span>
      </div>
    `;
  }

  function renderScore() {
    const target = $('#upzy-ops-score');
    if (!target) return;
    const score = state.ops?.ops?.score || 0;
    const rec = state.ops?.recommendation || 'PENDIENTE';
    const app = state.ops?.app || {};
    target.innerHTML = `
      <div class="upzy-report-summary">
        <div class="upzy-report-big">${score}%</div>
        <div class="upzy-report-label">Recomendación operativa: ${rec}. Entorno ${app.env || 'n/a'} · uptime ${app.uptime_seconds || 0}s · tenant ${app.tenant || 'n/a'}.</div>
        <div class="upzy-insight-grid">
          <div class="upzy-card upzy-insight"><div class="upzy-insight-title">Versión</div><p class="upzy-empty-state">${app.version || 'n/a'}</p></div>
          <div class="upzy-card upzy-insight"><div class="upzy-insight-title">Estado</div><p class="upzy-empty-state">${state.ops?.ops?.status || 'loading'}</p></div>
          <div class="upzy-card upzy-insight"><div class="upzy-insight-title">Smoke test</div><p class="upzy-empty-state">${state.smoke ? `${state.smoke.score}% · ${state.smoke.recommendation}` : 'pendiente de ejecutar'}</p></div>
        </div>
      </div>
    `;
  }

  function renderChannels() {
    const target = $('#upzy-ops-channels');
    if (!target) return;
    const channels = state.ops?.channels || {};
    target.innerHTML = Object.entries(channels).map(([name, enabled]) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${name}</div>
          <div class="upzy-list-meta">Canal configurado en entorno.</div>
        </div>
        ${badge(enabled ? 'OK' : 'WARN')}
      </div>
    `).join('') || '<div class="upzy-live-empty">Sin canales disponibles.</div>';
  }

  function renderChecks() {
    const target = $('#upzy-ops-checks');
    if (!target) return;
    const checks = state.ops?.checks || [];
    target.innerHTML = checks.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${item.label}</div>
          <div class="upzy-list-meta"><span class="upzy-event-code">${item.id}</span> · ${item.detail}</div>
        </div>
        ${badge(item.status)}
      </div>
    `).join('') || '<div class="upzy-live-empty">Sin checks disponibles.</div>';
  }

  function renderRoutes() {
    const target = $('#upzy-ops-routes');
    if (!target) return;
    const routes = state.ops?.routes || [];
    target.innerHTML = routes.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.route}</span></div>
          <div class="upzy-list-meta">Ruta crítica de producto.</div>
        </div>
        ${badge(item.status)}
      </div>
    `).join('') || '<div class="upzy-live-empty">Sin rutas disponibles.</div>';
  }

  function renderEndpoints() {
    const target = $('#upzy-ops-endpoints');
    if (!target) return;
    const endpoints = state.ops?.endpoints || [];
    target.innerHTML = endpoints.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.endpoint}</span></div>
          <div class="upzy-list-meta">Endpoint crítico definido.</div>
        </div>
        ${badge(item.status)}
      </div>
    `).join('') || '<div class="upzy-live-empty">Sin endpoints disponibles.</div>';
  }

  function renderSmoke() {
    const target = $('#upzy-ops-smoke-result');
    if (!target) return;
    if (!state.smoke) {
      target.innerHTML = '<div class="upzy-live-empty">Smoke test no ejecutado todavía.</div>';
      return;
    }
    target.innerHTML = `
      <div class="upzy-state-box">
        <div class="upzy-state-title">Resultado smoke test</div>
        <div class="upzy-state-text">Score: ${state.smoke.score}% · Recomendación: ${state.smoke.recommendation}</div>
        <div class="upzy-state-text">Generado: ${new Date(state.smoke.generated_at).toLocaleString('es-CL')}</div>
      </div>
      <div class="upzy-list" style="margin-top:12px">
        ${(state.smoke.tests || []).map((item) => `
          <div class="upzy-list-item">
            <div><div class="upzy-list-title">${item.label}</div><div class="upzy-list-meta"><span class="upzy-event-code">${item.id}</span> · ${item.detail}</div></div>
            ${badge(item.status)}
          </div>
        `).join('')}
      </div>
    `;
  }

  async function runSmoke() {
    const btn = $('#upzy-run-smoke');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Ejecutando...';
    }
    try {
      state.smoke = await api('/api/ops/smoke-test', { method: 'POST', body: JSON.stringify({}) });
      renderSmoke();
      renderScore();
    } catch (error) {
      state.status = 'error';
      state.error = error;
      renderStatus();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Ejecutar smoke test';
      }
    }
  }

  function bind() {
    const btn = $('#upzy-run-smoke');
    if (btn) btn.addEventListener('click', runSmoke);
  }

  function renderAll() {
    renderStatus();
    renderScore();
    renderChannels();
    renderChecks();
    renderRoutes();
    renderEndpoints();
    renderSmoke();
  }

  async function load() {
    renderStatus();
    try {
      state.ops = await api('/api/ops/status');
      state.status = 'live';
      state.error = null;
    } catch (error) {
      state.status = 'error';
      state.error = error;
    }
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    load();
  });
})();
