# UPZY — Sprint 2 Captación Web

## Objetivo

Construir el módulo de captación web de UPZY para convertir tráfico anónimo del sitio en leads medibles, accionables y conectados al CRM.

Sprint 2 se enfoca en modal, popup y formulario como piezas independientes, preparadas para integrarse después con ruleta, campañas de email marketing, carrito abandonado y Lumi.

---

## Resultado esperado

Al finalizar Sprint 2, UPZY debe permitir revisar visualmente cómo se capturan leads desde el sitio web, qué datos mínimos se solicitan, qué evento comercial se dispara y cómo ese lead entra al CRM.

La vista sigue usando datos mock. No se conecta todavía a Supabase ni Shopify en producción.

---

## Alcance funcional

### Incluido

- Ruta de revisión `/upzy` apuntando a Sprint 2.
- Página directa `/upzy-sprint2.html`.
- Vista de Captación Web.
- Plantillas visuales de:
  - Modal de captura.
  - Popup lateral.
  - Formulario embebido.
- Vista previa del modal.
- Estados del formulario.
- Eventos comerciales mock.
- Métricas de captación.
- Tabla de plantillas de captación.
- Documentación técnica y funcional.

### No incluido

- Persistencia real en base de datos.
- Publicación real del script en Shopify.
- Consentimiento legal productivo.
- Integración real con Klaviyo/Mailchimp/SES.
- Ruleta funcional productiva.
- Scoring real automático.
- Testing A/B real.

---

## Módulo funcional

```txt
Captación Web
```

Responsabilidad:

```txt
Transformar visitas del sitio web en leads con datos mínimos, consentimiento y trazabilidad comercial.
```

---

## Componentes frontend

```txt
CaptureDashboard
CaptureTemplateCard
CapturePreviewModal
CaptureFormMock
CaptureEventTimeline
CaptureMetrics
```

---

## Plantillas consideradas

### 1. Modal de captura

Uso recomendado:

- Usuario navega catálogo.
- Usuario muestra intención de compra.
- Usuario está por salir del sitio.
- Usuario llega desde campaña pagada.

Mensaje sugerido:

```txt
¿Quieres que te enviemos una cotización con el producto correcto para tu negocio?
```

Campos:

```txt
nombre
email
telefono
tipo_negocio
producto_interes
consentimiento
```

Evento principal:

```txt
lead.email_captured
```

---

### 2. Popup lateral

Uso recomendado:

- Promoción suave sin interrumpir navegación.
- Captura de WhatsApp/email.
- Invitación a sala de ventas.

Evento principal:

```txt
popup.opened
popup.cta_clicked
lead.created
```

---

### 3. Formulario embebido

Uso recomendado:

- Landing page.
- Página de producto.
- Página de campaña.
- Página de cotización.

Evento principal:

```txt
form.submitted
lead.created
```

---

## Contrato de datos del lead capturado

```ts
type CapturedLead = {
  id: string;
  source: 'modal' | 'popup' | 'embedded_form';
  channel: 'web';
  name: string;
  email?: string;
  phone?: string;
  businessType?: string;
  productInterest?: string;
  campaignId?: string;
  pageUrl?: string;
  consent: boolean;
  createdAt: string;
};
```

---

## Eventos comerciales

```txt
capture.modal_opened
capture.popup_opened
capture.form_viewed
capture.form_started
capture.form_submitted
lead.created
lead.email_captured
lead.phone_captured
lead.business_type_captured
crm.lead_enriched
```

---

## Reglas de diseño

1. El modal no debe bloquear toda la experiencia si el usuario no está listo.
2. El formulario debe pedir pocos datos al inicio.
3. El email es clave para reducir dependencia de Meta.
4. El teléfono permite cierre por WhatsApp.
5. Producto de interés debe viajar siempre que exista contexto.
6. Todo evento debe quedar medible para atribución.

---

## Relación con otros sprints

### Habilita Sprint 3 — Ruleta

La ruleta usará el mismo contrato de captura:

```txt
lead.created
lead.email_captured
coupon.generated
```

### Habilita Sprint 4 — Email Marketing

Los leads capturados alimentan segmentos y campañas.

### Habilita Sprint 5 — Carritos Abandonados

Cuando exista email o teléfono, se puede recuperar carrito por canal directo.

### Habilita Sprint 6 — Lumi Web

Lumi podrá usar el mismo leadId y enriquecer datos desde conversación.

---

## Criterios de aceptación

- `/upzy` carga Sprint 2.
- `/upzy-sprint2.html` existe como ruta directa.
- `/dashboard` sigue intacto.
- Se visualizan métricas de captación.
- Se visualizan plantillas: modal, popup y formulario embebido.
- Se visualiza preview del modal.
- Se visualiza timeline de eventos.
- Se documenta contrato de datos.
- Se documentan eventos comerciales.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 2 mantiene mocks porque el objetivo es validar el flujo de captación antes de activar persistencia real. La integración posterior debe hacerse por API y eventos, no acoplando directamente la vista con otros módulos.

---

## Próximo sprint

Sprint 3 debe implementar la plantilla de ruleta / Spin to Win sobre el mismo contrato de captación.
