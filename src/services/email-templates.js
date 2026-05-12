// src/services/email-templates.js
// Branding REAL Klinge: Negro #111111 + Rojo #C0392B
// 9 plantillas de conversión para el flujo completo de ventas

const supabase = require('../db/supabase');

// ── BRANDING ─────────────────────────────────────────────────
const getBranding = async (tenantId) => {
  const { data } = await supabase.from('tenants')
    .select('name,brand_color,brand_color2,logo_svg,settings')
    .eq('id', tenantId).single();

  return {
    primary:   data?.brand_color   || '#C0392B',
    secondary: data?.brand_color2  || '#111111',
    sitio:     data?.settings?.website  || 'https://www.klinge.cl',
    wa:        (data?.settings?.phone   || '56935908590').replace(/\D/g,''),
    email:     data?.settings?.email    || 'contacto@klinge.cl',
    dir:       data?.settings?.address  || 'Ñuble 1055 Of. 406, Santiago',
    nombre:    data?.name || 'Klinge',
  };
};

// ── LOGO SVG ─────────────────────────────────────────────────
const logo = (p = '#C0392B') => `
  <table cellpadding="0" cellspacing="0" border="0"><tr><td>
    <div style="display:inline-flex;align-items:center;gap:10px">
      <div style="position:relative;width:44px;height:44px;background:#000;border:2px solid #fff;display:inline-flex;align-items:center;justify-content:center;overflow:hidden">
        <span style="color:#fff;font-size:22px;font-weight:900;font-family:Arial Black,sans-serif;position:relative;z-index:1">K</span>
        <div style="position:absolute;right:2px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:9px solid transparent;border-bottom:9px solid transparent;border-left:13px solid ${p}"></div>
      </div>
      <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:3px;font-family:Arial Black,sans-serif">KLINGE</span>
    </div>
  </td></tr></table>`;

// ── HELPERS ───────────────────────────────────────────────────
const header = (b, tag = 'PANTALLAS LED · HOLOGRAMAS 3D') => `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;background:#f4f4f4}
  @media(max-width:600px){
    .wrap{width:100%!important}
    .btn{display:block!important;width:100%!important;margin:6px 0!important}
    .grid2{display:block!important;width:100%!important}
  }
</style></head>
<body style="background:#f4f4f4;padding:20px 0">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table class="wrap" width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px">
<tr><td style="background:${b.secondary};padding:20px 32px">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td>${logo(b.primary)}</td>
    <td align="right" style="color:#888;font-size:10px;letter-spacing:1px;text-transform:uppercase;vertical-align:middle">${tag}</td>
  </tr></table>
</td></tr>
<tr><td style="background:${b.primary};height:4px;font-size:0">&nbsp;</td></tr>`;

const footer = (b, unsub = '#') => `
<tr><td style="background:${b.secondary};padding:28px 32px;border-top:3px solid ${b.primary}">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="text-align:center;color:#888;font-size:11px;line-height:1.9">
    <p style="margin:0 0 5px"><strong style="color:#fff">${b.nombre}</strong> · ${b.dir}</p>
    <p style="margin:0 0 5px">
      <a href="${b.sitio}" style="color:${b.primary};text-decoration:none">${b.sitio.replace('https://','')}</a> &nbsp;·&nbsp;
      <a href="mailto:${b.email}" style="color:#888;text-decoration:none">${b.email}</a> &nbsp;·&nbsp;
      <a href="https://wa.me/${b.wa}" style="color:#888;text-decoration:none">WhatsApp</a>
    </p>
    <p style="margin:0;font-size:10px;color:#555">
      Recibiste este email porque eres contacto de ${b.nombre}. &nbsp;
      <a href="${unsub}" style="color:#555">Cancelar suscripción</a>
    </p>
  </td></tr></table>
</td></tr></table></td></tr></table></body></html>`;

const btn = (txt, url, b, outline = false) => outline
  ? `<a href="${url}" style="display:inline-block;background:transparent;color:${b.primary};border:2px solid ${b.primary};text-decoration:none;padding:12px 28px;font-size:14px;font-weight:700;font-family:Arial,sans-serif;border-radius:2px">${txt}</a>`
  : `<a href="${url}" style="display:inline-block;background:${b.primary};color:#fff;text-decoration:none;padding:13px 32px;font-size:14px;font-weight:700;font-family:Arial,sans-serif;border-radius:2px">${txt}</a>`;

const trust = () => `
<tr><td style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #eee;border-bottom:1px solid #eee">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="33%" align="center" style="font-size:11px;color:#555;padding:4px"><div style="font-size:22px;margin-bottom:5px">🚚</div><strong style="color:#111;display:block">Despacho 48h</strong>a todo Chile</td>
    <td width="1" style="background:#ddd"></td>
    <td width="33%" align="center" style="font-size:11px;color:#555;padding:4px"><div style="font-size:22px;margin-bottom:5px">🛡️</div><strong style="color:#111;display:block">Garantía 1 año</strong>incluida</td>
    <td width="1" style="background:#ddd"></td>
    <td width="33%" align="center" style="font-size:11px;color:#555;padding:4px"><div style="font-size:22px;margin-bottom:5px">⭐</div><strong style="color:#111;display:block">500+ reseñas</strong>verificadas</td>
  </tr></table>
</td></tr>`;

const clp = n => '$' + Number(n || 0).toLocaleString('es-CL');

// ═══════════════════════════════════════════════════════════════
// 1. BIENVENIDA — primer contacto
// ═══════════════════════════════════════════════════════════════
const bienvenida = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre = d.nombre?.split(' ')[0] || 'Hola';
  const asunto = `¡Bienvenido a Klinge, ${nombre}! 👋 Tu catálogo está listo`;
  const html = header(b) + `
<tr><td style="background:#111;padding:40px 32px;text-align:center">
  <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 10px;font-family:Arial Black,sans-serif">¡Hola ${nombre}! 👋</h1>
  <p style="color:#aaa;font-size:15px;margin:0;line-height:1.7">Somos especialistas en <strong style="color:#fff">pantallas LED y hologramas 3D</strong><br>para negocios en Chile. Más de <strong style="color:${b.primary}">5.000 empresas</strong> nos eligen.</p>
</td></tr>
<tr><td style="padding:28px 32px">
  <p style="font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px">Nuestros productos más vendidos</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td class="grid2" width="48%" style="background:#f8f8f8;border-top:3px solid ${b.primary};padding:16px;text-align:center;vertical-align:top">
        <div style="font-size:30px;margin-bottom:8px">📺</div>
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 4px">Panel LED 100x50cm</p>
        <p style="font-size:22px;font-weight:900;color:${b.primary};margin:0 0 6px">$149.990</p>
        <p style="font-size:10px;background:${b.primary};color:#fff;padding:2px 10px;display:inline-block;margin:0">⭐ MÁS VENDIDO</p>
      </td>
      <td width="4%"></td>
      <td class="grid2" width="48%" style="background:#f8f8f8;border-top:3px solid #333;padding:16px;text-align:center;vertical-align:top">
        <div style="font-size:30px;margin-bottom:8px">✨</div>
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 4px">Holograma 3D 65cm</p>
        <p style="font-size:22px;font-weight:900;color:#333;margin:0 0 6px">$399.990</p>
        <p style="font-size:10px;background:#333;color:#fff;padding:2px 10px;display:inline-block;margin:0">🔥 TENDENCIA 2026</p>
      </td>
    </tr>
    <tr><td colspan="3" height="12"></td></tr>
    <tr>
      <td class="grid2" width="48%" style="background:#f8f8f8;border-top:3px solid #555;padding:14px;text-align:center">
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 3px">Panel LED 60x30cm</p>
        <p style="font-size:18px;font-weight:900;color:#555;margin:0">$49.990</p>
      </td>
      <td width="4%"></td>
      <td class="grid2" width="48%" style="background:#f8f8f8;border-top:3px solid #555;padding:14px;text-align:center">
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 3px">Panel LED 150x80cm</p>
        <p style="font-size:18px;font-weight:900;color:#555;margin:0">$299.990</p>
      </td>
    </tr>
  </table>
</td></tr>
${trust()}
<tr><td style="padding:28px 32px;text-align:center;background:#fafafa">
  <p style="font-size:14px;color:#555;margin:0 0 16px">¿Quieres ver todos los modelos? Te mandamos el catálogo completo.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('Ver catálogo completo →', b.sitio + '/catalogo', b)}</td>
    <td style="padding:0 6px">${btn('💬 Cotizar por WhatsApp', 'https://wa.me/' + b.wa, b, true)}</td>
  </tr></table>
</td></tr>` + footer(b, d.unsubscribe_url);
  return { asunto, preview: 'Descubre nuestro catálogo de pantallas LED para tu negocio.', html };
};

// ═══════════════════════════════════════════════════════════════
// 2. CARRITO ABANDONADO — 1 hora
// ═══════════════════════════════════════════════════════════════
const carritoAbandonado1h = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre  = d.nombre?.split(' ')[0] || 'Hola';
  const producto = d.productos?.[0]?.title || d.producto || 'Panel LED';
  const monto   = d.monto ? clp(d.monto) : '';
  const url     = d.checkout_url || b.sitio;
  const asunto  = `${nombre}, dejaste tu carrito — ¿todo bien? 🛒`;
  const html = header(b) + `
<tr><td style="background:#111;padding:40px 32px;text-align:center">
  <div style="font-size:50px;margin-bottom:12px">🛒</div>
  <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 10px;font-family:Arial Black,sans-serif">¡Hola ${nombre}!<br>¿Olvidaste algo?</h1>
  <p style="color:#aaa;font-size:14px;margin:0;line-height:1.7">Tu <strong style="color:#fff">${producto}</strong> sigue disponible.<br>Completa tu pedido antes de que se agote stock.</p>
</td></tr>
<tr><td style="padding:24px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-left:4px solid ${b.primary}">
    <tr>
      <td width="90" style="padding:18px;text-align:center;font-size:36px">📺</td>
      <td style="padding:18px 18px 18px 0">
        <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 4px">${producto}</p>
        ${monto ? `<p style="font-size:24px;font-weight:900;color:${b.primary};margin:0 0 6px">${monto}</p>` : ''}
        <p style="font-size:12px;color:#777;margin:0">✅ Stock disponible &nbsp;·&nbsp; 🚚 Despacho 48h &nbsp;·&nbsp; 🛡️ 1 año garantía</p>
      </td>
    </tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px;text-align:center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('Finalizar mi compra →', url, b)}</td>
    <td style="padding:0 6px">${btn('💬 Tengo una duda', 'https://wa.me/' + b.wa, b, true)}</td>
  </tr></table>
</td></tr>
${trust()}` + footer(b, d.unsubscribe_url);
  return { asunto, preview: `Tu ${producto} sigue esperándote.`, html };
};

// ═══════════════════════════════════════════════════════════════
// 3. CARRITO ABANDONADO — 24h + descuento
// ═══════════════════════════════════════════════════════════════
const carritoAbandonado24h = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre  = d.nombre?.split(' ')[0] || 'Hola';
  const producto = d.productos?.[0]?.title || d.producto || 'Panel LED';
  const url     = d.checkout_url || b.sitio;
  const asunto  = `⏰ ${nombre}, última oportunidad — 10% OFF solo hoy`;
  const html = header(b) + `
<tr><td style="background:#111;padding:36px 32px;text-align:center;border-bottom:3px solid ${b.primary}">
  <div style="font-size:44px;margin-bottom:12px">⏰</div>
  <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 8px;font-family:Arial Black,sans-serif">Última oportunidad, ${nombre}</h1>
  <p style="color:#aaa;font-size:14px;margin:0">Tu <strong style="color:#fff">${producto}</strong> sigue disponible pero el stock es limitado.</p>
</td></tr>
<tr><td style="padding:24px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:2px solid ${b.primary}">
    <tr><td style="padding:22px;text-align:center">
      <p style="color:#aaa;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px">Solo por hoy — oferta exclusiva</p>
      <p style="color:#fff;font-size:36px;font-weight:900;letter-spacing:6px;font-family:'Courier New',monospace;margin:0 0 6px">VUELVE10</p>
      <p style="color:#aaa;font-size:13px;margin:0">10% de descuento en tu pedido</p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px;text-align:center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('Aplicar descuento y comprar →', url, b)}</td>
    <td style="padding:0 6px">${btn('💬 Hablar con asesor', 'https://wa.me/' + b.wa, b, true)}</td>
  </tr></table>
  <p style="font-size:11px;color:#999;margin:14px 0 0">Este código vence en 24 horas.</p>
</td></tr>
${trust()}` + footer(b, d.unsubscribe_url);
  return { asunto, preview: 'Código VUELVE10 — 10% OFF válido solo hoy.', html };
};

// ═══════════════════════════════════════════════════════════════
// 4. SEGUIMIENTO POST-COTIZACIÓN
// ═══════════════════════════════════════════════════════════════
const cotizacion = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre  = d.nombre?.split(' ')[0] || 'Cliente';
  const empresa = d.empresa || 'tu empresa';
  const monto   = d.monto ? clp(d.monto) : '$149.990';
  const folio   = d.folio || 'KLG-' + Date.now().toString().slice(-6);
  const producto = d.producto || 'Panel LED 100x50cm';
  const asunto  = `Tu cotización Klinge está lista, ${nombre} 📋 — Folio ${folio}`;
  const html = header(b, 'COTIZACIÓN OFICIAL') + `
<tr><td style="padding:32px 32px 20px">
  <h2 style="font-size:22px;font-weight:900;color:#111;margin:0 0 10px;font-family:Arial Black,sans-serif">Hola ${nombre} 👋</h2>
  <p style="font-size:14px;color:#555;line-height:1.7;margin:0">Aquí tienes el resumen de tu cotización para <strong>${empresa}</strong>. Stock confirmado y precios con IVA incluido.</p>
</td></tr>
<tr><td style="padding:0 32px 22px">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ddd">
    <tr><td colspan="2" style="background:#111;padding:13px 16px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="color:#fff;font-size:13px;font-weight:700">Detalle de cotización</td>
        <td align="right" style="color:#888;font-size:11px;font-family:'Courier New',monospace">Folio: ${folio}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:11px 16px;font-size:13px;color:#555;border-bottom:1px solid #eee">${producto}</td><td align="right" style="padding:11px 16px;font-size:13px;font-weight:700;color:#111;border-bottom:1px solid #eee">${monto}</td></tr>
    <tr><td style="padding:10px 16px;font-size:12px;color:#999;border-bottom:1px solid #eee">IVA incluido</td><td align="right" style="padding:10px 16px;font-size:12px;color:#999;border-bottom:1px solid #eee">✅</td></tr>
    <tr><td style="padding:10px 16px;font-size:12px;color:#999;border-bottom:1px solid #eee">Instalación básica</td><td align="right" style="padding:10px 16px;font-size:12px;color:#999;border-bottom:1px solid #eee">✅ Incluida</td></tr>
    <tr><td style="padding:10px 16px;font-size:12px;color:#999;border-bottom:1px solid #eee">Garantía</td><td align="right" style="padding:10px 16px;font-size:12px;color:#999;border-bottom:1px solid #eee">1 año</td></tr>
    <tr><td style="padding:14px 16px;font-size:16px;font-weight:900;color:#111">TOTAL</td><td align="right" style="padding:14px 16px;font-size:20px;font-weight:900;color:${b.primary}">${monto}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 22px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f8;border:1px solid #f5c6c6;border-left:4px solid ${b.primary}">
    <tr><td style="padding:14px 16px;font-size:13px;color:#555;text-align:center">
      ⏰ Cotización válida <strong>5 días hábiles</strong> · Stock reservado por <strong>48 horas</strong>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px;text-align:center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('✅ Confirmar cotización', 'https://wa.me/' + b.wa, b)}</td>
    <td style="padding:0 6px">${btn('💬 Hacer una pregunta', 'https://wa.me/' + b.wa, b, true)}</td>
  </tr></table>
</td></tr>
${trust()}` + footer(b, d.unsubscribe_url);
  return { asunto, preview: `Folio ${folio} — stock confirmado, válida 5 días.`, html };
};

// ═══════════════════════════════════════════════════════════════
// 5. CONFIRMACIÓN DE COMPRA
// ═══════════════════════════════════════════════════════════════
const confirmacionCompra = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre  = d.nombre?.split(' ')[0] || 'Cliente';
  const producto = d.producto || 'Panel LED';
  const monto   = d.monto ? clp(d.monto) : '';
  const ordenId = d.orden_id || '#' + Math.floor(Math.random()*9000+1000);
  const asunto  = `¡Pedido confirmado, ${nombre}! 🎉 Tu panel LED está en camino`;
  const html = header(b) + `
<tr><td style="background:#111;padding:36px 32px;text-align:center;border-bottom:4px solid ${b.primary}">
  <div style="width:64px;height:64px;background:${b.primary};border-radius:50%;margin:0 auto 14px;display:table;text-align:center;line-height:64px;font-size:28px">🎉</div>
  <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 8px;font-family:Arial Black,sans-serif">¡Pedido confirmado, ${nombre}!</h1>
  <p style="color:#aaa;font-size:14px;margin:0">Tu equipo está siendo preparado con cuidado.</p>
</td></tr>
<tr><td style="padding:28px 32px">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="36" valign="top" style="padding-top:2px"><div style="width:28px;height:28px;background:${b.primary};border-radius:50%;text-align:center;line-height:28px;font-size:14px;color:#fff;font-weight:700">✓</div></td>
      <td style="padding-left:12px;padding-bottom:18px">
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 2px">Pedido recibido</p>
        <p style="font-size:12px;color:#888;margin:0">Pago procesado exitosamente</p>
      </td>
    </tr>
    <tr>
      <td width="36" valign="top" style="padding-top:2px"><div style="width:28px;height:28px;background:#eee;border-radius:50%;text-align:center;line-height:28px;font-size:13px;color:#999;font-weight:700">2</div></td>
      <td style="padding-left:12px;padding-bottom:18px">
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 2px">En preparación — 24h</p>
        <p style="font-size:12px;color:#888;margin:0">Configurando y probando tu equipo</p>
      </td>
    </tr>
    <tr>
      <td width="36" valign="top" style="padding-top:2px"><div style="width:28px;height:28px;background:#eee;border-radius:50%;text-align:center;line-height:28px;font-size:13px;color:#999;font-weight:700">3</div></td>
      <td style="padding-left:12px">
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 2px">Despacho — 48h</p>
        <p style="font-size:12px;color:#888;margin:0">Número de seguimiento vía WhatsApp</p>
      </td>
    </tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 22px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border:1px solid #eee">
    <tr><td colspan="2" style="padding:11px 14px;background:#111;color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Resumen del pedido</td></tr>
    <tr><td style="padding:10px 14px;font-size:13px;color:#555">Producto</td><td align="right" style="padding:10px 14px;font-size:13px;font-weight:600;color:#111">${producto}</td></tr>
    ${monto ? `<tr><td style="padding:10px 14px;font-size:13px;color:#555">Total pagado</td><td align="right" style="padding:10px 14px;font-size:16px;font-weight:900;color:${b.primary}">${monto}</td></tr>` : ''}
    <tr><td style="padding:10px 14px;font-size:13px;color:#555">N° de pedido</td><td align="right" style="padding:10px 14px;font-size:13px;font-family:'Courier New',monospace;color:#111">${ordenId}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px;text-align:center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('💬 Contactar soporte', 'https://wa.me/' + b.wa, b)}</td>
    <td style="padding:0 6px">${btn('Ver más productos', b.sitio, b, true)}</td>
  </tr></table>
</td></tr>` + footer(b);
  return { asunto, preview: 'Tu pedido fue confirmado. Despacho en 48h.', html };
};

// ═══════════════════════════════════════════════════════════════
// 6. PEDIR RESEÑA — 7 días post-compra
// ═══════════════════════════════════════════════════════════════
const pedirResena = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre  = d.nombre?.split(' ')[0] || 'Cliente';
  const producto = d.producto || 'tu panel LED';
  const asunto  = `${nombre}, ¿cómo está funcionando tu panel LED? ⭐`;
  const html = header(b) + `
<tr><td style="background:#111;padding:36px 32px;text-align:center">
  <div style="font-size:48px;margin-bottom:12px">⭐</div>
  <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 10px;font-family:Arial Black,sans-serif">¿Cómo está tu ${producto}, ${nombre}?</h1>
  <p style="color:#aaa;font-size:14px;margin:0;line-height:1.7">Han pasado unos días desde tu compra. Tu opinión nos ayuda a mejorar<br>y ayuda a otros negocios a tomar la mejor decisión.</p>
</td></tr>
<tr><td style="padding:28px 32px;text-align:center">
  <p style="font-size:15px;color:#333;margin:0 0 20px;line-height:1.7">¿Estás contento con tu compra? <strong>Deja tu reseña</strong> y recibe<br><strong style="color:${b.primary}">$10.000 de descuento</strong> en tu próximo pedido.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto;background:#111;border:2px solid ${b.primary}"><tr>
    <td style="padding:16px 24px;text-align:center">
      <p style="color:#aaa;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 5px">Tu código de descuento</p>
      <p style="color:#fff;font-size:26px;font-weight:900;letter-spacing:5px;font-family:'Courier New',monospace;margin:0">RESENA10K</p>
    </td>
  </tr></table>
  <p style="font-size:11px;color:#999;margin:12px 0 20px">Válido en tu próxima compra. Sin mínimo de compra.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('⭐ Dejar mi reseña', b.sitio + '/reviews', b)}</td>
    <td style="padding:0 6px">${btn('💬 Tengo una consulta', 'https://wa.me/' + b.wa, b, true)}</td>
  </tr></table>
</td></tr>
<tr><td style="padding:0 32px 28px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-left:4px solid ${b.primary}">
    <tr><td style="padding:14px 18px;font-size:13px;color:#555;line-height:1.7">
      <strong style="color:#111">¿Tienes algún problema?</strong> Estamos aquí para ayudarte. Responde este email o escríbenos por WhatsApp — resolvemos cualquier consulta en menos de 2 horas.
    </td></tr>
  </table>
</td></tr>` + footer(b, d.unsubscribe_url);
  return { asunto, preview: 'Tu opinión vale $10.000 de descuento.', html };
};

// ═══════════════════════════════════════════════════════════════
// 7. UPSELL / PRODUCTO COMPLEMENTARIO — 30 días post-compra
// ═══════════════════════════════════════════════════════════════
const upsell = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre  = d.nombre?.split(' ')[0] || 'Cliente';
  const asunto  = `${nombre}, complementa tu panel LED con estos productos 🔥`;
  const html = header(b) + `
<tr><td style="background:#111;padding:36px 32px;text-align:center">
  <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 10px;font-family:Arial Black,sans-serif">¡Maximiza el impacto de tu negocio! 🔥</h1>
  <p style="color:#aaa;font-size:14px;margin:0;line-height:1.7">Como cliente Klinge, tienes acceso a precios exclusivos<br>en estos productos que complementan tu pantalla.</p>
</td></tr>
<tr><td style="padding:28px 32px">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td class="grid2" width="48%" style="background:#f8f8f8;border-top:3px solid ${b.primary};padding:18px;text-align:center;vertical-align:top">
        <div style="font-size:32px;margin-bottom:10px">✨</div>
        <p style="font-size:14px;font-weight:700;color:#111;margin:0 0 4px">Holograma 3D 65cm</p>
        <p style="font-size:11px;color:#888;margin:0 0 10px">Llama la atención 10x más que un panel normal</p>
        <p style="font-size:20px;font-weight:900;color:${b.primary};margin:0 0 12px">$399.990</p>
        ${btn('Ver producto', b.sitio + '/holograma', b)}
      </td>
      <td width="4%"></td>
      <td class="grid2" width="48%" style="background:#f8f8f8;border-top:3px solid #333;padding:18px;text-align:center;vertical-align:top">
        <div style="font-size:32px;margin-bottom:10px">🔹</div>
        <p style="font-size:14px;font-weight:700;color:#111;margin:0 0 4px">Panel LED 150x80cm</p>
        <p style="font-size:11px;color:#888;margin:0 0 10px">Más impacto en la entrada de tu local</p>
        <p style="font-size:20px;font-weight:900;color:#333;margin:0 0 12px">$299.990</p>
        ${btn('Ver producto', b.sitio + '/panel-grande', b, true)}
      </td>
    </tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-left:4px solid ${b.primary}">
    <tr><td style="padding:14px 18px;text-align:center">
      <p style="color:#aaa;font-size:12px;margin:0 0 4px">🎁 Precio exclusivo para clientes frecuentes</p>
      <p style="color:#fff;font-size:22px;font-weight:900;font-family:'Courier New',monospace;letter-spacing:4px;margin:0">CLIENTE15</p>
      <p style="color:#aaa;font-size:12px;margin:4px 0 0">15% de descuento en tu segunda compra</p>
    </td></tr>
  </table>
</td></tr>` + footer(b, d.unsubscribe_url);
  return { asunto, preview: 'Código CLIENTE15 — 15% OFF en tu segunda compra.', html };
};

// ═══════════════════════════════════════════════════════════════
// 8. RECUPERACIÓN DE CLIENTE FRÍO — +60 días sin comprar
// ═══════════════════════════════════════════════════════════════
const recuperacionCliente = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre      = d.nombre?.split(' ')[0] || 'Hola';
  const tipoNegocio = d.tipo_negocio || 'tu negocio';
  const asunto  = `${nombre}, tenemos novedades para ${tipoNegocio} 🔥 — Oferta especial`;
  const html = header(b) + `
<tr><td style="background:#111;padding:36px 32px;text-align:center">
  <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 10px;font-family:Arial Black,sans-serif">¡Hola ${nombre}! 👋<br>Te echamos de menos</h1>
  <p style="color:#aaa;font-size:14px;margin:0;line-height:1.7">Han pasado unos días. Tenemos novedades y precios mejorados<br>para <strong style="color:#fff">${tipoNegocio}</strong>.</p>
</td></tr>
<tr><td style="padding:24px 32px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-left:4px solid ${b.primary}">
    <tr><td style="padding:16px 20px;font-size:14px;color:#555;line-height:1.7">
      🆕 Nuevos modelos 2026 disponibles · 📉 Precios mejorados este mes · 🚀 Despacho express en Santiago · ✅ Stock confirmado
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 22px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:2px solid ${b.primary};text-align:center">
    <tr><td style="padding:22px">
      <p style="color:#aaa;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px">Oferta exclusiva para ti</p>
      <p style="color:#fff;font-size:34px;font-weight:900;letter-spacing:6px;font-family:'Courier New',monospace;margin:0 0 6px">VUELVE15</p>
      <p style="color:#aaa;font-size:13px;margin:0">15% de descuento en tu próximo pedido</p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px;text-align:center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('Ver novedades →', b.sitio + '/catalogo', b)}</td>
    <td style="padding:0 6px">${btn('💬 Hablar con ejecutivo', 'https://wa.me/' + b.wa, b, true)}</td>
  </tr></table>
</td></tr>
${trust()}` + footer(b, d.unsubscribe_url);
  return { asunto, preview: 'Código VUELVE15 — 15% OFF, solo esta semana.', html };
};

// ═══════════════════════════════════════════════════════════════
// 9. GARANTÍA / SOPORTE POST-VENTA
// ═══════════════════════════════════════════════════════════════
const garantia = async (tenantId, d = {}) => {
  const b = await getBranding(tenantId);
  const nombre  = d.nombre?.split(' ')[0] || 'Cliente';
  const asunto  = `${nombre}, tu garantía Klinge está activa 🛡️ — Aquí está todo lo que incluye`;
  const html = header(b) + `
<tr><td style="background:#111;padding:36px 32px;text-align:center;border-bottom:4px solid ${b.primary}">
  <div style="font-size:48px;margin-bottom:12px">🛡️</div>
  <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 10px;font-family:Arial Black,sans-serif">Tu garantía está activa, ${nombre}</h1>
  <p style="color:#aaa;font-size:14px;margin:0">Tienes <strong style="color:#fff">1 año de garantía</strong> y soporte técnico incluido.</p>
</td></tr>
<tr><td style="padding:28px 32px">
  <p style="font-size:13px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px">Tu garantía incluye</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${[
      ['🔧','Soporte técnico','Respuesta en menos de 2 horas hábiles'],
      ['🔄','Reemplazo de piezas','Sin costo durante el primer año'],
      ['📞','Asistencia remota','Te ayudamos a configurar y solucionar problemas'],
      ['🚚','Logística cubierta','Si hay falla, coordinamos el retiro y reenvío'],
    ].map(([i,t,d]) => `<tr>
      <td width="50" valign="top" style="padding:10px 0;font-size:28px">${i}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee">
        <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 2px">${t}</p>
        <p style="font-size:12px;color:#888;margin:0">${d}</p>
      </td>
    </tr>`).join('')}
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px;text-align:center">
  <p style="font-size:14px;color:#555;margin:0 0 16px">¿Tienes algún problema o consulta técnica?</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td style="padding:0 6px">${btn('💬 Activar soporte técnico', 'https://wa.me/' + b.wa, b)}</td>
    <td style="padding:0 6px">${btn('📧 Escribir al equipo', 'mailto:' + b.email, b, true)}</td>
  </tr></table>
</td></tr>` + footer(b);
  return { asunto, preview: '1 año de garantía + soporte técnico incluido.', html };
};

// ── RENDER DINÁMICO ───────────────────────────────────────────
const renderBranded = async (tenantId, template, datos = {}) => {
  const fn = {
    bienvenida:  bienvenida,
    carrito:     carritoAbandonado1h,
    cotizacion:  cotizacion,
    cierre:      confirmacionCompra,
    seguimiento: recuperacionCliente,
    resena:      pedirResena,
    upsell:      upsell,
    garantia:    garantia,
  }[template.categoria];
  if (fn) return fn(tenantId, datos);
  const b = await getBranding(tenantId);
  let html = template.html_body || `<p>${template.cuerpo}</p>`;
  let asunto = template.asunto || '';
  const s = {nombre:'Carlos',empresa:'Tu empresa',producto:'Panel LED 100x50cm',monto:'149990',...datos};
  Object.entries(s).forEach(([k,v])=>{html=html.replace(new RegExp(`\\[${k}\\]`,'g'),v);asunto=asunto.replace(new RegExp(`\\[${k}\\]`,'g'),v);});
  return {asunto,preview:'',html};
};

module.exports = {
  getBranding, renderBranded,
  bienvenida, carritoAbandonado1h, carritoAbandonado24h,
  cotizacion, confirmacionCompra, pedirResena,
  upsell, recuperacionCliente, garantia,
};
