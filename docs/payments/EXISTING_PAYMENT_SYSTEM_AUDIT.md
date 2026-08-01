# Auditoría — Sistema de Pagos Existente (Producción)

- **Fecha:** 2026-07-31
- **Rama:** `feature/portal-administracion-comunitaria-v1`
- **Regla:** Este sistema está en producción y se **protege**; no se reconstruye ni se altera su contrato público sin pruebas de regresión.

---

## 1. Estado operativo (verificado)

- `MERCADOPAGO_ENV=production` en Vercel (no en `.env.local`).
- `PAYMENTS_ENABLED=true`, `PAYMENTS_CUOTA_AMOUNT=100.00`, `PAYMENTS_MAX_EXTRAORDINARY=10000.00`.
- Webhook público operando. Órdenes de prueba limpiadas; quedan órdenes legítimas (incluida la piloto real `ORD01KYW6KG0WX6CHAAJDM6XM1KFF`).
- Smoke test 2026-07-31: `/pagos` → 200; `/api/pagos/concepts` → `enabled=true, cuota=100.00`.

---

## 2. Rutas públicas del sistema

| Ruta | Método | Función |
|---|---|---|
| `/pagos` | GET | Página pública de pago (selector tarjeta/SPEI) |
| `/api/pagos/concepts` | GET | Expone `enabled` + conceptos (cuota, máximo extraordinario) |
| `/api/pagos/create` | POST | Crea preferencia Checkout Pro (tarjeta) u orden SPEI |
| `/api/integrations/mercadopago/webhook` | POST | Procesa topics `payment` (tarjeta) y `order` (SPEI) |

## 3. Rutas administrativas de apoyo

| Ruta | Función |
|---|---|
| `/api/admin/integrations/mercadopago/status` | Estado de integración |
| `/api/admin/integrations/mercadopago/pilot-order` | Crear orden piloto |
| `/api/admin/integrations/mercadopago/test-spei-order` | Orden SPEI de prueba |
| `/api/admin/integrations/mercadopago/register-webhook` | Registrar webhook |
| `/api/admin/integrations/mercadopago/cleanup-stale` | Limpieza de órdenes obsoletas |
| `/api/admin/integrations/mercadopago/orders/[orderId]` | Detalle de orden |

## 4. Flujo de creación de pago (`/api/pagos/create`)

1. Valida `enabled` (config). Si no, 403.
2. Rate limit por IP: 20 peticiones / 10 min por clave `pagos:{ip}` vía `RateLimitEntry`. Si excede → 429.
3. Valida `payerName`, `payerEmail` (obligatorios), `building`, `apartment` (obligatorios). Si falta → 400.
4. Concepto:
   - `CUOTA` → monto fijo configurado (`PAYMENTS_CUOTA_AMOUNT`); `externalReference = CUOTA-{fecha}-{building}-{apartment}-{uuid8}`.
   - `EXTRAORDINARIO` → monto libre validado `0 < monto <= PAYMENTS_MAX_EXTRAORDINARY`; `externalReference = EXTRA-{fecha}-{building}-{apartment}-{uuid8}`.
5. Método:
   - `tarjeta` → `createCheckoutPreference()` (Checkout Pro). Devuelve `initPoint` (redirección segura a MP; el sitio nunca ve datos de tarjeta). Persiste `MercadoPagoOrder` `status=in_process`.
   - `spei` → `createSpeiOrder()`. Devuelve `paymentId`, `reference`, `ticketUrl`, `expiresAt`. Persiste orden.
6. El cliente consulta `externalReference` para ligar webhooks.

## 5. Webhook (`/api/integrations/mercadopago/webhook`)

- Valida firma con secreto (getWebhookSecret) y `x-request-id`.
- Topics: `payment` (tarjeta) y `order` (SPEI); liga por `external_reference`.
- Registra `MercadoPagoWebhookEvent` (signatureValid, duplicate, rawPayload, processed).
- Maneja idempotencia y duplicados.

## 6. Modelos de datos usados

- `MercadoPagoOrder` — orden con `orderId` único, `externalReference`, `status`, `amount`, `environment`, `isPilot`, `excludeFromCommunityBalance`, `feeConceptId`, `feeConceptName`, `payerName`, `payerEmail`, `building`, `apartment`, `rawResponse`.
- `MercadoPagoWebhookEvent` — eventos con `signatureValid`, `duplicate`, `processed`, `rawPayload`.
- `RateLimitEntry` — índice compuesto (`key`, `createdAt`).
- Referencias a catálogo: `Building`, `Unit`, `FeeConcept`, `Charge`, `Payment`.

## 7. Variables de entorno (todas en Vercel)

- `MERCADOPAGO_ENV`, `MERCADOPAGO_ACCESS_TOKEN_PROD`, `MERCADOPAGO_WEBHOOK_SECRET_PROD`
- `PAYMENTS_ENABLED`, `PAYMENTS_CUOTA_AMOUNT`, `PAYMENTS_MAX_EXTRAORDINARY`, `PAYMENTS_ALLOWED_EMAILS`
- `ADMIN_API_KEY` (protege endpoints admin de MP)

## 8. Pruebas de regresión obligatorias ante cualquier cambio

1. `/api/pagos/concepts` responde 200 con `enabled=true`.
2. `/api/pagos/create` rechaza 400 sin `payerName`/`payerEmail`/`building`/`apartment`.
3. `/api/pagos/create` rechaza concepto inválido con 400.
4. `/api/pagos/create` rechaza extraordinario `> max` con 400.
5. `/api/pagos/create` genera `initPoint` para `tarjeta` y `reference`/`ticketUrl` para `spei` (con mock de MP).
6. Rate limit: 21ª petición desde la misma IP → 429.
7. Webhook con firma inválida → rechazado; firma válida → procesa y liga por `external_reference`.
8. Smoke test producción: `/pagos` y rutas del punto 2 responden 200.

## 9. Riesgos y notas

- `isEmailAllowed()` (allowlist `PAYMENTS_ALLOWED_EMAILS`) está definido pero **no se aplica** en `pagos/create`; el control real es validación de `building`/`apartment`. Decisión consciente del turno anterior.
- La cobertura de pruebas del sistema de pagos es nula en el repo → se agregan tests de regresión (ver Fase A).
- `rawResponse` puede contener payloads grandes; se guarda como JSONB (vigilar tamaño).
- No se deben rotar/enviar secretos por chat; los cambios se prueban contra `test` antes de producción.
