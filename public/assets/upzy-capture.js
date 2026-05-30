(function () {
  const $ = (selector) => document.querySelector(selector);

  function renderCaptureMetrics() {
    const target = $('#upzy-capture-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.captureMetrics.map((metric) => `
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

  function renderCaptureTemplates() {
    const target = $('#upzy-capture-templates');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.captureTemplates.map((template) => `
      <article class="upzy-card upzy-capture-template">
        <div class="upzy-capture-template-head">
          <div>
            <div class="upzy-capture-type">${template.type}</div>
            <div class="upzy-capture-name">${template.name}</div>
          </div>
          <span class="upzy-status">${template.status}</span>
        </div>
        <div class="upzy-capture-copy"><strong>Trigger:</strong> ${template.trigger}</div>
        <div class="upzy-capture-copy"><strong>Objetivo:</strong> ${template.goal}</div>
        <div class="upzy-capture-copy"><strong>Evento:</strong> <span class="upzy-event-code">${template.event}</span></div>
        <div class="upzy-capture-fields">
          ${template.fields.map((field) => `<span class="upzy-chip">${field}</span>`).join('')}
        </div>
        <button class="upzy-form-button" type="button">${template.cta}</button>
      </article>
    `).join('');
  }

  function renderCaptureFields() {
    const target = $('#upzy-capture-fields');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.captureFields.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function renderCaptureEvents() {
    const target = $('#upzy-capture-events');
    if (!target) return;
    target.innerHTML = window.UPZY_MOCKS.captureEvents.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><span class="upzy-event-code">${item.event}</span></div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function bootCapture() {
    renderCaptureMetrics();
    renderCaptureTemplates();
    renderCaptureFields();
    renderCaptureEvents();
  }

  document.addEventListener('DOMContentLoaded', bootCapture);
})();
