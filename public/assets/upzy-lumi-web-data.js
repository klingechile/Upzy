window.UPZY_LUMI_WEB = {
  metrics: [
    { label: 'Conversaciones web', value: '126', delta: '+22% últimos 7 días', tone: 'blue', icon: 'ti-message-chatbot' },
    { label: 'Datos capturados', value: '74', delta: '58,7% con email o teléfono', tone: 'green', icon: 'ti-user-plus' },
    { label: 'Cotizaciones pedidas', value: '31', delta: '24,6% de conversaciones', tone: 'orange', icon: 'ti-file-dollar' },
    { label: 'Carritos asistidos', value: '12', delta: '$1,8M en oportunidad', tone: 'purple', icon: 'ti-shopping-cart-question' }
  ],
  useCases: [
    { title: 'Recomendar producto', intent: 'product_question', detail: 'Lumi pregunta uso, medida, tipo de negocio y recomienda panel adecuado.' },
    { title: 'Pedir cotización', intent: 'quote', detail: 'Captura email, producto de interés y genera resumen comercial.' },
    { title: 'Recuperar carrito', intent: 'cart_recovery', detail: 'Usa producto, monto y checkout como contexto para resolver objeciones.' },
    { title: 'Agendar sala', intent: 'visit_store', detail: 'Orienta visita a sala y captura datos para seguimiento.' },
    { title: 'Resolver despacho', intent: 'shipping_question', detail: 'Informa opciones de retiro/despacho y deja próxima acción.' },
    { title: 'Cerrar compra', intent: 'buy_now', detail: 'Refuerza 30% de abono, pago web o WhatsApp según contexto.' }
  ],
  conversation: [
    { role: 'bot', text: 'Hola, soy Lumi de Klinge. Te ayudo a elegir el panel LED correcto para tu negocio.' },
    { role: 'user', text: 'Necesito algo para una cafetería, que se vea desde la vitrina.' },
    { role: 'bot', text: 'Perfecto. Para vitrina de cafetería te recomiendo un panel LED 60x90 o 80x120, según el espacio disponible.' },
    { role: 'bot', text: '¿Quieres que te envíe una cotización con precio, producto recomendado y forma de compra?' },
    { role: 'user', text: 'Sí, mándamela al correo.' },
    { role: 'bot', text: 'Genial. Te dejo cotizado el Panel LED 80x120 para vitrina. Puedes abonar 30% y pagar el saldo al retiro o despacho.' }
  ],
  leadSummary: {
    name: 'Cliente cafetería',
    email: 'cliente@cafeteria.cl',
    phone: '+56 9 0000 0000',
    businessType: 'Cafetería',
    intent: 'quote',
    productInterest: 'Panel LED 80x120 vitrina',
    recommendedProduct: 'Panel LED 80x120',
    commercialTemperature: 'HOT',
    nextBestAction: 'Enviar cotización y link de pago con abono 30%',
    summary: 'Cliente busca panel visible desde vitrina para cafetería. Tiene intención de cotizar y dejó correo para seguimiento.'
  },
  recommendations: [
    { product: 'Panel LED 60x90', fit: 'Vitrina pequeña', reason: 'Buena visibilidad, tamaño manejable y bajo consumo.' },
    { product: 'Panel LED 80x120', fit: 'Vitrina principal', reason: 'Mayor impacto visual y mejor presencia desde calle.' },
    { product: 'Panel con soporte 90x60', fit: 'Entrada o pasillo', reason: 'No requiere muro y puede moverse según flujo de clientes.' }
  ],
  events: [
    { time: '15:02', event: 'lumi.web.opened', detail: 'Widget abierto desde página Panel LED vitrina' },
    { time: '15:03', event: 'lumi.conversation_started', detail: 'Visitante consulta por cafetería y visibilidad en vitrina' },
    { time: '15:04', event: 'lumi.intent_detected', detail: 'Intención detectada: quote' },
    { time: '15:05', event: 'lumi.product_recommended', detail: 'Recomendado Panel LED 80x120' },
    { time: '15:06', event: 'lumi.lead_data_captured', detail: 'Email y tipo de negocio capturados' },
    { time: '15:07', event: 'lumi.next_best_action_defined', detail: 'Enviar cotización y link de pago con 30% de abono' },
    { time: '15:07', event: 'crm.lead_enriched', detail: 'Lead actualizado como HOT en CRM' }
  ],
  contract: [
    { name: 'id', required: true, reason: 'Identificador de conversación' },
    { name: 'channel', required: true, reason: 'Debe identificar origen web para omnicanalidad' },
    { name: 'leadId', required: false, reason: 'Une conversación con contacto existente' },
    { name: 'email', required: false, reason: 'Habilita cotización y seguimiento por email' },
    { name: 'phone', required: false, reason: 'Habilita cierre por WhatsApp' },
    { name: 'intent', required: true, reason: 'Define flujo comercial y próxima acción' },
    { name: 'productInterest', required: false, reason: 'Conecta conversación con producto o campaña' },
    { name: 'recommendedProduct', required: false, reason: 'Permite medir recomendación y conversión' },
    { name: 'commercialTemperature', required: true, reason: 'Prioriza seguimiento comercial' },
    { name: 'nextBestAction', required: true, reason: 'Evita que la conversación quede sin cierre operativo' },
    { name: 'summary', required: true, reason: 'Entrega contexto al CRM y al equipo comercial' }
  ]
};
