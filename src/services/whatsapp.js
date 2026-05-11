// src/services/whatsapp.js
// WhatsApp Cloud API (Meta oficial)
// Usa WA_TOKEN y WA_PHONE_ID que ya existen en Railway

const axios  = require('axios');
const config = require('../config/env');

const GRAPH_URL = 'https://graph.facebook.com/v18.0';

const client = axios.create({
  baseURL: `${GRAPH_URL}/${config.whatsapp.phoneId}`,
  headers: {
    Authorization:  `Bearer ${config.whatsapp.token}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Envía texto libre por WhatsApp Cloud API
 */
const enviarTexto = async (numero, texto) => {
  if (!config.whatsapp.enabled) throw new Error('WhatsApp no configurado — revisar WA_TOKEN y WA_PHONE_ID');

  const res = await client.post('/messages', {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to:                normalizarNumero(numero),
    type:              'text',
    text:              { body: texto },
  });
  return res.data;
};

/**
 * Envía template aprobado por Meta (necesario para mensajes proactivos)
 * Usar para carritos abandonados, campañas, etc.
 */
const enviarTemplate = async (numero, templateName, params = [], language = null) => {
  if (!config.whatsapp.enabled) throw new Error('WhatsApp no configurado');

  const components = params.length > 0 ? [{
    type:       'body',
    parameters: params.map(p => ({ type: 'text', text: String(p) })),
  }] : [];

  const res = await client.post('/messages', {
    messaging_product: 'whatsapp',
    to:   normalizarNumero(numero),
    type: 'template',
    template: {
      name:     templateName,
      language: { code: language || config.whatsapp.templateLanguage || 'es' },
      components,
    },
  });
  return res.data;
};

/**
 * Envía imagen con caption
 */
const enviarImagen = async (numero, url, caption = '') => {
  if (!config.whatsapp.enabled) throw new Error('WhatsApp no configurado');

  const res = await client.post('/messages', {
    messaging_product: 'whatsapp',
    to:   normalizarNumero(numero),
    type: 'image',
    image: { link: url, caption },
  });
  return res.data;
};

/**
 * Parsea webhook entrante de WhatsApp Cloud API
 */
const parsearWebhook = (body) => {
  try {
    const entry     = body?.entry?.[0];
    const changes   = entry?.changes?.[0];
    const value     = changes?.value;
    const mensaje   = value?.messages?.[0];

    if (!mensaje) return null;

    const texto  = mensaje.text?.body || '';
    const numero = mensaje.from || '';
    const nombre = value?.contacts?.[0]?.profile?.name || '';
    const esMio  = false; // los webhooks entrantes siempre son del cliente

    if (!texto || !numero) return null;

    return { texto, numero, nombre, esMio, raw: mensaje };
  } catch {
    return null;
  }
};

/**
 * Verificación del webhook de Meta (GET)
 */
const verificarWebhook = (query) => {
  const mode      = query['hub.mode'];
  const token     = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  // Usa VERIFY_TOKEN o IG_VERIFY_TOKEN (ambos existen en Railway)
  const myToken   = config.whatsapp.verifyToken;
  if (mode === 'subscribe' && token === myToken) return challenge;
  return null;
};

// Chile: normalizar a formato internacional sin +
const normalizarNumero = (num) => {
  if (!num) return '';
  let n = String(num).replace(/\D/g, '');
  if (n.startsWith('0')) n = n.slice(1);
  if (n.startsWith('9') && n.length === 9) n = '56' + n;
  if (n.startsWith('56') && n.length === 11) return n;
  return n;
};

module.exports = { enviarTexto, enviarTemplate, enviarImagen, parsearWebhook, verificarWebhook, normalizarNumero };
