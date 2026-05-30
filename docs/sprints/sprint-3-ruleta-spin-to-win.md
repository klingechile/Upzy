# UPZY — Sprint 3 Ruleta / Spin to Win

## Objetivo

Construir el módulo de ruleta promocional de UPZY como mecanismo de captación, generación de cupón y conversión medible.

La ruleta no debe ser una pieza aislada de marketing. Debe operar sobre el contrato de captación definido en Sprint 2 y alimentar el CRM con eventos trazables.

---

## Resultado esperado

Al finalizar Sprint 3, UPZY debe permitir revisar visualmente la plantilla de ruleta, sus premios, reglas comerciales, datos solicitados, evento de cupón y entrada del lead al CRM.

La vista sigue usando datos mock. No se genera ni valida un cupón real en producción.

---

## Alcance funcional

### Incluido

- Ruta de revisión `/upzy` apuntando a Sprint 3.
- Página directa `/upzy-sprint3.html`.
- Vista de ruleta / Spin to Win.
- Preview visual de la ruleta.
- Configuración mock de premios.
- Reglas de negocio de participación.
- Contrato de datos del cupón.
- Timeline de eventos comerciales.
- Métricas de conversión de ruleta.
- Relación documentada con CRM, captación web y email marketing.

### No incluido

- Generación real de códigos únicos.
- Validación real de cupón en Shopify.
- Persistencia real en Supabase.
- Antifraude productivo.
- Integración real con email marketing.
- Publicación real del script en tienda.
- Segmentación real por comportamiento.

---

## Módulo funcional

```txt
Ruleta / Spin to Win
```

Responsabilidad:

```txt
Incentivar al visitante a entregar datos propios a cambio de un beneficio medible, generando lead, cupón y evento comercial.
```

---

## Componentes frontend

```txt
RouletteDashboard
RoulettePreview
RoulettePrizeCard
RouletteRulesPanel
RouletteCouponContract
RouletteEventTimeline
RouletteMetrics
```

---

## Flujo comercial

```txt
visitante entra al sitio
↓
trigger abre ruleta
↓
usuario ingresa email / teléfono
↓
usuario gira ruleta
↓
premio seleccionado
↓
cupón generado
↓
lead creado o enriquecido
↓
evento enviado al CRM
↓
email / WhatsApp puede recuperar o cerrar venta
```

---

## Eventos comerciales

```txt
roulette.opened
roulette.form_started
roulette.spin_started
roulette.spin_completed
coupon.generated
lead.created
lead.email_captured
lead.coupon_assigned
crm.lead_enriched
```

---

## Contrato de datos

```ts
type RouletteLead = {
  leadId: string;
  source: 'roulette';
  channel: 'web';
  name?: string;
  email: string;
  phone?: string;
  productInterest?: string;
  coupon: {
    code: string;
    prize: string;
    discountType: 'percentage' | 'fixed' | 'benefit';
    discountValue?: number;
    expiresAt: string;
  };
  consent: boolean;
  campaignId?: string;
  pageUrl?: string;
  createdAt: string;
};
```

---

## Reglas comerciales propuestas

1. La ruleta debe pedir email antes de revelar el premio.
2. El teléfono puede ser opcional, pero recomendado para WhatsApp.
3. El premio debe tener vigencia corta para impulsar conversión.
4. El producto de interés debe viajar si el usuario viene desde una página de producto.
5. Un usuario no debe poder girar infinitamente con el mismo email.
6. Todo premio debe generar un evento `coupon.generated`.
7. Todo cupón debe quedar asociado a un lead.
8. La ruleta debe poder apagarse por campaña, horario o stock.

---

## Premios mock Sprint 3

```txt
5% descuento
10% descuento
Impresión gratis
Despacho con tarifa preferente
Asesoría prioritaria
Agenda sala de ventas
```

---

## Relación con otros sprints

### Depende de Sprint 2 — Captación Web

Usa el mismo contrato base:

```txt
lead.created
lead.email_captured
producto_interes
consentimiento
```

### Habilita Sprint 4 — Email Marketing

El cupón puede disparar secuencias:

```txt
cupón generado
cupón no usado 24h
cupón por vencer
post compra
```

### Habilita Sprint 5 — Carritos Abandonados

Si el cliente abandona con cupón, se recupera con urgencia comercial.

---

## Criterios de aceptación

- `/upzy` carga Sprint 3.
- `/upzy-sprint3.html` existe como ruta directa.
- `/dashboard` sigue intacto.
- Se visualiza ruleta mock.
- Se visualizan premios configurados.
- Se visualizan reglas comerciales.
- Se visualiza contrato de cupón.
- Se visualiza timeline de eventos.
- Se documentan eventos comerciales.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 3 mantiene la ruleta como vista mock separada en archivos propios:

```txt
public/assets/upzy-roulette.css
public/assets/upzy-roulette.js
```

Esto evita acoplar la ruleta al módulo de captación o al CRM. La integración real debe hacerse mediante eventos y API.

---

## Próximo sprint

Sprint 4 debe implementar Email Marketing usando segmentos, plantillas y eventos como `coupon.generated`, `lead.email_captured` y `cart.abandoned_detected`.
