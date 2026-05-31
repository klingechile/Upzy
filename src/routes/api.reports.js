const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');

const TENANT_ID = config.tenantId;

// GET /api/reports/overview
router.get('/overview', async (req, res) => {
  const warnings = [];

  try {
    const [leadsResult, cartsResult, eventsResult, emailResult] = await Promise.all([
      safeSelect('upzy_leads', '*'),
      safeSelect('upzy_carritos_pendientes', '*'),
      safeSelect('upzy_events', '*', { orderBy: 'created_at', limit: 40 }),
      safeSelect('upzy_email_sends', '*'),
    ]);

    collectWarnings(warnings, leadsResult, 'upzy_leads');
    collectWarnings(warnings, cartsResult, 'upzy_carritos_pendientes');
    collectWarnings(warnings, eventsResult, 'upzy_events');
    collectWarnings(warnings, emailResult, 'upzy_email_sends');

    const leads = leadsResult.data || [];
    const carts = cartsResult.data || [];
    const events = eventsResult.data || [];
    const emails = emailResult.data || [];

    const funnel = buildFunnel(leads);
    const attribution = buildAttribution(leads);
    const cartsPending = carts.filter(cart => !['recuperado', 'expirado'].includes(String(cart.recuperacion_estado || '').toLowerCase())).length;
    const cartsRecovered = carts.filter(cart => String(cart.recuperacion_estado || '').toLowerCase() === 'recuperado').length;
    const cartsTotal = carts.length;
    const closedLeads = leads.filter(lead => String(lead.etapa || '').toLowerCase() === 'cerrado').length;
    const revenueTotal = leads.reduce((acc, lead) => acc + Number(lead.total_gastado || lead.monto_total || lead.revenue || 0), 0);

    const metrics = {
      leads_total: leads.length,
      leads_hot: leads.filter(lead => String(lead.segmento || '').toLowerCase() === 'hot').length,
      conversion_rate: leads.length ? round((closedLeads / leads.length) * 100) : 0,
      carts_pending: cartsPending,
      carts_recovered: cartsRecovered,
      recovery_rate: cartsTotal ? round((cartsRecovered / cartsTotal) * 100) : 0,
      revenue_total: revenueTotal,
      events_total: events.length,
      emails_sent: emails.length,
    };

    res.json({
      ok: true,
      period: req.query.period || '30d',
      metrics,
      funnel,
      attribution,
      moduleHealth: buildModuleHealth({ leads, carts, events, emails, warnings }),
      events: events.slice(0, 20),
      warnings,
    });
  } catch (err) {
    console.error('[reports] overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function safeSelect(table, select = '*', options = {}) {
  try {
    let query = supabase.from(table).select(select).eq('tenant_id', TENANT_ID);
    if (options.orderBy) query = query.order(options.orderBy, { ascending: false });
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) return { data: [], error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

function collectWarnings(warnings, result, table) {
  if (result.error) warnings.push({ table, warning: result.error.message });
}

function buildFunnel(leads) {
  const total = Math.max(leads.length, 1);
  const stages = ['nuevo', 'contactado', 'calificado', 'propuesta', 'cerrado'];
  return stages.map(stage => {
    const count = leads.filter(lead => String(lead.etapa || 'nuevo').toLowerCase() === stage).length;
    const value = leads
      .filter(lead => String(lead.etapa || 'nuevo').toLowerCase() === stage)
      .reduce((acc, lead) => acc + Number(lead.total_gastado || lead.monto_total || lead.revenue || 0), 0);
    return { stage, count, rate: round((count / total) * 100), value };
  });
}

function buildAttribution(leads) {
  const channels = new Map();
  for (const lead of leads) {
    const channel = String(lead.canal || 'sin_canal').toLowerCase();
    if (!channels.has(channel)) channels.set(channel, { channel, leads: 0, conversions: 0, revenue: 0, conversion_rate: 0 });
    const item = channels.get(channel);
    item.leads += 1;
    if (String(lead.etapa || '').toLowerCase() === 'cerrado') item.conversions += 1;
    item.revenue += Number(lead.total_gastado || lead.monto_total || lead.revenue || 0);
  }

  return Array.from(channels.values()).map(item => ({
    ...item,
    conversion_rate: item.leads ? round((item.conversions / item.leads) * 100) : 0,
  })).sort((a, b) => b.leads - a.leads);
}

function buildModuleHealth({ leads, carts, events, emails, warnings }) {
  return [
    { module: 'CRM Comercial', status: leads.length ? 'OK' : 'Sin datos', detail: `${leads.length} leads disponibles` },
    { module: 'Captación Web', status: leads.some(lead => String(lead.canal || '').toLowerCase() === 'web') ? 'OK' : 'Mejorar', detail: 'Se espera canal web desde Sprint 12' },
    { module: 'Carritos Abandonados', status: carts.length ? 'OK' : 'Sin datos', detail: `${carts.length} carritos disponibles` },
    { module: 'Email Marketing', status: emails.length ? 'OK' : 'Sin datos', detail: `${emails.length} registros de email` },
    { module: 'Eventos Comerciales', status: events.length ? 'OK' : warnings.some(w => w.table === 'upzy_events') ? 'Mejorar' : 'Sin datos', detail: `${events.length} eventos recientes` },
    { module: 'Reportes', status: 'OK', detail: 'Overview consolidado disponible' },
  ];
}

function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

module.exports = router;
