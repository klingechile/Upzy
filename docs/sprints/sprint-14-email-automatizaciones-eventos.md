# UPZY — Sprint 14 Email Marketing + Automatizaciones sobre Eventos

## Objetivo

Conectar Email Marketing y Automatizaciones a datos reales y eventos comerciales para que UPZY pueda operar campañas, plantillas, flujos y recuperación sin depender de pantallas mock.

Sprint 14 une las piezas creadas en sprints anteriores:

```txt
Sprint 11 → CRM real
Sprint 12 → Captación real
Sprint 13 → Carritos reales + eventos
Sprint 14 → Email + Automatizaciones sobre eventos
```

---

## Resultado esperado

Al finalizar Sprint 14, UPZY debe permitir revisar:

- Ruta viva `/upzy` apuntando a Sprint 14.
- Página directa `/upzy-sprint14.html`.
- Vista live de Email Marketing.
- Vista live de Automatizaciones.
- Métricas reales de email si existen.
- Templates reales de email.
- Flows reales de email.
- Automatizaciones reales/default desde backend.
- Timeline real o fallback de eventos comerciales.
- Acción manual para ejecutar revisión de carrito abandonado.
- Base para automatizar por eventos.

---

## Endpoints usados

### Email Marketing

```txt
GET /api/email/metrics
GET /api/email/templates
GET /api/email/flows
GET /api/email/historial
```

### Automatizaciones

```txt
GET /api/automations
GET /api/automations/cart-recovery
PATCH /api/automations/cart-recovery
POST /api/automations/cart-recovery/run
POST /api/automations/trigger
```

### Eventos

```txt
GET /api/events
POST /api/events
```

---

## Eventos comerciales foco

```txt
lead.email_captured
cart.abandoned_detected
cart.recovery_started
cart.recovered
cart.expired
email.sent
email.clicked
automation.triggered
automation.completed
automation.failed
```

---

## Reglas funcionales

1. Email Marketing debe alimentarse de leads reales.
2. Las plantillas deben vivir en UPZY, no dispersas en código.
3. Las automatizaciones deben reaccionar a eventos, no a pantallas.
4. Carrito abandonado debe poder ejecutarse manualmente para testing controlado.
5. La UI debe mostrar estado live, error o fallback sin romper.
6. Eventos deben ser legibles para reportes y atribución futura.
7. No se debe exponer Supabase service role en frontend.
8. El sprint no debe enviar campañas masivas por accidente.

---

## Alcance incluido

- Vista live Sprint 14.
- Lectura de métricas email.
- Lectura de templates email.
- Lectura de flows email.
- Lectura de automatizaciones.
- Lectura de estado cart recovery.
- Ejecución manual controlada de cart recovery.
- Timeline de eventos comerciales.
- GET /api/events para UI.

---

## Alcance no incluido

- Envío masivo real desde la vista nueva.
- Editor visual de plantillas.
- Constructor drag and drop de automatizaciones.
- Atribución final de revenue.
- Conexión total de Meta/Instagram.

---

## Criterios de aceptación

- `/upzy` carga Sprint 14.
- `/upzy-sprint14.html` existe.
- Email metrics cargan desde API o muestran fallback.
- Templates email cargan desde API o muestran vacío controlado.
- Automatizaciones cargan desde API o muestran fallback.
- Cart recovery muestra estado real.
- Botón de ejecución manual llama `POST /api/automations/cart-recovery/run`.
- Eventos comerciales se consultan con `GET /api/events`.
- No se expone service role.
- No se modifica `package.json`.
- Sprints 11, 12 y 13 siguen accesibles como históricos.

---

## Próximo sprint

Sprint 15 debe consolidar Reportes Reales + Atribución:

```txt
GET /api/events
GET /api/email/metrics
GET /api/carts/abandoned
GET /api/leads/estadisticas
```

Objetivo: calcular funnel real, performance por canal y revenue atribuido.
