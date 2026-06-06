function cleanKey(key = '') {
  return String(key).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, '_');
}

const aliases = {
  nombre: 'cliente_nombre', cliente: 'cliente_nombre', mail: 'cliente_mail', email: 'cliente_mail', correo: 'cliente_mail', telefono: 'cliente_telefono',
  producto: 'producto', cantidad: 'cantidad', precio: 'precio_unitario', valor: 'precio_unitario', descuento: 'descuento', entrega: 'tipo_entrega', vendedor: 'vendedor', comuna: 'comuna_despacho',
  rut: 'rut', razon_social: 'razon_social', razon: 'razon_social', giro: 'giro', direccion: 'direccion_tributaria', ciudad: 'ciudad', mail_dte: 'mail_dte', documento: 'tipo_documento', pago: 'estado_pago', estado_pago: 'estado_pago', medio_pago: 'medio_pago'
};

function money(value) {
  const clean = String(value || '').replace(/[^0-9-]/g, '');
  return clean ? Number(clean) : 0;
}

function parsePayloadFromText(text = '') {
  const payload = {};
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.includes(':')) continue;
    const [rawKey, ...rest] = line.split(':');
    const key = aliases[cleanKey(rawKey)] || cleanKey(rawKey);
    const value = rest.join(':').trim();
    if (!value) continue;
    payload[key] = value;
  }

  if (payload.cantidad) payload.cantidad = Number(String(payload.cantidad).replace(/[^0-9.]/g, ''));
  if (payload.precio_unitario) payload.precio_unitario = money(payload.precio_unitario);
  if (payload.descuento) payload.descuento = money(payload.descuento);

  if (payload.tipo_entrega) {
    const value = String(payload.tipo_entrega).toLowerCase();
    payload.tipo_entrega = value.includes('desp') ? 'despacho' : 'retiro';
  }

  if (payload.tipo_documento) {
    const value = String(payload.tipo_documento).toLowerCase();
    if (value.includes('exenta')) payload.tipo_documento = 'factura_exenta';
    else if (value.includes('boleta')) payload.tipo_documento = 'boleta';
    else payload.tipo_documento = 'factura';
  }

  if (payload.estado_pago) {
    const value = String(payload.estado_pago).toLowerCase();
    if (value.includes('abon')) payload.estado_pago = 'abonado';
    else if (value.includes('autor')) payload.estado_pago = 'autorizado';
    else if (value.includes('pend')) payload.estado_pago = 'pendiente';
    else payload.estado_pago = 'pagado';
  }

  return payload;
}

function isConfirmation(text = '', invoice = false) {
  const value = String(text).trim().toLowerCase();
  return invoice ? ['confirmar factura', 'emitir factura', 'emitir'].includes(value) : ['confirmar', 'ok', 'si', 'sí'].includes(value);
}

module.exports = { parsePayloadFromText, isConfirmation };
