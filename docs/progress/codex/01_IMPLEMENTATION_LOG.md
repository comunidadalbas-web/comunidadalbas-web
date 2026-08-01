# Registro de implementación

## Bloque P0: webhook

- Problema: procesaba notificaciones sin firma válida.
- Causa: `signatureValid` se almacenaba pero no gobernaba el procesamiento.
- Solución: registrar, rechazar 401 y no procesar; sólo relacionar órdenes locales existentes.
- Prueba: 4 casos nuevos aprobados.

## Bloque P1: idempotencia

- Problema: la base guardaba una clave distinta de la enviada al proveedor.
- Solución: devolverla internamente desde el cliente MP y persistirla.
- Prueba: regresión de tarjeta y SPEI aprobada.

## Bloque P2: CSRF

- Problema: `CSRF_SECRET` estaba documentado pero no se usaba.
- Solución: firma CSRF con secreto independiente y configuración de test.
- Prueba: 10 casos de autenticación y typecheck aprobados.
