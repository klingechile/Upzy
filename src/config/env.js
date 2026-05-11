// ============================================================
// src/config/env.js — Fuente única de variables de entorno
// Mapeado a las variables EXISTENTES en Railway Upzy/Klinge
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

const parseEmailFrom = (value = '') => {
  const match = String(value).match(/<([^>]+)>/);
  return match ? match[1].trim() : String(value).trim();
};

const awsSesFromEmail =
  process.env.AWS_SES_FROM_EMAIL ||
  process.env.EMAIL_FROM_ADDRESS ||
  parseEmailFrom(process.env.EMAIL_FROM || '');

const awsSesFromName =
  process.env.AWS_SES_FROM_NAME ||
  process.env.EMAIL_FROM_NAME ||
  'Klinge';

const config = {
  port:    parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.PUBLIC_URL || process.env.BASE_URL || '',
  isProd:  process.env.NODE_ENV === 'production',

  tenantId: process.env.TENANT_ID,

  supabase: {
    url:            process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey:        process.env.SUPABASE_KEY || '',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
    model:  process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  },

  // AWS SES / SNS
  aws: {
    region:          process.env.AWS_REGION || 'us-east-1',
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sesFromEmail:    awsSesFromEmail,
    sesFromName:     awsSesFromName,
    enabled: !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      awsSesFromEmail
    ),
  },

  // WhatsApp Cloud API (Meta oficial)
  whatsapp: {
    token:      process.env.WA_TOKEN    || '',
    phoneId:    process.env.WA_PHONE_ID || '',
    enabled:    !!(process.env.WA_TOKEN && process.env.WA_PHONE_ID),
    abandonedCartTemplate:
      process.env.WHATSAPP_ABANDONED_CART_TEMPLATE ||
      process.env.WHATSAPP_ABANDONED_CART_TEMPLA__ ||
      'hello_world',
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
    verifyToken:      process.env.VERIFY_TOKEN || process.env.IG_VERIFY_TOKEN || '',
  },

  // Instagram
  instagram: {
    accessToken:  process.env.IG_ACCESS_TOKEN  || '',
    pageId:       process.env.IG_PAGE_ID || process.env.IG_ACCOUNT_ID || '',
    businessId:   process.env.IG_ACCOUNT_ID || '',
    verifyToken:  process.env.IG_VERIFY_TOKEN || process.env.VERIFY_TOKEN || '',
    graphVersion: process.env.IG_GRAPH_VERSION || 'v25.0',
    enabled:      !!(process.env.IG_ACCESS_TOKEN && (process.env.IG_PAGE_ID || process.env.IG_ACCOUNT_ID)),
  },

  // Shopify
  shopify: {
    storeUrl:      process.env.SHOPIFY_STORE_URL || '',
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
    adminToken:    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    apiVersion:    process.env.SHOPIFY_API_VERSION || '2024-01',
    abandonedCheckoutDelayMinutes: parseInt(process.env.SHOPIFY_ABANDONED_CHECKOUT_DELAY_MINUTES || '30', 10),
    skipVerify:    process.env.SHOPIFY_SKIP_WEBHOOK_VERIFY === 'true',
    enabled:       !!process.env.SHOPIFY_STORE_URL,
  },

  // ElevenLabs
  elevenlabs: {
    apiKey:  process.env.ELEVEN_API_KEY || '',
    voiceId: process.env.ELEVEN_VOICE_ID || '',
    enabled: !!(process.env.ELEVEN_API_KEY || process.env.ELEVEN_VOICE_ID),
  },

  // Email
  email: {
    from:      process.env.EMAIL_FROM || (awsSesFromEmail ? `${awsSesFromName} <${awsSesFromEmail}>` : ''),
    provider:  process.env.EMAIL_PROVIDER || (awsSesFromEmail ? 'ses' : ''),
    resendKey: process.env.RESEND_API_KEY || '',
    enabled:   !!(process.env.EMAIL_FROM || awsSesFromEmail),
  },

  // Gemini (alternativa a Claude si lo usan)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    id:     process.env.GEMINI_ID || '',
    model:  process.env.GEMINI_MODEL || '',
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
console.log(`   AWS SES:    ${config.aws.enabled         ? '✅' : '❌'}`);
console.log(`   Gemini:     ${config.gemini.enabled       ? '✅' : '—'}`);

module.exports = config;
