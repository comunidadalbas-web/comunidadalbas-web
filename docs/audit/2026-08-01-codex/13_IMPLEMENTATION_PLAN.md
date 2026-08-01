# Plan de implementación

1. Cerrar P0 de firma webhook y trazabilidad idempotente. **Completado.**
2. Completar validación local y pruebas de regresión. **En curso.**
3. Crear baseline de migraciones compatible con la base existente, después de comparar estructura y respaldar. **Pendiente.**
4. Relacionar órdenes con unidad/cargo y aplicar pagos confirmados transaccionalmente. **Pendiente de reglas de negocio/datos.**
5. Validar panel local con cuenta de prueba, escritorio y móvil. **Pendiente.**
6. Configurar secretos faltantes en Vercel sin revelar valores. **Pendiente externo.**
7. Corregir dominio/certificado `www` en Vercel/Cloudflare/registrador. **Pendiente externo.**
8. Resolver Zoho EAUTH y verificar sin enviar o con un correo de prueba autorizado. **Pendiente externo.**
9. Desplegar preview, aceptar flujos y sólo entonces promover a producción. **Bloqueado.**
