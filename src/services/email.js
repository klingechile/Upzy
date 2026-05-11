// src/services/email.js
// Servicio de email usando Resend (EMAIL_FROM ya existe en Railway)
// Para campañas y recuperación de carritos

const axios  = require('axios');
const config = require('../config/env');

const RESEND_URL = 'https://api.resend.com/emails';

/**
 * Envía email transaccional via Resend
 */
const enviarEmail = async ({ to, subject, html, text }) => {
  if (!config.email.enabled) {
    console.warn('[email] EMAIL_FROM no configurado — email no enviado');
    return null;
  }

  const res = await axios.post(RESEND_URL, {
    from:    config.email.from,
    to:      Array.isArray(to) ? to : [to],
    subject,
    html:    html || `<p>${text}</p>`,
    text,
  }, {
    headers: {
      Authorization:  `Bearer ${config.email.resendKey || ''}`,
      'Content-Type': 'application/json',
    },
  });

  return res.data;
};

// ── TEMPLATES EMAIL ───────────────────────────────────────────

const emailCarritoAbandonado = ({ nombre, productos, monto, checkout_url }) => {
  const producto = productos?.[0]?.title || 'tu producto';
  const precio   = monto ? `$${Number(monto).toLocaleString('es-CL')}` : '';

  return {
    subject: `${nombre?.split(' ')[0] || 'Hola'}, olvidaste algo en Klinge 🛒`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    
    <!-- Header -->
    <div style="background:#1a1a2e;padding:32px;text-align:center">
      <h1 style="color:#00d97e;margin:0;font-size:28px">KLINGE</h1>
      <p style="color:#888;margin:8px 0 0">Pantallas LED para tu negocio</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <h2 style="color:#1a1a2e;margin:0 0 16px">
        ¡Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}! 👋
      </h2>
      <p style="color:#555;line-height:1.6">
        Notamos que dejaste <strong>${producto}</strong>${precio ? ` (${precio})` : ''} en tu carrito.
        ¿Tuviste algún problema para completar tu compra?
      </p>

      <!-- Producto -->
      <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:24px 0">
        <p style="margin:0;font-weight:bold;color:#1a1a2e">${producto}</p>
        ${precio ? `<p style="margin:8px 0 0;color:#00d97e;font-size:20px;font-weight:bold">${precio}</p>` : ''}
      </div>

      <!-- CTA -->
      ${checkout_url ? `
      <div style="text-align:center;margin:32px 0">
        <a href="${checkout_url}" 
           style="background:#00d97e;color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
          Completar mi compra →
        </a>
      </div>` : ''}

      <p style="color:#555;line-height:1.6">
        Si tienes alguna duda, responde este email o escríbenos por WhatsApp. 
        Estamos aquí para ayudarte 🙌
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f5f5f5;padding:20px;text-align:center">
      <p style="color:#888;font-size:12px;margin:0">
        © Klinge | Ñuble 1055, Of. 406, Santiago<br>
        <a href="https://www.klinge.cl" style="color:#00d97e">www.klinge.cl</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  };
};

const emailBienvenida = ({ nombre }) => ({
  subject: `¡Bienvenido a Klinge, ${nombre?.split(' ')[0] || ''}! 🔥`,
  html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#1a1a2e;padding:32px;text-align:center">
      <h1 style="color:#00d97e;margin:0">KLINGE</h1>
    </div>
    <div style="padding:32px">
      <h2>Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}! 👋</h2>
      <p style="color:#555;line-height:1.6">
        Gracias por contactarnos. Somos especialistas en <strong>pantallas LED y hologramas 3D</strong> 
        para negocios en Chile.
      </p>
      <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:24px 0">
        <p style="margin:0;font-weight:bold">Nuestros productos más populares:</p>
        <ul style="color:#555;line-height:2">
          <li>Panel LED 100x50cm — $149.990 ⭐ Best Seller</li>
          <li>Panel LED 60x30cm — $49.990</li>
          <li>Holograma 3D 65cm — $399.990</li>
        </ul>
      </div>
      <div style="text-align:center">
        <a href="https://www.klinge.cl" 
           style="background:#00d97e;color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">
          Ver catálogo completo →
        </a>
      </div>
    </div>
    <div style="background:#f5f5f5;padding:20px;text-align:center">
      <p style="color:#888;font-size:12px;margin:0">© Klinge | <a href="https://www.klinge.cl" style="color:#00d97e">www.klinge.cl</a></p>
    </div>
  </div>
</body>
</html>`,
});

module.exports = { enviarEmail, emailCarritoAbandonado, emailBienvenida };
