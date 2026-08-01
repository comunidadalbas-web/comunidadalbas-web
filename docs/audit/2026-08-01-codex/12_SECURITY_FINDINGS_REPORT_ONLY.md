# Hallazgos de seguridad

## Vulnerabilidades confirmadas

- Procesamiento de webhooks sin firma válida. Corregido con rechazo 401 y pruebas.

## Configuraciones riesgosas

- Producción antigua expone `/admin` sin login.
- Faltan secretos de sesión/CSRF para el código nuevo.
- La limitación de login vive en memoria y no es consistente entre instancias serverless.

## Riesgos teóricos

- Carrera en deduplicación por `xRequestId` al no existir restricción única.
- Sesiones firmadas no consultan el estado activo del usuario en cada petición; una revocación puede tardar hasta 12 h.

## Report only

- No se endureció CSP, CORS, cookies o rate limiting sin una prueba de regresión completa.
- No se rotaron credenciales ni se modificaron cuentas.

## Falsos positivos descartados

- Los mocks detectados están limitados a pruebas unitarias o al archivo `lib/mock.ts`; no sustituyen la API de pagos de producción observada.
