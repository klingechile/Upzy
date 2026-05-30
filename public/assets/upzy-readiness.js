(function () {
  const $ = (selector) => document.querySelector(selector);
  const cls = (value) => String(value || '').toLowerCase().replace(/\s+/g, '-');

  function renderMetrics() {
    const target = $('#upzy-ready-metrics');
    if (!target) return;
    target.innerHTML = window.UPZY_READINESS.metrics.map((metric) => `
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

  function renderWaves() {
    const target = $('#upzy-ready-waves');
    if (!target) return;
    target.innerHTML = window.UPZY_READINESS.waves.map((wave) => `
      <article class="upzy-wave-card">
        <div class="upzy-wave-code">${wave.wave}</div>
        <div>
          <div class="upzy-wave-title">${wave.title}</div>
          <div class="upzy-wave-detail">${wave.goal}</div>
        </div>
        <span class="upzy-ready-pill ${cls(wave.status)}">${wave.status}</span>
      </article>
    `).join('');
  }

  function renderModules() {
    const target = $('#upzy-ready-modules');
    if (!target) return;
    target.innerHTML = `
      <div class="upzy-ready-table-wrap">
        <table class="upzy-ready-table">
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Readiness</th>
              <th>Oleada</th>
              <th>Estado</th>
              <th>Endpoint / recurso</th>
            </tr>
          </thead>
          <tbody>
            ${window.UPZY_READINESS.modules.map((item) => `
              <tr>
                <td><strong>${item.module}</strong></td>
                <td><span class="upzy-ready-pill ${cls(item.readiness)}">${item.readiness}</span></td>
                <td>${item.dbWave}</td>
                <td>${item.status}</td>
                <td><span class="upzy-endpoint-code">${item.endpoint}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderChecklist() {
    const target = $('#upzy-ready-checklist');
    if (!target) return;
    target.innerHTML = window.UPZY_READINESS.checklist.map((item) => `
      <div class="upzy-check-item">
        <div class="upzy-item-title">${item.item}</div>
        <span class="upzy-ready-pill ${cls(item.status)}">${item.status}</span>
      </div>
    `).join('');
  }

  function renderEndpoints() {
    const target = $('#upzy-ready-endpoints');
    if (!target) return;
    target.innerHTML = `
      <div class="upzy-ready-table-wrap">
        <table class="upzy-ready-table">
          <thead>
            <tr>
              <th>Método</th>
              <th>Ruta</th>
              <th>Módulo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${window.UPZY_READINESS.endpoints.map((item) => `
              <tr>
                <td><strong>${item.method}</strong></td>
                <td><span class="upzy-endpoint-code">${item.path}</span></td>
                <td>${item.module}</td>
                <td><span class="upzy-ready-pill ok">${item.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRisks() {
    const target = $('#upzy-ready-risks');
    if (!target) return;
    target.innerHTML = window.UPZY_READINESS.risks.map((risk) => `
      <div class="upzy-risk-item">
        <span class="upzy-ready-pill ${cls(risk.level)}">${risk.level}</span>
        <div>
          <div class="upzy-item-title">${risk.title}</div>
          <div class="upzy-item-detail">${risk.detail}</div>
        </div>
      </div>
    `).join('');
  }

  function renderGoNoGo() {
    const target = $('#upzy-ready-gonogo');
    if (!target) return;
    target.innerHTML = window.UPZY_READINESS.goNoGo.map((rule) => `
      <div class="upzy-go-item">
        <span class="upzy-ready-pill ${cls(rule.type)}">${rule.type}</span>
        <div class="upzy-item-title">${rule.rule}</div>
      </div>
    `).join('');
  }

  function bootReadiness() {
    renderMetrics();
    renderWaves();
    renderModules();
    renderChecklist();
    renderEndpoints();
    renderRisks();
    renderGoNoGo();
  }

  document.addEventListener('DOMContentLoaded', bootReadiness);
})();
