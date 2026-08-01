# Contexto de reanudación

Trabajar en `C:\Users\rbori\OneDrive\Desktop\comunidadalbas`, rama `feature/portal-administracion-comunitaria-v1`. Preservar todos los cambios sin confirmar; son una fase administrativa preexistente más correcciones Codex.

Leer primero `00_EXECUTIVE_SUMMARY.md`, `11_ISSUES_AND_TECHNICAL_DEBT.md` y `15_DEPLOYMENT_READINESS.md`.

Comandos seguros de reanudación:

```powershell
git status --short --branch
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @comunidad-albas/db exec prisma validate
```

No ejecutar `prisma migrate`, `db push`, pagos, rotación de secretos, cambios DNS ni despliegue hasta resolver los bloqueos documentados. Producción actual: despliegue Vercel `dpl_A982HhjJjTXjeuYc8zQMqDi6NUTe`. No cerrar Chrome.
