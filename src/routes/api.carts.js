const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');
const { auditLog } = require('../services/audit');

const TENANT_ID = config.tenantId;

// GET /api/carts/abandoned
router.get('/abandoned', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('upzy_carritos_pendientes')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json((data || []).map(normalizeCart));
  } catch (err) {
    console.error('[carts] abandoned error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/carts/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    const normalized = normalizeStatus(status);
    if (!normalized) return res.status(400).json({ error: 'status inválido' });

    const updates = {
      recuperacion_estado: normalized,
    };

    if (normalized === 'recuperado') updates.recuperado_at = new Date().toISOString();
    if (normalized === 'expirado') updates.expirado_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('upzy_eventos_shopify')
      .update(updates)
      .eq('tenant_id', TENANT_ID)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;

    const eventType = normalized === 'recuperado' ? 'cart.recovered' : normalized === 'expirado' ? 'cart.expired' : 'cart.status_updated';

    await registerEvent({
      event_type: eventType,
      source_module: 'carts',
      entity_type: 'cart',
      entity_id: req.params.id,
      payload: { status: normalized },
    });

    await auditLog(req, eventType, {
      entity_type: 'cart',
      entity_id: req.params.id,
      metadata: { status: normalized },
    });

    res.json({ ok: true, cart: normalizeCart(data) });
  } catch (err) {
    console.error('[carts] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function normalizeCart(cart) {
  return {
    id: cart.id,
    lead_id: cart.lead_id,
    customer_name: cart.customer_name || cart.nombre || 'Cliente sin nombre',
    customer_email: cart.customer_email || cart.email || null,
    customer_phone: cart.customer_phone || cart.telefono || null,
    monto: Number(cart.monto || cart.total || 0),
    checkout_url: cart.checkout_url || cart.url || null,
    productos: cart.productos || [],
    estado: cart.estado || cart.tipo || 'checkout_abandoned',
    recuperacion_estado: cart.recuperacion_estado || 'pendiente',
    created_at: cart.created_at,
  };
}

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase().trim();
  if (['recuperado', 'expirado', 'pendiente'].includes(value)) return value;
  return null;
}

async function registerEvent(event) {
  try {
    const payload = {
      tenant_id: TENANT_ID,
      event_type: event.event_type,
      source_module: event.source_module,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      payload: event.payload || {},
    };

    const { error } = await supabase.from('upzy_events').insert(payload);
    if (error) console.warn('[carts] event not persisted:', error.message);
  } catch (err) {
    console.warn('[carts] event skipped:', err.message);
  }
}

module.exports = router;
