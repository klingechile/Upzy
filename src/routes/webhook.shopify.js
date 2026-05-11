const express     = require('express');
const router      = express.Router();
const crypto      = require('crypto');
const scoring     = require('../services/scoring');
const automations = require('../services/automations');
const config      = require('../config/env');

const TENANT_ID = config.tenantId;

const TOPIC_MAP = {
  'orders/create':    'order_created',
  'orders/paid':      'order_paid',
  'orders/cancelled': 'order_cancelled',
  'orders/fulfilled': 'order_fulfilled',
  'checkouts/create': 'checkout_created',
  'checkouts/update': 'checkout_updated',
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
  console.log(`[Shopify] ${topic} | ${payload.email || payload.id}`);

  try {
    const { lead, evento } = await scoring.procesarEventoShopify(TENANT_ID, {
      tipo,
      shopify_order_id:    payload.id?.toString(),
      shopify_checkout_id: payload.token,
      customer_email:  payload.email || payload.customer?.email,
      customer_phone:  payload.phone || payload.customer?.phone,
      customer_name:   payload.customer
                         ? `${payload.customer.first_name} ${payload.customer.last_name}`.trim()
                         : payload.billing_address?.name,
      monto:        parseFloat(payload.total_price || payload.subtotal_price || 0),
      checkout_url: payload.abandoned_checkout_url,
      productos:    (payload.line_items || []).map(i => ({
                      title: i.title, quantity: i.quantity, price: parseFloat(i.price),
                    })),
      payload_raw: payload,
    });

    // Disparar flow de carrito abandonado
    if (tipo === 'checkout_abandoned' && lead && evento) {
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
