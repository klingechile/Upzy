// src/services/klinge-email-marketing.js
// Email marketing comercial para Klinge/Upzy.
// Importante: WhatsApp no se edita aquí; WhatsApp usa templates aprobados en Meta.

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
  'nombre', 'productos', 'cart_url', 'order_url', 'discount_code',
  'review_url', 'whatsapp_url', 'total', 'empresa', 'tipo_negocio'
];

const FLOW_DEFINITIONS = [
  { id: 'abandoned_cart_1h', name: 'Carrito abandonado 1 hora', category: 'carrito', delay: '1 hora', trigger: 'checkout_created', template_id: 'cart_1h', active: true },
  { id: 'abandoned_cart_24h', name: 'Carrito abandonado 24 horas', category: 'carrito', delay: '24 horas', trigger: 'checkout_still_open', template_id: 'cart_24h', active: true },
  { id: 'abandoned_cart_72h', name: 'Carrito abandonado 72 horas', category: 'carrito', delay: '72 horas', trigger: 'checkout_still_open', template_id: 'cart_72h', active: true },
  { id: 'post_purchase_24h', name: 'Post compra 24 horas', category: 'postventa', delay: '24 horas', trigger: 'order_paid', template_id: 'post_purchase_24h', active: true },
  { id: 'review_request_7d', name: 'Solicitud de reseña 7 días', category: 'resena', delay: '7 días', trigger: 'order_fulfilled', template_id: 'review_7d', active: true },
  { id: 'repurchase_30d', name: 'Recompra 30 días', category: 'recompra', delay: '30 días', trigger: 'customer_purchased', template_id: 'repurchase_30d', active: true },
  { id: 'inactive_customer_45d', name: 'Cliente inactivo 45 días', category: 'reactivacion', delay: '45 días', trigger: 'customer_inactive', template_id: 'inactive_45d', active: true },
];

const SEGMENT_DEFINITIONS = [
  { id: 'todos', name: 'Todos los clientes', description: 'Contactos activos con email disponible' },
  { id: 'carrito_abandonado', name: 'Clientes con carrito abandonado', description: 'Leads con intención pendiente' },
  { id: 'compradores', name: 'Clientes que compraron', description: 'Clientes con pedido confirmado' },
  { id: 'sin_compra', name: 'Clientes sin compra', description: 'Leads activos que aún no convierten' },
  { id: 'ticket_alto', name: 'Clientes con ticket alto', description: 'Clientes de mayor valor potencial' },
  { id: 'whatsapp', name: 'Leads de WhatsApp', description: 'Contactos originados desde WhatsApp' },
  { id: 'panel_led', name: 'Interesados en panel LED', description: 'Leads interesados en paneles LED publicitarios' },
  { id: 'food_business', name: 'Restaurant / cafetería / food truck', description: 'Negocios de alimentos y bebidas' },
];

const BASE_TEMPLATES = [
  template('cart_1h', 'Carrito abandonado 1 hora', 'carrito', '{{nombre}}, tu panel LED sigue reservado', 'Retoma tu compra sin volver a buscar todo. Entrega 48-72h y 1 año de garantía.', 'Tu panel LED sigue esperando por ti', 'Vimos que dejaste pendiente {{productos}}. Te lo dejamos listo para que puedas retomar tu compra en segundos. Más de 5.000 clientes ya usan Klinge para hacer destacar su negocio con luz publicitaria de alto impacto.', 'Finalizar compra', '{{cart_url}}'),
  template('cart_24h', 'Carrito abandonado 24 horas', 'carrito', 'Más de 5.000 clientes ya destacan con Klinge', 'Tu carrito sigue disponible. Asegura tu panel LED antes de perder la oportunidad.', 'Tu negocio puede verse más visible desde esta semana', '{{nombre}}, el producto {{productos}} sigue disponible. Nuestros paneles LED publicitarios están pensados para vitrinas, restaurantes, cafeterías, food trucks y comercios que necesitan atraer más miradas desde la calle.', 'Recuperar mi carrito', '{{cart_url}}'),
  template('cart_72h', 'Carrito abandonado 72 horas', 'carrito', 'Última oportunidad para retomar tu compra Klinge', 'Tu carrito quedará disponible por poco tiempo más.', 'No dejes que tu negocio pase desapercibido', '{{nombre}}, tu selección {{productos}} sigue pendiente. Si ya tienes diseño, puedes avanzar rápido: producción y despacho en 48-72 horas. En compras que apliquen, puedes abonar 30% y pagar el resto al despacho.', 'Comprar ahora', '{{cart_url}}'),
  template('post_purchase_24h', 'Post compra 24 horas', 'postventa', 'Tu pedido Klinge ya está en proceso', 'Gracias por tu compra. Revisa garantía, instalación y próximos pasos.', 'Estamos preparando tu panel LED', '{{nombre}}, gracias por confiar en Klinge. Tu pedido {{productos}} ya está en proceso. Recuerda que cuentas con 1 año de garantía y orientación para instalación, uso y cuidados del panel.', 'Ver estado del pedido', '{{order_url}}'),
  template('review_7d', 'Solicitud de reseña 7 días', 'resena', '{{nombre}}, ¿cómo quedó tu panel LED?', 'Tu opinión ayuda a otros negocios a tomar una mejor decisión.', 'Cuéntanos cómo quedó tu negocio con Klinge', 'Queremos saber cómo fue tu experiencia con {{productos}}. Tu reseña nos ayuda a mejorar y también ayuda a otros dueños de negocio a elegir una solución que realmente destaque su vitrina o local.', 'Dejar reseña', '{{review_url}}'),
  template('repurchase_30d', 'Recompra / Upsell 30 días', 'recompra', 'Tu negocio puede destacar aún más', 'Agrega otro punto de luz y aumenta la visibilidad de tu local.', 'Un segundo panel puede multiplicar tu visibilidad', '{{nombre}}, muchos clientes comienzan con un panel y luego agregan otro para promociones, menú, vitrina o entrada. Podemos ayudarte a elegir el siguiente formato según el espacio de tu negocio.', 'Ver más paneles', '{{whatsapp_url}}'),
  template('promo_campaign', 'Campaña promocional', 'campana', 'Haz que tu negocio destaque con luz desde $49.990', 'Paneles LED publicitarios para vitrinas, restaurantes y comercios.', 'La luz atrae clientes. Tu negocio también puede hacerlo.', '{{nombre}}, en Klinge tenemos paneles LED publicitarios desde $49.990 para negocios que necesitan mayor visibilidad. Ideales para promociones, menú, vitrina, fachada e impulso de ventas.', 'Cotizar ahora', '{{whatsapp_url}}'),
  template('inactive_45d', 'Cliente inactivo 45 días', 'reactivacion', '{{nombre}}, tenemos nuevas opciones para hacer destacar tu negocio', 'Retoma tu cotización o descubre nuevos formatos de panel LED.', 'Quizás ahora sí es el momento de destacar', 'Sabemos que elegir el panel correcto puede tomar tiempo. Si sigues evaluando opciones, podemos ayudarte a comparar medidas, formato, visibilidad y uso según tu tipo de negocio.', 'Retomar conversación', '{{whatsapp_url}}'),
];

function template(id, name, category, subject, preheader, title, body, cta, ctaUrl) {
  return {
    id, name, category, status: 'active', subject, preheader, title, body, cta, ctaUrl,
    proof: 'Más de 5.000 clientes · Entrega 48-72h · Garantía 1 año',
    footerNote: 'Respóndeme por este mismo canal y te ayudo con medidas, instalación o elección del panel.',
    variables: SUPPORTED_VARIABLES,
    is_seed: true,
  };
}

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const getWhatsAppUrl = (text = 'Hola Klinge, quiero cotizar un panel LED') =>
  `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;

const normalizeData = (data = {}) => ({
  nombre: data.nombre || data.name || 'Hola',
  productos: Array.isArray(data.productos) ? data.productos.map(p => p.title || p.name || p).join(', ') : (data.productos || data.producto || 'Panel LED publicitario'),
  cart_url: data.cart_url || data.checkout_url || BRAND.website,
  order_url: data.order_url || BRAND.website,
  discount_code: data.discount_code || 'KLINGE',
  review_url: data.review_url || `${BRAND.website}/pages/resenas`,
  whatsapp_url: data.whatsapp_url || getWhatsAppUrl(),
  total: data.total || data.monto || '',
  empresa: data.empresa || data.company || 'tu negocio',
  tipo_negocio: data.tipo_negocio || 'negocio',
});

const replaceVariables = (content = '', data = {}) => {
  const normalized = normalizeData(data);
  return String(content).replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => escapeHtml(normalized[key] ?? ''));
};

const replaceUrlVariables = (content = '', data = {}) => {
  const normalized = normalizeData(data);
  return String(content).replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => normalized[key] ?? '');
};

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

const getTemplateById = async (templateId) => {
  const seed = BASE_TEMPLATES.find(t => t.id === templateId);
  if (seed) return seed;
  const { data } = await supabase.from('upzy_templates').select('*').eq('tenant_id', config.tenantId).eq('id', templateId).maybeSingle();
  return data ? normalizeTemplate(data) : null;
};

const listTemplates = async ({ category } = {}) => {
  let dbTemplates = [];
  try {
    let q = supabase.from('upzy_templates').select('*').eq('tenant_id', config.tenantId).eq('canal', 'email');
    if (category) q = q.eq('categoria', category);
    const { data } = await q.order('categoria').order('nombre');
    dbTemplates = (data || []).map(normalizeTemplate);
  } catch (_) {}
  const seeds = BASE_TEMPLATES.filter(t => !category || t.category === category);
  return [...seeds, ...dbTemplates];
};

const renderTemplate = async (templateInput, data = {}) => {
  const t = normalizeTemplate(templateInput);
  const subject = replaceVariables(t.subject, data);
  const preheader = replaceVariables(t.preheader, data);

  if (t.html && /<html|<table|<div/i.test(t.html)) {
    return { asunto: subject, subject, preview: preheader, preheader, html: replaceUrlVariables(replaceVariables(t.html, data), data), template: t };
  }

  const title = replaceVariables(t.title || t.name || t.subject, data);
  const body = replaceVariables(t.body || '', data).replace(/\n/g, '<br>');
  const proof = replaceVariables(t.proof || 'Más de 5.000 clientes · Entrega 48-72h · Garantía 1 año', data);
  const footerNote = replaceVariables(t.footerNote || 'Respóndeme por este mismo canal y te ayudo.', data);
  const cta = replaceVariables(t.cta, data);
  const ctaUrl = replaceUrlVariables(t.ctaUrl || '{{whatsapp_url}}', data);
  const whatsappUrl = normalizeData(data).whatsapp_url;

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${BRAND.black};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${BRAND.white}">
<div style="display:none;max-height:0;overflow:hidden;color:transparent">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.black};padding:28px 12px"><tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="width:620px;max-width:100%;background:${BRAND.graphite};border:1px solid ${BRAND.border};border-radius:22px;overflow:hidden">
<tr><td style="padding:22px 28px;background:${BRAND.black};border-bottom:3px solid ${BRAND.red}"><strong style="font-size:24px;letter-spacing:2px;color:#fff">KLINGE</strong><span style="float:right;font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:1.4px">Paneles LED publicitarios</span></td></tr>
<tr><td style="padding:36px 34px 20px;background:${BRAND.graphite}"><div style="color:${BRAND.red};font-weight:900;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:12px">${escapeHtml(t.category)}</div><h1 style="margin:0;color:#fff;font-size:34px;line-height:1.05">${title}</h1><p style="margin:18px 0 0;color:#CBD5E1;font-size:16px;line-height:1.65">${body}</p></td></tr>
<tr><td style="padding:4px 34px 26px;background:${BRAND.graphite}"><table width="100%"><tr><td style="padding:10px;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:14px;text-align:center;color:#fff;font-size:12px"><strong>+5.000</strong><br><span style="color:${BRAND.muted}">clientes</span></td><td style="padding:10px;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:14px;text-align:center;color:#fff;font-size:12px"><strong>48-72h</strong><br><span style="color:${BRAND.muted}">entrega</span></td><td style="padding:10px;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:14px;text-align:center;color:#fff;font-size:12px"><strong>1 año</strong><br><span style="color:${BRAND.muted}">garantía</span></td></tr></table><p style="margin:18px 0 0;color:${BRAND.muted};font-size:13px;line-height:1.6">${proof}</p><p style="margin:10px 0 0;color:#E2E8F0;font-size:13px;line-height:1.6;border-left:3px solid ${BRAND.red};padding-left:12px">${footerNote}</p></td></tr>
<tr><td style="padding:0 34px 34px;text-align:center;background:${BRAND.graphite}"><a href="${ctaUrl}" style="display:inline-block;background:${BRAND.red};color:white;padding:15px 26px;border-radius:14px;font-weight:800;font-size:15px;text-decoration:none">${cta}</a><div style="height:12px"></div><a href="${whatsappUrl}" style="color:${BRAND.muted};font-size:13px;text-decoration:none">Responder por WhatsApp</a></td></tr>
<tr><td style="padding:22px 30px;background:${BRAND.black};color:${BRAND.muted};font-size:11px;line-height:1.7;text-align:center">Klinge · ${BRAND.website.replace('https://','')} · ${BRAND.email}<br>Recibiste este correo porque eres cliente o contacto de Klinge.</td></tr>
</table></td></tr></table></body></html>`;

  return { asunto: subject, subject, preview: preheader, preheader, html, template: t };
};

const createTemplate = async (payload = {}) => {
  const insert = { tenant_id: config.tenantId, nombre: payload.name || payload.nombre, canal: 'email', categoria: payload.category || payload.categoria || 'campana', asunto: payload.subject || payload.asunto || '', cuerpo: payload.body || payload.html || payload.cuerpo || '', variables: payload.variables || SUPPORTED_VARIABLES, activo: payload.status ? payload.status === 'active' : true };
  if (!insert.nombre) throw new Error('name requerido');
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
  const { data, error } = await supabase.from('upzy_templates').update(updates).eq('tenant_id', config.tenantId).eq('id', id).select().single();
  if (error) throw error;
  return normalizeTemplate(data);
};

const estimateSegmentCount = async (segmentId = 'todos') => {
  try {
    let q = supabase.from('upzy_leads').select('id', { count: 'exact', head: true }).eq('tenant_id', config.tenantId).eq('activo', true).not('email', 'is', null);
    if (segmentId && segmentId !== 'todos') q = q.eq('segmento', segmentId);
    const { count } = await q;
    return count || 0;
  } catch (_) { return 0; }
};

const listSegments = async () => Promise.all(SEGMENT_DEFINITIONS.map(async s => ({ ...s, count: await estimateSegmentCount(s.id) })));

const getRecipientsForSegment = async (segmentId = 'todos', limit = 1000) => {
  let q = supabase.from('upzy_leads').select('id,nombre,empresa,email,tipo_negocio,segmento').eq('tenant_id', config.tenantId).eq('activo', true).not('email', 'is', null).limit(limit);
  if (segmentId && segmentId !== 'todos') q = q.eq('segmento', segmentId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

const getMetrics = async () => {
  try {
    const { data } = await supabase.from('upzy_email_sends').select('estado,tipo,campana_id').eq('tenant_id', config.tenantId);
    const sends = data || [];
    const sent = sends.filter(s => ['enviado', 'entregado', 'abierto', 'click'].includes(s.estado)).length;
    const opens = sends.filter(s => s.estado === 'abierto').length;
    const clicks = sends.filter(s => s.estado === 'click').length;
    return { sent, delivered: sends.filter(s => s.estado === 'entregado').length, opens, clicks, errors: sends.filter(s => ['error', 'rebotado'].includes(s.estado)).length, recovered_carts: sends.filter(s => s.tipo === 'carrito' && s.estado === 'click').length, attributed_revenue: 0, active_campaigns: new Set(sends.filter(s => s.campana_id).map(s => s.campana_id)).size, active_flows: FLOW_DEFINITIONS.filter(f => f.active).length, open_rate: sent ? Math.round((opens / sent) * 1000) / 10 : 0, click_rate: sent ? Math.round((clicks / sent) * 1000) / 10 : 0 };
  } catch (_) {
    return { sent: 0, delivered: 0, opens: 0, clicks: 0, errors: 0, recovered_carts: 0, attributed_revenue: 0, active_campaigns: 0, active_flows: FLOW_DEFINITIONS.length, open_rate: 0, click_rate: 0 };
  }
};

const createCampaign = async (payload = {}) => {
  const segment = payload.segment || payload.segmento || 'todos';
  const estimate = await estimateSegmentCount(segment);
  const row = { tenant_id: config.tenantId, nombre: payload.name || payload.nombre || 'Campaña Email Klinge', tipo: 'email', segmento: segment, estado: payload.scheduled_at ? 'programada' : 'borrador', template_id: payload.template_id || payload.templateId || null, total_destinatarios: estimate };
  try {
    const { data, error } = await supabase.from('upzy_campanas').insert(row).select().single();
    if (error) throw error;
    return { ...data, estimated_recipients: estimate };
  } catch (_) {
    return { id: `draft-${Date.now()}`, ...row, estimated_recipients: estimate };
  }
};

module.exports = { BRAND, SUPPORTED_VARIABLES, BASE_TEMPLATES, FLOW_DEFINITIONS, SEGMENT_DEFINITIONS, replaceVariables, renderTemplate, getTemplateById, listTemplates, createTemplate, updateTemplate, listSegments, estimateSegmentCount, getRecipientsForSegment, getMetrics, createCampaign, getWhatsAppUrl };
