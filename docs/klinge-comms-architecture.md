# Arquitectura de comunicaciones Klinge / Upzy

## Decisión principal

Upzy separa **Email Marketing** de **WhatsApp**.

- **Email** sí se crea, edita, previsualiza y envía desde Upzy, usando SES.
- **WhatsApp** no debe tener editor libre de plantillas dentro de Upzy. La fuente de verdad de plantillas WhatsApp es Meta/Facebook Business Manager.

## 1. Email Marketing en Upzy

Upzy debe manejar todo el ciclo comercial de email:

- Dashboard de métricas.
- Plantillas HTML editables.
- Preview desktop/mobile.
- Envío de prueba.
- Campañas por segmento.
- Flujos automáticos.
- Historial de envíos.
- Métricas de apertura, clic, errores, campañas y recuperación.

### Flujos email base

| ID | Nombre | Trigger | Delay | Objetivo |
|---|---|---|---|---|
| abandoned_cart_1h | Carrito abandonado 1h | checkout_created | 1 hora | Retomar compra |
| abandoned_cart_24h | Carrito abandonado 24h | checkout_still_open | 24 horas | Recuperar con prueba social |
| abandoned_cart_72h | Carrito abandonado 72h | checkout_still_open | 72 horas | Último empuje |
| post_purchase_24h | Post compra 24h | order_paid | 24 horas | Confianza y postventa |
| review_request_7d | Reseña 7d | order_fulfilled | 7 días | Generar reseñas |
| repurchase_30d | Recompra 30d | customer_purchased | 30 días | Upsell / cross-sell |
| inactive_customer_45d | Cliente inactivo 45d | customer_inactive | 45 días | Reactivación |

## 2. WhatsApp en Upzy

Upzy solo debe orquestar WhatsApp:

- Nombre técnico de template Meta.
- Idioma.
- Mapeo de variables.
- Trigger.
- Segmento.
- Estado activo/inactivo.
- Métricas de envío/respuesta/error.

Upzy no debe mostrar un editor de texto como si la plantilla WhatsApp fuese editable desde la app.

### Modelo correcto

```json
{
  "flow_id": "wa_abandoned_cart_1h",
  "channel": "whatsapp",
  "template_source": "meta",
  "meta_template_name": "carrito_abandonado_1h",
  "language": "es",
  "variables": [
    { "position": 1, "source": "lead.nombre" },
    { "position": 2, "source": "checkout.productos" },
    { "position": 3, "source": "checkout.checkout_url" }
  ],
  "trigger": "checkout_abandoned",
  "delay_minutes": 60,
  "active": true
}
```

## 3. Respuestas rápidas WhatsApp

Las respuestas rápidas sí pueden vivir en Upzy, porque no son plantillas proactivas. Se usan dentro de la ventana conversacional cuando el cliente ya escribió.

Ejemplos:

- Precio panel 60x90.
- Cómo se instala.
- Qué incluye.
- Garantía.
- Diferencia con TV.
- Cómo funciona.

## 4. Reglas de copy Lumi/Klinge

Lumi nunca debe decir:

- "te escalo con un agente"
- "habla con un ejecutivo"
- "te derivaré"

Debe resolver dentro de la conversación:

> Respóndeme por este mismo canal y te ayudo con medidas, instalación o elección del panel.

## 5. Branding Klinge

Colores comerciales para emails y UI del módulo:

```css
--klinge-red: #E1251B;
--klinge-red-dark: #C0392B;
--klinge-red-hover: #FF3B30;
--klinge-black: #0B0D12;
--klinge-graphite: #121722;
--klinge-panel: #1A2130;
--klinge-white: #F8FAFC;
--klinge-muted: #94A3B8;
```

El verde debe quedar solo para estados funcionales, no como color principal de marca.

## 6. Naming recomendado en UI

### Email

- Plantillas Email
- Campañas Email
- Flujos Email
- Preview Email
- Enviar prueba

### WhatsApp

- Templates Meta conectadas
- Mapeo de variables
- Flujos WhatsApp
- Respuestas rápidas
- Métricas WhatsApp

Evitar:

- Crear plantilla WhatsApp
- Editar template WhatsApp
- Constructor WhatsApp

Usar:

- Conectar template Meta
- Asignar template Meta
- Configurar variables
