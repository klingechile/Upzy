// src/services/klinge-email-marketing.js
// Servicio comercial de email marketing para Klinge/Upzy.
// Centraliza branding, templates, segmentos, flujos, render y métricas.

const supabase = require('../db/supabase');
const config = require('../config/env');

const BRAND = {
  name: 'Klinge',
  website: 'https://www.klinge.cl',
  whatsapp: '56964672810',
  email: 'contacto@klinge.cl',
  red: '#E1251B',
  redDark: '#C0392B',
  redHover: '#FF3B30',
  black: '#0B0D12',
  graphite: '#121722',
  panel: '#1A2130',
  white: '#F8FAFC',
  muted: '#94A3B8',
  border: '#273244',
};

const SUPPORTED_VARIABLES = [
  'nombre',
  'productos',
  'cart_url',
  'order_url',
  'discount_code',
  'review_url',
  'whatsapp_url',
  'total',
  'empresa',
  'tipo_negocio',
];

const FLOW_DEFINITIONS = [
  {
    id: 'abandoned_cart_1h',
    name: 'Carrito abandonado 1 hora',
    category: 'carrito',
    delay: '1 hora',
    trigger: 'checkout_created',
    template_id: 'cart_1h',
    objective: 'Retomar compra mientras la intención sigue caliente',
    active: true,
  },
  {
    id: 'abandoned_cart_24h',
    name: 'Carrito abandonado 24 horas',
    category: 'carrito',
    delay: '24 horas',
    trigger: 'checkout_still_open',
    template_id: 'cart_24h',
    objective: 'Recuperar compra con confianza y prueba social',
    active: true,
  },
  {
    id: 'abandoned_cart_72h',
    name: 'Carrito abandonado 72 horas',
    category: 'carrito',
    delay: '72 horas',
    trigger: 'checkout_still_open',
    template_id: 'cart_72h',
    objective: 'Último empuje con urgencia comercial',
    active: true,
  },
  {
    id: 'post_purchase_24h',
    name: 'Post compra 24 horas',
    category: 'postventa',
    delay: '24 horas',
    trigger: 'order_paid',
    template_id: 'post_purchase_24h',
    objective: 'Confirmar confianza, instalación, garantía y próximos pasos',
    active: true,
  },
  {
    id: 'review_request_7d',
    name: 'Solicitud de reseña 7 días',
    category: 'resena',
    delay: '7 días',
    trigger: 'order_fulfilled',
    template_id: 'review_7d',
    objective: 'Aumentar reseñas verificadas y prueba social',
    active: true,
  },
  {
    id: 'repurchase_30d',
    name: 'Recompra 30 días',
    category: 'recompra',
    delay: '30 días',
    trigger: 'customer_purchased',
    template_id: 'repurchase_30d',
    objective: 'Upsell/cross-sell para nuevos puntos de luz publicitaria',
    active: true,
  },
  {
    id: 'inactive_customer_45d',
    name: 'Cliente inactivo 45 días',
    category: 'reactivacion',
    delay: '45 días',
    trigger: 'customer_inactive',
    template_id: 'inactive_45d',
    objective: 'Reactivar clientes y leads antiguos',
    active: true,
  },
];

const SEGMENT_DEFINITIONS = [
  { id: 'todos', name: 'Todos los clientes', description: 'Contactos activos con email disponible' },
  { id: 'carrito_abandonado', name: 'Clientes con carrito abandonado', description: 'Leads con intención de compra pendiente' },
  { id: 'compradores', name: 'Clientes que compraron', description: 'Clientes con pedido confirmado' },
  { id: 'sin_compra', name: 'Clientes sin compra', description: 'Leads activos que aún no convierten' },
  { id: 'ticket_alto', name: 'Clientes con ticket alto', description: 'Clientes con mayor valor potencial' },
  { id: 'antiguos_sin_recompra', name: 'Clientes antiguos sin recompra', description: 'Clientes sin nueva compra en el último periodo' },
  { id: 'whatsapp', name: 'Leads de WhatsApp', description: 'Contactos originados desde WhatsApp' },
  { id: 'panel_led', name: 'Interesados en panel LED', description: 'Leads interesados en paneles LED publicitarios' },
  { id: 'panel_60x90', name: 'Interesados en 60x90', description: 'Leads asociados a formato 60x90' },
  { id: 'panel_120x60', name: 'Interesados en 120x60', description: 'Leads asociados a formato 120x60' },
  { id: 'food_business', name: 'Restaurant / cafetería / food truck', description: 'Negocios de alimentos y bebidas' },
];

const BASE_TEMPLATES = [
  {
    id: 'cart_1h',
    name: 'Carrito abandonado 1 hora',
    category: 'carrito',
    status: 'active',
    subject: '{{nombre}}, tu panel LED sigue reservado',
    preheader: 'Retoma tu compra sin volver a buscar todo. Entrega 48-72h y 1 año de garantía.',
    cta: 'Finalizar compra',
    ctaUrl: '{{cart_url}}',
    eyebrow: 'Carrito pendiente',
    title: 'Tu panel LED sigue esperando por ti',
    body: 'Vimos que dejaste pendiente {{productos}}. Te lo dejamos listo para que puedas retomar tu compra en segundos. Más de 5.000 clientes ya usan Klinge para hacer destacar su negocio con luz publicitaria de alto impacto.',
    proof: 'Entrega 48-72 horas · 1 año de garantía · Compra segura',
    footerNote: 'Respóndeme por este mismo canal y te ayudo con medidas, instalación o elección del panel.',
    variables: ['nombre', 'productos', 'cart_url', 'whatsapp_url'],
  },
  {
    id: 'cart_24h',
    name: 'Carrito abandonado 24 horas',
    category: 'carrito',
    status: 'active',
    subject: 'Más de 5.000 clientes ya destacan con Klinge',
    preheader: 'Tu carrito sigue disponible. Asegura tu panel LED antes de perder la oportunidad.',
    cta: 'Recuperar mi carrito',
    ctaUrl: '{{cart_url}}',
    eyebrow: 'Aún estás a tiempo',
    title: 'Tu negocio puede verse más visible desde esta semana',
    body: '{{nombre}}, el producto {{productos}} sigue disponible. Nuestros paneles LED publicitarios están pensados para vitrinas, restaurantes, cafeterías, food trucks y comercios que necesitan atraer más miradas desde la calle.',
    proof: 'Clientes reales · Alto impacto visual · Soporte en medidas e instalación',
    footerNote: 'También puedes responder este correo si necesitas validar medida, formato o tipo de instalación.',
    variables: ['nombre', 'productos', 'cart_url', 'whatsapp_url'],
  },
  {
    id: 'cart_72h',
    name: 'Carrito abandonado 72 horas',
    category: 'carrito',
    status: 'active',
    subject: 'Última oportunidad para retomar tu compra Klinge',
    preheader: 'Tu carrito quedará disponible por poco tiempo más.',
    cta: 'Comprar ahora',
    ctaUrl: '{{cart_url}}',
    eyebrow: 'Último recordatorio',
    title: 'No dejes que tu negocio pase desapercibido',
    body: '{{nombre}}, tu selección {{productos}} sigue pendiente. Si ya tienes diseño, puedes avanzar rápido: producción y despacho en 48-72 horas. En compras que apliquen, puedes abonar 30% y pagar el resto al despacho.',
    proof: '48-72h · 1 año de garantía · Abono 30% según caso',
    footerNote: 'Respóndeme por este mismo canal y te ayudo a cerrar la mejor opción para tu negocio.',
    variables: ['nombre', 'productos', 'cart_url', 'discount_code', 'whatsapp_url'],
  },
  {
    id: 'post_purchase_24h',
    name: 'Post compra 24 horas',
    category: 'postventa',
    status: 'active',
    subject: 'Tu pedido Klinge ya está en proceso',
    preheader: 'Gracias por tu compra. Revisa garantía, instalación y próximos pasos.',
    cta: 'Ver estado del pedido',
    ctaUrl: '{{order_url}}',
    eyebrow: 'Compra confirmada',
    title: 'Estamos preparando tu panel LED',
    body: '{{nombre}}, gracias por confiar en Klinge. Tu pedido {{productos}} ya está en proceso. Recuerda que cuentas con 1 año de garantía y orientación para instalación, uso y cuidados del panel.',
    proof: 'Pedido en preparación · Garantía 1 año · Acompañamiento Klinge',
    footerNote: 'Responde este correo con cualquier duda de instalación, medidas o uso. Te ayudo por este mismo canal.',
    variables: ['nombre', 'productos', 'order_url', 'whatsapp_url'],
  },
  {
    id: 'review_7d',
    name: 'Solicitud de reseña 7 días',
    category: 'resena',
    status: 'active',
    subject: '{{nombre}}, ¿cómo quedó tu panel LED?',
    preheader: 'Tu opinión ayuda a otros negocios a tomar una mejor decisión.',
    cta: 'Dejar reseña',
    ctaUrl: '{{review_url}}',
    eyebrow: 'Tu experiencia importa',
    title: 'Cuéntanos cómo quedó tu negocio con Klinge',
    body: 'Queremos saber cómo fue tu experiencia con {{productos}}. Tu reseña nos ayuda a mejorar y también ayuda a otros dueños de negocio a elegir una solución que realmente destaque su vitrina o local.',
    proof: 'Tu opinión construye confianza para nuevos clientes',
    footerNote: 'Puedes responder con una foto de tu instalación si quieres que la revisemos y te demos recomendaciones.',
    variables: ['nombre', 'productos', 'review_url', 'whatsapp_url'],
  },
  {
    id: 'repurchase_30d',
    name: 'Recompra / Upsell 30 días',
    category: 'recompra',
    status: 'active',
    subject: 'Tu negocio puede destacar aún más',
    preheader: 'Agrega otro punto de luz y aumenta la visibilidad de tu local.',
    cta: 'Ver más paneles',
    ctaUrl: '{{whatsapp_url}}',
    eyebrow: 'Nueva oportunidad comercial',
    title: 'Un segundo panel puede multiplicar tu visibilidad',
    body: '{{nombre}}, muchos clientes comienzan con un panel y luego agregan otro para promociones, menú, vitrina o entrada. Podemos ayudarte a elegir el siguiente formato según el espacio de tu negocio.',
    proof: 'Formatos 60x90 · 120x60 · Paloma · Vitrina · Interior',
    footerNote: 'Respóndeme con una foto del espacio y te ayudo a elegir el formato más conveniente.',
    variables: ['nombre', 'whatsapp_url', 'tipo_negocio'],
  },
  {
    id: 'promo_campaign',
    name: 'Campaña promocional',
    category: 'campana',
    status: 'active',
    subject: 'Haz que tu negocio destaque con luz desde $49.990',
    preheader: 'Paneles LED publicitarios para vitrinas, restaurantes y comercios.',
    cta: 'Cotizar ahora',
    ctaUrl: '{{whatsapp_url}}',
    eyebrow: 'Oferta comercial Klinge',
    title: 'La luz atrae clientes. Tu negocio también puede hacerlo.',
    body: '{{nombre}}, en Klinge tenemos paneles LED publicitarios desde $49.990 para negocios que necesitan mayor visibilidad. Ideales para promociones, menú, vitrina, fachada e impulso de ventas.',
    proof: 'Desde $49.990 · Más de 5.000 clientes · Entrega 48-72h',
    footerNote: 'Respóndeme por este canal y te ayudo a elegir la medida correcta para tu negocio.',
    variables: ['nombre', 'whatsapp_url', 'tipo_negocio'],
  },
  {
    id: 'inactive_45d',
    name: 'Cliente inactivo 45 días',
    category: 'reactivacion',
    status: 'active',
    subject: '{{nombre}}, tenemos nuevas opciones para hacer destacar tu negocio',
    preheader: 'Retoma tu cotización o descubre nuevos formatos de panel LED.',
    cta: 'Retomar conversación',
    ctaUrl: '{{whatsapp_url}}',
    eyebrow: 'Seguimiento Klinge',
    title: 'Quizás ahora sí es el momento de destacar',
    body: 'Sabemos que elegir el panel correcto puede tomar tiempo. Si sigues evaluando opciones, podemos ayudarte a comparar medidas, formato, visibilidad y uso según tu tipo de negocio.',
    proof: 'Asesoría por medidas · Compra simple · Garantía 1 año',
    footerNote: 'Respóndeme con el espacio disponible y te oriento con la mejor alternativa.',
    variables: ['nombre', 'whatsapp_url', 'tipo_negocio'],
  },
];

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getWhatsAppUrl = (text = 'Hola Klinge, quiero cotizar un panel LED') => (
  `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`
);

const normalizeTemplate = (row = {}) => ({
  id: row.id,
  name: row.name || row.nombre,
  category: row.category || row.categoria || 'general',
  status: row.status || (row.activo === false ? 'inactive' : 'active'),
  subject: row.subject || row.asunto || '',
  preheader: row.preheader || row.preview || '',
  html: row.html || row.cuerpo || '',
  body: row.body || row.cuerpo || '',
  cta: row.cta || 'Ver más',
  ctaUrl: row.ctaUrl || row.cta_url || '{{whatsapp_url}}',
  variables: row.variables || SUPPORTED_VARIABLES,
  is_seed: !!row.is_seed,
});

const normalizeData = (data = {}) => {
  const products = Array.isArray(data.productos)
    ? data.productos.map(p => p.title || p.name || p).join(', ')
    : data.productos;

  return {
    nombre: data.nombre || data.name || 'Hola',
    productos: products || data.producto || 'Panel LED publicitario',
    cart_url: data.cart_url || data.checkout_url || BRAND.website,
    order_url: data.order_url || BRAND.website,
    discount_code: data.discount_code || data.codigo_descuento || 'KLINGE',
    review_url: data.review_url || `${BRAND.website}/pages/resenas`,
    whatsapp_url: data.whatsapp_url || getWhatsAppUrl(),
    total: data.total || data.monto || '',
    empresa: data.empresa || data.company || 'tu negocio',
    tipo_negocio: data.tipo_negocio || 'negocio',
  };
};

const replaceVariables = (content = '', data = {}) => {
  const normalized = normalizeData(data);
  return String(content).replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => escapeHtml(normalized[key] ?? ''));
};

const replaceUrlVariables = (content = '', data = {}) => {
  const normalized = normalizeData(data);
  return String(content).replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => normalized[key] ?? '');
};

const getTemplateById = async (templateId) => {
  const seed = BASE_TEMPLATES.find(t => t.id === templateId);
  if (seed) return { ...seed, is_seed: true };

  const { data } = await supabase
    .from('upzy_templates')
    .select('*')
    .eq('tenant_id', config.tenantId)
    .eq('id', templateId)
    .maybeSingle();

  return data ? normalizeTemplate(data) : null;
};

const listTemplates = async ({ category } = {}) => {
  let dbTemplates = [];
  try {
    let q = supabase
      .from('upzy_templates')
      .select('*')
      .eq('tenant_id', config.tenantId)
      .eq('canal', 'email');
    if (category) q = q.eq('categoria', category);
    const { data } = await q.order('categoria').order('nombre');
    dbTemplates = (data || []).map(normalizeTemplate);
  } catch (error) {
    dbTemplates = [];
  }

  const seeds = BASE_TEMPLATES
    .filter(t => !category || t.category === category)
    .map(t => ({ ...t, is_seed: true }));

  const dbIds = new Set(dbTemplates.map(t => t.id));
  return [...seeds.filter(t => !dbIds.has(t.id)), ...dbTemplates];
};

const htmlShell = ({ subject, preheader, content, cta, ctaUrl, data = {} }) => {
  const safeSubject = replaceVariables(subject, data);
  const safePreheader = replaceVariables(preheader, data);
  const safeCta = replaceVariables(cta, data);
  const url = replaceUrlVariables(ctaUrl || '{{whatsapp_url}}', data);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${safeSubject}</title>
  <style>
    body{margin:0;padding:0;background:#0B0D12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#F8FAFC}
    table{border-collapse:collapse} a{text-decoration:none}
    @media(max-width:620px){.wrap{width:100%!important}.pad{padding:24px!important}.btn{display:block!important;text-align:center!important}.cols td{display:block!important;width:100%!important;margin-bottom:10px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:${BRAND.black};">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.black};padding:28px 12px">
    <tr><td align="center">
      <table class="wrap" role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:620px;max-width:620px;background:${BRAND.graphite};border:1px solid ${BRAND.border};border-radius:22px;overflow:hidden">
        <tr>
          <td style="padding:22px 28px;background:${BRAND.black};border-bottom:3px solid ${BRAND.red}">
            <table width="100%" role="presentation"><tr>
              <td style="font-size:24px;font-weight:900;letter-spacing:2px;color:#fff">KLINGE</td>
              <td align="right" style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:1.4px">Paneles LED publicitarios</td>
            </tr></table>
          </td>
        </tr>
        ${content}
        <tr>
          <td class="pad" style="padding:0 34px 34px;text-align:center;background:${BRAND.graphite}">
            <a class="btn" href="${url}" style="display:inline-block;background:${BRAND.red};color:white;padding:15px 26px;border-radius:14px;font-weight:800;font-size:15px;box-shadow:0 12px 28px rgba(225,37,27,.25)">${safeCta}</a>
            <div style="height:12px"></div>
            <a href="${normalizeData(data).whatsapp_url}" style="color:${BRAND.muted};font-size:13px">Responder por WhatsApp</a>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 30px;background:${BRAND.black};color:${BRAND.muted};font-size:11px;line-height:1.7;text-align:center">
            Klinge · ${BRAND.website.replace('https://','')} · ${BRAND.email}<br>
            Recibiste este correo porque eres cliente o contacto de Klinge.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const renderTemplate = async (templateInput, data = {}) => {
  const template = normalizeTemplate(templateInput);
  const subject = replaceVariables(template.subject, data);
  const preheader = replaceVariables(template.preheader, data);

  if (template.html && /<html|<table|<div/i.test(template.html)) {
    return {
      asunto: subject,
      subject,
      preview: preheader,
      preheader,
      html: replaceUrlVariables(replaceVariables(template.html, data), data),
      template,
    };
  }

  const source = template.body || template.html || '';
  const title = replaceVariables(template.title || template.name || template.subject, data);
  const eyebrow = replaceVariables(template.eyebrow || template.category || 'Klinge', data);
  const body = replaceVariables(source, data).replace(/\n/g, '<br>');
  const proof = replaceVariables(template.proof || 'Más de 5.000 clientes · Entrega 48-72h · Garantía 1 año', data);
  const footerNote = replaceVariables(template.footerNote || 'Respóndeme por este mismo canal y te ayudo.', data);

  const content = `
    <tr>
      <td class="pad" style="padding:36px 34px 20px;background:${BRAND.graphite}">
        <div style="color:${BRAND.red};font-weight:900;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:12px">${eyebrow}</div>
        <h1 style="margin:0;color:#fff;font-size:34px;line-height:1.05;letter-spacing:-.7px">${title}</h1>
        <p style="margin:18px 0 0;color:#CBD5E1;font-size:16px;line-height:1.65">${body}</p>
      </td>
    </tr>
    <tr>
      <td class="pad" style="padding:4px 34px 26px;background:${BRAND.graphite}">
        <table class="cols" width="100%" role="presentation">
          <tr>
            <td width="33.3%" style="padding:10px;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:14px;text-align:center;color:#fff;font-size:12px"><strong>+5.000</strong><br><span style="color:${BRAND.muted}">clientes</span></td>
            <td width="33.3%" style="padding:10px;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:14px;text-align:center;color:#fff;font-size:12px"><strong>48-72h</strong><br><span style="color:${BRAND.muted}">entrega</span></td>
            <td width="33.3%" style="padding:10px;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:14px;text-align:center;color:#fff;font-size:12px"><strong>1 año</strong><br><span style="color:${BRAND.muted}">garantía</span></td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:${BRAND.muted};font-size:13px;line-height:1.6">${proof}</p>
        <p style="margin:10px 0 0;color:#E2E8F0;font-size:13px;line-height:1.6;border-left:3px solid ${BRAND.red};padding-left:12px">${footerNote}</p>
      </td>
    </tr>`;

  const html = htmlShell({
    subject: template.subject,
    preheader: template.preheader,
    content,
    cta: template.cta,
    ctaUrl: template.ctaUrl,
    data,
  });

  return { asunto: subject, subject, preview: preheader, preheader, html, template };
};

const createTemplate = async (payload = {}) => {
  const required = payload.name || payload.nombre;
  if (!required) throw new Error('name requerido');

  const body = payload.body || payload.html || payload.cuerpo || '';
  const variables = payload.variables || SUPPORTED_VARIABLES.filter(v => JSON.stringify(payload).includes(`{{${v}}}`));

  const insert = {
    tenant_id: config.tenantId,
    nombre: payload.name || payload.nombre,
    canal: 'email',
    categoria: payload.category || payload.categoria || 'campana',
    asunto: payload.subject || payload.asunto || '',
    cuerpo: body,
    variables: variables.length ? variables : SUPPORTED_VARIABLES,
    activo: payload.status ? payload.status === 'active' : true,
  };

  const { data, error } = await supabase.from('upzy_templates').insert(insert).select().single();
  if (error) throw error;
  return normalizeTemplate(data);
};

const updateTemplate = async (id, payload = {}) => {
  const updates = {};
  if (payload.name || payload.nombre) updates.nombre = payload.name || payload.nombre;
  if (payload.category || payload.categoria) updates.categoria = payload.category || payload.categoria;
  if (payload.subject || payload.asunto) updates.asunto = payload.subject || payload.asunto;
  if (payload.body || payload.html || payload.cuerpo) updates.cuerpo = payload.body || payload.html || payload.cuerpo;
  if (payload.variables) updates.variables = payload.variables;
  if (payload.status) updates.activo = payload.status === 'active';
  if (payload.activo !== undefined) updates.activo = !!payload.activo;

  const { data, error } = await supabase
    .from('upzy_templates')
    .update(updates)
    .eq('tenant_id', config.tenantId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeTemplate(data);
};

const estimateSegmentCount = async (segmentId = 'todos') => {
  try {
    let q = supabase
      .from('upzy_leads')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', config.tenantId)
      .eq('activo', true)
      .not('email', 'is', null);

    if (segmentId === 'whatsapp') q = q.eq('canal_origen', 'whatsapp');
    if (segmentId === 'food_business') q = q.or('tipo_negocio.ilike.%restaurant%,tipo_negocio.ilike.%cafeter%,tipo_negocio.ilike.%food%');
    if (segmentId === 'panel_led') q = q.or('interes.ilike.%panel%,producto_interes.ilike.%panel%');
    if (segmentId === 'panel_60x90') q = q.or('interes.ilike.%60x90%,producto_interes.ilike.%60x90%');
    if (segmentId === 'panel_120x60') q = q.or('interes.ilike.%120x60%,producto_interes.ilike.%120x60%');
    if (segmentId !== 'todos' && !['whatsapp', 'food_business', 'panel_led', 'panel_60x90', 'panel_120x60'].includes(segmentId)) q = q.eq('segmento', segmentId);

    const { count, error } = await q;
    if (error) return 0;
    return count || 0;
  } catch (error) {
    return 0;
  }
};

const listSegments = async () => {
  const enriched = [];
  for (const segment of SEGMENT_DEFINITIONS) {
    const count = await estimateSegmentCount(segment.id);
    enriched.push({ ...segment, count });
  }
  return enriched;
};

const getRecipientsForSegment = async (segmentId = 'todos', limit = 1000) => {
  let q = supabase
    .from('upzy_leads')
    .select('id,nombre,empresa,email,tipo_negocio,segmento')
    .eq('tenant_id', config.tenantId)
    .eq('activo', true)
    .not('email', 'is', null)
    .limit(limit);

  if (segmentId && segmentId !== 'todos') q = q.eq('segmento', segmentId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

const getMetrics = async () => {
  try {
    const { data } = await supabase
      .from('upzy_email_sends')
      .select('estado,tipo,campana_id,created_at')
      .eq('tenant_id', config.tenantId);

    const sends = data || [];
    const sent = sends.filter(s => ['enviado', 'entregado', 'abierto', 'click'].includes(s.estado)).length;
    const opens = sends.filter(s => s.estado === 'abierto').length;
    const clicks = sends.filter(s => s.estado === 'click').length;
    const errors = sends.filter(s => ['error', 'rebotado'].includes(s.estado)).length;

    return {
      sent,
      delivered: sends.filter(s => s.estado === 'entregado').length,
      opens,
      clicks,
      errors,
      recovered_carts: sends.filter(s => s.tipo === 'carrito' && s.estado === 'click').length,
      attributed_revenue: 0,
      active_campaigns: new Set(sends.filter(s => s.campana_id).map(s => s.campana_id)).size,
      active_flows: FLOW_DEFINITIONS.filter(f => f.active).length,
      open_rate: sent ? Math.round((opens / sent) * 1000) / 10 : 0,
      click_rate: sent ? Math.round((clicks / sent) * 1000) / 10 : 0,
    };
  } catch (error) {
    return {
      sent: 0,
      delivered: 0,
      opens: 0,
      clicks: 0,
      errors: 0,
      recovered_carts: 0,
      attributed_revenue: 0,
      active_campaigns: 0,
      active_flows: FLOW_DEFINITIONS.filter(f => f.active).length,
      open_rate: 0,
      click_rate: 0,
    };
  }
};

const createCampaign = async (payload = {}) => {
  const segment = payload.segment || payload.segmento || 'todos';
  const estimate = await estimateSegmentCount(segment);
  const campaign = {
    tenant_id: config.tenantId,
    nombre: payload.name || payload.nombre || 'Campaña Email Klinge',
    tipo: 'email',
    segmento: segment,
    estado: payload.scheduled_at ? 'programada' : 'borrador',
    template_id: payload.template_id || payload.templateId || null,
    total_destinatarios: estimate,
  };

  try {
    const { data, error } = await supabase.from('upzy_campanas').insert(campaign).select().single();
    if (error) throw error;
    return { ...data, estimated_recipients: estimate };
  } catch (error) {
    return {
      id: `draft-${Date.now()}`,
      ...campaign,
      estimated_recipients: estimate,
      warning: 'Campaña creada en modo temporal; revisa columnas de upzy_campanas para persistencia completa.',
    };
  }
};

module.exports = {
  BRAND,
  SUPPORTED_VARIABLES,
  BASE_TEMPLATES,
  FLOW_DEFINITIONS,
  SEGMENT_DEFINITIONS,
  replaceVariables,
  renderTemplate,
  getTemplateById,
  listTemplates,
  createTemplate,
  updateTemplate,
  listSegments,
  estimateSegmentCount,
  getRecipientsForSegment,
  getMetrics,
  createCampaign,
  getWhatsAppUrl,
};
