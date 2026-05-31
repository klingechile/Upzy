# UPZY — Sprint 21 Inbox Omnicanal + Lumi Web Base

## Objetivo

Iniciar la capa de atención omnicanal de UPZY con una bandeja única para conversaciones de WhatsApp, Instagram y web, integrando la base existente de Lumi y dejando una respuesta asistida controlada para agentes.

Sprint 21 no activa respuestas automáticas masivas. Su foco es visibilidad, orden operacional y handoff humano/bot.

---

## Resultado esperado

Al finalizar Sprint 21, UPZY debe contar con:

- Ruta final `/inbox`.
- Página directa `/upzy-sprint21.html`.
- Vista de conversaciones omnicanal.
- Lectura desde `GET /api/inbox/bandeja`.
- Lectura de mensajes por conversación.
- Acciones tomar conversación / devolver a bot.
- Base de respuesta asistida por Lumi sin envío automático.
- Endpoint `GET /api/omnichannel/status`.
- Endpoint `POST /api/omnichannel/suggest-reply`.
- Menú persistente con Inbox para `admin` y `agente`.

---

## Fuentes actuales

UPZY ya cuenta con base de inbox:

```txt
/api/inbox/bandeja
/api/inbox/:id/mensajes
/api/inbox/:id/responder
/api/inbox/:id/tomar
/api/inbox/:id/devolver-bot
```

Estas rutas leen desde:

```txt
lumi_conversations
lumi_messages
lumi_customers
upzy_conversaciones
upzy_mensajes
upzy_leads
```

---

## Nuevos endpoints Sprint 21

### GET /api/omnichannel/status

Devuelve estado de canales y conteos base:

```txt
whatsapp
instagram
shopify
email
conversaciones_lumi
conversaciones_upzy
mensajes_lumi
mensajes_upzy
```

---

### POST /api/omnichannel/suggest-reply

Genera una sugerencia controlada para agente humano según contexto:

```json
{
  "conversation_id": "uuid",
  "source": "lumi|upzy",
  "intent": "precio|envio|retiro|garantia|general",
  "lead": {}
}
```

Respuesta:

```json
{
  "ok": true,
  "suggestion": "mensaje sugerido",
  "mode": "agent_assist"
}
```

---

## Reglas funcionales

1. Inbox no envía respuestas automáticas por defecto.
2. Sugerencias son para agente, no para envío automático.
3. El agente puede tomar conversación y devolver a bot.
4. La UI debe mostrar canal, estado, lead, score y último mensaje.
5. Si no hay conversaciones, mostrar estado vacío controlado.
6. No exponer credenciales de WhatsApp, Instagram ni Supabase en frontend.
7. Mantener rutas históricas por sprint.

---

## Criterios de aceptación

- `/inbox` existe.
- `/upzy-sprint21.html` existe.
- `GET /api/omnichannel/status` existe y está protegido por JWT.
- `POST /api/omnichannel/suggest-reply` existe y está protegido por JWT.
- Vista carga conversaciones desde `/api/inbox/bandeja`.
- Vista permite seleccionar conversación y cargar mensajes.
- Vista permite tomar conversación y devolver a bot.
- Vista permite generar respuesta sugerida sin enviarla automáticamente.
- Navegación persistente incluye Inbox para admin/agente.
- No se modifica `package.json`.

---

## Próximo sprint recomendado

Sprint 22 debería cerrar Lumi Web widget embebible:

```txt
Snippet web
endpoint público de mensaje web
creación de conversación web
tracking lead_id
handoff a agente
```
