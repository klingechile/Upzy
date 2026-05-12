const config = require('./src/config/env');

const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const path    = require('path');
const fs      = require('fs');
const { logger, errorHandler, notFound } = require('./src/middleware/logger');

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
app.use('/webhook/whatsapp',  require('./src/routes/webhook.whatsapp'));
app.use('/webhook/instagram', require('./src/routes/webhook.instagram'));
app.use('/webhook/shopify',   require('./src/routes/webhook.shopify'));
app.use('/api/leads',         require('./src/routes/api.leads'));
app.use('/api/campanas',      require('./src/routes/api.campanas'));
app.use('/api/automations',   require('./src/routes/api.automations'));
app.use('/api/inbox',         require('./src/routes/api.inbox'));
app.use('/api/flows',         require('./src/routes/api.flows'));
app.use('/api/templates',     require('./src/routes/api.templates'));
app.use('/api/import',        require('./src/routes/api.import'));
app.use('/api/email',         require('./src/routes/api.email'));
app.get('/unsubscribe', (req,res)=>res.redirect('/api/email/unsubscribe?'+require('url').parse(req.url).query));
app.use('/api/agente',        require('./src/routes/api.agente'));

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
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'public', 'dashboard.html');
  fs.readFile(dashboardPath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('No se pudo cargar el dashboard');
    const scriptTag = '<script src="/templates-conversion.js?v=20260511-2"></script>';
    res.type('html').send(html.includes('</body>') ? html.replace('</body>', `${scriptTag}\n</body>`) : `${html}\n${scriptTag}`);
  });
});

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
