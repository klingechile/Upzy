# UPZY — Sprint 22 Widget Lumi Web Embebible en Producción

## Objetivo

Llevar Lumi Web a producción con un widget embebible para sitio web y Shopify que cree leads, cree conversaciones web y permita que el equipo responda desde `/inbox`.

Sprint 22 convierte la web en un canal real de entrada. El widget captura intención, registra contacto y deja la conversación visible en Inbox Omnicanal.

---

## Rutas principales

```txt
/upzy
/lumi-web
/inbox
```

## Script embebible

El archivo público del widget queda en:

```txt
/widget/lumi-web.js
```

El snippet de instalación queda documentado en la vista `/lumi-web`.

---

## Resultado esperado

- Ruta `/lumi-web` para probar el widget.
- Script público `/widget/lumi-web.js`.
- API pública `POST /api/lumi-web/conversations`.
- API pública `POST /api/lumi-web/conversations/:id/messages`.
- API pública `GET /api/lumi-web/conversations/:id/messages`.
- Lead real en `upzy_leads`.
- Conversación real en `upzy_conversaciones`.
- Mensajes reales en `upzy_mensajes`.
- Conversación visible en `/inbox`.

---

## Flujo funcional

```txt
Cliente abre widget
Cliente escribe mensaje
UPZY crea/actualiza lead canal web
UPZY crea conversación web
UPZY guarda mensaje cliente
UPZY responde acuse de recibo web
Equipo revisa /inbox
Agente toma conversación y responde
```

---

## Reglas de seguridad

1. API pública solo usa backend server-side.
2. No se expone Supabase service role.
3. Payload acotado.
4. Honeypot `website` para bots.
5. Se normaliza email y teléfono.
6. El widget no envía WhatsApp ni Instagram.
7. No hay envío masivo.
8. La conversación queda trazable en UPZY.

---

## Criterios de aceptación

- `/lumi-web` carga correctamente.
- `/widget/lumi-web.js` carga como script público.
- El widget permite enviar un primer mensaje.
- Se crea lead canal `web`.
- Se crea conversación canal `web`.
- Se guarda mensaje cliente.
- Se ve conversación en `/inbox`.
- Menú persistente incluye Lumi Web para admin/agente.
- No se modifica `package.json`.

---

## Próximo sprint recomendado

Sprint 23 debe cerrar instalación Shopify + configuración por tienda:

```txt
Snippet Liquid
tracking UTM
asociación carrito/lead
medición de conversiones widget
```
