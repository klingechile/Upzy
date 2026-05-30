(function () {
  const $ = (selector) => document.querySelector(selector);

  function renderCartMetrics() {
    const target = $('#upzy-cart-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_CARTS.metrics.map((metric) => `
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

  function renderCartList() {
    const target = $('#upzy-cart-list');
    if (!target) return;
    target.innerHTML = window.UPZY_CARTS.carts.map((cart) => `
      <article class="upzy-cart-item">
        <div>
          <div class="upzy-cart-customer">${cart.customerName}</div>
          <div class="upzy-cart-meta">${cart.id} · ${cart.source} · ${cart.lastActivityAt}</div>
          <div class="upzy-cart-meta">${cart.email || 'Sin email'} · ${cart.phone || 'Sin teléfono'}</div>
        </div>
        <div>
          <div class="upzy-cart-product">${cart.product}</div>
          <div class="upzy-cart-meta">${cart.variant} · Cantidad ${cart.quantity}</div>
          <div class="upzy-cart-meta"><span class="upzy-event-code">${cart.event}</span></div>
        </div>
        <div>
          <div class="upzy-cart-amount">${cart.amount}</div>
          <div style="margin-top:8px"><span class="upzy-priority-badge ${cart.priority}">${cart.priority}</span></div>
        </div>
        <div>
          <span class="upzy-status-badge">${cart.status}</span>
          <div class="upzy-cart-meta">${cart.recoveryStep}</div>
        </div>
      </article>
    `).join('');
  }

  function renderCartSequence() {
    const target = $('#upzy-cart-sequence');
    if (!target) return;
    target.innerHTML = window.UPZY_CARTS.sequence.map((step) => `
      <div class="upzy-cart-step">
        <div class="upzy-cart-step-time">${step.step}</div>
        <div>
          <div class="upzy-cart-step-title">${step.title}</div>
          <div class="upzy-cart-step-detail"><span class="upzy-event-code">${step.event}</span> · ${step.objective}</div>
        </div>
        <span class="upzy-priority">${step.channel}</span>
      </div>
    `).join('');
  }

  function renderCartEvents() {
    const target = $('#upzy-cart-events');
    if (!target) return;
    target.innerHTML = window.UPZY_CARTS.events.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.event}</span></div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function renderCartContract() {
    const target = $('#upzy-cart-contract');
    if (!target) return;
    target.innerHTML = window.UPZY_CARTS.contract.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function bootCarts() {
    renderCartMetrics();
    renderCartList();
    renderCartSequence();
    renderCartEvents();
    renderCartContract();
  }

  document.addEventListener('DOMContentLoaded', bootCarts);
})();
