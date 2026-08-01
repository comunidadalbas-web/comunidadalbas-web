# Cambios aplicados

- Webhook exige firma válida antes de procesar.
- Webhook sólo enlaza una orden local existente.
- Cuatro pruebas del webhook: ausente, inválida, válida y duplicada.
- Resultados de creación de pago transportan internamente la clave idempotente real.
- Persistencia de tarjeta, SPEI, piloto y prueba usa esa clave real.
- `CSRF_SECRET` separado de `SESSION_SECRET` en runtime y tests.
- `.env.example` documenta variables de Mercado Pago y administración sin valores reales.
- Paquete de auditoría y progreso creado.

No se modificó producción, Neon, DNS, cuentas, planes ni credenciales.
