# UPZY — Sprint 15 Reportes Reales + Atribución

## Objetivo

Consolidar la medición real de UPZY usando datos ya conectados de CRM, Captación Web, Carritos, Email, Automatizaciones y Eventos Comerciales.

Sprint 15 transforma las conexiones live de los sprints 11 al 14 en una lectura ejecutiva única: funnel real, atribución por canal, salud por módulo, eventos recientes y próximos focos de mejora.

---

## Resultado esperado

Al finalizar Sprint 15, UPZY debe permitir revisar:

- Ruta viva `/upzy` apuntando a Sprint 15.
- Página directa `/upzy-sprint15.html`.
- Endpoint consolidado `GET /api/reports/overview`.
- Métricas reales consolidadas.
- Funnel real basado en leads/etapas.
- Atribución simple por canal.
- Revenue real cuando exista en BD.
- Estado de carritos reales.
- Eventos comerciales recientes.
- Salud por módulo.
- Fallback controlado si alguna tabla no existe.

---

## Decisión técnica

El frontend no debe calcular reportes llamando pantallas sueltas. La UI debe consumir un endpoint consolidado:

```txt
GET /api/reports/overview
```

Este endpoint centraliza:

```txt
CRM leads/stats
Carritos abandonados
Eventos comerciales
Email sends
Automatizaciones si existen
```

---

## Endpoints Sprint 15

### GET /api/reports/overview

Respuesta esperada:

```ts
type ReportsOverview = {
  ok: boolean;
  period: '30d';
  metrics: {
    leads_total: number;
    leads_hot: number;
    conversion_rate: number;
    carts_pending: number;
    carts_recovered: number;
    recovery_rate: number;
    revenue_total: number;
    events_total: number;
  };
  funnel: Array<{
    stage: string;
    count: number;
    rate: number;
    value?: number;
  }>;
  attribution: Array<{
    channel: string;
    leads: number;
    conversions: number;
    revenue: number;
    conversion_rate: number;
  }>;
  moduleHealth: Array<{
    module: string;
    status: 'OK' | 'Mejorar' | 'Sin datos';
    detail: string;
  }>;
  events: Array<Record<string, unknown>>;
};
```

---

## Modelo de atribución inicial

La atribución inicial es simple y conservadora:

```txt
Canal del lead = canal atribuido
Conversión = lead en etapa cerrado
Revenue = total_gastado si existe
```

Esto no reemplaza atribución avanzada, pero permite iniciar decisiones reales sin esperar un modelo multitouch.

---

## Reglas funcionales

1. Reportes deben leer datos reales desde backend protegido.
2. Si una tabla no existe, el reporte no debe romper.
3. El endpoint debe devolver warnings cuando falten fuentes.
4. Revenue debe ser 0 si todavía no existe dato monetario.
5. Funnel debe basarse en etapas reales del CRM.
6. Atribución inicial debe usar canal del lead.
7. Eventos deben alimentar timeline y salud del sistema.
8. La UI debe mostrar estado live/error/empty.

---

## Alcance incluido

- Endpoint consolidado de reportes.
- Vista live Sprint 15.
- Métricas reales base.
- Funnel real.
- Atribución por canal.
- Salud por módulo.
- Timeline de eventos reales.
- Warnings visibles si faltan tablas.

---

## Alcance no incluido

- Atribución multitouch avanzada.
- Conexión Meta Ads real.
- Exportación PDF/CSV.
- Forecasting predictivo.
- Dashboard BI externo.
- Revenue contable validado.

---

## Criterios de aceptación

- `/upzy` carga Sprint 15.
- `/upzy-sprint15.html` existe.
- `GET /api/reports/overview` responde protegido por JWT.
- UI muestra métricas reales o estado vacío controlado.
- UI muestra funnel real.
- UI muestra atribución por canal.
- UI muestra salud por módulo.
- UI muestra eventos recientes.
- No se expone service role.
- No se modifica `package.json`.
- Sprints 11 al 14 siguen accesibles como históricos.

---

## Próximo sprint

Sprint 16 debe cerrar Beta Operativa:

```txt
QA final
Navegación final
Estados vacíos
Roles mínimos
Checklist producción
Smoke tests
Documentación de operación
```
