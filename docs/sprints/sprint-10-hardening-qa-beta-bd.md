# UPZY — Sprint 10 Hardening, QA, Beta Operativa y Readiness BD

## Objetivo

Cerrar la primera línea de trabajo frontend modular de UPZY y preparar la conexión progresiva a base de datos real sin romper la experiencia construida por sprints.

Sprint 10 no debe conectar todos los módulos a BD de golpe. Debe ordenar el hardening, QA, contratos, endpoints disponibles, gaps técnicos y plan de conexión por oleadas.

---

## Respuesta ejecutiva: ¿cuándo conectamos a BD?

La conexión a BD debe partir después de Sprint 10, en Sprint 11, de forma progresiva.

### Decisión recomendada

```txt
Sprint 10: readiness, QA, contratos y mapa de endpoints.
Sprint 11: conectar CRM Comercial + Leads + Estadísticas reales.
Sprint 12: conectar Captación Web + Carritos Abandonados.
Sprint 13: conectar Email Marketing + Automatizaciones + Reportes.
Sprint 14: conectar Lumi Web / Instagram con conversaciones reales.
```

### Por qué no conectar todo ahora

1. Todavía existen muchos módulos mock que comparten contratos pero no necesariamente tablas finales.
2. Los endpoints actuales ya existen para leads, estadísticas y carritos; conviene partir por ahí.
3. Conectar todo de golpe aumenta riesgo de romper navegación, autenticación, permisos y datos.
4. Reportes y automatizaciones deben depender de eventos consistentes, no de consultas sueltas.
5. La beta debe validar primero un flujo real completo: lead → CRM → carrito → seguimiento.

---

## Estado técnico observado

El backend ya cuenta con conexión Supabase mediante:

```txt
src/db/supabase.js
```

También existen endpoints protegidos para:

```txt
GET /api/leads
GET /api/leads/estadisticas
GET /api/leads/carritos
GET /api/leads/:id
PATCH /api/leads/:id
POST /api/leads/:id/score
POST /api/leads/:id/asignar-agente
```

Esto permite que la primera conexión real sea CRM + Leads.

---

## Resultado esperado

Al finalizar Sprint 10, UPZY debe permitir revisar visualmente:

- Estado de readiness por módulo.
- Checklist QA/Beta.
- Mapa de conexión a BD.
- Priorización de endpoints reales.
- Riesgos técnicos.
- Plan por oleadas para pasar de mocks a datos reales.
- Criterios Go / No-Go para Sprint 11.

---

## Alcance funcional

### Incluido

- Ruta viva `/upzy` apuntando a Sprint 10.
- Página directa `/upzy-sprint10.html`.
- Vista de hardening y readiness BD.
- Checklist QA visual.
- Matriz de conexión BD por módulo.
- Plan de oleadas.
- Riesgos y dependencias.
- Criterios para conectar datos reales.
- Documentación funcional y técnica.

### No incluido

- Conexión productiva completa a BD en todos los módulos.
- Migraciones SQL nuevas.
- Reescritura del backend.
- Cambio de autenticación.
- Conexión real de Instagram Graph API.
- Envío real desde módulos mock.
- Reportes productivos en tiempo real.

---

## Módulo funcional

```txt
Hardening / QA / Beta / DB Readiness
```

Responsabilidad:

```txt
Asegurar que la plataforma pueda pasar de prototipo frontend modular a beta operativa conectada a datos reales sin romper contratos ni navegación.
```

---

## Componentes frontend

```txt
BetaReadinessDashboard
ModuleReadinessMatrix
DatabaseConnectionPlan
QaChecklist
EndpointCoveragePanel
RiskRegister
GoNoGoPanel
```

---

## Oleadas de conexión BD

### Oleada 1 — CRM Comercial

Prioridad: alta.

Endpoints disponibles:

```txt
GET /api/leads
GET /api/leads/estadisticas
GET /api/leads/carritos
```

Módulos impactados:

```txt
CRM Comercial
Reportes básicos
Carritos vista resumen
```

Resultado esperado:

```txt
Leads reales, estadísticas reales y carritos pendientes reales en UI.
```

---

### Oleada 2 — Captación + Carritos

Prioridad: alta.

Requiere revisar/crear endpoints para:

```txt
POST /api/capture/leads
POST /api/events
GET /api/carts/abandoned
```

Resultado esperado:

```txt
Formulario/modal creando leads reales y carritos conectados a estado real.
```

---

### Oleada 3 — Email + Automatizaciones

Prioridad: media.

Requiere revisar/crear endpoints para:

```txt
GET /api/templates
GET /api/campanas
GET /api/automations
POST /api/automations/:id/run
```

Resultado esperado:

```txt
Plantillas, campañas y flujos reales con métricas de ejecución.
```

---

### Oleada 4 — Lumi Web + Instagram

Prioridad: media/alta.

Requiere endpoints/eventos para:

```txt
GET /api/inbox
POST /api/agente
GET /api/conversations
POST /api/conversations/:id/messages
```

Resultado esperado:

```txt
Conversaciones reales, matching de leads y próxima mejor acción.
```

---

### Oleada 5 — Reportes y Atribución

Prioridad: media.

Requiere modelo de eventos estable:

```txt
upzy_events
upzy_event_attribution
upzy_conversion_events
```

Resultado esperado:

```txt
Reportes calculados desde eventos reales, no desde mocks.
```

---

## Checklist QA/Beta

```txt
Navegación principal funcionando
Sprints históricos accesibles
Rutas limpias sin dashboard legacy
Mobile responsive básico
Módulos sin errores JS
Contratos documentados
Mocks separados por módulo
Endpoints reales identificados
Autenticación revisada
Manejo de estado loading/error/empty definido
Plan rollback definido
```

---

## Criterios Go para Sprint 11

```txt
GET /api/leads responde correctamente
GET /api/leads/estadisticas responde correctamente
GET /api/leads/carritos responde correctamente
Token/JWT probado en frontend
UI tiene estados loading/error/empty
Mocks pueden mantenerse como fallback
No se rompe /upzy
No se rompe /login
```

---

## Criterios No-Go

```txt
Endpoints reales sin datos o con errores 500
Problemas de autenticación sin resolver
Estructura de leads incompatible con UI
No existe tenant_id consistente
Errores JS bloqueantes
Riesgo de exponer service role en frontend
```

---

## Regla crítica de seguridad

```txt
Nunca exponer SUPABASE_SERVICE_ROLE_KEY en frontend.
```

La conexión de UI debe consumir endpoints del backend protegidos por JWT. El frontend no debe consultar Supabase directamente con credenciales sensibles.

---

## Criterios de aceptación

- `/upzy` carga Sprint 10.
- `/upzy-sprint10.html` existe como ruta directa.
- `/dashboard` sigue eliminado.
- Se visualiza readiness por módulo.
- Se visualiza plan de conexión BD por oleadas.
- Se visualiza checklist QA/Beta.
- Se visualizan endpoints disponibles.
- Se visualizan criterios Go / No-Go.
- Se documenta estrategia BD.
- No se agrega dependencia npm.
- No se modifica `package.json`.

---

## Próximo sprint

Sprint 11 debe conectar CRM Comercial a datos reales usando primero:

```txt
GET /api/leads
GET /api/leads/estadisticas
GET /api/leads/carritos
```

Ese será el primer paso real de BD.
