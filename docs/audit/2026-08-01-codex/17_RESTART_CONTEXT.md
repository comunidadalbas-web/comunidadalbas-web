# Contexto de reanudación

Trabajar en `C:\Users\rbori\OneDrive\Desktop\comunidadalbas`, rama `feature/portal-administracion-comunitaria-v1`. La fase administrativa y las correcciones Codex están versionadas y publicadas.

Leer primero `00_EXECUTIVE_SUMMARY.md`, `11_ISSUES_AND_TECHNICAL_DEBT.md` y `15_DEPLOYMENT_READINESS.md`.

Comandos seguros de reanudación:

```powershell
git status --short --branch
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @comunidad-albas/db exec prisma validate
```

Neon tiene cuatro migraciones al día. No usar `db push`, no generar pagos reales para pruebas y no rotar secretos sin autorización. Cargar edificios/departamentos reales antes de operar cargos. Cinco campañas están en borrador y tres documentos son públicos/no aprobados. El despliegue `dpl_5qJDZGnY3Ms7Zjxw3eNjrWdVoc6V` queda como rollback anterior a medios.
