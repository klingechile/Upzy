const express = require('express');
const router = express.Router();

const lumiAssistant = require('../modules/lumi-assistant');

function validateWebhookSecret(req, res, next) {
  const configuredSecret = process.env.LUMI_ASSISTANT_WEBHOOK_SECRET || '';

  if (!configuredSecret && process.env.NODE_ENV !== 'production') {
    return next();
  }

  const receivedSecret = req.header('X-Lumi-Webhook-Secret') || '';

  if (!configuredSecret || receivedSecret !== configuredSecret) {
    return res.status(401).json({
      ok: false,
      error: 'invalid_lumi_assistant_secret',
    });
  }

  return next();
}

// POST /api/lumi-assistant/webhook
router.post('/webhook', validateWebhookSecret, async (req, res) => {
  try {
    const result = await lumiAssistant.handleInbound(req.body);

    if (!result) {
      return res.status(204).send();
    }

    return res.status(200).json({
      ok: true,
      reply: result.text,
      metadata: result.metadata || {},
    });
  } catch (error) {
    console.error('[lumi-assistant] webhook error:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'lumi_assistant_error',
      message: error.message,
    });
  }
});

// POST /api/lumi-assistant/test-message
router.post('/test-message', validateWebhookSecret, async (req, res) => {
  try {
    const result = await lumiAssistant.handleInbound({
      channel_id: req.body.channelId || req.body.channel_id || 'grupo_klinge_operaciones',
      channel_type: req.body.channelType || req.body.channel_type || 'test',
      message_id: req.body.messageId || req.body.message_id || `test-${Date.now()}`,
      from: req.body.userId || req.body.from || 'whatsapp:+56935596560',
      sender_name: req.body.userName || req.body.sender_name || 'Test User',
      text: req.body.messageText || req.body.text || '',
      timestamp: req.body.timestamp || new Date().toISOString(),
      raw: req.body,
    });

    if (!result) {
      return res.status(204).send();
    }

    return res.status(200).json({
      ok: true,
      reply: result.text,
      metadata: result.metadata || {},
    });
  } catch (error) {
    console.error('[lumi-assistant] test-message error:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'lumi_assistant_test_error',
      message: error.message,
    });
  }
});

module.exports = router;
