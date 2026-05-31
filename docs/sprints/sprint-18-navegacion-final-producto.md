# UPZY — Sprint 18 Navegación Final de Producto

## Objetivo

Dejar de operar UPZY desde páginas de sprint y pasar a una navegación final de producto, con rutas estables por módulo y una portada operativa en `/upzy`.

Sprint 18 no elimina los históricos `/upzy-sprintXX.html`. Los conserva como respaldo técnico, pero deja rutas de producto para uso diario.

---

## Resultado esperado

Al finalizar Sprint 18, UPZY debe permitir operar desde:

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

Y conservar históricos:

```txt
/upzy-sprint11.html
/upzy-sprint12.html
/upzy-sprint13.html
/upzy-sprint14.html
/upzy-sprint15.html
/upzy-sprint16.html
/upzy-sprint17.html
/upzy-sprint18.html
```

---

## Decisión funcional

`/upzy` pasa a ser la portada del producto, no una pantalla de sprint.

Desde `/upzy`, el usuario debe entender rápidamente:

- Qué módulos están live.
- Qué rutas debe usar para operar.
- Qué módulos son críticos.
- Qué quedó en histórico técnico.
- Cuál es la operación diaria recomendada.

---

## Mapa de rutas finales

| Ruta | Módulo | Pantalla base |
|---|---|---|
| `/upzy` | Home producto | `upzy-product.html` |
| `/crm` | CRM Comercial | `upzy-sprint11.html` |
| `/captacion` | Captación Web | `upzy-sprint12.html` |
| `/carritos` | Carritos Abandonados | `upzy-sprint13.html` |
| `/email` | Email Marketing | `upzy-sprint14.html` |
| `/automatizaciones` | Automatizaciones | `upzy-sprint14.html` |
| `/reportes` | Reportes Reales | `upzy-sprint15.html` |
| `/configuracion` | Usuarios, roles y auditoría | `upzy-sprint17.html` |
| `/beta` | Beta status | `upzy-sprint16.html` |

---

## Reglas de navegación

1. El usuario no debe necesitar saber qué sprint corresponde a cada módulo.
2. Los sprints históricos quedan para revisión técnica.
3. Las rutas finales deben ser legibles y estables.
4. `/upzy` debe servir como home operacional.
5. El login debe seguir redirigiendo a `/upzy`.
6. No se debe restaurar `/dashboard` legacy.

---

## Criterios de aceptación

- `/upzy` carga la nueva portada de producto.
- `/crm` carga CRM Live.
- `/captacion` carga Captación Web Live.
- `/carritos` carga Carritos Live.
- `/email` carga Email/Automatizaciones Live.
- `/automatizaciones` carga Email/Automatizaciones Live.
- `/reportes` carga Reportes Live.
- `/configuracion` carga Roles/Auditoría.
- `/beta` carga Beta Operativa.
- Históricos por sprint siguen disponibles.
- No se modifica `package.json`.
- No se elimina ningún sprint previo.

---

## Próximo sprint recomendado

Sprint 19 debe enfocarse en productización operativa:

```txt
Estados finales por rol
Menú persistente con enlaces reales
Pulir UI responsive
Accesos rápidos por rol
Smoke tests finales
```

Luego Sprint 20 puede enfocarse en Lumi/Instagram real avanzado o monitoreo producción.
