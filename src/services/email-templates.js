// src/services/email-templates.js
// Templates HTML con branding real de Klinge
// Negro #111111 · Rojo #C0392B · Blanco #FFFFFF
// Logo SVG inline — personalizable desde tenant.logo_svg

const supabase = require('../db/supabase');

// ── LOGO SVG KLINGE (inline, sin dependencia de CDN) ─────────
const LOGO_KLINGE_SVG = `
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:0">
      <div style="display:inline-flex;align-items:center;gap:10px">
        <div style="width:44px;height:44px;background:#111111;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
          <span style="color:#FFFFFF;font-size:22px;font-weight:900;font-family:Arial Black,Arial,sans-serif;line-height:1">K</span>
          <div style="position:absolute;right:3px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:8px solid transparent;border-bottom:8px solid transparent;border-left:11px solid #C0392B"></div>
        </div>
        <span style="color:#FFFFFF;font-size:22px;font-weight:900;letter-spacing:3px;font-family:Arial Black,Arial,sans-serif">KLINGE</span>
      </div>
    </td>
  </tr>
</table>`;

// ── OBTENER BRANDING DEL TENANT ───────────────────────────────
const getBranding = async (tenantId) => {
  const { data } = await supabase
    .from('tenants')
    .select('name, logo_url, logo_svg, brand_color, brand_color2, settings')
    .eq('id', tenantId)
    .single();

  const primary   = data?.brand_color  || '#C0392B';
  const secondary = data?.brand_color2 || '#111111';
  const logoHtml  = data?.logo_svg || LOGO_KLINGE_SVG;
  const sitio     = data?.settings?.website || 'https://www.klinge.cl';
  const whatsapp  = data?.settings?.phone?.replace(/\D/g,'') || '56935908590';
  const email     = data?.settings?.email || 'contacto@klinge.cl';
  const direccion = data?.settings?.address || 'Ñuble 1055 Of. 406, Santiago';
  const nombre    = data?.name || 'Klinge';

  return { primary, secondary, logoHtml, sitio, whatsapp, email, direccion, nombre };
};

// ── HELPER: HEADER COMPARTIDO ─────────────────────────────────
const htmlHeader = (b, tagline = 'PANTALLAS LED · HOLOGRAMAS 3D') => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${b.nombre}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif}
  table{border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt}
  td{padding:0}
  img{border:0;outline:none;text-decoration:none;display:block}
  .btn-primary{background:${b.primary}!important}
  @media only screen and (max-width:600px){
    .wrap{width:100%!important}
    .btn{display:block!important;width:100%!important;box-sizing:border-box!important}
    .col2{width:100%!important;display:block!important}
    .hide-mobile{display:none!important}
    .pad-mobile{padding:20px!important}
  }
</style>
</head>
<body style="margin:0;padding:20px 0;background:#f4f4f4">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<table class="wrap" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px">

<!-- HEADER -->
<tr>
  <td style="background:${b.secondary};padding:20px 32px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>${b.logoHtml}</td>
        <td align="right" style="color:#888888;font-size:11px;letter-spacing:1px;text-transform:uppercase;vertical-align:middle">${tagline}</td>
      </tr>
    </table>
  </td>
</tr>
<!-- BANDA ROJA -->
<tr><td style="background:${b.primary};height:4px;font-size:0;line-height:0">&nbsp;</td></tr>`;

// ── HELPER: FOOTER COMPARTIDO ─────────────────────────────────
const htmlFooter = (b, unsubUrl = '#') => `
<!-- FOOTER -->
<tr>
  <td style="background:${b.secondary};padding:28px 32px;border-top:4px solid ${b.primary}">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="color:#888888;font-size:11px;line-height:1.8;text-align:center">
          <p style="margin:0 0 6px">${b.nombre} · ${b.direccion}</p>
          <p style="margin:0 0 6px">
            <a href="${b.sitio}" style="color:${b.primary};text-decoration:none">${b.sitio.replace('https://','')}</a>
            &nbsp;·&nbsp;
            <a href="mailto:${b.email}" style="color:#888888;text-decoration:none">${b.email}</a>
            &nbsp;·&nbsp;
            <a href="https://wa.me/${b.whatsapp}" style="color:#888888;text-decoration:none">WhatsApp</a>
          </p>
          <p style="margin:0;font-size:10px;color:#666666">
            Recibiste este email porque eres cliente o contacto de ${b.nombre}.
            <a href="${unsubUrl}" style="color:#666666">Cancelar suscripción</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>

</table>
</td></tr></table>
</body>
</html>`;

// ── BOTÓN CTA ─────────────────────────────────────────────────
const btnPrimary = (texto, url, b) =>
  `<a href="${url}" class="btn" style="display:inline-block;background:${b.primary};color:#ffffff;text-decoration:none;padding:14px 32px;font-size:15px;font-weight:700;letter-spacing:.5px;font-family:Arial,sans-serif;border-radius:3px">${texto}</a>`;

const btnSecondary = (texto, url, b) =>
  `<a href="${url}" class="btn" style="display:inline-block;background:transparent;color:${b.primary};text-decoration:none;padding:13px 30px;font-size:14px;font-weight:700;border:2px solid ${b.primary};border-radius:3px;font-family:Arial,sans-serif">${texto}</a>`;

// ── TRUST BAR ─────────────────────────────────────────────────
const trustBar = (b) => `
<tr>
  <td style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #eeeeee;border-bottom:1px solid #eeeeee">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" align="center" style="font-size:11px;color:#666666;padding:4px">
          <div style="font-size:20px;margin-bottom:4px">🚚</div>
          <strong style="color:#333333">Despacho 48h</strong><br>a todo Chile
        </td>
        <td width="33%" align="center" style="font-size:11px;color:#666666;padding:4px;border-left:1px solid #dddddd;border-right:1px solid #dddddd">
          <div style="font-size:20px;margin-bottom:4px">🛡️</div>
          <strong style="color:#333333">Garantía 1 año</strong><br>incluida
        </td>
        <td width="33%" align="center" style="font-size:11px;color:#666666;padding:4px">
          <div style="font-size:20px;margin-bottom:4px">⭐</div>
          <strong style="color:#333333">500+ reseñas</strong><br>verificadas
        </td>
      </tr>
    </table>
  </td>
</tr>`;

// ═══════════════════════════════════════════════════════════════
// PLANTILLA 1 — CARRITO ABANDONADO
// ═══════════════════════════════════════════════════════════════
const carritoAbandonado = async (tenantId, datos = {}) => {
  const b = await getBranding(tenantId);
  const nombre   = datos.nombre?.split(' ')[0] || 'Hola';
  const producto = datos.productos?.[0]?.title || datos.producto || 'Panel LED';
  const monto    = datos.monto ? `$${Number(datos.monto).toLocaleString('es-CL')}` : '';
  const url      = datos.checkout_url || b.sitio;
  const unsubUrl = datos.unsubscribe_url || `${b.sitio}/unsubscribe`;

  const asunto   = `${nombre}, dejaste algo especial en tu carrito 🛒`;
  const preview  = `Tu ${producto} sigue disponible. Completa tu compra hoy.`;

  const html = htmlHeader(b) + `

<!-- HERO -->
<tr>
  <td style="background:#111111;padding:40px 32px 32px;text-align:center">
    <p style="margin:0 0 8px;font-size:40px;line-height:1">🛒</p>
    <h1 style="margin:0 0 10px;color:#ffffff;font-size:26px;font-weight:900;font-family:Arial Black,Arial,sans-serif;line-height:1.2">¡Hola ${nombre}, olvidaste algo!</h1>
    <p style="margin:0;color:#aaaaaa;font-size:15px;line-height:1.6">Tu <strong style="color:#ffffff">${producto}</strong> sigue disponible.<br>Completa tu compra antes de que se agote el stock.</p>
  </td>
</tr>

<!-- PRODUCTO -->
<tr>
  <td style="padding:24px 32px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border:1px solid #eeeeee;border-left:4px solid ${b.primary}">
      <tr>
        <td style="padding:20px;text-align:center" width="100">
          <div style="width:80px;height:80px;background:#111111;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:36px">📺</div>
        </td>
        <td style="padding:20px 20px 20px 0">
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111111">${producto}</p>
          ${monto ? `<p style="margin:0 0 6px;font-size:24px;font-weight:900;color:${b.primary}">${monto}</p>` : ''}
          <p style="margin:0;font-size:12px;color:#666666">✅ Stock disponible &nbsp;·&nbsp; 🚚 Despacho 48h &nbsp;·&nbsp; 🛡️ Garantía 1 año</p>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- DESCUENTO -->
<tr>
  <td style="padding:0 32px 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:2px solid ${b.primary}">
      <tr>
        <td style="padding:20px;text-align:center">
          <p style="margin:0 0 6px;color:#aaaaaa;font-size:12px;text-transform:uppercase;letter-spacing:2px">Solo por las próximas 24 horas</p>
          <p style="margin:0 0 6px;color:#ffffff;font-size:32px;font-weight:900;letter-spacing:6px;font-family:'Courier New',monospace">VUELVE10</p>
          <p style="margin:0;color:#aaaaaa;font-size:13px">10% de descuento en tu pedido</p>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- CTA -->
<tr>
  <td style="padding:0 32px 32px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 6px">${btnPrimary('Finalizar mi compra →', url, b)}</td>
        <td style="padding:0 6px">${btnSecondary('💬 Hablar con asesor', `https://wa.me/${b.whatsapp}`, b)}</td>
      </tr>
    </table>
  </td>
</tr>
${trustBar(b)}
` + htmlFooter(b, unsubUrl);

  return { asunto, preview, html };
};

// ═══════════════════════════════════════════════════════════════
// PLANTILLA 2 — BIENVENIDA
// ═══════════════════════════════════════════════════════════════
const bienvenida = async (tenantId, datos = {}) => {
  const b = await getBranding(tenantId);
  const nombre   = datos.nombre?.split(' ')[0] || 'Bienvenido';
  const unsubUrl = datos.unsubscribe_url || `${b.sitio}/unsubscribe`;

  const asunto  = `Bienvenido a Klinge, ${nombre} 👋`;
  const preview = 'Gracias por contactarnos. Descubre nuestro catálogo de pantallas LED.';

  const html = htmlHeader(b) + `

<!-- HERO -->
<tr>
  <td style="background:#111111;padding:40px 32px;text-align:center">
    <h1 style="margin:0 0 10px;color:#ffffff;font-size:28px;font-weight:900;font-family:Arial Black,Arial,sans-serif">¡Hola ${nombre}! 👋</h1>
    <p style="margin:0;color:#aaaaaa;font-size:15px;line-height:1.7">Somos especialistas en <strong style="color:#ffffff">pantallas LED y hologramas 3D</strong><br>para negocios en Chile. Más de <strong style="color:${b.primary}">5.000 empresas</strong> confían en nosotros.</p>
  </td>
</tr>

<!-- PRODUCTOS GRID -->
<tr>
  <td style="padding:28px 32px">
    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#111111;text-transform:uppercase;letter-spacing:1px">Nuestros productos más vendidos</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="background:#f8f8f8;border-top:3px solid ${b.primary};padding:16px;text-align:center;vertical-align:top">
          <div style="font-size:28px;margin-bottom:8px">📺</div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#111111">Panel LED 100x50cm</p>
          <p style="margin:0 0 6px;font-size:20px;font-weight:900;color:${b.primary}">$149.990</p>
          <p style="margin:0;font-size:10px;background:${b.primary};color:#fff;padding:2px 8px;display:inline-block">⭐ MÁS VENDIDO</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#f8f8f8;border-top:3px solid #333333;padding:16px;text-align:center;vertical-align:top">
          <div style="font-size:28px;margin-bottom:8px">✨</div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#111111">Holograma 3D 65cm</p>
          <p style="margin:0 0 6px;font-size:20px;font-weight:900;color:#333333">$399.990</p>
          <p style="margin:0;font-size:10px;background:#333333;color:#fff;padding:2px 8px;display:inline-block">🔥 TENDENCIA</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
      <tr>
        <td width="48%" style="background:#f8f8f8;border-top:3px solid #555555;padding:14px;text-align:center;vertical-align:top">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#111111">Panel LED 60x30cm</p>
          <p style="margin:0;font-size:18px;font-weight:900;color:#555555">$49.990</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#f8f8f8;border-top:3px solid #555555;padding:14px;text-align:center;vertical-align:top">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#111111">Panel LED 150x80cm</p>
          <p style="margin:0;font-size:18px;font-weight:900;color:#555555">$299.990</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
${trustBar(b)}

<!-- CTA -->
<tr>
  <td style="padding:28px 32px;text-align:center;background:#f8f8f8">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 6px">${btnPrimary('Ver catálogo completo →', `${b.sitio}/catalogo`, b)}</td>
        <td style="padding:0 6px">${btnSecondary('💬 Cotizar por WhatsApp', `https://wa.me/${b.whatsapp}`, b)}</td>
      </tr>
    </table>
  </td>
</tr>
` + htmlFooter(b, unsubUrl);

  return { asunto, preview, html };
};

// ═══════════════════════════════════════════════════════════════
// PLANTILLA 3 — COTIZACIÓN / SEGUIMIENTO
// ═══════════════════════════════════════════════════════════════
const cotizacion = async (tenantId, datos = {}) => {
  const b = await getBranding(tenantId);
  const nombre   = datos.nombre?.split(' ')[0] || 'Cliente';
  const empresa  = datos.empresa || 'tu empresa';
  const producto = datos.producto || 'Panel LED 100x50cm';
  const monto    = datos.monto ? `$${Number(datos.monto).toLocaleString('es-CL')}` : '$149.990';
  const folio    = datos.folio || 'KLG-' + Date.now().toString().slice(-6);
  const unsubUrl = datos.unsubscribe_url || `${b.sitio}/unsubscribe`;

  const asunto  = `Tu cotización Klinge está lista, ${nombre} 📋`;
  const preview = `Revisamos tu solicitud para ${empresa}. Aquí están los detalles.`;

  const html = htmlHeader(b, 'COTIZACIÓN OFICIAL') + `

<!-- INTRO -->
<tr>
  <td style="padding:32px 32px 20px">
    <h2 style="margin:0 0 10px;color:#111111;font-size:22px;font-weight:900">Hola ${nombre} 👋</h2>
    <p style="margin:0;color:#555555;font-size:14px;line-height:1.7">Gracias por tu interés en nuestros productos. Aquí tienes el resumen de tu cotización para <strong>${empresa}</strong>.</p>
  </td>
</tr>

<!-- COTIZACIÓN -->
<tr>
  <td style="padding:0 32px 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dddddd">
      <!-- Header tabla -->
      <tr>
        <td colspan="2" style="background:${b.secondary};padding:14px 18px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#ffffff;font-size:13px;font-weight:700">Detalle de cotización</td>
              <td align="right" style="color:#aaaaaa;font-size:11px;font-family:'Courier New',monospace">Folio: ${folio}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding:12px 18px;border-bottom:1px solid #eeeeee;font-size:13px;color:#555555">${producto}</td><td align="right" style="padding:12px 18px;border-bottom:1px solid #eeeeee;font-size:13px;font-weight:700;color:#111111">${monto}</td></tr>
      <tr><td style="padding:10px 18px;border-bottom:1px solid #eeeeee;font-size:12px;color:#888888">IVA incluido</td><td align="right" style="padding:10px 18px;border-bottom:1px solid #eeeeee;font-size:12px;color:#888888">✅</td></tr>
      <tr><td style="padding:10px 18px;border-bottom:1px solid #eeeeee;font-size:12px;color:#888888">Instalación básica</td><td align="right" style="padding:10px 18px;border-bottom:1px solid #eeeeee;font-size:12px;color:#888888">✅ Incluida</td></tr>
      <tr><td style="padding:10px 18px;border-bottom:1px solid #eeeeee;font-size:12px;color:#888888">Garantía</td><td align="right" style="padding:10px 18px;border-bottom:1px solid #eeeeee;font-size:12px;color:#888888">1 año</td></tr>
      <tr><td style="padding:14px 18px;font-size:15px;font-weight:900;color:#111111">TOTAL</td><td align="right" style="padding:14px 18px;font-size:20px;font-weight:900;color:${b.primary}">${monto}</td></tr>
    </table>
  </td>
</tr>

<!-- URGENCIA -->
<tr>
  <td style="padding:0 32px 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f8;border:1px solid #f5c6c6;border-left:4px solid ${b.primary}">
      <tr><td style="padding:16px 18px;font-size:13px;color:#555555;text-align:center">
        ⏰ Esta cotización es válida por <strong>5 días hábiles</strong>.<br>
        Stock limitado — te reservamos los equipos por 48 horas.
      </td></tr>
    </table>
  </td>
</tr>

<!-- CTA -->
<tr>
  <td style="padding:0 32px 32px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 6px">${btnPrimary('✅ Confirmar cotización', `https://wa.me/${b.whatsapp}`, b)}</td>
        <td style="padding:0 6px">${btnSecondary('💬 Hacer una pregunta', `https://wa.me/${b.whatsapp}`, b)}</td>
      </tr>
    </table>
  </td>
</tr>
${trustBar(b)}
` + htmlFooter(b, unsubUrl);

  return { asunto, preview, html };
};

// ═══════════════════════════════════════════════════════════════
// PLANTILLA 4 — CONFIRMACIÓN DE COMPRA
// ═══════════════════════════════════════════════════════════════
const confirmacionCompra = async (tenantId, datos = {}) => {
  const b = await getBranding(tenantId);
  const nombre   = datos.nombre?.split(' ')[0] || 'Cliente';
  const producto = datos.producto || 'Panel LED';
  const monto    = datos.monto ? `$${Number(datos.monto).toLocaleString('es-CL')}` : '';
  const ordenId  = datos.orden_id || '#' + Math.floor(Math.random() * 9000 + 1000);

  const asunto  = `¡Tu pedido está confirmado, ${nombre}! 🎉`;
  const preview = `Gracias por tu compra. Tu equipo Klinge está siendo preparado.`;

  const html = htmlHeader(b) + `

<!-- HERO VERDE/CONFIRMACIÓN -->
<tr>
  <td style="background:#111111;padding:36px 32px;text-align:center;border-bottom:4px solid ${b.primary}">
    <div style="width:64px;height:64px;background:${b.primary};border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:64px">🎉</div>
    <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:900;font-family:Arial Black,Arial,sans-serif">¡Pedido confirmado, ${nombre}!</h1>
    <p style="margin:0;color:#aaaaaa;font-size:14px">Tu equipo Klinge está siendo preparado con cuidado.</p>
  </td>
</tr>

<!-- TIMELINE -->
<tr>
  <td style="padding:28px 32px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="32" style="vertical-align:top;padding-top:2px">
          <div style="width:28px;height:28px;background:${b.primary};border-radius:50%;text-align:center;line-height:28px;font-size:13px;color:#ffffff;font-weight:700">✓</div>
        </td>
        <td style="padding-left:12px;padding-bottom:20px;border-left:2px solid #eeeeee;margin-left:14px">
          <div style="padding-left:12px">
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#111111">Pedido recibido</p>
            <p style="margin:0;font-size:12px;color:#888888">Tu pago fue procesado exitosamente</p>
          </div>
        </td>
      </tr>
      <tr>
        <td width="32" style="vertical-align:top;padding-top:2px">
          <div style="width:28px;height:28px;background:#eeeeee;border-radius:50%;text-align:center;line-height:28px;font-size:13px;color:#888888;font-weight:700">2</div>
        </td>
        <td style="padding-left:12px;padding-bottom:20px">
          <div style="padding-left:12px">
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#111111">En preparación (24h)</p>
            <p style="margin:0;font-size:12px;color:#888888">Estamos configurando y probando tu equipo</p>
          </div>
        </td>
      </tr>
      <tr>
        <td width="32" style="vertical-align:top;padding-top:2px">
          <div style="width:28px;height:28px;background:#eeeeee;border-radius:50%;text-align:center;line-height:28px;font-size:13px;color:#888888;font-weight:700">3</div>
        </td>
        <td style="padding-left:12px">
          <div style="padding-left:12px">
            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#111111">En camino (48h)</p>
            <p style="margin:0;font-size:12px;color:#888888">Te enviamos número de seguimiento por WhatsApp</p>
          </div>
        </td>
      </tr>
    </table>
  </td>
</tr>

<!-- RESUMEN PEDIDO -->
<tr>
  <td style="padding:0 32px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border:1px solid #eeeeee">
      <tr><td colspan="2" style="padding:12px 16px;background:#111111;color:#ffffff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Resumen del pedido</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#555555">Producto</td><td align="right" style="padding:10px 16px;font-size:13px;font-weight:600;color:#111111">${producto}</td></tr>
      ${monto ? `<tr><td style="padding:10px 16px;font-size:13px;color:#555555">Total pagado</td><td align="right" style="padding:10px 16px;font-size:16px;font-weight:900;color:${b.primary}">${monto}</td></tr>` : ''}
      <tr><td style="padding:10px 16px;font-size:13px;color:#555555">N° de pedido</td><td align="right" style="padding:10px 16px;font-size:13px;font-family:'Courier New',monospace;color:#111111">${ordenId}</td></tr>
    </table>
  </td>
</tr>

<!-- CTA -->
<tr>
  <td style="padding:0 32px 32px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 6px">${btnPrimary('💬 Contactar soporte', `https://wa.me/${b.whatsapp}`, b)}</td>
        <td style="padding:0 6px">${btnSecondary('Ver más productos', b.sitio, b)}</td>
      </tr>
    </table>
  </td>
</tr>
` + htmlFooter(b);
  return { asunto, preview, html };
};

// ═══════════════════════════════════════════════════════════════
// PLANTILLA 5 — RECUPERACIÓN DE CLIENTE
// ═══════════════════════════════════════════════════════════════
const recuperacionCliente = async (tenantId, datos = {}) => {
  const b = await getBranding(tenantId);
  const nombre      = datos.nombre?.split(' ')[0] || 'Hola';
  const empresa     = datos.empresa || 'tu negocio';
  const tipoNegocio = datos.tipo_negocio || 'negocio';
  const unsubUrl    = datos.unsubscribe_url || `${b.sitio}/unsubscribe`;

  const asunto  = `${nombre}, ¿sigues buscando pantallas LED para tu negocio? 🔥`;
  const preview = `Han pasado unos días. Tenemos novedades y una oferta especial para ti.`;

  const html = htmlHeader(b) + `

<!-- HERO -->
<tr>
  <td style="background:#111111;padding:36px 32px;text-align:center">
    <h1 style="margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:900;font-family:Arial Black,Arial,sans-serif">¡Hola ${nombre}!<br>Te echamos de menos 👋</h1>
    <p style="margin:0;color:#aaaaaa;font-size:14px;line-height:1.7">Han pasado unos días desde tu contacto con ${b.nombre}.<br>Tenemos novedades perfectas para <strong style="color:#ffffff">${tipoNegocio === 'negocio' ? empresa : tipoNegocio}</strong>.</p>
  </td>
</tr>

<!-- MENSAJE PERSONALIZADO -->
<tr>
  <td style="padding:24px 32px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid ${b.primary};background:#f8f8f8">
      <tr><td style="padding:16px 20px;font-size:14px;color:#555555;line-height:1.7">
        Los precios de nuestros paneles LED han mejorado este mes. Nuevos modelos disponibles para ${tipoNegocio} — más brillo, mayor duración y mejor resolución que antes. 📺
      </td></tr>
    </table>
  </td>
</tr>

<!-- OFERTA EXCLUSIVA -->
<tr>
  <td style="padding:0 32px 24px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:2px solid ${b.primary};text-align:center">
      <tr><td style="padding:24px">
        <p style="margin:0 0 6px;color:#aaaaaa;font-size:12px;text-transform:uppercase;letter-spacing:2px">Oferta exclusiva para ti</p>
        <p style="margin:0 0 8px;color:#ffffff;font-size:14px">Como cliente anterior, te damos:</p>
        <p style="margin:0 0 8px;color:${b.primary};font-size:36px;font-weight:900;letter-spacing:6px;font-family:'Courier New',monospace">VUELVE15</p>
        <p style="margin:0;color:#aaaaaa;font-size:13px">15% de descuento en tu próximo pedido</p>
      </td></tr>
    </table>
  </td>
</tr>

<!-- CTA -->
<tr>
  <td style="padding:0 32px 32px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="padding:0 6px">${btnPrimary('Ver novedades →', `${b.sitio}/catalogo`, b)}</td>
        <td style="padding:0 6px">${btnSecondary('💬 Hablar con ejecutivo', `https://wa.me/${b.whatsapp}`, b)}</td>
      </tr>
    </table>
  </td>
</tr>
${trustBar(b)}
` + htmlFooter(b, unsubUrl);

  return { asunto, preview, html };
};

// ═══════════════════════════════════════════════════════════════
// RENDER DINÁMICO — dado template_id, genera HTML con datos
// ═══════════════════════════════════════════════════════════════
const renderBranded = async (tenantId, template, datos = {}) => {
  // Si tiene html_body guardado, usarlo pero reemplazar variables
  // Si es una de las categorías conocidas, generar dinámicamente
  const catMap = {
    carrito:     carritoAbandonado,
    bienvenida:  bienvenida,
    cotizacion:  cotizacion,
    cierre:      confirmacionCompra,
    seguimiento: recuperacionCliente,
  };

  const fn = catMap[template.categoria];
  if (fn) return fn(tenantId, datos);

  // Fallback: usar el html_body guardado con variables reemplazadas
  const b = await getBranding(tenantId);
  let html = template.html_body || `<p>${template.cuerpo}</p>`;
  let asunto = template.asunto || '';
  const sample = {
    nombre: datos.nombre || 'Carlos',
    empresa: datos.empresa || 'Tu empresa',
    producto: datos.producto || 'Panel LED 100x50cm',
    monto: datos.monto ? `$${Number(datos.monto).toLocaleString('es-CL')}` : '$149.990',
    ...datos,
  };
  Object.entries(sample).forEach(([k, v]) => {
    html   = html.replace(new RegExp(`\\[${k}\\]`, 'g'), v);
    asunto = asunto.replace(new RegExp(`\\[${k}\\]`, 'g'), v);
  });
  return { asunto, preview: template.preview_text || '', html };
};

module.exports = {
  getBranding,
  carritoAbandonado,
  bienvenida,
  cotizacion,
  confirmacionCompra,
  recuperacionCliente,
  renderBranded,
  LOGO_KLINGE_SVG,
};
