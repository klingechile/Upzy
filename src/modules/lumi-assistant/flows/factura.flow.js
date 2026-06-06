const sessionService = require('../services/session.service');
const auditService = require('../services/audit.service');
const responseBuilder = require('../core/response-builder');
const validator = require('../validators/factura.validator');
const dteClient = require('../integrations/dte.client');
const { parsePayloadFromText, isConfirmation } = require('../utils/text-parser');

async function start(event, command) {
  await sessionService.create(event, command.command, 'waiting_payload', { tipo_documento: 'factura' });
  await auditService.log({ event, action: 'factura_started', command: command.command, status: 'started' });
  return responseBuilder.facturaStart();
}

async function continueFlow(session, event) {
  const incomingPayload = parsePayloadFromText(event.messageText);
  const payload = { tipo_documento: 'factura', ...(session.payload_json || {}), ...incomingPayload };

  payload.descuento = Number(payload.descuento || 0);
  payload.total = Number(payload.cantidad || 0) * Number(payload.precio_unitario || 0) - Number(payload.descuento || 0);

  const validation = validator.validate(payload);
  if (!validation.valid) {
    await sessionService.update(session.id, { current_step: 'waiting_payload', payload_json: payload });
    return responseBuilder.facturaMissing(validation.missing);
  }

  if (!isConfirmation(event.messageText, true)) {
    await sessionService.update(session.id, { current_step: 'waiting_confirmation', payload_json: payload });
    return responseBuilder.facturaConfirmation(payload);
  }

  try {
    const dtePayload = {
      tipo_documento: payload.tipo_documento || 'factura',
      cliente: {
        rut: payload.rut || '66666666-6',
        razon_social: payload.razon_social || 'Consumidor final',
        nombre: payload.razon_social || 'Consumidor final',
        giro: payload.giro || 'Particular',
        direccion: payload.direccion_tributaria || 'Sin dirección',
        comuna: payload.comuna || 95,
        ciudad: payload.ciudad || 76,
        email: payload.mail_dte || payload.cliente_mail || '',
        telefono: payload.cliente_telefono || '',
      },
      productos: [{
        codigo: 'ITEM-001',
        nombre: payload.producto,
        cantidad: Number(payload.cantidad),
        precio: Number(payload.precio_unitario),
        monto: Number(payload.total),
        exento: payload.tipo_documento === 'factura_exenta',
      }],
      expects: 'pdf',
      enviar_email: false,
      origen: 'upzy_lumi_assistant',
    };

    await auditService.log({ event, action: 'dte_service_requested', command: 'factura', status: 'processing' });
    const result = await dteClient.createFactura(dtePayload);

    await sessionService.close(session.id, 'completed', {
      current_step: 'completed',
      payload_json: { ...payload, result },
    });

    await auditService.log({
      event,
      action: 'factura_emitted',
      command: 'factura',
      entityType: 'factura',
      entityId: result.folio || null,
      status: 'completed',
    });

    return responseBuilder.facturaCreated(result, payload);
  } catch (error) {
    await sessionService.update(session.id, { current_step: 'error_servicio', payload_json: payload });
    await auditService.log({ event, action: 'factura_error', command: 'factura', status: 'error', errorMessage: error.message });
    return responseBuilder.error('No pude generar la factura por un error del servicio DTE. Dejé la solicitud activa para revisión.');
  }
}

module.exports = { start, continue: continueFlow };
