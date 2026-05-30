(function () {
  const $ = (selector) => document.querySelector(selector);

  function toneClass(value) {
    return String(value || '').toLowerCase();
  }

  function renderOmniMetrics() {
    const target = $('#upzy-omni-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_OMNICHANNEL.metrics.map((metric) => `
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

  function renderInbox() {
    const target = $('#upzy-omni-inbox');
    if (!target) return;
    target.innerHTML = window.UPZY_OMNICHANNEL.inbox.map((item) => `
      <article class="upzy-inbox-item">
        <div class="upzy-inbox-top">
          <div>
            <div class="upzy-inbox-name">${item.customerName}</div>
            <div class="upzy-inbox-meta">${item.id} · ${item.handle} · ${item.updatedAt}</div>
          </div>
          <span class="upzy-channel-badge ${item.channel}">${item.channel}</span>
        </div>
        <div class="upzy-message-preview">${item.lastMessage}</div>
        <div class="upzy-inbox-meta"><span class="upzy-intent">${item.intent}</span> · ${item.productInterest}</div>
        <div>
          <span class="upzy-badge ${toneClass(item.commercialTemperature)}">${item.commercialTemperature}</span>
          <span class="upzy-status-badge" style="margin-left:8px">${item.status}</span>
        </div>
        <div class="upzy-next-action">${item.nextBestAction}</div>
      </article>
    `).join('');
  }

  function renderConversation() {
    const target = $('#upzy-ig-conversation');
    if (!target) return;
    target.innerHTML = window.UPZY_OMNICHANNEL.instagramConversation.map((message) => `
      <div class="upzy-ig-bubble ${message.role === 'lumi' ? 'lumi' : 'customer'}">${message.text}</div>
    `).join('');
  }

  function renderLeadMatch() {
    const target = $('#upzy-lead-match');
    if (!target) return;
    const match = window.UPZY_OMNICHANNEL.leadMatch;
    const rows = [
      ['Estado', match.status],
      ['Confianza', match.confidence],
      ['Lead ID', match.leadId],
      ['Coincidencia', match.matchedBy],
      ['Cliente', match.customerName],
      ['Contacto', match.contact],
      ['Temperatura', match.commercialTemperature],
      ['Próxima acción', match.nextBestAction],
      ['Resumen', match.summary]
    ];
    target.innerHTML = rows.map(([label, value]) => `
      <div class="upzy-match-row">
        <div class="upzy-match-label">${label}</div>
        <div class="upzy-match-value">${value}</div>
      </div>
    `).join('');
  }

  function renderActions() {
    const target = $('#upzy-omni-actions');
    if (!target) return;
    target.innerHTML = window.UPZY_OMNICHANNEL.actions.map((action) => `
      <article class="upzy-card upzy-action-card">
        <div class="upzy-card-header">
          <div class="upzy-card-title">${action.channel}</div>
          <div class="upzy-card-icon"><i class="ti ti-route"></i></div>
        </div>
        <div class="upzy-action-title">${action.title}</div>
        <div class="upzy-inbox-meta"><span class="upzy-event-code">${action.event}</span></div>
        <p class="upzy-empty-state">${action.detail}</p>
      </article>
    `).join('');
  }

  function renderEvents() {
    const target = $('#upzy-omni-events');
    if (!target) return;
    target.innerHTML = window.UPZY_OMNICHANNEL.events.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.event}</span></div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function renderContract() {
    const target = $('#upzy-omni-contract');
    if (!target) return;
    target.innerHTML = window.UPZY_OMNICHANNEL.contract.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function bootOmnichannel() {
    renderOmniMetrics();
    renderInbox();
    renderConversation();
    renderLeadMatch();
    renderActions();
    renderEvents();
    renderContract();
  }

  document.addEventListener('DOMContentLoaded', bootOmnichannel);
})();
