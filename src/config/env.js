// ============================================================
// src/config/env.js — Fuente única de variables de entorno
// Mapeado a las variables EXISTENTES en Railway lumi-klinge-bot
// ============================================================

const REQUIRED = [
  'TENANT_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const faltantes = REQUIRED.filter(k => !process.env[k]);
if (faltantes.length > 0) {
  console.error('\n❌ Variables requeridas no encontradas:');
  faltantes.forEach(k => console.error(`   • ${k}`));
  console.error('\n→ Agrégalas en Railway: Project > Variables\n');
  process.exit(1);
}

const config = {
  port:    parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.PUBLIC_URL || '',          // ← PUBLIC_URL (ya existe)
  isProd:  process.env.NODE_ENV === 'production',

  tenantId: process.env.TENANT_ID,                // ← ya existe

  supabase: {
    url:            process.env.SUPABASE_URL,               // ← ya existe
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,  // ← ya existe
    anonKey:        process.env.SUPABASE_KEY || '',         // ← ya existe (no usar en backend)
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model:  process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },

  // WhatsApp Cloud API (Meta oficial) — ya existente en Railway
  whatsapp: {
    token:      process.env.WA_TOKEN    || '',   // ← WA_TOKEN (ya existe)
    phoneId:    process.env.WA_PHONE_ID || '',   // ← WA_PHONE_ID (ya existe)
    enabled:    !!(process.env.WA_TOKEN && process.env.WA_PHONE_ID),
    // Templates para mensajes proactivos (carritos, campañas)
    abandonedCartTemplate: process.env.WHATSAPP_ABANDONED_CART_TEMPLA__ || 'hello_world',
    templateLanguage:      process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
    verifyToken:           process.env.VERIFY_TOKEN || process.env.IG_VERIFY_TOKEN || '',
  },

  // Instagram — ya existente en Railway
  instagram: {
    accessToken: process.env.IG_ACCESS_TOKEN  || '',  // ← ya existe
    pageId:      process.env.IG_PAGE_ID       || '',  // ← ya existe
    businessId:  process.env.IG_ACCOUNT_ID    || '',  // ← IG_ACCOUNT_ID (ya existe)
    verifyToken: process.env.IG_VERIFY_TOKEN  || '',  // ← ya existe
    graphVersion:process.env.IG_GRAPH_VERSION || 'v25.0',
    enabled:     !!process.env.IG_ACCESS_TOKEN,
  },

  // Shopify — ya existente en Railway
  shopify: {
    storeUrl:      process.env.SHOPIFY_STORE_URL    || '',  // ← ya existe
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET|| '',  // ← ya existe
    adminToken:    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    apiVersion:    process.env.SHOPIFY_API_VERSION  || '2024-01',
    skipVerify:    process.env.SHOPIFY_SKIP_WEBHOOK_VERIFY === 'true',
    enabled:       !!process.env.SHOPIFY_STORE_URL,
  },

  // ElevenLabs — ya existente en Railway
  elevenlabs: {
    voiceId: process.env.ELEVEN_VOICE_ID || '',  // ← ya existe
    enabled: !!process.env.ELEVEN_VOICE_ID,
  },

  // Email — ya existente en Railway
  email: {
    from:     process.env.EMAIL_FROM     || '',  // ← ya existe
    provider: process.env.EMAIL_PROVIDER || '',  // ← ya existe
    enabled:  !!process.env.EMAIL_FROM,
  },

  // Gemini (alternativa a Claude si lo usan) — ya existe
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    id:     process.env.GEMINI_ID      || '',
    enabled: !!process.env.GEMINI_API_KEY,
  },
};

// Log de arranque (sin exponer valores)
console.log('🔧 Upzy config cargada:');
console.log(`   Tenant:     ${config.tenantId}`);
console.log(`   Entorno:    ${config.nodeEnv}`);
console.log(`   WhatsApp:   ${config.whatsapp.enabled   ? '✅ Cloud API' : '❌'}`);
console.log(`   Instagram:  ${config.instagram.enabled  ? '✅' : '❌'}`);
console.log(`   Shopify:    ${config.shopify.enabled     ? '✅' : '❌'}`);
console.log(`   Anthropic:  ${config.anthropic.apiKey    ? '✅' : '❌'}`);
console.log(`   Gemini:     ${config.gemini.enabled       ? '✅' : '—'}`);

module.exports = config;
