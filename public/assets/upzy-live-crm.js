(function () {
  const state = {
    source: 'mock',
    error: null,
    leads: [],
    stats: null,
    carts: [],
  };

  const $ = (selector) => document.querySelector(selector);

  function segmentClass(segment) {
    const normalized = String(segment || 'cold').toLowerCase();
    if (normalized === 'hot') return 'hot';
    if (normalized === 'warm') return 'warm';
    return 'cold';
  }

  function formatDate(value) {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatMoney(value) {
    const number = Number(value || 0);
    if (!number) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(number);
  }

  function nextActionForLead(lead) {
    const segment = segmentClass(lead.segmento);
    if (segment === 'hot') return 'Contactar hoy y avanzar cotización/cierre.';
    if (lead.etapa === 'propuesta') return 'Hacer seguimiento de propuesta enviada.';
    if (segment === 'warm') return 'Calificar necesidad y pedir producto de interés.';
    return 'Nutrir y completar datos de contacto.';
  }

  function mapApiLead(lead) {
    const segment = segmentClass(lead.segmento).toUpperCase();
    return {
      id: lead.id || 'sin-id',
      nombre: lead.nombre || 'Cliente sin nombre',
      empresa: lead.empresa || 'Sin empresa',
      canal: lead.canal || 'CRM',
      etapa: lead.etapa || 'nuevo',
      segmento: segment,
      score: Number(lead.score || 1),
      producto_interes: lead.producto_interes || 'Pendiente capturar',
      monto_estimado: lead.monto_estimado || '—',
      ultima_interaccion: formatDate(lead.ultimo_contacto),
      proxima_accion: nextActionForLead(lead),
      owner: lead.asignado_a || 'Sin asignar',
    };
  }

  function fallbackData(error) {
    state.source = error ? 'error' : 'mock';
    state.error = error || null;
    state.leads = window.UPZY_MOCKS.leads;
    state.stats = null;
    state.carts = [];
  }

  function renderConnectionStatus() {
    const target = $('#upzy-live-status');
    if (!target) return;

    const isLive = state.source === 'live';
    const isError = state.source === 'error';
    const title = isLive ? 'BD conectada' : isError ? 'API no disponible' : 'Fallback mock activo';
    const detail = isLive
      ? 'Mostrando leads, estadísticas y carritos pendientes desde endpoints protegidos por JWT.'
      : isError
        ? `${state.error?.message || 'Error desconocido'} · Se mantiene la vista con mock controlado.`
        : 'No hay sesión activa o todavía no se conectó la API. La demo sigue visible con datos mock.';

    target.innerHTML = `
      <div class="upzy-live-banner ${isLive ? 'live' : isError ? 'error' : 'fallback'}">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">${title}</div>
          <div class="upzy-live-detail">${detail}</div>
        </div>
        <span class="upzy-badge ${isLive ? 'ok' : isError ? 'hot' : 'warm'}">${isLive ? 'LIVE' : isError ? 'ERROR' : 'MOCK'}</span>
      </div>
    `;
  }

  function renderLiveMetrics() {
    const target = $('#upzy-metrics');
    if (!target) return;

    const stats = state.stats;
    if (!stats) return;

    const metrics = [
      { label: 'Leads activos', value: stats.total || 0, delta: 'desde /api/leads/estadisticas', tone: 'blue', icon: 'ti-users' },
      { label: 'Clientes HOT', value: stats.hot || 0, delta: 'prioridad comercial real', tone: 'red', icon: 'ti-flame' },
      { label: 'Score promedio', value: stats.score_promedio || '0', delta: 'promedio BD', tone: 'orange', icon: 'ti-chart-bar' },
      { label: 'Revenue total', value: formatMoney(stats.revenue_total), delta: 'total_gastado real', tone: 'green', icon: 'ti-cash' },
    ];

    target.innerHTML = metrics.map((metric) => `
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

  function renderLiveFunnel() {
    const target = $('#upzy-funnel');
    if (!target || !state.stats?.por_etapa) return;

    const total = Math.max(Number(state.stats.total || 0), 1);
    const stages = [
      { stage: 'Nuevo', count: state.stats.por_etapa.nuevo || 0, tone: 'blue' },
      { stage: 'Contactado', count: state.stats.por_etapa.contactado || 0, tone: 'cyan' },
      { stage: 'Calificado', count: state.stats.por_etapa.calificado || 0, tone: 'orange' },
      { stage: 'Propuesta', count: state.stats.por_etapa.propuesta || 0, tone: 'purple' },
      { stage: 'Cerrado', count: state.stats.por_etapa.cerrado || 0, tone: 'green' },
    ].map((item) => ({ ...item, conversion: Math.round((item.count / total) * 100) }));

    target.innerHTML = stages.map((stage) => `
      <article class="upzy-funnel-card">
        <div class="upzy-funnel-stage">${stage.stage}</div>
        <div class="upzy-funnel-count">${stage.count}</div>
        <div class="upzy-funnel-value">${stage.conversion}% del total</div>
        <div class="upzy-progress"><span style="--value:${Math.max(stage.conversion, 3)}%"></span></div>
      </article>
    `).join('');
  }

  function renderLiveLeads() {
    const target = $('#upzy-leads-table');
    if (!target) return;

    const filter = document.querySelector('.upzy-filter-btn.is-active')?.dataset?.filter || 'ALL';
    const leads = state.leads.filter((lead) => filter === 'ALL' || lead.segmento === filter);

    if (!leads.length) {
      target.innerHTML = '<div class="upzy-live-empty">No hay leads para este filtro. Revisa la BD o cambia el segmento.</div>';
      return;
    }

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

  function renderLiveTasks() {
    const target = $('#upzy-tasks');
    if (!target) return;

    const hot = state.leads.filter((lead) => lead.segmento === 'HOT').length;
    const warm = state.leads.filter((lead) => lead.segmento === 'WARM').length;
    const carts = state.carts.length;
    const tasks = [
      { title: 'Contactar leads HOT', qty: hot, priority: 'Alta', channel: 'WhatsApp / CRM' },
      { title: 'Calificar leads WARM', qty: warm, priority: 'Media', channel: 'Lumi / Email' },
      { title: 'Revisar carritos pendientes', qty: carts, priority: carts ? 'Alta' : 'Baja', channel: 'Shopify / CRM' },
      { title: 'Completar datos faltantes', qty: state.leads.filter((lead) => lead.nombre === 'Cliente sin nombre' || lead.empresa === 'Sin empresa').length, priority: 'Media', channel: 'CRM' },
    ];

    target.innerHTML = tasks.map((task) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${task.title}</div>
          <div class="upzy-list-meta">${task.qty} pendientes · Canal sugerido: ${task.channel}</div>
        </div>
        <span class="upzy-priority">${task.priority}</span>
      </div>
    `).join('');
  }

  function renderLiveActivity() {
    const target = $('#upzy-activity');
    if (!target) return;

    const sourceLabel = state.source === 'live' ? 'BD real' : 'Mock fallback';
    const items = [
      { time: 'Ahora', event: `CRM cargado desde ${sourceLabel}`, detail: `${state.leads.length} leads renderizados en UI.` },
      { time: 'Ahora', event: 'Estadísticas consultadas', detail: state.stats ? 'Métricas reales disponibles.' : 'Métricas mock o no disponibles.' },
      { time: 'Ahora', event: 'Carritos pendientes', detail: `${state.carts.length} registros disponibles.` },
    ];

    target.innerHTML = items.map((item) => `
      <div class="upzy-list-item">
        <div>
          <div class="upzy-list-title">${item.event}</div>
          <div class="upzy-list-meta">${item.detail}</div>
        </div>
        <span class="upzy-time">${item.time}</span>
      </div>
    `).join('');
  }

  function bindLiveFilters() {
    document.querySelectorAll('.upzy-filter-btn').forEach((button) => {
      button.addEventListener('click', () => setTimeout(renderLiveLeads, 0));
    });
  }

  async function loadRealData() {
    renderConnectionStatus();

    if (!window.UPZY_API || !window.UPZY_API.hasSession()) {
      fallbackData();
      return;
    }

    try {
      const [leads, stats, carts] = await Promise.all([
        window.UPZY_API.getLeads(),
        window.UPZY_API.getLeadStats(),
        window.UPZY_API.getPendingCarts(),
      ]);

      state.source = 'live';
      state.error = null;
      state.leads = Array.isArray(leads) ? leads.map(mapApiLead) : [];
      state.stats = stats || null;
      state.carts = Array.isArray(carts) ? carts : [];
    } catch (error) {
      fallbackData(error);
    }
  }

  function renderAll() {
    renderConnectionStatus();
    renderLiveMetrics();
    renderLiveFunnel();
    renderLiveLeads();
    renderLiveTasks();
    renderLiveActivity();
  }

  async function bootLiveCrm() {
    const target = $('#upzy-live-status');
    if (!target) return;

    target.innerHTML = `
      <div class="upzy-live-banner fallback">
        <span class="upzy-live-dot"></span>
        <div>
          <div class="upzy-live-title">Conectando con BD real...</div>
          <div class="upzy-live-detail">Consultando endpoints protegidos del backend.</div>
        </div>
        <span class="upzy-badge warm">LOADING</span>
      </div>
    `;

    await loadRealData();
    renderAll();
    bindLiveFilters();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(bootLiveCrm, 0);
  });
})();
