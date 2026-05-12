const config = require('./src/config/env');

const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const { logger, errorHandler, notFound } = require('./src/middleware/logger');
const { requireAuth } = require('./src/middleware/auth');

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors());
app.use(express.static('public'));
app.use(logger);
app.use((req, res, next) => {
  express.json({
    verify: (req, res, buf) => { req.rawBody = buf; },
  })(req, res, next);
});

// ── ROUTES ────────────────────────────────────────────────────
// Auth (público — no requiere token)
app.use('/api/auth',          require('./src/routes/api.auth'));

// Webhooks (protegidos por HMAC, no por JWT)
app.use('/webhook/whatsapp',  require('./src/routes/webhook.whatsapp'));
app.use('/webhook/instagram', require('./src/routes/webhook.instagram'));
app.use('/webhook/shopify',   require('./src/routes/webhook.shopify'));
// API protegida (requiere JWT)
app.use('/api/leads',         requireAuth, require('./src/routes/api.leads'));
app.use('/api/tasks',         requireAuth, require('./src/routes/api.tasks'));
app.use('/api/campanas',      requireAuth, require('./src/routes/api.campanas'));
app.use('/api/automations',   requireAuth, require('./src/routes/api.automations'));
app.use('/api/inbox',         requireAuth, require('./src/routes/api.inbox'));
app.use('/api/flows',         requireAuth, require('./src/routes/api.flows'));
app.use('/api/templates',     requireAuth, require('./src/routes/api.templates'));
app.use('/api/import',        requireAuth, require('./src/routes/api.import'));
app.use('/api/email',         requireAuth, require('./src/routes/api.email'));
app.get('/unsubscribe', (req,res)=>res.redirect('/api/email/unsubscribe?'+require('url').parse(req.url).query));
app.use('/api/agente',        requireAuth, require('./src/routes/api.agente'));

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:   'ok',
    tenant:   config.tenantId,
    version:  require('./package.json').version,
    env:      config.nodeEnv,
    uptime:   Math.floor(process.uptime()) + 's',
    channels: {
      whatsapp:  config.whatsapp.enabled,
      instagram: config.instagram.enabled,
      shopify:   config.shopify.enabled,
    },
  });
});

app.get('/', (req, res) => res.redirect('/dashboard'));
app.get('/dashboard', (req, res) => res.sendFile('dashboard.html', { root: 'public' }));
app.get('/login',     (req, res) => res.sendFile('login.html',     { root: 'public' }));


// Auto-populate email template HTML on startup
setTimeout(async () => {
  try {
    const emailTpl  = require('./src/services/email-templates');
    const supabase  = require('./src/db/supabase');
    const TENANT_ID = require('./src/config/env').tenantId;

    const { data: templates } = await supabase
      .from('upzy_templates')
      .select('id, nombre, categoria, canal')
      .eq('tenant_id', TENANT_ID)
      .in('canal', ['email', 'ambos'])
      .is('html_body', null);

    if (!templates?.length) return;

    const datos = {
      nombre:'Carlos García', empresa:'Restaurante El Sol',
      producto:'Panel LED 100x50cm', monto:149990,
      checkout_url:'https://klingecl.myshopify.com/checkout/preview',
      folio:'KLG-001', orden_id:'#1042', tipo_negocio:'restaurante',
      unsubscribe_url:'https://upzy-production.up.railway.app/api/email/unsubscribe?email=preview',
    };

    const fnMap = {
      bienvenida: emailTpl.bienvenida,
      carrito: emailTpl.carritoAbandonado1h,
      cotizacion: emailTpl.cotizacion,
      cierre: emailTpl.confirmacionCompra,
      seguimiento: emailTpl.recuperacionCliente,
    };
    const nameMap = {
      'Carrito Abandonado — 24h + Descuento': emailTpl.carritoAbandonado24h,
      'Pedir Reseña — 7 días post-compra':    emailTpl.pedirResena,
      'Upsell — Productos complementarios':   emailTpl.upsell,
      'Garantía y Soporte Post-Venta':        emailTpl.garantia,
    };

    for (const tpl of templates) {
      const fn = nameMap[tpl.nombre] || fnMap[tpl.categoria];
      if (!fn) continue;
      const { html, preview } = await fn(TENANT_ID, datos);
      await supabase.from('upzy_templates')
        .update({ html_body: html, preview_text: preview, tipo: 'html' })
        .eq('id', tpl.id);
      console.log(`[startup] Template HTML generado: ${tpl.nombre}`);
    }
  } catch (err) {
    console.error('[startup] Error generando templates HTML:', err.message);
  }
}, 3000); // 3 segundos después de arrancar

// ── ERROR HANDLERS ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── CRON JOBS ─────────────────────────────────────────────────
const { detectarCarritosAbandonados } = require('./src/jobs/carritos');
const { degradarLeadsFrios }          = require('./src/jobs/scoring-decay');

cron.schedule('*/15 * * * *', async () => {
  if (!config.shopify.enabled) return;
  console.log('[cron] Revisando carritos abandonados...');
  await detectarCarritosAbandonados(config.tenantId).catch(e => console.error('[cron]', e.message));
});

cron.schedule('0 2 * * *', async () => {
  console.log('[cron] Revisando leads inactivos...');
  await degradarLeadsFrios(config.tenantId).catch(e => console.error('[cron]', e.message));
});

// ── START ─────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n✅ Upzy Bot corriendo en puerto ${config.port}`);
  console.log(`   Tenant:  ${config.tenantId}`);
  console.log(`   Entorno: ${config.nodeEnv}\n`);
});
