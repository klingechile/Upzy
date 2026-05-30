window.UPZY_OMNICHANNEL = {
  metrics: [
    { label: 'Conversaciones', value: '183', delta: 'web + IG + WhatsApp', tone: 'blue', icon: 'ti-messages' },
    { label: 'Instagram', value: '61', delta: '33,3% del volumen', tone: 'purple', icon: 'ti-brand-instagram' },
    { label: 'HOT omnicanal', value: '22', delta: 'prioridad comercial', tone: 'red', icon: 'ti-flame' },
    { label: 'Lead matched', value: '74%', delta: 'contactos vinculados', tone: 'green', icon: 'ti-user-check' }
  ],
  inbox: [
    {
      id: 'OMNI-3001', channel: 'instagram', customerName: 'Café Alameda', handle: '@cliente_demo_ig', intent: 'quote', commercialTemperature: 'HOT', productInterest: 'Panel LED 60x90',
      lastMessage: 'Hola, ¿cuánto sale un panel para vitrina y cuánto demora?', nextBestAction: 'Responder precio base, pedir email y ofrecer cotización con retiro/despacho', owner: 'Lumi', status: 'open', updatedAt: 'Hace 8 min'
    },
    {
      id: 'OMNI-3002', channel: 'web', customerName: 'Cliente cafetería', handle: 'visitor_demo', intent: 'product_question', commercialTemperature: 'WARM', productInterest: 'Panel LED 80x120',
      lastMessage: 'Necesito algo que se vea desde la calle.', nextBestAction: 'Recomendar 80x120 y solicitar correo para cotización', owner: 'Lumi', status: 'waiting_customer', updatedAt: 'Hace 18 min'
    },
    {
      id: 'OMNI-3003', channel: 'whatsapp', customerName: 'Cliente cotización', handle: 'whatsapp_demo', intent: 'cart_recovery', commercialTemperature: 'HOT', productInterest: 'Panel LED 80x120',
      lastMessage: 'Quiero avanzar con la cotización, ¿puedo abonar 30%?', nextBestAction: 'Enviar datos de pago y confirmar retiro/despacho', owner: 'Carlos', status: 'open', updatedAt: 'Hace 31 min'
    },
    {
      id: 'OMNI-3004', channel: 'instagram', customerName: 'Boutique Providencia', handle: '@boutique_demo', intent: 'visit_store', commercialTemperature: 'WARM', productInterest: 'Panel vitrina 50x70',
      lastMessage: '¿Tienen tienda física para ir a verlos?', nextBestAction: 'Enviar dirección sala, horario y pedir correo para seguimiento', owner: 'Lumi', status: 'new', updatedAt: 'Hace 1 h'
    },
    {
      id: 'OMNI-3005', channel: 'email', customerName: 'Cliente post compra', handle: 'email_demo', intent: 'support', commercialTemperature: 'COLD', productInterest: 'Pizarra LED',
      lastMessage: 'Gracias, recibí las recomendaciones post compra.', nextBestAction: 'Marcar resuelto y evaluar upsell futuro', owner: 'Sistema', status: 'resolved', updatedAt: 'Ayer'
    }
  ],
  instagramConversation: [
    { role: 'customer', text: 'Hola, vi un reel de ustedes. ¿Cuánto sale un panel para vitrina?' },
    { role: 'lumi', text: 'Hola. Para vitrina normalmente recomendamos 60x90 u 80x120, según el espacio y visibilidad.' },
    { role: 'customer', text: 'Es para una cafetería, quiero que se vea desde la calle.' },
    { role: 'lumi', text: 'Perfecto. Para cafetería y visibilidad desde calle te recomiendo 80x120. ¿Quieres una cotización con precio y opciones de retiro/despacho?' },
    { role: 'customer', text: 'Sí, quiero que me envíen la cotización.' },
    { role: 'lumi', text: 'Listo. Dejo el seguimiento para cotizar y avanzar con abono del 30% si quieres reservar.' }
  ],
  leadMatch: {
    status: 'matched', confidence: '86%', leadId: 'LD-1187', matchedBy: 'Instagram handle + dato capturado en conversación', customerName: 'Café Alameda', contact: 'Dato capturado en conversación', commercialTemperature: 'HOT',
    nextBestAction: 'Enviar cotización de Panel LED 80x120 y solicitar teléfono para cierre por WhatsApp', summary: 'Cliente llega desde Instagram por reel. Busca panel visible desde calle para cafetería. Pide cotización.'
  },
  actions: [
    { title: 'Responder Instagram', channel: 'Instagram', event: 'instagram.reply_suggested', detail: 'Enviar respuesta con recomendación y solicitud de datos de contacto.' },
    { title: 'Crear o enriquecer lead', channel: 'CRM', event: 'crm.lead_enriched', detail: 'Actualizar producto, temperatura e intención comercial.' },
    { title: 'Enviar cotización', channel: 'Email', event: 'quote.sent', detail: 'Usar dato capturado para enviar propuesta formal.' },
    { title: 'Sugerir WhatsApp', channel: 'WhatsApp', event: 'whatsapp.handoff_suggested', detail: 'Pedir teléfono si el cliente quiere cierre inmediato.' }
  ],
  events: [
    { time: '16:02', event: 'instagram.message_received', detail: 'Mensaje entrante desde Instagram' },
    { time: '16:02', event: 'omnichannel.conversation_normalized', detail: 'Mensaje convertido a conversación OMNI-3001' },
    { time: '16:03', event: 'omnichannel.intent_detected', detail: 'Intención detectada: quote' },
    { time: '16:04', event: 'omnichannel.lead_matched', detail: 'Lead vinculado por identificador de canal + dato capturado' },
    { time: '16:05', event: 'omnichannel.temperature_updated', detail: 'Temperatura actualizada a HOT' },
    { time: '16:06', event: 'omnichannel.next_best_action_defined', detail: 'Enviar cotización y solicitar teléfono para WhatsApp' },
    { time: '16:07', event: 'crm.lead_enriched', detail: 'CRM enriquecido con resumen de Instagram' }
  ],
  contract: [
    { name: 'id', required: true, reason: 'Identificador interno de conversación omnicanal' },
    { name: 'channel', required: true, reason: 'Permite atribución y reglas por canal' },
    { name: 'externalThreadId', required: false, reason: 'Vincula hilo externo de Instagram, WhatsApp o email' },
    { name: 'leadId', required: false, reason: 'Conecta conversación con CRM si hay match' },
    { name: 'customerName', required: false, reason: 'Personaliza atención y búsqueda de coincidencias' },
    { name: 'handle', required: false, reason: 'Identificador de Instagram u otro canal' },
    { name: 'intent', required: true, reason: 'Define flujo comercial y prioridad' },
    { name: 'commercialTemperature', required: true, reason: 'Ordena atención por urgencia y valor' },
    { name: 'productInterest', required: false, reason: 'Conecta conversación con recomendación y cotización' },
    { name: 'lastMessage', required: true, reason: 'Permite leer contexto rápido en bandeja' },
    { name: 'nextBestAction', required: true, reason: 'Evita conversaciones sin cierre operativo' },
    { name: 'status', required: true, reason: 'Controla ciclo de atención' }
  ]
};
