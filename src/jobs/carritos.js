const supabase = require('../db/supabase');
const scoring  = require('../services/scoring');
const wa       = require('../services/whatsapp');

/**
 * Detecta checkouts creados hace > 1 hora sin orden asociada.
 * Ejecutar cada 15 minutos desde index.js.
 */
const detectarCarritosAbandonados = async (tenantId) => {
  const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: checkouts } = await supabase
    .from('upzy_eventos_shopify')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('tipo', 'checkout_created')
    .lt('created_at', unaHoraAtras);

  if (!checkouts?.length) return;

  for (const checkout of checkouts) {
    // ¿Ya existe orden para este checkout?
    const { data: orden } = await supabase
      .from('upzy_eventos_shopify')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('shopify_checkout_id', checkout.shopify_checkout_id)
      .in('tipo', ['order_created', 'order_paid'])
      .maybeSingle();

    if (orden) continue; // Sí compró

    // ¿Ya registramos el abandono?
    const { data: yaAbandonado } = await supabase
      .from('upzy_eventos_shopify')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tipo', 'checkout_abandoned')
      .eq('shopify_checkout_id', checkout.shopify_checkout_id)
      .maybeSingle();

    if (yaAbandonado) continue;

    console.log(`[cron/carritos] Abandono detectado: ${checkout.shopify_checkout_id}`);

    const { evento } = await scoring.procesarEventoShopify(tenantId, {
      tipo: 'checkout_abandoned',
      shopify_checkout_id: checkout.shopify_checkout_id,
      customer_email: checkout.customer_email,
      customer_phone: checkout.customer_phone,
      customer_name:  checkout.customer_name,
      monto:          checkout.monto,
      checkout_url:   checkout.checkout_url,
      productos:      checkout.productos,
      payload_raw:    { source: 'cron_detection' },
    });

    // Enviar WhatsApp de recuperación si tiene teléfono
    if (checkout.customer_phone && evento) {
      await enviarRecuperacionWA(checkout, evento.id);
    }
  }
};

const enviarRecuperacionWA = async (checkout, eventoId) => {
  const nombre   = checkout.customer_name?.split(' ')[0] || 'estimado cliente';
  const producto = checkout.productos?.[0]?.title || 'tu producto';
  const monto    = checkout.monto
    ? `$${Number(checkout.monto).toLocaleString('es-CL')}`
    : '';

  const mensaje =
    `¡Hola ${nombre}! 👋 Notamos que dejaste ${producto}${monto ? ` (${monto})` : ''} en tu carrito.\n\n` +
    `¿Tuviste algún problema? Estamos aquí para ayudarte 🙌\n\n` +
    (checkout.checkout_url ? `Retoma tu compra aquí: ${checkout.checkout_url}` : '');

  try {
    const telefono = checkout.customer_phone.replace(/\D/g, '');
    await wa.enviarTexto(telefono, mensaje);

    // Actualizar estado del evento
    const { createClient } = require('@supabase/supabase-js');
    await supabase
      .from('upzy_eventos_shopify')
      .update({
        recuperacion_estado: 'wa_enviado',
        recuperacion_wa_at:  new Date().toISOString(),
      })
      .eq('id', eventoId);

    console.log(`[cron/carritos] WA de recuperación enviado a ${telefono}`);
  } catch (err) {
    console.error('[cron/carritos] Error enviando WA:', err.message);
  }
};

module.exports = { detectarCarritosAbandonados };
