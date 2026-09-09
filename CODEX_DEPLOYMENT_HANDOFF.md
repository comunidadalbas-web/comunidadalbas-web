# CODEX DEPLOYMENT HANDOFF — Patrimonio v0.1

**Date**: 2026-09-09
**Branch**: `feature/patrimonio-v0.1`
**HEAD**: `a59d3a2`
**Status**: Ready for pre-deploy review and external deployment

---

## Architecture

| Layer | Stack | Notes |
|-------|-------|-------|
| Frontend | Next.js 16, React 19, Tailwind | `apps/web/` |
| Auth | HMAC-only sessions (no DB lookup) | `apps/web/src/lib/auth/` |
| Database | Prisma 7, PostgreSQL 17 | `packages/db/` |
| ORM Adapter | `PRISMA_ADAPTER=pg` (TCP) | `packages/db/src/client.ts` |
| Payments | MercadoPago webhook | `src/app/api/payments/` |
| Email | Nodemailer (optional) | `src/lib/email/` |
| Container | Docker Compose | `docker-compose.yml` |

## Environment Variables (Required)

```
DATABASE_URL=<production-postgres-url>  # Neon or compatible Postgres
SESSION_SECRET=<random-64-chars>        # HMAC session signing
CSRF_SECRET=<random-64-chars>           # HMAC CSRF signing
PRISMA_ADAPTER=pg                       # Required for non-Neon Postgres
```

## Migration Path

1. Set env vars above in target platform
2. `npx prisma db push` — sync schema to database
3. `npx prisma db seed` — populate initial data
4. `pnpm build` — verify production build
5. `pnpm test:e2e` — run E2E against local Docker Postgres

## Auth Model

- HMAC-only sessions — no DB lookup required
- Cookie names: `patrimonio_session`, `patrimonio_csrf`
- Session secrets: `SESSION_SECRET`, `CSRF_SECRET` (required)
- Roles: `admin`, `owner`, `tesorero` (from `apps/web/src/lib/auth/guards.ts`)
- Default login sets `roles: ['admin', 'owner', 'tesorero']`

## Payment Architecture

- MercadoPago webhook at `/api/integrations/mercadopago/webhook`
- Pilot order flow at `/admin/integraciones/mercadopago/piloto-real`
- SPEI test flow at `/admin/integraciones/mercadopago/prueba-spei`
- Payment reference model: `PaymentReference` with folio tracking
- Egresos (expenses) model with status: PENDING, RECONCILED, CANCELLED

## Email Matrix

5 frozen institutional accounts — no new accounts allowed:

| Account | Role |
|---------|------|
| secretaria@ | Superadmin |
| gestion@ | Gestor |
| pagos@ | Finance |
| contacto@ | Public |
| transparencia@ | Transparency |

Source of truth: `apps/web/src/lib/users/institutional-accounts.ts`

## Deployment Targets

- **GitHub**: Repository `comunidadalbas`, branch `feature/patrimonio-v0.1`
- **Vercel**: Next.js app, environment variables as listed above
- **Neon**: Production Postgres (if using Neon, set `PRISMA_ADAPTER` accordingly)
- **Supabase**: Not currently used — reserved for future storage/auth

## Storage Task

- File uploads via Vercel Blob (`@vercel/blob` v2.6.1)
- Document management at `/admin/documentos`
- Upload API at `/api/admin/uploads`

## Do-Not-Touch List

- `apps/web/src/lib/users/institutional-accounts.ts` — frozen email matrix
- `Mahya_Tecnologias_Logo_Official_Package/` — Mahya brand asset
- `packages/db/prisma/schema.prisma` — schema changes require full migration review
- Session cookie names (`patrimonio_session`, `patrimonio_csrf`)
- `apps/web/src/lib/auth/constants.ts` — auth constants
- E2E session secrets (test-only, never production)

## Rollback Data

- All schema changes tracked in Prisma migrations
- Git history: `git log --oneline` on `feature/patrimonio-v0.1`
- Last known good: `a59d3a2` (all gates green)
- Rollback: `git revert HEAD` or `git reset --hard <commit>`

## Mahya Pre-Production Footer

`MAHYA_FOOTER = RESERVED_FOR_CODEX_PREDEPLOY` — do not modify until Codex team provides production assets.

## E2E Testing

- **Setup**: `node scripts/e2e-setup.cjs` (creates DB, pushes schema, seeds fixtures)
- **Reset**: `node scripts/e2e-setup.cjs --reset` (drop + recreate)
- **Run**: `npx playwright test` from `apps/web/`
- **Package script**: `pnpm test:e2e` (runs setup + tests)
- **Workers**: 2 (configurable in `playwright.config.ts`)
- **Guardrail**: Rejects `neon.tech`, `aws.neon.tech`, `pooler` in DB URL

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/playwright.config.ts` | E2E config, local DB guardrail |
| `scripts/e2e-setup.cjs` | E2E DB lifecycle |
| `packages/db/src/client.ts` | Conditional Prisma adapter |
| `packages/db/prisma/schema.prisma` | 35 models |
| `apps/web/src/lib/auth/` | HMAC sessions, guards, cookies |
| `apps/web/src/lib/users/institutional-accounts.ts` | Frozen email matrix |
| `docker-compose.yml` | Local Postgres (port 55432) |

## Test Status

| Gate | Status |
|------|--------|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | 149/149 PASS |
| `pnpm build` | PASS |
| `pnpm test:e2e` (Run 1) | 14/14 PASS |
| `pnpm test:e2e` (Run 2) | 14/14 PASS |
