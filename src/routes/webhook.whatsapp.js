const express     = require('express');
const router      = express.Router();
const wa          = require('../services/whatsapp');
const ai          = require('../services/ai');
const scoring     = require('../services/scoring');
const automations = require('../services/automations');
const supabase    = require('../db/supabase');
const config      = require('../config/env');

const TENANT_ID = config.tenantId;

// GET — verificación webhook Meta
router.get('/', (req, res) => {
  const challenge = wa.verificarWebhook(req.query);
  if (challenge) {
    console.log('[WA] Webhook verificado ✅');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// POST — mensajes entrantes
router.post('/', async (req, res) => {
  res.status(200).json({ ok: true }); // responder inmediato

  try {
    const msg = wa.parsearWebhook(req.body);
    if (!msg || msg.esMio || !msg.texto) return;

    console.log(`[WA] ← ${msg.numero}: ${msg.texto.substring(0, 60)}`);

    // 1. Registrar lead y score
    const { lead, esNuevo, intenciones } = await scoring.procesarMensajeEntrante(
      TENANT_ID,
      { texto: msg.texto, canal_id: msg.numero, nombre: msg.nombre, telefono: msg.numero },
      'whatsapp'
    );

    // 2. Flow de bienvenida si es nuevo
    if (esNuevo) {
      await automations.dispararPorTrigger(TENANT_ID, lead.id, 'primer_mensaje_wa', { nombre: lead.nombre });
      return;
    }

    // 3. Flow de calificación si preguntó precio
    if (intenciones.includes('consulta_precio')) {
      await automations.dispararPorTrigger(TENANT_ID, lead.id, 'consulta_precio');
    }

    // 4. Si quiere agente
    if (ai.quiereAgente(msg.texto)) {
      await wa.enviarTexto(msg.numero, '¡Claro! Te conecto con un asesor ahora mismo 🙏');
      await supabase.from('upzy_leads').update({ asignado_a: 'agente', etapa: 'propuesta' }).eq('id', lead.id);
      await supabase.from('upzy_conversaciones').update({ estado: 'agente' })
        .eq('lead_id', lead.id).eq('estado', 'bot');
      return;
    }

    // 5. Verificar modo agente
    const { data: conv } = await supabase
      .from('upzy_conversaciones')
      .select('id, estado')
      .eq('tenant_id', TENANT_ID)
      .eq('lead_id', lead.id)
      .eq('canal', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (conv?.estado === 'agente') return;

    // 6. Historial para Claude
    let historial = [];
    if (conv) {
      const { data: mensajes } = await supabase
        .from('upzy_mensajes')
        .select('origen, contenido')
        .eq('conversacion_id', conv.id)
        .order('created_at', { ascending: true })
        .limit(10);
      historial = (mensajes || []).map(m => ({
        role:    m.origen === 'cliente' ? 'user' : 'assistant',
        content: m.contenido,
      }));
    }

    // 7. Respuesta IA
    const respuesta = await ai.responder(msg.texto, historial, { lead, intenciones });

    // 8. Guardar y enviar
    await guardarMensaje(TENANT_ID, lead.id, conv?.id, msg.texto, respuesta);
    await wa.enviarTexto(msg.numero, respuesta);

    console.log(`[WA] → ${msg.numero}: ${respuesta.substring(0, 60)}`);
  } catch (err) {
    console.error('[WA webhook] Error:', err.message);
  }
});

async function guardarMensaje(tenantId, leadId, convId, textoCliente, textoBot) {
  let cid = convId;
  if (!cid) {
    const { data } = await supabase
      .from('upzy_conversaciones')
      .insert({ tenant_id: tenantId, lead_id: leadId, canal: 'whatsapp', estado: 'bot' })
      .select('id').single();
    cid = data?.id;
  }
  if (!cid) return;
  await supabase.from('upzy_mensajes').insert([
    { tenant_id: tenantId, conversacion_id: cid, origen: 'cliente', contenido: textoCliente },
    { tenant_id: tenantId, conversacion_id: cid, origen: 'bot',     contenido: textoBot    },
  ]);
}

module.exports = router;
