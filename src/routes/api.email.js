// src/routes/api.email.js
// Email Marketing Klinge/Upzy.
// Email sí vive y se edita en Upzy. WhatsApp usa templates aprobados en Meta y se orquesta en flows.

const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const ses = require('../services/ses');
const config = require('../config/env');
const marketing = require('../services/klinge-email-marketing');

const TENANT_ID = config.tenantId;

const sampleData = {
  nombre: 'Carlos',
  empresa: 'Restaurante Demo',
  tipo_negocio: 'restaurant',
  productos: 'Panel LED publicitario 60x90',
  cart_url: 'https://www.klinge.cl/cart/demo',
  order_url: 'https://www.klinge.cl/account/orders/demo',
  review_url: 'https://www.klinge.cl/pages/resenas',
  discount_code: 'KLINGE10',
  whatsapp_url: marketing.getWhatsAppUrl('Hola Klinge, quiero cotizar un panel LED'),
};

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── BRANDING ──────────────────────────────────────────────────
router.get('/branding', (req, res) => {
  res.json({ ok: true, brand: marketing.BRAND, variables: marketing.SUPPORTED_VARIABLES });
});

// ── DASHBOARD / MÉTRICAS ──────────────────────────────────────
router.get('/metrics', asyncHandler(async (req, res) => {
  const [metrics, quota] = await Promise.all([marketing.getMetrics(), ses.getQuota()]);
  res.json({ ok: true, metrics, ses: quota, brand: marketing.BRAND });
}));

// Alias legacy para la UI actual
router.get('/stats', asyncHandler(async (req, res) => {
  const [metrics, quota] = await Promise.all([marketing.getMetrics(), ses.getQuota()]);
  res.json({
    ses: quota,
    metrics,
    totales: {
      enviados: metrics.sent,
      entregados: metrics.delivered,
      abiertos: metrics.opens,
      clicks: metrics.clicks,
      rebotados: 0,
      errores: metrics.errors,
      carritos_recuperados: metrics.recovered_carts,
      revenue_atribuido: metrics.attributed_revenue,
    },
  });
}));

// ── TEMPLATES EMAIL ───────────────────────────────────────────
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
  const to = destinatarios || (email ? [email] : []);
  if (!to?.length) return res.status(400).json({ error: 'destinatarios requerido' });

  const template = await marketing.getTemplateById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template no encontrado' });

  const rendered = await marketing.renderTemplate(template, { ...sampleData, ...datos });
  const recipients = Array.isArray(to) ? to : [to];
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await ses.enviarEmail({
        to: recipient,
        subject: `[PRUEBA] ${rendered.subject || rendered.asunto}`,
        html: rendered.html,
      });

      await supabase.from('upzy_email_sends').insert({
        tenant_id: TENANT_ID,
        template_id: template.is_seed ? null : template.id,
        tipo: 'test',
        destinatario: recipient,
        asunto: `[PRUEBA] ${rendered.subject || rendered.asunto}`,
        estado: 'enviado',
        ses_message_id: result.MessageId,
        enviado_at: new Date().toISOString(),
      });

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

// ── SEGMENTOS ─────────────────────────────────────────────────
router.get('/segments', asyncHandler(async (req, res) => {
  const segments = await marketing.listSegments();
  res.json({ ok: true, segments });
}));

router.get('/segments/:id/estimate', asyncHandler(async (req, res) => {
  const count = await marketing.estimateSegmentCount(req.params.id);
  res.json({ ok: true, segment: req.params.id, count });
}));

// ── FLOWS EMAIL ────────────────────────────────────────────────
router.get('/flows', (req, res) => {
  res.json({ ok: true, flows: marketing.FLOW_DEFINITIONS });
});

router.put('/flows/:id', (req, res) => {
  const flow = marketing.FLOW_DEFINITIONS.find(f => f.id === req.params.id);
  if (!flow) return res.status(404).json({ error: 'Flujo no encontrado' });
  res.json({ ok: true, flow: { ...flow, ...req.body }, note: 'Actualización preparada. Persistencia configurable en Supabase.' });
});

// ── CAMPAÑAS EMAIL ────────────────────────────────────────────
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
    let sent = 0;
    let errors = 0;

    for (const lead of recipients) {
      try {
        const rendered = await marketing.renderTemplate(template, {
          nombre: lead.nombre,
          empresa: lead.empresa,
          tipo_negocio: lead.tipo_negocio,
          whatsapp_url: marketing.getWhatsAppUrl(`Hola Klinge, soy ${lead.nombre || ''} y quiero cotizar un panel LED`),
        });

        const result = await ses.enviarEmail({
          to: lead.email,
          subject: asunto_override || rendered.subject,
          html: rendered.html,
        });

        await supabase.from('upzy_email_sends').insert({
          tenant_id: TENANT_ID,
          template_id: template.is_seed ? null : template.id,
          campana_id: req.params.id?.startsWith('draft-') ? null : req.params.id,
          lead_id: lead.id,
          tipo: 'campana',
          destinatario: lead.email,
          asunto: asunto_override || rendered.subject,
          estado: 'enviado',
          ses_message_id: result.MessageId,
          enviado_at: new Date().toISOString(),
        });

        sent++;
      } catch (error) {
        errors++;
        console.error('[email campaign]', error.message);
      }
    }

    console.log(`[email/campaigns] ${req.params.id}: ${sent} enviados, ${errors} errores`);
  });
}));

// Legacy campaña
router.post('/campana', asyncHandler(async (req, res) => {
  const campaign = await marketing.createCampaign({
    name: req.body.nombre || 'Campaña Email Klinge',
    template_id: req.body.template_id,
    segment: req.body.segmento || 'todos',
  });
  res.json({ ok: true, campana: campaign, status: 'iniciado' });
}));

// ── HISTORIAL ─────────────────────────────────────────────────
router.get('/historial', asyncHandler(async (req, res) => {
  const { data } = await supabase
    .from('upzy_email_sends')
    .select('*, upzy_templates(nombre), upzy_leads(nombre,empresa)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(50);
  res.json(data || []);
}));

// ── UNSUBSCRIBE ───────────────────────────────────────────────
router.get('/unsubscribe', asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (email) {
    await supabase.from('upzy_leads').update({ activo: false }).eq('email', email).eq('tenant_id', TENANT_ID);
    console.log(`[email] Unsubscribe: ${email}`);
  }

  res.send(`<!DOCTYPE html><html lang="es"><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0B0D12;color:#F8FAFC;max-width:520px;margin:80px auto;text-align:center"><h2>Suscripción cancelada</h2><p style="color:#94A3B8">No recibirás más emails comerciales de Klinge.</p><a href="https://www.klinge.cl" style="color:#E1251B">Volver a Klinge</a></body></html>`);
}));

router.use((error, req, res, next) => {
  console.error('[api.email]', error);
  res.status(500).json({ error: error.message || 'Error interno en módulo de email' });
});

module.exports = router;

// ── TEST CARRITO ABANDONADO ───────────────────────────────────
// POST /api/email/test-carrito — dispara email de prueba del flujo carrito
router.post('/test-carrito', async (req, res) => {
  const { email, nombre, producto, monto, etapa = 1 } = req.body;
  if (!email) return res.status(400).json({ error: 'email requerido' });

  const emailTemplates = require('../services/email-templates');
  const ses2 = require('../services/ses');

  const datos = {
    nombre:       nombre  || 'Carlos García',
    producto:     producto || 'Panel LED 100x50cm',
    monto:        monto   || 149990,
    checkout_url: `${require('../config/env').shopify.storeUrl || 'https://klingecl.myshopify.com'}/checkout/test`,
    unsubscribe_url: `https://upzy-production.up.railway.app/api/email/unsubscribe?email=${encodeURIComponent(email)}`,
  };

  try {
    const fn = etapa === 2
      ? emailTemplates.carritoAbandonado24h
      : emailTemplates.carritoAbandonado1h;

    const { asunto, html } = await fn(TENANT_ID, datos);
    const r = await ses2.enviarEmail({ to: email, subject: `[PRUEBA] ${asunto}`, html });

    // Log
    await supabase.from('upzy_email_sends').insert({
      tenant_id: TENANT_ID, tipo: 'test',
      destinatario: email, asunto: `[PRUEBA] ${asunto}`,
      estado: 'enviado', ses_message_id: r.MessageId || 'simulated',
      enviado_at: new Date().toISOString(),
    });

    res.json({ ok: true, etapa, asunto, destinatario: email, messageId: r.MessageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POPULATE HTML ─────────────────────────────────────────────
// POST /api/email/populate-html — genera y guarda html_body en todas las plantillas
router.post('/populate-html', async (req, res) => {
  const emailTpl = require('../services/email-templates');
  const { data: templates } = await supabase
    .from('upzy_templates')
    .select('id, nombre, categoria, canal, asunto, cuerpo, variables')
    .eq('tenant_id', TENANT_ID)
    .in('canal', ['email', 'ambos']);

  if (!templates?.length) return res.json({ ok: true, updated: 0 });

  const resultados = [];
  const datos = {
    nombre: 'Carlos García', empresa: 'Restaurante El Sol',
    producto: 'Panel LED 100x50cm', monto: 149990,
    checkout_url: 'https://klingecl.myshopify.com/checkout/preview',
    folio: 'KLG-001', orden_id: '#1042',
    tipo_negocio: 'restaurante',
    unsubscribe_url: 'https://upzy-production.up.railway.app/api/email/unsubscribe?email=preview',
  };

  const fnMap = {
    bienvenida:  emailTpl.bienvenida,
    carrito:     emailTpl.carritoAbandonado1h,
    cotizacion:  emailTpl.cotizacion,
    cierre:      emailTpl.confirmacionCompra,
    seguimiento: emailTpl.recuperacionCliente,
  };

  // Mapeo especial por nombre para los que comparten categoría
  const nameMap = {
    'Carrito Abandonado — 24h + Descuento': emailTpl.carritoAbandonado24h,
    'Pedir Reseña — 7 días post-compra':    emailTpl.pedirResena,
    'Upsell — Productos complementarios':   emailTpl.upsell,
    'Garantía y Soporte Post-Venta':        emailTpl.garantia,
    'Recuperación de Cliente Frío':         emailTpl.recuperacionCliente,
  };

  for (const tpl of templates) {
    try {
      const fn = nameMap[tpl.nombre] || fnMap[tpl.categoria];
      if (!fn) { resultados.push({ id: tpl.id, ok: false, reason: 'sin función' }); continue; }

      const { html, asunto, preview } = await fn(TENANT_ID, datos);

      await supabase.from('upzy_templates')
        .update({ html_body: html, preview_text: preview, tipo: 'html' })
        .eq('id', tpl.id);

      resultados.push({ id: tpl.id, nombre: tpl.nombre, ok: true, html_size: html.length });
    } catch (err) {
      resultados.push({ id: tpl.id, nombre: tpl.nombre, ok: false, error: err.message });
    }
  }

  res.json({ ok: true, updated: resultados.filter(r => r.ok).length, total: templates.length, resultados });
});
