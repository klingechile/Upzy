# UPZY — Sprint 13 Carritos Abandonados Reales + Modelo de Eventos

## Objetivo

Conectar el módulo de Carritos Abandonados a datos reales y empezar a consolidar el modelo de eventos comerciales de UPZY.

Sprint 13 toma la base existente de Shopify, `upzy_eventos_shopify`, `upzy_carritos_pendientes`, scoring y cron de abandono, y la expone en una API clara para frontend, automatizaciones y reportes.

---

## Estado técnico base

Ya existe:

```txt
/webhook/shopify
src/jobs/carritos.js
src/services/scoring.js
upzy_eventos_shopify
upzy_carritos_pendientes
GET /api/leads/carritos
```

El webhook Shopify ya mapea:

```txt
orders/create      → order_created
orders/paid        → order_paid
checkouts/create   → checkout_created
checkouts/update   → checkout_updated
carts/create       → checkout_created
carts/update       → checkout_updated
```

El cron ya puede detectar abandono y crear:

```txt
checkout_abandoned
```

---

## Resultado esperado

Al finalizar Sprint 13, UPZY debe permitir revisar:

- Ruta viva `/upzy` apuntando a Sprint 13.
- Página directa `/upzy-sprint13.html`.
- Vista de carritos abandonados reales.
- API protegida `GET /api/carts/abandoned`.
- API protegida `PATCH /api/carts/:id/status`.
- API protegida `POST /api/events` como base de eventos comerciales.
- Estados `loading`, `live`, `empty`, `error`, `mock fallback`.
- Métricas reales básicas de carritos.
- Acciones de marcar recuperado o expirado.
- Timeline de eventos Shopify/comerciales.

---

## Endpoints Sprint 13

### GET /api/carts/abandoned

Devuelve carritos pendientes/reales desde la vista o tabla disponible.

Respuesta normalizada:

```ts
type AbandonedCartApiItem = {
  id: string;
  lead_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  monto?: number;
  checkout_url?: string;
  productos?: Array<{ title: string; quantity: number; price: number }>;
  estado?: string;
  recuperacion_estado?: string;
  created_at?: string;
};
```

---

### PATCH /api/carts/:id/status

Permite marcar un carrito como:

```txt
recuperado
expirado
pendiente
```

La acción debe registrar evento comercial.

---

### POST /api/events

Base mínima para eventos comerciales internos:

```json
{
  "event_type": "cart.recovered",
  "source_module": "carts",
  "entity_type": "cart",
  "entity_id": "cart_id",
  "payload": {}
}
```

Si la tabla formal de eventos no existe, el endpoint debe responder sin romper y dejar log server-side. La persistencia fuerte se consolida en Sprint 15.

---

## Eventos Sprint 13

```txt
cart.abandoned_detected
cart.recovery_started
cart.recovered
cart.expired
cart.status_updated
shopify.checkout_created
shopify.checkout_updated
shopify.order_paid
```

---

## Reglas comerciales

1. Todo carrito debe intentar vincularse a un lead.
2. Todo carrito debe conservar monto, productos y checkout_url si existe.
3. Carritos con email o teléfono son prioridad comercial.
4. Un carrito marcado recuperado debe salir del backlog pendiente.
5. Un carrito expirado debe quedar auditable, no eliminado.
6. Las acciones manuales deben generar evento.
7. El frontend no consulta Supabase directo.
8. Si no hay datos reales, la UI debe mostrar empty o fallback, no romper.

---

## Relación con sprints anteriores

### Depende de Sprint 11

Usa autenticación frontend y cliente API seguro.

### Depende de Sprint 12

Usa leads reales creados desde captación para vincular intención de compra.

### Habilita Sprint 14

Permite que Email Marketing y Automatizaciones trabajen sobre carritos reales.

### Habilita Sprint 15

Entrega eventos base para reportes reales y atribución.

---

## Criterios de aceptación

- `/upzy` carga Sprint 13.
- `/upzy-sprint13.html` existe.
- `GET /api/carts/abandoned` responde con carritos reales o lista vacía.
- `PATCH /api/carts/:id/status` permite actualizar estado.
- `POST /api/events` existe como base.
- La UI muestra métricas y lista de carritos.
- La UI permite marcar recuperado/expirado.
- No se expone service role.
- No se modifica `package.json`.
- Sprint 11 y Sprint 12 siguen accesibles como históricos.

---

## Próximo sprint

Sprint 14 debe conectar Email Marketing + Automatizaciones sobre datos reales:

```txt
GET /api/templates
GET /api/automations
POST /api/automations/:id/run
cart.recovered
cart.expired
lead.email_captured
```
