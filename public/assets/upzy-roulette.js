(function () {
  const $ = (selector) => document.querySelector(selector);

  function renderRouletteMetrics() {
    const target = $('#upzy-roulette-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.rouletteMetrics.map((metric) => `
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

  function renderPrizes() {
    const target = $('#upzy-roulette-prizes');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.roulettePrizes.map((prize) => `
      <article class="upzy-card upzy-prize-card tone-${prize.color}">
        <div class="upzy-card-header">
          <div class="upzy-card-title">Premio</div>
          <div class="upzy-card-icon"><i class="ti ti-gift"></i></div>
        </div>
        <div class="upzy-prize-label">${prize.label}</div>
        <div class="upzy-prize-meta">Tipo: ${prize.type} · Evento: <span class="upzy-event-code">${prize.event}</span></div>
        <div class="upzy-prize-prob">Probabilidad ${prize.probability}</div>
      </article>
    `).join('');
  }

  function renderRules() {
    const target = $('#upzy-roulette-rules');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.rouletteRules.map((rule) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${rule.title}</div>
          <div class="upzy-list-meta">${rule.detail}</div>
        </div>
        <span class="upzy-priority">Regla</span>
      </div>
    `).join('');
  }

  function renderCouponContract() {
    const target = $('#upzy-roulette-contract');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.rouletteCouponContract.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function renderRouletteEvents() {
    const target = $('#upzy-roulette-events');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.rouletteEvents.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.event}</span></div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function bootRoulette() {
    renderRouletteMetrics();
    renderPrizes();
    renderRules();
    renderCouponContract();
    renderRouletteEvents();
  }

  document.addEventListener('DOMContentLoaded', bootRoulette);
})();
