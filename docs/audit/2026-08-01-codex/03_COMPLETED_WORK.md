# Trabajo completado y evidencia

| Funcionalidad | Estado | Evidencia | Limitación |
|---|---|---|---|
| Sitio público | VERIFICADO Y FUNCIONAL | Producción 200 y revisión Chrome | Falta móvil final |
| Formulario de pagos | VERIFICADO Y FUNCIONAL | `/pagos` carga conceptos reales sin errores de consola | No se creó pago real |
| Build | VERIFICADO Y FUNCIONAL | `pnpm build` | 117.6 s local |
| Pruebas finales | VERIFICADO Y FUNCIONAL | 90 unitarias + 14 E2E | Cobertura focalizada |
| Prisma schema/client | VERIFICADO Y FUNCIONAL | validate y generate | Migración no aplicada |
| Sesión/RBAC local | IMPLEMENTADO, FALTA PRUEBA EXTERNA | tests y build | Producción aún no lo contiene |
| CMS/blog/catálogos/reportes | IMPLEMENTADO, FALTA PRUEBA EXTERNA | rutas compiladas | Cambios preexistentes sin publicar |
| Orden tarjeta/SPEI | IMPLEMENTADO, FALTA PRUEBA EXTERNA | pruebas con mocks; producción muestra UI | No se generaron movimientos |
| Webhook firmado | VERIFICADO Y FUNCIONAL | 4 pruebas nuevas | Falta entrega real externa |
| Aplicación de pago a adeudo | PARCIAL | sólo actualiza `MercadoPagoOrder` | No crea/aplica `Payment` |
| Zoho SMTP | VERIFICADO Y FUNCIONAL | verify + envío técnico | Credencial cifrada en Vercel |
| Redirección www | ROTO | error TLS `SEC_E_WRONG_PRINCIPAL` | Requiere dominio/certificado |
