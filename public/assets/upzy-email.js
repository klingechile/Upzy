(function () {
  const $ = (selector) => document.querySelector(selector);

  function renderEmailMetrics() {
    const target = $('#upzy-email-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.emailMetrics.map((metric) => `
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

  function renderSegments() {
    const target = $('#upzy-email-segments');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.emailSegments.map((segment) => `
      <article class="upzy-card upzy-email-card">
        <div class="upzy-card-header">
          <div class="upzy-card-title">Segmento</div>
          <div class="upzy-card-icon"><i class="ti ti-users-group"></i></div>
        </div>
        <div class="upzy-email-card-name">${segment.name}</div>
        <div class="upzy-email-card-meta"><strong>Origen:</strong> ${segment.source}</div>
        <div class="upzy-email-card-meta"><strong>Trigger:</strong> <span class="upzy-email-trigger">${segment.trigger}</span></div>
        <div class="upzy-email-card-meta">${segment.goal}</div>
        <div class="upzy-email-size">${segment.size} contactos</div>
      </article>
    `).join('');
  }

  function renderTemplates() {
    const target = $('#upzy-email-templates');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.emailTemplates.map((template) => `
      <article class="upzy-card upzy-email-card">
        <div class="upzy-card-header">
          <div class="upzy-card-title">Plantilla</div>
          <div class="upzy-card-icon"><i class="ti ti-template"></i></div>
        </div>
        <div class="upzy-email-card-name">${template.name}</div>
        <div class="upzy-email-card-meta"><strong>Trigger:</strong> <span class="upzy-email-trigger">${template.trigger}</span></div>
        <div class="upzy-email-card-meta"><strong>Asunto:</strong> ${template.subject}</div>
        <div class="upzy-email-card-meta"><strong>Preheader:</strong> ${template.preheader}</div>
        <div class="upzy-variable-list">
          ${template.variables.map((variable) => `<span class="upzy-chip">${variable}</span>`).join('')}
        </div>
        <button class="upzy-form-button" type="button">${template.cta}</button>
      </article>
    `).join('');
  }

  function renderSequence() {
    const target = $('#upzy-email-sequence');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.emailSequences.map((step) => `
      <div class="upzy-sequence-step">
        <div class="upzy-sequence-day">${step.step}</div>
        <div>
          <div class="upzy-sequence-title">${step.title}</div>
          <div class="upzy-sequence-meta"><span class="upzy-email-trigger">${step.event}</span> · ${step.objective}</div>
        </div>
        <span class="upzy-priority">${step.channel}</span>
      </div>
    `).join('');
  }

  function renderEmailEvents() {
    const target = $('#upzy-email-events');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.emailEvents.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.event}</span></div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function renderCampaignContract() {
    const target = $('#upzy-email-contract');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.emailCampaignContract.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function bootEmail() {
    renderEmailMetrics();
    renderSegments();
    renderTemplates();
    renderSequence();
    renderEmailEvents();
    renderCampaignContract();
  }

  document.addEventListener('DOMContentLoaded', bootEmail);
})();
