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
