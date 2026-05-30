window.UPZY_REPORTS = {
  metrics: [
    { label: 'Revenue atribuido', value: '$8,7M', delta: '+24% últimos 30 días', tone: 'green', icon: 'ti-cash' },
    { label: 'Conversión total', value: '12,8%', delta: 'visitante a compra', tone: 'blue', icon: 'ti-chart-arrows-vertical' },
    { label: 'Leads HOT', value: '37', delta: 'prioridad comercial', tone: 'red', icon: 'ti-flame' },
    { label: 'Recovery rate', value: '36,8%', delta: 'carritos recuperados', tone: 'orange', icon: 'ti-shopping-cart-check' }
  ],
  funnel: [
    { stage: 'Visitantes', count: 8200, conversion: 100, value: '$0' },
    { stage: 'Leads', count: 248, conversion: 3.0, value: '$18,6M' },
    { stage: 'Calificados', count: 96, conversion: 38.7, value: '$11,2M' },
    { stage: 'Cotizaciones', count: 54, conversion: 56.2, value: '$7,9M' },
    { stage: 'Carritos', count: 19, conversion: 35.1, value: '$2,8M' },
    { stage: 'Compras', count: 11, conversion: 57.8, value: '$1,9M' }
  ],
  attribution: [
    { channel: 'web', leads: 94, conversions: 18, revenue: '$2,9M', rate: '19,1%' },
    { channel: 'instagram', leads: 61, conversions: 9, revenue: '$1,4M', rate: '14,7%' },
    { channel: 'whatsapp', leads: 47, conversions: 22, revenue: '$3,1M', rate: '46,8%' },
    { channel: 'email', leads: 38, conversions: 13, revenue: '$1,2M', rate: '34,2%' },
    { channel: 'shopify', leads: 19, conversions: 7, revenue: '$1,1M', rate: '36,8%' },
    { channel: 'manual', leads: 12, conversions: 4, revenue: '$720K', rate: '33,3%' }
  ],
  modules: [
    { module: 'CRM Comercial', events: 642, conversions: 31, revenue: '$3,6M', health: 'OK' },
    { module: 'Captación Web', events: 1842, conversions: 64, revenue: '$1,1M', health: 'OK' },
    { module: 'Ruleta', events: 732, conversions: 29, revenue: '$1,2M', health: 'Mejorar' },
    { module: 'Email Marketing', events: 428, conversions: 31, revenue: '$2,4M', health: 'OK' },
    { module: 'Carritos Abandonados', events: 118, conversions: 7, revenue: '$1,1M', health: 'OK' },
    { module: 'Lumi Web', events: 126, conversions: 31, revenue: '$1,8M', health: 'OK' },
    { module: 'Omnicanalidad', events: 183, conversions: 22, revenue: '$2,2M', health: 'OK' },
    { module: 'Automatizaciones', events: 428, conversions: 44, revenue: '$3,8M', health: 'OK' }
  ],
  automations: [
    { name: 'Carrito abandonado HOT', triggered: 41, completed: 39, failed: 2, revenue: '$1,24M', rate: '95%' },
    { name: 'Cupón generado no usado', triggered: 86, completed: 81, failed: 5, revenue: '$640K', rate: '94%' },
    { name: 'Lead capturado por modal', triggered: 128, completed: 126, failed: 2, revenue: '$760K', rate: '98%' },
    { name: 'Cliente post compra', triggered: 173, completed: 166, failed: 7, revenue: '$1,16M', rate: '96%' }
  ],
  events: [
    { time: '18:02', event: 'report.metric_updated', detail: 'Revenue atribuido actualizado por purchase.completed' },
    { time: '18:04', event: 'report.channel_attributed', detail: 'Conversión asignada a WhatsApp como último canal relevante' },
    { time: '18:08', event: 'report.funnel_drop_detected', detail: 'Pérdida alta entre cotización y carrito' },
    { time: '18:13', event: 'report.automation_ranked', detail: 'Carrito abandonado HOT lidera revenue atribuido' },
    { time: '18:21', event: 'report.module_health_updated', detail: 'Ruleta marcada como Mejorar por baja conversión sobre aperturas' }
  ],
  contract: [
    { name: 'metric.id', required: true, reason: 'Identificador único de métrica' },
    { name: 'metric.name', required: true, reason: 'Nombre legible para negocio' },
    { name: 'metric.value', required: true, reason: 'Valor reportado' },
    { name: 'period', required: true, reason: 'Permite comparar hoy, 7 días, 30 días o rango custom' },
    { name: 'sourceModule', required: true, reason: 'Atribuye métrica al módulo que generó el evento' },
    { name: 'channel', required: false, reason: 'Permite atribución por origen comercial' },
    { name: 'revenue', required: false, reason: 'Asocia impacto económico cuando exista compra o cierre' },
    { name: 'conversionRate', required: false, reason: 'Mide eficiencia, no solo volumen' }
  ]
};
