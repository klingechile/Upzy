function validate(payload = {}) {
  const missing = [];
  const tipoDocumento = payload.tipo_documento || 'factura';

  if (!payload.estado_pago) missing.push('estado_pago');
  if (payload.estado_pago === 'pendiente') missing.push('payment_not_confirmed');

  if (['factura', 'factura_exenta'].includes(tipoDocumento)) {
    if (!payload.rut) missing.push('rut');
    if (!payload.razon_social) missing.push('razon_social');
    if (!payload.giro) missing.push('giro');
    if (!payload.direccion_tributaria) missing.push('direccion_tributaria');
    if (!payload.mail_dte && !payload.cliente_mail) missing.push('mail_dte');
  }

  if (!payload.producto) missing.push('producto');
  if (!payload.cantidad || Number(payload.cantidad) <= 0) missing.push('cantidad');
  if (!payload.precio_unitario || Number(payload.precio_unitario) <= 0) missing.push('precio_unitario');

  return { valid: missing.length === 0, missing };
}

module.exports = { validate };
