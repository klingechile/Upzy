// src/services/automations.js
// Motor de automatizaciones estilo ManyChat
// Ejecuta flows definidos como JSON sin necesidad de código

const supabase  = require('../db/supabase');
const wa        = require('./whatsapp');
const scoring   = require('./scoring');
const templates = require('./templates');

// ── FLOWS PREDEFINIDOS ────────────────────────────────────────
// Estructura: { trigger, pasos: [{ tipo, config }] }
// Tipos de paso: mensaje, delay, condicion, accion, fin

const FLOWS_DEFAULT = {

  // ── FLOW 1: Bienvenida WhatsApp ──────────────────────────
  bienvenida_wa: {
    nombre:  'Bienvenida WhatsApp',
    trigger: 'primer_mensaje_wa',
    canal:   'whatsapp',
    pasos: [
      {
        tipo: 'mensaje',
        config: { template: 'bienvenida', delay_ms: 1000 },
      },
      {
        tipo: 'delay',
        config: { ms: 3 * 60 * 1000 }, // esperar 3 min
      },
      {
        tipo: 'condicion',
        config: {
          campo: 'total_mensajes',
          operador: 'menor_que',
          valor: 2,
          // Si no respondió → enviar catálogo
          si_true:  [{ tipo: 'mensaje', config: { template: 'catalogo' } }],
          si_false: [], // ya respondió, no hacer nada
        },
      },
    ],
  },

  // ── FLOW 2: Carrito Abandonado ───────────────────────────
  carrito_abandonado: {
    nombre:  'Recuperación Carrito Abandonado',
    trigger: 'checkout_abandoned',
    canal:   'whatsapp',
    pasos: [
      {
        tipo: 'delay',
        config: { ms: 60 * 60 * 1000 }, // 1 hora
      },
      {
        tipo: 'mensaje',
        config: { template: 'carritoAbandonado1' },
      },
      {
        tipo: 'delay',
        config: { ms: 23 * 60 * 60 * 1000 }, // 23 horas más = 24h total
      },
      {
        tipo: 'condicion',
        config: {
          campo:    'recuperacion_estado',
          operador: 'igual_a',
          valor:    'pendiente',
          si_true: [
            { tipo: 'mensaje',  config: { template: 'carritoAbandonado2' } },
            { tipo: 'accion',   config: { tipo: 'actualizar_evento', campo: 'recuperacion_estado', valor: 'wa_enviado' } },
          ],
          si_false: [],
        },
      },
    ],
  },

  // ── FLOW 3: Calificación de Lead ─────────────────────────
  calificacion_lead: {
    nombre:  'Calificación de Lead',
    trigger: 'consulta_precio',
    canal:   'whatsapp',
    pasos: [
      {
        tipo: 'mensaje',
        config: { template: 'calificacionTipoNegocio', delay_ms: 500 },
      },
      {
        tipo: 'delay',
        config: { ms: 24 * 60 * 60 * 1000 }, // esperar respuesta hasta 24h
      },
      {
        tipo: 'condicion',
        config: {
          campo:    'tipo_negocio',
          operador: 'existe',
          si_true:  [{ tipo: 'mensaje', config: { template: 'calificacionCantidad' } }],
          si_false: [{ tipo: 'mensaje', config: { template: 'followup' } }],
        },
      },
    ],
  },

  // ── FLOW 4: Follow-up Lead Frío ──────────────────────────
  followup_frio: {
    nombre:  'Follow-up Lead Frío',
    trigger: 'sin_respuesta_48h',
    canal:   'whatsapp',
    pasos: [
      {
        tipo: 'condicion',
        config: {
          campo:    'segmento',
          operador: 'igual_a',
          valor:    'warm',
          si_true: [
            { tipo: 'mensaje', config: { template: 'followup' } },
          ],
          si_false: [],
        },
      },
    ],
  },
};

// ── EJECUTAR FLOW ─────────────────────────────────────────────
/**
 * Ejecuta un flow para un lead específico.
 * Los delays se manejan con setTimeout en memoria.
 * En producción escalar con Bull/Redis o Supabase cron.
 */
const ejecutarFlow = async (tenantId, leadId, flowNombre, contexto = {}) => {
  const flow = FLOWS_DEFAULT[flowNombre];
  if (!flow) {
    console.warn(`[automations] Flow '${flowNombre}' no existe`);
    return;
  }

  console.log(`[automations] ▶ Iniciando flow '${flow.nombre}' para lead ${leadId}`);

  // Obtener lead actual
  const { data: lead } = await supabase
    .from('upzy_leads')
    .select('*')
    .eq('id', leadId)
    .eq('tenant_id', tenantId)
    .single();

  if (!lead) {
    console.warn(`[automations] Lead ${leadId} no encontrado`);
    return;
  }

  await _ejecutarPasos(tenantId, lead, flow.pasos, contexto);
};

const _ejecutarPasos = async (tenantId, lead, pasos, contexto) => {
  for (const paso of pasos) {
    // Re-fetch lead para tener datos frescos en condiciones
    const { data: leadFresh } = await supabase
      .from('upzy_leads')
      .select('*')
      .eq('id', lead.id)
      .single();

    const leadActual = leadFresh || lead;

    switch (paso.tipo) {

      case 'mensaje': {
        const { template, delay_ms, texto_directo } = paso.config;
        if (delay_ms) await _delay(delay_ms);

        let mensaje;
        if (texto_directo) {
          mensaje = texto_directo
            .replace('[nombre]',   leadActual.nombre  || '')
            .replace('[empresa]',  leadActual.empresa || '')
            .replace('[producto]', contexto.producto  || '');
        } else if (template) {
          mensaje = templates.getTemplate(template, {
            ...leadActual,
            ...contexto,
          });
        }

        if (mensaje && leadActual.telefono && leadActual.canal === 'whatsapp') {
          try {
            await wa.enviarTexto(leadActual.telefono, mensaje);
            console.log(`[automations] ✉ Mensaje enviado a ${leadActual.telefono} (template: ${template})`);
          } catch (err) {
            console.error(`[automations] Error enviando mensaje:`, err.message);
          }
        }
        break;
      }

      case 'delay': {
        const ms = paso.config.ms || 0;
        console.log(`[automations] ⏱ Delay ${Math.round(ms/60000)} min para lead ${lead.id}`);
        await _delay(ms);
        break;
      }

      case 'condicion': {
        const { campo, operador, valor, si_true = [], si_false = [] } = paso.config;
        const valorLead = leadActual[campo] ?? contexto[campo];
        const cumple    = _evaluarCondicion(valorLead, operador, valor);

        console.log(`[automations] ❓ Condición ${campo} ${operador} ${valor} → ${cumple ? 'VERDADERO' : 'FALSO'}`);

        const pasosSiguientes = cumple ? si_true : si_false;
        if (pasosSiguientes.length > 0) {
          await _ejecutarPasos(tenantId, leadActual, pasosSiguientes, contexto);
        }
        break;
      }

      case 'accion': {
        const { tipo: tipoAccion, campo, valor } = paso.config;

        if (tipoAccion === 'actualizar_lead') {
          await supabase.from('upzy_leads').update({ [campo]: valor }).eq('id', lead.id);
          console.log(`[automations] ⚡ Lead actualizado: ${campo} = ${valor}`);
        }

        if (tipoAccion === 'agregar_score') {
          await scoring.addScore(tenantId, lead.id, valor);
          console.log(`[automations] ⚡ Score agregado: ${valor}`);
        }

        if (tipoAccion === 'actualizar_evento' && contexto.evento_id) {
          await supabase.from('upzy_eventos_shopify')
            .update({ [campo]: valor })
            .eq('id', contexto.evento_id);
          console.log(`[automations] ⚡ Evento actualizado: ${campo} = ${valor}`);
        }

        if (tipoAccion === 'notificar_agente') {
          console.log(`[automations] 🔔 Notificar agente para lead ${lead.id}`);
          // TODO: integrar con Slack/email interno
        }
        break;
      }

      case 'fin':
        console.log(`[automations] ⏹ Flow terminado para lead ${lead.id}`);
        return;

      default:
        console.warn(`[automations] Tipo de paso desconocido: ${paso.tipo}`);
    }
  }
};

// ── DISPARAR FLOW POR TRIGGER ─────────────────────────────────
/**
 * Llama esto desde tus webhooks con el trigger correspondiente.
 *
 * Ejemplos:
 *   dispararPorTrigger('klinge', leadId, 'primer_mensaje_wa')
 *   dispararPorTrigger('klinge', leadId, 'checkout_abandoned', { evento_id, monto })
 *   dispararPorTrigger('klinge', leadId, 'consulta_precio')
 */
const dispararPorTrigger = async (tenantId, leadId, trigger, contexto = {}) => {
  const flows = Object.entries(FLOWS_DEFAULT)
    .filter(([, f]) => f.trigger === trigger)
    .map(([nombre]) => nombre);

  if (flows.length === 0) return;

  console.log(`[automations] 🔥 Trigger '${trigger}' → flows: ${flows.join(', ')}`);

  // Ejecutar en background para no bloquear el webhook
  for (const flowNombre of flows) {
    setImmediate(() => ejecutarFlow(tenantId, leadId, flowNombre, contexto).catch(
      err => console.error(`[automations] Error en flow ${flowNombre}:`, err.message)
    ));
  }
};

// ── HELPERS ───────────────────────────────────────────────────
const _delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const _evaluarCondicion = (valorActual, operador, valorEsperado) => {
  switch (operador) {
    case 'igual_a':      return String(valorActual) === String(valorEsperado);
    case 'distinto_de':  return String(valorActual) !== String(valorEsperado);
    case 'mayor_que':    return Number(valorActual) > Number(valorEsperado);
    case 'menor_que':    return Number(valorActual) < Number(valorEsperado);
    case 'existe':       return valorActual !== null && valorActual !== undefined && valorActual !== '';
    case 'no_existe':    return valorActual === null || valorActual === undefined || valorActual === '';
    case 'contiene':     return String(valorActual).includes(String(valorEsperado));
    default:             return false;
  }
};

// ── API: CRUD de flows personalizados (guardados en BD) ───────
const getFlows = async (tenantId) => {
  const { data } = await supabase
    .from('upzy_automatizaciones')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  return data || [];
};

module.exports = {
  FLOWS_DEFAULT,
  ejecutarFlow,
  dispararPorTrigger,
  getFlows,
};
