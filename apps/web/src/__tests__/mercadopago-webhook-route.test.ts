import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  eventCreate: vi.fn(),
  eventFindFirst: vi.fn(),
  eventUpdate: vi.fn(),
  orderFindFirst: vi.fn(),
  orderFindUnique: vi.fn(),
  processOrderNotification: vi.fn(),
  verifySignature: vi.fn(),
}));

vi.mock('@comunidad-albas/db', () => ({
  prisma: {
    mercadoPagoOrder: {
      findFirst: mocks.orderFindFirst,
      findUnique: mocks.orderFindUnique,
    },
    mercadoPagoWebhookEvent: {
      create: mocks.eventCreate,
      findFirst: mocks.eventFindFirst,
      update: mocks.eventUpdate,
    },
  },
}));

vi.mock('@/lib/mercadopago/webhook', () => ({
  processOrderNotification: mocks.processOrderNotification,
  verifySignature: mocks.verifySignature,
}));

const { POST } = await import('@/app/api/integrations/mercadopago/webhook/route');

function request(headers: Record<string, string> = {}) {
  return new NextRequest('https://comunidadalbas.com.mx/api/integrations/mercadopago/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({
      id: 'event-1',
      action: 'order.updated',
      type: 'order.updated',
      data: { id: 'ORDER-1' },
      live_mode: false,
      date_created: '2026-08-01T12:00:00Z',
      api_version: 'v1',
    }),
  });
}

describe('Webhook de Mercado Pago', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventCreate.mockResolvedValue({ id: 'event-db-1' });
    mocks.eventFindFirst.mockResolvedValue(null);
    mocks.eventUpdate.mockResolvedValue({});
    mocks.orderFindFirst.mockResolvedValue(null);
    mocks.orderFindUnique.mockResolvedValue(null);
    mocks.processOrderNotification.mockResolvedValue(undefined);
  });

  it('registra y rechaza una firma ausente sin procesar la notificación', async () => {
    const response = await POST(request({ 'x-request-id': 'request-1' }));

    expect(response.status).toBe(401);
    expect(mocks.eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: null,
          signatureError: 'Firma ausente',
          signatureValid: false,
        }),
      }),
    );
    expect(mocks.processOrderNotification).not.toHaveBeenCalled();
  });

  it('rechaza una firma inválida sin procesar la notificación', async () => {
    mocks.verifySignature.mockReturnValue(false);

    const response = await POST(
      request({ 'x-request-id': 'request-2', 'x-signature': 'ts=1,v1=invalid' }),
    );

    expect(response.status).toBe(401);
    expect(mocks.processOrderNotification).not.toHaveBeenCalled();
  });

  it('procesa una notificación con firma válida', async () => {
    mocks.verifySignature.mockReturnValue(true);
    mocks.orderFindUnique.mockResolvedValue({ orderId: 'ORDER-1' });

    const response = await POST(
      request({ 'x-request-id': 'request-3', 'x-signature': 'ts=1,v1=valid' }),
    );

    expect(response.status).toBe(200);
    expect(mocks.processOrderNotification).toHaveBeenCalledWith('ORDER-1', 'order.updated');
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 'event-db-1' },
      data: { processed: true, processResult: 'OK' },
    });
  });

  it('acepta un reintento duplicado válido sin procesarlo dos veces', async () => {
    mocks.verifySignature.mockReturnValue(true);
    mocks.eventFindFirst.mockResolvedValue({ id: 'event-db-original' });

    const response = await POST(
      request({ 'x-request-id': 'request-4', 'x-signature': 'ts=1,v1=valid' }),
    );

    expect(response.status).toBe(200);
    expect(mocks.eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ duplicate: true }) }),
    );
    expect(mocks.processOrderNotification).not.toHaveBeenCalled();
  });
});
