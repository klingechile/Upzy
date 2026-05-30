# UPZY — Sprint 5 Carritos Abandonados

## Objetivo

Construir el módulo frontend de Carritos Abandonados para recuperar compras incompletas desde Shopify mediante email, WhatsApp, Lumi y seguimiento comercial medible.

El sprint conecta Ecommerce, CRM, Email Marketing y futura automatización omnicanal. El foco no es solo mostrar carritos, sino priorizar recuperación según monto, producto, canal, tiempo y temperatura comercial.

---

## Resultado esperado

Al finalizar Sprint 5, UPZY debe permitir revisar visualmente:

- Dashboard de carritos abandonados.
- Métricas de recuperación.
- Lista priorizada de carritos.
- Detalle de producto, monto y checkout.
- Estado de recuperación por carrito.
- Secuencia sugerida por email, WhatsApp y Lumi.
- Timeline de eventos comerciales.
- Contrato de datos del carrito.

La vista sigue usando datos mock. No ejecuta recuperación real desde esta nueva interfaz.

---

## Alcance funcional

### Incluido

- Ruta viva `/upzy` apuntando a Sprint 5.
- Página directa `/upzy-sprint5.html`.
- Vista de Carritos Abandonados.
- Métricas mock.
- Tabla/listado de carritos priorizados.
- Preview de recuperación.
- Secuencia comercial sugerida.
- Eventos de carrito.
- Contrato de datos.
- Documentación funcional y técnica.

### No incluido

- Sincronización real con Shopify desde esta vista.
- Envío real de email o WhatsApp.
- Recuperación automática productiva.
- Validación real de checkout_url.
- Persistencia real nueva.
- Gestión legal avanzada de consentimiento.
- Motor antifraude o deduplicación productiva.

---

## Módulo funcional

```txt
Carritos Abandonados
```

Responsabilidad:

```txt
Detectar intención de compra inconclusa, priorizarla comercialmente y activar recuperación medible por canal.
```

---

## Componentes frontend

```txt
AbandonedCartsDashboard
CartMetricCards
AbandonedCartList
CartRecoveryPreview
CartRecoverySequence
CartEventTimeline
CartDataContract
CartPriorityBadge
```

---

## Eventos de entrada

```txt
cart.created
cart.updated
cart.abandoned_detected
lead.email_captured
coupon.generated
email.clicked
whatsapp.clicked
purchase.completed
```

---

## Eventos propios

```txt
cart.abandoned_detected
cart.recovery_started
cart.email_sent
cart.whatsapp_suggested
cart.lumi_followup_started
cart.recovered
cart.expired
```

---

## Contrato de datos

```ts
type AbandonedCart = {
  id: string;
  shopifyCartId?: string;
  leadId?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  product: string;
  variant?: string;
  quantity: number;
  amount: number;
  checkoutUrl: string;
  source: 'shopify' | 'web' | 'lumi' | 'manual';
  status: 'new' | 'recovering' | 'recovered' | 'expired';
  priority: 'high' | 'medium' | 'low';
  lastActivityAt: string;
  recoveryStep: string;
};
```

---

## Reglas comerciales

1. Todo carrito debe mantener producto y checkout_url.
2. Si existe email, se activa secuencia de email.
3. Si existe teléfono, se sugiere WhatsApp.
4. Si existe cupón, debe viajar en la recuperación.
5. Carritos de mayor monto o alta intención deben priorizarse.
6. Si no hay respuesta, Lumi puede hacer seguimiento conversacional.
7. Cada acción debe emitir evento medible.
8. Si el carrito se recupera, debe cerrar el ciclo con purchase.completed.

---

## Secuencia sugerida

```txt
0 min  → Email inmediato con producto y checkout
2 h    → WhatsApp sugerido para lead HOT
24 h   → Email recordatorio con urgencia
48 h   → Lumi seguimiento y resolución de objeciones
72 h   → Última oportunidad / expira recuperación
```

---

## Relación con otros sprints

### Depende de Sprint 1 — CRM Comercial

Usa lead, owner, temperatura comercial y próxima mejor acción.

### Depende de Sprint 4 — Email Marketing

Usa plantilla de carrito abandonado y métricas de apertura/clic/conversión.

### Habilita Sprint 6 — Lumi Web

Permite que Lumi haga seguimiento conversacional del carrito abandonado.

### Habilita Sprint 8 — Automatizaciones

El flujo completo se convertirá en automatización configurable.

---

## Criterios de aceptación

- `/upzy` carga Sprint 5.
- `/upzy-sprint5.html` existe como ruta directa.
- `/dashboard` sigue intacto.
- Se visualizan métricas de carritos.
- Se visualizan carritos priorizados.
- Cada carrito muestra producto, monto, canal, estado y próxima acción.
- Se visualiza secuencia de recuperación.
- Se visualiza timeline de eventos.
- Se documenta contrato de datos.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 5 mantiene el módulo separado en:

```txt
public/assets/upzy-carts.css
public/assets/upzy-carts.js
```

La integración real debe hacerse después vía eventos y API, sin acoplar el frontend directamente a Shopify ni a Email Marketing.

---

## Próximo sprint

Sprint 6 debe implementar Lumi en Sitio Web como motor conversacional capaz de capturar datos, recomendar producto, cotizar y hacer seguimiento de carritos abandonados.
