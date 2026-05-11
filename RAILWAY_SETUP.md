# Railway — Configuración de Variables (Secrets)

Todas las variables van en Railway > Project > Variables.
**Nunca en el código. Nunca en .env subido a GitHub.**

---

## Variables REQUERIDAS (la app no arranca sin estas)

| Variable | Cómo obtenerla |
|---|---|
| `TENANT_ID` | Escribe `klinge` (texto fijo por ahora) |
| `SUPABASE_URL` | Supabase > Settings > API > Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role (secret) |
| `ANTHROPIC_API_KEY` | console.anthropic.com > API Keys |

---

## Variables de canales (agregar según lo que uses)

### WhatsApp — Evolution API
| Variable | Valor |
|---|---|
| `EVOLUTION_API_URL` | URL de tu servidor Evolution (ej: `https://tu-evolution.railway.app`) |
| `EVOLUTION_API_KEY` | API Key global de Evolution |
| `EVOLUTION_INSTANCE` | Nombre de la instancia configurada en Evolution |

### Instagram — Meta
| Variable | Cómo obtenerla |
|---|---|
| `IG_ACCESS_TOKEN` | Meta Developers > App > Instagram > Access Token (larga duración) |
| `IG_PAGE_ID` | ID de la página de Facebook vinculada |
| `IG_BUSINESS_ACCOUNT_ID` | `17841401601485577` (ID de klinge.cl) |
| `IG_VERIFY_TOKEN` | Invéntalo tú (ej: `upzy_ig_klinge_2026`) — debe coincidir con el que pones en Meta Developers al configurar el webhook |

### Shopify
| Variable | Cómo obtenerla |
|---|---|
| `SHOPIFY_DOMAIN` | `klingecl.myshopify.com` |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify Admin > Settings > Notifications > Webhooks > (al crear el webhook muestra el secret) |

---

## Variables opcionales

| Variable | Para qué |
|---|---|
| `ELEVENLABS_API_KEY` | Voz de Lumi |
| `ELEVENLABS_VOICE_ID` | ID de la voz en ElevenLabs |
| `RESEND_API_KEY` | Email marketing (Fase 3) |
| `RESEND_FROM_EMAIL` | `hola@upzy.app` |
| `ANTHROPIC_MODEL` | Dejar vacío (usa claude-sonnet-4 por defecto) |
| `INTERNAL_WEBHOOK_URL` | Slack/Discord para alertas internas |

---

## Cómo agregar en Railway

1. Ir a tu proyecto en railway.app
2. Click en el servicio `upzy-bot`
3. Tab **Variables**
4. Click **+ New Variable**
5. Agregar cada par `NOMBRE` = `valor`
6. Railway hace redeploy automático al guardar

> 💡 También puedes ir a **Raw Editor** y pegar todas de una vez en formato `KEY=value`

---

## Verificar que todo está bien

Después del deploy, visitar:

```
https://tu-app.railway.app/health
```

Debe devolver algo así:
```json
{
  "status": "ok",
  "tenant": "klinge",
  "channels": {
    "whatsapp": true,
    "instagram": true,
    "shopify": true
  }
}
```

Si algún canal aparece en `false`, la variable de ese canal no está configurada.

---

## Si el deploy falla al arrancar

Railway muestra los logs en tiempo real. Los errores del validador se ven así:

```
❌ Variables de entorno requeridas no encontradas:
   • SUPABASE_SERVICE_ROLE_KEY
   • ANTHROPIC_API_KEY

→ Agrégalas en Railway: Project > Variables
```

Solo hay que agregar la variable que falta y Railway hace redeploy automático.

---

## Variables que DEBES verificar en Railway ahora mismo

| Variable | Valor correcto |
|---|---|
| `NODE_ENV` | `production` |
| `PUBLIC_URL` | `https://upzy-production.up.railway.app` |

