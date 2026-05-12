# Recuperación de carrito abandonado Shopify

Documento operativo para validar, activar, pausar y diagnosticar la recuperación de carritos abandonados de Shopify en Upzy/Klinge.

## Objetivo

Permitir que Upzy detecte checkouts/carritos de Shopify que no terminaron en compra y ejecute recuperación comercial por WhatsApp y/o email.

El control visual se muestra en el dashboard, dentro del módulo **Carritos** y también puede montarse en **Automatizaciones** si el script está cargado.

---

## Componentes involucrados

| Capa | Archivo / endpoint | Responsable |
|---|---|---|
| Webhook Shopify | `src/routes/webhook.shopify.js` | Claude |
| Detección cron | `src/jobs/carritos.js` | Claude |
| Servicio toggle | `src/services/cart-recovery.js` | Claude |
| API control | `/api/automations/cart-recovery` | Claude |
| UI control | `public/cart-recovery-control.js` | GPT |
| Documentación | `docs/CART_RECOVERY_SHOPIFY.md` | GPT |
| Script diagnóstico | `scripts/check-cart-recovery.js` | GPT |

---

## Flujo funcional

1. Shopify envía eventos al webhook `/webhook/shopify`.
2. Upzy registra eventos de checkout/carro en Supabase.
3. El cron de carritos revisa eventos antiguos según el delay configurado.
4. Si no existe orden pagada/asociada, marca abandono.
5. Si la recuperación está activa, envía mensaje por WhatsApp y/o email.
6. Actualiza el estado de recuperación en Supabase.

---

## Toggle de activación

El estado se controla desde:

```http
GET /api/automations/cart-recovery
PATCH /api/automations/cart-recovery
POST /api/automations/cart-recovery/run
```

### Consultar estado

```bash
curl -s https://upzy-production.up.railway.app/api/automations/cart-recovery
```

Respuesta esperada:

```json
{
  "ok": true,
  "activo": true,
  "delay_minutes": 60,
  "stats": {
    "pending_abandoned": 0,
    "pending_checkouts": 0,
    "last_abandoned_at": null,
    "errors": []
  },
  "shopify": {
    "enabled": true,
    "store_url": "klingecl.myshopify.com",
    "webhook_secret_configured": true,
    "skip_verify": false
  },
  "channels": {
    "whatsapp": true,
    "email": true
  }
}
```

### Activar recuperación

```bash
curl -X PATCH https://upzy-production.up.railway.app/api/automations/cart-recovery \
  -H "Content-Type: application/json" \
  -d '{"activo":true}'
```

### Desactivar recuperación

```bash
curl -X PATCH https://upzy-production.up.railway.app/api/automations/cart-recovery \
  -H "Content-Type: application/json" \
  -d '{"activo":false}'
```

### Ejecutar revisión manual urgente

```bash
curl -X POST https://upzy-production.up.railway.app/api/automations/cart-recovery/run
```

Este endpoint dispara la revisión de carritos sin esperar el cron.

---

## Variables Railway relevantes

| Variable | Uso | Obligatoria |
|---|---|---|
| `SHOPIFY_STORE_URL` | Activa integración Shopify | Sí |
| `SHOPIFY_WEBHOOK_SECRET` | Verificación HMAC del webhook | Recomendado producción |
| `SHOPIFY_SKIP_WEBHOOK_VERIFY` | Saltar verificación HMAC para pruebas | Solo testing |
| `SHOPIFY_ABANDONED_CART_MINUTES` | Delay antes de considerar abandono | Opcional |
| `WA_TOKEN` | Envío WhatsApp Cloud API | Si se usa WhatsApp |
| `WA_PHONE_ID` | Phone ID WhatsApp | Si se usa WhatsApp |
| `EMAIL_FROM` | Habilita email | Si se usa email |
| `AWS_ACCESS_KEY_ID` | AWS SES | Si se usa SES |
| `AWS_SECRET_ACCESS_KEY` | AWS SES | Si se usa SES |
| `AWS_REGION` | Región SES | Si se usa SES |

---

## Validación en dashboard

1. Abrir `/dashboard`.
2. Ir al módulo **Carritos**.
3. Revisar panel **Shopify · Carrito abandonado**.
4. Validar:
   - Estado activo/pausado.
   - Delay configurado.
   - Checkouts a evaluar.
   - Abandonados pendientes.
   - Canales activos.
   - Estado Shopify.
5. Probar botón **Actualizar**.
6. Probar botón **Ejecutar ahora** si la recuperación está activa.
7. Probar botón **Activar/Desactivar**.

---

## Estados esperados

### Activo

La recuperación procesa eventos de checkout/carro y puede enviar recuperación.

### Pausado

El webhook puede recibir eventos, pero la recuperación comercial no debe ejecutarse.

### Shopify OFF

Normalmente indica que falta `SHOPIFY_STORE_URL` o la configuración no se cargó.

### Canales OFF

No hay WhatsApp ni email habilitado. Upzy puede detectar el abandono, pero no tiene canal para contactar.

---

## Diagnóstico rápido

Ejecutar:

```bash
node scripts/check-cart-recovery.js https://upzy-production.up.railway.app
```

También se puede usar:

```bash
UPZY_BASE_URL=https://upzy-production.up.railway.app node scripts/check-cart-recovery.js
```

---

## Problemas comunes

### El panel no aparece en dashboard

Revisar:

- Que `cart-recovery-control.js` esté cargado por el dashboard.
- Que exista el contenedor `vw-carritos`.
- Que no haya errores JS en consola.
- Que el archivo público responda:

```bash
curl -I https://upzy-production.up.railway.app/cart-recovery-control.js
```

### El panel aparece pero no carga datos

Revisar:

```bash
curl https://upzy-production.up.railway.app/api/automations/cart-recovery
```

Si devuelve error 404, falta la ruta backend.

Si devuelve 500, revisar logs Railway y Supabase.

### No se detectan carritos

Revisar:

- Webhook Shopify configurado.
- Eventos `checkouts/create`, `checkouts/update`, `carts/create`, `carts/update`.
- `SHOPIFY_WEBHOOK_SECRET` correcto.
- `SHOPIFY_SKIP_WEBHOOK_VERIFY=true` solo para pruebas.
- Tabla `upzy_eventos_shopify` con eventos recientes.

### Detecta carritos pero no envía

Revisar:

- Toggle activo.
- WhatsApp habilitado (`WA_TOKEN`, `WA_PHONE_ID`).
- Email habilitado (`EMAIL_FROM`, SES). 
- Teléfono/email presente en el checkout.
- Logs de `src/jobs/carritos.js`.

---

## Checklist de producción

```txt
[ ] /health responde OK
[ ] /api/automations/cart-recovery responde OK
[ ] Shopify enabled = true
[ ] Webhook secret configurado
[ ] Toggle activo
[ ] Delay configurado
[ ] WhatsApp o email activo
[ ] Dashboard muestra el control
[ ] Ejecutar ahora no devuelve error
[ ] Railway sin errores en logs
```

---

## Ownership

Cambios visuales o documentación:

```txt
public/cart-recovery-control.js
docs/CART_RECOVERY_SHOPIFY.md
scripts/check-cart-recovery.js
```

Responsable: GPT.

Cambios backend o base de datos:

```txt
src/routes/api.automations.js
src/routes/webhook.shopify.js
src/services/cart-recovery.js
src/jobs/carritos.js
database/
```

Responsable: Claude.
