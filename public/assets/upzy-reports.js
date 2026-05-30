(function () {
  const $ = (selector) => document.querySelector(selector);

  function renderReportMetrics() {
    const target = $('#upzy-report-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_REPORTS.metrics.map((metric) => `
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

  function renderFunnel() {
    const target = $('#upzy-report-funnel');
    if (!target) return;
    target.innerHTML = window.UPZY_REPORTS.funnel.map((stage) => `
      <div class="upzy-funnel-row">
        <div>
          <div class="upzy-funnel-name">${stage.stage}</div>
          <div class="upzy-funnel-meta">${stage.count.toLocaleString('es-CL')} registros</div>
        </div>
        <div class="upzy-bar"><span style="--value:${Math.max(stage.conversion, 3)}%"></span></div>
        <div><strong>${stage.conversion}%</strong></div>
        <div><strong>${stage.value}</strong></div>
      </div>
    `).join('');
  }

  function renderAttribution() {
    const target = $('#upzy-report-attribution');
    if (!target) return;
    target.innerHTML = window.UPZY_REPORTS.attribution.map((item) => `
      <article class="upzy-card upzy-channel-card">
        <div class="upzy-card-header">
          <div class="upzy-card-title">Canal</div>
          <div class="upzy-card-icon"><i class="ti ti-chart-pie"></i></div>
        </div>
        <div class="upzy-channel-title">${item.channel}</div>
        <div class="upzy-channel-meta">${item.leads} leads · ${item.conversions} conversiones · ${item.rate}</div>
        <div class="upzy-channel-revenue">${item.revenue}</div>
      </article>
    `).join('');
  }

  function renderModules() {
    const target = $('#upzy-report-modules');
    if (!target) return;
    target.innerHTML = `
      <div class="upzy-report-table-wrap">
        <table class="upzy-report-table">
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Eventos</th>
              <th>Conversiones</th>
              <th>Revenue</th>
              <th>Salud</th>
            </tr>
          </thead>
          <tbody>
            ${window.UPZY_REPORTS.modules.map((item) => `
              <tr>
                <td><strong>${item.module}</strong></td>
                <td>${item.events}</td>
                <td>${item.conversions}</td>
                <td><strong>${item.revenue}</strong></td>
                <td><span class="upzy-health ${item.health === 'OK' ? 'ok' : 'warn'}">${item.health}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderAutomations() {
    const target = $('#upzy-report-automations');
    if (!target) return;
    target.innerHTML = `
      <div class="upzy-report-table-wrap">
        <table class="upzy-report-table">
          <thead>
            <tr>
              <th>Automatización</th>
              <th>Disparadas</th>
              <th>Completadas</th>
              <th>Fallidas</th>
              <th>Revenue</th>
              <th>Éxito</th>
            </tr>
          </thead>
          <tbody>
            ${window.UPZY_REPORTS.automations.map((item) => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.triggered}</td>
                <td>${item.completed}</td>
                <td>${item.failed}</td>
                <td><strong>${item.revenue}</strong></td>
                <td>${item.rate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderEvents() {
    const target = $('#upzy-report-events');
    if (!target) return;
    target.innerHTML = window.UPZY_REPORTS.events.map((item) => `
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
    const target = $('#upzy-report-contract');
    if (!target) return;
    target.innerHTML = window.UPZY_REPORTS.contract.map((field) => `
      <div class="upzy-field-row">
        <div class="upzy-field-name">${field.name}</div>
        <span class="upzy-chip ${field.required ? 'required' : ''}">${field.required ? 'Requerido' : 'Opcional'}</span>
        <div class="upzy-field-reason">${field.reason}</div>
      </div>
    `).join('');
  }

  function bootReports() {
    renderReportMetrics();
    renderFunnel();
    renderAttribution();
    renderModules();
    renderAutomations();
    renderEvents();
    renderContract();
  }

  document.addEventListener('DOMContentLoaded', bootReports);
})();
