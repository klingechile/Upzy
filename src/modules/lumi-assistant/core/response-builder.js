const join = (lines) => lines.filter(Boolean).join('\n');

module.exports = {
  unsupportedCommand() {
    return { text: 'Comando no soportado todavía en Lumi Assistant.' };
  },

  cotizacionStart() {
    return {
      text: join([
        'Perfecto. Crearé una cotización.',
        '',
        'Envíame los datos en formato campo: valor.',
        'Campos: nombre, mail, telefono, producto, cantidad, precio, descuento, entrega, vendedor.',
        'Regla: sin Mail no puedo generar la cotización.',
      ]),
    };
  },

  cotizacionMissing(missing) {
    return { text: `Faltan datos para generar la cotización: ${missing.join(', ')}` };
  },

  cotizacionConfirmation(payload) {
    return {
      text: join([
        'Confirma si está correcto:',
        `Cliente: ${payload.cliente_nombre || '-'}`,
        `Mail: ${payload.cliente_mail || '-'}`,
        `Producto: ${payload.producto || '-'}`,
        `Total: $${Number(payload.total || 0).toLocaleString('es-CL')}`,
        'Responde confirmar para generar la cotización.',
      ]),
    };
  },

  cotizacionCreated(result, payload) {
    return {
      text: join([
        'Cotización generada correctamente.',
        `Número: ${result.numero_cotizacion || result.numero || result.external_id || '-'}`,
        `Cliente: ${payload.cliente_nombre}`,
        `Producto: ${payload.producto}`,
        `Total: $${Number(result.total || payload.total || 0).toLocaleString('es-CL')}`,
        result.pdf_url ? `PDF: ${result.pdf_url}` : null,
      ]),
      metadata: result,
    };
  },

  facturaStart() {
    return { text: 'Perfecto. Prepararé la factura. Envía los datos en formato campo: valor.' };
  },

  facturaMissing(missing) {
    return { text: `Faltan datos para generar la factura: ${missing.join(', ')}` };
  },

  facturaConfirmation(payload) {
    return {
      text: join([
        'Confirma si está correcto:',
        `Documento: ${payload.tipo_documento || 'factura'}`,
        `Cliente: ${payload.razon_social || '-'}`,
        `Producto: ${payload.producto || '-'}`,
        `Total: $${Number(payload.total || 0).toLocaleString('es-CL')}`,
        'Responde confirmar factura para emitir.',
      ]),
    };
  },

  facturaCreated(result, payload) {
    return {
      text: join([
        'Factura generada correctamente.',
        `Folio: ${result.folio || '-'}`,
        `Cliente: ${payload.razon_social}`,
        `Total: $${Number(result.total || payload.total || 0).toLocaleString('es-CL')}`,
        result.pdf_url ? `PDF: ${result.pdf_url}` : null,
      ]),
      metadata: result,
    };
  },

  error(message) {
    return { text: message || 'Ocurrió un error procesando la solicitud.' };
  },
};
