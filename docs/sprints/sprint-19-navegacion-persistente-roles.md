# UPZY — Sprint 19 Navegación Persistente + Accesos por Rol

## Objetivo

Hacer que todas las pantallas de UPZY usen una navegación persistente de producto, con accesos visibles según el rol del usuario.

Sprint 19 corrige el principal pendiente posterior a Sprint 18: aunque ya existen rutas finales, varias pantallas todavía muestran el menú antiguo por módulos/sprints. Este sprint centraliza el menú final sin reescribir cada HTML manualmente.

---

## Resultado esperado

Al finalizar Sprint 19:

- Todas las páginas que cargan `upzy-core.js` reemplazan el menú lateral por navegación final.
- El menú marca activa la ruta actual.
- El menú muestra accesos según rol `admin`, `agente`, `viewer`.
- El footer del sidebar muestra rol y modo producto.
- Las rutas finales siguen funcionando.
- Los sprints históricos siguen disponibles.
- Las pantallas live no pierden contexto ni módulo seleccionado.

---

## Rutas finales

```txt
/upzy
/crm
/captacion
/carritos
/email
/automatizaciones
/reportes
/configuracion
/beta
```

---

## Accesos por rol

### admin

```txt
Inicio
CRM
Captación
Carritos
Email
Automatizaciones
Reportes
Configuración
Beta Status
```

### agente

```txt
Inicio
CRM
Captación
Carritos
Email
Automatizaciones
Reportes
Beta Status
```

### viewer

```txt
Inicio
Reportes
Beta Status
```

---

## Decisión técnica

No se reescriben manualmente todos los HTML históricos. Se actualiza `upzy-core.js` para:

1. Leer el usuario desde `sessionStorage.upzy_user`.
2. Detectar rol.
3. Reemplazar `.upzy-nav` por navegación de producto.
4. Marcar ruta activa.
5. Respetar el contexto live de cada página con `data-upzy-live-module`.
6. Mantener `renderRoadmap`, `renderMetrics` y módulos legacy cuando existan contenedores.

---

## Criterios de aceptación

- `/upzy` muestra home producto.
- `/crm` muestra menú producto y no menú antiguo.
- `/captacion` muestra menú producto y no menú antiguo.
- `/carritos` muestra menú producto y no menú antiguo.
- `/email` muestra menú producto y no menú antiguo.
- `/automatizaciones` muestra menú producto y no menú antiguo.
- `/reportes` muestra menú producto y no menú antiguo.
- `/configuracion` muestra menú producto y no menú antiguo.
- `/beta` muestra menú producto y no menú antiguo.
- El rol `viewer` no ve configuración ni acciones operativas avanzadas en el menú.
- No se elimina ningún sprint histórico.
- No se modifica `package.json`.

---

## Próximo sprint recomendado

Sprint 20 debe enfocarse en producción/monitoreo o en Lumi omnicanal avanzada:

```txt
Opción A: Producción, monitoreo, logs, smoke tests automatizados
Opción B: Lumi Web + Instagram real + inbox omnicanal
```
