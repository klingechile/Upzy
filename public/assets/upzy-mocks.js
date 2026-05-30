window.UPZY_MOCKS = {
  tenant: {
    name: 'Klinge',
    product: 'UPZY CRM',
    tagline: 'Todo conectado. Todo medible. Mejora continua.',
    environment: 'Sprint 2 · Captación Web'
  },
  metrics: [
    { label: 'Leads activos', value: '248', delta: '+18% vs semana anterior', tone: 'blue', icon: 'ti-users' },
    { label: 'Clientes HOT', value: '37', delta: 'requieren cierre hoy', tone: 'red', icon: 'ti-flame' },
    { label: 'Monto estimado', value: '$18,6M', delta: 'pipeline abierto', tone: 'green', icon: 'ti-cash' },
    { label: 'Capturas web', value: '64', delta: 'modal + popup + form', tone: 'orange', icon: 'ti-forms' }
  ],
  captureMetrics: [
    { label: 'Impresiones modal', value: '1.842', delta: 'últimos 7 días', tone: 'blue', icon: 'ti-eye' },
    { label: 'Leads capturados', value: '64', delta: '3,47% conversión', tone: 'green', icon: 'ti-user-plus' },
    { label: 'Emails obtenidos', value: '51', delta: '79,6% de capturas', tone: 'orange', icon: 'ti-mail' },
    { label: 'WhatsApp obtenidos', value: '44', delta: '68,7% de capturas', tone: 'purple', icon: 'ti-brand-whatsapp' }
  ],
  captureTemplates: [
    {
      id: 'capture-modal-quote',
      type: 'Modal',
      name: 'Cotización rápida',
      status: 'Diseño Sprint 2',
      trigger: 'Exit intent + 45 segundos en producto',
      goal: 'Capturar email y producto de interés para enviar cotización',
      event: 'lead.email_captured',
      fields: ['nombre', 'email', 'telefono', 'tipo_negocio', 'producto_interes'],
      cta: 'Enviar cotización'
    },
    {
      id: 'capture-popup-visit',
      type: 'Popup lateral',
      name: 'Agenda sala de ventas',
      status: 'Diseño Sprint 2',
      trigger: 'Scroll 60% o visita a página de contacto',
      goal: 'Llevar cliente a WhatsApp o agenda de sala',
      event: 'popup.cta_clicked',
      fields: ['nombre', 'telefono', 'tipo_negocio'],
      cta: 'Agendar visita'
    },
    {
      id: 'capture-form-product',
      type: 'Formulario embebido',
      name: 'Asesoría por producto',
      status: 'Diseño Sprint 2',
      trigger: 'Landing o página de producto',
      goal: 'Crear lead desde intención explícita en producto',
      event: 'form.submitted',
      fields: ['nombre', 'email', 'telefono', 'producto_interes', 'urgencia'],
      cta: 'Quiero asesoría'
    }
  ],
  captureEvents: [
    { time: '09:14', event: 'capture.modal_opened', detail: 'Modal cotización rápida · Página Panel LED 60x90' },
    { time: '09:15', event: 'capture.form_started', detail: 'Cliente ingresó nombre y email' },
    { time: '09:16', event: 'lead.email_captured', detail: 'Email capturado + producto_interes: Panel LED 60x90' },
    { time: '09:16', event: 'lead.created', detail: 'Lead creado en CRM con origen web/modal' },
    { time: '09:17', event: 'crm.lead_enriched', detail: 'Tipo negocio: cafetería · Score inicial: WARM' }
  ],
  captureFields: [
    { name: 'nombre', required: true, reason: 'Personalizar atención y saludo de Lumi' },
    { name: 'email', required: true, reason: 'Enviar cotización, campañas y reducir dependencia de Meta' },
    { name: 'telefono', required: false, reason: 'Habilitar cierre por WhatsApp' },
    { name: 'tipo_negocio', required: false, reason: 'Segmentar recomendación comercial' },
    { name: 'producto_interes', required: false, reason: 'Debe viajar desde página o campaña cuando exista contexto' },
    { name: 'consentimiento', required: true, reason: 'Base mínima para comunicaciones comerciales' }
  ],
  crm: {
    funnel: [
      { stage: 'Nuevo', count: 82, value: '$5,4M', conversion: 100, tone: 'blue' },
      { stage: 'Contactado', count: 61, value: '$4,8M', conversion: 74, tone: 'cyan' },
      { stage: 'Calificado', count: 43, value: '$3,7M', conversion: 52, tone: 'orange' },
      { stage: 'Propuesta', count: 28, value: '$3,1M', conversion: 34, tone: 'purple' },
      { stage: 'Cierre', count: 14, value: '$1,6M', conversion: 17, tone: 'green' }
    ],
    tasks: [
      { title: 'Llamar leads HOT sin respuesta', qty: 7, priority: 'Alta', channel: 'WhatsApp' },
      { title: 'Enviar cotización pendiente', qty: 4, priority: 'Alta', channel: 'Email' },
      { title: 'Reactivar interesados tibios', qty: 13, priority: 'Media', channel: 'Lumi' },
      { title: 'Completar datos de contacto', qty: 22, priority: 'Media', channel: 'CRM' }
    ],
    activity: [
      { time: '09:42', event: 'Nuevo lead capturado desde sitio web', detail: 'Panel LED 60x90 · Cafetería' },
      { time: '10:08', event: 'Lead cambió a HOT', detail: 'Restaurant La Plaza solicitó retiro en tienda' },
      { time: '10:31', event: 'Cotización enviada', detail: 'Panel con soporte 90x60 · $149.990' },
      { time: '11:12', event: 'Próxima acción creada', detail: 'Seguimiento WhatsApp en 2 horas' }
    ]
  },
  leads: [
    {
      id: 'LD-1001',
      nombre: 'María González',
      empresa: 'Café Barrio Italia',
      canal: 'Sitio web',
      etapa: 'Propuesta',
      segmento: 'HOT',
      score: 92,
      producto_interes: 'Panel LED 60x90 muro',
      monto_estimado: '$129.990',
      ultima_interaccion: 'Hace 18 min',
      proxima_accion: 'Enviar link de pago y reforzar retiro en tienda',
      owner: 'Carlos'
    },
    {
      id: 'LD-1002',
      nombre: 'Rodrigo Pérez',
      empresa: 'Food Truck Norte',
      canal: 'Instagram',
      etapa: 'Calificado',
      segmento: 'WARM',
      score: 68,
      producto_interes: 'Panel con soporte 90x60',
      monto_estimado: '$149.990',
      ultima_interaccion: 'Hace 46 min',
      proxima_accion: 'Pedir medida exacta y enviar alternativa con soporte',
      owner: 'Lumi'
    },
    {
      id: 'LD-1003',
      nombre: 'Camila Torres',
      empresa: 'Clínica Dental Smile',
      canal: 'WhatsApp',
      etapa: 'Contactado',
      segmento: 'WARM',
      score: 61,
      producto_interes: 'Panel LED colgante',
      monto_estimado: '$119.990',
      ultima_interaccion: 'Hace 1 h',
      proxima_accion: 'Enviar fotos reales y explicar bajo consumo',
      owner: 'Ejecutivo'
    },
    {
      id: 'LD-1004',
      nombre: 'José Arriagada',
      empresa: 'Minimarket El Sol',
      canal: 'Carrito abandonado',
      etapa: 'Cierre',
      segmento: 'HOT',
      score: 88,
      producto_interes: 'Panel LED 80x120',
      monto_estimado: '$189.990',
      ultima_interaccion: 'Hace 2 h',
      proxima_accion: 'Ofrecer 30% de abono y saldo al retiro/despacho',
      owner: 'Carlos'
    },
    {
      id: 'LD-1005',
      nombre: 'Daniela Muñoz',
      empresa: 'Boutique Providencia',
      canal: 'Meta Ads',
      etapa: 'Nuevo',
      segmento: 'COLD',
      score: 34,
      producto_interes: 'Panel vitrina 50x70',
      monto_estimado: '$99.990',
      ultima_interaccion: 'Hace 4 h',
      proxima_accion: 'Calificar tipo de negocio y urgencia',
      owner: 'Lumi'
    },
    {
      id: 'LD-1006',
      nombre: 'Felipe Rojas',
      empresa: 'Barbería Central',
      canal: 'WhatsApp',
      etapa: 'Propuesta',
      segmento: 'HOT',
      score: 81,
      producto_interes: 'Pizarra LED',
      monto_estimado: '$89.990',
      ultima_interaccion: 'Ayer',
      proxima_accion: 'Reenviar cotización y caso de éxito similar',
      owner: 'Ejecutivo'
    }
  ],
  modules: [
    {
      id: 'core',
      name: 'Core Platform',
      status: 'Activo Sprint 0',
      icon: 'ti-layout-dashboard',
      description: 'Layout, navegación, tokens visuales, estructura base y mocks.'
    },
    {
      id: 'crm',
      name: 'CRM Comercial',
      status: 'Activo Sprint 1',
      icon: 'ti-address-book',
      description: 'Contactos, termómetro comercial, historial, próxima mejor acción y tareas.'
    },
    {
      id: 'capture',
      name: 'Captación Web',
      status: 'Activo Sprint 2',
      icon: 'ti-forms',
      description: 'Formularios, popup, modal de captura y eventos lead.email_captured.'
    },
    {
      id: 'roulette',
      name: 'Ruleta / Spin to Win',
      status: 'Sprint 3',
      icon: 'ti-rosette-discount',
      description: 'Plantilla de ruleta, premios, reglas, cupón y conversión desde sitio web.'
    },
    {
      id: 'email',
      name: 'Email Marketing',
      status: 'Sprint 4',
      icon: 'ti-mail',
      description: 'Plantillas, campañas, segmentos, métricas, asunto, preheader y CTA.'
    },
    {
      id: 'carts',
      name: 'Carritos Abandonados',
      status: 'Sprint 5',
      icon: 'ti-shopping-cart',
      description: 'Detección, recuperación, email, WhatsApp, producto y checkout_url.'
    },
    {
      id: 'lumi-web',
      name: 'Lumi Sitio Web',
      status: 'Sprint 6',
      icon: 'ti-message-chatbot',
      description: 'Widget web, conversación, captura de correo, recomendación y cotización.'
    },
    {
      id: 'lumi-instagram',
      name: 'Lumi Instagram',
      status: 'Sprint 7',
      icon: 'ti-brand-instagram',
      description: 'Atención Instagram, bandeja omnicanal, normalización de eventos y lead matching.'
    },
    {
      id: 'automation',
      name: 'Automatizaciones',
      status: 'Sprint 8',
      icon: 'ti-route',
      description: 'Disparadores, condiciones, acciones y flujos comerciales entre canales.'
    },
    {
      id: 'reports',
      name: 'Reportes',
      status: 'Sprint 9',
      icon: 'ti-chart-funnel',
      description: 'Funnel, atribución, campañas, canales, conversión, revenue y mejora continua.'
    }
  ],
  roadmap: [
    { sprint: 'Sprint 0', title: 'Core Platform', outcome: 'Base frontend revisable sin romper dashboard actual.' },
    { sprint: 'Sprint 1', title: 'Dashboard + CRM base', outcome: 'Vista comercial con leads, estados, termómetro y próxima mejor acción.' },
    { sprint: 'Sprint 2', title: 'Captación Web', outcome: 'Modal, popup y formularios conectados a eventos.' },
    { sprint: 'Sprint 3', title: 'Ruleta', outcome: 'Spin to Win con reglas, premios y cupón.' },
    { sprint: 'Sprint 4', title: 'Email Marketing', outcome: 'Campañas, plantillas, segmentos y métricas.' },
    { sprint: 'Sprint 5', title: 'Carritos Abandonados', outcome: 'Recuperación por email/WhatsApp con producto y checkout.' },
    { sprint: 'Sprint 6', title: 'Lumi Web', outcome: 'Atención conversacional en sitio web.' },
    { sprint: 'Sprint 7', title: 'Lumi Instagram', outcome: 'Omnicanalidad real con bandeja unificada.' },
    { sprint: 'Sprint 8', title: 'Automatizaciones', outcome: 'Flujos comerciales medibles.' },
    { sprint: 'Sprint 9', title: 'Reportes', outcome: 'Funnel, atribución, campañas, canales, conversión, revenue y mejora continua.' }
  ]
};
