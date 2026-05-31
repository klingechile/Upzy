(function () {
  const $ = (selector) => document.querySelector(selector);

  const state = {
    source: 'mock',
    status: 'idle',
    error: null,
    carts: [],
  };

  const mockCarts = [
    { id: 'mock-cart-1', customer_name: 'Cliente Demo', customer_email: 'demo@cliente.cl', monto: 189990, checkout_url: '#', productos: [{ title: 'Panel LED 80x120', quantity: 1, price: 189990 }], recuperacion_estado: 'pendiente', created_at: new Date().toISOString() },
  ];

  function money(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
  }

  function dateLabel(value) {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleString('es-CL');
  }

  function getToken() {
    return sessionStorage.getItem('upzy_token');
  }

  async function api(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error('Sin token. Inicia sesión para cargar carritos reales.');

    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error || `Error HTTP ${res.status}`);
    return payload;
  }

  async function loadCarts() {
    setStatus('loading', null);
    try {
      const carts = await api('/api/carts/abandoned');
      state.source = 'live';
      state.status = 'live';
      state.error = null;
      state.carts = Array.isArray(carts) ? carts : [];
    } catch (error) {
      state.source = 'error';
      state.status = 'error';
      state.error = error;
      state.carts = mockCarts;
    }
    renderAll();
  }

  function setStatus(status, error) {
    state.status = status;
    state.error = error || null;
    renderStatus();
  }

  function renderStatus() {
    const target = $('#upzy-carts-live-status');
    if (!target) return;

    const live = state.status === 'live';
    const loading = state.status === 'loading';
    const error = state.status === 'error';
    const tone = live ? 'live' : error ? 'error' : 'fallback';
    const badge = live ? 'LIVE' : error ? 'ERROR/MOCK' : loading ? 'LOADING' : 'READY';
    const message = live
      ? 'Carritos cargados desde /api/carts/abandoned.'
      : error
        ? `${state.error?.message || 'Error desconocido'} · Mostrando fallback controlado.`
        : loading
          ? 'Consultando carritos reales protegidos por JWT...'
          : 'Listo para cargar carritos reales.';

    target.innerHTML = `
      <div class="upzy-live-banner ${tone}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Carritos Abandonados Live</div>
          <div class="upzy-live-detail">${message}</div>
        </div>
        <span class="upzy-badge ${live ? 'ok' : error ? 'hot' : 'warm'}">${badge}</span>
      </div>
    `;
  }

  function renderMetrics() {
    const target = $('#upzy-cart-live-metrics');
    if (!target) return;
    const total = state.carts.length;
    const amount = state.carts.reduce((acc, cart) => acc + Number(cart.monto || 0), 0);
    const withContact = state.carts.filter((cart) => cart.customer_email || cart.customer_phone).length;
    const pending = state.carts.filter((cart) => (cart.recuperacion_estado || 'pendiente') === 'pendiente').length;
    const metrics = [
      { label: 'Carritos', value: total, delta: 'abandonados/pending', tone: 'blue', icon: 'ti-shopping-cart' },
      { label: 'Monto potencial', value: money(amount), delta: 'oportunidad real', tone: 'green', icon: 'ti-cash' },
      { label: 'Con contacto', value: withContact, delta: 'email o teléfono', tone: 'orange', icon: 'ti-user-check' },
      { label: 'Pendientes', value: pending, delta: 'requieren acción', tone: 'red', icon: 'ti-alert-circle' },
    ];

    target.innerHTML = metrics.map((metric) => `
      <article class="upzy-card tone-${metric.tone}">
        <div class="upzy-card-header">
          <div class="upzy-card-title">${metric.label}</div>
          <div class="upzy-card-icon"><i class="ti ${metric.icon}"></i></div>
        </div>
        <div class="upzy-metric-value">${metric.value}</div>
        <div class="upzy-metric-delta">${metric.delta}</div>
      </article>
    `).join('');
  }

  function productLabel(cart) {
    const products = Array.isArray(cart.productos) ? cart.productos : [];
    if (!products.length) return 'Producto no disponible';
    return products.map((item) => `${item.title || item.name || 'Producto'} x${item.quantity || 1}`).join(', ');
  }

  function renderCarts() {
    const target = $('#upzy-live-carts-list');
    if (!target) return;

    if (!state.carts.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay carritos abandonados reales pendientes.</div>';
      return;
    }

    target.innerHTML = state.carts.map((cart) => `
      <article class="upzy-cart-item">
        <div>
          <div class="upzy-cart-customer">${cart.customer_name || 'Cliente sin nombre'}</div>
          <div class="upzy-cart-meta">${cart.id} · ${dateLabel(cart.created_at)}</div>
          <div class="upzy-cart-meta">${cart.customer_email || 'Sin email'} · ${cart.customer_phone || 'Sin teléfono'}</div>
        </div>
        <div>
          <div class="upzy-cart-product">${productLabel(cart)}</div>
          <div class="upzy-cart-meta"><span class="upzy-event-code">cart.abandoned_detected</span></div>
          ${cart.checkout_url ? `<div class="upzy-cart-meta"><a href="${cart.checkout_url}" target="_blank" rel="noopener" style="color:var(--upzy-cyan)">Abrir checkout</a></div>` : ''}
        </div>
        <div>
          <div class="upzy-cart-amount">${money(cart.monto)}</div>
          <div style="margin-top:8px"><span class="upzy-priority-badge high">${cart.recuperacion_estado || 'pendiente'}</span></div>
        </div>
        <div>
          <button class="upzy-filter-btn" data-cart-action="recuperado" data-cart-id="${cart.id}">Recuperado</button>
          <button class="upzy-filter-btn" data-cart-action="expirado" data-cart-id="${cart.id}" style="margin-top:8px">Expirado</button>
        </div>
      </article>
    `).join('');

    bindCartActions();
  }

  function renderEvents() {
    const target = $('#upzy-cart-live-events');
    if (!target) return;
    const items = [
      { time: 'Ahora', event: state.source === 'live' ? 'cart.live_loaded' : 'cart.mock_fallback', detail: `${state.carts.length} carritos renderizados.` },
      { time: 'Ahora', event: 'cart.endpoint_checked', detail: 'GET /api/carts/abandoned' },
      { time: 'Ahora', event: 'events.endpoint_ready', detail: 'POST /api/events disponible para base comercial.' },
    ];
    target.innerHTML = items.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.event}</span></div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function bindCartActions() {
    document.querySelectorAll('[data-cart-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.cartId;
        const status = button.dataset.cartAction;
        button.disabled = true;
        button.textContent = 'Guardando...';
        try {
          await api(`/api/carts/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          });
          await loadCarts();
        } catch (error) {
          state.status = 'error';
          state.error = error;
          renderStatus();
          button.disabled = false;
          button.textContent = status === 'recuperado' ? 'Recuperado' : 'Expirado';
        }
      });
    });
  }

  function renderAll() {
    renderStatus();
    renderMetrics();
    renderCarts();
    renderEvents();
  }

  document.addEventListener('DOMContentLoaded', loadCarts);
})();
