(function () {
  const state = {
    activeModule: 'core'
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function renderMetrics() {
    const target = $('#upzy-metrics');
    if (!target) return;

    target.innerHTML = window.UPZY_MOCKS.metrics.map((metric) => `
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

  function renderModules() {
    const target = $('#upzy-modules');
    if (!target) return;

    target.innerHTML = window.UPZY_MOCKS.modules.map((module) => `
      <article class="upzy-card upzy-module-card" data-module-card="${module.id}">
        <div class="upzy-module-top">
          <div class="upzy-card-icon"><i class="ti ${module.icon}"></i></div>
          <span class="upzy-status">${module.status}</span>
        </div>
        <div>
          <div class="upzy-module-name">${module.name}</div>
          <p class="upzy-module-desc">${module.description}</p>
        </div>
      </article>
    `).join('');
  }

  function renderRoadmap() {
    const target = $('#upzy-roadmap');
    if (!target) return;

    target.innerHTML = window.UPZY_MOCKS.roadmap.map((item) => `
      <div class="upzy-roadmap-item">
        <div class="upzy-roadmap-sprint">${item.sprint}</div>
        <div>
          <div class="upzy-roadmap-title">${item.title}</div>
          <div class="upzy-roadmap-outcome">${item.outcome}</div>
        </div>
      </div>
    `).join('');
  }

  function setActiveModule(moduleId) {
    state.activeModule = moduleId;
    const module = window.UPZY_MOCKS.modules.find((item) => item.id === moduleId) || window.UPZY_MOCKS.modules[0];

    $$('.upzy-nav-btn').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.module === moduleId);
    });

    const title = $('#upzy-page-title');
    const kicker = $('#upzy-page-kicker');
    const detail = $('#upzy-module-detail');

    if (title) title.textContent = module.name;
    if (kicker) kicker.textContent = `${module.status} · ${module.description}`;
    if (detail) {
      detail.innerHTML = `
        <div class="upzy-card-header">
          <div>
            <div class="upzy-card-title">Módulo seleccionado</div>
            <h2 style="margin:8px 0 0;font-size:26px;letter-spacing:-.04em">${module.name}</h2>
          </div>
          <div class="upzy-card-icon"><i class="ti ${module.icon}"></i></div>
        </div>
        <p class="upzy-empty-state">${module.description}</p>
        <div class="upzy-roadmap-item" style="margin-top:16px">
          <div class="upzy-roadmap-sprint">Estado</div>
          <div>
            <div class="upzy-roadmap-title">${module.status}</div>
            <div class="upzy-roadmap-outcome">En Sprint 0 esta sección funciona como contrato visual. La integración real se implementa cuando corresponda en el roadmap.</div>
          </div>
        </div>
      `;
    }
  }

  function bindNavigation() {
    $$('.upzy-nav-btn').forEach((button) => {
      button.addEventListener('click', () => setActiveModule(button.dataset.module));
    });
  }

  function boot() {
    renderMetrics();
    renderModules();
    renderRoadmap();
    bindNavigation();
    setActiveModule(state.activeModule);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
