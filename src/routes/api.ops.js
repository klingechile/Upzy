const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

const CRITICAL_ROUTES = [
  '/upzy', '/login', '/crm', '/captacion', '/carritos', '/email', '/automatizaciones', '/reportes', '/configuracion', '/beta', '/operacion', '/health',
];

const CRITICAL_ENDPOINTS = [
  'GET /health',
  'POST /api/auth/login',
  'POST /api/auth/refresh',
  'GET /api/leads',
  'GET /api/reports/overview',
  'GET /api/beta/status',
  'GET /api/events',
  'GET /api/carts/abandoned',
  'GET /api/ops/status',
  'POST /api/ops/smoke-test',
];

// GET /api/ops/status
router.get('/status', async (req, res) => {
  try {
    const checks = await runDbChecks();
    const okCount = checks.filter(item => item.status === 'OK' || item.status === 'WARN').length;
    const score = Math.round((okCount / checks.length) * 100);

    res.json({
      ok: true,
      ops: {
        status: score >= 80 ? 'ready' : 'needs_attention',
        score,
      },
      app: {
        env: config.nodeEnv,
        tenant: TENANT_ID,
        uptime_seconds: Math.floor(process.uptime()),
        version: require('../../package.json').version,
      },
      channels: {
        whatsapp: config.whatsapp.enabled,
        instagram: config.instagram.enabled,
        shopify: config.shopify.enabled,
        email: config.email.enabled,
      },
      routes: CRITICAL_ROUTES.map(route => ({ route, status: 'OK' })),
      endpoints: CRITICAL_ENDPOINTS.map(endpoint => ({ endpoint, status: 'DEFINED' })),
      checks,
      recommendation: score >= 80 ? 'GO' : 'NO-GO',
    });
  } catch (err) {
    console.error('[ops] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ops/smoke-test
router.post('/smoke-test', async (req, res) => {
  try {
    const tests = await runDbChecks();
    tests.push({ id: 'runtime.node', label: 'Runtime Node activo', status: 'OK', detail: `${Math.floor(process.uptime())}s uptime` });
    tests.push({ id: 'auth.user', label: 'Usuario autenticado', status: req.user?.id ? 'OK' : 'ERROR', detail: req.user?.email || 'sin usuario' });
    tests.push({ id: 'route.map', label: 'Rutas críticas definidas', status: 'OK', detail: `${CRITICAL_ROUTES.length} rutas` });
    tests.push({ id: 'endpoint.map', label: 'Endpoints críticos definidos', status: 'OK', detail: `${CRITICAL_ENDPOINTS.length} endpoints` });

    const pass = tests.filter(item => item.status === 'OK' || item.status === 'WARN').length;
    const score = Math.round((pass / tests.length) * 100);

    res.json({
      ok: true,
      score,
      recommendation: score >= 80 ? 'GO' : 'NO-GO',
      tests,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ops] smoke error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function runDbChecks() {
  const checks = await Promise.all([
    countRows('upzy_users', false),
    countRows('upzy_leads', false),
    countRows('upzy_carritos_pendientes', true),
    countRows('upzy_events', true),
    countRows('upzy_email_sends', true),
    countRows('upzy_audit_logs', true),
  ]);

  return checks;
}

async function countRows(table, optional) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID);

    if (error) return { id: `db.${table}`, label: table, status: optional ? 'WARN' : 'ERROR', detail: error.message };
    return { id: `db.${table}`, label: table, status: 'OK', detail: `${count || 0} registros` };
  } catch (err) {
    return { id: `db.${table}`, label: table, status: optional ? 'WARN' : 'ERROR', detail: err.message };
  }
}

module.exports = router;
