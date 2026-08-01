# Cambios aplicados

- Webhook exige firma válida antes de procesar.
- Webhook sólo enlaza una orden local existente.
- Cuatro pruebas del webhook: ausente, inválida, válida y duplicada.
- Resultados de creación de pago transportan internamente la clave idempotente real.
- Persistencia de tarjeta, SPEI, piloto y prueba usa esa clave real.
- `CSRF_SECRET` separado de `SESSION_SECRET` en runtime y tests.
- `.env.example` documenta variables de Mercado Pago y administración sin valores reales.
- Paquete de auditoría y progreso creado.

## Ampliación CMS posterior

- Se agregaron imágenes administradas a Blog y Campañas, carga segura a Vercel Blob y vistas previas.
- Se agregó carga PDF pública con URL y SHA-256 automáticos; los aportados quedaron no aprobados y fuera del sitio público.
- Se añadió la cuarta migración Prisma para metadatos de imagen y se aplicó en Neon.
- Se publicó el aviso integral de privacidad del sitio y se precargaron, sin publicar, cinco campañas y tres fuentes normativas públicas/no aprobadas.
- Producción se actualizó sin cambios de DNS, cuentas o planes; ningún secreto fue incorporado al código.
