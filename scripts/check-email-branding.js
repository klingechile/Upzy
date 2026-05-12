#!/usr/bin/env node
'use strict';

const DEFAULT_BASE_URL = 'https://upzy-production.up.railway.app';
const baseUrl = (process.argv[2] || process.env.UPZY_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const KLINGE = {
  primary: '#C0392B',
  secondary: '#111111',
  forbiddenGreen: '#3fb950',
};

const categories = [
  'bienvenida',
  'carrito',
  'cotizacion',
  'cierre',
  'seguimiento',
];

const sampleData = {
  nombre: 'Carlos García',
  empresa: 'Restaurante El Sol',
  producto: 'Panel LED Publicitario 100x50cm',
  productos: [{ title: 'Panel LED Publicitario 100x50cm', quantity: 1, price: 149990 }],
  monto: 149990,
  checkout_url: 'https://www.klinge.cl/cart',
  orden_id: '#KLG-2048',
  tipo_negocio: 'restaurante',
};

const ok = (msg) => console.log(`✅ ${msg}`);
const warn = (msg) => console.log(`⚠️  ${msg}`);
const fail = (msg) => console.log(`❌ ${msg}`);
const info = (msg) => console.log(`ℹ️  ${msg}`);

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
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
  return { ok: res.ok, status: res.status, body };
}

function includesIgnoreCase(text, needle) {
  return String(text || '').toLowerCase().includes(String(needle || '').toLowerCase());
}

function assertHtml(category, payload) {
  const issues = [];
  const html = payload?.html || '';
  const subject = payload?.asunto || payload?.subject || '';
  const preview = payload?.preview || '';

  if (!html || html.length < 1000) issues.push('HTML demasiado corto o vacío');
  if (!subject) issues.push('Asunto vacío');
  if (!preview) issues.push('Preview/preheader vacío');
  if (!includesIgnoreCase(html, 'Klinge')) issues.push('No aparece Klinge en el HTML');
  if (!includesIgnoreCase(html, KLINGE.primary)) issues.push(`No aparece rojo Klinge ${KLINGE.primary}`);
  if (!includesIgnoreCase(html, KLINGE.secondary)) issues.push(`No aparece negro Klinge ${KLINGE.secondary}`);
  if (includesIgnoreCase(html, KLINGE.forbiddenGreen)) issues.push(`Aparece verde antiguo ${KLINGE.forbiddenGreen}`);
  if (!/<a\s+[^>]*href=/i.test(html)) issues.push('No hay CTA/link en el HTML');
  if (!/whatsapp|wa\.me|klinge\.cl/i.test(html)) issues.push('No hay link comercial claro a WhatsApp o Klinge.cl');

  return { category, issues, subject, preview, size: html.length };
}

async function main() {
  console.log(`\nDiagnóstico Upzy — Email Branding Klinge`);
  console.log(`Base URL: ${baseUrl}\n`);

  let failed = false;

  const branding = await request('/api/email/branding');
  if (!branding.ok) {
    fail(`/api/email/branding respondió ${branding.status}`);
    console.log(JSON.stringify(branding.body, null, 2));
    process.exit(1);
  }

  ok('Branding API OK');
  info(`primary=${branding.body?.primary || 'N/D'} secondary=${branding.body?.secondary || 'N/D'} hasLogo=${!!branding.body?.hasLogo}`);

  if (String(branding.body?.primary).toUpperCase() !== KLINGE.primary.toUpperCase()) {
    warn(`Primary no coincide con Klinge: esperado ${KLINGE.primary}, actual ${branding.body?.primary}`);
    failed = true;
  }
  if (String(branding.body?.secondary).toUpperCase() !== KLINGE.secondary.toUpperCase()) {
    warn(`Secondary no coincide con Klinge: esperado ${KLINGE.secondary}, actual ${branding.body?.secondary}`);
    failed = true;
  }

  console.log('\nValidando previews branded...\n');

  for (const categoria of categories) {
    const result = await request('/api/email/preview-branded', {
      method: 'POST',
      body: JSON.stringify({ categoria, datos: sampleData }),
    });

    if (!result.ok) {
      failed = true;
      fail(`${categoria}: preview respondió ${result.status}`);
      console.log(JSON.stringify(result.body, null, 2));
      continue;
    }

    const check = assertHtml(categoria, result.body);
    if (check.issues.length) {
      failed = true;
      fail(`${categoria}: ${check.issues.join(' · ')}`);
    } else {
      ok(`${categoria}: OK · ${check.size} chars · asunto: ${check.subject}`);
    }
  }

  console.log('\n────────────────────────────────────────');

  if (failed) {
    warn('Diagnóstico finalizado con alertas. Revisar branding tenant y src/services/email-templates.js.');
    process.exit(1);
  }

  ok('Todos los emails branded cumplen con Klinge.');
  process.exit(0);
}

main().catch((err) => {
  fail(err.message);
  process.exit(1);
});
