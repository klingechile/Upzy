# UPZY — Sprint 12 Captación Web + Leads Reales

## Objetivo

Conectar Captación Web a BD real para que el modal/formulario pueda crear o actualizar leads en `upzy_leads` sin exponer credenciales Supabase en frontend.

Sprint 12 convierte la captación desde mock a beta operativa. El primer caso de uso queda intencionalmente simple: capturar email desde un modal web, registrar origen y crear un lead frío/nuevo en CRM.

---

## Decisión funcional

El modal inicial debe pedir solo email para reducir fricción.

```txt
Campo requerido: email
Campos opcionales: nombre, teléfono, tipo de negocio, producto de interés, origen, campaña
```

Esto mantiene la lógica comercial definida: primero captar contacto, luego enriquecer por CRM, email marketing, Lumi o automatizaciones.

---

## Resultado esperado

Al finalizar Sprint 12, UPZY debe permitir revisar:

- Ruta viva `/upzy` apuntando a Sprint 12.
- Página directa `/upzy-sprint12.html`.
- Modal de captación con envío real a backend.
- Endpoint público controlado `POST /api/capture/leads`.
- Inserción/upsert en `upzy_leads`.
- Validación básica de email.
- Estados `idle`, `loading`, `success`, `error`.
- Fallback visual sin romper la demo.
- Registro del lead con canal `web` y etapa `nuevo`.

---

## Endpoint nuevo

```txt
POST /api/capture/leads
```

Body mínimo:

```json
{
  "email": "cliente@dominio.cl"
}
```

Body extendido:

```json
{
  "email": "cliente@dominio.cl",
  "nombre": "Cliente",
  "telefono": "56900000000",
  "tipo_negocio": "cafeteria",
  "producto_interes": "Panel LED 80x120",
  "source": "modal_home",
  "campaign": "captacion_web"
}
```

---

## Mapeo a BD

Tabla:

```txt
upzy_leads
```

Campos usados:

```txt
tenant_id
nombre
telefono
email
tipo_negocio
canal
canal_id
score
segmento
etapa
notas
```

Valores por defecto:

```txt
canal = web
canal_id = email
score = 1
segmento = cold
etapa = nuevo
```

---

## Seguridad

El frontend no consulta Supabase directamente.

```txt
Frontend → POST /api/capture/leads → Backend → Supabase service role server-side
```

El endpoint es público porque se usará desde un modal web. Por eso incluye:

- Validación de email.
- Normalización de teléfono.
- Honeypot opcional `website`.
- Payload acotado.
- Upsert por `tenant_id, canal, canal_id`.

---

## Eventos asociados

```txt
capture.lead_submitted
capture.lead_created
capture.lead_updated
crm.lead_created
lead.email_captured
```

El registro formal en `upzy_events` queda pendiente para Sprint 13/15, cuando se estabilice el modelo de eventos.

---

## Criterios de aceptación

- `/upzy` carga Sprint 12.
- `/upzy-sprint12.html` existe.
- `POST /api/capture/leads` existe.
- El formulario puede crear/actualizar un lead real con email.
- El email se guarda en `upzy_leads`.
- El lead queda con `canal = web`, `segmento = cold`, `etapa = nuevo`.
- La UI muestra éxito o error.
- No se expone service role en frontend.
- No se modifica `package.json`.
- Login y Sprint 11 siguen disponibles como histórico.

---

## Próximo sprint

Sprint 13 debe conectar Carritos Abandonados reales y consolidar el modelo de eventos:

```txt
GET /api/carts/abandoned
POST /api/events
cart.abandoned_detected
cart.recovered
```
