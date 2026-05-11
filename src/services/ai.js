const Anthropic = require('@anthropic-ai/sdk');
const config    = require('../config/env');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const SYSTEM_BASE = `Eres Lumi, la asistente virtual de {EMPRESA}.
Eres amable, directa y experta en los productos de la empresa.
Respondes en español chileno, de forma natural y concisa.
Tu objetivo es ayudar al cliente, entender qué necesita y conectarlo con el equipo de ventas cuando sea apropiado.

Reglas:
- Si el cliente pregunta por precios, dáselos directamente
- Si el cliente muestra intención de compra clara, recomienda hablar con un vendedor
- Nunca inventes información que no tengas
- Respuestas máximo 3 párrafos cortos
- Usa emojis con moderación (1-2 por mensaje máximo)`;

const responder = async (mensajeUsuario, historial = [], contexto = {}) => {
  const system = SYSTEM_BASE.replace('{EMPRESA}', contexto.empresa || 'Klinge') +
    (contexto.lead ? `\n\nContexto del cliente:
- Nombre: ${contexto.lead.nombre || 'desconocido'}
- Empresa: ${contexto.lead.empresa || 'no informada'}
- Segmento: ${contexto.lead.segmento} (score ${contexto.lead.score}/10)
- Intenciones: ${contexto.intenciones?.join(', ') || 'ninguna'}` : '');

  const response = await client.messages.create({
    model:      config.anthropic.model,
    max_tokens: 500,
    system,
    messages: [
      ...historial.slice(-10),
      { role: 'user', content: mensajeUsuario },
    ],
  });

  return response.content[0]?.text || 'Lo siento, no pude procesar tu mensaje. ¿Puedes repetirlo?';
};

const quiereAgente = (texto) => {
  if (!texto) return false;
  return /agente|humano|persona|vendedor|hablar con|comunicar|llamar/.test(texto.toLowerCase());
};

module.exports = { responder, quiereAgente };
