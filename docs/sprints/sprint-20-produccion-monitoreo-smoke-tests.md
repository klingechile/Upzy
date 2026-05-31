# UPZY — Sprint 20 Producción, Monitoreo y Smoke Tests

## Objetivo

Preparar UPZY para operación productiva controlada incorporando monitoreo, smoke tests, checklist de deploy y una vista operativa para validar salud del sistema después de cada despliegue.

Sprint 20 no cambia el modelo comercial. Su foco es confiabilidad operacional.

---

## URL principal

```txt
https://upzy-production.up.railway.app/upzy
```

---

## Resultado esperado

Al finalizar Sprint 20, UPZY debe contar con:

- Ruta `/operacion` para monitoreo operativo.
- Página directa `/upzy-sprint20.html`.
- Endpoint protegido `GET /api/ops/status`.
- Endpoint protegido `POST /api/ops/smoke-test`.
- Validación de rutas críticas.
- Validación de endpoints críticos.
- Checklist deploy visible.
- Estado de variables/canales críticos.
- Recomendación Go / No-Go para operación.

---

## Endpoints Sprint 20

### GET /api/ops/status

Devuelve estado operacional:

```txt
app
runtime
channels
critical_endpoints
critical_routes
recommendation
```

---

### POST /api/ops/smoke-test

Ejecuta smoke test server-side básico sobre fuentes internas:

```txt
health
leads
reports
beta
events
carts
```

Debe devolver resultado controlado aunque alguna tabla opcional no exista.

---

## Rutas críticas

```txt
/upzy
/login
/crm
/captacion
/carritos
/email
/automatizaciones
/reportes
/configuracion
/beta
/operacion
/health
```

---

## Endpoints críticos

```txt
GET /health
POST /api/auth/login
POST /api/auth/refresh
GET /api/leads
GET /api/reports/overview
GET /api/beta/status
GET /api/events
GET /api/carts/abandoned
GET /api/ops/status
POST /api/ops/smoke-test
```

---

## Checklist deploy

```txt
Variables de entorno cargadas
Health check responde
Login responde
JWT protegido funcionando
CRM carga leads
Captación crea lead real
Reportes overview responde
Beta status responde
Eventos no rompen
Carritos no rompen
Cron carritos activo si Shopify está habilitado
Logs sin errores 500 persistentes
Rollback definido
```

---

## Go / No-Go

### GO

```txt
/health OK
/api/ops/status OK
/api/reports/overview OK
/api/beta/status OK
Sin errores 500 en endpoints críticos
Smoke test mayor o igual a 80%
```

### NO-GO

```txt
Auth rota
Reportes 500
Leads 500
Service role expuesto
Smoke test bajo 80%
Errores persistentes en cron o webhooks
```

---

## Criterios de aceptación

- `/operacion` existe.
- `/upzy-sprint20.html` existe.
- `GET /api/ops/status` existe y está protegido por JWT.
- `POST /api/ops/smoke-test` existe y está protegido por JWT.
- Vista muestra score operativo.
- Vista muestra checklist deploy.
- Vista muestra rutas y endpoints críticos.
- Vista permite ejecutar smoke test manual.
- Navegación persistente incluye Operación para admin.
- No se modifica `package.json`.
