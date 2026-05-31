(function () {
  const $ = (selector) => document.querySelector(selector);

  const state = {
    status: 'loading',
    error: null,
    emailMetrics: null,
    templates: [],
    flows: [],
    automations: null,
    cartRecovery: null,
    events: [],
  };

  function token() {
    return sessionStorage.getItem('upzy_token');
  }

  async function api(path, options = {}) {
    const auth = token();
    if (!auth) throw new Error('Sin sesión activa. Inicia sesión para cargar datos reales.');

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

  function money(value) {
    const number = Number(value || 0);
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(number);
  }

  function renderStatus() {
    const target = $('#upzy-email-auto-status');
    if (!target) return;
    const live = state.status === 'live';
    const error = state.status === 'error';
    const tone = live ? 'live' : error ? 'error' : 'fallback';
    const badge = live ? 'LIVE' : error ? 'ERROR' : 'LOADING';
    const message = live
      ? 'Email, automatizaciones y eventos cargados desde backend protegido.'
      : error
        ? `${state.error?.message || 'Error desconocido'} · La vista queda disponible con datos parciales.`
        : 'Consultando métricas, plantillas, automatizaciones y eventos...';

    target.innerHTML = `
      <div class="upzy-live-banner ${tone}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Email + Automatizaciones Live</div>
          <div class="upzy-live-detail">${message}</div>
        </div>
        <span class="upzy-badge ${live ? 'ok' : error ? 'hot' : 'warm'}">${badge}</span>
      </div>
    `;
  }

  function renderMetrics() {
    const target = $('#upzy-email-auto-metrics');
    if (!target) return;
    const metrics = state.emailMetrics?.metrics || {};
    const totals = state.emailMetrics?.totales || {};
    const cartStats = state.cartRecovery?.stats || {};
    const cards = [
      { label: 'Emails enviados', value: metrics.sent || totals.enviados || 0, delta: 'email marketing', tone: 'blue', icon: 'ti-mail-check' },
      { label: 'Clicks', value: metrics.clicks || totals.clicks || 0, delta: 'interacción real', tone: 'green', icon: 'ti-click' },
      { label: 'Carritos recuperados', value: metrics.recovered_carts || totals.carritos_recuperados || cartStats.recuperados || 0, delta: 'recovery', tone: 'orange', icon: 'ti-shopping-cart-check' },
      { label: 'Revenue atribuido', value: money(metrics.attributed_revenue || totals.revenue_atribuido || cartStats.revenue || 0), delta: 'email + automation', tone: 'purple', icon: 'ti-cash' },
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

  function renderTemplates() {
    const target = $('#upzy-live-email-templates');
    if (!target) return;
    const templates = Array.isArray(state.templates?.templates) ? state.templates.templates : Array.isArray(state.templates) ? state.templates : [];
    if (!templates.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay plantillas email disponibles o la API devolvió vacío.</div>';
      return;
    }

    target.innerHTML = templates.slice(0, 8).map((tpl) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${tpl.name || tpl.nombre || 'Plantilla sin nombre'}</div>
          <div class="upzy-list-meta">${tpl.category || tpl.categoria || 'general'} · ${tpl.channel || tpl.canal || 'email'}</div>
        </div>
        <span class="upzy-priority">${tpl.activo === false ? 'Pausada' : 'Activa'}</span>
      </div>
    `).join('');
  }

  function renderFlows() {
    const target = $('#upzy-live-email-flows');
    if (!target) return;
    const flows = Array.isArray(state.flows?.flows) ? state.flows.flows : [];
    if (!flows.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay flows email disponibles.</div>';
      return;
    }

    target.innerHTML = flows.slice(0, 6).map((flow) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${flow.name || flow.nombre || flow.id}</div>
          <div class="upzy-list-meta">${flow.description || flow.descripcion || 'Flujo email marketing'}</div>
        </div>
        <span class="upzy-time">${flow.id || 'flow'}</span>
      </div>
    `).join('');
  }

  function renderAutomations() {
    const target = $('#upzy-live-automations');
    if (!target) return;
    const defaults = state.automations?.defaults || [];
    const custom = state.automations?.personalizados || [];
    const items = [...defaults, ...custom];
    if (!items.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay automatizaciones disponibles.</div>';
      return;
    }

    target.innerHTML = items.slice(0, 8).map((flow) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${flow.nombre || flow.name || flow.id}</div>
          <div class="upzy-list-meta"><span class="upzy-event-code">${flow.trigger || 'sin_trigger'}</span> · ${flow.canal || 'canal'}</div>
        </div>
        <span class="upzy-priority">${flow.activo === false ? 'Pausada' : 'Activa'}</span>
      </div>
    `).join('');
  }

  function renderCartRecovery() {
    const target = $('#upzy-cart-recovery-state');
    if (!target) return;
    const setting = state.cartRecovery || {};
    target.innerHTML = `
      <div class="upzy-state-box">
        <div class="upzy-state-title">Recuperación de carrito</div>
        <div class="upzy-state-text">Estado: ${setting.activo === false ? 'Pausada' : 'Activa'}</div>
        <div class="upzy-state-text">Shopify: ${setting.shopify?.enabled ? 'habilitado' : 'no habilitado'} · Email: ${setting.channels?.email ? 'habilitado' : 'no habilitado'} · WhatsApp: ${setting.channels?.whatsapp ? 'habilitado' : 'no habilitado'}</div>
      </div>
    `;
  }

  function renderEvents() {
    const target = $('#upzy-live-events');
    if (!target) return;
    const events = state.events?.events || [];
    if (!events.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay eventos comerciales persistidos todavía. POST /api/events ya está disponible.</div>';
      return;
    }

    target.innerHTML = events.slice(0, 12).map((event) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${event.event_type || 'event'}</span></div>
          <div class="upzy-list-meta">${event.source_module || 'module'} · ${event.entity_type || 'entity'} · ${event.entity_id || 'sin entidad'}</div>
        </div>
        <span class="upzy-time">${event.created_at ? new Date(event.created_at).toLocaleTimeString('es-CL') : 'ahora'}</span>
      </div>
    `).join('');
  }

  async function runCartRecovery() {
    const button = $('#upzy-run-cart-recovery');
    if (button) {
      button.disabled = true;
      button.textContent = 'Ejecutando...';
    }
    try {
      await api('/api/automations/cart-recovery/run', { method: 'POST', body: JSON.stringify({}) });
      await loadData();
    } catch (error) {
      state.status = 'error';
      state.error = error;
      renderStatus();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Ejecutar revisión de carritos';
      }
    }
  }

  function bindActions() {
    const run = $('#upzy-run-cart-recovery');
    if (run) run.addEventListener('click', runCartRecovery);
  }

  async function loadData() {
    state.status = 'loading';
    renderStatus();
    try {
      const [emailMetrics, templates, flows, automations, cartRecovery, events] = await Promise.all([
        api('/api/email/metrics'),
        api('/api/email/templates'),
        api('/api/email/flows'),
        api('/api/automations'),
        api('/api/automations/cart-recovery'),
        api('/api/events?limit=30'),
      ]);
      state.emailMetrics = emailMetrics;
      state.templates = templates;
      state.flows = flows;
      state.automations = automations;
      state.cartRecovery = cartRecovery;
      state.events = events;
      state.status = 'live';
      state.error = null;
    } catch (error) {
      state.status = 'error';
      state.error = error;
    }
    renderAll();
  }

  function renderAll() {
    renderStatus();
    renderMetrics();
    renderTemplates();
    renderFlows();
    renderAutomations();
    renderCartRecovery();
    renderEvents();
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindActions();
    loadData();
  });
})();
