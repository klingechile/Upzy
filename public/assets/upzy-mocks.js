window.UPZY_MOCKS = {
  tenant: {
    name: 'Klinge',
    product: 'UPZY CRM',
    tagline: 'Todo conectado. Todo medible. Mejora continua.',
    environment: 'Sprint 4 · Email Marketing'
  },
  metrics: [
    { label: 'Leads activos', value: '248', delta: '+18% vs semana anterior', tone: 'blue', icon: 'ti-users' },
    { label: 'Emails capturados', value: '51', delta: '79,6% de capturas', tone: 'orange', icon: 'ti-mail' },
    { label: 'Cupones ruleta', value: '29', delta: '45,3% de capturas', tone: 'green', icon: 'ti-ticket' },
    { label: 'Revenue email', value: '$2,4M', delta: 'mock comercial', tone: 'purple', icon: 'ti-cash' }
  ],
  emailMetrics: [
    { label: 'Campañas activas', value: '8', delta: '4 secuencias + 4 one-shot', tone: 'blue', icon: 'ti-speakerphone' },
    { label: 'Tasa apertura', value: '42%', delta: '+8 pts vs base', tone: 'green', icon: 'ti-mail-opened' },
    { label: 'CTR promedio', value: '13,8%', delta: 'CTA compra + WhatsApp', tone: 'orange', icon: 'ti-click' },
    { label: 'Conversiones', value: '31', delta: '$2,4M atribuido', tone: 'purple', icon: 'ti-chart-arrows-vertical' }
  ],
  emailSegments: [
    { id: 'seg-hot-email', name: 'Leads HOT con email', size: 37, source: 'CRM Comercial', trigger: 'lead.segment_changed', goal: 'Cerrar compra con urgencia y CTA directo' },
    { id: 'seg-coupon-unused', name: 'Cupón generado no usado', size: 21, source: 'Ruleta', trigger: 'coupon.generated', goal: 'Recordar vencimiento y empujar compra' },
    { id: 'seg-cart-email', name: 'Carrito abandonado con email', size: 19, source: 'Shopify', trigger: 'cart.abandoned_detected', goal: 'Recuperar compra con producto y checkout_url' },
    { id: 'seg-post-purchase', name: 'Clientes post compra', size: 84, source: 'Shopify / CRM', trigger: 'purchase.completed', goal: 'Educar, pedir reseña y generar recompra' },
    { id: 'seg-inactive', name: 'Clientes inactivos', size: 112, source: 'CRM', trigger: 'customer.inactive_detected', goal: 'Reactivar con beneficio y caso de éxito' },
    { id: 'seg-roulette-leads', name: 'Leads capturados por ruleta', size: 29, source: 'Spin to Win', trigger: 'lead.coupon_assigned', goal: 'Usar cupón antes de vencer' }
  ],
  emailTemplates: [
    {
      id: 'tpl-coupon-created',
      name: 'Cupón generado',
      trigger: 'coupon.generated',
      subject: '{{nombre}}, tu cupón Klinge vence pronto',
      preheader: 'Usa {{coupon_code}} en tu panel LED antes de que expire.',
      cta: 'Usar mi cupón',
      variables: ['nombre', 'producto', 'coupon_code', 'expires_at', 'checkout_url'],
      goal: 'Convertir lead de ruleta en compra'
    },
    {
      id: 'tpl-cart-abandoned',
      name: 'Carrito abandonado',
      trigger: 'cart.abandoned_detected',
      subject: 'Tu {{producto}} sigue disponible',
      preheader: 'Finaliza tu compra o habla con nosotros por WhatsApp.',
      cta: 'Retomar compra',
      variables: ['nombre', 'producto', 'checkout_url', 'whatsapp_url'],
      goal: 'Recuperar checkout incompleto'
    },
    {
      id: 'tpl-quote-sent',
      name: 'Cotización enviada',
      trigger: 'quote.sent',
      subject: '{{nombre}}, revisa tu cotización Klinge',
      preheader: 'Puedes abonar 30% y pagar el saldo al retiro o despacho.',
      cta: 'Ver cotización',
      variables: ['nombre', 'producto', 'quote_url', 'payment_url', 'sales_room_url'],
      goal: 'Acelerar decisión después de cotizar'
    },
    {
      id: 'tpl-post-purchase',
      name: 'Post compra',
      trigger: 'purchase.completed',
      subject: 'Gracias por comprar en Klinge',
      preheader: 'Te dejamos recomendaciones para usar mejor tu panel LED.',
      cta: 'Ver recomendaciones',
      variables: ['nombre', 'producto', 'order_id', 'review_url'],
      goal: 'Educar, pedir reseña y abrir recompra'
    }
  ],
  emailSequences: [
    { step: 'Día 0', title: 'Cupón generado', event: 'coupon.generated', channel: 'Email', objective: 'Entregar código y CTA de compra' },
    { step: 'Día 1', title: 'Cupón no usado', event: 'coupon.not_used_24h', channel: 'Email + WhatsApp', objective: 'Aumentar urgencia antes del vencimiento' },
    { step: 'Día 2', title: 'Última oportunidad', event: 'coupon.expiring', channel: 'Email', objective: 'Cerrar con escasez y prueba social' },
    { step: 'Día 3', title: 'Derivar a Lumi', event: 'lead.no_conversion', channel: 'Lumi', objective: 'Resolver objeciones y recuperar interés' }
  ],
  emailEvents: [
    { time: '13:02', event: 'email.campaign_created', detail: 'Campaña Cupón generado creada desde evento coupon.generated' },
    { time: '13:04', event: 'email.campaign_scheduled', detail: 'Segmento: Cupón generado no usado · 21 contactos' },
    { time: '13:05', event: 'email.campaign_sent', detail: 'Envío mock a 21 contactos' },
    { time: '13:24', event: 'email.opened', detail: 'María González abrió el correo' },
    { time: '13:26', event: 'email.clicked', detail: 'Click en CTA Usar mi cupón' },
    { time: '13:41', event: 'email.converted', detail: 'Compra atribuida a email + cupón ruleta' }
  ],
  emailCampaignContract: [
    { name: 'segmentId', required: true, reason: 'Toda campaña debe tener audiencia explícita' },
    { name: 'triggerEvent', required: false, reason: 'Permite automatizar secuencias por comportamiento' },
    { name: 'subject', required: true, reason: 'Principal driver de apertura' },
    { name: 'preheader', required: true, reason: 'Refuerza el asunto antes de abrir' },
    { name: 'templateId', required: true, reason: 'Define estructura visual y variables disponibles' },
    { name: 'variables', required: true, reason: 'Permite personalizar producto, cupón, checkout y WhatsApp' },
    { name: 'metrics', required: false, reason: 'Permite medir apertura, clic, conversión y revenue' }
  ],
  rouletteMetrics: [
    { label: 'Aperturas ruleta', value: '732', delta: 'últimos 7 días', tone: 'blue', icon: 'ti-rosette-discount' },
    { label: 'Giros completados', value: '186', delta: '25,4% interacción', tone: 'green', icon: 'ti-refresh' },
    { label: 'Cupones generados', value: '29', delta: '15,6% sobre giros', tone: 'orange', icon: 'ti-ticket' },
    { label: 'Ventas atribuidas', value: '$1,2M', delta: 'mock comercial', tone: 'purple', icon: 'ti-cash' }
  ],
  roulettePrizes: [
    { label: '5% descuento', probability: '35%', type: 'percentage', value: 5, event: 'coupon.generated', color: 'green' },
    { label: '10% descuento', probability: '15%', type: 'percentage', value: 10, event: 'coupon.generated', color: 'cyan' },
    { label: 'Impresión gratis', probability: '20%', type: 'benefit', value: null, event: 'coupon.generated', color: 'orange' },
    { label: 'Despacho preferente', probability: '10%', type: 'benefit', value: null, event: 'coupon.generated', color: 'purple' },
    { label: 'Asesoría prioritaria', probability: '15%', type: 'benefit', value: null, event: 'lead.coupon_assigned', color: 'blue' },
    { label: 'Agenda sala ventas', probability: '5%', type: 'benefit', value: null, event: 'lead.coupon_assigned', color: 'red' }
  ],
  rouletteRules: [
    { title: 'Email obligatorio', detail: 'La ruleta debe capturar email antes de revelar el premio.' },
    { title: 'Teléfono recomendado', detail: 'Permite recuperación por WhatsApp si el cupón no se usa.' },
    { title: 'Vigencia corta', detail: 'Cupón válido por 24 a 72 horas para aumentar urgencia comercial.' },
    { title: 'Control por email', detail: 'Un mismo email no debe girar infinitamente.' },
    { title: 'Producto de interés', detail: 'Debe viajar desde página de producto o campaña cuando exista contexto.' },
    { title: 'Evento medible', detail: 'Cada giro exitoso debe emitir coupon.generated y lead.coupon_assigned.' }
  ],
  rouletteEvents: [
    { time: '12:03', event: 'roulette.opened', detail: 'Trigger exit intent · Página Panel LED 80x120' },
    { time: '12:04', event: 'roulette.form_started', detail: 'Usuario ingresó email y teléfono' },
    { time: '12:04', event: 'roulette.spin_started', detail: 'Giro iniciado desde modal Spin to Win' },
    { time: '12:04', event: 'roulette.spin_completed', detail: 'Premio obtenido: 10% descuento' },
    { time: '12:04', event: 'coupon.generated', detail: 'Cupón KLG-RLT-10 generado con expiración 48h' },
    { time: '12:05', event: 'lead.coupon_assigned', detail: 'Cupón asociado al lead y listo para seguimiento' }
  ],
  rouletteCouponContract: [
    { name: 'code', required: true, reason: 'Identificador único del beneficio generado' },
    { name: 'prize', required: true, reason: 'Premio visible para el cliente y CRM' },
    { name: 'discountType', required: true, reason: 'Define si es porcentaje, monto fijo o beneficio comercial' },
    { name: 'expiresAt', required: true, reason: 'Genera urgencia y permite automatizar recordatorios' },
    { name: 'leadId', required: true, reason: 'Asocia el cupón a un contacto del CRM' },
    { name: 'campaignId', required: false, reason: 'Permite atribución por campaña o landing' }
  ],
  captureMetrics: [
    { label: 'Impresiones modal', value: '1.842', delta: 'últimos 7 días', tone: 'blue', icon: 'ti-eye' },
    { label: 'Leads capturados', value: '64', delta: '3,47% conversión', tone: 'green', icon: 'ti-user-plus' },
    { label: 'Emails obtenidos', value: '51', delta: '79,6% de capturas', tone: 'orange', icon: 'ti-mail' },
    { label: 'WhatsApp obtenidos', value: '44', delta: '68,7% de capturas', tone: 'purple', icon: 'ti-brand-whatsapp' }
  ],
  captureTemplates: [
    { id: 'capture-modal-quote', type: 'Modal', name: 'Cotización rápida', status: 'Activo Sprint 2', trigger: 'Exit intent + 45 segundos en producto', goal: 'Capturar email y producto de interés para enviar cotización', event: 'lead.email_captured', fields: ['nombre', 'email', 'telefono', 'tipo_negocio', 'producto_interes'], cta: 'Enviar cotización' },
    { id: 'capture-popup-visit', type: 'Popup lateral', name: 'Agenda sala de ventas', status: 'Activo Sprint 2', trigger: 'Scroll 60% o visita a página de contacto', goal: 'Llevar cliente a WhatsApp o agenda de sala', event: 'popup.cta_clicked', fields: ['nombre', 'telefono', 'tipo_negocio'], cta: 'Agendar visita' },
    { id: 'capture-form-product', type: 'Formulario embebido', name: 'Asesoría por producto', status: 'Activo Sprint 2', trigger: 'Landing o página de producto', goal: 'Crear lead desde intención explícita en producto', event: 'form.submitted', fields: ['nombre', 'email', 'telefono', 'producto_interes', 'urgencia'], cta: 'Quiero asesoría' }
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
    { id: 'LD-1001', nombre: 'María González', empresa: 'Café Barrio Italia', canal: 'Sitio web', etapa: 'Propuesta', segmento: 'HOT', score: 92, producto_interes: 'Panel LED 60x90 muro', monto_estimado: '$129.990', ultima_interaccion: 'Hace 18 min', proxima_accion: 'Enviar link de pago y reforzar retiro en tienda', owner: 'Carlos' },
    { id: 'LD-1002', nombre: 'Rodrigo Pérez', empresa: 'Food Truck Norte', canal: 'Instagram', etapa: 'Calificado', segmento: 'WARM', score: 68, producto_interes: 'Panel con soporte 90x60', monto_estimado: '$149.990', ultima_interaccion: 'Hace 46 min', proxima_accion: 'Pedir medida exacta y enviar alternativa con soporte', owner: 'Lumi' },
    { id: 'LD-1003', nombre: 'Camila Torres', empresa: 'Clínica Dental Smile', canal: 'WhatsApp', etapa: 'Contactado', segmento: 'WARM', score: 61, producto_interes: 'Panel LED colgante', monto_estimado: '$119.990', ultima_interaccion: 'Hace 1 h', proxima_accion: 'Enviar fotos reales y explicar bajo consumo', owner: 'Ejecutivo' },
    { id: 'LD-1004', nombre: 'José Arriagada', empresa: 'Minimarket El Sol', canal: 'Carrito abandonado', etapa: 'Cierre', segmento: 'HOT', score: 88, producto_interes: 'Panel LED 80x120', monto_estimado: '$189.990', ultima_interaccion: 'Hace 2 h', proxima_accion: 'Ofrecer 30% de abono y saldo al retiro/despacho', owner: 'Carlos' },
    { id: 'LD-1005', nombre: 'Daniela Muñoz', empresa: 'Boutique Providencia', canal: 'Meta Ads', etapa: 'Nuevo', segmento: 'COLD', score: 34, producto_interes: 'Panel vitrina 50x70', monto_estimado: '$99.990', ultima_interaccion: 'Hace 4 h', proxima_accion: 'Calificar tipo de negocio y urgencia', owner: 'Lumi' },
    { id: 'LD-1006', nombre: 'Felipe Rojas', empresa: 'Barbería Central', canal: 'WhatsApp', etapa: 'Propuesta', segmento: 'HOT', score: 81, producto_interes: 'Pizarra LED', monto_estimado: '$89.990', ultima_interaccion: 'Ayer', proxima_accion: 'Reenviar cotización y caso de éxito similar', owner: 'Ejecutivo' }
  ],
  modules: [
    { id: 'core', name: 'Core Platform', status: 'Activo Sprint 0', icon: 'ti-layout-dashboard', description: 'Layout, navegación, tokens visuales, estructura base y mocks.' },
    { id: 'crm', name: 'CRM Comercial', status: 'Activo Sprint 1', icon: 'ti-address-book', description: 'Contactos, termómetro comercial, historial, próxima mejor acción y tareas.' },
    { id: 'capture', name: 'Captación Web', status: 'Activo Sprint 2', icon: 'ti-forms', description: 'Formularios, popup, modal de captura y eventos lead.email_captured.' },
    { id: 'roulette', name: 'Ruleta / Spin to Win', status: 'Activo Sprint 3', icon: 'ti-rosette-discount', description: 'Plantilla de ruleta, premios, reglas, cupón y conversión desde sitio web.' },
    { id: 'email', name: 'Email Marketing', status: 'Activo Sprint 4', icon: 'ti-mail', description: 'Campañas, segmentos, plantillas, métricas, asunto, preheader y CTA.' },
    { id: 'carts', name: 'Carritos Abandonados', status: 'Sprint 5', icon: 'ti-shopping-cart', description: 'Detección, recuperación, email, WhatsApp, producto y checkout_url.' },
    { id: 'lumi-web', name: 'Lumi Sitio Web', status: 'Sprint 6', icon: 'ti-message-chatbot', description: 'Widget web, conversación, captura de correo, recomendación y cotización.' },
    { id: 'lumi-instagram', name: 'Lumi Instagram', status: 'Sprint 7', icon: 'ti-brand-instagram', description: 'Atención Instagram, bandeja omnicanal, normalización de eventos y lead matching.' },
    { id: 'automation', name: 'Automatizaciones', status: 'Sprint 8', icon: 'ti-route', description: 'Disparadores, condiciones, acciones y flujos comerciales entre canales.' },
    { id: 'reports', name: 'Reportes', status: 'Sprint 9', icon: 'ti-chart-funnel', description: 'Funnel, atribución, campañas, canales, conversión, revenue y mejora continua.' }
  ],
  roadmap: [
    { sprint: 'Sprint 0', title: 'Core Platform', outcome: 'Base frontend revisable sin romper dashboard actual.' },
    { sprint: 'Sprint 1', title: 'Dashboard + CRM base', outcome: 'Vista comercial con leads, estados, termómetro y próxima mejor acción.' },
    { sprint: 'Sprint 2', title: 'Captación Web', outcome: 'Modal, popup y formularios conectados a eventos.' },
    { sprint: 'Sprint 3', title: 'Ruleta', outcome: 'Spin to Win con reglas, premios y cupón.' },
    { sprint: 'Sprint 4', title: 'Email Marketing', outcome: 'Campañas, plantillas, segmentos, métricas y secuencias.' },
    { sprint: 'Sprint 5', title: 'Carritos Abandonados', outcome: 'Recuperación por email/WhatsApp con producto y checkout.' },
    { sprint: 'Sprint 6', title: 'Lumi Web', outcome: 'Atención conversacional en sitio web.' },
    { sprint: 'Sprint 7', title: 'Lumi Instagram', outcome: 'Omnicanalidad real con bandeja unificada.' },
    { sprint: 'Sprint 8', title: 'Automatizaciones', outcome: 'Flujos comerciales medibles.' },
    { sprint: 'Sprint 9', title: 'Reportes', outcome: 'Funnel, atribución y mejora continua.' }
  ]
};
