# Troubleshooting operativo Upzy/Klinge

Guía rápida para diagnosticar errores de dashboard, plantillas, email, Shopify y despliegue en Railway.

## Orden recomendado

1. Verificar `/health`.
2. Verificar consola del navegador.
3. Probar endpoint API directo.
4. Revisar Railway logs.
5. Revisar variables Railway.
6. Confirmar si el problema es frontend o backend.
7. Respetar ownership antes de tocar archivos.

---

## Health check

```bash
curl https://upzy-production.up.railway.app/health
```

Si no responde, revisar Railway antes de tocar frontend.

Variables críticas de arranque:

```txt
TENANT_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## Dashboard no carga o se ve borroso

Validar archivos públicos:

```bash
curl -I https://upzy-production.up.railway.app/dashboard
curl -I https://upzy-production.up.railway.app/cart-recovery-control.js
curl -I https://upzy-production.up.railway.app/templates-conversion.js
```

Revisar en navegador:

- DevTools > Console.
- DevTools > Network.
- Archivos JS con 404.
- Errores de sintaxis.
- Endpoints API con 500.

Ownership visual: GPT.

---

## Plantillas no cargan

```bash
curl https://upzy-production.up.railway.app/api/templates
```

Si devuelve 404: falta ruta backend.

Si devuelve 500: revisar Supabase, `TENANT_ID` y logs Railway.

Si carga pero se ve mal: revisar `public/templates-conversion.js` o el módulo nativo de `public/dashboard.html`.

---

## Emails sin branding Klinge

Validar branding:

```bash
curl https://upzy-production.up.railway.app/api/email/branding
```

Validar preview branded:

```bash
curl -X POST https://upzy-production.up.railway.app/api/email/preview-branded \
  -H "Content-Type: application/json" \
  -d '{"categoria":"bienvenida","datos":{"nombre":"Carlos","empresa":"Klinge"}}'
```

Colores correctos Klinge:

```txt
Negro: #111111
Rojo:  #C0392B
Blanco: #FFFFFF
```

Si aparecen colores antiguos como `#3fb950`, corregir branding en tenant/Supabase o en `src/services/email-templates.js`.

Ownership backend email: Claude.

Ownership diagnóstico/docs/scripts: GPT.

---

## Email de prueba falla

Endpoint de prueba:

```bash
curl -X POST https://upzy-production.up.railway.app/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"template_id":"ID_TEMPLATE","destinatarios":["contacto@klinge.cl"],"datos":{"nombre":"Carlos"}}'
```

Variables relevantes:

```txt
EMAIL_FROM
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_SES_FROM_EMAIL
AWS_SES_FROM_NAME
```

Problemas comunes:

- SES sandbox.
- Email remitente no verificado.
- Región incorrecta.
- Credenciales IAM sin permisos SES.
- Template sin asunto.

---

## Carrito abandonado Shopify

Estado:

```bash
curl https://upzy-production.up.railway.app/api/automations/cart-recovery
```

Activar:

```bash
curl -X PATCH https://upzy-production.up.railway.app/api/automations/cart-recovery \
  -H "Content-Type: application/json" \
  -d '{"activo":true}'
```

Ejecutar ahora:

```bash
curl -X POST https://upzy-production.up.railway.app/api/automations/cart-recovery/run
```

Revisar:

```txt
SHOPIFY_STORE_URL
SHOPIFY_WEBHOOK_SECRET
SHOPIFY_SKIP_WEBHOOK_VERIFY
SHOPIFY_ABANDONED_CART_MINUTES
WA_TOKEN
WA_PHONE_ID
EMAIL_FROM
```

Más detalle: `docs/CART_RECOVERY_SHOPIFY.md`.

---

## Webhook Shopify Unauthorized

Causa probable: HMAC inválido.

Revisar:

```txt
SHOPIFY_WEBHOOK_SECRET
SHOPIFY_SKIP_WEBHOOK_VERIFY
```

Para pruebas temporales:

```txt
SHOPIFY_SKIP_WEBHOOK_VERIFY=true
```

No dejarlo así en producción estable.

---

## WhatsApp no envía

Revisar:

```txt
WA_TOKEN
WA_PHONE_ID
VERIFY_TOKEN
WHATSAPP_TEMPLATE_LANGUAGE
WHATSAPP_ABANDONED_CART_TEMPLATE
```

Validar:

- Token vigente.
- Phone ID correcto.
- Número en formato internacional.
- Plantilla aprobada si es mensaje proactivo.

---

## Error de deploy npm ci

Causas comunes:

- `package.json` y `package-lock.json` desalineados.
- Dependencia requiere Node superior.
- `engines.node` incorrecto.
- `.nvmrc` incompatible.

Comandos locales:

```bash
npm install
npm ci
npm run verify
```

Archivos sensibles:

```txt
package.json
package-lock.json
.nvmrc
railway.json
```

Requieren bloqueo manual.

---

## Cómo saber si es frontend o backend

Backend si:

- `/health` no responde.
- API devuelve 500.
- Railway tiene errores.
- Supabase devuelve error.

Frontend si:

- `/health` OK.
- API OK.
- Dashboard se ve mal.
- Hay error JS en consola.
- Cards, previews o estilos fallan.

---

## Ownership rápido

GPT:

```txt
public/
docs/
tests/
scripts/
```

Claude:

```txt
src/services/
src/routes/
src/config/
src/db/
database/
```

Bloqueo manual:

```txt
index.js
package.json
package-lock.json
.nvmrc
railway.json
.env.example
README.md
```
