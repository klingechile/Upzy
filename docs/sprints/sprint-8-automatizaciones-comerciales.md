# UPZY — Sprint 8 Automatizaciones Comerciales

## Objetivo

Construir el módulo frontend de Automatizaciones Comerciales para orquestar eventos, condiciones y acciones entre CRM, Captación Web, Ruleta, Email Marketing, Carritos Abandonados, Lumi Web e Instagram.

Sprint 8 convierte los módulos anteriores en flujos operables: cuando ocurre un evento, UPZY evalúa condiciones y ejecuta una acción comercial medible.

---

## Resultado esperado

Al finalizar Sprint 8, UPZY debe permitir revisar visualmente:

- Dashboard de automatizaciones.
- Flujos comerciales activos, pausados y en diseño.
- Builder conceptual de trigger, condiciones y acciones.
- Reglas de automatización por canal.
- Secuencia de recuperación y seguimiento.
- Métricas mock de ejecución.
- Timeline de eventos.
- Contrato de datos de automatización.

La vista sigue usando datos mock. No ejecuta acciones reales desde esta nueva interfaz.

---

## Alcance funcional

### Incluido

- Ruta viva `/upzy` apuntando a Sprint 8.
- Página directa `/upzy-sprint8.html`.
- Vista de Automatizaciones Comerciales.
- Métricas mock.
- Lista de flujos comerciales.
- Preview visual del flujo.
- Triggers, condiciones y acciones.
- Timeline de ejecución.
- Contrato de datos.
- Eliminación del dashboard antiguo no utilizado.

### No incluido

- Motor real de automatización productivo.
- Ejecución real de email, WhatsApp o Instagram.
- Persistencia real nueva.
- Editor drag-and-drop productivo.
- Validación avanzada de reglas.
- Reintentos productivos.
- Auditoría completa de ejecución.

---

## Módulo funcional

```txt
Automatizaciones Comerciales
```

Responsabilidad:

```txt
Conectar eventos comerciales con decisiones y acciones medibles para acelerar captura, seguimiento, recuperación y cierre.
```

---

## Componentes frontend

```txt
AutomationDashboard
AutomationMetricCards
AutomationFlowList
AutomationBuilderPreview
AutomationTriggerCard
AutomationConditionCard
AutomationActionCard
AutomationExecutionTimeline
AutomationDataContract
```

---

## Eventos de entrada

```txt
lead.created
lead.email_captured
coupon.generated
quote.sent
cart.abandoned_detected
email.clicked
instagram.message_received
lumi.intent_detected
purchase.completed
customer.inactive_detected
```

---

## Eventos propios

```txt
automation.created
automation.enabled
automation.disabled
automation.triggered
automation.condition_matched
automation.condition_failed
automation.action_queued
automation.action_executed
automation.completed
automation.failed
```

---

## Contrato de datos

```ts
type CommercialAutomation = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger: {
    event: string;
    sourceModule: string;
  };
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: string | number | boolean;
  }>;
  actions: Array<{
    type: 'send_email' | 'suggest_whatsapp' | 'start_lumi_followup' | 'create_task' | 'update_lead' | 'assign_owner';
    targetModule: string;
    payload: Record<string, unknown>;
  }>;
  metrics?: {
    triggered: number;
    completed: number;
    failed: number;
    revenue?: number;
  };
};
```

---

## Automatizaciones iniciales

### 1. Cupón generado no usado

```txt
trigger: coupon.generated
condition: coupon usado = false después de 24h
actions: enviar email + sugerir WhatsApp si hay teléfono
```

### 2. Carrito abandonado HOT

```txt
trigger: cart.abandoned_detected
condition: prioridad = high
actions: email inmediato + tarea comercial + seguimiento Lumi
```

### 3. Lead capturado por modal

```txt
trigger: lead.email_captured
condition: producto_interes existe
actions: crear lead + definir próxima mejor acción + campaña bienvenida
```

### 4. Instagram pide precio

```txt
trigger: instagram.message_received
condition: intent = quote
actions: enriquecer CRM + sugerir respuesta + pedir datos para cotización
```

### 5. Cliente post compra

```txt
trigger: purchase.completed
condition: producto existe
actions: email post compra + reseña + upsell futuro
```

---

## Reglas comerciales

1. Toda automatización debe tener un trigger explícito.
2. Toda condición debe ser legible por negocio.
3. Toda acción debe dejar evento de auditoría.
4. Toda automatización debe ser medible por ejecución, error y conversión.
5. Ningún módulo debe llamar directamente a otro módulo sin evento.
6. Las automatizaciones de alta intención deben priorizar HOT y carritos.
7. Los flujos deben poder pausarse sin borrar configuración.
8. Las acciones sensibles deben pasar por estado sugerido antes de envío real.

---

## Relación con otros sprints

### Depende de Sprint 1 a Sprint 7

Consume eventos de CRM, captación, ruleta, email, carritos y omnicanalidad.

### Habilita Sprint 9 — Reportes

Permite medir performance de flujos, atribución, revenue y mejora continua.

---

## Criterios de aceptación

- `/upzy` carga Sprint 8.
- `/upzy-sprint8.html` existe como ruta directa.
- `/dashboard` deja de estar registrado como ruta viva.
- `public/dashboard.html` queda eliminado.
- Se visualizan métricas de automatizaciones.
- Se visualizan flujos comerciales.
- Se visualiza builder conceptual trigger/condición/acción.
- Se visualiza timeline de ejecución.
- Se documenta contrato de datos.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 8 mantiene el módulo separado en:

```txt
public/assets/upzy-automation-data.js
public/assets/upzy-automation.css
public/assets/upzy-automation.js
```

La integración real debe hacerse después por API/eventos y no con dependencias directas entre pantallas.

---

## Próximo sprint

Sprint 9 debe implementar Reportes, Funnel y Atribución para medir conversión por canal, módulo, campaña y automatización.
