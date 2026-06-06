const sessionService = require('../services/session.service');
const auditService = require('../services/audit.service');
const responseBuilder = require('../core/response-builder');
const validator = require('../validators/cotizacion.validator');
const cotizacionClient = require('../integrations/cotizacion.client');
const { parsePayloadFromText, isConfirmation } = require('../utils/text-parser');

async function start(event, command) {
  await sessionService.create(event, command.command, 'waiting_payload', {});
  await auditService.log({ event, action: 'cotizacion_started', command: command.command, status: 'started' });
  return responseBuilder.cotizacionStart();
}

async function continueFlow(session, event) {
  const incomingPayload = parsePayloadFromText(event.messageText);
  const payload = { ...(session.payload_json || {}), ...incomingPayload };

  payload.descuento = Number(payload.descuento || 0);
  payload.total = Number(payload.cantidad || 0) * Number(payload.precio_unitario || 0) - Number(payload.descuento || 0);

  const validation = validator.validate(payload);
  if (!validation.valid) {
    await sessionService.update(session.id, { current_step: 'waiting_payload', payload_json: payload });
    return responseBuilder.cotizacionMissing(validation.missing);
  }

  if (!isConfirmation(event.messageText)) {
    await sessionService.update(session.id, { current_step: 'waiting_confirmation', payload_json: payload });
    return responseBuilder.cotizacionConfirmation(payload);
  }

  try {
    const servicePayload = {
      cliente: {
        nombre: payload.cliente_nombre,
        mail: payload.cliente_mail,
        telefono: payload.cliente_telefono || null,
      },
      items: [{
        producto: payload.producto,
        cantidad: Number(payload.cantidad),
        precio_unitario: Number(payload.precio_unitario),
        descuento: Number(payload.descuento || 0),
      }],
      entrega: {
        tipo: payload.tipo_entrega,
        comuna: payload.tipo_entrega === 'despacho' ? payload.comuna_despacho : null,
      },
      vendedor: payload.vendedor || null,
      source: 'lumi_assistant',
    };

    await auditService.log({ event, action: 'cotizacion_generation_requested', command: 'cotizacion', status: 'processing' });
    const result = await cotizacionClient.createCotizacion(servicePayload);

    await sessionService.close(session.id, 'completed', {
      current_step: 'completed',
      payload_json: { ...payload, result },
    });

    await auditService.log({
      event,
      action: 'cotizacion_generated',
      command: 'cotizacion',
      entityType: 'cotizacion',
      entityId: result.numero_cotizacion || null,
      status: 'completed',
    });

    return responseBuilder.cotizacionCreated(result, payload);
  } catch (error) {
    await sessionService.update(session.id, { current_step: 'error_servicio', payload_json: payload });
    await auditService.log({ event, action: 'cotizacion_error', command: 'cotizacion', status: 'error', errorMessage: error.message });
    return responseBuilder.error('No pude generar la cotización. Dejé la solicitud activa para revisión.');
  }
}

module.exports = { start, continue: continueFlow };
