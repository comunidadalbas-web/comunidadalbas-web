# Base de datos y Prisma

El esquema usa `Decimal(12,2)` para importes y restricciones únicas en cargos, aplicaciones y referencias de proveedor. Relaciones centrales: `Building -> Unit -> Charge -> PaymentApplication <- Payment`.

Estado Neon leído sin mutaciones:

- Building 0, Unit 0, Charge 0, Payment 0, Expense 0.
- FeeConcept 2.
- MercadoPagoOrder 7: 6 producción y 1 prueba según agrupación disponible.
- MercadoPagoWebhookEvent 23.

Inicialmente `prisma migrate status` informó que `0_init` no fue aplicada. Se comparó Neon directamente contra el esquema actual y el resultado fue una migración vacía. Se generó `20260801123000_schema_sync` desde el esquema histórico exacto, y ambas migraciones se marcaron como aplicadas mediante `migrate resolve`; no se ejecutó DDL, `db push` ni migración destructiva.

Estado final: dos migraciones registradas y `Database schema is up to date`. El script `audit:state` confirma 20 tablas públicas, un administrador activo y cero identificadores de webhook duplicados.
