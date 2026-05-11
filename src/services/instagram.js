const axios  = require('axios');
const config = require('../config/env');

const GRAPH_URL = 'https://graph.facebook.com/v25.0';

const enviarTexto = async (recipientId, texto) => {
  if (!config.instagram.enabled) throw new Error('Instagram no configurado — revisar IG_ACCESS_TOKEN');
  const res = await axios.post(
    `${GRAPH_URL}/${config.instagram.pageId}/messages`,
    { recipient: { id: recipientId }, message: { text: texto }, messaging_type: 'RESPONSE' },
    { params: { access_token: config.instagram.accessToken } }
  );
  return res.data;
};

const parsearWebhook = (body) => {
  try {
    const messaging = body?.entry?.[0]?.messaging?.[0];
    if (!messaging) return null;
    const senderId = messaging.sender?.id;
    const texto    = messaging.message?.text;
    const esMio    = messaging.message?.is_echo || false;
    if (!texto || esMio) return null;
    return { senderId, texto, esMio, raw: messaging };
  } catch { return null; }
};

const verificarWebhook = (query) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = query;
  if (mode === 'subscribe' && token === config.instagram.verifyToken) return challenge;
  return null;
};

module.exports = { enviarTexto, parsearWebhook, verificarWebhook };
