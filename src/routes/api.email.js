// src/routes/api.email.js
// Email Marketing Klinge/Upzy.
// Email se edita en Upzy. WhatsApp usa templates aprobados en Meta y se orquesta en flows.

const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const ses = require('../services/ses');
const config = require('../config/env');
const marketing = require('../services/klinge-email-marketing');

const TENANT_ID = config.tenantId;
const sampleData = {
  nombre: 'Carlos', empresa: 'Restaurante Demo', tipo_negocio: 'restaurant',
  productos: 'Panel LED publicitario 60x90', cart_url: 'https://www.klinge.cl/cart/demo',
  order_url: 'https://www.klinge.cl/account/orders/demo', review_url: 'https://www.klinge.cl/pages/resenas',
  discount_code: 'KLINGE10', whatsapp_url: marketing.getWhatsAppUrl('Hola Klinge, quiero cotizar un panel LED'),
};

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/branding', (req, res) => res.json({ ok: true, brand: marketing.BRAND, variables: marketing.SUPPORTED_VARIABLES }));

router.get('/metrics', asyncHandler(async (req, res) => {
  const [metrics, quota] = await Promise.all([marketing.getMetrics(), ses.getQuota()]);
  res.json({ ok: true, metrics, ses: quota, brand: marketing.BRAND });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const [metrics, quota] = await Promise.all([marketing.getMetrics(), ses.getQuota()]);
  res.json({ ses: quota, metrics, totales: { enviados: metrics.sent, entregados: metrics.delivered, abiertos: metrics.opens, clicks: metrics.clicks, rebotados: 0, errores: metrics.errors, carritos_recuperados: metrics.recovered_carts, revenue_atribuido: metrics.attributed_revenue } });
}));

router.get('/templates', asyncHandler(async (req, res) => {
  const templates = await marketing.listTemplates({ category: req.query.category });
  res.json({ ok: true, templates, variables: marketing.SUPPORTED_VARIABLES });
}));

router.post('/templates', asyncHandler(async (req, res) => {
  const template = await marketing.createTemplate(req.body);
  res.status(201).json({ ok: true, template });
}));

router.put('/templates/:id', asyncHandler(async (req, res) => {
  const template = await marketing.updateTemplate(req.params.id, req.body);
  res.json({ ok: true, template });
}));
router.patch('/templates/:id', asyncHandler(async (req, res) => {
  const template = await marketing.updateTemplate(req.params.id, req.body);
  res.json({ ok: true, template });
}));

router.post('/templates/:id/preview', asyncHandler(async (req, res) => {
  const template = await marketing.getTemplateById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template no encontrado' });
  const rendered = await marketing.renderTemplate(template, { ...sampleData, ...(req.body?.datos || req.body || {}) });
  res.json({ ok: true, ...rendered });
}));

router.post('/templates/:id/test', asyncHandler(async (req, res) => {
  const { destinatarios, email, datos = {} } = req.body;
  const recipients = destinatarios || (email ? [email] : []);
  if (!recipients?.length) return res.status(400).json({ error: 'destinatarios requerido' });

  const template = await marketing.getTemplateById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template no encontrado' });

  const rendered = await marketing.renderTemplate(template, { ...sampleData, ...datos });
  const results = [];
  for (const recipient of Array.isArray(recipients) ? recipients : [recipients]) {
    try {
      const result = await ses.enviarEmail({ to: recipient, subject: `[PRUEBA] ${rendered.subject || rendered.asunto}`, html: rendered.html });
      await supabase.from('upzy_email_sends').insert({ tenant_id: TENANT_ID, template_id: template.is_seed ? null : template.id, tipo: 'test', destinatario: recipient, asunto: `[PRUEBA] ${rendered.subject || rendered.asunto}`, estado: 'enviado', ses_message_id: result.MessageId, enviado_at: new Date().toISOString() });
      results.push({ email: recipient, ok: true, messageId: result.MessageId, simulated: result.simulated });
    } catch (error) {
      results.push({ email: recipient, ok: false, error: error.message });
    }
  }
  res.json({ ok: true, results });
}));

// Legacy preview: acepta template_id en body
router.post('/preview', asyncHandler(async (req, res) => {
  const { template_id, datos = {} } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id requerido' });
  const template = await marketing.getTemplateById(template_id);
  if (!template) return res.status(404).json({ error: 'Template no encontrado' });
  const rendered = await marketing.renderTemplate(template, { ...sampleData, ...datos });
  res.json({ ok: true, html: rendered.html, asunto: rendered.subject, preview: rendered.preheader, template });
}));

// Legacy test: acepta template_id en body
router.post('/test', asyncHandler(async (req, res) => {
  const { template_id, destinatarios, datos = {} } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id requerido' });
  if (!destinatarios?.length) return res.status(400).json({ error: 'destinatarios requerido' });
  const template = await marketing.getTemplateById(template_id);
  if (!template) return res.status(404).json({ error: 'Template no encontrado' });
  const rendered = await marketing.renderTemplate(template, { ...sampleData, ...datos });
  const results = [];
  for (const recipient of Array.isArray(destinatarios) ? destinatarios : [destinatarios]) {
    const result = await ses.enviarEmail({ to: recipient, subject: `[PRUEBA] ${rendered.subject}`, html: rendered.html });
    results.push({ email: recipient, ok: true, messageId: result.MessageId, simulated: result.simulated });
  }
  res.json({ ok: true, results });
}));

router.get('/segments', asyncHandler(async (req, res) => res.json({ ok: true, segments: await marketing.listSegments() })));
router.get('/segments/:id/estimate', asyncHandler(async (req, res) => res.json({ ok: true, segment: req.params.id, count: await marketing.estimateSegmentCount(req.params.id) })));

router.get('/flows', (req, res) => res.json({ ok: true, flows: marketing.FLOW_DEFINITIONS }));
router.put('/flows/:id', (req, res) => {
  const flow = marketing.FLOW_DEFINITIONS.find(f => f.id === req.params.id);
  if (!flow) return res.status(404).json({ error: 'Flujo no encontrado' });
  res.json({ ok: true, flow: { ...flow, ...req.body }, note: 'Actualización preparada. Persistencia configurable en Supabase.' });
});

router.post('/campaigns', asyncHandler(async (req, res) => {
  const campaign = await marketing.createCampaign(req.body);
  res.status(201).json({ ok: true, campaign });
}));

router.post('/campaigns/:id/send', asyncHandler(async (req, res) => {
  const { template_id, segmento, asunto_override, limit } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id requerido' });
  const template = await marketing.getTemplateById(template_id);
  if (!template) return res.status(404).json({ error: 'Template no encontrado' });
  const recipients = await marketing.getRecipientsForSegment(segmento || 'todos', limit || 1000);
  res.json({ ok: true, status: 'iniciado', campaign_id: req.params.id, total: recipients.length });

  setImmediate(async () => {
    let sent = 0, errors = 0;
    for (const lead of recipients) {
      try {
        const rendered = await marketing.renderTemplate(template, { nombre: lead.nombre, empresa: lead.empresa, tipo_negocio: lead.tipo_negocio, whatsapp_url: marketing.getWhatsAppUrl(`Hola Klinge, soy ${lead.nombre || ''} y quiero cotizar un panel LED`) });
        const result = await ses.enviarEmail({ to: lead.email, subject: asunto_override || rendered.subject, html: rendered.html });
        await supabase.from('upzy_email_sends').insert({ tenant_id: TENANT_ID, template_id: template.is_seed ? null : template.id, campana_id: req.params.id?.startsWith('draft-') ? null : req.params.id, lead_id: lead.id, tipo: 'campana', destinatario: lead.email, asunto: asunto_override || rendered.subject, estado: 'enviado', ses_message_id: result.MessageId, enviado_at: new Date().toISOString() });
        sent++;
      } catch (error) {
        errors++;
        console.error('[email campaign]', error.message);
      }
    }
    console.log(`[email/campaigns] ${req.params.id}: ${sent} enviados, ${errors} errores`);
  });
}));

router.post('/campana', asyncHandler(async (req, res) => {
  const campaign = await marketing.createCampaign({ name: req.body.nombre || 'Campaña Email Klinge', template_id: req.body.template_id, segment: req.body.segmento || 'todos' });
  res.json({ ok: true, campana: campaign, status: 'iniciado' });
}));

router.get('/historial', asyncHandler(async (req, res) => {
  const { data } = await supabase.from('upzy_email_sends').select('*, upzy_templates(nombre), upzy_leads(nombre,empresa)').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false }).limit(50);
  res.json(data || []);
}));

router.get('/unsubscribe', asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (email) await supabase.from('upzy_leads').update({ activo: false }).eq('email', email).eq('tenant_id', TENANT_ID);
  res.send(`<!DOCTYPE html><html lang="es"><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0B0D12;color:#F8FAFC;max-width:520px;margin:80px auto;text-align:center"><h2>Suscripción cancelada</h2><p style="color:#94A3B8">No recibirás más emails comerciales de Klinge.</p><a href="https://www.klinge.cl" style="color:#E1251B">Volver a Klinge</a></body></html>`);
}));

router.use((error, req, res, next) => {
  console.error('[api.email]', error);
  res.status(500).json({ error: error.message || 'Error interno en módulo de email' });
});

module.exports = router;
