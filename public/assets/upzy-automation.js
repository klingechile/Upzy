(function () {
  const $ = (selector) => document.querySelector(selector);

  function renderAutomationMetrics() {
    const target = $('#upzy-auto-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_AUTOMATION.metrics.map((metric) => `
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

  function renderFlows() {
    const target = $('#upzy-auto-flows');
    if (!target) return;
    target.innerHTML = window.UPZY_AUTOMATION.flows.map((flow) => `
      <article class="upzy-flow-item">
        <div>
          <div class="upzy-flow-name">${flow.name}</div>
          <div class="upzy-flow-meta">${flow.id} · ${flow.sourceModule}</div>
          <div class="upzy-flow-meta"><span class="upzy-auto-code">${flow.trigger}</span></div>
        </div>
        <div>
          <div class="upzy-flow-meta"><strong>Condición:</strong> ${flow.condition}</div>
          <div class="upzy-flow-meta"><strong>Acción:</strong> ${flow.action}</div>
        </div>
        <div>
          <span class="upzy-status-pill ${flow.status}">${flow.status}</span>
          <div class="upzy-flow-meta">${flow.executions} ejecuciones</div>
        </div>
        <div>
          <div class="upzy-cart-amount">${flow.success}</div>
          <div class="upzy-flow-meta">${flow.revenue}</div>
        </div>
      </article>
    `).join('');
  }

  function renderBuilder() {
    const target = $('#upzy-auto-builder');
    if (!target) return;
    const builder = window.UPZY_AUTOMATION.builder;
    target.innerHTML = `
      <div class="upzy-builder-step">
        <div class="upzy-builder-kicker">Trigger</div>
        <div class="upzy-builder-title">${builder.trigger.title}</div>
        <div class="upzy-builder-detail"><span class="upzy-auto-code">${builder.trigger.value}</span> · ${builder.trigger.module}</div>
        <div class="upzy-builder-detail">${builder.trigger.detail}</div>
      </div>
      <div class="upzy-builder-step">
        <div class="upzy-builder-kicker">Condiciones</div>
        <div class="upzy-condition-grid">
          ${builder.conditions.map((condition) => `
            <div class="upzy-condition">
              <span>${condition.field}</span>
              <span>${condition.operator}</span>
              <span>${condition.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="upzy-builder-step">
        <div class="upzy-builder-kicker">Acciones</div>
        <div class="upzy-action-grid">
          ${builder.actions.map((action) => `
            <div class="upzy-action">
              <span class="upzy-auto-code">${action.type}</span>
              <span>${action.label} · ${action.targetModule}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderTimeline() {
    const target = $('#upzy-auto-timeline');
    if (!target) return;
    target.innerHTML = window.UPZY_AUTOMATION.timeline.map((item) => `
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
    const target = $('#upzy-auto-contract');
    if (!target) return;
    target.innerHTML = window.UPZY_AUTOMATION.contract.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function bootAutomation() {
    renderAutomationMetrics();
    renderFlows();
    renderBuilder();
    renderTimeline();
    renderContract();
  }

  document.addEventListener('DOMContentLoaded', bootAutomation);
})();
