// src/services/templates.js
// Templates de mensajes WhatsApp para Klinge/Upzy
// Variables disponibles: [nombre], [empresa], [producto], [monto], [url], [vendedor]

const TEMPLATES = {

  // ── BIENVENIDA ────────────────────────────────────────────
  bienvenida: (datos = {}) => {
    const nombre = datos.nombre?.split(' ')[0] || 'Hola';
    return `¡Hola ${nombre}! 👋 Soy *Lumi*, la asistente virtual de *Klinge*.

Somos especialistas en pantallas LED y hologramas 3D para negocios 🔥

¿En qué puedo ayudarte hoy?
• 📊 Ver catálogo y precios
• 💬 Hablar con un asesor
• 🚚 Info de envíos y garantía`;
  },

  // ── CATÁLOGO RÁPIDO ───────────────────────────────────────
  catalogo: () =>
    `*Nuestros productos más populares* 📺

🔹 *Panel LED 60x30cm* — $49.990
   Ideal para pequeños locales

🔹 *Panel LED 100x50cm* ⭐ BEST SELLER — $149.990
   El favorito de restaurantes y retail

🔹 *Panel LED 150x80cm* — $299.990
   Máximo impacto visual para negocios grandes

🔹 *Holograma 3D 65cm* — $399.990
   El producto del momento ✨

Todos incluyen: soporte de pared + software + garantía 1 año 🛡️
Envío en *48 horas* a todo Chile 🚚

¿Cuál te interesa? Te hago una cotización ahora mismo 👇`,

  // ── CONSULTA DE PRECIO ────────────────────────────────────
  precio: (datos = {}) => {
    const producto = datos.producto || 'el panel';
    const precio   = datos.precio   || 'consultar';
    return `*${producto}* tiene un precio de *$${typeof precio === 'number' ? precio.toLocaleString('es-CL') : precio}* con IVA incluido 💰

✅ Stock disponible
🚚 Despacho en 48h
🛡️ Garantía 1 año
🔧 Instalación incluida en Santiago

¿Te armo una cotización formal? Solo necesito el nombre de tu empresa 📋`;
  },

  // ── COTIZACIÓN ────────────────────────────────────────────
  cotizacion: (datos = {}) => {
    const nombre   = datos.nombre   || 'Cliente';
    const empresa  = datos.empresa  || 'tu empresa';
    const producto = datos.producto || 'Panel LED 100x50cm';
    const monto    = datos.monto    ? `$${Number(datos.monto).toLocaleString('es-CL')}` : 'a coordinar';
    return `*Cotización para ${empresa}* 📋

Cliente: ${nombre}
Producto: ${producto}
Total: *${monto}*

¿Quieres que te envíe la cotización formal por correo o seguimos por acá? 😊`;
  },

  // ── CARRITO ABANDONADO — Mensaje 1 (1 hora después) ──────
  carritoAbandonado1: (datos = {}) => {
    const nombre   = datos.nombre?.split(' ')[0] || 'Hola';
    const producto = datos.productos?.[0]?.title || 'tu producto';
    const monto    = datos.monto ? `$${Number(datos.monto).toLocaleString('es-CL')}` : '';
    const url      = datos.checkout_url || '';
    return `¡Hola ${nombre}! 👋

Vi que dejaste *${producto}*${monto ? ` (${monto})` : ''} en tu carrito de Klinge.

¿Tuviste algún problema para completar el pedido? Estoy aquí para ayudarte 🙌${url ? `\n\n▶️ Retomar compra: ${url}` : ''}`;
  },

  // ── CARRITO ABANDONADO — Mensaje 2 (24 horas después) ────
  carritoAbandonado2: (datos = {}) => {
    const nombre   = datos.nombre?.split(' ')[0] || 'Hola';
    const producto = datos.productos?.[0]?.title || 'tu panel LED';
    const url      = datos.checkout_url || '';
    return `${nombre}, ¡todavía estás a tiempo! ⏰

Tu *${producto}* sigue disponible con stock.

🎁 Te damos un *10% de descuento* si completas hoy:
Código: *VUELVE10*
${url ? `\n▶️ ${url}` : ''}
Si tienes dudas sobre el producto, responde este mensaje y te ayudo ahora mismo 💬`;
  },

  // ── CALIFICACIÓN — Pregunta tipo negocio ─────────────────
  calificacionTipoNegocio: () =>
    `¡Perfecto! Para recomendarte la mejor pantalla para tu negocio, ¿me puedes decir qué tipo de local tienes? 🏪

1️⃣ Restaurante / Cafetería / Bar
2️⃣ Retail / Tienda / Boutique
3️⃣ Gym / Spa / Clínica
4️⃣ Oficina / Empresa
5️⃣ Otro (cuéntame)`,

  // ── CALIFICACIÓN — Pregunta cantidad ─────────────────────
  calificacionCantidad: (datos = {}) => {
    const tipo = datos.tipo_negocio || 'tu negocio';
    return `¡Genial! Para un ${tipo}, tenemos varias opciones que funcionan muy bien 💡

¿Cuántas pantallas necesitas aproximadamente?

1️⃣ 1 pantalla
2️⃣ 2-3 pantallas
3️⃣ 4 o más (te damos precio especial 🎁)`;
  },

  // ── HANDOFF A AGENTE ─────────────────────────────────────
  handoffAgente: (datos = {}) => {
    const nombre = datos.nombre?.split(' ')[0] || '';
    return `${nombre ? `${nombre}, p` : 'P'}erfecto! Te conecto ahora mismo con uno de nuestros asesores 🙏

Un momento por favor... ⏳`;
  },

  // ── SEGUIMIENTO (follow-up 48h sin respuesta) ─────────────
  followup: (datos = {}) => {
    const nombre = datos.nombre?.split(' ')[0] || 'Hola';
    return `¡Hola ${nombre}! 👋 Solo quería saber si pudiste revisar la info que te enviamos sobre nuestros paneles LED.

¿Tienes alguna duda? Estamos disponibles para ayudarte 😊`;
  },

  // ── CONFIRMACIÓN DE PAGO ──────────────────────────────────
  confirmacionPago: (datos = {}) => {
    const nombre  = datos.nombre?.split(' ')[0] || 'Cliente';
    const pedido  = datos.orden_id || '';
    return `¡Muchas gracias ${nombre}! 🎉 Tu pedido ${pedido ? `*#${pedido}*` : ''} fue confirmado.

📦 *Próximos pasos:*
1. Preparamos tu pedido en 24h
2. Despacho en 48h hábiles
3. Te avisamos con el número de seguimiento

¡Pronto tendrás tu pantalla LED funcionando! 🔥

Cualquier duda estamos acá 👋`;
  },

  // ── ENCUESTA POST-VENTA ───────────────────────────────────
  encuestaPostventa: (datos = {}) => {
    const nombre = datos.nombre?.split(' ')[0] || 'Cliente';
    return `¡Hola ${nombre}! Esperamos que tu pantalla LED esté funcionando increíble 🔥

¿Cómo calificarías tu experiencia con Klinge?

⭐⭐⭐⭐⭐ Excelente
⭐⭐⭐⭐ Muy buena
⭐⭐⭐ Buena
⭐⭐ Regular

Tu opinión nos ayuda a mejorar 🙏`;
  },
};

// Helper: obtener template por nombre
const getTemplate = (nombre, datos = {}) => {
  const fn = TEMPLATES[nombre];
  if (!fn) throw new Error(`Template '${nombre}' no existe`);
  return fn(datos);
};

// Helper: detectar qué template usar según el mensaje del cliente
const detectarTemplate = (texto) => {
  if (!texto) return null;
  const t = texto.toLowerCase();
  if (/precio|costo|cuánto|cuanto|vale/.test(t))     return 'precio';
  if (/catálogo|catalogo|productos|modelos/.test(t)) return 'catalogo';
  if (/cotiz|presupuesto/.test(t))                   return 'cotizacion';
  if (/hola|buenas|good|hi\b/.test(t))               return 'bienvenida';
  return null;
};

module.exports = { TEMPLATES, getTemplate, detectarTemplate };
