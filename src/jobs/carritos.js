// src/jobs/carritos.js
const supabase      = require('../db/supabase');
const scoring       = require('../services/scoring');
const wa            = require('../services/whatsapp');
const { enviarEmail, emailCarritoAbandonado } = require('../services/email');
const { getTemplate } = require('../services/templates');
const config        = require('../config/env');
const cartRecovery  = require('../services/cart-recovery');

const detectarCarritosAbandonados = async (tenantId) => {
  const enabled = await cartRecovery.isCartRecoveryEnabled(tenantId);
  if (!enabled) {
    console.log('[cron/carritos] Recuperación de carritos desactivada.');
    return;
  }

  const delayMinutes = cartRecovery.getDelayMinutes();
  const limite = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();
  const { data: checkouts } = await supabase
    .from('upzy_eventos_shopify').select('*')
    .eq('tenant_id', tenantId)
    .in('tipo', ['checkout_created', 'checkout_updated'])
    .lt('created_at', limite)
    .order('created_at', { ascending: true });

  if (!checkouts?.length) return;
  console.log(`[cron/carritos] Revisando ${checkouts.length} checkouts Shopify...`);

  const vistos = new Set();
  for (const checkout of checkouts) {
    const checkoutId = checkout.shopify_checkout_id || checkout.shopify_order_id || checkout.id;
    if (!checkoutId || vistos.has(checkoutId)) continue;
    vistos.add(checkoutId);

    const { data: orden } = await supabase.from('upzy_eventos_shopify').select('id')
      .eq('tenant_id', tenantId).eq('shopify_checkout_id', checkout.shopify_checkout_id)
      .in('tipo', ['order_created','order_paid']).maybeSingle();
    if (orden) continue;

    const { data: yaAbandonado } = await supabase.from('upzy_eventos_shopify').select('id')
      .eq('tenant_id', tenantId).eq('tipo', 'checkout_abandoned')
      .eq('shopify_checkout_id', checkout.shopify_checkout_id).maybeSingle();
    if (yaAbandonado) continue;

    console.log(`[cron/carritos] Abandono detectado: ${checkout.shopify_checkout_id}`);
    const { evento } = await scoring.procesarEventoShopify(tenantId, {
      tipo: 'checkout_abandoned', shopify_checkout_id: checkout.shopify_checkout_id,
      customer_email: checkout.customer_email, customer_phone: checkout.customer_phone,
      customer_name: checkout.customer_name, monto: checkout.monto,
      checkout_url: checkout.checkout_url, productos: checkout.productos,
      payload_raw: { source: 'cron_detection', delay_minutes: delayMinutes },
    });
    if (!evento) continue;

    if (checkout.customer_phone && config.whatsapp.enabled) {
      try {
        const msg = getTemplate('carritoAbandonado1', { nombre: checkout.customer_name, productos: checkout.productos, monto: checkout.monto, checkout_url: checkout.checkout_url });
        await wa.enviarTexto(wa.normalizarNumero(checkout.customer_phone), msg);
        await supabase.from('upzy_eventos_shopify').update({ recuperacion_estado: 'wa_enviado', recuperacion_wa_at: new Date().toISOString() }).eq('id', evento.id);
        console.log(`[cron/carritos] ✅ WA → ${checkout.customer_phone}`);
      } catch(e) { console.error('[cron/carritos] WA error:', e.message); }
    }

    if (checkout.customer_email && config.email.enabled) {
      try {
        const { subject, html } = emailCarritoAbandonado({ nombre: checkout.customer_name, productos: checkout.productos, monto: checkout.monto, checkout_url: checkout.checkout_url });
        await enviarEmail({ to: checkout.customer_email, subject, html });
        const { data: ev } = await supabase.from('upzy_eventos_shopify').select('recuperacion_estado').eq('id', evento.id).single();
        const estado = ev?.recuperacion_estado === 'wa_enviado' ? 'ambos_enviados' : 'email_enviado';
        await supabase.from('upzy_eventos_shopify').update({ recuperacion_estado: estado, recuperacion_email_at: new Date().toISOString() }).eq('id', evento.id);
        console.log(`[cron/carritos] ✅ Email → ${checkout.customer_email}`);
      } catch(e) { console.error('[cron/carritos] Email error:', e.message); }
    }
  }
};

module.exports = { detectarCarritosAbandonados };
