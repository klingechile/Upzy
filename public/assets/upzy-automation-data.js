window.UPZY_AUTOMATION = {
  metrics: [
    { label: 'Automatizaciones', value: '14', delta: '9 activas, 3 pausadas, 2 draft', tone: 'blue', icon: 'ti-route' },
    { label: 'Ejecuciones', value: '428', delta: 'últimos 7 días', tone: 'green', icon: 'ti-player-play' },
    { label: 'Errores', value: '6', delta: '1,4% tasa error', tone: 'red', icon: 'ti-alert-triangle' },
    { label: 'Revenue atribuido', value: '$3,8M', delta: 'mock comercial', tone: 'purple', icon: 'ti-cash' }
  ],
  flows: [
    {
      id: 'AUTO-001', name: 'Cupón generado no usado', status: 'active', sourceModule: 'Ruleta', trigger: 'coupon.generated', condition: 'cupón no usado después de 24h', action: 'enviar email + sugerir WhatsApp', executions: 86, success: '72%', revenue: '$640.000'
    },
    {
      id: 'AUTO-002', name: 'Carrito abandonado HOT', status: 'active', sourceModule: 'Carritos', trigger: 'cart.abandoned_detected', condition: 'priority = high', action: 'email inmediato + tarea + Lumi', executions: 41, success: '38%', revenue: '$1.240.000'
    },
    {
      id: 'AUTO-003', name: 'Lead capturado por modal', status: 'active', sourceModule: 'Captación Web', trigger: 'lead.email_captured', condition: 'producto_interes existe', action: 'crear lead + bienvenida + NBA', executions: 128, success: '81%', revenue: '$760.000'
    },
    {
      id: 'AUTO-004', name: 'Instagram pide precio', status: 'draft', sourceModule: 'Omnicanalidad', trigger: 'instagram.message_received', condition: 'intent = quote', action: 'enriquecer CRM + sugerir respuesta', executions: 0, success: '-', revenue: '-'
    },
    {
      id: 'AUTO-005', name: 'Cliente post compra', status: 'paused', sourceModule: 'Shopify', trigger: 'purchase.completed', condition: 'producto existe', action: 'email educación + reseña + upsell', executions: 173, success: '64%', revenue: '$1.160.000'
    }
  ],
  builder: {
    trigger: { title: 'Evento disparador', value: 'cart.abandoned_detected', module: 'Carritos Abandonados', detail: 'Cuando Shopify o UPZY detecta intención de compra incompleta.' },
    conditions: [
      { field: 'priority', operator: 'equals', value: 'high' },
      { field: 'email', operator: 'exists', value: true },
      { field: 'amount', operator: 'greater_than', value: 100000 }
    ],
    actions: [
      { type: 'send_email', targetModule: 'Email Marketing', label: 'Enviar email inmediato con checkout' },
      { type: 'create_task', targetModule: 'CRM', label: 'Crear tarea de seguimiento comercial' },
      { type: 'start_lumi_followup', targetModule: 'Lumi Web', label: 'Activar seguimiento conversacional' }
    ]
  },
  timeline: [
    { time: '17:02', event: 'automation.triggered', detail: 'AUTO-002 iniciado por cart.abandoned_detected' },
    { time: '17:02', event: 'automation.condition_matched', detail: 'priority = high y email existe' },
    { time: '17:03', event: 'automation.action_queued', detail: 'Email inmediato agregado a cola' },
    { time: '17:04', event: 'automation.action_executed', detail: 'Tarea CRM creada para seguimiento' },
    { time: '17:05', event: 'automation.action_executed', detail: 'Lumi followup sugerido para carrito HOT' },
    { time: '17:06', event: 'automation.completed', detail: 'Flujo terminado sin errores' }
  ],
  contract: [
    { name: 'id', required: true, reason: 'Identificador de automatización' },
    { name: 'name', required: true, reason: 'Nombre legible para negocio' },
    { name: 'status', required: true, reason: 'Permite activar, pausar o archivar sin borrar' },
    { name: 'trigger.event', required: true, reason: 'Evento que inicia el flujo' },
    { name: 'trigger.sourceModule', required: true, reason: 'Módulo que origina el evento' },
    { name: 'conditions', required: true, reason: 'Reglas que deben cumplirse antes de actuar' },
    { name: 'actions', required: true, reason: 'Acciones comerciales que ejecuta o sugiere el flujo' },
    { name: 'metrics', required: false, reason: 'Mide ejecución, error, conversión y revenue' }
  ]
};
