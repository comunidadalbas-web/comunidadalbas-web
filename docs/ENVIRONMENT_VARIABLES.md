# Variables de entorno

## Local (`.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://albas:albas_dev@localhost:5432/comunidad_albas?schema=public` |
| `NEXT_PUBLIC_SITE_URL` | URL del sitio | `http://localhost:3000` |
| `SESSION_SECRET` | Secreto para sesiones (min 32 chars) | `cambiar-por-un-secreto-seguro-de-al-menos-32-caracteres` |
| `CSRF_SECRET` | Secreto para CSRF (min 32 chars) | `cambiar-por-otro-secreto-diferente-de-al-menos-32` |
| `SMTP_HOST` | Servidor SMTP | `smtp.zoho.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_SECURE` | TLS | `false` |
| `SMTP_USER` | Usuario SMTP | `secretaria@comunidadalbas.com.mx` |
| `SMTP_PASS` | Contraseña SMTP | (en Vercel env, no exponer) |
| `SMTP_FROM` | Remitente | `secretaria@comunidadalbas.com.mx` |
| `CONTACT_NOTIFICATION_EMAIL` | Destino de notificaciones | `secretaria@comunidadalbas.com.mx` |
| `STORAGE_BUCKET` | Almacenamiento de objetos | (evaluar después) |

## Producción (Vercel)

Las mismas variables, con valores de producción.

## Zoho SMTP (configurado)

```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=secretaria@comunidadalbas.com.mx
SMTP_FROM=secretaria@comunidadalbas.com.mx
CONTACT_NOTIFICATION_EMAIL=secretaria@comunidadalbas.com.mx
SMTP_PASS=<contraseña en Vercel env, no exponer>
```
