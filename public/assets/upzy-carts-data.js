window.UPZY_CARTS = {
  metrics: [
    { label: 'Carritos abiertos', value: '19', delta: '$2.840.000 estimado', tone: 'orange', icon: 'ti-shopping-cart' },
    { label: 'Recuperados', value: '7', delta: '$1.120.000 atribuido', tone: 'green', icon: 'ti-shopping-cart-check' },
    { label: 'HOT con contacto', value: '8', delta: 'requieren WhatsApp hoy', tone: 'red', icon: 'ti-flame' },
    { label: 'Recovery rate', value: '36,8%', delta: 'mock últimos 7 días', tone: 'blue', icon: 'ti-chart-arrows-vertical' }
  ],
  carts: [
    {
      id: 'CART-2041',
      customerName: 'José Arriagada',
      email: 'jose@empresa.cl',
      phone: '+56 9 0000 0000',
      product: 'Panel LED 80x120',
      variant: 'Muro / Vitrina',
      quantity: 1,
      amount: '$189.990',
      source: 'Shopify',
      status: 'recovering',
      priority: 'high',
      lastActivityAt: 'Hace 38 min',
      recoveryStep: 'Enviar WhatsApp + email con checkout',
      event: 'cart.abandoned_detected'
    },
    {
      id: 'CART-2042',
      customerName: 'María González',
      email: 'maria@cafebarrio.cl',
      phone: '',
      product: 'Panel LED 60x90',
      variant: 'Muro',
      quantity: 2,
      amount: '$259.980',
      source: 'Sitio web',
      status: 'new',
      priority: 'high',
      lastActivityAt: 'Hace 1 h',
      recoveryStep: 'Email inmediato con producto y beneficio',
      event: 'cart.abandoned_detected'
    },
    {
      id: 'CART-2043',
      customerName: 'Rodrigo Pérez',
      email: '',
      phone: '+56 9 1111 1111',
      product: 'Panel con soporte 90x60',
      variant: 'Paloma',
      quantity: 1,
      amount: '$149.990',
      source: 'Instagram / Lumi',
      status: 'recovering',
      priority: 'medium',
      lastActivityAt: 'Hace 3 h',
      recoveryStep: 'Lumi debe pedir email y resolver objeción',
      event: 'cart.recovery_started'
    },
    {
      id: 'CART-2044',
      customerName: 'Daniela Muñoz',
      email: 'daniela@boutique.cl',
      phone: '',
      product: 'Panel vitrina 50x70',
      variant: 'Vitrina',
      quantity: 1,
      amount: '$99.990',
      source: 'Meta Ads',
      status: 'new',
      priority: 'low',
      lastActivityAt: 'Hace 9 h',
      recoveryStep: 'Email 24h con prueba social',
      event: 'cart.abandoned_detected'
    },
    {
      id: 'CART-2045',
      customerName: 'Felipe Rojas',
      email: 'felipe@barberia.cl',
      phone: '+56 9 2222 2222',
      product: 'Pizarra LED',
      variant: 'Interior',
      quantity: 1,
      amount: '$89.990',
      source: 'WhatsApp',
      status: 'recovered',
      priority: 'medium',
      lastActivityAt: 'Ayer',
      recoveryStep: 'Compra recuperada por WhatsApp',
      event: 'cart.recovered'
    }
  ],
  sequence: [
    { step: '0 min', title: 'Email inmediato', channel: 'Email', event: 'cart.email_sent', objective: 'Mostrar producto, precio y checkout para retomar compra' },
    { step: '2 h', title: 'WhatsApp sugerido', channel: 'WhatsApp', event: 'cart.whatsapp_suggested', objective: 'Contactar leads HOT con teléfono disponible' },
    { step: '24 h', title: 'Recordatorio', channel: 'Email', event: 'email.campaign_sent', objective: 'Reforzar urgencia, garantía y compra directa' },
    { step: '48 h', title: 'Seguimiento Lumi', channel: 'Lumi', event: 'cart.lumi_followup_started', objective: 'Resolver objeciones y recomendar producto correcto' },
    { step: '72 h', title: 'Última oportunidad', channel: 'Email + WhatsApp', event: 'cart.expiring', objective: 'Cerrar ciclo o marcar expirado' }
  ],
  events: [
    { time: '14:02', event: 'cart.abandoned_detected', detail: 'Panel LED 80x120 detectado sin compra finalizada' },
    { time: '14:03', event: 'cart.recovery_started', detail: 'Secuencia de recuperación iniciada para CART-2041' },
    { time: '14:04', event: 'cart.email_sent', detail: 'Email inmediato enviado con producto y checkout' },
    { time: '14:18', event: 'email.clicked', detail: 'Cliente hizo click en Retomar compra' },
    { time: '15:02', event: 'cart.whatsapp_suggested', detail: 'Carrito HOT sugerido para seguimiento por WhatsApp' },
    { time: '16:11', event: 'cart.recovered', detail: 'Compra recuperada y atribuida al flujo de carrito' }
  ],
  contract: [
    { name: 'id', required: true, reason: 'Identificador interno del carrito en UPZY' },
    { name: 'shopifyCartId', required: false, reason: 'Permite reconciliar con Shopify cuando exista' },
    { name: 'leadId', required: false, reason: 'Une carrito con CRM y temperatura comercial' },
    { name: 'email', required: false, reason: 'Activa recuperación por email marketing' },
    { name: 'phone', required: false, reason: 'Activa sugerencia de recuperación por WhatsApp' },
    { name: 'product', required: true, reason: 'El producto debe viajar siempre en la recuperación' },
    { name: 'amount', required: true, reason: 'Permite priorizar por valor económico' },
    { name: 'checkoutUrl', required: true, reason: 'CTA principal para retomar compra' },
    { name: 'priority', required: true, reason: 'Ordena esfuerzo comercial por oportunidad' },
    { name: 'status', required: true, reason: 'Controla ciclo: nuevo, recuperando, recuperado o expirado' }
  ]
};
