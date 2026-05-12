// src/services/cart-recovery-email.js
// Pipeline completo: Shopify webhook → detectar abandono → enviar email con branding Klinge
// Flujo: 1h email plain → 24h email + descuento → 48h WhatsApp

const supabase     = require('../db/supabase');
const ses          = require('./ses');
const templates    = require('./email-templates');
const config       = require('../config/env');

const TENANT_ID = config.tenantId;

// ── TIEMPOS DEL FLUJO ─────────────────────────────────────────
const FLOW = {
  etapa1: { delay: 60 * 60 * 1000,      label: '1h',    tipo: 'carrito_1h'   },  // 1 hora
  etapa2: { delay: 24 * 60 * 60 * 1000, label: '24h',   tipo: 'carrito_24h'  },  // 24 horas
  etapa3: { delay: 48 * 60 * 60 * 1000, label: '48h WA',tipo: 'carrito_wa'   },  // 48h WhatsApp
};

/**
 * Disparar flujo de recuperación para un carrito abandonado.
 * Llamado desde el job de detección (jobs/carritos.js) o desde webhook.
 */
const dispararFlujoCarrito = async (eventoId) => {
  // Obtener evento con datos del lead
  const { data: evento, error } = await supabase
    .from('upzy_eventos_shopify')
    .select(`
      *,
      lead:upzy_leads(id, nombre, email, telefono, empresa, tipo_negocio, segmento)
    `)
    .eq('id', eventoId)
    .eq('tenant_id', TENANT_ID)
    .single();

  if (error || !evento) {
    console.error('[cart-email] Evento no encontrado:', eventoId);
    return { ok: false, error: 'Evento no encontrado' };
  }

  // Verificar que no se haya completado la compra
  if (evento.recuperado || evento.tipo === 'order_paid') {
    console.log('[cart-email] Carrito ya recuperado, omitiendo:', eventoId);
    return { ok: false, reason: 'ya_recuperado' };
  }

  const lead = evento.lead;
  if (!lead?.email) {
    console.log('[cart-email] Lead sin email, omitiendo:', lead?.id);
    return { ok: false, reason: 'sin_email' };
  }

  const horasDesdeAbandono = Math.floor(
    (Date.now() - new Date(evento.created_at).getTime()) / (1000 * 60 * 60)
  );

  const datos = {
    nombre:       lead.nombre || 'Cliente',
    empresa:      lead.empresa,
    tipo_negocio: lead.tipo_negocio,
    producto:     evento.productos?.[0]?.title || 'Panel LED',
    productos:    evento.productos || [],
    monto:        evento.monto,
    checkout_url: evento.checkout_url || config.shopify.storeUrl,
    unsubscribe_url: `${config.app?.publicUrl || 'https://upzy-production.up.railway.app'}/api/email/unsubscribe?email=${encodeURIComponent(lead.email)}`,
  };

  let resultado = null;

  // Seleccionar etapa según tiempo transcurrido
  if (horasDesdeAbandono < 2) {
    // Etapa 1: email directo sin descuento (urgencia natural)
    resultado = await enviarEtapa1(lead, datos, eventoId);
  } else if (horasDesdeAbandono < 36) {
    // Etapa 2: email con descuento 10%
    resultado = await enviarEtapa2(lead, datos, eventoId);
  }
  // Etapa 3 la maneja el bot de WhatsApp (automations.js)

  return resultado;
};

/**
 * Etapa 1 — 1 hora: email simple sin descuento
 */
const enviarEtapa1 = async (lead, datos, eventoId) => {
  try {
    const { asunto, html } = await templates.carritoAbandonado1h(TENANT_ID, datos);

    const r = await ses.enviarEmail({
      to:      lead.email,
      subject: asunto,
      html,
    });

    await logEnvio(lead, eventoId, 'carrito_1h', asunto, r.MessageId);
    await marcarEtapa(eventoId, 'email_1h_enviado');

    console.log(`[cart-email] Etapa 1 enviada → ${lead.email} | ${r.MessageId}`);
    return { ok: true, etapa: 1, messageId: r.MessageId };
  } catch (err) {
    console.error('[cart-email] Error etapa 1:', err.message);
    return { ok: false, error: err.message };
  }
};

/**
 * Etapa 2 — 24 horas: email con descuento VUELVE10
 */
const enviarEtapa2 = async (lead, datos, eventoId) => {
  try {
    const { asunto, html } = await templates.carritoAbandonado24h(TENANT_ID, datos);

    const r = await ses.enviarEmail({
      to:      lead.email,
      subject: asunto,
      html,
    });

    await logEnvio(lead, eventoId, 'carrito_24h', asunto, r.MessageId);
    await marcarEtapa(eventoId, 'email_24h_enviado');

    console.log(`[cart-email] Etapa 2 (10% OFF) enviada → ${lead.email} | ${r.MessageId}`);
    return { ok: true, etapa: 2, messageId: r.MessageId };
  } catch (err) {
    console.error('[cart-email] Error etapa 2:', err.message);
    return { ok: false, error: err.message };
  }
};

/**
 * Guardar registro del envío
 */
const logEnvio = async (lead, eventoId, tipo, asunto, messageId) => {
  await supabase.from('upzy_email_sends').insert({
    tenant_id:      TENANT_ID,
    lead_id:        lead.id,
    tipo:           'automatizacion',
    destinatario:   lead.email,
    asunto,
    estado:         'enviado',
    ses_message_id: messageId,
    enviado_at:     new Date().toISOString(),
    metadata:       { evento_id: eventoId, flujo: tipo },
  });
};

/**
 * Marcar etapa del carrito en el evento
 */
const marcarEtapa = async (eventoId, estado) => {
  await supabase.from('upzy_eventos_shopify')
    .update({
      recuperacion_estado: estado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventoId);
};

/**
 * Detectar carritos pendientes y disparar flujo
 * Llamado por el job nocturno o por API manual
 */
const procesarCarritosPendientes = async () => {
  const ahora = new Date();
  const hace1h  = new Date(ahora - FLOW.etapa1.delay);
  const hace24h = new Date(ahora - FLOW.etapa2.delay);

  // Carritos abandonados hace 1h+ sin email enviado
  const { data: pendientes1h } = await supabase
    .from('upzy_eventos_shopify')
    .select('id, monto, productos, checkout_url, lead_id, created_at')
    .eq('tenant_id', TENANT_ID)
    .in('tipo', ['checkout_created', 'checkout_updated'])
    .eq('recuperacion_estado', 'pendiente')
    .lt('created_at', hace1h.toISOString())
    .gt('created_at', hace24h.toISOString())
    .limit(20);

  // Carritos con email_1h enviado pero sin descuento aún (hace 24h+)
  const { data: pendientes24h } = await supabase
    .from('upzy_eventos_shopify')
    .select('id, monto, productos, checkout_url, lead_id, created_at')
    .eq('tenant_id', TENANT_ID)
    .eq('recuperacion_estado', 'email_1h_enviado')
    .lt('created_at', hace24h.toISOString())
    .limit(20);

  const resultados = [];

  for (const ev of [...(pendientes1h || []), ...(pendientes24h || [])]) {
    const r = await dispararFlujoCarrito(ev.id);
    resultados.push({ id: ev.id, ...r });
    // Pequeña pausa para no saturar SES
    await new Promise(res => setTimeout(res, 500));
  }

  return {
    procesados: resultados.length,
    enviados:   resultados.filter(r => r.ok).length,
    omitidos:   resultados.filter(r => !r.ok).length,
    detalle:    resultados,
  };
};

module.exports = {
  dispararFlujoCarrito,
  procesarCarritosPendientes,
  enviarEtapa1,
  enviarEtapa2,
};
