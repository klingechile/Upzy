# Shopify — Crear Webhooks Manualmente

Ir a: **Shopify Admin → Settings → Notifications → Webhooks**

Crear estos 4 webhooks:

| Evento | URL | Formato |
|---|---|---|
| Order creation | `https://lumi-klinge-bot-production.up.railway.app/webhook/shopify` | JSON |
| Order payment | `https://lumi-klinge-bot-production.up.railway.app/webhook/shopify` | JSON |
| Checkout creation | `https://lumi-klinge-bot-production.up.railway.app/webhook/shopify` | JSON |
| Checkout update | `https://lumi-klinge-bot-production.up.railway.app/webhook/shopify` | JSON |

Al crear el primer webhook, Shopify muestra el **Signing secret**.
Copiarlo y verificar que en Railway esté:
`SHOPIFY_WEBHOOK_SECRET=ese_valor`

> Nota: `SHOPIFY_SKIP_WEBHOOK_VERIFY=true` ya existe en Railway
> Cambiarlo a `false` una vez que los webhooks estén creados y el secret esté configurado.
