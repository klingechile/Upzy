(function () {
  const modules = [
    { title: 'CRM Comercial', route: '/crm', icon: 'ti-address-book', status: 'Operar', detail: 'Gestiona leads, temperatura comercial, datos de contacto y próxima mejor acción.' },
    { title: 'Inbox Omnicanal', route: '/inbox', icon: 'ti-inbox', status: 'Atender', detail: 'Centraliza conversaciones de WhatsApp, Instagram y Lumi Web con contexto comercial.' },
    { title: 'Lumi Web', route: '/lumi-web-test.html', icon: 'ti-message-chatbot', status: 'Certificar', detail: 'Prueba el widget fuera de Shopify antes de instalarlo en Klinge.cl.' },
    { title: 'Carritos Abandonados', route: '/carritos', icon: 'ti-shopping-cart', status: 'Recuperar', detail: 'Detecta intención de compra y prioriza oportunidades con seguimiento comercial.' },
    { title: 'Email Marketing', route: '/email', icon: 'ti-mail', status: 'Activar', detail: 'Revisa plantillas, campañas y comunicaciones de nutrición.' },
    { title: 'Automatizaciones', route: '/automatizaciones', icon: 'ti-route', status: 'Controlar', detail: 'Configura recuperación, triggers y acciones comerciales controladas.' },
    { title: 'Reportes', route: '/reportes', icon: 'ti-chart-funnel', status: 'Medir', detail: 'Consulta funnel, atribución, módulos y señales de mejora continua.' },
    { title: 'Operación', route: '/operacion', icon: 'ti-activity-heartbeat', status: 'Validar', detail: 'Ejecuta smoke tests, revisa salud y prepara salida productiva.' },
  ];

  const quickActions = [
    ['Atender conversaciones nuevas', '/inbox', 'Responder leads web, WhatsApp e Instagram desde una bandeja única.'],
    ['Gestionar oportunidades calientes', '/crm', 'Priorizar clientes HOT/WARM y avanzar cotización o cierre.'],
    ['Recuperar intención de compra', '/carritos', 'Revisar carritos y clientes con producto o compra pendiente.'],
    ['Medir desempeño comercial', '/reportes', 'Revisar funnel, atribución y salud de módulos para mejora continua.'],
  ];

  const systemStatus = [
    ['CRM y BD', 'Activo', 'Leads y eventos comerciales conectados al backend.'],
    ['Lumi Web Sandbox', 'Certificación', 'Prueba aislada sin instalar código en Klinge.cl.'],
    ['Shopify', 'Preparado', 'Variables cargadas y tracking listo para validación.'],
    ['Seguridad', 'Controlada', 'APIs protegidas, widget público acotado y sin service role expuesto.'],
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

  function renderQuickActions() {
    const target = $('#upzy-quick-actions');
    if (!target) return;
    target.innerHTML = quickActions.map(([title, route, detail]) => `
      <a class="upzy-list-item" href="${route}" style="text-decoration:none;color:inherit">
        <div>
          <div class="upzy-list-title">${title}</div>
          <div class="upzy-list-meta">${detail}</div>
        </div>
        <span class="upzy-time">Abrir</span>
      </a>
    `).join('');
  }

  function renderSystemStatus() {
    const target = $('#upzy-system-status');
    if (!target) return;
    target.innerHTML = systemStatus.map(([title, status, detail]) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${title}</div>
          <div class="upzy-list-meta">${detail}</div>
        </div>
        <span class="upzy-time">${status}</span>
      </div>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderModules();
    renderQuickActions();
    renderSystemStatus();
  });
})();
