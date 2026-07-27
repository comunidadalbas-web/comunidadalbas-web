# PROMPT 02 — Codex: Continuación del MVP de Comunidad Albas

## Objetivo

Continuar el desarrollo del MVP de `comunidadalbas.com.mx` partiendo de la base establecida en la fase 0.

## Estado actual

- Monorepo pnpm con Next.js 16, TypeScript estricto, PostgreSQL + Prisma
- Sitio institucional con 7 rutas funcionando
- Formulario de contacto con validación Zod, honeypot, rate limiting, persistencia
- Modelo de datos completo (12 modelos)
- Seguridad básica (headers CSP, CSRF placeholder, noindex admin)
- Diseño responsive con tokens CSS institucionales
- CI/CD configurado (GitHub Actions)
- Rama actual: `bootstrap/opencode-phase-0`

## Archivos clave a leer primero

```
README.md
docs/HANDOFF_CODEX.md
docs/ARCHITECTURE.md
docs/ACCEPTANCE_TESTS.md
packages/db/prisma/schema.prisma
apps/web/package.json
apps/web/src/app/layout.tsx
apps/web/src/app/api/contact/route.ts
```

## Lo que NO debe hacerse

1. No hardcodear 120 unidades, 20 edificios ni 6 departamentos.
2. No afirmar que la A.C. ya está constituida (`INSTITUTIONAL_STATUS`).
3. No activar cobro con tarjeta, Mercado Pago API, votación, CFDI, ni suspensión de servicios.
4. No publicar adeudos individualizados ni datos personales.
5. No borrar operaciones financieras (usar estados, reversas, auditoría).
6. No exponer secretos, tokens ni credenciales.

## Fase 1: Autenticación institucional y RBAC

Implementar autenticación para las 5 cuentas institucionales:

- presidencia@comunidadalbas.com.mx
- secretaria@comunidadalbas.com.mx
- tesoreria@comunidadalbas.com.mx
- contacto@comunidadalbas.com.mx
- transparencia@comunidadalbas.com.mx

Requisitos:
- next-auth v5 (Auth.js) con adaptador Prisma+PostgreSQL
- Credenciales individuales, MFA opcional
- RBAC centralizado con roles: ADMIN, TREASURER, SECRETARY, VIEWER
- Sesión segura con cookies httpOnly, sameSite, secure
- Protección de rutas admin por rol
- No registrar usuarios desde el exterior

## Fase 2: CRUD de edificios y departamentos

- Página `/admin/unidades` con tabla y formulario
- Crear, editar, archivar edificios
- Crear, editar, archivar departamentos dentro de un edificio
- Validación de que un departamento no se duplique en el mismo edificio
- Sin límite fijo de unidades

## Fase 3: Importación CSV

- Página `/admin/importar`
- Subir CSV con columnas: codigo_edificio, numero_departamento, codigo_unidad
- Validar duplicados antes de insertar
- Vista previa antes de confirmar
- Reporte de resultados (insertados, omitidos, errores)

## Fase 4: Cuotas mensuales

- CRUD de FeeConcept (conceptos de cobro)
- Página `/admin/cuotas` para configurar cuota mensual
- Generación masiva de cargos para el mes actual
- No generar cargos duplicados para el mismo periodo/unidad/concepto

## Fase 5: Pagos y conciliación

- Captura de pago reportado (quién pagó, cuánto, referencia)
- Un pago inicia como REPORTED
- Confirmación solo al conciliar contra reporte financiero (subir CSV/PDF)
- Estados: REPORTED → CONFIRMED → APPLIED / CLARIFICATION / REJECTED / DUPLICATE
- Vista de pagos pendientes de confirmar
- Historial de pagos por unidad

## Fase 6: Egresos y autorizaciones

- Registro de egreso con categoría, proveedor, concepto, monto, fondo
- Flujo: REQUESTED → AUTHORIZED → PAID → VERIFIED → RECONCILED
- Una autorización requiere segundo usuario con rol TREASURER o ADMIN
- Subida de comprobante/evidencia

## Fase 7: Documentos y transparencia

- Publicación de documentos con visibilidad (PUBLIC, PRIVATE, RESTRICTED)
- Versiones y SHA256
- Listado público en /documentos (solo PUBLIC)
- Panel de administración de documentos

## Estándares

- TypeScript estricto en todos los archivos nuevos
- Diseño responsive móvil primero
- Auditoría en todas las operaciones de escritura (AuditLog)
- Pruebas unitarias para validaciones
- Pruebas de integración para flujos críticos
- Paginación en listados

## Entrega

1. Commits descriptivos (feat:, test:, docs:)
2. Sin commits a main — usar ramas de trabajo
3. Actualizar `docs/HANDOFF_CODEX.md` con el progreso
4. Reporte final con: rama, comandos, migraciones, deuda técnica, acciones pendientes
