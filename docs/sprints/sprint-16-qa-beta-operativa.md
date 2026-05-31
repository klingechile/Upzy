# UPZY — Sprint 16 QA Final + Beta Operativa

## Objetivo

Cerrar la beta operativa de UPZY dejando navegación, rutas críticas, endpoints, módulos live, roles mínimos, checklist productivo y operación inicial bajo control.

Sprint 16 no agrega nuevos módulos comerciales. Su foco es estabilizar lo construido para poder operar una beta seria.

---

## Resultado esperado

Al finalizar Sprint 16, UPZY debe permitir revisar:

- Ruta viva `/upzy` apuntando a Sprint 16.
- Página directa `/upzy-sprint16.html`.
- Endpoint protegido `GET /api/beta/status`.
- Checklist de beta operativa.
- Smoke tests de rutas y endpoints críticos.
- Estado de módulos live.
- Seguridad mínima validada.
- Roles mínimos visibles.
- Plan de operación diaria.
- Criterios Go / No-Go para producción.

---

## Módulos cerrados para beta

```txt
CRM Comercial real
Captación Web real
Carritos Abandonados reales
Email Marketing real/base
Automatizaciones base
Eventos Comerciales base
Reportes reales consolidados
```

---

## Endpoint Sprint 16

### GET /api/beta/status

Endpoint protegido por JWT. Devuelve estado de beta:

```ts
type BetaStatus = {
  ok: boolean;
  beta: {
    status: 'ready' | 'needs_attention';
    score: number;
  };
  user: {
    email: string;
    rol: string;
    tenant_id: string;
  };
  checks: Array<{
    id: string;
    label: string;
    status: 'OK' | 'WARN' | 'ERROR';
    detail: string;
  }>;
  modules: Array<{
    module: string;
    status: 'LIVE' | 'READY' | 'WARN';
    endpoint?: string;
  }>;
  routes: Array<{
    route: string;
    purpose: string;
    status: 'OK';
  }>;
};
```

---

## Rutas críticas

```txt
/
/upzy
/login
/health
/upzy-sprint11.html
/upzy-sprint12.html
/upzy-sprint13.html
/upzy-sprint14.html
/upzy-sprint15.html
/upzy-sprint16.html
```

---

## Endpoints críticos

```txt
GET /health
POST /api/auth/login
POST /api/auth/refresh
GET /api/leads
GET /api/leads/estadisticas
POST /api/capture/leads
GET /api/carts/abandoned
GET /api/events
GET /api/reports/overview
GET /api/beta/status
```

---

## Checklist Beta

```txt
Login redirige a /upzy
Dashboard legacy eliminado
Service role no expuesto en frontend
CRM carga BD real
Captación crea leads reales
Carritos consultan datos reales
Email/automatizaciones leen API real
Eventos comerciales tienen endpoint de lectura/escritura
Reportes consumen endpoint consolidado
Vistas históricas siguen disponibles
Estados loading/error/empty visibles
```

---

## Roles mínimos

Para beta se usan los roles existentes de `upzy_users`:

```txt
admin
agente
viewer
```

Regla de beta:

```txt
admin: puede operar configuración y acciones críticas
agente: puede operar CRM y seguimiento comercial
viewer: solo lectura de reportes y estado
```

El enforcement granular queda como mejora post-beta. La beta ya valida que el usuario tenga perfil activo en `upzy_users`.

---

## Go / No-Go producción

### GO

```txt
Login operativo
/api/beta/status OK
/api/reports/overview OK
CRM LIVE
Captación crea lead real
No hay 500 persistentes en rutas críticas
Warnings documentados
```

### NO-GO

```txt
NO_PROFILE en usuarios reales
INVALID_TOKEN constante
Error 500 en /api/reports/overview
Error 500 en /api/leads
Service role expuesto en frontend
Carritos o eventos rompen la navegación
```

---

## Operación diaria beta

1. Revisar `/upzy` al inicio del día.
2. Validar estado beta en la vista Sprint 16.
3. Revisar leads nuevos y HOT.
4. Revisar carritos pendientes.
5. Ejecutar recuperación controlada si corresponde.
6. Revisar reportes reales.
7. Registrar problemas como backlog post-beta.

---

## Criterios de aceptación

- `/upzy` carga Sprint 16.
- `/upzy-sprint16.html` existe.
- `GET /api/beta/status` existe y está protegido por JWT.
- Vista muestra score de beta.
- Vista muestra checks críticos.
- Vista muestra módulos live.
- Vista muestra rutas/endpoints críticos.
- No se modifica `package.json`.
- No se elimina ningún sprint histórico.

---

## Post-beta recomendado

```txt
Sprint 17: Roles/permisos avanzados + auditoría
Sprint 18: Omnicanalidad Lumi/Instagram avanzada
Sprint 19: Producción comercial + monitoreo
```
