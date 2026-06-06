const quotePdfService = require('../services/quote-pdf.service');

async function createCotizacion(payload) {
  return quotePdfService.createQuotePdf({
    cliente_nombre: payload.cliente?.nombre,
    cliente_mail: payload.cliente?.mail,
    cliente_telefono: payload.cliente?.telefono,
    producto: payload.items?.[0]?.producto,
    cantidad: payload.items?.[0]?.cantidad,
    precio_unitario: payload.items?.[0]?.precio_unitario,
    descuento: payload.items?.[0]?.descuento || 0,
    tipo_entrega: payload.entrega?.tipo,
    comuna_despacho: payload.entrega?.comuna,
    vendedor: payload.vendedor,
  });
}

module.exports = { createCotizacion };
