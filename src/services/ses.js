// src/services/ses.js
// AWS SES — servicio de envío de email para Upzy/Klinge

const { SESClient, SendEmailCommand, SendTemplatedEmailCommand, GetSendQuotaCommand } = require('@aws-sdk/client-ses');
const supabase = require('../db/supabase');
const config   = require('../config/env');

const sesClient = new SESClient({
  region:      config.aws.region,
  credentials: {
    accessKeyId:     config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const TENANT_ID  = config.tenantId;
const FROM_EMAIL = config.aws.sesFromEmail;
const FROM_NAME  = config.aws.sesFromName || 'Klinge';

/**
 * Envía un email HTML via SES
 */
const enviarEmail = async ({ to, subject, html, text, replyTo, headers = {} }) => {
  if (!config.aws.enabled) {
    console.warn('[SES] AWS no configurado — simulando envío a:', to);
    return { MessageId: 'sim-' + Date.now(), simulated: true };
  }

  const fromAddress = `${FROM_NAME} <${FROM_EMAIL}>`;
  const toList = Array.isArray(to) ? to : [to];

  const command = new SendEmailCommand({
    Source: fromAddress,
    Destination: { ToAddresses: toList },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html || `<p>${text || ''}</p>`, Charset: 'UTF-8' },
        ...(text ? { Text: { Data: text, Charset: 'UTF-8' } } : {}),
      },
    },
    ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
  });

  const result = await sesClient.send(command);
  return { MessageId: result.MessageId };
};

/**
 * Reemplaza variables en el cuerpo del template
 * [nombre] → Carlos, [empresa] → Restaurante El Sol, etc.
 */
const renderTemplate = (template, datos = {}) => {
  const defaults = {
    nombre:    datos.nombre    || 'estimado cliente',
    empresa:   datos.empresa   || 'tu empresa',
    producto:  datos.producto  || 'Panel LED 100x50cm',
    monto:     datos.monto     ? '$' + Number(datos.monto).toLocaleString('es-CL') : '$149.990',
    checkout_url:   datos.checkout_url   || 'https://klingecl.myshopify.com',
    unsubscribe_url: datos.unsubscribe_url || 'https://upzy-production.up.railway.app/unsubscribe',
    folio:      datos.folio    || 'KLG-' + Date.now().toString().slice(-6),
    orden_id:   datos.orden_id || '#' + Math.floor(Math.random() * 9000 + 1000),
    tipo_negocio: datos.tipo_negocio || 'negocio',
    ...datos,
  };

  let html    = template.html_body  || `<p>${template.cuerpo}</p>`;
  let asunto  = template.asunto     || '';
  let preview = template.preview_text || '';

  Object.entries(defaults).forEach(([k, v]) => {
    const regex = new RegExp(`\\[${k}\\]`, 'g');
    html    = html.replace(regex, v);
    asunto  = asunto.replace(regex, v);
    preview = preview.replace(regex, v);
  });

  return { html, asunto, preview };
};

/**
 * Envía un email de PRUEBA
 */
const enviarPrueba = async ({ templateId, destinatarios, datosEjemplo = {} }) => {
  const { data: template } = await supabase
    .from('upzy_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) throw new Error('Template no encontrado');

  const { html, asunto } = renderTemplate(template, {
    ...datosEjemplo,
    nombre:  datosEjemplo.nombre  || 'Usuario de Prueba',
    empresa: datosEjemplo.empresa || 'Empresa de Prueba',
  });

  const toList = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
  const results = [];

  for (const email of toList) {
    try {
      const r = await enviarEmail({
        to:      email,
        subject: `[PRUEBA] ${asunto}`,
        html,
      });

      // Log
      await supabase.from('upzy_email_sends').insert({
        tenant_id:   TENANT_ID,
        template_id: templateId,
        tipo:        'test',
        destinatario: email,
        asunto:      `[PRUEBA] ${asunto}`,
        estado:      'enviado',
        ses_message_id: r.MessageId,
        enviado_at:  new Date().toISOString(),
      });

      results.push({ email, ok: true, messageId: r.MessageId });
    } catch (err) {
      results.push({ email, ok: false, error: err.message });
    }
  }

  return results;
};

/**
 * Envía campaña masiva a un segmento de leads
 */
const enviarCampana = async ({ campanaId, templateId, segmento, asuntoOverride, batchSize = 10, delayMs = 1000 }) => {
  const { data: template } = await supabase
    .from('upzy_templates').select('*').eq('id', templateId).single();

  if (!template) throw new Error('Template no encontrado');

  // Obtener leads del segmento con email
  let q = supabase.from('upzy_leads').select('id,nombre,empresa,email,tipo_negocio,segmento')
    .eq('tenant_id', TENANT_ID).eq('activo', true).not('email', 'is', null);
  if (segmento && segmento !== 'todos') q = q.eq('segmento', segmento);
  const { data: leads } = await q;

  if (!leads?.length) return { enviados: 0, total: 0 };

  let enviados = 0, errores = 0;

  // Envío en lotes para no saturar SES
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);

    await Promise.allSettled(batch.map(async (lead) => {
      try {
        const { html, asunto } = renderTemplate(template, {
          nombre:       lead.nombre,
          empresa:      lead.empresa,
          tipo_negocio: lead.tipo_negocio,
          unsubscribe_url: `https://upzy-production.up.railway.app/unsubscribe?email=${lead.email}`,
        });

        const r = await enviarEmail({
          to:      lead.email,
          subject: asuntoOverride || asunto,
          html,
        });

        await supabase.from('upzy_email_sends').insert({
          tenant_id:      TENANT_ID,
          template_id:    templateId,
          campana_id:     campanaId,
          lead_id:        lead.id,
          tipo:           'campana',
          destinatario:   lead.email,
          asunto:         asuntoOverride || asunto,
          estado:         'enviado',
          ses_message_id: r.MessageId,
          enviado_at:     new Date().toISOString(),
        });

        enviados++;
      } catch (err) {
        errores++;
        await supabase.from('upzy_email_sends').insert({
          tenant_id:   TENANT_ID,
          template_id: templateId,
          campana_id:  campanaId,
          lead_id:     lead.id,
          tipo:        'campana',
          destinatario: lead.email,
          asunto:      asuntoOverride || template.asunto || '',
          estado:      'error',
          ses_error:   err.message,
        });
      }
    }));

    // Delay entre lotes para respetar los límites de SES
    if (i + batchSize < leads.length) await new Promise(r => setTimeout(r, delayMs));
  }

  // Actualizar stats de la campaña
  if (campanaId) {
    await supabase.from('upzy_campanas').update({
      estado:             'enviada',
      enviados,
      total_destinatarios: leads.length,
    }).eq('id', campanaId);
  }

  return { enviados, errores, total: leads.length };
};

/**
 * Verificar cuota SES disponible
 */
const getQuota = async () => {
  if (!config.aws.enabled) return { max24HourSend: 0, sentLast24Hours: 0, maxSendRate: 0, simulated: true };
  try {
    const r = await sesClient.send(new GetSendQuotaCommand({}));
    return { max24HourSend: r.Max24HourSend, sentLast24Hours: r.SentLast24Hours, maxSendRate: r.MaxSendRate };
  } catch (e) {
    return { error: e.message };
  }
};

module.exports = { enviarEmail, enviarPrueba, enviarCampana, renderTemplate, getQuota };
