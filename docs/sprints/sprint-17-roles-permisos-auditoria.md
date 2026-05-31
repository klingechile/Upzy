# UPZY — Sprint 17 Roles, Permisos y Auditoría

## Objetivo

Proteger la beta operativa antes de abrirla a más usuarios mediante roles mínimos, permisos por módulo, auditoría de acciones críticas y trazabilidad operacional.

Sprint 17 no agrega nuevos módulos comerciales. Agrega control, seguridad y trazabilidad sobre lo ya construido.

---

## Resultado esperado

Al finalizar Sprint 17, UPZY debe permitir revisar:

- Ruta viva `/upzy` apuntando a Sprint 17.
- Página directa `/upzy-sprint17.html`.
- Endpoint protegido `GET /api/users` para administración de usuarios.
- Endpoint protegido `PATCH /api/users/:id` para rol/estado.
- Endpoint protegido `GET /api/audit/logs`.
- Endpoint protegido `POST /api/audit/logs`.
- Auditoría best-effort en acciones críticas.
- Matriz de permisos visible.
- Vista de usuarios y roles.
- Timeline de auditoría.
- Warnings si `upzy_audit_logs` no existe.

---

## Roles beta

```txt
admin
agente
viewer
```

### admin

Puede:

```txt
Ver todo
Cambiar roles
Activar/desactivar usuarios
Ejecutar automatizaciones
Ver auditoría
Ver reportes
Operar carritos
Operar CRM
```

### agente

Puede:

```txt
Ver CRM
Operar leads
Operar carritos
Ver reportes básicos
No puede cambiar roles
No puede ver auditoría completa
```

### viewer

Puede:

```txt
Ver reportes
Ver estado beta
Solo lectura
No puede ejecutar acciones críticas
```

---

## Endpoints Sprint 17

### GET /api/users

Protegido por:

```txt
requireAuth + requireRole('admin')
```

Devuelve usuarios de `upzy_users` del tenant actual.

---

### PATCH /api/users/:id

Protegido por:

```txt
requireAuth + requireRole('admin')
```

Permite cambiar:

```txt
rol
activo
nombre
```

Acción auditada.

---

### GET /api/audit/logs

Protegido por:

```txt
requireAuth + requireRole('admin')
```

Devuelve últimos registros de auditoría.

---

### POST /api/audit/logs

Protegido por:

```txt
requireAuth
```

Permite registrar eventos de auditoría desde backend/UI.

---

## Tabla sugerida

```sql
create table if not exists upzy_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid,
  user_email text,
  user_role text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);
```

> El endpoint debe funcionar aunque la tabla todavía no exista, devolviendo warning controlado.

---

## Acciones críticas a auditar

```txt
user.role_updated
user.status_updated
lead.created_from_capture
cart.status_updated
cart.recovered
cart.expired
automation.cart_recovery_run
event.created
report.viewed
beta.status_viewed
```

---

## Permisos por módulo

| Módulo | admin | agente | viewer |
|---|---:|---:|---:|
| CRM Comercial | operar | operar | lectura |
| Captación Web | configurar | lectura | lectura |
| Carritos | operar | operar | lectura |
| Email Marketing | configurar | lectura | lectura |
| Automatizaciones | ejecutar/configurar | lectura | lectura |
| Reportes | lectura | lectura | lectura |
| Usuarios | operar | sin acceso | sin acceso |
| Auditoría | lectura completa | sin acceso | sin acceso |

---

## Criterios de aceptación

- `/upzy` carga Sprint 17.
- `/upzy-sprint17.html` existe.
- `GET /api/users` existe y exige admin.
- `PATCH /api/users/:id` existe y exige admin.
- `GET /api/audit/logs` existe y exige admin.
- `POST /api/audit/logs` existe y exige sesión.
- La vista muestra usuarios, roles, permisos y auditoría.
- La vista muestra warning si la tabla de auditoría no existe.
- No se expone service role.
- No se modifica `package.json`.
- Sprints históricos siguen disponibles.

---

## Próximo sprint recomendado

Sprint 18 debe convertir las páginas por sprint en navegación final de producto:

```txt
/crm
/captacion
/carritos
/email
/automatizaciones
/reportes
/configuracion
```

La beta ya no debería depender visualmente de `/upzy-sprintXX.html` para operación diaria.
