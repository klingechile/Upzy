const express      = require('express');
const router       = express.Router();
const crypto       = require('crypto');
const scoring      = require('../services/scoring');
const automations  = require('../services/automations');
const config       = require('../config/env');
const cartRecovery = require('../services/cart-recovery');

const TENANT_ID = config.tenantId;

const TOPIC_MAP = {
  'orders/create':      'order_created',
  'orders/paid':        'order_paid',
  'orders/cancelled':   'order_cancelled',
  'orders/fulfilled':   'order_fulfilled',
  'checkouts/create':   'checkout_created',
  'checkouts/update':   'checkout_updated',
  'carts/create':       'checkout_created',
  'carts/update':       'checkout_updated',
};

router.post('/', async (req, res) => {
  const hmac  = req.headers['x-shopify-hmac-sha256'];
  const topic = req.headers['x-shopify-topic'];

  // HMAC — usa SHOPIFY_WEBHOOK_SECRET que ya existe en Railway
  // SHOPIFY_SKIP_WEBHOOK_VERIFY=true desactiva para testing
  if (config.shopify.webhookSecret && !config.shopify.skipVerify) {
    const hash = crypto
      .createHmac('sha256', config.shopify.webhookSecret)
      .update(req.rawBody, 'utf8')
      .digest('base64');
    if (hash !== hmac) {
      console.warn('[Shopify] Firma HMAC inválida');
      return res.status(401).send('Unauthorized');
    }
  }

  res.status(200).send('OK');

  const tipo = TOPIC_MAP[topic];
  if (!tipo) return;

  const payload = req.body;
  console.log(`[Shopify] ${topic} | ${payload.email || payload.id || payload.token}`);

  try {
    const cartTopics = ['checkouts/create', 'checkouts/update', 'carts/create', 'carts/update'];
    if (cartTopics.includes(topic)) {
      const enabled = await cartRecovery.isCartRecoveryEnabled(TENANT_ID);
      if (!enabled) {
        console.log(`[Shopify] ${topic} recibido, pero recuperación de carritos está desactivada.`);
        return;
      }
    }

    const checkoutId = payload.token || payload.id?.toString() || payload.cart_token || payload.checkout_token;
    const checkoutUrl = payload.abandoned_checkout_url || payload.web_url || payload.checkout_url || payload.url;
    const customer = payload.customer || {};
    const billing = payload.billing_address || {};
    const shipping = payload.shipping_address || {};

    const { lead, evento } = await scoring.procesarEventoShopify(TENANT_ID, {
      tipo,
      shopify_order_id:    topic.startsWith('orders/') ? payload.id?.toString() : null,
      shopify_checkout_id: checkoutId,
      customer_email:  payload.email || customer.email,
      customer_phone:  payload.phone || customer.phone || billing.phone || shipping.phone,
      customer_name:   customer.first_name || customer.last_name
                         ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                         : billing.name || shipping.name,
      monto:        parseFloat(payload.total_price || payload.subtotal_price || payload.total_line_items_price || 0),
      checkout_url: checkoutUrl,
      productos:    (payload.line_items || payload.items || []).map(i => ({
                      title: i.title || i.product_title || i.name,
                      quantity: i.quantity,
                      price: parseFloat(i.price || i.line_price || 0),
                    })),
      payload_raw: payload,
    });

    // El abandono real se detecta por cron después del tiempo configurado.
    // Si en el futuro llega un evento externo checkout_abandoned, respeta el toggle.
    if (tipo === 'checkout_abandoned' && lead && evento) {
      const enabled = await cartRecovery.isCartRecoveryEnabled(TENANT_ID);
      if (!enabled) return;
      await automations.dispararPorTrigger(TENANT_ID, lead.id, 'checkout_abandoned', {
        evento_id:    evento.id,
        monto:        evento.monto,
        productos:    evento.productos,
        checkout_url: evento.checkout_url,
        nombre:       lead.nombre,
      });
    }
  } catch (err) {
    console.error('[Shopify webhook] Error:', err.message);
  }
});

module.exports = router;
