#!/usr/bin/env node
'use strict';

const DEFAULT_BASE_URL = 'https://upzy-production.up.railway.app';
const baseUrl = (process.argv[2] || process.env.UPZY_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const authToken = process.env.UPZY_TOKEN || process.argv[3] || '';

const ok = (msg) => console.log(`✅ ${msg}`);
const warn = (msg) => console.log(`⚠️  ${msg}`);
const fail = (msg) => console.log(`❌ ${msg}`);
const info = (msg) => console.log(`ℹ️  ${msg}`);

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

async function checkPublic(path) {
  const res = await fetch(`${baseUrl}${path}`, { method: 'HEAD' });
  if (res.ok) ok(`${path} disponible`);
  else fail(`${path} respondió ${res.status}`);
  return res.ok;
}

async function main() {
  console.log('\nDiagnóstico Upzy — CRM Core');
  console.log(`Base URL: ${baseUrl}\n`);
  let success = true;

  try {
    const health = await request('/health');
    if (health.ok) {
      ok('/health OK');
      info(`tenant=${health.body?.tenant || 'N/D'} env=${health.body?.env || 'N/D'}`);
    } else {
      fail(`/health respondió ${health.status}`);
      success = false;
    }
  } catch (err) {
    fail(`Error /health: ${err.message}`);
    success = false;
  }

  console.log('\nArchivos públicos');
  for (const path of ['/professional-ui.js', '/cart-recovery-control.js', '/crm-360-pro.js']) {
    try { success = (await checkPublic(path)) && success; }
    catch (err) { fail(`${path}: ${err.message}`); success = false; }
  }

  console.log('\nEndpoints protegidos');
  for (const path of ['/api/leads', '/api/tasks', '/api/tasks/stats']) {
    try {
      const res = await request(path);
      if (!authToken && (res.status === 401 || res.status === 403)) {
        ok(`${path} protegido por auth`);
      } else if (authToken && res.ok) {
        ok(`${path} OK con token`);
      } else if (!authToken && res.ok) {
        warn(`${path} respondió sin auth. Revisar si esto es esperado.`);
      } else {
        warn(`${path} respondió ${res.status}`);
        if (res.body?.error) console.log(`   ${res.body.error}`);
      }
    } catch (err) {
      warn(`${path} no pudo validarse: ${err.message}`);
    }
  }

  console.log('\nResultado');
  if (success) {
    ok('CRM Core listo. Validación funcional completa requiere login o UPZY_TOKEN.');
    process.exit(0);
  }
  fail('Hay errores en archivos públicos o health.');
  process.exit(1);
}

main();
