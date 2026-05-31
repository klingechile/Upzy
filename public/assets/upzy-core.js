(function () {
  const state = {
    activeModule: 'crm',
    leadFilter: 'ALL'
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function pageContext() {
    return document.body?.dataset || {};
  }

  function isLivePageModule(moduleId) {
    const ctx = pageContext();
    return Boolean(ctx.upzyLiveModule && ctx.upzyLiveModule === moduleId);
  }

  function segmentClass(segment) {
    return String(segment || '').toLowerCase();
  }

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

  function renderFunnel() {
    const target = $('#upzy-funnel');
    if (!target) return;

    target.innerHTML = window.UPZY_MOCKS.crm.funnel.map((stage) => `
      <article class="upzy-funnel-card">
        <div class="upzy-funnel-stage">${stage.stage}</div>
        <div class="upzy-funnel-count">${stage.count}</div>
        <div class="upzy-funnel-value">${stage.value} · ${stage.conversion}%</div>
        <div class="upzy-progress"><span style="--value:${stage.conversion}%"></span></div>
      </article>
    `).join('');
  }

  function renderLeads() {
    const target = $('#upzy-leads-table');
    if (!target) return;

    const leads = window.UPZY_MOCKS.leads.filter((lead) => {
      return state.leadFilter === 'ALL' || lead.segmento === state.leadFilter;
    });

    target.innerHTML = `
      <div class="upzy-table-wrap">
        <table class="upzy-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Canal</th>
              <th>Etapa</th>
              <th>Termómetro</th>
              <th>Producto</th>
              <th>Monto</th>
              <th>Próxima mejor acción</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map((lead) => {
              const tone = segmentClass(lead.segmento);
              return `
                <tr>
                  <td>
                    <div class="upzy-lead-name">${lead.nombre}</div>
                    <div class="upzy-lead-meta">${lead.empresa} · ${lead.id}</div>
                  </td>
                  <td><span class="upzy-channel">${lead.canal}</span><div class="upzy-lead-meta">${lead.ultima_interaccion}</div></td>
                  <td>${lead.etapa}</td>
                  <td>
                    <span class="upzy-badge ${tone}">${lead.segmento}</span>
                    <div class="upzy-score ${tone}" style="margin-top:8px">
                      <div class="upzy-score-bar"><span style="--score:${lead.score}%"></span></div>
                      <strong>${lead.score}</strong>
                    </div>
                  </td>
                  <td>${lead.producto_interes}</td>
                  <td><strong>${lead.monto_estimado}</strong></td>
                  <td><div class="upzy-action-text">${lead.proxima_accion}</div></td>
                  <td>${lead.owner}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderTasks() {
    const target = $('#upzy-tasks');
    if (!target) return;

    target.innerHTML = window.UPZY_MOCKS.crm.tasks.map((task) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${task.title}</div>
          <div class="upzy-list-meta">${task.qty} pendientes · Canal sugerido: ${task.channel}</div>
        </div>
        <span class="upzy-priority">${task.priority}</span>
      </div>
    `).join('');
  }

  function renderActivity() {
    const target = $('#upzy-activity');
    if (!target) return;

    target.innerHTML = window.UPZY_MOCKS.crm.activity.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${item.event}</div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
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
    const ctx = pageContext();
    const liveContext = isLivePageModule(moduleId);

    $$('.upzy-nav-btn').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.module === moduleId);
    });

    const title = $('#upzy-page-title');
    const kicker = $('#upzy-page-kicker');
    const detail = $('#upzy-module-detail');

    const pageTitle = liveContext && ctx.upzyPageTitle ? ctx.upzyPageTitle : module.name;
    const pageKicker = liveContext && ctx.upzyPageKicker ? ctx.upzyPageKicker : `${module.status} · ${module.description}`;
    const statusLabel = liveContext && ctx.upzyModuleStatus ? ctx.upzyModuleStatus : module.status;
    const outcome = liveContext && ctx.upzyModuleOutcome
      ? ctx.upzyModuleOutcome
      : 'Módulo dentro del roadmap UPZY. La integración se activa por oleadas para mantener contratos, navegación y seguridad estables.';

    if (title) title.textContent = pageTitle;
    if (kicker) kicker.textContent = pageKicker;
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
            <div class="upzy-roadmap-title">${statusLabel}</div>
            <div class="upzy-roadmap-outcome">${outcome}</div>
          </div>
        </div>
      `;
    }
  }

  function bindNavigation() {
    $$('.upzy-nav-btn').forEach((button) => {
      button.addEventListener('click', () => setActiveModule(button.dataset.module));
    });

    $$('.upzy-filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        state.leadFilter = button.dataset.filter;
        $$('.upzy-filter-btn').forEach((item) => item.classList.toggle('is-active', item === button));
        renderLeads();
      });
    });
  }

  function boot() {
    renderMetrics();
    renderFunnel();
    renderLeads();
    renderTasks();
    renderActivity();
    renderModules();
    renderRoadmap();
    bindNavigation();
    setActiveModule(state.activeModule);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
