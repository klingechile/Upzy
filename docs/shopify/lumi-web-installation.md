# Instalación Shopify — Lumi Web UPZY

## Objetivo

Instalar el widget Lumi Web en Shopify para capturar intención comercial por producto, carrito, UTM y conversación web.

---

## Snippet recomendado

Agregar antes del cierre de `</body>` en `theme.liquid`:

```liquid
<script
  src="https://upzy-production.up.railway.app/widget/lumi-web.js"
  data-upzy-brand="Klinge"
  data-upzy-api="https://upzy-production.up.railway.app"
  {% if product %}data-upzy-product="{{ product.title | escape }}"{% endif %}>
</script>
```

---

## Qué captura automáticamente

```txt
URL actual
Referrer
UTM source, medium, campaign, content, term
Título del producto
Handle de producto
ID de producto si está disponible
Variante seleccionada por querystring
Precio meta si Shopify lo expone
Carrito desde /cart.js
Cantidad de productos en carrito
Total del carrito
Items del carrito
Session id web
```

---

## Eventos generados

```txt
lumi_web.page_view
lumi_web.cart_detected
lumi_web.opened
lumi_web.conversation_created
```

---

## Tablas impactadas

```txt
upzy_leads
upzy_conversaciones
upzy_mensajes
upzy_events
```

---

## Validación post instalación

1. Entrar a una página de producto en Shopify.
2. Confirmar que aparece el botón “¿Te ayudo?”.
3. Abrir widget.
4. Enviar mensaje con email o WhatsApp.
5. Revisar `/inbox`.
6. Revisar lead canal `web`.
7. Revisar eventos `lumi_web.*` en reportes/eventos.

---

## Reglas operativas

- El widget no envía WhatsApp ni Instagram.
- El widget no ejecuta campañas masivas.
- La respuesta queda centralizada en `/inbox`.
- El agente responde con contexto de producto y carrito.
