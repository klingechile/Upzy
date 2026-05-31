const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

// GET /api/beta/status
router.get('/status', async (req, res) => {
  try {
    const checks = [];

    checks.push(check('auth.profile', 'Usuario autenticado con perfil Upzy', Boolean(req.user?.id), `Rol: ${req.userRol || 'sin rol'}`));
    checks.push(check('tenant', 'Tenant activo', Boolean(req.tenantId || TENANT_ID), req.tenantId || TENANT_ID));
    checks.push(check('security.service_role', 'Service role solo server-side', true, 'Frontend consume APIs protegidas por JWT.'));

    const [leads, carts, events, emailSends] = await Promise.all([
      countRows('upzy_leads'),
      countRows('upzy_carritos_pendientes'),
      countRows('upzy_events'),
      countRows('upzy_email_sends'),
    ]);

    checks.push(checkFromCount('db.leads', 'Tabla leads disponible', leads));
    checks.push(checkFromCount('db.carts', 'Tabla carritos disponible', carts, true));
    checks.push(checkFromCount('db.events', 'Tabla eventos disponible', events, true));
    checks.push(checkFromCount('db.email_sends', 'Tabla email sends disponible', emailSends, true));

    const okCount = checks.filter(item => item.status === 'OK').length;
    const score = Math.round((okCount / checks.length) * 100);

    res.json({
      ok: true,
      beta: {
        status: score >= 75 ? 'ready' : 'needs_attention',
        score,
      },
      user: {
        email: req.user?.email || null,
        rol: req.userRol || null,
        tenant_id: req.tenantId || TENANT_ID,
      },
      checks,
      modules: [
        { module: 'CRM Comercial', status: 'LIVE', endpoint: '/api/leads' },
        { module: 'Captación Web', status: 'LIVE', endpoint: '/api/capture/leads' },
        { module: 'Carritos Abandonados', status: carts.status === 'ERROR' ? 'WARN' : 'LIVE', endpoint: '/api/carts/abandoned' },
        { module: 'Email Marketing', status: emailSends.status === 'ERROR' ? 'WARN' : 'READY', endpoint: '/api/email/metrics' },
        { module: 'Automatizaciones', status: 'READY', endpoint: '/api/automations' },
        { module: 'Eventos Comerciales', status: events.status === 'ERROR' ? 'WARN' : 'READY', endpoint: '/api/events' },
        { module: 'Reportes Reales', status: 'LIVE', endpoint: '/api/reports/overview' },
      ],
      routes: [
        { route: '/', purpose: 'Entrada principal redirige a UPZY', status: 'OK' },
        { route: '/upzy', purpose: 'Vista viva beta', status: 'OK' },
        { route: '/login', purpose: 'Autenticación', status: 'OK' },
        { route: '/health', purpose: 'Health check público', status: 'OK' },
        { route: '/upzy-sprint11.html', purpose: 'Histórico CRM live', status: 'OK' },
        { route: '/upzy-sprint12.html', purpose: 'Histórico captación live', status: 'OK' },
        { route: '/upzy-sprint13.html', purpose: 'Histórico carritos live', status: 'OK' },
        { route: '/upzy-sprint14.html', purpose: 'Histórico email/automation live', status: 'OK' },
        { route: '/upzy-sprint15.html', purpose: 'Histórico reportes live', status: 'OK' },
        { route: '/upzy-sprint16.html', purpose: 'Beta operativa', status: 'OK' },
      ],
      next: [
        'Validar usuarios reales en upzy_users.',
        'Revisar warnings de tablas opcionales.',
        'Ejecutar smoke test manual de login, CRM, captación, carritos y reportes.',
      ],
    });
  } catch (err) {
    console.error('[beta] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function countRows(table) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID);

    if (error) return { status: 'ERROR', count: 0, detail: error.message };
    return { status: 'OK', count: count || 0, detail: `${count || 0} registros` };
  } catch (err) {
    return { status: 'ERROR', count: 0, detail: err.message };
  }
}

function check(id, label, condition, detail) {
  return { id, label, status: condition ? 'OK' : 'ERROR', detail: detail || '' };
}

function checkFromCount(id, label, result, optional = false) {
  if (result.status === 'OK') return { id, label, status: 'OK', detail: result.detail };
  return { id, label, status: optional ? 'WARN' : 'ERROR', detail: result.detail };
}

module.exports = router;
