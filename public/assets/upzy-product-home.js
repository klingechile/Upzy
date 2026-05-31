(function () {
  const modules = [
    { title: 'CRM Comercial', route: '/crm', icon: 'ti-address-book', status: 'LIVE', detail: 'Leads reales, termómetro comercial y próximas acciones.' },
    { title: 'Captación Web', route: '/captacion', icon: 'ti-forms', status: 'LIVE', detail: 'Modal web creando leads reales en BD.' },
    { title: 'Carritos Abandonados', route: '/carritos', icon: 'ti-shopping-cart', status: 'LIVE', detail: 'Oportunidades de recuperación y estados de carrito.' },
    { title: 'Email Marketing', route: '/email', icon: 'ti-mail', status: 'READY', detail: 'Plantillas, flows y métricas email base.' },
    { title: 'Automatizaciones', route: '/automatizaciones', icon: 'ti-route', status: 'READY', detail: 'Cart recovery, triggers y ejecución controlada.' },
    { title: 'Reportes', route: '/reportes', icon: 'ti-chart-funnel', status: 'LIVE', detail: 'Funnel real, atribución y salud por módulo.' },
    { title: 'Configuración', route: '/configuracion', icon: 'ti-settings', status: 'CONTROL', detail: 'Usuarios, roles, permisos y auditoría.' },
    { title: 'Beta Status', route: '/beta', icon: 'ti-shield-check', status: 'BETA', detail: 'Score operativo, checks críticos y smoke tests.' },
  ];

  const historical = [
    ['Sprint 11', '/upzy-sprint11.html', 'CRM Live'],
    ['Sprint 12', '/upzy-sprint12.html', 'Captación Live'],
    ['Sprint 13', '/upzy-sprint13.html', 'Carritos Live'],
    ['Sprint 14', '/upzy-sprint14.html', 'Email + Automatizaciones'],
    ['Sprint 15', '/upzy-sprint15.html', 'Reportes Live'],
    ['Sprint 16', '/upzy-sprint16.html', 'Beta Operativa'],
    ['Sprint 17', '/upzy-sprint17.html', 'Roles + Auditoría'],
    ['Sprint 18', '/upzy-sprint18.html', 'Navegación Final'],
  ];

  function $(selector) { return document.querySelector(selector); }

  function renderModules() {
    const target = $('#upzy-product-modules');
    if (!target) return;
    target.innerHTML = modules.map((item) => `
      <a class="upzy-card upzy-module-card" href="${item.route}" style="text-decoration:none;color:inherit">
        <div class="upzy-module-top">
          <div class="upzy-card-icon"><i class="ti ${item.icon}"></i></div>
          <span class="upzy-status">${item.status}</span>
        </div>
        <div>
          <div class="upzy-module-name">${item.title}</div>
          <p class="upzy-module-desc">${item.detail}</p>
        </div>
      </a>
    `).join('');
  }

  function renderHistorical() {
    const target = $('#upzy-product-historical');
    if (!target) return;
    target.innerHTML = historical.map(([sprint, route, detail]) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title"><a href="${route}" style="color:inherit;text-decoration:none">${sprint}</a></div>
          <div class="upzy-list-meta">${detail} · ${route}</div>
        </div>
        <span class="upzy-time">Histórico</span>
      </div>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderModules();
    renderHistorical();
  });
})();
