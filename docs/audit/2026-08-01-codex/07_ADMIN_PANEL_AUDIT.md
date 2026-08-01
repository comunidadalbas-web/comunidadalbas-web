# Panel administrativo

La rama local añade login, sesión, CSRF, cambio obligatorio de contraseña, RBAC, usuarios, auditoría, blog, edificios, unidades, conceptos, estadísticas e informes. TypeScript y build pasan.

Producción todavía sirve el panel anterior: `/login` = 404 y `/admin` = 200 público. Esto no prueba una regresión del código nuevo; prueba que aún no está desplegado.

Riesgos antes de publicar:

- Faltan `SESSION_SECRET` y `CSRF_SECRET` en Vercel.
- El árbol de trabajo preexistente debe validarse visualmente con una cuenta de prueba.
- La navegación muestra módulos sin filtrar por rol; los endpoints de mutación sí contienen guardas, pero debe revisarse la visibilidad esperada para `resident` y `vocal`.
- Endpoints administrativos legados de Mercado Pago conservan `ADMIN_API_KEY` por compatibilidad.
