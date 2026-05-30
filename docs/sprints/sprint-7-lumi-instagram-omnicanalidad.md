# UPZY — Sprint 7 Lumi Instagram + Omnicanalidad

## Objetivo

Construir el módulo frontend de Lumi Instagram y Omnicanalidad para unificar conversaciones provenientes de Instagram, sitio web, WhatsApp y CRM bajo un mismo modelo comercial.

Sprint 7 busca validar cómo UPZY identifica mensajes entrantes, normaliza conversaciones, hace matching con leads existentes, detecta intención, define temperatura comercial y deja una próxima mejor acción sin romper los módulos anteriores.

---

## Resultado esperado

Al finalizar Sprint 7, UPZY debe permitir revisar visualmente:

- Bandeja omnicanal mock.
- Conversaciones de Instagram normalizadas.
- Matching de contacto/lead.
- Intención comercial detectada.
- Temperatura HOT/WARM/COLD.
- Próxima mejor acción.
- Transición sugerida a WhatsApp, cotización o carrito.
- Métricas omnicanal.
- Timeline de eventos.
- Contrato de conversación omnicanal.

La vista sigue usando datos mock. No conecta todavía con Instagram Graph API ni envía mensajes reales.

---

## Alcance funcional

### Incluido

- Ruta viva `/upzy` apuntando a Sprint 7.
- Página directa `/upzy-sprint7.html`.
- Vista de Lumi Instagram + Omnicanalidad.
- Métricas mock.
- Bandeja de conversaciones por canal.
- Preview de conversación Instagram.
- Panel de matching de lead.
- Resumen comercial.
- Acciones sugeridas.
- Timeline de eventos.
- Contrato de datos.
- Documentación funcional y técnica.

### No incluido

- Integración real con Instagram Graph API.
- Envío real de mensajes por Instagram.
- Conexión real con WhatsApp desde esta vista.
- LLM productivo.
- Persistencia real nueva.
- Asignación real de ejecutivos.
- Reglas productivas de SLA.

---

## Módulo funcional

```txt
Lumi Instagram + Omnicanalidad
```

Responsabilidad:

```txt
Centralizar conversaciones comerciales por canal, normalizar datos, identificar al cliente y activar la próxima mejor acción.
```

---

## Componentes frontend

```txt
OmnichannelDashboard
OmnichannelInbox
InstagramConversationPreview
LeadMatchingPanel
ChannelBadge
IntentBadge
NextBestActionPanel
OmnichannelEventTimeline
OmnichannelDataContract
```

---

## Canales considerados

```txt
web
instagram
whatsapp
email
shopify
manual
```

---

## Eventos de entrada

```txt
instagram.message_received
web.conversation_started
whatsapp.message_received
email.clicked
cart.abandoned_detected
lead.created
lead.email_captured
```

---

## Eventos propios

```txt
omnichannel.message_received
omnichannel.conversation_normalized
omnichannel.lead_matched
omnichannel.intent_detected
omnichannel.temperature_updated
omnichannel.next_best_action_defined
instagram.reply_suggested
whatsapp.handoff_suggested
crm.lead_enriched
```

---

## Contrato de datos

```ts
type OmnichannelConversation = {
  id: string;
  channel: 'web' | 'instagram' | 'whatsapp' | 'email' | 'shopify' | 'manual';
  externalThreadId?: string;
  leadId?: string;
  customerName?: string;
  handle?: string;
  email?: string;
  phone?: string;
  intent: 'quote' | 'product_question' | 'cart_recovery' | 'visit_store' | 'support' | 'unknown';
  commercialTemperature: 'HOT' | 'WARM' | 'COLD';
  productInterest?: string;
  lastMessage: string;
  nextBestAction: string;
  owner?: string;
  status: 'new' | 'open' | 'waiting_customer' | 'resolved';
  updatedAt: string;
};
```

---

## Reglas comerciales

1. Todo mensaje entrante debe normalizarse como conversación omnicanal.
2. Instagram debe intentar hacer matching con lead existente por handle, nombre, email o teléfono si aparece en conversación.
3. Si el cliente pide precio, medida o cotización, la conversación debe subir temperatura.
4. Si el cliente entrega email, se debe enriquecer CRM.
5. Si existe teléfono, se puede sugerir transición a WhatsApp.
6. Si hay producto de interés, debe viajar al CRM.
7. Toda conversación debe tener próxima mejor acción.
8. La bandeja debe priorizar HOT, carritos y solicitudes de cotización.
9. Lumi debe resolver y orientar dentro del flujo, sin prometer derivaciones externas.

---

## Casos de uso iniciales

```txt
Cliente pregunta precio por Instagram
Cliente responde historia o reel
Cliente pide medidas disponibles
Cliente quiere comprar por WhatsApp
Cliente pide retiro o despacho
Cliente viene desde carrito abandonado
Cliente ya existe en CRM y vuelve por otro canal
```

---

## Relación con otros sprints

### Depende de Sprint 1 — CRM Comercial

Usa lead, temperatura comercial, owner y próxima mejor acción.

### Depende de Sprint 6 — Lumi Sitio Web

Reutiliza contrato conversacional y resumen comercial.

### Habilita Sprint 8 — Automatizaciones

Permite disparar acciones por canal, intención, temperatura y estado.

### Habilita Sprint 9 — Reportes

Permite atribuir resultados por canal y medir conversión omnicanal.

---

## Criterios de aceptación

- `/upzy` carga Sprint 7.
- `/upzy-sprint7.html` existe como ruta directa.
- `/dashboard` sigue intacto.
- Se visualizan métricas omnicanal.
- Se visualiza bandeja de conversaciones.
- Se visualiza conversación Instagram mock.
- Se visualiza matching de lead.
- Se visualiza próxima mejor acción.
- Se visualiza timeline de eventos.
- Se documenta contrato de datos.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 7 mantiene el módulo separado en:

```txt
public/assets/upzy-omnichannel-data.js
public/assets/upzy-omnichannel.css
public/assets/upzy-omnichannel.js
```

La integración real debe hacerse después por API/eventos, sin acoplar la bandeja a Instagram, WhatsApp o CRM directamente.

---

## Próximo sprint

Sprint 8 debe implementar Automatizaciones Comerciales usando eventos, condiciones y acciones por canal.
