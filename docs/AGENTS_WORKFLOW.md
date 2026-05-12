# Flujo de trabajo Claude + GPT para Upzy/Klinge

Este documento define la forma oficial de trabajar con Claude y GPT en paralelo dentro del repositorio `klingechile/Upzy`, evitando conflictos de archivos, sobrescrituras y problemas de despliegue.

## Objetivo

Permitir que Claude y GPT trabajen al mismo tiempo sin pisarse cambios, separando responsabilidades por ownership de archivos y aplicando un flujo ordenado de ramas, pull, commits y merge.

---

## Principio base

La división se hace por archivos y carpetas, no por funcionalidad.

Aunque una funcionalidad toque frontend, backend, configuración y base de datos, cada agente solo debe modificar los archivos que pertenecen a su ownership. Si necesita tocar algo fuera de su zona, debe declararlo como bloqueo antes de modificar.

---

## Ownership oficial

| Claude | GPT |
|---|---|
| `src/services/` | `docs/` |
| `src/routes/` | `tests/` |
| `src/config/` | `scripts/` |
| `src/db/` | `public/*.js` (archivos JS auxiliares) |
| `src/middleware/` |  |
| `database/` |  |

> ⚠️ `public/dashboard.html` y `index.js` son **bloqueo manual** — ninguno tiene ownership exclusivo.

---

## Archivos especiales con bloqueo manual

Estos archivos pueden impactar deploy, dependencias, runtime o integración general. No se deben tocar sin aviso previo.

| Archivo | Owner real | Regla |
|---|---|---|
| `index.js` | Claude | Aviso obligatorio antes de tocar. GPT no debe modificarlo sin confirmación |
| `public/dashboard.html` | Compartido | Nunca al mismo tiempo. Declarar sección que se toca |
| `package.json` | Solo con aviso previo |
| `package-lock.json` | Solo si cambia dependencia y con aviso previo |
| `.nvmrc` | Solo si cambia versión de Node |
| `railway.json` | Solo si se modifica configuración de deploy |
| `.env.example` | Solo si se agregan o cambian variables de entorno |
| `README.md` | Permitido para documentación, pero avisando antes |

---

## Regla 1: nunca tocar el mismo archivo a la vez

Antes de pedirle una tarea a GPT o Claude, se debe declarar qué archivos va a tocar.

Ejemplo correcto:

```txt
Voy a tocar:
- public/templates-conversion.js
- docs/AGENTS_WORKFLOW.md

No tocaré:
- src/
- database/
- index.js
- package.json
```

Si otro agente está trabajando en alguno de esos archivos, se espera o se divide la tarea.

---

## Regla 2: pull antes de push

Antes de subir cambios, cada agente debe actualizar su rama desde `main`.

Flujo recomendado:

```bash
git checkout main
git pull --rebase origin main
git checkout -b gpt/nombre-feature
```

Antes de hacer push desde una rama ya creada:

```bash
git fetch origin
git rebase origin/main
```

Luego:

```bash
git add .
git commit -m "mensaje claro del cambio"
git push origin gpt/nombre-feature
```

Para Claude:

```bash
git checkout main
git pull --rebase origin main
git checkout -b claude/nombre-feature
```

---

## Regla 3: un branch por agente

Para evitar conflictos, cada agente debe trabajar en su propia rama.

### Ramas sugeridas para GPT

```bash
gpt/templates-ui
gpt/cart-recovery-ui
gpt/docs-upzy
gpt/tests-dashboard
gpt/scripts-maintenance
```

### Ramas sugeridas para Claude

```bash
claude/cart-recovery-backend
claude/shopify-webhook
claude/email-service
claude/supabase-schema
claude/config-env
```

El merge final debe hacerlo el responsable del repositorio después de revisar ambos cambios.

---

## Cómo pedir trabajo a GPT

GPT debe trabajar principalmente en:

```txt
public/
docs/
tests/
scripts/
```

Antes de modificar, GPT debe indicar archivos afectados.

Ejemplo:

```txt
Voy a tocar:
- public/cart-recovery-control.js

No tocaré:
- src/routes/
- src/services/
- database/
```

Si GPT necesita tocar un archivo de Claude, debe pedir bloqueo.

Ejemplo:

```txt
Bloqueo requerido:
Necesito tocar src/routes/api.automations.js.
Ese archivo es ownership de Claude.
Espero confirmación antes de modificar.
```

---

## Cómo pedir trabajo a Claude

Claude debe trabajar principalmente en:

```txt
src/services/
src/routes/
src/config/
src/db/
database/
```

Antes de modificar, Claude debe indicar archivos afectados.

Ejemplo:

```txt
Voy a tocar:
- src/services/cart-recovery.js
- src/routes/api.automations.js

No tocaré:
- public/
- docs/
- tests/
```

Si Claude necesita tocar frontend o documentación operativa, debe pedir bloqueo.

Ejemplo:

```txt
Bloqueo requerido:
Necesito tocar public/dashboard.html.
Ese archivo es ownership de GPT.
Espero confirmación antes de modificar.
```

---

## Casos mixtos

Cuando una funcionalidad requiere frontend y backend, se divide así:

### Ejemplo: carrito abandonado Shopify

| Parte | Responsable |
|---|---|
| Webhook Shopify | Claude |
| Servicio de recuperación | Claude |
| Endpoint API | Claude |
| Panel visual en dashboard | GPT |
| Documentación | GPT |
| Tests visuales o scripts auxiliares | GPT |
| Migraciones Supabase | Claude |

---

## Flujo recomendado para una funcionalidad completa

1. Definir objetivo funcional.
2. Separar archivos por ownership.
3. Claude trabaja backend en rama `claude/...`.
4. GPT trabaja frontend/docs/tests/scripts en rama `gpt/...`.
5. Ambos hacen `git pull --rebase` antes de push.
6. Se revisan commits.
7. Se hace merge controlado a `main`.
8. Railway despliega desde `main`.
9. Se valida `/health`, dashboard y endpoints críticos.

---

## Validación antes de merge

Antes de mergear cualquier cambio:

```bash
npm install
npm test
npm run verify
```

Si no existe una prueba automatizada para la funcionalidad, se debe validar manualmente:

- `/health`
- carga del dashboard
- navegación del módulo afectado
- consola del navegador sin errores críticos
- logs de Railway sin errores de arranque
- endpoints API afectados

---

## Reglas para deploy en Railway

No modificar configuración de Railway sin avisar.

Archivos sensibles:

```txt
railway.json
package.json
package-lock.json
.nvmrc
.env.example
index.js
```

Si se toca alguno de estos archivos, debe quedar indicado en el commit y en la revisión.

---

## Convención de commits

Usar mensajes claros y específicos.

Ejemplos:

```bash
git commit -m "Add cart recovery dashboard control"
git commit -m "Fix templates preview rendering"
git commit -m "Add Shopify cart recovery API"
git commit -m "Document Claude GPT workflow"
```

Evitar mensajes genéricos como:

```bash
git commit -m "changes"
git commit -m "fix"
git commit -m "update"
```

---

## Qué hacer si hay conflicto

1. No forzar push.
2. Revisar archivo en conflicto.
3. Ver quién tiene ownership del archivo.
4. El dueño del archivo decide resolución.
5. Si el archivo es especial, se resuelve manualmente con revisión.

Comandos base:

```bash
git fetch origin
git rebase origin/main
```

Si hay conflicto:

```bash
git status
```

Resolver archivo, luego:

```bash
git add archivo-resuelto
git rebase --continue
```

---

## Regla de emergencia

Si una corrección urgente requiere tocar archivos fuera del ownership, se debe declarar así:

```txt
Emergencia de producción:
Necesito tocar:
- src/routes/api.automations.js
- public/cart-recovery-control.js

Motivo:
El dashboard necesita activar/desactivar carrito abandonado conectado al webhook Shopify.

Riesgo:
Medio. Toca backend y frontend.

Validación:
- GET /api/automations/cart-recovery
- PATCH /api/automations/cart-recovery
- Dashboard > Carritos
```

Después de una emergencia, se debe documentar qué se tocó y dejar el ownership normalizado nuevamente.

---

## Resumen ejecutivo

- Claude trabaja backend, servicios, rutas, configuración, base de datos y migraciones.
- GPT trabaja frontend, dashboard, documentación, tests y scripts.
- Nunca se toca el mismo archivo al mismo tiempo.
- Siempre se hace pull/rebase antes de push.
- Idealmente cada agente trabaja en su propia rama.
- Los archivos sensibles requieren bloqueo manual.
- El merge final lo hace el responsable del repositorio.

---

## Cómo declarar bloqueo rápido (formato corto)

Antes de empezar, escribe en el chat:

```
BLOQUEO: voy a tocar index.js y src/routes/api.flows.js
Tarea: agregar endpoint de test de flow
Tiempo estimado: 10 min
```

El otro agente espera o trabaja en archivos distintos.

---

## Estado actual del repo

| Módulo | Owner | Estado |
|---|---|---|
| Auth / Login | Claude | ✅ Activo |
| Email + SES | Claude | ✅ Activo |
| Templates | Claude (backend) + GPT (UI) | ✅ Activo |
| Flows builder | Claude (backend) + GPT (UI) | ✅ Activo |
| Cart recovery | Claude (backend) + GPT (toggle UI) | ✅ Activo |
| Inbox bridge | Claude | ✅ Activo |
| Import CSV | Claude | ✅ Activo |
