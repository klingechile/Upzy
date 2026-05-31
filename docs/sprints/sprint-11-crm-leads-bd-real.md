# UPZY — Sprint 11 CRM + Leads con BD Real

## Objetivo

Conectar el primer módulo real de UPZY a datos productivos del backend: CRM Comercial, Leads, Estadísticas y Carritos Pendientes.

Sprint 11 marca el paso desde frontend mock a beta operativa con datos reales, pero de forma controlada y segura.

---

## Decisión técnica

La conexión real comienza por CRM porque ya existen endpoints protegidos por JWT y consultas Supabase en backend.

Endpoints disponibles:

```txt
GET /api/leads
GET /api/leads/estadisticas
GET /api/leads/carritos
GET /api/leads/:id
PATCH /api/leads/:id
POST /api/leads/:id/score
POST /api/leads/:id/asignar-agente
```

La UI no consulta Supabase directamente. Consume el backend usando el token guardado en `sessionStorage.upzy_token`.

---

## Regla crítica de seguridad

```txt
Nunca exponer SUPABASE_SERVICE_ROLE_KEY en frontend.
```

El frontend debe usar:

```txt
Authorization: Bearer <upzy_token>
```

El backend valida el JWT mediante Supabase Auth y luego consulta Supabase con service role en servidor.

---

## Resultado esperado

Al finalizar Sprint 11, UPZY debe permitir revisar:

- CRM Comercial conectado a `/api/leads`.
- Métricas conectadas a `/api/leads/estadisticas`.
- Carritos pendientes conectados a `/api/leads/carritos`.
- Estados `loading`, `error`, `empty`.
- Fallback controlado a mocks si no hay sesión o si falla la API.
- Sprint histórico directo `/upzy-sprint11.html`.
- Ruta viva `/upzy` apuntando a Sprint 11.

---

## Alcance incluido

- Crear vista Sprint 11.
- Crear cliente frontend seguro para API.
- Crear render CRM live.
- Mantener fallback mock.
- Agregar banner de estado de conexión.
- Mapear campos reales a UI.
- Actualizar login para redirigir a `/upzy` y no a `/dashboard`.
- Documentar la conexión.

---

## Alcance no incluido

- No crear migraciones SQL.
- No modificar schema Supabase.
- No conectar todos los módulos.
- No conectar reportes avanzados.
- No conectar Instagram real.
- No exponer credenciales Supabase en frontend.
- No eliminar mocks históricos.

---

## Contrato esperado de leads

Endpoint:

```txt
GET /api/leads
```

Campos esperados:

```ts
type LeadApiItem = {
  id: string;
  nombre?: string;
  empresa?: string;
  canal?: string;
  segmento?: 'hot' | 'warm' | 'cold';
  score?: number;
  etapa?: 'nuevo' | 'contactado' | 'calificado' | 'propuesta' | 'cerrado';
  ultimo_contacto?: string;
  telefono?: string;
  email?: string;
};
```

---

## Contrato esperado de estadísticas

Endpoint:

```txt
GET /api/leads/estadisticas
```

Campos esperados:

```ts
type LeadStats = {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  por_etapa: {
    nuevo: number;
    contactado: number;
    calificado: number;
    propuesta: number;
    cerrado: number;
  };
  score_promedio: string | number;
  revenue_total: number;
};
```

---

## Contrato esperado de carritos

Endpoint:

```txt
GET /api/leads/carritos
```

La vista inicial solo necesita conteo y monto cuando exista. La estructura puede ajustarse en Sprint 12.

---

## Estados UX

### Loading

```txt
Conectando con BD real...
```

### Live

```txt
Datos reales desde API protegida.
```

### Fallback

```txt
Sin sesión o API no disponible. Mostrando mock controlado.
```

### Error

```txt
Error de API visible sin bloquear la vista.
```

---

## Mapeo UI

| UI | Campo real | Fallback |
|---|---|---|
| Lead | nombre | Cliente sin nombre |
| Empresa | empresa | Sin empresa |
| Canal | canal | CRM |
| Etapa | etapa | nuevo |
| Termómetro | segmento | cold |
| Score | score | 1 |
| Última interacción | ultimo_contacto | Sin fecha |
| Producto | no disponible aún | Pendiente capturar |
| Monto | no disponible aún | — |
| Próxima acción | derivada por segmento/etapa | Calificar lead |

---

## Criterios de aceptación

- `/upzy` carga Sprint 11.
- `/upzy-sprint11.html` existe.
- Login redirige a `/upzy`.
- Si hay token válido, la UI llama a `/api/leads`, `/api/leads/estadisticas` y `/api/leads/carritos`.
- Si no hay token, la UI no rompe y muestra mock fallback.
- Si API falla, la UI muestra estado de error/fallback.
- No se expone service role.
- No se modifica `package.json`.
- No se rompe `/login`.

---

## Próximo sprint

Sprint 12 debe conectar Captación Web y Carritos reales:

```txt
POST /api/capture/leads
GET /api/carts/abandoned
POST /api/events
```

También debe definir el modelo final de eventos comerciales.
