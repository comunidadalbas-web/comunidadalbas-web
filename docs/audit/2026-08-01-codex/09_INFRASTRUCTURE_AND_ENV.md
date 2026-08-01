# Infraestructura y entorno

Vercel: proyecto `comunidadalbas-web1`, root `apps/web`, Node 24.x. Despliegue de producción `dpl_A982HhjJjTXjeuYc8zQMqDi6NUTe`, Ready, creado 2026-07-31 09:40 CST.

| Variable | Obligatoria | Entorno | Uso | Estado |
|---|---|---|---|---|
| DATABASE_URL | Sí | Todos | Neon/Prisma | Configurada |
| SESSION_SECRET | Sí | Prod | Sesión HMAC | Configurada cifrada |
| CSRF_SECRET | Sí | Prod | CSRF HMAC | Configurada cifrada |
| MERCADOPAGO_ACCESS_TOKEN_PROD | Sí si pagos activos | Prod | API MP | Configurada, valor no leído |
| MERCADOPAGO_WEBHOOK_SECRET_PROD | Sí | Prod | HMAC webhook | Configurada, valor no leído |
| PAYMENTS_ENABLED | Sí | Prod | bandera | Configurada |
| SMTP_* | Sí para correo | Prod | Zoho | Credencial verificada y actualizada cifrada |
| ADMIN_API_KEY | Sí para endpoints legados | Prod | Bearer admin MP | Configurada |

`.env` y `.env.local` están ignorados; sólo `.env.example` está rastreado. No se encontraron secretos reales mediante patrones básicos en archivos rastreados. Se añadió `.vercelignore` para excluir explícitamente archivos de entorno, documentos privados, datos, evidencias y artefactos de pruebas del contexto de despliegue.
