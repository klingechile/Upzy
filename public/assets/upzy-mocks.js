window.UPZY_MOCKS = {
  tenant: {
    name: 'Klinge',
    product: 'UPZY CRM',
    tagline: 'Todo conectado. Todo medible. Mejora continua.',
    environment: 'Sprint 0 · Frontend Core'
  },
  metrics: [
    { label: 'Leads activos', value: '248', delta: '+18%', tone: 'blue', icon: 'ti-users' },
    { label: 'Clientes HOT', value: '37', delta: 'requieren cierre', tone: 'red', icon: 'ti-flame' },
    { label: 'Carritos abiertos', value: '19', delta: '$2.840.000 estimado', tone: 'orange', icon: 'ti-shopping-cart' },
    { label: 'Automatizaciones', value: '12', delta: '7 activas', tone: 'green', icon: 'ti-bolt' }
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
      status: 'Sprint 1',
      icon: 'ti-address-book',
      description: 'Contactos, termómetro comercial, historial, próxima mejor acción y tareas.'
    },
    {
      id: 'capture',
      name: 'Captación Web',
      status: 'Sprint 2',
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
    { sprint: 'Sprint 1', title: 'Dashboard + CRM base', outcome: 'Vista comercial con leads, estados y termómetro.' },
    { sprint: 'Sprint 2', title: 'Captación Web', outcome: 'Modal, popup y formularios conectados a eventos.' },
    { sprint: 'Sprint 3', title: 'Ruleta', outcome: 'Spin to Win con reglas, premios y cupón.' },
    { sprint: 'Sprint 4', title: 'Email Marketing', outcome: 'Campañas, plantillas, segmentos y métricas.' },
    { sprint: 'Sprint 5', title: 'Carritos Abandonados', outcome: 'Recuperación por email/WhatsApp con producto y checkout.' },
    { sprint: 'Sprint 6', title: 'Lumi Web', outcome: 'Atención conversacional en sitio web.' },
    { sprint: 'Sprint 7', title: 'Lumi Instagram', outcome: 'Omnicanalidad real con bandeja unificada.' },
    { sprint: 'Sprint 8', title: 'Automatizaciones', outcome: 'Flujos comerciales medibles.' },
    { sprint: 'Sprint 9', title: 'Reportes', outcome: 'Funnel, atribución y mejora continua.' }
  ]
};
