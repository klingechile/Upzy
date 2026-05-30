# UPZY — Sprint 9 Reportes, Funnel y Atribución

## Objetivo

Construir el módulo frontend de Reportes, Funnel y Atribución para medir el rendimiento comercial de UPZY por canal, módulo, campaña, automatización y revenue.

Sprint 9 transforma los eventos generados por los módulos anteriores en lectura ejecutiva y operativa: qué canal trae clientes, qué flujo convierte, dónde se pierde la venta y qué acción genera ingresos.

---

## Resultado esperado

Al finalizar Sprint 9, UPZY debe permitir revisar visualmente:

- Dashboard ejecutivo de performance.
- Funnel comercial completo.
- Atribución por canal.
- Performance por módulo.
- Revenue atribuido.
- Conversión por automatización.
- Salud del pipeline.
- Eventos críticos.
- Contrato de métricas y atribución.

La vista sigue usando datos mock. No calcula métricas reales desde base de datos en esta etapa.

---

## Alcance funcional

### Incluido

- Ruta viva `/upzy` apuntando a Sprint 9.
- Página directa `/upzy-sprint9.html`.
- Vista de Reportes, Funnel y Atribución.
- Métricas mock ejecutivas.
- Funnel comercial visual.
- Atribución por canal.
- Performance por módulo.
- Ranking de automatizaciones.
- Timeline de eventos críticos.
- Contrato de datos de reporte.
- Documentación funcional y técnica.

### No incluido

- Cálculo real desde Supabase.
- Integración real con Shopify Analytics.
- Integración real con Meta Ads.
- Modelo de atribución multitouch productivo.
- Exportación CSV/PDF.
- Alertas reales.
- Dashboard BI externo.

---

## Módulo funcional

```txt
Reportes, Funnel y Atribución
```

Responsabilidad:

```txt
Convertir eventos comerciales en indicadores para tomar decisiones, priorizar inversión y mejorar continuamente la operación.
```

---

## Componentes frontend

```txt
ReportsDashboard
ExecutiveMetricCards
CommercialFunnelReport
ChannelAttributionReport
ModulePerformanceTable
AutomationRanking
CriticalEventTimeline
AttributionContract
```

---

## Eventos de entrada

```txt
lead.created
lead.email_captured
coupon.generated
cart.abandoned_detected
cart.recovered
email.clicked
email.converted
instagram.message_received
lumi.intent_detected
automation.completed
purchase.completed
```

---

## Indicadores iniciales

```txt
leads_totales
leads_hot
capturas_email
carritos_abandonados
carritos_recuperados
conversion_rate
revenue_atribuido
recovery_rate
email_ctr
automation_success_rate
```

---

## Contrato de datos

```ts
type ReportMetric = {
  id: string;
  name: string;
  value: number | string;
  period: 'today' | '7d' | '30d' | 'custom';
  sourceModule: string;
  comparison?: string;
};

type AttributionItem = {
  channel: 'web' | 'instagram' | 'whatsapp' | 'email' | 'shopify' | 'manual';
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
};
```

---

## Reportes iniciales

### 1. Funnel comercial

```txt
visitantes → leads → leads calificados → cotizaciones → carritos → compras
```

### 2. Atribución por canal

```txt
web
instagram
whatsapp
email
shopify
manual
```

### 3. Performance por módulo

```txt
CRM
Captación Web
Ruleta
Email Marketing
Carritos Abandonados
Lumi Web
Omnicanalidad
Automatizaciones
```

### 4. Automatizaciones

```txt
ejecuciones
completadas
fallidas
revenue atribuido
```

---

## Reglas de medición

1. Todo evento comercial debe tener sourceModule.
2. Todo evento de conversión debe poder asociarse a canal.
3. Revenue debe asociarse a compra, carrito recuperado o cotización cerrada.
4. Las métricas deben poder filtrarse por período.
5. El reporte debe separar volumen de conversión.
6. La atribución inicial será simple: último evento comercial relevante.
7. Los reportes deben mostrar dónde se pierde la oportunidad.
8. Las métricas deben alimentar mejora continua por sprint.

---

## Relación con otros sprints

### Depende de Sprint 1 a Sprint 8

Consume eventos de todos los módulos ya diseñados.

### Habilita Sprint 10 — Hardening y Beta Operativa

Permite validar qué módulos deben conectarse primero a datos reales y qué flujos tienen mayor impacto comercial.

---

## Criterios de aceptación

- `/upzy` carga Sprint 9.
- `/upzy-sprint9.html` existe como ruta directa.
- `/dashboard` sigue eliminado.
- Se visualizan métricas ejecutivas.
- Se visualiza funnel comercial.
- Se visualiza atribución por canal.
- Se visualiza performance por módulo.
- Se visualiza ranking de automatizaciones.
- Se visualiza timeline de eventos críticos.
- Se documenta contrato de datos.
- No se agregan dependencias npm.
- No se modifica `package.json`.

---

## Decisión técnica

Sprint 9 mantiene el módulo separado en:

```txt
public/assets/upzy-reports-data.js
public/assets/upzy-reports.css
public/assets/upzy-reports.js
```

La integración real debe hacerse después por API/eventos y no acoplando la vista a consultas directas de cada módulo.

---

## Próximo sprint

Sprint 10 debe enfocarse en hardening, QA, beta operativa, selección de módulos a conectar a datos reales y plan de despliegue productivo.
