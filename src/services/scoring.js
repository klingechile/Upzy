// ============================================================
// UPZY — Motor de Scoring y Segmentación de Leads
// Archivo: src/services/scoring.js
//
// USO:
//   const scoring = require('./services/scoring');
//
//   // Al recibir mensaje nuevo:
//   const lead = await scoring.upsertLead(tenantId, contactData, 'whatsapp');
//
//   // Al detectar intención de compra:
//   await scoring.addScore(tenantId, lead.id, 'consulta_precio', { mensaje: '...' });
//
//   // Al recibir carrito abandonado de Shopify:
//   await scoring.addScore(tenantId, lead.id, 'carrito_abandonado', { monto: 149990 });
// ============================================================

const supabase = require('../db/supabase');

// ── TABLA DE SCORING ─────────────────────────────────────────
// Define cuántos puntos suma cada evento.
// Ajustar según comportamiento real observado en Klinge.
const SCORE_RULES = {
  // Primer contacto
  primer_mensaje:           { delta: 1, descripcion: 'Primer mensaje recibido' },
  primer_mensaje_instagram: { delta: 1, descripcion: 'Primer DM de Instagram' },

  // Intención de compra (detectada por el bot en el mensaje)
  consulta_precio:          { delta: 3, descripcion: 'Preguntó por precio' },
  consulta_stock:           { delta: 2, descripcion: 'Preguntó por disponibilidad' },
  consulta_envio:           { delta: 2, descripcion: 'Preguntó por envío/plazo' },
  solicito_cotizacion:      { delta: 4, descripcion: 'Pidió cotización explícita' },
  menciono_urgencia:        { delta: 3, descripcion: 'Mencionó urgencia o fecha límite' },
  menciono_cantidad:        { delta: 3, descripcion: 'Mencionó 3+ unidades' },

  // Actividad Shopify
  checkout_creado:          { delta: 3, descripcion: 'Inició checkout en Shopify' },
  carrito_abandonado:       { delta: 4, descripcion: 'Abandonó carrito en Shopify' },
  orden_creada:             { delta: 5, descripcion: 'Creó una orden' },
  orden_pagada:             { delta: 6, descripcion: 'Completó una compra' },

  // Comportamiento positivo
  respondio_rapido:         { delta: 1, descripcion: 'Respondió en menos de 10 min' },
  visita_multiple:          { delta: 1, descripcion: 'Más de 3 mensajes en sesión' },
  compartio_empresa:        { delta: 2, descripcion: 'Compartió nombre de empresa' },
  compartio_telefono:       { delta: 1, descripcion: 'Compartió teléfono' },

  // Comportamiento negativo
  sin_respuesta_24h:        { delta: -2, descripcion: 'Sin respuesta en 24 horas' },
  sin_respuesta_72h:        { delta: -2, descripcion: 'Sin respuesta en 72 horas' },
  solicito_no_contactar:    { delta: -5, descripcion: 'Pidió no ser contactado' },
};

// ── SEGMENTACIÓN ─────────────────────────────────────────────
const getSegmento = (score) => {
  if (score >= 8) return 'hot';
  if (score >= 5) return 'warm';
  return 'cold';
};

// ── ETAPA POR ACTIVIDAD ──────────────────────────────────────
const getEtapaMinima = (motivo) => {
  const etapas = {
    primer_mensaje:      'contactado',
    consulta_precio:     'calificado',
    solicito_cotizacion: 'propuesta',
    orden_pagada:        'cerrado',
  };
  return etapas[motivo] || null;
};

// ── DETECCIÓN DE INTENCIÓN EN TEXTO ──────────────────────────
// Analiza el texto de un mensaje y devuelve los motivos detectados.
// Se llama desde el webhook handler de WA/IG antes de responder.
const detectarIntenciones = (texto) => {
  if (!texto) return [];
  const t = texto.toLowerCase();
  const motivos = [];

  const patrones = {
    consulta_precio:     /precio|costo|cuánto|cuanto|vale|valor|\$|cop|clp/,
    consulta_stock:      /stock|disponib|tienen|hay |tienes/,
    consulta_envio:      /envío|envio|despacho|llega|demora|plazo|días|dias/,
    solicito_cotizacion: /cotiz|presupuesto|proforma|propuesta/,
    menciono_urgencia:   /urgent|rápido|rapido|hoy|mañana|esta semana|fin de semana|asap/,
    menciono_cantidad:   /[3-9]\s*(unidades|pantallas|paneles|displays)|vari[ao]s|varios/,
    compartio_empresa:   /empresa|negocio|local|tienda|restaurante|gym|café|cafe|spa|farmacia/,
  };

  for (const [motivo, regex] of Object.entries(patrones)) {
    if (regex.test(t)) motivos.push(motivo);
  }

  return motivos;
};

// ── UPSERT LEAD ───────────────────────────────────────────────
// Crea o actualiza un lead cuando llega un mensaje nuevo.
// canal_id = número de WA, username IG, customer_id Shopify
const upsertLead = async (tenantId, contactData, canal) => {
  const {
    canal_id,
    nombre,
    empresa,
    telefono,
    email,
    ciudad,
  } = contactData;

  if (!canal_id) throw new Error('canal_id es requerido para upsert lead');

  // Buscar lead existente
  const { data: existing } = await supabase
    .from('upzy_leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('canal', canal)
    .eq('canal_id', canal_id)
    .single();

  if (existing) {
    // Actualizar último contacto y datos si llegaron
    const updates = {
      ultimo_contacto: new Date().toISOString(),
      total_mensajes: existing.total_mensajes + 1,
    };
    if (nombre && !existing.nombre) updates.nombre = nombre;
    if (empresa && !existing.empresa) updates.empresa = empresa;
    if (telefono && !existing.telefono) updates.telefono = telefono;
    if (email && !existing.email) updates.email = email;

    const { data, error } = await supabase
      .from('upzy_leads')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return { lead: data, esNuevo: false };
  }

  // Crear nuevo lead
  const { data, error } = await supabase
    .from('upzy_leads')
    .insert({
      tenant_id: tenantId,
      canal,
      canal_id,
      nombre: nombre || null,
      empresa: empresa || null,
      telefono: telefono || null,
      email: email || null,
      ciudad: ciudad || null,
      score: 1,
      segmento: 'cold',
      etapa: 'nuevo',
      ultimo_contacto: new Date().toISOString(),
      total_mensajes: 1,
    })
    .select()
    .single();

  if (error) throw error;

  // Registrar evento de score inicial
  await registrarScoreEvento(tenantId, data.id, 'primer_mensaje', 1, 0, 1, 'cold', 'cold');

  console.log(`[scoring] Nuevo lead creado: ${data.id} (${canal}:${canal_id})`);
  return { lead: data, esNuevo: true };
};

// ── AGREGAR SCORE ─────────────────────────────────────────────
// Suma puntos a un lead y actualiza segmento/etapa automáticamente.
// Llama esto desde tus webhooks handlers.
const addScore = async (tenantId, leadId, motivo, metadata = {}) => {
  const rule = SCORE_RULES[motivo];
  if (!rule) {
    console.warn(`[scoring] Motivo desconocido: ${motivo}`);
    return null;
  }

  // Obtener lead actual
  const { data: lead, error: fetchError } = await supabase
    .from('upzy_leads')
    .select('id, score, segmento, etapa')
    .eq('id', leadId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !lead) {
    console.error(`[scoring] Lead no encontrado: ${leadId}`);
    return null;
  }

  const scoreAnterior = lead.score;
  const segmentoAnterior = lead.segmento;

  // Calcular nuevo score (entre 1 y 10)
  const scoreNuevo = Math.max(1, Math.min(10, scoreAnterior + rule.delta));
  const segmentoNuevo = getSegmento(scoreNuevo);

  // Calcular nueva etapa (nunca retrocede)
  const etapaMinima = getEtapaMinima(motivo);
  const etapas = ['nuevo', 'contactado', 'calificado', 'propuesta', 'cerrado'];
  let etapaNueva = lead.etapa;
  if (etapaMinima) {
    const idxActual = etapas.indexOf(lead.etapa);
    const idxMinima = etapas.indexOf(etapaMinima);
    if (idxMinima > idxActual) etapaNueva = etapaMinima;
  }

  // Actualizar lead
  const updates = {
    score: scoreNuevo,
    segmento: segmentoNuevo,
    etapa: etapaNueva,
    ultimo_contacto: new Date().toISOString(),
  };

  // Guardar datos extra si los trajo el evento
  if (metadata.tipo_negocio) updates.tipo_negocio = metadata.tipo_negocio;
  if (metadata.cantidad_pantallas) updates.cantidad_pantallas = metadata.cantidad_pantallas;

  const { data: updated, error: updateError } = await supabase
    .from('upzy_leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Registrar en log de score
  await registrarScoreEvento(
    tenantId, leadId, motivo,
    rule.delta, scoreAnterior, scoreNuevo,
    segmentoAnterior, segmentoNuevo,
    metadata
  );

  // Log si cambió de segmento (importante para alertas)
  if (segmentoAnterior !== segmentoNuevo) {
    console.log(`[scoring] 🔥 Lead ${leadId} cambió de ${segmentoAnterior} → ${segmentoNuevo} (score: ${scoreAnterior} → ${scoreNuevo})`);
  }

  return updated;
};

// ── PROCESAR MENSAJE ENTRANTE ─────────────────────────────────
// Función principal: llama esto desde tu webhook de WA/IG.
// Hace upsert del lead, detecta intenciones y actualiza score.
const procesarMensajeEntrante = async (tenantId, mensaje, canal) => {
  const { texto, canal_id, nombre, telefono } = mensaje;

  // 1. Upsert lead
  const { lead, esNuevo } = await upsertLead(tenantId, { canal_id, nombre, telefono }, canal);

  // 2. Detectar intenciones en el texto
  const intenciones = detectarIntenciones(texto);

  // 3. Sumar score por cada intención detectada
  let leadActualizado = lead;
  for (const motivo of intenciones) {
    leadActualizado = await addScore(tenantId, lead.id, motivo, { mensaje: texto }) || leadActualizado;
  }

  // 4. Bonus: si respondió rápido (último contacto hace < 10 min)
  if (!esNuevo && lead.ultimo_contacto) {
    const minutos = (Date.now() - new Date(lead.ultimo_contacto).getTime()) / 60000;
    if (minutos < 10) {
      leadActualizado = await addScore(tenantId, lead.id, 'respondio_rapido') || leadActualizado;
    }
  }

  return { lead: leadActualizado, esNuevo, intenciones };
};

// ── PROCESAR EVENTO SHOPIFY ───────────────────────────────────
// Llama esto desde tu webhook handler de Shopify.
const procesarEventoShopify = async (tenantId, evento) => {
  const { tipo, customer_email, customer_phone, customer_name, monto, checkout_url, productos, payload_raw, shopify_order_id, shopify_checkout_id } = evento;

  // Buscar o crear lead por email o teléfono
  let lead = null;

  if (customer_email) {
    const { data } = await supabase
      .from('upzy_leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', customer_email)
      .single();
    lead = data;
  }

  if (!lead && customer_phone) {
    const phone = normalizarTelefono(customer_phone);
    const { data } = await supabase
      .from('upzy_leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('telefono', phone)
      .single();
    lead = data;
  }

  // Si no existe, crear lead desde Shopify
  if (!lead) {
    const { lead: nuevo } = await upsertLead(tenantId, {
      canal_id: customer_email || customer_phone,
      nombre: customer_name,
      telefono: customer_phone ? normalizarTelefono(customer_phone) : null,
      email: customer_email,
    }, 'shopify');
    lead = nuevo;
  }

  // Registrar evento en BD
  const { data: eventoRegistrado, error } = await supabase
    .from('upzy_eventos_shopify')
    .insert({
      tenant_id: tenantId,
      lead_id: lead.id,
      tipo,
      shopify_order_id,
      shopify_checkout_id,
      monto,
      customer_email,
      customer_phone,
      customer_name,
      checkout_url,
      productos,
      payload_raw,
    })
    .select()
    .single();

  if (error) console.error('[scoring] Error registrando evento Shopify:', error);

  // Mapeo tipo → motivo de scoring
  const motivoMap = {
    checkout_created:     'checkout_creado',
    checkout_abandoned:   'carrito_abandonado',
    order_created:        'orden_creada',
    order_paid:           'orden_pagada',
  };

  const motivo = motivoMap[tipo];
  if (motivo) {
    const metadata = { monto, productos: productos?.length || 0 };
    await addScore(tenantId, lead.id, motivo, metadata);

    // Actualizar totales de compra si fue pago
    if (tipo === 'order_paid') {
      await supabase
        .from('upzy_leads')
        .update({
          total_compras: supabase.rpc('increment', { row_id: lead.id, amount: 1 }),
          total_gastado: lead.total_gastado + (monto || 0),
        })
        .eq('id', lead.id);
    }
  }

  console.log(`[scoring] Evento Shopify procesado: ${tipo} → lead ${lead.id}`);
  return { lead, evento: eventoRegistrado };
};

// ── HELPERS ───────────────────────────────────────────────────
const registrarScoreEvento = async (
  tenantId, leadId, motivo, delta,
  scoreAnterior, scoreNuevo,
  segmentoAnterior, segmentoNuevo,
  metadata = {}
) => {
  await supabase.from('upzy_score_eventos').insert({
    tenant_id: tenantId,
    lead_id: leadId,
    motivo,
    delta,
    score_anterior: scoreAnterior,
    score_nuevo: scoreNuevo,
    segmento_anterior: segmentoAnterior,
    segmento_nuevo: segmentoNuevo,
    metadata,
  });
};

const normalizarTelefono = (tel) => {
  if (!tel) return null;
  // Normalizar a formato +56XXXXXXXXX para Chile
  let t = tel.replace(/\s|-|\(|\)/g, '');
  if (t.startsWith('56') && t.length === 11) t = '+' + t;
  if (t.startsWith('9') && t.length === 9) t = '+56' + t;
  if (t.startsWith('0') && t.length === 10) t = '+56' + t.slice(1);
  return t;
};

// ── QUERIES ÚTILES ────────────────────────────────────────────
// Para el dashboard CRM

const getLeadsPorSegmento = async (tenantId) => {
  const { data, error } = await supabase
    .from('upzy_leads')
    .select('id, nombre, empresa, canal, segmento, score, etapa, ultimo_contacto, telefono, email')
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .order('score', { ascending: false });

  if (error) throw error;
  return data;
};

const getCarritosPendientes = async (tenantId) => {
  const { data, error } = await supabase
    .from('upzy_carritos_pendientes')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return data;
};

const getEstadisticas = async (tenantId) => {
  const { data: leads } = await supabase
    .from('upzy_leads')
    .select('segmento, etapa, score, total_gastado')
    .eq('tenant_id', tenantId)
    .eq('activo', true);

  if (!leads) return null;

  return {
    total: leads.length,
    hot: leads.filter(l => l.segmento === 'hot').length,
    warm: leads.filter(l => l.segmento === 'warm').length,
    cold: leads.filter(l => l.segmento === 'cold').length,
    por_etapa: {
      nuevo:       leads.filter(l => l.etapa === 'nuevo').length,
      contactado:  leads.filter(l => l.etapa === 'contactado').length,
      calificado:  leads.filter(l => l.etapa === 'calificado').length,
      propuesta:   leads.filter(l => l.etapa === 'propuesta').length,
      cerrado:     leads.filter(l => l.etapa === 'cerrado').length,
    },
    score_promedio: (leads.reduce((a, l) => a + l.score, 0) / leads.length).toFixed(1),
    revenue_total:  leads.reduce((a, l) => a + (l.total_gastado || 0), 0),
  };
};

// ── EXPORTS ───────────────────────────────────────────────────
module.exports = {
  upsertLead,
  addScore,
  procesarMensajeEntrante,
  procesarEventoShopify,
  detectarIntenciones,
  getLeadsPorSegmento,
  getCarritosPendientes,
  getEstadisticas,
  SCORE_RULES,
  normalizarTelefono,
};
