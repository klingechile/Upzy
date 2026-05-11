// scripts/verificar-setup.js
// Ejecutar con: node scripts/verificar-setup.js
// Verifica que todo el stack esté funcionando correctamente

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const TENANT_ID = process.env.TENANT_ID;

let ok = 0;
let fail = 0;

const check = (nombre, resultado, esperado) => {
  if (resultado === esperado || (esperado === true && resultado)) {
    console.log(`  ✅ ${nombre}`);
    ok++;
  } else {
    console.log(`  ❌ ${nombre} → obtenido: ${JSON.stringify(resultado)}`);
    fail++;
  }
};

const warn = (nombre, msg) => {
  console.log(`  ⚠️  ${nombre}: ${msg}`);
};

async function main() {
  console.log('\n🔍 UPZY — Verificación de Setup\n');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Tenant: ${TENANT_ID}\n`);

  // ── 1. Variables de entorno ─────────────────────────────
  console.log('[ 1/6 ] Variables de entorno');
  const vars = ['TENANT_ID','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ANTHROPIC_API_KEY'];
  for (const v of vars) {
    check(v, !!process.env[v], true);
  }
  const opcionalesWarn = ['EVOLUTION_API_URL','IG_ACCESS_TOKEN','SHOPIFY_DOMAIN','SHOPIFY_WEBHOOK_SECRET'];
  for (const v of opcionalesWarn) {
    if (!process.env[v]) warn(v, 'no configurada (canal no funcionará)');
  }

  // ── 2. Health check ────────────────────────────────────
  console.log('\n[ 2/6 ] Servidor HTTP');
  try {
    const res  = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    check('Servidor responde', res.status, 200);
    check('Tenant correcto',   res.data.tenant, TENANT_ID);
    check('Status ok',         res.data.status, 'ok');
    if (!res.data.channels?.whatsapp)  warn('WhatsApp',  'no configurado');
    if (!res.data.channels?.instagram) warn('Instagram', 'no configurado');
    if (!res.data.channels?.shopify)   warn('Shopify',   'no configurado');
  } catch (err) {
    console.log(`  ❌ Servidor no responde en ${BASE_URL} (¿está corriendo?)`);
    fail++;
  }

  // ── 3. Supabase ────────────────────────────────────────
  console.log('\n[ 3/6 ] Supabase');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const tablasRequeridas = [
      'tenants','upzy_leads','upzy_score_eventos',
      'upzy_conversaciones','upzy_mensajes',
      'upzy_eventos_shopify','upzy_campanas',
    ];

    for (const tabla of tablasRequeridas) {
      const { error } = await supabase.from(tabla).select('id').limit(1);
      check(`Tabla ${tabla}`, !error, true);
    }

    // Verificar tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id,name')
      .eq('id', TENANT_ID)
      .single();
    check(`Tenant '${TENANT_ID}' existe`, !!tenant, true);
  } catch (err) {
    console.log(`  ❌ Error Supabase: ${err.message}`);
    fail++;
  }

  // ── 4. Scoring — crear lead de prueba ─────────────────
  console.log('\n[ 4/6 ] Motor de Scoring');
  try {
    const scoring = require('./src/services/scoring');

    // Crear lead de prueba
    const { lead, esNuevo } = await scoring.upsertLead(
      TENANT_ID,
      { canal_id: 'test_verificacion_' + Date.now(), nombre: 'Test Setup', telefono: '+56900000000' },
      'whatsapp'
    );
    check('upsertLead crea lead',    !!lead?.id, true);
    check('Lead tiene score',        lead?.score >= 1, true);
    check('Lead tiene segmento',     !!lead?.segmento, true);

    // Agregar score
    const leadConScore = await scoring.addScore(TENANT_ID, lead.id, 'consulta_precio');
    check('addScore suma puntos',    leadConScore?.score > 1, true);
    check('Segmento recalcula',      !!leadConScore?.segmento, true);

    // Estadísticas
    const stats = await scoring.getEstadisticas(TENANT_ID);
    check('getEstadisticas retorna', !!stats?.total, true);

    // Limpiar lead de prueba
    await supabase.from('upzy_leads').delete().eq('id', lead.id);

  } catch (err) {
    console.log(`  ❌ Error en scoring: ${err.message}`);
    fail++;
  }

  // ── 5. API Endpoints ───────────────────────────────────
  console.log('\n[ 5/6 ] API Endpoints');
  const endpoints = [
    { path: '/api/leads',                label: 'GET /api/leads' },
    { path: '/api/leads/estadisticas',   label: 'GET /api/leads/estadisticas' },
    { path: '/api/leads/carritos',       label: 'GET /api/leads/carritos' },
    { path: '/api/campanas',             label: 'GET /api/campanas' },
    { path: '/api/automations',          label: 'GET /api/automations' },
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${ep.path}`, { timeout: 5000 });
      check(ep.label, res.status, 200);
    } catch (err) {
      const status = err.response?.status;
      if (status) {
        console.log(`  ❌ ${ep.label} → HTTP ${status}`);
      } else {
        console.log(`  ❌ ${ep.label} → ${err.message}`);
      }
      fail++;
    }
  }

  // ── 6. Templates ───────────────────────────────────────
  console.log('\n[ 6/6 ] Templates de Mensajes');
  try {
    const { getTemplate } = require('./src/services/templates');
    const t1 = getTemplate('bienvenida',         { nombre: 'Carlos' });
    const t2 = getTemplate('carritoAbandonado1', { nombre: 'Ana', productos: [{ title: 'Panel LED 100x50cm' }], monto: 149990 });
    const t3 = getTemplate('catalogo');
    check('Template bienvenida',        t1.includes('Lumi'), true);
    check('Template carritoAbandonado1', t2.includes('Ana'), true);
    check('Template catalogo',          t3.includes('149.990'), true);
  } catch (err) {
    console.log(`  ❌ Error en templates: ${err.message}`);
    fail++;
  }

  // ── RESULTADO ──────────────────────────────────────────
  console.log('\n' + '─'.repeat(40));
  console.log(`✅ Pasaron: ${ok}   ❌ Fallaron: ${fail}`);
  if (fail === 0) {
    console.log('\n🚀 Todo listo — Upzy está operativo en Klinge!\n');
  } else {
    console.log('\n⚠️  Corrige los errores antes de hacer deploy.\n');
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n💥 Error crítico:', err.message);
  process.exit(1);
});
