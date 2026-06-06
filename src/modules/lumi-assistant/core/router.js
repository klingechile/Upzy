const commandParser = require('./command-parser');
const responseBuilder = require('./response-builder');
const authorizationService = require('../services/authorization.service');
const sessionService = require('../services/session.service');
const auditService = require('../services/audit.service');
const cotizacionFlow = require('../flows/cotizacion.flow');
const facturaFlow = require('../flows/factura.flow');

async function handle(event) {
  const command = commandParser.parse(event.messageText);
  const activeSession = await sessionService.findActive(event);

  if (!command.isCommand && !activeSession) {
    return null;
  }

  const authorization = await authorizationService.validate(event);

  if (!authorization.authorized) {
    await auditService.log({
      event,
      action: 'assistant_unauthorized_channel',
      command: command.command,
      status: 'blocked',
      errorMessage: authorization.reason,
    });

    return null;
  }

  await auditService.log({
    event,
    action: 'assistant_command_received',
    command: command.command || activeSession?.command,
    status: 'received',
    requestPayload: { messageText: event.messageText },
  });

  if (String(event.messageText).trim().toLowerCase() === 'cancelar' && activeSession) {
    await sessionService.close(activeSession.id, 'cancelled');
    return { text: 'Flujo cancelado correctamente.' };
  }

  if (activeSession) {
    if (activeSession.command === 'cotizacion') return cotizacionFlow.continue(activeSession, event);
    if (activeSession.command === 'factura') return facturaFlow.continue(activeSession, event);
  }

  if (command.command === 'cotizacion') return cotizacionFlow.start(event, command);
  if (command.command === 'factura') return facturaFlow.start(event, command);

  return responseBuilder.unsupportedCommand();
}

module.exports = { handle };
