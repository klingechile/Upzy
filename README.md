# Upzy Bot

Sistema de comunicaciones inteligente para negocios.  
WhatsApp · Instagram · Shopify · IA · CRM

---

## Stack

- **Runtime**: Node.js 18+ / Express
- **Deploy**: Railway
- **DB**: Supabase (PostgreSQL)
- **IA**: Claude Sonnet (Anthropic)
- **WhatsApp**: Evolution API
- **Instagram**: Meta Graph API v25.0
- **E-commerce**: Shopify Webhooks

---

## Setup rápido

```bash
# 1. Clonar
git clone https://github.com/TU_ORG/upzy-bot.git
cd upzy-bot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Ejecutar schema en Supabase
# Ir a Supabase > SQL Editor y pegar el contenido de:
# database/schema.sql

# 5. Correr en desarrollo
npm run dev
```

---

## Variables de entorno

Ver `.env.example` para la lista completa y documentada.

Las críticas:

| Variable | Descripción |
|---|---|
| `TENANT_ID` | ID del tenant (piloto: `klinge`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role de Supabase |
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `EVOLUTION_API_URL` | URL de tu instancia Evolution API |
| `IG_ACCESS_TOKEN` | Token de acceso Meta / Instagram |
| `SHOPIFY_WEBHOOK_SECRET` | Secret para verificar firma Shopify |

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servicio |
| `POST` | `/webhook/whatsapp` | Webhook Evolution API |
| `GET/POST` | `/webhook/instagram` | Webhook Meta (verificación + mensajes) |
| `POST` | `/webhook/shopify` | Webhook Shopify |
| `GET` | `/api/leads` | Lista todos los leads |
| `GET` | `/api/leads/estadisticas` | Resumen para el dashboard |
| `GET` | `/api/leads/carritos` | Carritos abandonados pendientes |
| `GET` | `/api/leads/:id` | Detalle de un lead |
| `PATCH` | `/api/leads/:id` | Actualizar etapa, notas, asignación |
| `POST` | `/api/leads/:id/score` | Ajuste manual de score |
| `POST` | `/api/leads/:id/asignar-agente` | Pasar conversación a agente |
| `GET` | `/api/campanas` | Lista campañas |
| `POST` | `/api/campanas` | Crear y enviar campaña |

---

## Estructura

```
upzy-bot/
├── index.js                    ← Entry point + cron jobs
├── src/
│   ├── db/
│   │   └── supabase.js         ← Cliente Supabase singleton
│   ├── services/
│   │   ├── scoring.js          ← Motor de scoring y segmentación
│   │   ├── ai.js               ← Wrapper Claude (Lumi)
│   │   ├── whatsapp.js         ← Wrapper Evolution API
│   │   └── instagram.js        ← Wrapper Meta Graph API
│   ├── routes/
│   │   ├── webhook.whatsapp.js
│   │   ├── webhook.instagram.js
│   │   ├── webhook.shopify.js
│   │   ├── api.leads.js
│   │   └── api.campanas.js
│   └── jobs/
│       ├── carritos.js         ← Detección abandono cada 15 min
│       └── scoring-decay.js    ← Degradar leads fríos cada noche
└── database/
    └── schema.sql              ← Schema Supabase completo
```

---

## Deploy en Railway

1. Crear proyecto en railway.app
2. Conectar este repositorio
3. Agregar variables de entorno en Railway > Variables
4. Railway detecta `npm start` automáticamente

**Importante**: las variables de entorno van en Railway, NO en el código.

---

## Piloto

Tenant activo: **Klinge** (`TENANT_ID=klinge`)  
Dominio Shopify: `klingecl.myshopify.com`  
Cuenta IG: `@klinge.cl`
