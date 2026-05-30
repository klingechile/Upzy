# UPZY — Sprint 6 Lumi en Sitio Web

## Objetivo

Construir el módulo frontend de Lumi en Sitio Web como motor conversacional comercial conectado al CRM, captación web, email marketing y carritos abandonados.

Sprint 6 busca validar cómo Lumi atiende en el sitio, captura datos, recomienda producto, genera intención comercial, solicita correo para cotización y permite seguimiento medible sin reemplazar todavía las integraciones reales.

---

## Resultado esperado

Al finalizar Sprint 6, UPZY debe permitir revisar visualmente:

- Widget web de Lumi.
- Conversación comercial mock.
- Captura de nombre, email, teléfono y tipo de negocio.
- Recomendación de producto.
- Resumen comercial del lead.
- Próxima mejor acción.
- Eventos conversacionales.
- Relación con carrito abandonado.
- Contrato de datos de conversación.

La vista sigue usando datos mock. No ejecuta un LLM real desde esta nueva vista.

---

## Alcance funcional

### Incluido

- Ruta viva `/upzy` apuntando a Sprint 6.
- Página directa `/upzy-sprint6.html`.
- Vista de Lumi en Sitio Web.
- Preview de widget conversacional.
- Métricas mock de atención web.
- Casos de uso comerciales.
- Conversaciones mock.
- Panel de datos capturados.
- Recomendaciones de producto.
- Timeline de eventos.
- Contrato de datos.
- Documentación funcional y técnica.

### No incluido

- LLM productivo.
- Conexión real a WhatsApp o Instagram.
- Persistencia real nueva.
- Envío real de cotización.
- Recomendador real por catálogo.
- Integración real con Shopify desde esta vista.
- Entrenamiento productivo del bot.

---

## Módulo funcional

```txt
Lumi Sitio Web
```

Responsabilidad:

```txt
Atender visitantes del sitio, entender intención comercial, capturar datos, recomendar producto y alimentar el CRM con eventos medibles.
```

---

## Componentes frontend

```txt
LumiWebDashboard
LumiWidgetPreview
LumiConversationMock
LumiLeadSummary
LumiRecommendationCard
LumiUseCaseCard
LumiEventTimeline
LumiDataContract
```

---

## Eventos de entrada

```txt
site.visitor_started
product.viewed
capture.form_submitted
cart.abandoned_detected
coupon.generated
lead.created
```

---

## Eventos propios

```txt
lumi.web.opened
lumi.conversation_started
lumi.intent_detected
lumi.lead_data_captured
lumi.product_recommended
lumi.quote_requested
lumi.cart_followup_started
lumi.next_best_action_defined
crm.lead_enriched
```

---

## Contrato de datos

```ts
type LumiWebConversation = {
  id: string;
  channel: 'web';
  leadId?: string;
  visitorId?: string;
  name?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  intent: 'quote' | 'product_question' | 'cart_recovery' | 'visit_store' | 'support';
  productInterest?: string;
  recommendedProduct?: string;
  commercialTemperature: 'HOT' | 'WARM' | 'COLD';
  nextBestAction: string;
  summary: string;
  createdAt: string;
};
```

---

## Reglas comerciales

1. Lumi debe entender primero la intención antes de pedir demasiados datos.
2. El email debe pedirse cuando exista cotización, cupón, carrito o seguimiento.
3. El teléfono habilita cierre por WhatsApp, pero no debe bloquear la conversación.
4. Producto de interés debe viajar desde página, campaña o conversación.
5. Toda conversación debe generar resumen comercial.
6. Toda conversación debe definir próxima mejor acción.
7. Si hay carrito abandonado, Lumi debe usar producto, monto y checkout como contexto.
8. Lumi no debe prometer derivaciones externas; debe orientar, capturar datos y avanzar la venta dentro del flujo.

---

## Casos de uso iniciales

```txt
Visitante pregunta qué panel necesita
Visitante pide precio o cotización
Visitante pregunta por retiro o despacho
Visitante abandona carrito y vuelve al sitio
Visitante llega desde campaña con producto de interés
Visitante quiere agendar sala de ventas
```

---

## Relación con otros sprints

### Depende de Sprint 1 — CRM Comercial

Usa lead, termómetro comercial y próxima mejor acción.

### Depende de Sprint 2 — Captación Web

Comparte campos mínimos: nombre, email, teléfono, tipo de negocio y producto_interes.

### Depende de Sprint 5 — Carritos Abandonados

Puede iniciar seguimiento conversacional para recuperar intención de compra.

### Habilita Sprint 7 — Lumi Instagram

Permite reutilizar contratos conversacionales para omnicanalidad.

---

## Criterios de aceptación

- `/upzy` carga Sprint 6.
- `/upzy-sprint6.html` existe como ruta directa.
- `/dashboard` sigue intacto.
- Se visualiza widget de Lumi web.
- Se visualizan métricas de atención.
- Se visualizan casos de uso.
- Se visualiza conversación mock.
- Se visualiza resumen comercial.
- Se visualiza recomendación de producto.
- Se visualiza timeline de eventos.
- Se documenta contrato de datos.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 6 mantiene el módulo separado en:

```txt
public/assets/upzy-lumi-web-data.js
public/assets/upzy-lumi-web.css
public/assets/upzy-lumi-web.js
```

La integración real debe hacerse después por API/eventos, sin acoplar el widget directamente a CRM, Shopify o Email Marketing.

---

## Próximo sprint

Sprint 7 debe implementar Lumi Instagram y bandeja omnicanal usando el mismo contrato conversacional.
