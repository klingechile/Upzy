// src/routes/api.email.js
// Módulo completo de email: templates HTML, preview, test, campañas, stats

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const ses      = require('../services/ses');
const config   = require('../config/env');

const TENANT_ID = config.tenantId;

// ── PREVIEW ──────────────────────────────────────────────────
// POST /api/email/preview — renderiza template con datos de ejemplo
router.post('/preview', async (req, res) => {
  const { template_id, datos = {} } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id requerido' });

  const { data: template } = await supabase
    .from('upzy_templates').select('*').eq('id', template_id).single();
  if (!template) return res.status(404).json({ error: 'Template no encontrado' });

  const { html, asunto, preview } = ses.renderTemplate(template, datos);
  res.json({ html, asunto, preview, template });
});

// ── ENVÍO DE PRUEBA ───────────────────────────────────────────
// POST /api/email/test
router.post('/test', async (req, res) => {
  const { template_id, destinatarios, datos = {} } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id requerido' });
  if (!destinatarios?.length) return res.status(400).json({ error: 'destinatarios requerido' });

  try {
    const results = await ses.enviarPrueba({ templateId: template_id, destinatarios, datosEjemplo: datos });
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ENVIAR CAMPAÑA ────────────────────────────────────────────
// POST /api/email/campana
router.post('/campana', async (req, res) => {
  const { nombre, template_id, segmento, asunto_override } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id requerido' });

  // Crear registro de campaña
  const { data: campana } = await supabase
    .from('upzy_campanas')
    .insert({ tenant_id: TENANT_ID, nombre: nombre || 'Campaña Email', tipo: 'email', segmento: segmento || 'todos', estado: 'enviando' })
    .select().single();

  res.json({ ok: true, campana, status: 'iniciado' });

  // Envío asíncrono
  setImmediate(async () => {
    try {
      const result = await ses.enviarCampana({
        campanaId:      campana?.id,
        templateId:     template_id,
        segmento,
        asuntoOverride: asunto_override,
      });
      console.log(`[email/campana] Completado: ${result.enviados}/${result.total}`);
    } catch (err) {
      console.error('[email/campana] Error:', err.message);
    }
  });
});

// ── STATS ─────────────────────────────────────────────────────
// GET /api/email/stats
router.get('/stats', async (req, res) => {
  const [quota, sends] = await Promise.all([
    ses.getQuota(),
    supabase.from('upzy_email_sends').select('estado').eq('tenant_id', TENANT_ID),
  ]);

  const data = sends.data || [];
  res.json({
    ses:    quota,
    totales: {
      enviados:   data.filter(s => s.estado !== 'pendiente').length,
      entregados: data.filter(s => s.estado === 'entregado').length,
      abiertos:   data.filter(s => s.estado === 'abierto').length,
      clicks:     data.filter(s => s.estado === 'click').length,
      rebotados:  data.filter(s => s.estado === 'rebotado').length,
      errores:    data.filter(s => s.estado === 'error').length,
    },
  });
});

// GET /api/email/historial — últimos 50 envíos
router.get('/historial', async (req, res) => {
  const { data } = await supabase
    .from('upzy_email_sends')
    .select(`*, upzy_templates(nombre), upzy_leads(nombre,empresa)`)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(50);
  res.json(data || []);
});

// ── UNSUBSCRIBE ───────────────────────────────────────────────
router.get('/unsubscribe', async (req, res) => {
  const { email } = req.query;
  if (email) {
    await supabase.from('upzy_leads').update({ activo: false }).eq('email', email).eq('tenant_id', TENANT_ID);
    console.log(`[email] Unsubscribe: ${email}`);
  }
  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:400px;margin:80px auto;text-align:center;color:#333"><h2>✅ Suscripción cancelada</h2><p>No recibirás más emails de Klinge.</p><a href="https://www.klinge.cl" style="color:#2ea043">Volver a Klinge</a></body></html>`);
});

module.exports = router;

// ── BRANDING ─────────────────────────────────────────────────
// GET /api/email/branding — obtener configuración de marca
router.get('/branding', async (req, res) => {
  const emailTemplates = require('../services/email-templates');
  const b = await emailTemplates.getBranding(TENANT_ID);
  // No exponer datos sensibles
  res.json({
    nombre:    b.nombre,
    primary:   b.primary,
    secondary: b.secondary,
    sitio:     b.sitio,
    hasLogo:   !!b.logoHtml,
  });
});

// POST /api/email/branding — actualizar logo y colores
router.post('/branding', async (req, res) => {
  const { logo_svg, logo_url, brand_color, brand_color2 } = req.body;
  const updates = {};
  if (logo_svg    !== undefined) updates.logo_svg    = logo_svg;
  if (logo_url    !== undefined) updates.logo_url    = logo_url;
  if (brand_color !== undefined) updates.brand_color = brand_color;
  if (brand_color2!== undefined) updates.brand_color2= brand_color2;

  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', TENANT_ID)
    .select('id, name, brand_color, brand_color2')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true, tenant: data });
});

// POST /api/email/preview-branded — preview con templates branded
router.post('/preview-branded', async (req, res) => {
  const { categoria, datos = {} } = req.body;
  const emailTemplates = require('../services/email-templates');

  const fn = {
    carrito:     emailTemplates.carritoAbandonado,
    bienvenida:  emailTemplates.bienvenida,
    cotizacion:  emailTemplates.cotizacion,
    cierre:      emailTemplates.confirmacionCompra,
    seguimiento: emailTemplates.recuperacionCliente,
  }[categoria];

  if (!fn) return res.status(400).json({ error: 'Categoría no válida' });

  try {
    const result = await fn(TENANT_ID, datos);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
