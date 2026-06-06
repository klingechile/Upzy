function validate(payload = {}) {
  const missing = [];
  if (!payload.cliente_nombre) missing.push('cliente_nombre');
  if (!payload.cliente_mail) missing.push('cliente_mail');
  if (!payload.producto) missing.push('producto');
  if (!payload.cantidad || Number(payload.cantidad) <= 0) missing.push('cantidad');
  if (!payload.precio_unitario || Number(payload.precio_unitario) <= 0) missing.push('precio_unitario');
  if (!payload.tipo_entrega) missing.push('tipo_entrega');
  if (payload.tipo_entrega === 'despacho' && !payload.comuna_despacho) missing.push('comuna_despacho');
  return { valid: missing.length === 0, missing };
}

module.exports = { validate };
