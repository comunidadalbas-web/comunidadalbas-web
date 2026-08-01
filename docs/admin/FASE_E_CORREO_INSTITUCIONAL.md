# Fase E — Correo institucional (Zoho SMTP, plantillas y notificaciones)

- **Fecha:** 2026-08-01
- **Rama:** `feature/portal-administracion-comunitaria-v1`
- **Estado:** Implementada

## Alcance

Sistema de correo institucional con plantillas HTML con marca, basado en el adaptador SMTP ya existente, y notificaciones automáticas en los flujos de solicitudes y usuarios.

## Arquitectura

```
apps/web/src/lib/email.ts              → adaptador SMTP base (nodemailer, Zoho)
apps/web/src/lib/email/templates.ts    → plantillas HTML puras + escape + labels
apps/web/src/lib/email/notifications.ts→ orquestadores de envío (componen y mandan)
```

### Plantillas (`templates.ts`)
- `layout()`: envoltura HTML con header (marca) y footer, estilos inline aptos para clientes de correo. Escapa título y marca.
- `renderContactConfirmation()`: acuse al ciudadano con **folio** y botón a `/solicitud`.
- `renderContactAdminNotification()`: detalle completo de la solicitud para la administración.
- `renderSolicitudStatusChange()`: aviso de cambio de estado con estado actual y enlace.
- `renderUserWelcome()`: bienvenida a usuarios del panel con roles asignados.
- `escapeHtml()`: sanitiza todos los campos controlados por el usuario (anti XSS en correo).
- Cada render devuelve `{ subject, html, text }` (alternativa texto plano incluida).

### Notificaciones (`notifications.ts`)
Funciones `sendX()` que renderizan la plantilla y llaman al adaptador. Si SMTP no está configurado, el adaptador devuelve `{ success: false }` **sin lanzar error**, así el flujo nunca se bloquea.

## Flujos conectados

| Evento | Correo |
|---|---|
| Nueva solicitud vía `/api/contact` | Confirmación al ciudadano (folio) + notificación a `CONTACT_NOTIFICATION_EMAIL` (en paralelo, `Promise.all`) |
| Cambio de estado de solicitud (`PATCH /api/admin/contact-requests/[id]`) | Avísale al ciudadano cuando el estado **realmente cambia** y la solicitud tiene `email` y `folio` |
| Alta de usuario (`POST /api/admin/users`) | Bienvenida al nuevo usuario con roles asignados (la contraseña la define la administración; no se envía por correo) |

En `/api/contact`, `notifiedAt` se marca si al menos un envío (admin o ciudadano) fue exitoso.

## Configuración

Variables en `.env` / Vercel:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `CONTACT_NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_SITE_URL` (para enlaces dentro de los correos: `/solicitud`, `/login`)

Zoho: puerto 465 con `SMTP_SECURE=true`, o 587 con STARTTLS. Se requiere una clave de aplicación (no la contraseña normal) en Zoho.

## Pruebas

- `pnpm test` → 77 tests (15 nuevos de plantillas: escape, contenido, labels, inyección HTML).
- `pnpm typecheck`, `pnpm build` → pasan.
- Smoke local sin SMTP configurado: `POST /api/contact` → 201 con folio; `PATCH` de estado → 200; los envíos fallan silenciosamente sin errores en el log ni bloqueo.

## Pendientes

- Configurar credenciales Zoho reales en Vercel/producción y verificar entrega (SPF/DKIM en `comunidadalbas.com.mx`).
- Correo de recuperación de contraseña / reset de usuarios (requiere flujo de token).
- Opción de adjuntar documentación en las notificaciones.
