# Preparación de despliegue

Estado: **NO LISTO**.

Criterios aprobados: instalación estricta, typecheck, tests, build, Prisma validate/generate, sitio raíz, formulario de pagos y endpoint administrativo sin credencial = 401.

Bloqueos:

1. Añadir `SESSION_SECRET` y `CSRF_SECRET` distintos y fuertes en Vercel.
2. Reconciliar migraciones con Neon sin pérdida de datos.
3. Validar login/panel/roles en preview.
4. Ejecutar suite completa final y revisión visual móvil/escritorio.
5. Resolver o aceptar explícitamente SMTP y `www`.

Rollback propuesto: conservar `dpl_A982HhjJjTXjeuYc8zQMqDi6NUTe` y promoverlo de nuevo si el preview/nuevo despliegue falla. No ejecutar migraciones irreversibles durante la promoción.
