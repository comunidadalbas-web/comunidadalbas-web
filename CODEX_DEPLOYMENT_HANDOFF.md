# CODEX DEPLOYMENT HANDOFF — Patrimonio v0.1

**Date**: 2026-09-09  
**Branch**: `feature/patrimonio-v0.1`  
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

## Database

- **Schema**: 35 models, 724 lines at `packages/db/prisma/schema.prisma`
- **Production URL**: Set via `DATABASE_URL` env var (Neon or compatible)
- **E2E URL**: `postgresql://albas:albas_dev@localhost:55432/comunidadalbas_e2e`
- **Adapter**: `PRISMA_ADAPTER=pg` switches from `PrismaNeonHTTP` to `PrismaPg` (TCP)

## Auth Model

- HMAC-only sessions — no DB lookup required
- Cookie names: `patrimonio_session`, `patrimonio_csrf`
- Session secrets: `SESSION_SECRET`, `CSRF_SECRET` (required)
- Roles: `admin`, `owner`, `tesorero` (from `apps/web/src/lib/auth/guards.ts`)
- Default login sets `roles: ['admin', 'owner', 'tesorero']`

## Environment Variables (Required)

```
DATABASE_URL=postgresql://...         # Production DB
SESSION_SECRET=<random-64-chars>      # HMAC session signing
CSRF_SECRET=<random-64-chars>         # HMAC CSRF signing
PRISMA_ADAPTER=pg                     # Required for non-Neon Postgres
```

## E2E Testing

- **Setup**: `node scripts/e2e-setup.cjs` (creates DB, pushes schema, seeds fixtures)
- **Reset**: `node scripts/e2e-setup.cjs --reset` (drop + recreate)
- **Run**: `npx playwright test` from `apps/web/`
- **Package script**: `pnpm test:e2e` (runs setup + tests)
- **Workers**: 2 (configurable in `playwright.config.ts`)
- **Guardrail**: Rejects `neon.tech`, `aws.neon.tech`, `pooler` in DB URL

## E2E Fixtures

| Entity | ID / Identifier |
|--------|-----------------|
| Property | `PROPERTY-E2E-TEST` (slug: `albas-203`) |
| Building | `Edificio Albas` (propertyId: `PROPERTY-E2E-TEST`) |
| Unit | `Unidad 101` (buildingId from above) |
| Admin user | `e2e-admin@example.invalid` (roles: admin, owner, tesorero) |
| Read-only user | `e2e-readonly@example.invalid` (roles: admin only) |
| Fee concept | Mensualidad (monthly rent) |

## Branding

- **Public portal**: "Comunidad Albas"
- **Internal backoffice**: "PATRIMONIO"
- **Mahya asset**: `Mahya_Tecnologios_Logo_Official_Package` (RESERVED_FOR_CODEX_PREDEPLOY)
- **Institutional emails**: 5 frozen accounts (secretaria, gestion, pagos, contacto, transparencia)

## Pre-Deploy Checklist

- [ ] Set `DATABASE_URL`, `SESSION_SECRET`, `CSRF_SECRET` in production env
- [ ] Set `PRISMA_ADAPTER=pg` if not using Neon HTTP adapter
- [ ] Run `npx prisma db push` to sync schema
- [ ] Run `npx prisma db seed` to populate initial data
- [ ] Verify `pnpm build` succeeds
- [ ] Verify `pnpm test` passes (149/149)
- [ ] Verify `pnpm test:e2e` passes (14/14)

## Test Status

| Gate | Status |
|------|--------|
| `pnpm typecheck` | ✅ PASS |
| `pnpm lint` | ✅ PASS |
| `pnpm test` | ✅ 149/149 PASS |
| `pnpm build` | ✅ PASS |
| `pnpm test:e2e` (Run 1) | ✅ 14/14 PASS |
| `pnpm test:e2e` (Run 2) | ✅ 14/14 PASS |

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
