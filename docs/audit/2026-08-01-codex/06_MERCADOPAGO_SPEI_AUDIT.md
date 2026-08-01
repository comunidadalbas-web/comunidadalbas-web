# Auditoría Mercado Pago / SPEI

Fortalezas: tokens separados por entorno, timeout de 15 s, `X-Idempotency-Key`, importes decimales persistidos, órdenes piloto excluidas del balance y sanitización básica de logs.

Correcciones aplicadas:

1. Firma ausente/inválida ahora devuelve 401 y no procesa el evento.
2. Una orden desconocida no intenta crear una relación foránea inexistente.
3. La clave de idempotencia persistida ahora es la misma enviada al proveedor.

Pendientes:

- Asociar orden con `Unit`, `Charge` y `FeeConcept` por identificador, no sólo texto.
- Crear/aplicar `Payment` de forma transaccional e idempotente al aprobarse.
- Añadir unicidad robusta para eventos/reintentos después de revisar duplicados reales.
- Validar webhook real de prueba desde el panel del proveedor.
- No se efectuó ningún pago, transferencia ni orden adicional durante la auditoría.
