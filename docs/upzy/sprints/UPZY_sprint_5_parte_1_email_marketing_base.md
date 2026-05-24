# UPZY — Sprint 5 / Parte 1
## Email Marketing — Base del módulo, campañas y segmentos

## Objetivo de esta parte

Bajar el Sprint 5 a una primera implementación controlada, enfocada en crear la base del módulo de Email Marketing sin activar todavía el envío masivo real.

Esta parte debe dejar preparado:

- módulo Email Marketing;
- feature flag;
- permisos;
- estructura modular;
- entidades base;
- listado de campañas;
- creación de campaña en borrador;
- segmentos iniciales;
- validación de contactos elegibles;
- exclusiones por consentimiento, baja, rebote o falta de email;
- eventos iniciales;
- base para preview, envío y tracking en las siguientes partes.

La regla principal de esta parte es:

> Primero construimos la base segura de campañas y segmentos. Después activamos contenido, preview, envío y medición.

---

# 1. Alcance de Sprint 5 / Parte 1

## Incluye

- Crear estructura del módulo `/email-marketing`.
- Crear feature flag `email_marketing_enabled`.
- Crear permisos base.
- Crear tipos principales.
- Crear schemas base.
- Crear servicio de campañas.
- Crear servicio de segmentos.
- Crear listado de campañas.
- Crear formulario inicial de campaña.
- Crear estado `draft`.
- Crear segmentos iniciales.
- Calcular contactos elegibles.
- Calcular contactos excluidos.
- Validar consentimiento marketing.
- Validar email válido.
- Validar bajas.
- Validar rebotes bloqueados.
- Registrar eventos iniciales.
- Crear pruebas base.

## No incluye todavía

- Envío real de campaña.
- Tracking de apertura.
- Tracking de clic.
- Tracking de conversión.
- A/B Testing.
- Editor visual avanzado.
- Automatizaciones.
- Reportes avanzados.
- Ads.
- WhatsApp masivo.
- Modificar Carrito Abandonado.

---

# 2. Resultado esperado

Al cierre de esta parte, el usuario debe poder:

```txt
Entrar a Email Marketing
→ Ver listado de campañas
→ Crear campaña en borrador
→ Seleccionar tipo de campaña
→ Seleccionar segmento
→ Ver cantidad de contactos elegibles
→ Ver cantidad de contactos excluidos
→ Guardar campaña como draft
```

Todavía no se envía la campaña real. El envío queda para una parte posterior.

---

# 3. Feature flag

Debe existir:

```txt
email_marketing_enabled
```

## Comportamiento

Si está activo:

- se muestra el módulo;
- se permite ver campañas;
- se permite crear borradores según permisos.

Si está apagado:

- no se carga el módulo;
- no se muestran campañas;
- no se ejecutan servicios;
- se muestra estado controlado.

Mensaje sugerido:

```txt
El módulo Email Marketing aún no está activo en este ambiente.
```

---

# 4. Permisos mínimos de esta parte

```txt
email_marketing.view
email_marketing.view_detail
email_marketing.create
email_marketing.edit
email_marketing.preview
email_marketing.view_metrics
```

En esta parte todavía no se usan:

```txt
email_marketing.send
email_marketing.schedule
email_marketing.send_test
email_marketing.run_ab_test
```

Pero deben quedar definidos para fases siguientes.

---

# 5. Estados de campaña

Estados iniciales:

```txt
draft
ready
scheduled
sending
sent
paused
cancelled
failed
archived
```

## En esta parte se utilizarán

```txt
draft
ready
```

## Reglas

Una campaña inicia como:

```txt
draft
```

Puede pasar a `ready` solo si tiene:

- nombre;
- tipo;
- segmento;
- asunto;
- preheader;
- contenido base;
- CTA principal;
- link de baja preparado;
- destinatarios elegibles.

El cambio a `scheduled` o `sending` queda fuera de esta parte.

---

# 6. Tipos de campaña

Tipos iniciales:

```txt
promotional
product_launch
category_campaign
newsletter
reactivation
repurchase
cross_sell
upsell
seasonal
coupon
customer_loyalty
lead_nurturing
announcement
```

## Recomendación MVP

Partir con estos tipos visibles:

```txt
promotional
product_launch
reactivation
repurchase
newsletter
coupon
```

El resto queda preparado.

---

# 7. Entidades base

## 7.1 EmailCampaign

```ts
export type EmailCampaignStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled"
  | "failed"
  | "archived";

export type EmailCampaignType =
  | "promotional"
  | "product_launch"
  | "category_campaign"
  | "newsletter"
  | "reactivation"
  | "repurchase"
  | "cross_sell"
  | "upsell"
  | "seasonal"
  | "coupon"
  | "customer_loyalty"
  | "lead_nurturing"
  | "announcement";

export type EmailCampaign = {
  id: string;
  name: string;
  campaign_type: EmailCampaignType;
  status: EmailCampaignStatus;
  subject?: string | null;
  preheader?: string | null;
  from_name?: string | null;
  from_email?: string | null;
  reply_to?: string | null;
  template_id?: string | null;
  segment_id?: string | null;
  eligible_recipients_count?: number;
  excluded_recipients_count?: number;
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};
```

---

## 7.2 EmailSegment

```ts
export type EmailSegmentRule = {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
};

export type EmailSegment = {
  id: string;
  name: string;
  description?: string | null;
  rules: EmailSegmentRule[];
  contacts_count: number;
  eligible_count: number;
  excluded_count: number;
  last_calculated_at?: string | null;
  created_at: string;
  updated_at: string;
};
```

---

## 7.3 EmailRecipientEligibility

```ts
export type EmailRecipientEligibilityStatus =
  | "eligible"
  | "missing_email"
  | "invalid_email"
  | "no_marketing_consent"
  | "unsubscribed"
  | "bounced"
  | "duplicated"
  | "suppressed";

export type EmailRecipientEligibility = {
  contact_id: string;
  email?: string | null;
  status: EmailRecipientEligibilityStatus;
  reason?: string;
};
```

---

# 8. Segmentos iniciales

## Segmentos base

```txt
Todos los contactos con consentimiento
Contactos calientes
Contactos muy calientes
Clientes
Clientes recurrentes
Clientes dormidos
Contactos nuevos
Contactos tibios
Contactos por fuente
Contactos por canal preferido
Contactos por producto de interés
Clientes que compraron antes
Clientes que no compran hace X días
Clientes con email válido
```

## Segmentos recomendados para partir en MVP

```txt
Todos los contactos con consentimiento
Contactos calientes
Contactos muy calientes
Clientes
Clientes dormidos
Contactos nuevos
```

---

# 9. Reglas de elegibilidad

Antes de usar un contacto como destinatario se debe validar:

- tiene email;
- email tiene formato válido;
- tiene consentimiento marketing si la campaña es comercial;
- no está dado de baja;
- no tiene rebote bloqueante;
- no está en suppression list;
- no está duplicado dentro del segmento.

## Contacto elegible

```txt
Tiene email válido + consentimiento + no está dado de baja + no está bloqueado.
```

## Contacto excluido

Puede quedar excluido por:

```txt
missing_email
invalid_email
no_marketing_consent
unsubscribed
bounced
duplicated
suppressed
```

---

# 10. Conteos obligatorios del segmento

Cuando el usuario selecciona un segmento, la UI debe mostrar:

```txt
Contactos del segmento
Contactos elegibles
Contactos excluidos
```

Y detalle de exclusión:

```txt
Sin email
Email inválido
Sin consentimiento
Dados de baja
Rebotados
Duplicados
Bloqueados
```

Esto evita enviar campañas a ciegas.

---

# 11. Validaciones del formulario inicial

## Campos requeridos en Parte 1

```txt
name
campaign_type
segment_id
```

## Campos preparados para Parte 2

```txt
subject
preheader
body
cta_primary_label
cta_primary_url
```

## Validaciones

- nombre obligatorio;
- tipo de campaña válido;
- segmento obligatorio;
- segmento debe existir;
- segmento debe tener al menos un contacto elegible para pasar a `ready`;
- no permitir pasar a `ready` si no hay elegibles;
- no permitir envío en esta parte.

---

# 12. Vistas de esta parte

## 12.1 EmailMarketingPage

Vista principal del módulo.

Debe mostrar:

- título;
- descripción;
- botón crear campaña;
- listado de campañas;
- estado vacío.

Texto sugerido:

```txt
Email Marketing

Crea campañas segmentadas, mide aperturas, clics y conversiones, y mejora continuamente tus comunicaciones comerciales.
```

---

## 12.2 EmailCampaignList

Columnas iniciales:

```txt
Nombre | Tipo | Estado | Segmento | Elegibles | Excluidos | Última actualización | Acciones
```

Acciones:

- ver detalle;
- editar draft;
- duplicar futuro;
- ver métricas futuro.

---

## 12.3 EmailCampaignForm

Secciones iniciales:

1. Datos de campaña.
2. Tipo de campaña.
3. Segmento.
4. Elegibilidad.
5. Guardar borrador.

---

## 12.4 EmailSegmentSelector

Debe permitir:

- seleccionar segmento;
- recalcular segmento;
- ver elegibles;
- ver excluidos;
- ver razones de exclusión.

---

## 12.5 EmailCampaignDetail

Debe mostrar:

- nombre;
- tipo;
- estado;
- segmento;
- conteo elegibles/excluidos;
- fecha creación;
- eventos recientes;
- contenido pendiente si aún no está creado.

---

# 13. Estructura modular

Ubicación:

```txt
/src/modules/email-marketing
```

Estructura para Parte 1:

```txt
/modules/email-marketing
  /components
    EmailMarketingPage.tsx
    EmailCampaignList.tsx
    EmailCampaignDetail.tsx
    EmailCampaignStatusBadge.tsx
    EmailSegmentSelector.tsx
    EmailEligibilitySummary.tsx
    EmailEmptyState.tsx

  /forms
    EmailCampaignForm.tsx
    EmailCampaignAudienceForm.tsx

  /schemas
    emailCampaign.schema.ts
    emailSegment.schema.ts

  /services
    emailCampaign.service.ts
    emailSegment.service.ts
    emailEligibility.service.ts

  /events
    emailMarketing.events.ts

  /types
    emailMarketing.types.ts

  /tests
    emailCampaign.form.test.ts
    emailCampaign.schema.test.ts
    emailSegment.test.ts
    emailEligibility.test.ts
    emailPermissions.test.ts

  index.ts
```

---

# 14. Servicios de esta parte

## emailCampaign.service.ts

Métodos:

```ts
getCampaigns(filters)
getCampaignById(campaignId)
createCampaign(input)
updateCampaign(campaignId, input)
saveDraft(campaignId, input)
markCampaignReady(campaignId)
```

## emailSegment.service.ts

Métodos:

```ts
getSegments()
getSegmentById(segmentId)
calculateSegment(segmentId)
createDefaultSegments()
```

## emailEligibility.service.ts

Métodos:

```ts
getEligibleRecipients(segmentId)
getExcludedRecipients(segmentId)
calculateEligibility(segmentId)
getExclusionSummary(segmentId)
```

---

# 15. Eventos de esta parte

## Eventos requeridos

```txt
email_campaign_list_viewed
email_campaign_detail_viewed
email_campaign_create_started
email_campaign_created
email_campaign_updated
email_campaign_saved_as_draft
email_campaign_marked_ready
email_segment_selected
email_segment_calculated
email_segment_empty
email_recipients_eligibility_calculated
email_recipient_suppressed
```

## Eventos mínimos

```txt
email_campaign_list_viewed
email_campaign_created
email_campaign_updated
email_campaign_saved_as_draft
email_segment_selected
email_segment_calculated
email_recipients_eligibility_calculated
```

---

# 16. Payload ejemplo

## email_campaign_created

```json
{
  "event_type": "email_campaign_created",
  "event_name": "Campaña de email creada",
  "module": "email_marketing",
  "source": "upzy_admin",
  "channel": "email",
  "status": "success",
  "email_campaign_id": "uuid",
  "metadata": {
    "campaign_type": "promotional",
    "campaign_status": "draft",
    "segment_id": "uuid"
  }
}
```

## email_recipients_eligibility_calculated

```json
{
  "event_type": "email_recipients_eligibility_calculated",
  "event_name": "Elegibilidad de destinatarios calculada",
  "module": "email_marketing",
  "source": "upzy_admin",
  "channel": "email",
  "status": "success",
  "email_campaign_id": "uuid",
  "metadata": {
    "segment_id": "uuid",
    "contacts_total": 1200,
    "eligible": 950,
    "excluded": 250,
    "missing_email": 80,
    "no_marketing_consent": 120,
    "unsubscribed": 30,
    "bounced": 20
  }
}
```

---

# 17. Reglas anti-impacto

Esta parte de Email Marketing:

- no debe enviar campañas reales;
- no debe modificar Carrito Abandonado;
- no debe modificar Shopify;
- no debe modificar ContactForm;
- no debe modificar Dashboard directamente;
- no debe modificar Lumi;
- no debe modificar Modal;
- no debe modificar Ruleta;
- no debe crear Ads;
- no debe usar plantillas de carrito abandonado como campañas generales.

Debe:

- leer Contactos;
- calcular segmentos;
- calcular elegibles;
- registrar eventos;
- guardar campañas como borrador;
- dejar base para envío posterior.

---

# 18. Relación con Contactos

El módulo consume Contactos para:

- segmentar;
- validar email;
- validar consentimiento;
- excluir bajas;
- excluir rebotes;
- asociar campaña con destinatarios futuros.

No debe modificar datos del contacto salvo que se trate de eventos o futuras bajas controladas.

---

# 19. Relación con Dashboard

En esta parte, Dashboard podrá leer eventos como:

```txt
email_campaign_created
email_segment_calculated
```

Pero Email Marketing no debe modificar Dashboard directamente.

---

# 20. Estados vacíos

## Sin campañas

```txt
Aún no tienes campañas de email marketing.
Crea tu primera campaña para comunicar, nutrir o reactivar contactos.
```

## Sin segmentos

```txt
Aún no hay segmentos disponibles.
Crea segmentos desde la base de Contactos para preparar tus campañas.
```

## Segmento sin elegibles

```txt
El segmento seleccionado no tiene contactos elegibles para envío.
Revisa emails, consentimiento o exclusiones.
```

## Módulo apagado

```txt
El módulo Email Marketing no está activo en este ambiente.
```

## Sin permisos

```txt
No tienes permisos para acceder a Email Marketing.
```

---

# 21. Manejo de errores

## Error al crear campaña

```txt
No fue posible crear la campaña. Intenta nuevamente.
```

## Error de segmento

```txt
No fue posible calcular el segmento seleccionado.
```

## Error de validación

```txt
Revisa los campos marcados antes de continuar.
```

## Error de permisos

```txt
No tienes permisos para realizar esta acción.
```

---

# 22. Historias de usuario de esta parte

## US-05-P1-01 — Ver módulo Email Marketing

### Como
usuario de marketing,

### quiero
acceder al módulo Email Marketing,

### para
gestionar campañas comerciales por email.

### Criterios de aceptación

- Respeta `email_marketing_enabled`.
- Solo accede usuario con `email_marketing.view`.
- Muestra listado de campañas.
- Muestra estado vacío si no hay campañas.
- Registra `email_campaign_list_viewed`.

---

## US-05-P1-02 — Crear campaña en borrador

### Como
usuario de marketing,

### quiero
crear una campaña en borrador,

### para
preparar una comunicación antes de enviarla.

### Criterios de aceptación

- Usuario requiere `email_marketing.create`.
- Se valida nombre.
- Se valida tipo de campaña.
- Se valida segmento.
- Se guarda como `draft`.
- Se registra `email_campaign_created`.
- No se envía nada.

---

## US-05-P1-03 — Seleccionar segmento

### Como
usuario de marketing,

### quiero
seleccionar un segmento,

### para
definir la audiencia de la campaña.

### Criterios de aceptación

- Se muestran segmentos disponibles.
- Se puede seleccionar uno.
- Se calcula cantidad total.
- Se calcula cantidad elegible.
- Se calcula cantidad excluida.
- Se registra `email_segment_selected`.
- Se registra `email_segment_calculated`.

---

## US-05-P1-04 — Calcular elegibilidad de destinatarios

### Como
sistema UPZY,

### quiero
validar contactos elegibles y excluidos,

### para
evitar envíos a contactos inválidos o no autorizados.

### Criterios de aceptación

- Excluye contactos sin email.
- Excluye emails inválidos.
- Excluye contactos sin consentimiento si aplica.
- Excluye dados de baja.
- Excluye rebotados bloqueados.
- Excluye duplicados.
- Muestra resumen.
- Registra `email_recipients_eligibility_calculated`.

---

## US-05-P1-05 — Editar campaña en borrador

### Como
usuario de marketing,

### quiero
editar una campaña en borrador,

### para
ajustar datos antes de avanzar al contenido y envío.

### Criterios de aceptación

- Usuario requiere `email_marketing.edit`.
- Solo se puede editar campaña `draft`.
- Se guardan cambios.
- Se registra `email_campaign_updated`.
- No se permite editar campaña enviada.

---

## US-05-P1-06 — Marcar campaña como lista

### Como
usuario de marketing,

### quiero
marcar una campaña como lista,

### para
pasar a la etapa de contenido, preview y envío.

### Criterios de aceptación

- Debe tener nombre.
- Debe tener tipo.
- Debe tener segmento.
- Debe tener destinatarios elegibles.
- Si no cumple, muestra error.
- Se registra `email_campaign_marked_ready`.

---

# 23. Pruebas unitarias

## EmailCampaignForm

- renderiza campos;
- valida nombre requerido;
- valida tipo requerido;
- valida segmento requerido;
- guarda draft;
- no envía campaña;
- respeta permisos;
- respeta feature flag.

## EmailSegmentSelector

- muestra segmentos;
- selecciona segmento;
- recalcula segmento;
- muestra elegibles;
- muestra excluidos;
- maneja segmento vacío.

## Eligibility service

- excluye sin email;
- excluye email inválido;
- excluye sin consentimiento;
- excluye dado de baja;
- excluye rebotado;
- excluye duplicado;
- devuelve resumen correcto.

## Events

- registra campaña creada;
- registra segmento seleccionado;
- registra elegibilidad calculada;
- registra campaña actualizada.

---

# 24. Pruebas de integración

- Acceder a Email Marketing con flag activo.
- Bloquear acceso con flag apagado.
- Bloquear usuario sin permiso.
- Ver listado vacío.
- Crear campaña draft.
- Seleccionar segmento.
- Calcular elegibles.
- Calcular excluidos.
- Editar campaña.
- Marcar campaña como lista.
- Validar que no se envía email real.
- Validar que no afecta Carrito Abandonado.
- Validar que no afecta Shopify.
- Validar que no afecta Lumi, Modal ni Ruleta.

---

# 25. Checklist QA

- [ ] `email_marketing_enabled` controla acceso.
- [ ] Usuario sin permiso no accede.
- [ ] Usuario con permiso ve módulo.
- [ ] Listado de campañas carga.
- [ ] Estado vacío funciona.
- [ ] Se puede crear campaña draft.
- [ ] Se valida nombre.
- [ ] Se valida tipo.
- [ ] Se valida segmento.
- [ ] Se selecciona segmento.
- [ ] Se calcula total de contactos.
- [ ] Se calculan elegibles.
- [ ] Se calculan excluidos.
- [ ] Se muestran razones de exclusión.
- [ ] Se excluyen contactos sin email.
- [ ] Se excluyen emails inválidos.
- [ ] Se excluyen sin consentimiento.
- [ ] Se excluyen dados de baja.
- [ ] Se excluyen rebotados.
- [ ] Se excluyen duplicados.
- [ ] Se registra campaña creada.
- [ ] Se registra segmento calculado.
- [ ] Se registra elegibilidad calculada.
- [ ] Se puede editar draft.
- [ ] No se puede enviar campaña real.
- [ ] No se toca Carrito Abandonado.
- [ ] No se toca Shopify directamente.
- [ ] No se toca Lumi.
- [ ] No se toca Modal.
- [ ] No se toca Ruleta.
- [ ] Hay evidencia QA.

---

# 26. Definition of Done de esta parte

Esta parte queda terminada cuando:

- existe módulo Email Marketing;
- existe feature flag;
- existen permisos base;
- existe listado de campañas;
- existe formulario inicial;
- se puede crear campaña draft;
- se puede seleccionar segmento;
- se calculan elegibles;
- se calculan excluidos;
- se muestran razones de exclusión;
- se registran eventos;
- no se envían campañas reales;
- no se mezcla con Carrito Abandonado;
- no se modifica Shopify;
- hay pruebas unitarias;
- hay pruebas de integración;
- hay QA;
- está documentado.

---

# 27. Criterios para no aprobar

No se aprueba si:

- se puede enviar una campaña real en esta parte;
- no se validan segmentos;
- no se calculan elegibles;
- se envía a contactos sin consentimiento;
- se mezclan plantillas de Carrito Abandonado;
- no respeta permisos;
- no respeta feature flag;
- no registra eventos;
- rompe Contactos;
- rompe Dashboard;
- no hay pruebas.

---

# 28. Prompt sugerido para desarrollo asistido

```txt
Necesito implementar la Parte 1 del Sprint 5 de UPZY: Email Marketing — base del módulo, campañas y segmentos.

Contexto:
Ya existe Sprint 0 con arquitectura modular, formularios independientes, eventos centralizados, feature flags, permisos y Definition of Done.
Ya existe Sprint 1 con Contactos / CRM base.
Ya existe Sprint 2 con Dashboard base.
Ya existe Sprint 3 con Shopify / Funnel comercial.
Ya existe Sprint 4 con Carrito Abandonado.

Objetivo:
Crear la base del módulo Email Marketing sin activar envío real todavía. Esta parte debe permitir ver campañas, crear campaña en borrador, seleccionar segmento, calcular contactos elegibles y excluidos, y registrar eventos.

Antes de tocar código:
1. Revisa arquitectura modular.
2. Revisa Contactos.
3. Revisa Eventos y trackEvent.
4. Revisa Dashboard.
5. Revisa Shopify.
6. Revisa Carrito Abandonado para no mezclar dominios.
7. No refactorices funcionalidades existentes.
8. No envíes emails reales.
9. No actives Ads.
10. No modifiques Lumi, Modal ni Ruleta.

Alcance permitido:
- Crear módulo /email-marketing.
- Crear EmailMarketingPage.
- Crear EmailCampaignList.
- Crear EmailCampaignForm.
- Crear EmailCampaignAudienceForm.
- Crear EmailSegmentSelector.
- Crear EmailEligibilitySummary.
- Crear emailMarketing.types.
- Crear emailCampaign.schema.
- Crear emailSegment.schema.
- Crear emailCampaign.service.
- Crear emailSegment.service.
- Crear emailEligibility.service.
- Crear emailMarketing.events.
- Aplicar feature flag email_marketing_enabled.
- Aplicar permisos email_marketing.view, email_marketing.create, email_marketing.edit y email_marketing.view_metrics.
- Crear campaña en estado draft.
- Seleccionar segmento.
- Calcular contactos elegibles.
- Calcular contactos excluidos.
- Mostrar razones de exclusión.
- Registrar eventos.
- Crear pruebas unitarias e integración mínima.

Fuera de alcance:
- No enviar campañas reales.
- No enviar email de prueba todavía.
- No programar campañas todavía.
- No hacer tracking de apertura/clic todavía.
- No atribuir conversiones todavía.
- No crear A/B Testing todavía.
- No mezclar con Carrito Abandonado.
- No modificar Shopify directamente.
- No modificar ContactForm.
- No modificar Lumi, Modal ni Ruleta.

Eventos requeridos:
- email_campaign_list_viewed
- email_campaign_created
- email_campaign_updated
- email_campaign_saved_as_draft
- email_segment_selected
- email_segment_calculated
- email_recipients_eligibility_calculated

Reglas:
- Toda campaña nueva queda como draft.
- No se permite envío real.
- No se permite envío si no hay elegibles.
- Se deben excluir contactos sin email, sin consentimiento, dados de baja, rebotados, duplicados o bloqueados.
- Email Marketing debe estar separado de Carrito Abandonado.
- Dashboard solo leerá eventos, no debe ser modificado directamente.

Entregables:
1. Módulo Email Marketing creado.
2. Listado de campañas.
3. Formulario de campaña draft.
4. Selector de segmento.
5. Resumen de elegibilidad.
6. Servicios de campaña y segmento.
7. Eventos registrados.
8. Permisos aplicados.
9. Feature flag aplicado.
10. Pruebas unitarias.
11. Pruebas de integración.
12. Documentación actualizada.

Al finalizar:
- Explica qué archivos creaste.
- Explica qué archivos modificaste.
- Explica cómo se crea una campaña draft.
- Explica cómo se calculan elegibles y excluidos.
- Explica cómo se evita envío real en esta parte.
- Explica cómo se evita impacto con Carrito Abandonado, Shopify, Lumi, Modal y Ruleta.
```

---

# 29. Siguiente parte del Sprint 5

Una vez validada esta parte, seguimos con:

## Sprint 5 / Parte 2 — Contenido, preview y validación de campaña

Esa parte incluirá:

- asunto;
- preheader;
- cuerpo;
- CTA principal;
- CTA secundario;
- variables dinámicas;
- preview;
- link de baja;
- validaciones de contenido;
- envío de prueba controlado.

No se avanzará a envío real hasta validar contenido y preview.
