# Fase B — Autenticación con roles y panel administrativo

- **Fecha:** 2026-07-31
- **Rama:** `feature/portal-administracion-comunitaria-v1`
- **Estado:** Implementada

## Alcance

1. **Autenticación institucional** sobre los modelos existentes `User` / `RoleAssignment`.
2. **Sesión segura**: cookie `httpOnly` firmada (HMAC-SHA256) con expiración de 12 h.
3. **CSRF** (doble cookie + header `x-csrf-token`) en mutaciones admin.
4. **RBAC**: roles `admin`, `director`, `tesorero`, `secretario`, `vocal`, `resident`. `admin` pasa cualquier guard.
5. **Panel administrativo** con dashboard (stats reales), solicitudes de contacto (cambio de estado), unidades (catálogo), pagos/egresos (existentes), documentos (visibilidad).

## Seguridad implementada

- Contraseñas con **scrypt** (salt aleatorio por usuario) — sin dependencias nuevas (`node:crypto`).
- Login con rate limit por IP (6 intentos / 15 min → bloqueo).
- Session cookie `httpOnly`, `secure` en producción, `SameSite=Lax`.
- CSRF obligatorio en mutaciones (`PATCH /api/admin/contact-requests/[id]`).
- Middleware protege `/admin` (redirige a `/login` si no hay sesión).
- Endpoints MP existentes siguen protegidos por `ADMIN_API_KEY` (Bearer) — no se tocó su contrato.

## Variables de entorno (agregar en Vercel y `.env.local`)

| Variable | Descripción |
|---|---|
| `SESSION_SECRET` | Clave de firma de sesión (≥32 chars aleatorios) |
| `CSRF_SECRET` | Clave de firma CSRF (≥32 chars aleatorios) |

Nota: `SESSION_SECRET` y `CSRF_SECRET` deben **diferir**. En tests se usa un valor fijo de prueba.

## Crear el primer usuario administrador

```powershell
# Desde la raíz del repo
$env:ADMIN_INITIAL_EMAIL = "admin@comunidadalbas.com.mx"
$env:ADMIN_INITIAL_PASSWORD = "cambia-esta-contrasena-fuerte"
$env:ADMIN_INITIAL_NAME = "Administración"
pnpm db:seed-admin
```

El script (`packages/db/scripts/seed-admin.mts`) hace upsert por email y asigna el rol `admin`.

> **Importante:** usar una contraseña de ≥12 caracteres. El token de Mercado Pago y estas credenciales solo deben vivir en Vercel / secret manager, nunca en el repo.

## Acceso

- Login: `/login` (o visitar cualquier ruta `/admin`).
- Panel: `/admin`.

## Rutas nuevas

### Páginas
- `/login` — formulario de acceso.
- `/admin` — dashboard con stats reales (solicitudes, unidades, pagos por confirmar, egresos por autorizar).
- `/admin/solicitudes` — bandeja de solicitudes de contacto con cambio de estado.
- `/admin/unidades` — catálogo de edificios/departamentos desde BD.
- `/admin/documentos` — listado de documentos con su visibilidad.

### API
- `POST /api/admin/auth/login` — inicia sesión, setea cookies de sesión y CSRF.
- `POST /api/admin/auth/logout` — limpia cookies.
- `GET /api/admin/auth/me` — devuelve usuario de sesión.
- `GET /api/admin/contact-requests` — listar solicitudes (guard de sesión).
- `PATCH /api/admin/contact-requests/[id]` — cambiar estado (guard de sesión + CSRF).

## Pruebas

- `pnpm test` → 27 tests (10 de auth nuevos: password + sesión + CSRF).
- `pnpm typecheck` y `pnpm build` → pasan.

## Deuda / pendientes para Fases posteriores

- Gestión de usuarios/roles desde el panel (CRUD completo) — Fase D.
- Auditoría (`AuditLog`) aún no se escribe en runtime — Fase D.
- Documentos con carga de archivos real (CMS) — Fase C.
- `isEmailAllowed` en pagos (allowlist) pendiente de decisión — no se toca sin aprobación.
