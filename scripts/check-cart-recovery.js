#!/usr/bin/env node
'use strict';

const DEFAULT_BASE_URL = 'https://upzy-production.up.railway.app';
const baseUrl = (process.argv[2] || process.env.UPZY_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const endpoints = {
  health: '/health',
  cartRecovery: '/api/automations/cart-recovery',
};

const ok = (msg) => console.log(`✅ ${msg}`);
const warn = (msg) => console.log(`⚠️  ${msg}`);
const fail = (msg) => console.log(`❌ ${msg}`);
const info = (msg) => console.log(`ℹ️  ${msg}`);

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  return { url, status: res.status, ok: res.ok, body };
}

function printJson(title, value) {
  console.log(`\n${title}`);
  console.log(JSON.stringify(value, null, 2));
}

async function checkHealth() {
  const result = await request(endpoints.health);
  if (!result.ok) {
    fail(`/health respondió ${result.status}`);
    printJson('Respuesta:', result.body);
    return false;
  }

  ok('/health OK');
  const channels = result.body?.channels || {};
  info(`tenant: ${result.body?.tenant || 'N/D'} · env: ${result.body?.env || 'N/D'}`);
  info(`channels: whatsapp=${!!channels.whatsapp} instagram=${!!channels.instagram} shopify=${!!channels.shopify}`);
  return true;
}

async function checkCartRecovery() {
  const result = await request(endpoints.cartRecovery);
  if (!result.ok) {
    fail(`/api/automations/cart-recovery respondió ${result.status}`);
    printJson('Respuesta:', result.body);
    return false;
  }

  const d = result.body || {};
  const stats = d.stats || {};
  const shopify = d.shopify || {};
  const channels = d.channels || {};

  ok('cart-recovery API OK');
  console.log('');
  console.log(`Estado recuperación : ${d.activo !== false ? 'ACTIVA' : 'PAUSADA'}`);
  console.log(`Delay abandono      : ${d.delay_minutes || 60} min`);
  console.log(`Checkouts a evaluar : ${stats.pending_checkouts ?? 0}`);
  console.log(`Abandonados pend.   : ${stats.pending_abandoned ?? 0}`);
  console.log(`Último abandono     : ${stats.last_abandoned_at || 'sin registros'}`);
  console.log(`Shopify enabled     : ${!!shopify.enabled}`);
  console.log(`Shopify store       : ${shopify.store_url || 'sin configurar'}`);
  console.log(`Webhook secret      : ${shopify.webhook_secret_configured ? 'configurado' : 'no configurado'}`);
  console.log(`Skip verify         : ${!!shopify.skip_verify}`);
  console.log(`WhatsApp            : ${!!channels.whatsapp}`);
  console.log(`Email               : ${!!channels.email}`);

  const issues = [];
  if (d.activo === false) issues.push('La recuperación está pausada.');
  if (!shopify.enabled) issues.push('Shopify aparece desactivado. Revisa SHOPIFY_STORE_URL.');
  if (!shopify.webhook_secret_configured && !shopify.skip_verify) issues.push('Webhook secret no configurado. Revisa SHOPIFY_WEBHOOK_SECRET.');
  if (!channels.whatsapp && !channels.email) issues.push('No hay canal activo para recuperar carritos. Activa WhatsApp o Email.');
  if (Array.isArray(stats.errors) && stats.errors.length) issues.push(...stats.errors);

  if (issues.length) {
    console.log('');
    warn('Alertas detectadas:');
    issues.forEach((issue) => console.log(`   - ${issue}`));
  } else {
    console.log('');
    ok('Sin alertas críticas detectadas.');
  }

  return !issues.length;
}

async function main() {
  console.log(`\nDiagnóstico Upzy — Cart Recovery`);
  console.log(`Base URL: ${baseUrl}\n`);

  let success = true;

  try {
    const healthOk = await checkHealth();
    success = success && healthOk;
  } catch (err) {
    success = false;
    fail(`Error consultando /health: ${err.message}`);
  }

  console.log('\n────────────────────────────────────────');

  try {
    const cartOk = await checkCartRecovery();
    success = success && cartOk;
  } catch (err) {
    success = false;
    fail(`Error consultando cart recovery: ${err.message}`);
  }

  console.log('\n────────────────────────────────────────');

  if (success) {
    ok('Diagnóstico finalizado sin alertas críticas.');
    process.exit(0);
  }

  warn('Diagnóstico finalizado con alertas. Revisa docs/CART_RECOVERY_SHOPIFY.md y docs/TROUBLESHOOTING.md.');
  process.exit(1);
}

main();
