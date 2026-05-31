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
    if (!auth) throw new Error('Sin sesión activa. Inicia sesión para cargar reportes reales.');

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

  function money(value) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function renderStatus() {
    const target = $('#upzy-live-reports-status');
    if (!target) return;
    const live = state.status === 'live';
    const error = state.status === 'error';
    const tone = live ? 'live' : error ? 'error' : 'fallback';
    const badge = live ? 'LIVE' : error ? 'ERROR' : 'LOADING';
    const message = live
      ? 'Reportes consolidados cargados desde /api/reports/overview.'
      : error
        ? `${state.error?.message || 'Error desconocido'} · Revisa sesión o endpoint.`
        : 'Consultando reportes reales consolidados...';

    target.innerHTML = `
      <div class="upzy-live-banner ${tone}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Reportes Reales + Atribución</div>
          <div class="upzy-live-detail">${message}</div>
        </div>
        <span class="upzy-badge ${live ? 'ok' : error ? 'hot' : 'warm'}">${badge}</span>
      </div>
    `;
  }

  function renderMetrics() {
    const target = $('#upzy-live-report-metrics');
    if (!target) return;
    const metrics = state.data?.metrics || {};
    const cards = [
      { label: 'Leads reales', value: metrics.leads_total || 0, delta: 'CRM conectado', tone: 'blue', icon: 'ti-users' },
      { label: 'Conversión', value: `${metrics.conversion_rate || 0}%`, delta: 'lead a cerrado', tone: 'green', icon: 'ti-chart-arrows-vertical' },
      { label: 'Carritos pendientes', value: metrics.carts_pending || 0, delta: 'recuperación', tone: 'orange', icon: 'ti-shopping-cart' },
      { label: 'Revenue', value: money(metrics.revenue_total), delta: 'atribución simple', tone: 'purple', icon: 'ti-cash' },
    ];

    target.innerHTML = cards.map((card) => `
      <article class="upzy-card tone-${card.tone}">
        <div class="upzy-card-header">
          <div class="upzy-card-title">${card.label}</div>
          <div class="upzy-card-icon"><i class="ti ${card.icon}"></i></div>
        </div>
        <div class="upzy-metric-value">${card.value}</div>
        <div class="upzy-metric-delta">${card.delta}</div>
      </article>
    `).join('');
  }

  function renderFunnel() {
    const target = $('#upzy-live-funnel');
    if (!target) return;
    const funnel = state.data?.funnel || [];
    if (!funnel.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay datos de funnel disponibles.</div>';
      return;
    }

    target.innerHTML = funnel.map((stage) => `
      <div class="upzy-funnel-row">
        <div>
          <div class="upzy-funnel-name">${stage.stage}</div>
          <div class="upzy-funnel-meta">${stage.count} registros</div>
        </div>
        <div class="upzy-bar"><span style="--value:${Math.max(stage.rate || 0, 3)}%"></span></div>
        <div><strong>${stage.rate || 0}%</strong></div>
        <div><strong>${money(stage.value || 0)}</strong></div>
      </div>
    `).join('');
  }

  function renderAttribution() {
    const target = $('#upzy-live-attribution');
    if (!target) return;
    const attribution = state.data?.attribution || [];
    if (!attribution.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay atribución por canal disponible.</div>';
      return;
    }

    target.innerHTML = attribution.map((item) => `
      <article class="upzy-card upzy-channel-card">
        <div class="upzy-card-header">
          <div class="upzy-card-title">Canal</div>
          <div class="upzy-card-icon"><i class="ti ti-chart-pie"></i></div>
        </div>
        <div class="upzy-channel-title">${item.channel}</div>
        <div class="upzy-channel-meta">${item.leads} leads · ${item.conversions} cerrados · ${item.conversion_rate}%</div>
        <div class="upzy-channel-revenue">${money(item.revenue)}</div>
      </article>
    `).join('');
  }

  function renderHealth() {
    const target = $('#upzy-live-module-health');
    if (!target) return;
    const health = state.data?.moduleHealth || [];
    target.innerHTML = `
      <div class="upzy-report-table-wrap">
        <table class="upzy-report-table">
          <thead><tr><th>Módulo</th><th>Estado</th><th>Detalle</th></tr></thead>
          <tbody>
            ${health.map((item) => `
              <tr>
                <td><strong>${item.module}</strong></td>
                <td><span class="upzy-health ${item.status === 'OK' ? 'ok' : 'warn'}">${item.status}</span></td>
                <td>${item.detail}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderEvents() {
    const target = $('#upzy-live-report-events');
    if (!target) return;
    const events = state.data?.events || [];
    if (!events.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay eventos recientes persistidos todavía.</div>';
      return;
    }

    target.innerHTML = events.map((event) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${event.event_type || 'event'}</span></div>
          <div class="upzy-list-meta">${event.source_module || 'module'} · ${event.entity_type || 'entity'} · ${event.entity_id || 'sin entidad'}</div>
        </div>
        <span class="upzy-time">${event.created_at ? new Date(event.created_at).toLocaleTimeString('es-CL') : 'ahora'}</span>
      </div>
    `).join('');
  }

  function renderWarnings() {
    const target = $('#upzy-live-report-warnings');
    if (!target) return;
    const warnings = state.data?.warnings || [];
    if (!warnings.length) {
      target.innerHTML = '<div class="upzy-live-empty">Sin warnings de fuentes. Todas las consultas respondieron correctamente.</div>';
      return;
    }

    target.innerHTML = warnings.map((warning) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${warning.table}</div>
          <div class="upzy-list-meta">${warning.warning}</div>
        </div>
        <span class="upzy-priority">Warning</span>
      </div>
    `).join('');
  }

  function renderAll() {
    renderStatus();
    renderMetrics();
    renderFunnel();
    renderAttribution();
    renderHealth();
    renderEvents();
    renderWarnings();
  }

  async function load() {
    state.status = 'loading';
    renderStatus();
    try {
      state.data = await api('/api/reports/overview');
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
