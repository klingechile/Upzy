# UPZY — Sprint 1 Dashboard Comercial + CRM Base

## Objetivo

Construir la primera vista comercial operativa de UPZY CRM sobre la base modular del Sprint 0.

El foco de Sprint 1 es que el equipo pueda revisar visualmente cómo se gestionarán los leads, el termómetro comercial, el funnel, las tareas comerciales y la próxima mejor acción antes de conectar datos reales.

---

## Alcance funcional

### Incluido

- Ruta de revisión `/upzy` apuntando al incremento Sprint 1.
- Dashboard comercial con métricas principales.
- Funnel comercial por etapa.
- Tabla de leads mock.
- Termómetro comercial por lead: HOT, WARM, COLD.
- Próxima mejor acción por lead.
- Actividad reciente.
- Resumen de tareas comerciales.
- Filtros visuales por segmento comercial.
- Estados preparados para futura conexión API.

### No incluido

- Escritura real en Supabase.
- Edición real de leads.
- Acciones reales de WhatsApp, email o Instagram.
- Automatización real de tareas.
- Matching real entre canales.
- Autenticación específica para esta vista nueva.

---

## Contrato visual CRM

Cada lead debe mostrar:

```txt
id
nombre
empresa
canal
etapa
segmento
score
producto_interes
monto_estimado
ultima_interaccion
proxima_accion
owner
```

---

## Eventos comerciales preparados

```txt
lead.created
lead.updated
lead.segment_changed
lead.stage_changed
lead.next_action_defined
lead.owner_assigned
lead.note_added
crm.pipeline_viewed
crm.lead_selected
```

---

## Módulos tocados

```txt
Core Platform
CRM Comercial
Reportes iniciales
```

---

## Archivos agregados / modificados

```txt
public/upzy-sprint1.html
public/assets/upzy-mocks.js
public/assets/upzy-core.js
public/assets/upzy-core.css
index.js
docs/sprints/sprint-1-dashboard-crm.md
```

---

## Criterios de aceptación

- `/upzy` carga la vista Sprint 1.
- El dashboard actual `/dashboard` se mantiene intacto.
- El usuario puede entrar a CRM Comercial desde el menú lateral.
- Se visualizan métricas comerciales.
- Se visualiza funnel por etapa.
- Se visualiza tabla de leads.
- Cada lead muestra termómetro comercial.
- Cada lead muestra próxima mejor acción.
- La vista usa mocks y no depende de APIs reales.
- El diseño mantiene los tokens visuales del Sprint 0.
- El código no agrega dependencias npm.

---

## Decisión técnica

Sprint 1 sigue funcionando con mocks porque el objetivo es validar experiencia, jerarquía visual y flujo comercial antes de conectar Supabase o endpoints protegidos.

La conexión real se recomienda para el siguiente bloque técnico del CRM, una vez validado:

1. Modelo de lead.
2. Etapas del pipeline.
3. Segmentación HOT/WARM/COLD.
4. Eventos comerciales.
5. Acciones permitidas por rol.

---

## Resultado esperado

Al finalizar Sprint 1, UPZY cuenta con una primera vista comercial revisable para que el equipo valide cómo se leerá y gestionará el negocio desde CRM.

Esto habilita Sprint 2: Captación Web, modal, popup y eventos de captura.
