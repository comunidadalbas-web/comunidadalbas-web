# Panel administrativo

La rama local añade login, sesión, CSRF, cambio obligatorio de contraseña, RBAC, usuarios, auditoría, blog, edificios, unidades, conceptos, estadísticas e informes. TypeScript y build pasan.

Producción sirve el panel nuevo: `/login` = 200, `/admin` y `/admin/usuarios` redirigen a login sin sesión. La cuenta inicial es Presidencia, conserva la contraseña anterior y debe cambiarla al primer acceso.

Controles finales:

- `SESSION_SECRET` y `CSRF_SECRET` distintos y cifrados en Vercel.
- Navegación filtrada por rol y endpoints con sesión, RBAC y CSRF.
- Sólo cinco correos institucionales admitidos por UI, API y restricción de base.
- Toda cuenta nueva o contraseña restablecida exige cambio al iniciar.
- Endpoints administrativos legados de Mercado Pago conservan `ADMIN_API_KEY` por compatibilidad.
