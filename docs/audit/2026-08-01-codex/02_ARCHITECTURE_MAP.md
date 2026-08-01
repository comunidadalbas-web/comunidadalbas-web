# Mapa de arquitectura

```text
Next.js 16 App Router
  -> páginas públicas y panel /admin
  -> Route Handlers /api
  -> sesión HMAC + cookie CSRF + RBAC
  -> Prisma 7 + adaptador Neon HTTP
  -> Neon PostgreSQL
  -> Mercado Pago Orders / Checkout Preferences
  -> webhook HMAC -> MercadoPagoWebhookEvent -> MercadoPagoOrder
  -> Nodemailer -> Zoho SMTP
```

Flujo financiero real actual:

```text
/pagos -> /api/pagos/create -> Mercado Pago
  -> MercadoPagoOrder
  -> webhook firmado
  -> consulta a Mercado Pago
  -> actualización de MercadoPagoOrder
  -X-> Payment / PaymentApplication / Charge / estado de cuenta
```

La interrupción final impide afirmar conciliación completa. La orden conserva edificio/departamento como texto, pero no una relación verificable con `Unit` o `Charge`.
