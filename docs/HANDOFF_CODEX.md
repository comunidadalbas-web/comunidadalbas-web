# Handoff para Codex

## Objetivo del proyecto

Construir el MVP del portal institucional `comunidadalbas.com.mx` para la administración de Privada Albas: edificios, departamentos, cuotas, pagos, egresos, documentos y transparencia comunitaria.

## Arquitectura definitiva adoptada

| Componente | Tecnología |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend/API | Next.js 16 (App Router, TypeScript estricto) |
| Base de datos | PostgreSQL (local: Docker Compose, prod: proveedor compatible con DATABASE_URL) |
| ORM | Prisma 7 |
| Validación | Zod 4 |
| Pruebas | Vitest (unitarias/integración), Playwright (E2E) |
| CI/CD | GitHub Actions |
| Alojamiento | Vercel |
| DNS | Hostinger (nameservers actuales) |
| Correo | Zoho Mail |
| Almacenamiento | Por definir (interfaz desacoplada) |

## Rama y último commit

- **Rama**: `bootstrap/opencode-phase-0`
- **Último commit**: Ver `git log -1` en la rama

## Versiones verificadas

| Herramienta | Versión |
|---|---|
| Node.js | 24.17.0 |
| pnpm | 10.17.0 |
| Next.js | 16.2.11 (webpack build) |
| Prisma | 7.9.0 |
| TypeScript | 5.9.3 |
| Zod | 4.0.0 |
| Vitest | 3.2.7 |

## Archivos y módulos creados

### Raíz
- `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.node-version`, `.editorconfig`, `.prettierrc`
- `.gitignore` (secrets, credenciales, docs privados)
- `docker-compose.yml` (PostgreSQL 18 Alpine)

### apps/web — Aplicación Next.js
- `next.config.ts` (seguridad, headers CSP, redirects)
- `src/middleware.ts` (security headers, noindex admin)
- `src/app/layout.tsx` (layout institucional con header y footer responsive)
- `src/app/globals.css` (design tokens, componentes, responsive)
- `src/app/page.tsx` — Portada institucional
- `src/app/nosotros/page.tsx` — Identidad y propósito
- `src/app/documentos/page.tsx` — Catálogo de documentos (placeholder)
- `src/app/contacto/page.tsx` — Formulario de contacto (cliente)
- `src/app/api/contact/route.ts` — API de contacto (Zod, honeypot, rate limiting, persistencia)
- `src/app/privacidad/page.tsx` — Aviso de privacidad
- `src/app/admin/page.tsx` — Placeholder protegido (noindex)
- `src/app/health/route.ts` — Endpoint técnico
- `src/lib/email.ts` — Adaptador de correo desacoplado
- `src/lib/db.ts` — Bridge a Prisma

### packages/db — Base de datos
- `prisma/schema.prisma` (12 modelos: Building, Unit, FeeConcept, Charge, Payment, PaymentApplication, Expense, Document, User, RoleAssignment, AuditLog, ContactRequest)
- `src/client.ts` — Cliente Prisma singleton

### packages/core — Lógica compartida
- `src/index.ts` — Constantes institucionales, información del sitio

### Pruebas
- `apps/web/src/__tests__/contact-validation.test.ts` — Validación Zod
- `apps/web/src/__tests__/health.test.ts` — Health check
- `apps/web/e2e/home.spec.ts` — Portada
- `apps/web/e2e/contact.spec.ts` — Formulario de contacto

### CI/CD
- `.github/workflows/ci.yml` — Lint, typecheck, tests, build, secret scan
- `.github/dependabot.yml` — Monthly dependency updates

### Documentación
- `docs/INITIAL_AUDIT.md`
- `docs/DEPLOYMENT_VERCEL.md`
- `docs/DNS_HOSTINGER_ZOHO_VERCEL.md`
- `docs/ENVIRONMENT_VARIABLES.md`
- `docs/SECURITY_INCIDENTS_PRIVATE.md`
- `docs/HANDOFF_CODEX.md` (este archivo)
- `PROMPT_02_CODEX_CONTINUACION.md`

### Datos demo
- `data/templates/unidades.csv` (20 edificios × 6 departamentos = 120 unidades provisionales)
- `data/templates/pagos.csv` (template)
- `data/templates/egresos.csv` (template)

## Migraciones

N/A — No se ha ejecutado `prisma migrate dev` por falta de PostgreSQL local.

Comandos para generar:
```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate
```

## Comandos para levantar el proyecto

```bash
git clone https://github.com/comunidadalbas-web/comunidadalbas-web.git
cd comunidadalbas-web
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Variables necesarias (sin valores secretos)

Ver `docs/ENVIRONMENT_VARIABLES.md` para la lista completa.

**Imprescindibles para desarrollo local:**
- `DATABASE_URL` — cadena de conexión PostgreSQL

**Imprescindibles para build de producción:**
- `DATABASE_URL`
- `SESSION_SECRET`
- `CSRF_SECRET`

## Pruebas ejecutadas y resultado

- **Typecheck (tsc --noEmit)**: ✅ Pasó sin errores
- **Unit tests (Vitest)**: ✅ 7/7 tests pasaron (2 test suites)
- **Build (next build --webpack)**: ✅ Compilación exitosa en 6.7s, 12 rutas generadas
- **Lint**: ⚠️ ESLint no configurado completamente para flat config; lint actual es alias de typecheck
- **E2E tests (Playwright)**: ⏳ Configurados pero no ejecutados (requieren servidor en ejecución)

## Deuda técnica

1. Autenticación y RBAC (next-auth o similar pendiente)
2. Panel CRUD de edificios y departamentos
3. Importación CSV de unidades
4. Módulo de cuotas y generación mensual
5. Pagos con conciliación
6. Egresos con autorizaciones
7. Documentos y transparencia
8. Dashboard administrativo
9. Pruebas de integración contra base de datos real
10. E2E en CI

## Acciones manuales pendientes

### GitHub
- Crear repositorio `comunidadalbas-web/comunidadalbas-web`
- Agregar `comunidadalbasmx@gmail.com` como colaborador/owner
- Configurar branch protection para `main`
- Configurar GitHub Secrets para CI

### Vercel ✅
- ~~Crear proyecto importando desde GitHub~~ → Ya existe `comunidadalbas-web1`
- ~~Configurar root directory: `apps/web`~~ → Hecho vía API
- ~~Configurar variables de entorno~~ → SMTP configurado vía API
- ~~Obtener registros DNS del panel de Vercel~~ → A `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`

### Hostinger ✅
- ~~Agregar A record y CNAME~~ → Hecho manualmente en panel
- ~~No modificar MX, SPF, DKIM ni DMARC de Zoho~~ → Preservados
- ~~**Regenerar códigos de recuperación**~~ → Pendiente (Boris)

### Zoho ✅
- ~~Configurar SMTP para notificaciones~~ → Credenciales en Vercel env vars
- Verificar firmas DKIM (pendiente)

### Propietario (Boris)
- ~~Regenerar códigos de recuperación de Hostinger~~ → Pendiente
- ~~Configurar SMTP en Zoho~~ → Hecho
- Verificar que el dominio `comunidadalbas.com.mx` esté apuntando correctamente (pendiente propagación DNS)

## Riesgos de seguridad

1. **Códigos de recuperación expuestos** en paquete compartido — regenerar en Hostinger (pendiente)
2. **Autenticación pendiente** — /admin no tiene protección real
3. **Rate limiting en memoria** — se pierde al reiniciar; migrar a Redis o DB en producción

## Siguiente fase priorizada

Ver `PROMPT_02_CODEX_CONTINUACION.md` para la continuación en Codex.
