const express      = require('express');
const router       = express.Router();
const automations  = require('../services/automations');
const supabase     = require('../db/supabase');
const config       = require('../config/env');
const cartRecovery = require('../services/cart-recovery');
const { detectarCarritosAbandonados } = require('../jobs/carritos');
const TENANT_ID    = config.tenantId;

// GET /api/automations
router.get('/', async (req, res) => {
  try {
    const cartSetting = await cartRecovery.getCartRecoverySetting(TENANT_ID);
    const defaults = Object.entries(automations.FLOWS_DEFAULT).map(([id, f]) => ({
      id, nombre: f.nombre, trigger: f.trigger, canal: f.canal,
      pasos: f.pasos.length,
      activo: f.trigger === cartRecovery.TRIGGER ? cartSetting.activo !== false : true,
      tipo: 'default', pasos_json: f.pasos,
    }));
    const { data: custom } = await supabase.from('upzy_automatizaciones')
      .select('*').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false });
    res.json({ defaults, personalizados: custom || [], cart_recovery: cartSetting });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/automations/cart-recovery — estado del carro abandonado Shopify
router.get('/cart-recovery', async (req, res) => {
  try {
    const [setting, stats] = await Promise.all([
      cartRecovery.getCartRecoverySetting(TENANT_ID),
      cartRecovery.getCartRecoveryStats(TENANT_ID),
    ]);
    res.json({
      ok: true,
      ...setting,
      stats,
      shopify: {
        enabled: config.shopify.enabled,
        store_url: config.shopify.storeUrl || null,
        webhook_secret_configured: !!config.shopify.webhookSecret,
        skip_verify: config.shopify.skipVerify,
      },
      channels: {
        whatsapp: config.whatsapp.enabled,
        email: config.email.enabled,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/automations/cart-recovery — activar/desactivar carro abandonado Shopify
router.patch('/cart-recovery', async (req, res) => {
  try {
    if (typeof req.body.activo !== 'boolean') {
      return res.status(400).json({ error: 'activo boolean requerido' });
    }
    const setting = await cartRecovery.setCartRecoveryEnabled(TENANT_ID, req.body.activo);
    const stats = await cartRecovery.getCartRecoveryStats(TENANT_ID);
    res.json({ ok: true, ...setting, stats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/automations/cart-recovery/run — ejecución manual urgente
router.post('/cart-recovery/run', async (req, res) => {
  try {
    const enabled = await cartRecovery.isCartRecoveryEnabled(TENANT_ID);
    if (!enabled) return res.status(409).json({ ok: false, error: 'Recuperación de carrito está desactivada' });

    await detectarCarritosAbandonados(TENANT_ID);
    const [setting, stats] = await Promise.all([
      cartRecovery.getCartRecoverySetting(TENANT_ID),
      cartRecovery.getCartRecoveryStats(TENANT_ID),
    ]);
    res.json({ ok: true, message: 'Revisión de carritos ejecutada', ...setting, stats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/automations — crear flow personalizado
router.post('/', async (req, res) => {
  try {
    const { nombre, trigger, canal, pasos } = req.body;
    if (!nombre || !trigger) return res.status(400).json({ error: 'nombre y trigger requeridos' });
    const { data, error } = await supabase.from('upzy_automatizaciones')
      .insert({ tenant_id: TENANT_ID, nombre, trigger, canal: canal||'whatsapp', pasos: pasos||[] })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/automations/:id
router.patch('/:id', async (req, res) => {
  try {
    const { nombre, activo, pasos, trigger, canal } = req.body;
    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (activo !== undefined) updates.activo = activo;
    if (pasos  !== undefined) updates.pasos  = pasos;
    if (trigger!== undefined) updates.trigger= trigger;
    if (canal  !== undefined) updates.canal  = canal;
    const { data, error } = await supabase.from('upzy_automatizaciones')
      .update(updates).eq('id', req.params.id).eq('tenant_id', TENANT_ID).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/automations/:id
router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('upzy_automatizaciones')
      .delete().eq('id', req.params.id).eq('tenant_id', TENANT_ID);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/automations/trigger — disparar manualmente (testing)
router.post('/trigger', async (req, res) => {
  const { lead_id, trigger, contexto } = req.body;
  if (!lead_id || !trigger) return res.status(400).json({ error: 'lead_id y trigger requeridos' });
  await automations.dispararPorTrigger(TENANT_ID, lead_id, trigger, contexto||{});
  res.json({ ok: true, mensaje: `Flow '${trigger}' disparado` });
});

module.exports = router;
