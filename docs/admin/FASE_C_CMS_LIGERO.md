# Fase C — CMS ligero (comunicados, campañas, calendario)

- **Fecha:** 2026-07-31
- **Rama:** `feature/portal-administracion-comunitaria-v1`
- **Estado:** Implementada

## Alcance

Gestión de contenido desde el panel administrativo con publicación inmediata en el sitio público.

| Recurso | Modelo | Rol para mutar | Página admin | Página pública |
|---|---|---|---|---|
| Comunicados | `Announcement` | director, secretario, admin | `/admin/comunicados` | `/comunicados` (solo PUBLISHED) |
| Campañas | `Campaign` | director, tesorero, admin | `/admin/campanas` | `/campanas` (ACTIVE/COMPLETED) |
| Calendario | `CalendarEvent` | director, secretario, admin | `/admin/calendario` | `/calendario` (no CANCELLED, futuros) |

## Modelos nuevos

```prisma
Announcement: title, body, category, status(DRAFT|PUBLISHED|ARCHIVED), publishedAt, createdById
Campaign:      title, description, goalAmount?, collectedAmount, status(DRAFT|ACTIVE|COMPLETED|CANCELLED), startsAt?, endsAt?, createdById
CalendarEvent: title, description?, location?, startsAt, endsAt?, status(SCHEDULED|COMPLETED|CANCELLED), createdById
```

Aplicados a producción vía `prisma db push` + `generate`.

## Seguridad

- **GET** de cada recurso: requiere sesión admin (guard `guardAdminRequest`).
- **POST/PATCH/DELETE**: requiere sesión + **rol** específico + **CSRF** (`x-csrf-token`).
- `admin` pasa cualquier guard (regla global de RBAC).
- Validación con Zod (`apps/web/src/lib/cms/validation.ts`): títulos ≤ 200, body ≤ 10 000, fechas ISO, enums estrictos.
- Páginas públicas solo exponen estados publicables; `publishedAt` se asigna automáticamente al publicar.

## Rutas API

- `/api/admin/announcements` — GET listar, POST crear (roles+CSRF)
- `/api/admin/announcements/[id]` — PATCH editar/publicar, DELETE (roles+CSRF)
- `/api/admin/campaigns` y `/[id]` — análogo (roles: director, tesorero)
- `/api/admin/calendar-events` y `/[id]` — análogo (roles: director, secretario)

## Pruebas

- `pnpm test` → 40 tests (13 nuevos de validación CMS).
- `pnpm typecheck`, `pnpm build` → pasan.
- Smoke local: crear comunicado DRAFT → publicar → visible en `/comunicados`; campaña ACTIVE visible en `/campanas`; evento visible en `/calendario`; POST sin sesión → 401; limpieza de datos de prueba exitosa.

## Nota de codificación

El smoke test con PowerShell enviando `ñ` por `Invoke-RestMethod` corrompió el texto (problema del shell, no de la app). Desde navegador la codificación UTF-8 es correcta.

## Pendientes

- Adjuntos / imágenes en comunicados (requiere storage).
- Programación de publicación futura.
- Vinculación campañas ↔ pagos (recaudación automática).
