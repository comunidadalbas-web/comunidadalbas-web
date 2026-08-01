import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  rateLimitCount: vi.fn(),
  rateLimitCreate: vi.fn(),
  orderCreate: vi.fn(),
  checkoutPref: vi.fn(),
  speiOrder: vi.fn(),
}));

vi.mock('@comunidad-albas/db', () => ({
  prisma: {
    rateLimitEntry: {
      count: mocks.rateLimitCount,
      create: mocks.rateLimitCreate,
    },
    mercadoPagoOrder: {
      create: mocks.orderCreate,
    },
  },
}));

vi.mock('@/lib/mercadopago/orders', () => ({
  createCheckoutPreference: mocks.checkoutPref,
  createSpeiOrder: mocks.speiOrder,
}));

const { POST } = await import('@/app/api/pagos/create/route');

function makeRequest(body: unknown, ip = '203.0.113.10') {
  return new NextRequest('https://comunidadalbas.com.mx/api/pagos/create', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID = {
  payerName: 'María López',
  payerEmail: 'maria@example.com',
  concept: 'CUOTA',
  building: 'A',
  apartment: '101',
};

describe('Regresión /api/pagos/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MERCADOPAGO_ENV = 'production';
    process.env.PAYMENTS_ENABLED = 'true';
    process.env.PAYMENTS_CUOTA_AMOUNT = '100.00';
    process.env.PAYMENTS_MAX_EXTRAORDINARY = '10000.00';
    delete process.env.PAYMENTS_ALLOWED_EMAILS;
    mocks.rateLimitCount.mockResolvedValue(0);
    mocks.rateLimitCreate.mockResolvedValue({});
    mocks.orderCreate.mockResolvedValue({});
    mocks.checkoutPref.mockResolvedValue({
      success: true,
      idempotencyKey: 'idem-card-1',
      preferenceId: 'PREF_MOCK_1',
      initPoint: 'https://checkout.mercadopago.com/checkout/v1/pref/PREF_MOCK_1',
      externalReference: 'CUOTA-2026-07-31-A-101-abcdef12',
    });
    mocks.speiOrder.mockResolvedValue({
      success: true,
      idempotencyKey: 'idem-spei-1',
      orderId: 'ORD_MOCK_1',
      status: 'pending',
      paymentId: 'PAY_MOCK_1',
      reference: 'REF_MOCK_1',
      ticketUrl: 'https://payments.mercadopago.com/orders/ORD_MOCK_1',
    });
  });

  it('rechaza cuando pagos están deshabilitados', async () => {
    process.env.PAYMENTS_ENABLED = 'false';
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(403);
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  it('rechaza 400 sin nombre o correo', async () => {
    const res = await POST(makeRequest({ ...VALID, payerName: '', payerEmail: '' }));
    expect(res.status).toBe(400);
  });

  it('rechaza 400 sin edificio o departamento', async () => {
    const res = await POST(makeRequest({ ...VALID, building: '', apartment: '' }));
    expect(res.status).toBe(400);
  });

  it('rechaza 400 concepto inválido', async () => {
    const res = await POST(makeRequest({ ...VALID, concept: 'BASURA' }));
    expect(res.status).toBe(400);
  });

  it('rechaza 400 extraordinario mayor al máximo', async () => {
    const res = await POST(makeRequest({ ...VALID, concept: 'EXTRAORDINARIO', amount: '20000.00' }));
    expect(res.status).toBe(400);
  });

  it('rechaza 400 extraordinario no numérico o <= 0', async () => {
    const res = await POST(makeRequest({ ...VALID, concept: 'EXTRAORDINARIO', amount: 'abc' }));
    expect(res.status).toBe(400);
  });

  it('rechaza 429 por rate limit (21ª petición)', async () => {
    mocks.rateLimitCount.mockResolvedValue(20);
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(429);
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  it('genera initPoint para tarjeta (Checkout Pro)', async () => {
    const res = await POST(makeRequest({ ...VALID, metodo: 'tarjeta' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metodo).toBe('tarjeta');
    expect(body.initPoint).toContain('checkout.mercadopago.com');
    expect(body.amount).toBe('100.00');
    expect(body.externalReference).toMatch(/^CUOTA-/);
    expect(mocks.checkoutPref).toHaveBeenCalled();
    expect(mocks.orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          building: 'A',
          apartment: '101',
          idempotencyKey: 'idem-card-1',
          isPilot: false,
        }),
      }),
    );
  });

  it('genera orden SPEI con reference y ticketUrl', async () => {
    const res = await POST(makeRequest({ ...VALID, metodo: 'spei' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metodo).toBe('spei');
    expect(body.reference).toBe('REF_MOCK_1');
    expect(body.ticketUrl).toContain('ORD_MOCK_1');
    expect(mocks.speiOrder).toHaveBeenCalled();
    expect(mocks.orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ idempotencyKey: 'idem-spei-1' }),
      }),
    );
  });

  it('devuelve 502 si Mercado Pago falla', async () => {
    mocks.checkoutPref.mockResolvedValue({ success: false, error: 'MP caído' });
    const res = await POST(makeRequest({ ...VALID, metodo: 'tarjeta' }));
    expect(res.status).toBe(502);
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });
});
