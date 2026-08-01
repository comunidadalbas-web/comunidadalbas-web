# Línea Base — Portal de Administración Comunitaria (Fase A: Auditoría)

- **Fecha:** 2026-07-31
- **Rama:** `feature/portal-administracion-comunitaria-v1`
- **Punto de partida:** `bootstrap/opencode-phase-0` @ `21d9653` (sistema de pagos en producción)
- **Repositorio:** `https://github.com/comunidadalbas-web/comunidadalbas-web.git`
- **Propósito:** Documentar el estado actual del proyecto antes de construir el portal de administración. No modifica código; solo audita y registra.

---

## 1. Objetivo de la transformación

Convertir `comunidadalbas.com.mx` en el sistema digital central de administración de Privada Albas:
panel administrativo seguro, CMS ligero, campañas, comunicados, solicitudes, documentos,
correo institucional y estadísticas — **preservando y protegiendo el sistema de pagos existente** (no reconstruirlo).

---

## 2. Inventario del proyecto

### 2.1 Monorepo pnpm workspace
- Package manager: `pnpm@10.17.0`, Node >= 24.
- Paquetes:
  - `@comunidad-albas/web` — aplicación Next.js 16 (`apps/web`), React 19, Zod 4.
  - `@comunidad-albas/db` — Prisma 7 + PostgreSQL (Neon) (`packages/db`).
- Scripts raíz: `dev`, `build` (genera Prisma + build), `lint`/`typecheck` (`tsc --noEmit`), `test` (vitest), `test:e2e` (playwright), `ci` (`typecheck && test && build`).

### 2.2 Aplicación web — rutas públicas (todas responden HTTP 200 en producción)
| Ruta | Tipo | Estado |
|---|---|---|
| `/` | Home | Producción |
| `/nosotros` | Página institucional | Producción |
| `/contacto` | Formulario de contacto | Producción |
| `/documentos` | Documentos públicos | Producción |
| `/privacidad` | Aviso de privacidad | Producción |
| `/pagos` | Página pública de pagos | Producción |
| `/health` | Health check | Producción |
| `/api/contact` | POST — formulario de contacto | Producción |
| `/api/pagos/concepts` | GET — conceptos de pago | Producción |
| `/api/pagos/create` | POST — crear orden/preferencia | Producción |
| `/api/integrations/mercadopago/webhook` | POST — webhook MP | Producción |

### 2.3 Rutas administrativas existentes (admin, protegidas por `ADMIN_API_KEY`)
- `/admin`, `/admin/pagos`, `/admin/unidades`, `/admin/egresos`
- `/admin/integraciones/mercadopago/{piloto-real,prueba-spei}`
- `/api/admin/integrations/mercadopago/{status,pilot-order,test-spei-order,register-webhook,cleanup-stale,orders/[orderId]}`
- `/api/db-test`, `/api/echo`

### 2.4 Autenticación actual (hallazgo principal)
- **No hay sistema de usuarios/roles/sesiones.**
- Única protección: API key estática (`ADMIN_API_KEY`) vía header `Authorization: Bearer <key>`
  en `apps/web/src/lib/admin-auth.ts`.
- La API key vive en Vercel (no en el repo). Rotada en `273eabd`.
- El modelo `User`, `RoleAssignment` y `AuditLog` **ya existen en el schema** pero no se usan en runtime.

### 2.5 Base de datos (Prisma schema `packages/db/prisma/schema.prisma`)
Modelos existentes:
- `Building`, `Unit` — edificios y departamentos (catálogo).
- `FeeConcept` — conceptos de cuota (cuota de mantenimiento, extraordinaria).
- `Charge` — cargos por unidad/período.
- `Payment`, `PaymentApplication` — pagos y aplicación a cargos.
- `Expense` — egresos.
- `Document` — documentos con `visibility` (PUBLIC/PRIVATE/RESTRICTED).
- `User`, `RoleAssignment`, `AuditLog` — **sin usar** en runtime (base para el panel).
- `ContactRequest` — solicitudes del formulario de contacto.
- `MercadoPagoOrder`, `MercadoPagoWebhookEvent` — órdenes de pago y eventos de webhook.
- `RateLimitEntry` — rate limiting por IP.

Base de datos: PostgreSQL en Neon; usa pooler (`DATABASE_URL`) y conexión directa (`DATABASE_URL_UNPOOLED`).

### 2.6 Sistema de pagos (protegido — NO reconstruir)
Ver documento dedicado: [`docs/payments/EXISTING_PAYMENT_SYSTEM_AUDIT.md`](../payments/EXISTING_PAYMENT_SYSTEM_AUDIT.md)

Resumen: Checkout Pro (tarjeta) + SPEI en producción (`MERCADOPAGO_ENV=production`),
webhook procesa topics `payment` y `order`, rate-limit IP, conceptos cuota/extraordinario,
validación edificio/departamento, montos configurados (`PAYMENTS_CUOTA_AMOUNT=100.00`,
`PAYMENTS_MAX_EXTRAORDINARY=10000.00`).

---

## 3. Hallazgos de seguridad

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| S1 | Sin autenticación de usuarios/roles en el panel (solo API key) | Alta | Pendiente (Fase B) |
| S2 | `Document.visibility` no se aplica en runtime (no hay lógica de acceso) | Media | Pendiente |
| S3 | No hay sesiones ni CSRF en endpoints admin | Alta | Pendiente (Fase B) |
| S4 | Secretos: correcto. Ningún `.env`, token, recovery code o carpeta documental versionado | — | OK verificado |
| S5 | `ContactRequest` no tiene endpoint de gestión | Media | Pendiente |
| S6 | No hay auditoría de acciones administrativas en runtime (modelo `AuditLog` sin uso) | Media | Pendiente |

### Verificación de secretos (realizada)
- `git ls-files` solo rastrea `.env.example` (sin valores reales).
- `git check-ignore` confirma ignoradas: `Comunidad_Albas_Paquete_Unificado_v2.0/`,
  `Comunidad Albas00 Identidad Institucional/`, `legal documents/`.
- `.gitignore` protege `*.env`, `.env.*` (excepto `.env.example`), `credentials*.json`, `*.key`, `*.pem`, recovery codes.
- El token de Mercado Pago solo existe en Vercel (no en `.env.local`).

---

## 4. Estado de calidad (baseline ejecutado en la rama de trabajo)

| Comando | Resultado |
|---|---|
| `pnpm lint` (tsc --noEmit) | Pasa |
| `pnpm typecheck` (tsc --noEmit) | Pasa |
| `pnpm test` (vitest) | 7/7 pasan (health, contact-validation) |
| `pnpm build` | Compila OK; rutas `/pagos`, `/api/pagos/concepts`, `/api/pagos/create`, `/admin/pagos` generadas |
| Smoke test producción | `/`, `/contacto`, `/nosotros`, `/documentos`, `/pagos` → 200; `/api/pagos/concepts` → `enabled=true cuota=100.00` |

---

## 5. Deuda técnica y riesgos

1. **Cobertura de pruebas mínima**: solo 7 tests unitarios; sin tests del sistema de pagos, sin e2e ejecutándose en CI.
2. **`ContactRequest`, `Payment`, `Expense`, `Document` sin flujo administrativo** — datos crudos en BD.
3. **Búsqueda `allowedEmails` en `isEmailAllowed`** — declarado en `config.ts` pero no aplicado en `pagos/create` (los campos `building`/`apartment` ya validan la unidad).
4. **Catálogo de edificios/unidades sin UI de mantenimiento** (solo lectura admin básica).
5. **El panel admin actual depende de `ADMIN_API_KEY` compartida** — sin roles ni revocación individual.
6. **Registros `AuditLog`, `User`, `RoleAssignment` creados pero sin código** — lista para la Fase B.

---

## 6. Propuesta de fases (orden de ejecución verificado)

- **Fase A (esta):** Auditoría y línea base. ✔
- **Fase B:** Autenticación con roles (login institucional sobre `User`/`RoleAssignment`), sesión segura, CSRF, panel administrativo núcleo (dashboard, unidades, conceptos, cargos, solicitudes de contacto, documentos con visibilidad real).
- **Fase C:** CMS ligero (comunicados, campañas, calendario) + publicación pública.
- **Fase D:** Solicitudes ciudadanas con folio + estado (sobre `ContactRequest` o modelo nuevo).
- **Fase E:** Correo institucional (Zoho SMTP, plantillas, notificaciones).
- **Fase F:** Estadísticas e informes (balances, morosidad, ingresos).
- **Cada fase concluye con: lint, typecheck, tests, build y despliegue verificado.**

---

## 7. Reglas de protección vigentes para el resto del proyecto

- El sistema de pagos no se reconstruye ni se altera su contrato público.
- Ningún secreto se versiona; solo se referencian variables de entorno.
- Los cambios de pago requieren pruebas de regresión en cada PR.
- `docs/` registra auditorías y decisiones (ADRs) conforme se avanza.
