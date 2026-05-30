(function () {
  const $ = (selector) => document.querySelector(selector);

  function renderLumiMetrics() {
    const target = $('#upzy-lumi-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_LUMI_WEB.metrics.map((metric) => `
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

  function renderConversation() {
    const target = $('#upzy-lumi-conversation');
    if (!target) return;
    target.innerHTML = window.UPZY_LUMI_WEB.conversation.map((message) => `
      <div class="upzy-bubble ${message.role === 'bot' ? 'bot' : 'user'}">${message.text}</div>
    `).join('');
  }

  function renderUseCases() {
    const target = $('#upzy-lumi-usecases');
    if (!target) return;
    target.innerHTML = window.UPZY_LUMI_WEB.useCases.map((item) => `
      <article class="upzy-card upzy-lumi-usecase">
        <div class="upzy-card-header">
          <div class="upzy-card-title">Caso de uso</div>
          <div class="upzy-card-icon"><i class="ti ti-message-circle-question"></i></div>
        </div>
        <div class="upzy-lumi-usecase-title">${item.title}</div>
        <div class="upzy-lumi-usecase-intent">${item.intent}</div>
        <p class="upzy-empty-state">${item.detail}</p>
      </article>
    `).join('');
  }

  function renderLeadSummary() {
    const target = $('#upzy-lumi-summary');
    if (!target) return;
    const summary = window.UPZY_LUMI_WEB.leadSummary;
    const rows = [
      ['Nombre', summary.name],
      ['Email', summary.email],
      ['Teléfono', summary.phone],
      ['Tipo negocio', summary.businessType],
      ['Intención', summary.intent],
      ['Producto interés', summary.productInterest],
      ['Producto recomendado', summary.recommendedProduct],
      ['Temperatura', summary.commercialTemperature],
      ['Próxima acción', summary.nextBestAction],
      ['Resumen', summary.summary]
    ];
    target.innerHTML = rows.map(([label, value]) => `
      <div class="upzy-summary-row">
        <div class="upzy-summary-label">${label}</div>
        <div class="upzy-summary-value">${value}</div>
      </div>
    `).join('');
  }

  function renderRecommendations() {
    const target = $('#upzy-lumi-recommendations');
    if (!target) return;
    target.innerHTML = window.UPZY_LUMI_WEB.recommendations.map((item) => `
      <article class="upzy-card upzy-recommendation">
        <div class="upzy-card-header">
          <div class="upzy-card-title">Recomendación</div>
          <div class="upzy-card-icon"><i class="ti ti-bulb"></i></div>
        </div>
        <div class="upzy-recommendation-product">${item.product}</div>
        <div class="upzy-recommendation-fit">${item.fit}</div>
        <p class="upzy-empty-state">${item.reason}</p>
      </article>
    `).join('');
  }

  function renderLumiEvents() {
    const target = $('#upzy-lumi-events');
    if (!target) return;
    target.innerHTML = window.UPZY_LUMI_WEB.events.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.event}</span></div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function renderLumiContract() {
    const target = $('#upzy-lumi-contract');
    if (!target) return;
    target.innerHTML = window.UPZY_LUMI_WEB.contract.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function bootLumiWeb() {
    renderLumiMetrics();
    renderConversation();
    renderUseCases();
    renderLeadSummary();
    renderRecommendations();
    renderLumiEvents();
    renderLumiContract();
  }

  document.addEventListener('DOMContentLoaded', bootLumiWeb);
})();
