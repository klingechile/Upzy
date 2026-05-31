const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const config = require('../config/env');
const { auditLog } = require('../services/audit');

const TENANT_ID = config.tenantId;

// GET /api/omnichannel/status
router.get('/status', async (req, res) => {
  try {
    const [lumiConvs, upzyConvs, lumiMsgs, upzyMsgs] = await Promise.all([
      countRows('lumi_conversations', true),
      countRows('upzy_conversaciones', true),
      countRows('lumi_messages', true),
      countRows('upzy_mensajes', true),
    ]);

    res.json({
      ok: true,
      channels: {
        whatsapp: config.whatsapp.enabled,
        instagram: config.instagram.enabled,
        shopify: config.shopify.enabled,
        email: config.email.enabled,
        web: true,
      },
      counts: {
        lumi_conversations: lumiConvs,
        upzy_conversaciones: upzyConvs,
        lumi_messages: lumiMsgs,
        upzy_mensajes: upzyMsgs,
      },
      mode: 'agent_assist',
      auto_reply_enabled: false,
    });
  } catch (err) {
    console.error('[omnichannel] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/omnichannel/suggest-reply
router.post('/suggest-reply', async (req, res) => {
  try {
    const { conversation_id, source, intent, lead, last_message } = req.body || {};
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id requerido' });

    const suggestion = buildSuggestion({ intent, lead, last_message });

    await auditLog(req, 'omnichannel.reply_suggested', {
      entity_type: 'conversation',
      entity_id: conversation_id,
      metadata: { source, intent, mode: 'agent_assist' },
    });

    res.json({
      ok: true,
      mode: 'agent_assist',
      auto_send: false,
      suggestion,
    });
  } catch (err) {
    console.error('[omnichannel] suggest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function countRows(table, optional) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID);
    if (error) return { status: optional ? 'WARN' : 'ERROR', count: 0, detail: error.message };
    return { status: 'OK', count: count || 0, detail: `${count || 0} registros` };
  } catch (err) {
    return { status: optional ? 'WARN' : 'ERROR', count: 0, detail: err.message };
  }
}

function buildSuggestion({ intent, lead, last_message }) {
  const name = lead?.nombre && !String(lead.nombre).includes('sin nombre') ? lead.nombre : 'Hola';
  const product = lead?.producto_interes || lead?.tipo_negocio || 'panel LED';
  const normalizedIntent = String(intent || inferIntent(last_message)).toLowerCase();

  if (normalizedIntent.includes('envio')) {
    return `${name}, sí, hacemos envíos a todo Chile por Bluexpress. Para calcular bien el despacho necesito la comuna y región. También puedes retirar en nuestra sala de ventas si te acomoda más.`;
  }

  if (normalizedIntent.includes('retiro')) {
    return `${name}, puedes retirar en nuestra sala de ventas. Para reservar el ${product}, trabajamos con abono del 30% y el saldo al retirar o despachar.`;
  }

  if (normalizedIntent.includes('garantia')) {
    return `${name}, nuestros paneles LED cuentan con 1 año de garantía. Además entregamos soporte local para ayudarte con instalación, uso y cualquier duda posterior a la compra.`;
  }

  if (normalizedIntent.includes('precio') || normalizedIntent.includes('cotiza')) {
    return `${name}, te ayudo con la cotización. Para recomendarte bien necesito confirmar medida, uso muro/vitrina/soporte y si quieres retiro o despacho. Con eso te dejo la mejor opción para tu negocio.`;
  }

  return `${name}, gracias por escribirnos. Te ayudo a elegir la mejor solución visual para que tu negocio destaque y venda más. ¿Buscas panel LED para muro, vitrina, soporte o colgante?`;
}

function inferIntent(message) {
  const text = String(message || '').toLowerCase();
  if (text.includes('env')) return 'envio';
  if (text.includes('reti')) return 'retiro';
  if (text.includes('garant')) return 'garantia';
  if (text.includes('precio') || text.includes('valor') || text.includes('cotiz')) return 'precio';
  return 'general';
}

module.exports = router;
