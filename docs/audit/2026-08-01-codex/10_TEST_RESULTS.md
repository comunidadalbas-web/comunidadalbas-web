# Resultados de pruebas

| Prueba | Resultado | Evidencia |
|---|---|---|
| `pnpm install --frozen-lockfile` | APROBADA | lockfile actualizado: no; postinstall generate OK |
| `pnpm typecheck` | APROBADA | exit 0 |
| `pnpm test` inicial | APROBADA | 8 archivos, 77 pruebas |
| `pnpm test` final | APROBADA | 10 archivos, 90 pruebas |
| `prisma validate` | APROBADA | schema válido |
| `prisma generate` | APROBADA | client 7.9.0 |
| `pnpm build` | APROBADA | Next 16.2.11, rutas generadas |
| `pnpm format:check` | FALLIDA | 94 archivos |
| Webhook seguridad | APROBADA | 4 pruebas nuevas |
| Idempotencia pagos | APROBADA | 10 regresiones + aserciones nuevas |
| SMTP verify inicial | FALLIDA | EAUTH |
| SMTP verify alternativa | APROBADA | autenticación; sin envío |
| Migraciones | APROBADA | 2 aplicadas; esquema al día |
| Panel completo read-only | APROBADA | 15 módulos, escritorio/móvil |
| Panel E2E final | APROBADA | 11 navegación/visual + 3 mutaciones/prerrequisitos |
| Egresos/documentos mutación efímera | APROBADA | create/delete; base final sin residuos |
| Política de usuarios | APROBADA | 5 correos, alias rechazados, restricción DB |
| SMTP envío técnico | APROBADA | mensaje sin datos sensibles |
| Pago real | NO APLICABLE | prohibido por alcance |
