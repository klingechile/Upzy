// src/services/cart-recovery.js
// Control central para activar/desactivar recuperación de carritos Shopify.

const supabase = require('../db/supabase');

const TABLE = 'upzy_automatizaciones';
const TRIGGER = 'checkout_abandoned';

function getDelayMinutes() {
  const value = parseInt(process.env.SHOPIFY_ABANDONED_CART_MINUTES || '60', 10);
  return Number.isFinite(value) && value > 0 ? value : 60;
}

async function getCartRecoverySetting(tenantId) {
  const fallback = {
    id: null,
    tenant_id: tenantId,
    nombre: 'Recuperación de carrito abandonado',
    trigger: TRIGGER,
    canal: 'email_whatsapp',
    activo: true,
    exists: false,
    delay_minutes: getDelayMinutes(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, tenant_id, nombre, trigger, canal, activo, pasos, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .eq('trigger', TRIGGER)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[cart-recovery] No se pudo leer configuración, se usa activo por defecto:', error.message);
    return { ...fallback, warning: error.message };
  }

  if (!data) return fallback;

  return {
    ...fallback,
    ...data,
    activo: data.activo !== false,
    exists: true,
    delay_minutes: getDelayMinutes(),
  };
}

async function isCartRecoveryEnabled(tenantId) {
  const setting = await getCartRecoverySetting(tenantId);
  return setting.activo !== false;
}

async function setCartRecoveryEnabled(tenantId, activo) {
  const current = await getCartRecoverySetting(tenantId);
  const payload = {
    tenant_id: tenantId,
    nombre: 'Recuperación de carrito abandonado',
    trigger: TRIGGER,
    canal: 'email_whatsapp',
    activo: !!activo,
    pasos: current.pasos || [],
  };

  if (current.exists && current.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ activo: !!activo })
      .eq('id', current.id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return { ...data, exists: true, delay_minutes: getDelayMinutes() };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return { ...data, exists: true, delay_minutes: getDelayMinutes() };
}

async function getCartRecoveryStats(tenantId) {
  const stats = {
    pending_abandoned: 0,
    pending_checkouts: 0,
    last_abandoned_at: null,
    errors: [],
  };

  const { count: abandonedCount, data: lastAbandoned, error: abandonedError } = await supabase
    .from('upzy_eventos_shopify')
    .select('id, created_at', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('tipo', 'checkout_abandoned')
    .eq('recuperacion_estado', 'pendiente')
    .order('created_at', { ascending: false })
    .limit(1);

  if (abandonedError) stats.errors.push(abandonedError.message);
  else {
    stats.pending_abandoned = abandonedCount || 0;
    stats.last_abandoned_at = lastAbandoned?.[0]?.created_at || null;
  }

  const olderThan = new Date(Date.now() - getDelayMinutes() * 60 * 1000).toISOString();
  const { count: checkoutCount, error: checkoutError } = await supabase
    .from('upzy_eventos_shopify')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('tipo', ['checkout_created', 'checkout_updated'])
    .lt('created_at', olderThan);

  if (checkoutError) stats.errors.push(checkoutError.message);
  else stats.pending_checkouts = checkoutCount || 0;

  return stats;
}

module.exports = {
  TRIGGER,
  getDelayMinutes,
  getCartRecoverySetting,
  isCartRecoveryEnabled,
  setCartRecoveryEnabled,
  getCartRecoveryStats,
};
