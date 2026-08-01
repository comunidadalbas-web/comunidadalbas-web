# Hallazgos y deuda técnica

| ID | Prioridad | Hallazgo | Impacto | Estado |
|---|---|---|---|---|
| CA-001 | P0 | Webhook procesaba firma inválida/ausente | sincronización no autenticada | Resuelto |
| CA-002 | P1 | Clave idempotente guardada distinta a la enviada | auditoría/reintento incorrectos | Resuelto |
| CA-003 | P1 | Pagos aprobados no se aplican a adeudos | flujo financiero incompleto | Pendiente |
| CA-004 | P1 | Historial Prisma no corresponde a Neon | despliegues/migraciones inseguros | Resuelto |
| CA-005 | P1 | Producción no contiene login/RBAC local | panel viejo público | Pendiente de despliegue seguro |
| CA-006 | P1 | TLS de `www` incorrecto | subdominio inaccesible | Externo |
| CA-007 | P2 | Zoho SMTP EAUTH | correos no salen | Resuelto con credencial autorizada |
| CA-008 | P2 | Vercel carece de secretos de sesión/CSRF | despliegue rompería auth | Resuelto |
| CA-009 | P2 | Reintentos webhook sin restricción única | carrera posible | Pendiente |
| CA-010 | P3 | Egresos es pantalla declarativa | función simulada | Pendiente |
| CA-011 | P4 | Prettier falla en 94 archivos | ruido y CI futuro | Pendiente; no formatear masivamente |

Cada corrección debe conservar el árbol preexistente y evitar migraciones destructivas.
