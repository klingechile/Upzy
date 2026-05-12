# Roadmap profesional Upzy/Klinge

Este roadmap organiza el producto para convertir Upzy en un CRM comercial profesional para Klinge, con foco en conversión, recuperación de ventas, automatización y control operativo.

## Principios de producto

1. Todo módulo debe ayudar a vender, recuperar o retener clientes.
2. El dashboard debe mostrar estado operativo claro, no solo datos.
3. Las automatizaciones deben ser activables/desactivables desde UI.
4. Email, WhatsApp e Instagram deben compartir branding y tono comercial.
5. Cada flujo debe tener medición: enviado, abierto, click, respuesta, compra.

---

## Fase 1 — Estabilización profesional

### Objetivo

Dejar el sistema estable, visualmente consistente y operable por usuarios no técnicos.

### Incluye

- Capa visual Klinge en dashboard.
- Indicador de salud del sistema.
- Acciones rápidas: estado, carritos, email.
- Control visual de carrito abandonado.
- Documentación de troubleshooting.
- Script diagnóstico de carrito.

### Archivos GPT

```txt
public/professional-ui.js
public/cart-recovery-control.js
docs/TROUBLESHOOTING.md
docs/CART_RECOVERY_SHOPIFY.md
scripts/check-cart-recovery.js
```

---

## Fase 2 — Flujos comerciales de email

### Objetivo

Crear un motor de emails enfocado en cierre y recuperación de ventas.

### Flujos mínimos

1. Bienvenida comercial.
2. Carrito abandonado.
3. Cotización enviada.
4. Seguimiento post-cotización.
5. Confirmación de compra.
6. Solicitud de reseña.
7. Reactivación de cliente frío.

### Reglas de branding

```txt
Negro: #111111
Rojo Klinge: #C0392B
Blanco: #FFFFFF
```

No usar verde como color de marca. El verde queda solo para estados OK.

### Ownership

Backend templates: Claude o emergencia backend.

Frontend/preview/docs: GPT.

---

## Fase 3 — Automatizaciones de conversión

### Objetivo

Que cada etapa comercial tenga una automatización controlable.

### Automatizaciones prioritarias

| Flujo | Canal | Objetivo |
|---|---|---|
| Lead nuevo | WhatsApp/Email | Respuesta inmediata |
| Cotización pendiente 24h | WhatsApp/Email | Cierre |
| Carrito abandonado 1h | WhatsApp/Email | Recuperación |
| Carrito abandonado 24h | Email | Oferta/urgencia |
| Compra confirmada | Email | Confianza |
| Postventa 5 días | Email/WhatsApp | Reseña |
| Cliente frío 30 días | Email | Reactivación |

---

## Fase 4 — Métricas comerciales

### Objetivo

Medir si Upzy está generando ventas reales.

### KPIs

- Leads nuevos.
- Leads HOT.
- Carritos recuperados.
- Monto recuperado.
- Emails enviados.
- Aperturas.
- Clicks.
- Respuestas.
- Compras atribuidas.
- Tasa de cierre por canal.

---

## Fase 5 — Profesionalización UI/UX

### Mejoras

- Dashboard ejecutivo.
- Filtros avanzados.
- Timeline del cliente.
- Vista 360 de lead.
- Segmentos guardados.
- Builder de campañas.
- Preview mobile/email/WhatsApp.
- Estados claros por módulo.

---

## Reglas de calidad

Antes de lanzar una funcionalidad:

```txt
[ ] API responde correctamente
[ ] UI tiene loading/error/empty state
[ ] No hay errores JS en consola
[ ] Existe documentación mínima
[ ] Existe forma de diagnosticar
[ ] Respeta branding Klinge
[ ] Respeta ownership Claude/GPT
```

---

## Próximo bloque recomendado

1. Reparar definitivamente emails branded.
2. Crear flujo completo de reseñas post-compra.
3. Crear vista ejecutiva de ventas recuperadas.
4. Agregar test visual/API básico.
5. Medir conversión de carrito abandonado.
