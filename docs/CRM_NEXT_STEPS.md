# Próximos pasos CRM 360 sin cotizaciones

Este documento define el siguiente movimiento para convertir Upzy/Klinge en un CRM multicanal profesional, dejando el módulo de cotizaciones fuera por ahora.

## Decisión

Se deja de lado el módulo de cotizaciones en esta fase.

El foco inmediato será:

1. Ficha 360 del cliente.
2. Tareas y próximos seguimientos.
3. Segmentación comercial.
4. Campañas multicanal.
5. Dashboard ejecutivo de conversión.

---

## Fase actual: CRM 360

### Objetivo

Tener una vista única del cliente que permita vender mejor, responder más rápido y no perder seguimientos.

### Incluye

- Lista de leads/clientes.
- Ficha comercial 360.
- Score y segmento.
- Canal de origen.
- Etapa del funnel.
- Datos de contacto.
- Última interacción.
- Timeline comercial básico.
- Tareas manuales de seguimiento.
- Indicadores de tareas pendientes y vencidas.

### Implementación inicial

Archivo frontend:

```txt
public/crm-360.js
```

Características:

- Se inyecta en dashboard.
- Agrega navegación `CRM 360`.
- Consume `/api/leads`.
- Usa tareas locales en `localStorage` como primera versión.
- No toca base de datos todavía.

---

## Por qué tareas locales primero

Como Claude está inactiva, se evita tocar backend y base de datos.

La versión actual permite validar UX y flujo comercial sin bloquearse.

Luego debe migrarse a persistencia real en Supabase.

---

## Backend pendiente para convertir tareas en reales

Cuando se active backend, crear:

```txt
src/routes/api.tasks.js
src/services/tasks.js
database/migrations/upzy_tasks.sql
```

Tabla sugerida:

```sql
create table upzy_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  lead_id uuid not null,
  titulo text not null,
  nota text,
  tipo text default 'seguimiento',
  prioridad text default 'media',
  estado text default 'pendiente',
  fecha timestamptz,
  assigned_to text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  done_at timestamptz
);
```

Endpoints sugeridos:

```http
GET /api/tasks
POST /api/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

---

## Siguiente fase: segmentación dinámica

Segmentos prioritarios:

```txt
HOT sin tarea pendiente
HOT sin respuesta 24h
Carritos abandonados últimos 7 días
Cotización pendiente — futuro
Clientes compraron hace 7 días
Clientes sin reseña
Clientes fríos 30 días
Leads con email pero sin WhatsApp
Leads con WhatsApp pero sin email
```

---

## Siguiente fase: campañas multicanal

Campaña debe permitir:

```txt
Audiencia
Canal principal
Canal secundario
Plantilla
Fecha envío
Estado
Métricas
```

Canales:

```txt
Email
WhatsApp
Instagram DM
```

Regla de fallback:

```txt
Si email falla → WhatsApp
Si WhatsApp no existe → Instagram
Si no hay canal → crear tarea manual
```

---

## Siguiente fase: dashboard ejecutivo

KPIs recomendados:

```txt
Leads nuevos
Leads HOT
Tareas vencidas
Tiempo promedio de respuesta
Carritos recuperados
Monto recuperado
Emails enviados
Aperturas
Clicks
Respuestas WhatsApp
Conversión por canal
Conversión por etapa
```

---

## Validación actual

Después del deploy:

```txt
[ ] /dashboard carga
[ ] Aparece menú CRM 360
[ ] CRM 360 carga leads desde /api/leads
[ ] Seleccionar lead muestra ficha
[ ] Crear tarea funciona
[ ] Marcar tarea como hecha funciona
[ ] Botón flotante Estado funciona
[ ] Panel Carritos sigue funcionando
```

---

## Ownership

GPT:

```txt
public/crm-360.js
docs/CRM_NEXT_STEPS.md
scripts/check-crm-core.js
```

Backend futuro:

```txt
src/routes/api.tasks.js
src/services/tasks.js
database/
```

Requiere emergencia backend o Claude.
