# Fase D — Solicitudes con folio, usuarios/roles y auditoría

- **Fecha:** 2026-08-01
- **Rama:** `feature/portal-administracion-comunitaria-v1`
- **Estado:** Implementada

## Alcance

1. **Folio de solicitud**: cada contacto recibe un folio único legible `CA-YYYY-NNNNNN` (ej. `CA-2026-000007`).
2. **Consulta ciudadana de estado**: el vecino puede rastrear su solicitud por folio + correo.
3. **Gestión de usuarios y roles**: CRUD completo de usuarios del panel, exclusivo del rol `admin`.
4. **Bitácora de auditoría**: registro inmutable de acciones administrativas.

## Folio

- Modelo: `ContactRequest.folio` (`String? @unique`), columna nullable agregada por `db push --accept-data-loss` (los 6 registros existentes se **rebackfillaron** con folios secuenciales).
- Generación: `apps/web/src/lib/solicitudes/folio.ts` → formato `CA-{año}-{secuencia a 6 dígitos}`. Secuencia = máximo existente del año + 1, con reintento ante conflicto P2002 (concurrencia).
- Se asigna en `POST /api/contact` y se devuelve en la respuesta `{ folio }`.
- El formulario público `/contacto` muestra el folio al ciudadano tras el envío.

## Consulta de estado

- `POST /api/solicitudes/status` — body `{ folio, email }`. Devuelve folio, categoría, estado, fechas. Requiere coincidencia folio **y** correo. Rate limit 10/min por IP.
- Página pública `/solicitud` con formulario y resultado (estados traducidos, badges).
- Enlace agregado en el footer del sitio y en la pantalla de éxito de `/contacto`.

## Gestión de usuarios (solo admin)

- `GET /api/admin/users` — listar usuarios con roles, estado y último acceso.
- `POST /api/admin/users` — crear (email, nombre, contraseña ≥ 12, roles).
- `PATCH /api/admin/users/[id]` — editar nombre, roles, activar/desactivar, resetear contraseña.
- `DELETE /api/admin/users/[id]` — eliminar (suelta referencias de auditoría).
- Validación Zod en `apps/web/src/lib/users/validation.ts`.
- Página `/admin/usuarios` (tabla + formulario). Guardas:
  - No puedes desactivar ni eliminar tu propia cuenta.
  - No se puede eliminar el último usuario con rol `admin`.

## Auditoría

- Helper `apps/web/src/lib/audit.ts` (`writeAuditLog`, acciones tipadas).
- Se registra: login exitoso, cambio de estado de solicitud, creación/edición/eliminación de comunicados, campañas y eventos, y gestión de usuarios (create/update/delete).
- Página `/admin/auditoria` (solo admin): últimas 200 acciones con usuario, acción, entidad y antes/después.
- `AuditLog.userId` se nulifica al eliminar el usuario (evita orfandad).

## Notas de implementación

- **Neon HTTP adapter no soporta transacciones interactivas** (`$transaction(async tx => ...)`), ni `createMany`. Se reemplazó por operaciones secuenciales con `Promise.all`. Importante para futuras fases.
- El folio no se puede regenerar para solicitudes ya creadas vía API; el backfill de registros legacy se hizo con script directo a BD.

## Pruebas

- `pnpm test` → 62 tests (22 nuevos: 12 folio + 10 validación de usuarios).
- `pnpm typecheck`, `pnpm build` → pasan.
- Smoke local verificado:
  - Crear contacto → folio `CA-2026-000001` → consulta estado OK; correo incorrecto → 404.
  - Crear usuario (201), editar roles/estado (200), eliminar (200); sin CSRF → 401/403; auto-desactivar/eliminar → 400.
  - Cambio de estado de solicitud registrado en auditoría; página `/admin/auditoria` muestra LOGIN, USER_CREATE, USER_DELETE.
  - Datos de prueba eliminados al finalizar; los 6 registros legacy tienen folio asignado.

## Pendientes

- Notificación por correo del folio al ciudadano (depende de SMTP, Fase E).
- Paginación del listado de auditoría.
