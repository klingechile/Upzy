window.UPZY_READINESS = {
  metrics: [
    { label: 'Readiness general', value: '78%', delta: 'listo para beta controlada', tone: 'green', icon: 'ti-shield-check' },
    { label: 'Módulos mock', value: '10', delta: 'base frontend completa', tone: 'blue', icon: 'ti-apps' },
    { label: 'Endpoints listos', value: '7', delta: 'leads, stats y carritos', tone: 'orange', icon: 'ti-api' },
    { label: 'Riesgo crítico', value: '1', delta: 'no exponer service role', tone: 'red', icon: 'ti-alert-triangle' }
  ],
  modules: [
    { module: 'CRM Comercial', readiness: 'Alta', dbWave: 'Sprint 11', status: 'Conectar primero', endpoint: 'GET /api/leads' },
    { module: 'Reportes básicos', readiness: 'Media', dbWave: 'Sprint 11', status: 'Usar estadísticas reales', endpoint: 'GET /api/leads/estadisticas' },
    { module: 'Carritos resumen', readiness: 'Media', dbWave: 'Sprint 11', status: 'Leer pendientes', endpoint: 'GET /api/leads/carritos' },
    { module: 'Captación Web', readiness: 'Media', dbWave: 'Sprint 12', status: 'Requiere POST captura', endpoint: 'POST /api/capture/leads' },
    { module: 'Carritos completos', readiness: 'Media', dbWave: 'Sprint 12', status: 'Requiere modelo carrito', endpoint: 'GET /api/carts/abandoned' },
    { module: 'Email Marketing', readiness: 'Media', dbWave: 'Sprint 13', status: 'Conectar plantillas/campañas', endpoint: 'GET /api/templates' },
    { module: 'Automatizaciones', readiness: 'Media', dbWave: 'Sprint 13', status: 'Conectar flujos', endpoint: 'GET /api/automations' },
    { module: 'Lumi Web', readiness: 'Media', dbWave: 'Sprint 14', status: 'Conectar conversaciones', endpoint: 'GET /api/inbox' },
    { module: 'Lumi Instagram', readiness: 'Baja', dbWave: 'Sprint 14', status: 'Requiere Graph API', endpoint: 'webhook instagram' },
    { module: 'Atribución avanzada', readiness: 'Baja', dbWave: 'Sprint 15', status: 'Requiere eventos estables', endpoint: 'upzy_events' }
  ],
  waves: [
    { wave: 'Sprint 10', title: 'Readiness + QA', goal: 'Validar contratos, endpoints, seguridad y estados UI antes de conectar.', status: 'Actual' },
    { wave: 'Sprint 11', title: 'CRM + Leads reales', goal: 'Conectar GET /api/leads, estadísticas y carritos pendientes.', status: 'Siguiente' },
    { wave: 'Sprint 12', title: 'Captación + Carritos', goal: 'Crear leads reales desde formularios y leer carritos reales.', status: 'Planificado' },
    { wave: 'Sprint 13', title: 'Email + Automatizaciones', goal: 'Conectar plantillas, campañas y flujos de automatización.', status: 'Planificado' },
    { wave: 'Sprint 14', title: 'Lumi + Omnicanalidad', goal: 'Conectar conversaciones, inbox, matching y próximos pasos.', status: 'Planificado' },
    { wave: 'Sprint 15', title: 'Reportes reales', goal: 'Calcular atribución y revenue desde eventos reales.', status: 'Planificado' }
  ],
  checklist: [
    { item: 'Navegación principal funcionando', status: 'OK' },
    { item: 'Sprints históricos accesibles', status: 'OK' },
    { item: 'Dashboard legacy eliminado', status: 'OK' },
    { item: 'Módulos mock separados', status: 'OK' },
    { item: 'Contratos documentados', status: 'OK' },
    { item: 'Endpoints reales identificados', status: 'OK' },
    { item: 'Estados loading/error/empty definidos', status: 'Pendiente Sprint 11' },
    { item: 'JWT probado en frontend', status: 'Pendiente Sprint 11' },
    { item: 'Fallback mock definido', status: 'Pendiente Sprint 11' },
    { item: 'QA mobile completo', status: 'Pendiente' }
  ],
  endpoints: [
    { method: 'GET', path: '/api/leads', module: 'CRM Comercial', status: 'Disponible' },
    { method: 'GET', path: '/api/leads/estadisticas', module: 'Reportes básicos', status: 'Disponible' },
    { method: 'GET', path: '/api/leads/carritos', module: 'Carritos resumen', status: 'Disponible' },
    { method: 'GET', path: '/api/leads/:id', module: 'Detalle lead', status: 'Disponible' },
    { method: 'PATCH', path: '/api/leads/:id', module: 'CRM Comercial', status: 'Disponible' },
    { method: 'POST', path: '/api/leads/:id/score', module: 'Scoring', status: 'Disponible' },
    { method: 'POST', path: '/api/leads/:id/asignar-agente', module: 'Asignación', status: 'Disponible' }
  ],
  risks: [
    { level: 'Crítico', title: 'Service role en frontend', detail: 'Nunca exponer SUPABASE_SERVICE_ROLE_KEY. El frontend debe consumir backend protegido.' },
    { level: 'Alto', title: 'Shape incompatible', detail: 'La UI mock puede no coincidir con columnas reales de upzy_leads.' },
    { level: 'Alto', title: 'Auth/JWT', detail: 'Los endpoints están protegidos; Sprint 11 debe resolver consumo autenticado.' },
    { level: 'Medio', title: 'Estados vacíos', detail: 'Hay que diseñar loading, error y empty antes de conectar APIs.' },
    { level: 'Medio', title: 'Tenant inconsistente', detail: 'Todas las consultas deben respetar tenant_id.' }
  ],
  goNoGo: [
    { type: 'GO', rule: 'GET /api/leads responde y tiene datos útiles para tabla CRM' },
    { type: 'GO', rule: 'GET /api/leads/estadisticas alimenta métricas base' },
    { type: 'GO', rule: 'JWT disponible en frontend sin exponer service role' },
    { type: 'GO', rule: 'Mocks pueden quedar como fallback visual' },
    { type: 'NO-GO', rule: 'Endpoint devuelve 500 o datos incompatibles sin mapper' },
    { type: 'NO-GO', rule: 'No existe forma segura de autenticar la llamada desde UI' },
    { type: 'NO-GO', rule: 'Se intenta consultar Supabase directo desde frontend con service key' }
  ]
};
