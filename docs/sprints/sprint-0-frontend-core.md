# UPZY — Sprint 0 Frontend Core

## Objetivo

Construir la base visual y técnica del frontend de UPZY CRM como orquestador omnicanal, sin afectar el dashboard operativo existente.

El Sprint 0 no busca resolver campañas, ruleta, carrito abandonado ni atención Lumi en producción. Su foco es dejar el esqueleto frontend estable para que los siguientes sprints puedan montarse por módulo sin generar acoplamiento entre vistas.

---

## Alcance funcional

### Incluido

- Ruta de revisión frontend `/upzy`.
- Layout base de aplicación.
- Sidebar modular.
- Topbar de contexto.
- Vista inicial tipo dashboard modular.
- Navegación entre módulos por estado frontend.
- Design tokens base.
- Componentes visuales reutilizables.
- Mocks iniciales de módulos y métricas.
- Documentación de Sprint 0.

### No incluido

- Integración real con Supabase.
- Envío real de campañas.
- Automatizaciones reales.
- Integración real de Instagram.
- Integración real de Shopify.
- Editor productivo de ruleta.
- Reemplazo del dashboard actual.

---

## Módulos considerados desde la base

1. Core Platform
2. CRM Comercial
3. Captación Web
4. Ruleta / Spin to Win
5. Email Marketing
6. Carritos Abandonados
7. Lumi Sitio Web
8. Lumi Instagram
9. Automatizaciones
10. Reportes
11. Configuración

---

## Ruta creada

```txt
/upzy
```

La ruta carga:

```txt
public/upzy-sprint0.html
```

También queda disponible directamente como:

```txt
/upzy-sprint0.html
```

---

## Archivos creados

```txt
public/upzy-sprint0.html
public/assets/upzy-core.css
public/assets/upzy-mocks.js
public/assets/upzy-core.js
docs/sprints/sprint-0-frontend-core.md
```

---

## Principios de arquitectura frontend

### 1. Separación por módulo

Cada módulo debe poder evolucionar sin romper otro módulo.

Ejemplo futuro recomendado:

```txt
public/app/modules/capture/
public/app/modules/email-marketing/
public/app/modules/abandoned-carts/
public/app/modules/lumi-web/
public/app/modules/lumi-instagram/
```

### 2. Eventos comerciales como contrato

Los módulos no deben depender directamente entre sí. Deben comunicarse mediante eventos comerciales.

Ejemplos:

```txt
lead.created
lead.email_captured
modal.opened
spin.completed
campaign.sent
cart.abandoned_detected
lumi.conversation_started
instagram.message_received
automation.triggered
```

### 3. Vista primero, integración después

Sprint 0 usa mocks para validar experiencia, jerarquía visual y navegación. Las APIs reales se conectan por sprint, cuando cada módulo esté definido.

---

## Criterios de aceptación

- La ruta `/upzy` carga correctamente.
- El dashboard actual `/dashboard` no se reemplaza.
- La navegación lateral permite revisar los módulos base.
- El diseño usa tokens consistentes.
- Las tarjetas de métricas cargan desde mocks.
- La vista explica claramente qué módulos están activos, en diseño o pendientes.
- El código no introduce nuevas dependencias npm.
- No se modifican variables de entorno.
- No se toca `package.json`.

---

## Resultado esperado

Al finalizar Sprint 0, UPZY tiene una base frontend revisable para comenzar Sprint 1: Dashboard comercial + CRM base.

El equipo puede revisar visualmente la dirección del producto antes de conectar datos reales.
