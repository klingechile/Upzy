# UPZY — Sprint 4 Email Marketing

## Objetivo

Construir el módulo frontend de Email Marketing de UPZY para diseñar, segmentar, medir y orquestar campañas comerciales conectadas a los eventos del CRM, captación web, ruleta y futuros carritos abandonados.

El sprint busca que UPZY no dependa únicamente de Meta Ads para volver a contactar clientes. El email pasa a ser un activo propio: medible, reutilizable y conectado al historial comercial.

---

## Resultado esperado

Al finalizar Sprint 4, UPZY debe permitir revisar visualmente:

- Dashboard de email marketing.
- Segmentos comerciales.
- Plantillas de campaña.
- Secuencias sugeridas.
- Métricas mock de apertura, clic, conversión y revenue.
- Relación entre eventos comerciales y campañas.
- Contrato de datos mínimo para campaña.

La vista sigue usando datos mock. No se ejecuta envío real en producción desde esta nueva vista.

---

## Alcance funcional

### Incluido

- Ruta viva `/upzy` apuntando a Sprint 4.
- Página directa `/upzy-sprint4.html`.
- Vista de Email Marketing.
- Métricas mock.
- Segmentos comerciales.
- Plantillas base.
- Secuencias comerciales.
- Preview de email.
- Timeline de eventos.
- Contrato de campaña.
- Documentación funcional y técnica.

### No incluido

- Envío real de campañas desde la nueva vista.
- Editor HTML productivo.
- A/B testing real.
- Integración productiva con SES, Mailchimp o Klaviyo desde esta vista.
- Persistencia real de campañas.
- Tracking real de apertura/clic.
- Gestión real de bajas/unsubscribe desde esta vista.

---

## Módulo funcional

```txt
Email Marketing
```

Responsabilidad:

```txt
Activar leads y clientes mediante campañas, secuencias y mensajes personalizados a partir de eventos comerciales medibles.
```

---

## Componentes frontend

```txt
EmailMarketingDashboard
EmailMetricCards
EmailSegmentCard
EmailTemplateCard
EmailCampaignPreview
EmailSequenceTimeline
EmailEventTimeline
EmailCampaignContract
```

---

## Eventos de entrada

El módulo de Email Marketing debe poder reaccionar a eventos generados por otros módulos.

```txt
lead.created
lead.email_captured
coupon.generated
lead.coupon_assigned
quote.sent
cart.abandoned_detected
purchase.completed
customer.inactive_detected
```

---

## Eventos propios

```txt
email.campaign_created
email.campaign_scheduled
email.campaign_sent
email.opened
email.clicked
email.converted
email.unsubscribed
email.bounced
```

---

## Segmentos iniciales

```txt
Leads HOT con email
Cupón generado no usado
Carrito abandonado con email
Clientes post compra
Clientes inactivos
Leads capturados por ruleta
```

---

## Plantillas iniciales

### 1. Cupón generado

Disparador:

```txt
coupon.generated
```

Objetivo:

```txt
Que el cliente use el cupón antes de vencer.
```

Variables:

```txt
{{nombre}}
{{producto}}
{{coupon_code}}
{{expires_at}}
{{checkout_url}}
```

---

### 2. Carrito abandonado

Disparador:

```txt
cart.abandoned_detected
```

Objetivo:

```txt
Recuperar compra mostrando producto, beneficio y CTA directo.
```

Variables:

```txt
{{nombre}}
{{producto}}
{{checkout_url}}
{{whatsapp_url}}
```

---

### 3. Cotización enviada

Disparador:

```txt
quote.sent
```

Objetivo:

```txt
Acelerar decisión de compra después de cotizar.
```

Variables:

```txt
{{nombre}}
{{producto}}
{{quote_url}}
{{payment_url}}
{{sales_room_url}}
```

---

### 4. Post compra

Disparador:

```txt
purchase.completed
```

Objetivo:

```txt
Confirmar compra, educar, pedir reseña y generar recompra.
```

Variables:

```txt
{{nombre}}
{{producto}}
{{order_id}}
{{review_url}}
```

---

## Contrato de datos

```ts
type EmailCampaign = {
  id: string;
  name: string;
  type: 'one_shot' | 'sequence' | 'automation';
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  segmentId: string;
  triggerEvent?: string;
  subject: string;
  preheader: string;
  templateId: string;
  variables: string[];
  metrics?: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue?: number;
  };
};
```

---

## Reglas comerciales

1. Toda campaña debe tener segmento explícito.
2. Todo email debe tener asunto, preheader y CTA.
3. Siempre que exista producto de interés, debe viajar como variable.
4. Los emails de carrito deben incluir checkout_url.
5. Los emails comerciales deben ofrecer alternativa por WhatsApp.
6. Los emails de alta intención deben ofrecer agenda o sala de ventas.
7. Todo envío debe ser medible por apertura, clic y conversión.
8. Todo contacto debe poder darse de baja.

---

## Relación con otros sprints

### Depende de Sprint 2 — Captación Web

Usa:

```txt
lead.email_captured
lead.created
producto_interes
```

### Depende de Sprint 3 — Ruleta

Usa:

```txt
coupon.generated
lead.coupon_assigned
```

### Habilita Sprint 5 — Carritos Abandonados

Prepara plantillas y métricas para recuperar compras inconclusas.

---

## Criterios de aceptación

- `/upzy` carga Sprint 4.
- `/upzy-sprint4.html` existe como ruta directa.
- `/dashboard` sigue intacto.
- Se visualizan métricas de email marketing.
- Se visualizan segmentos comerciales.
- Se visualizan plantillas iniciales.
- Se visualiza preview de email.
- Se visualiza secuencia sugerida.
- Se visualiza timeline de eventos.
- Se documenta contrato de campaña.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 4 mantiene el módulo separado en:

```txt
public/assets/upzy-email.css
public/assets/upzy-email.js
```

La integración real debe hacerse después vía endpoints/eventos, sin acoplar Email Marketing directamente con Ruleta, Captación o CRM.

---

## Próximo sprint

Sprint 5 debe implementar Carritos Abandonados usando las plantillas y eventos base de Email Marketing.
